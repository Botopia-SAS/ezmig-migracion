import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getFormTypes } from '@/lib/forms/service';

/**
 * GET /api/form-types
 * Get all active form types (USCIS forms catalog)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formTypes = await getFormTypes();

    // Return without the full schema for listing
    const simplified = formTypes.map((ft) => ({
      id: ft.id,
      code: ft.code,
      name: ft.name,
      description: ft.description,
      category: ft.category,
      tokenCost: ft.tokenCost,
      estimatedTimeMinutes: ft.estimatedTimeMinutes,
      uscisEdition: ft.uscisEdition,
    }));

    return NextResponse.json({ formTypes: simplified });
  } catch (error) {
    console.error('Error fetching form types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form types' },
      { status: 500 }
    );
  }
}
