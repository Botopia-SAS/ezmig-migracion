'use client';

import { Briefcase, Users, TrendingUp, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsGridProps {
  totalCases: number;
  activeCases: number;
  totalClients: number;
  clientsWithCases: number;
  t: (key: string) => string;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
}

function StatCard({ title, value, icon, colorClass }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClass}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
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
      title: t('stats.totalCases'),
      value: totalCases,
      icon: <Briefcase className="h-5 w-5 text-violet-600" />,
      colorClass: 'bg-violet-100',
    },
    {
      title: t('stats.activeCases'),
      value: activeCases,
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
      colorClass: 'bg-blue-100',
    },
    {
      title: t('stats.totalClients'),
      value: totalClients,
      icon: <Users className="h-5 w-5 text-green-600" />,
      colorClass: 'bg-green-100',
    },
    {
      title: t('stats.clientsWithCases'),
      value: clientsWithCases,
      icon: <UserCheck className="h-5 w-5 text-orange-600" />,
      colorClass: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
