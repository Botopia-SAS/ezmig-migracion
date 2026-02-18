import { NextRequest } from 'next/server';
import { withStaffOrOwner } from '@/lib/api/middleware';
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  handleRouteError,
} from '@/lib/api/response';
import { db } from '@/lib/db/drizzle';
import { caseForms, formTypes, cases, teamMembers, formFieldAutosaves } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { mergeAutosavedFields } from '@/lib/forms/service';
import { SignJWT } from 'jose';

export const POST = withStaffOrOwner(async (req: NextRequest, ctx) => {
  try {
    const body = await req.json();
    const { caseFormId } = body;

    if (!caseFormId || isNaN(Number(caseFormId))) {
      return badRequestResponse('Invalid caseFormId');
    }

    // Load case form + schema (same pattern as the existing e-filing stream route)
    const [result] = await db
      .select({
        caseForm: caseForms,
        formType: formTypes,
        case_: cases,
      })
      .from(caseForms)
      .innerJoin(formTypes, eq(caseForms.formTypeId, formTypes.id))
      .innerJoin(cases, eq(caseForms.caseId, cases.id))
      .where(
        and(eq(caseForms.id, Number(caseFormId)), eq(cases.teamId, ctx.teamId))
      );

    if (!result) {
      return notFoundResponse('Case form');
    }

    // Get autosaved fields and merge them
    const autosaveRows = await db
      .select({
        fieldPath: formFieldAutosaves.fieldPath,
        fieldValue: formFieldAutosaves.fieldValue,
      })
      .from(formFieldAutosaves)
      .where(eq(formFieldAutosaves.caseFormId, Number(caseFormId)));

    const autosaved: Record<string, string | null> = {};
    for (const row of autosaveRows) {
      autosaved[row.fieldPath] = row.fieldValue;
    }

    const baseData =
      (result.caseForm.formData as Record<string, unknown>) ?? {};
    const mergedData = mergeAutosavedFields(baseData, autosaved);

    // Generate a short-lived token for the extension (30 min)
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || 'fallback-secret-for-development'
    );
    const sessionToken = await new SignJWT({
      userId: ctx.user.id,
      teamId: ctx.teamId,
      purpose: 'e-filing-extension',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30m')
      .sign(secret);

    return successResponse({
      caseFormId: Number(caseFormId),
      formCode: result.formType.code,
      formSchema: result.formType.formSchema,
      formData: mergedData,
      sessionToken,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to prepare e-filing data');
  }
});
