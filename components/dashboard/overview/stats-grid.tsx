'use client';

import { Briefcase, Users, TrendingUp, UserCheck } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

interface StatsGridProps {
  totalCases: number;
  activeCases: number;
  totalClients: number;
  clientsWithCases: number;
  t: (key: string) => string;
}

export function OverviewStatsGrid({
  totalCases,
  activeCases,
  totalClients,
  clientsWithCases,
  t,
}: StatsGridProps) {
  const stats = [
    {
      label: t('stats.totalCases'),
      value: totalCases,
      icon: <Briefcase className="h-5 w-5 text-violet-600" />,
      iconBgColor: 'bg-violet-100',
    },
    {
      label: t('stats.activeCases'),
      value: activeCases,
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
      iconBgColor: 'bg-blue-100',
    },
    {
      label: t('stats.totalClients'),
      value: totalClients,
      icon: <Users className="h-5 w-5 text-green-600" />,
      iconBgColor: 'bg-green-100',
    },
    {
      label: t('stats.clientsWithCases'),
      value: clientsWithCases,
      icon: <UserCheck className="h-5 w-5 text-orange-600" />,
      iconBgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
