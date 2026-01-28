'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Coins, Zap, RefreshCw, Gift, ArrowDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { TransactionWithTeam } from './page';

const transactionIcons: Record<string, React.ElementType> = {
  purchase: Coins,
  consumption: Zap,
  auto_reload: RefreshCw,
  bonus: Gift,
  refund: ArrowDownRight,
};

const transactionBadgeVariants: Record<string, 'success' | 'secondary' | 'info' | 'purple' | 'orange'> = {
  purchase: 'success',
  consumption: 'secondary',
  auto_reload: 'info',
  bonus: 'purple',
  refund: 'orange',
};

const columns: ColumnDef<TransactionWithTeam>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const Icon = transactionIcons[type] || Coins;
      const variant = transactionBadgeVariants[type] || 'secondary';

      return (
        <div className="flex items-center gap-2">
          <Badge variant={variant} className="gap-1">
            <Icon className="h-3 w-3" />
            <span className="capitalize">{type.replace('_', ' ')}</span>
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'teamName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Team" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('teamName')}</span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.getValue('description') || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" className="justify-end" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue('amount') as number;
      return (
        <div className={`text-right font-medium ${amount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
          {amount > 0 ? '+' : ''}{amount}
        </div>
      );
    },
  },
  {
    accessorKey: 'balanceAfter',
    header: () => <div className="text-right">Balance</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground">
        {row.getValue('balanceAfter')}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" className="justify-end" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date;
      return (
        <div className="text-right text-muted-foreground">
          {new Date(date).toLocaleDateString()}
        </div>
      );
    },
  },
];

interface TransactionsTableProps {
  data: TransactionWithTeam[];
}

export function TransactionsTable({ data }: TransactionsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="teamName"
      searchPlaceholder="Search by team..."
      pageSize={15}
    />
  );
}
