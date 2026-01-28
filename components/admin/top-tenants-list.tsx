'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';

interface TopTenant {
  id: number;
  name: string;
  tokensUsed: number;
  balance: number;
  transactionCount: number;
}

interface TopTenantsListProps {
  tenants: TopTenant[];
}

export function TopTenantsList({ tenants }: TopTenantsListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Top Accounts</CardTitle>
        <Link
          href="/admin/tenants"
          className="text-sm text-violet-500 hover:text-violet-600 flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {tenants.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No tenants yet
          </p>
        ) : (
          <div className="space-y-0">
            {tenants.map((tenant, idx) => (
              <div
                key={tenant.id}
                className="flex items-center gap-4 py-3 border-b last:border-b-0"
              >
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-violet-600">
                    #{idx + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {tenant.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tenant.tokensUsed} tokens used
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {tenant.transactionCount}
                  </p>
                  <p className="text-xs text-gray-500">transactions</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
