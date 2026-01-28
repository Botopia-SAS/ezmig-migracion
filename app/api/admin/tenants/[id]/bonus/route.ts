import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { addBonusTokens } from '@/lib/tokens/service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const teamId = parseInt(id);

    const body = await request.json();
    const { amount, reason } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const transaction = await addBonusTokens({
      teamId,
      amount,
      description: reason || 'Admin bonus',
      adminUserId: user.id,
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error('Error adding bonus tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
