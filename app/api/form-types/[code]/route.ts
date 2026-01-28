import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getFormTypeByCode } from '@/lib/forms/service';

/**
 * GET /api/form-types/[code]
 * Get a specific form type with its full schema
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formType = await getFormTypeByCode(code);

    if (!formType) {
      return NextResponse.json({ error: 'Form type not found' }, { status: 404 });
    }

    return NextResponse.json(formType);
  } catch (error) {
    console.error('Error fetching form type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form type' },
      { status: 500 }
    );
  }
}
