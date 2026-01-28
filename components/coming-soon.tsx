'use client';

import { Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export function ComingSoon({
  title = 'Coming Soon',
  description = 'This feature is under development and will be available shortly.'
}: ComingSoonProps) {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <Card className="max-w-lg mx-auto mt-12">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-violet-100 rounded-full p-4 mb-6">
            <Construction className="h-10 w-10 text-violet-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-gray-500 max-w-sm">
            {description}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
