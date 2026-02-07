'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatWidget } from './chat-widget';

interface FormAssistantProps {
  formContext?: any;
  formData?: any;
  className?: string;
}

export function FormAssistant({ formContext, formData, className }: FormAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Usar el ChatWidget existente pero con diseño mejorado
  return (
    <ChatWidget
      formContext={{...formContext, ...formData}}
      className={className}
    />
  );
}