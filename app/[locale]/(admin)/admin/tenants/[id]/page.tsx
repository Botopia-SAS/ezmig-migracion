'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Building,
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { use } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TenantDetails {
  team: {
    id: number;
    name: string;
    type: string;
    planName: string | null;
    subscriptionStatus: string | null;
    createdAt: string;
  };
  members: Array<{
    id: number;
    role: string;
    user: {
      id: number;
      email: string;
      name: string | null;
    };
  }>;
}

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { data, isLoading, error } = useSWR<TenantDetails>(
    `/api/admin/tenants/${resolvedParams.id}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p className="text-gray-600">Failed to load tenant details</p>
        <Link href="/admin/tenants">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
        </Link>
      </div>
    );
  }

  const { team, members } = data;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/tenants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          <p className="text-sm text-gray-500 capitalize">{team.type?.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Plan</p>
                  <p className="text-2xl font-bold text-violet-600">{team.planName || 'Free'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Members</p>
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subscription</p>
                  <p className="font-medium">
                    {team.subscriptionStatus ? (
                      <Badge variant={team.subscriptionStatus === 'active' ? 'success' : 'secondary'}>
                        {team.subscriptionStatus}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">
                    {new Date(team.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{member.user.name || member.user.email}</p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
