import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getSystemAlerts } from '@/lib/tokens/service';

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const alerts = await getSystemAlerts();
  const totalCount =
    alerts.critical.reduce((sum, a) => sum + a.count, 0) +
    alerts.warnings.reduce((sum, a) => sum + a.count, 0);

  return NextResponse.json({
    alerts,
    totalCount,
    hasAlerts: totalCount > 0,
  });
}
