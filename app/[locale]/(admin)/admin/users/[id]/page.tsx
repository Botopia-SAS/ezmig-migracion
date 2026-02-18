'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  UserCircle,
  Mail,
  Building,
  Calendar,
  Shield,
  Activity,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { use } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserDetails {
  user: {
    id: number;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  team: {
    id: number;
    name: string;
    type: string;
    role: string;
  } | null;
  activityLogs: Array<{
    id: number;
    action: string;
    ipAddress: string | null;
    createdAt: string;
  }>;
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'attorney':
      return 'default';
    case 'staff':
      return 'secondary';
    case 'end_user':
      return 'outline';
    default:
      return 'secondary';
  }
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function formatShortDate(dateStr: string) {
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    SIGN_UP: 'Registro',
    SIGN_IN: 'Inicio de sesión',
    SIGN_OUT: 'Cierre de sesión',
    UPDATE_PASSWORD: 'Cambio de contraseña',
    DELETE_ACCOUNT: 'Eliminación de cuenta',
    UPDATE_ACCOUNT: 'Actualización de cuenta',
    CREATE_TEAM: 'Creación de equipo',
    REMOVE_TEAM_MEMBER: 'Eliminación de miembro',
    INVITE_TEAM_MEMBER: 'Invitación de miembro',
    ACCEPT_INVITATION: 'Aceptación de invitación',
  };
  return labels[action] || action.replace(/_/g, ' ');
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { data, isLoading, error } = useSWR<UserDetails>(
    `/api/admin/users/${resolvedParams.id}`,
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
        <p className="text-gray-600">No se pudo cargar los detalles del usuario</p>
        <Link href="/admin/users">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Usuarios
          </Button>
        </Link>
      </div>
    );
  }

  const { user, team, activityLogs } = data;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {user.name || 'Sin nombre'}
            </h1>
            <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
              {user.role.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Información del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Rol Global
                  </p>
                  <p className="font-medium capitalize">{user.role.replace('_', ' ')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Fecha de Registro
                  </p>
                  <p className="font-medium">{formatShortDate(user.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Última Actualización
                  </p>
                  <p className="font-medium">{formatShortDate(user.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Equipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {team ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-lg">{team.name}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {team.type?.replace('_', ' ') || 'Sin tipo'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="capitalize">
                      {team.role}
                    </Badge>
                    <Link href={`/admin/tenants/${team.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Tenant
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Este usuario no pertenece a ningún equipo</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Historial de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay actividad registrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border-b last:border-b-0"
                    >
                      <div>
                        <p className="font-medium">{getActionLabel(log.action)}</p>
                        {log.ipAddress && (
                          <p className="text-xs text-gray-400">IP: {log.ipAddress}</p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-violet-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-violet-600">{activityLogs.length}</p>
                <p className="text-sm text-gray-500">Acciones registradas</p>
              </div>
              {team && (
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm font-medium text-blue-600 capitalize">{team.role}</p>
                  <p className="text-sm text-gray-500">Rol en el equipo</p>
                </div>
              )}
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm font-medium text-gray-900">
                  {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} días
                </p>
                <p className="text-sm text-gray-500">Desde el registro</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
