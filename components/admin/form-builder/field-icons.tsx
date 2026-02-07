import {
  Type,
  AlignLeft,
  Calendar,
  ChevronDown,
  CircleDot,
  Square,
  CheckSquare,
  Phone,
  Mail,
  Hash,
  Shield,
  CreditCard,
  MapPin,
} from 'lucide-react';
import type { FormField } from '@/lib/forms/service';

export const FIELD_TYPE_ICON: Record<FormField['type'], React.ComponentType<{ className?: string }>> = {
  text: Type,
  textarea: AlignLeft,
  date: Calendar,
  select: ChevronDown,
  radio: CircleDot,
  checkbox: Square,
  checkbox_group: CheckSquare,
  phone: Phone,
  email: Mail,
  number: Hash,
  address: MapPin,
  ssn: Shield,
  alien_number: CreditCard,
};

// Field types grouped by category for the picker
export const FIELD_TYPE_GROUPS = [
  {
    category: 'text' as const,
    types: ['text', 'textarea'] as FormField['type'][],
  },
  {
    category: 'choice' as const,
    types: ['radio', 'checkbox', 'select', 'checkbox_group'] as FormField['type'][],
  },
  {
    category: 'special' as const,
    types: ['date', 'phone', 'email', 'number', 'ssn', 'alien_number'] as FormField['type'][],
  },
];
