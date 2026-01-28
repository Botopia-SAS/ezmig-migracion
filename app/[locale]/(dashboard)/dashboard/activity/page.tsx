import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  Coins,
  Zap,
  RefreshCw,
  Users,
  Briefcase,
  FileText,
  Upload,
  Trash2,
  Link,
  FileCheck,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';
import { getTranslations } from 'next-intl/server';

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
  [ActivityType.PURCHASE_TOKENS]: Coins,
  [ActivityType.CONSUME_TOKEN]: Zap,
  [ActivityType.AUTO_RELOAD_TOKENS]: RefreshCw,
  [ActivityType.UPDATE_AUTO_RELOAD]: Settings,
  // M2-M4 activity types
  [ActivityType.CREATE_CLIENT]: Users,
  [ActivityType.UPDATE_CLIENT]: Users,
  [ActivityType.DELETE_CLIENT]: UserMinus,
  [ActivityType.CREATE_CASE]: Briefcase,
  [ActivityType.UPDATE_CASE]: Briefcase,
  [ActivityType.DELETE_CASE]: Trash2,
  [ActivityType.ASSIGN_CASE]: Users,
  [ActivityType.ADD_FORM_TO_CASE]: FileText,
  [ActivityType.REMOVE_FORM_FROM_CASE]: Trash2,
  [ActivityType.START_FORM]: FileText,
  [ActivityType.UPDATE_FORM]: FileText,
  [ActivityType.COMPLETE_FORM]: FileCheck,
  [ActivityType.SUBMIT_FORM]: FileCheck,
  [ActivityType.UPLOAD_EVIDENCE]: Upload,
  [ActivityType.VALIDATE_EVIDENCE]: CheckCircle,
  [ActivityType.DELETE_EVIDENCE]: Trash2,
  [ActivityType.CREATE_REFERRAL_LINK]: Link,
  [ActivityType.USE_REFERRAL_LINK]: Link,
  [ActivityType.GENERATE_PDF]: FileText,
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export default async function ActivityPage() {
  const t = await getTranslations('dashboard.activity');
  const logs = await getActivityLogs();

  const formatAction = (action: ActivityType): string => {
    const actionKey = action as keyof typeof ActivityType;
    return t(`actions.${actionKey}`) || action;
  };

  return (
    <section className="flex-1">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        {t('title')}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <ul className="space-y-4">
              {logs.map((log) => {
                const Icon = iconMap[log.action as ActivityType] || Settings;
                const formattedAction = formatAction(log.action as ActivityType);

                return (
                  <li key={log.id} className="flex items-center space-x-4">
                    <div className="bg-violet-100 rounded-full p-2">
                      <Icon className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formattedAction}
                        {log.ipAddress && ` from IP ${log.ipAddress}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(new Date(log.timestamp))}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-violet-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('noActivity')}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                {t('description')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
