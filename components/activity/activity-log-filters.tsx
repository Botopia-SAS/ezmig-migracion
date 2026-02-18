'use client';

import { useState } from 'react';
import { Search, Filter, Calendar, User, Activity, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { ActivityLogFilters as Filters, EntityType } from '@/lib/activity/types';
import { ActivityType } from '@/lib/db/schema';

interface ActivityLogFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  users?: { id: number; name: string | null; email: string }[];
}

const actionOptions: { value: ActivityType; label: string }[] = [
  { value: ActivityType.CREATE_CLIENT, label: 'Create Client' },
  { value: ActivityType.UPDATE_CLIENT, label: 'Update Client' },
  { value: ActivityType.DELETE_CLIENT, label: 'Delete Client' },
  { value: ActivityType.CREATE_CASE, label: 'Create Case' },
  { value: ActivityType.UPDATE_CASE, label: 'Update Case' },
  { value: ActivityType.DELETE_CASE, label: 'Delete Case' },
  { value: ActivityType.ASSIGN_CASE, label: 'Assign Case' },
  { value: ActivityType.START_FORM, label: 'Start Form' },
  { value: ActivityType.UPDATE_FORM, label: 'Update Form' },
  { value: ActivityType.SUBMIT_FORM, label: 'Submit Form' },
  { value: ActivityType.CREATE_REFERRAL_LINK, label: 'Create Referral' },
  { value: ActivityType.SIGN_IN, label: 'Sign In' },
];

const entityTypeOptions: { value: EntityType; label: string }[] = [
  { value: 'client', label: 'Clients' },
  { value: 'case', label: 'Cases' },
  { value: 'form', label: 'Forms' },
  { value: 'referral', label: 'Referrals' },
  { value: 'user', label: 'Users' },
];

export function ActivityLogFilters({
  filters,
  onFiltersChange,
  users = [],
}: ActivityLogFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchInput || undefined });
  };

  const clearFilter = (key: keyof Filters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    onFiltersChange({});
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search and primary filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activity..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        {/* User filter */}
        <Select
          value={filters.userId?.toString() || '__all__'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              userId: value && value !== '__all__' ? parseInt(value, 10) : undefined,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action filter */}
        <Select
          value={filters.action || '__all__'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              action: value && value !== '__all__' ? (value as ActivityType) : undefined,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All actions</SelectItem>
            {actionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Entity type filter */}
        <Select
          value={filters.entityType || '__all__'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              entityType: value && value !== '__all__' ? (value as EntityType) : undefined,
            })
          }
        >
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All types</SelectItem>
            {entityTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range inputs */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              className="pl-9 w-[150px]"
              value={filters.startDate?.toISOString().split('T')[0] || ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  startDate: e.target.value ? new Date(e.target.value) : undefined,
                })
              }
            />
          </div>
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            className="w-[150px]"
            value={filters.endDate?.toISOString().split('T')[0] || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                endDate: e.target.value ? new Date(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setSearchInput('');
                  clearFilter('search');
                }}
              />
            </Badge>
          )}

          {filters.userId && (
            <Badge variant="secondary" className="gap-1">
              User: {users.find((u) => u.id === filters.userId)?.name || filters.userId}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('userId')} />
            </Badge>
          )}

          {filters.action && (
            <Badge variant="secondary" className="gap-1">
              Action: {actionOptions.find((a) => a.value === filters.action)?.label || filters.action}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('action')} />
            </Badge>
          )}

          {filters.entityType && (
            <Badge variant="secondary" className="gap-1">
              Type: {entityTypeOptions.find((e) => e.value === filters.entityType)?.label || filters.entityType}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('entityType')} />
            </Badge>
          )}

          {(filters.startDate || filters.endDate) && (
            <Badge variant="secondary" className="gap-1">
              Date: {filters.startDate && format(filters.startDate, 'MMM d')}
              {filters.endDate && ` - ${format(filters.endDate, 'MMM d')}`}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  clearFilter('startDate');
                  clearFilter('endDate');
                }}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
