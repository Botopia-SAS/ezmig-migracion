// API route to update I-130 schema with evidence settings
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { formTypes } from '@/lib/db/schema';
import { I130_SCHEMA } from '@/lib/db/schemas/i-130';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    console.log('🔄 Updating I-130 schema with evidence settings...');

    const result = await db
      .update(formTypes)
      .set({
        formSchema: I130_SCHEMA,
        updatedAt: new Date(),
      })
      .where(eq(formTypes.code, 'I-130'))
      .returning();

    if (result.length > 0) {
      // Count evidence-enabled fields
      let evidenceCount = 0;
      function countEvidence(obj: any): void {
        if (Array.isArray(obj)) {
          obj.forEach(item => countEvidence(item));
        } else if (obj && typeof obj === 'object') {
          if (obj.allowEvidences === true) evidenceCount++;
          Object.values(obj).forEach(val => countEvidence(val));
        }
      }
      countEvidence(I130_SCHEMA);

      console.log(`✅ Updated I-130 schema with ${evidenceCount} evidence-enabled fields`);

      return NextResponse.json({
        success: true,
        message: `I-130 schema updated successfully with ${evidenceCount} evidence-enabled fields`,
        formType: result[0].code,
        evidenceFieldsCount: evidenceCount
      });
    } else {
      return NextResponse.json({ error: 'I-130 form type not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('❌ Error updating I-130 schema:', error);
    return NextResponse.json({
      error: 'Failed to update schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}