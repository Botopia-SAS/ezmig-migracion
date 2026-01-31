'use client';

import Link from 'next/link';
import { Calendar, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Deadline {
  id: number;
  caseNumber: string;
  clientName: string | null;
  caseType: string;
  filingDeadline: string;
  daysRemaining: number;
}

interface UpcomingDeadlinesListProps {
  deadlines: Deadline[];
  t: (key: string) => string;
  tType: (key: string) => string;
}

function getUrgencyIndicator(days: number) {
  if (days < 0) {
    return {
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      badgeClass: 'bg-red-100 text-red-700',
      label: 'Overdue',
    };
  }
  if (days === 0) {
    return {
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      badgeClass: 'bg-red-100 text-red-700',
      label: 'Today',
    };
  }
  if (days <= 7) {
    return {
      icon: <Clock className="h-4 w-4 text-orange-600" />,
      badgeClass: 'bg-orange-100 text-orange-700',
      label: `${days} days`,
    };
  }
  if (days <= 14) {
    return {
      icon: <Clock className="h-4 w-4 text-yellow-600" />,
      badgeClass: 'bg-yellow-100 text-yellow-700',
      label: `${days} days`,
    };
  }
  return {
    icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    badgeClass: 'bg-green-100 text-green-700',
    label: `${days} days`,
  };
}

export function UpcomingDeadlinesList({
  deadlines,
  t,
  tType,
}: UpcomingDeadlinesListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-violet-600" />
          <div>
            <CardTitle>{t('deadlines.title')}</CardTitle>
            <CardDescription>{t('deadlines.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
            <p>{t('deadlines.noDeadlines')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deadlines.slice(0, 10).map((deadline) => {
              const urgency = getUrgencyIndicator(deadline.daysRemaining);
              return (
                <Link
                  key={deadline.id}
                  href={`/dashboard/cases/${deadline.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:border-violet-300 hover:bg-violet-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {urgency.icon}
                      <div>
                        <p className="font-medium text-sm">
                          {deadline.caseNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {deadline.clientName || 'No client'} •{' '}
                          {tType(deadline.caseType)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(deadline.filingDeadline)}
                      </span>
                      <Badge className={urgency.badgeClass}>
                        {deadline.daysRemaining < 0
                          ? t('deadlines.overdue')
                          : deadline.daysRemaining === 0
                            ? t('deadlines.today')
                            : `${deadline.daysRemaining} ${t('deadlines.daysRemaining').replace('{days}', '')}`}
                      </Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
