'use client';

import { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { useRole } from '@/lib/auth/role-context';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BalanceResponse {
  balance: number;
  teamId: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getBalanceColor(balance: number): string {
  if (balance < 5) return 'bg-red-100 text-red-700 hover:bg-red-200';
  if (balance < 10) return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
  return 'bg-green-100 text-green-700 hover:bg-green-200';
}

function getTooltipText(balance: number): string {
  if (balance < 5) return 'Low balance - Buy more tokens';
  if (balance < 10) return 'Balance running low';
  return 'Token balance';
}

export function TokenBalanceBadge() {
  const { canViewBilling, isLoading: roleLoading } = useRole();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading: balanceLoading } = useSWR<BalanceResponse>(
    canViewBilling ? '/api/tokens/balance' : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  // Don't render anything until client-side mounted and role is loaded
  if (!mounted || roleLoading) {
    return null;
  }

  // Only show for users who can view billing (owner and staff)
  if (!canViewBilling) {
    return null;
  }

  // Loading state
  if (balanceLoading || !data) {
    return <Skeleton className="h-7 w-20 rounded-full" />;
  }

  const balance = data.balance ?? 0;
  const colorClass = getBalanceColor(balance);
  const tooltipText = getTooltipText(balance);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/dashboard/billing/packages"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors ${colorClass}`}
          >
            <Coins className="h-4 w-4" />
            <span>{balance.toLocaleString()}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
