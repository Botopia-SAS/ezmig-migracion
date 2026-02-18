import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { caseForms, formTypes, cases, teamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { SSEEmitter } from '@/lib/e-filing/sse-emitter';
import { runEFilingBot } from '@/lib/e-filing/bot';
import type { FormSchema } from '@/lib/forms/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 600; // 10 minutes

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth ──
  const user = await getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // ── Resolve team membership ──
  const [membership] = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  if (!membership) {
    return new Response('Forbidden', { status: 403 });
  }

  // ── Load case form + schema ──
  const { id } = await params;
  const caseFormId = parseInt(id, 10);
  if (isNaN(caseFormId)) {
    return new Response('Invalid case form ID', { status: 400 });
  }

  const [result] = await db
    .select({
      caseForm: caseForms,
      formType: formTypes,
      case_: cases,
    })
    .from(caseForms)
    .innerJoin(formTypes, eq(caseForms.formTypeId, formTypes.id))
    .innerJoin(cases, eq(caseForms.caseId, cases.id))
    .where(and(eq(caseForms.id, caseFormId), eq(cases.teamId, membership.teamId)));

  if (!result) {
    return new Response('Case form not found', { status: 404 });
  }

  // ── Parse optional credentials from body ──
  let credentials: { email: string; password: string } | undefined;
  try {
    const body = await request.json();
    if (body.email && body.password) {
      credentials = { email: body.email, password: body.password };
    }
  } catch {
    // No body or invalid JSON — fine, no credentials
  }

  // ── Build bot config ──
  const config = {
    caseFormId,
    formCode: result.formType.code,
    formData: (result.caseForm.formData as Record<string, unknown>) ?? {},
    formSchema: result.formType.formSchema as unknown as FormSchema,
    credentials,
  };

  // ── Create SSE emitter and launch bot ──
  const emitter = new SSEEmitter();

  // Fire-and-forget — the bot pushes events to the emitter stream
  runEFilingBot(config, emitter).catch((error) => {
    emitter.emit({
      type: 'error',
      step: 'done',
      code: 'BOT_CRASH',
      message: error instanceof Error ? error.message : 'Bot crashed unexpectedly',
      recoverable: false,
    });
    emitter.close();
  });

  return new Response(emitter.stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
    },
  });
}
