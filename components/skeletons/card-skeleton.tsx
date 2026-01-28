import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}

export function BalanceCardSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-violet-500 to-indigo-600">
      <CardHeader>
        <Skeleton className="h-5 w-32 bg-violet-400/50" />
        <Skeleton className="h-4 w-48 bg-violet-400/50" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-12 w-24 bg-violet-400/50" />
        <Skeleton className="h-4 w-36 mt-2 bg-violet-400/50" />
      </CardContent>
    </Card>
  );
}
