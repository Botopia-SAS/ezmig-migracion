'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/agencies/utils';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (formattedValue: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  label = 'Teléfono',
  placeholder = '(123) 456-7890',
  required = false,
  disabled = false,
  className
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(value || '');
  const [isValid, setIsValid] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  // Validar número de teléfono
  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');

    if (!phone.trim()) {
      setIsValid(true);
      setShowWarning(false);
      return;
    }

    if (numbers.length < 10) {
      setIsValid(false);
      setShowWarning(true);
    } else if (numbers.length === 10 || (numbers.length === 11 && numbers[0] === '1')) {
      setIsValid(true);
      setShowWarning(false);
    } else {
      setIsValid(false);
      setShowWarning(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Solo permitir números, espacios, guiones, paréntesis
    const cleaned = inputValue.replace(/[^\d\s\-\(\)]/g, '');

    // Formatear automáticamente (sin debounce - inmediato)
    const formatted = formatPhoneNumber(cleaned);

    setDisplayValue(formatted);
    validatePhone(formatted);
    onChange(formatted);
  };

  // Actualizar valor interno cuando cambie la prop value
  useEffect(() => {
    if (value !== displayValue) {
      setDisplayValue(value || '');
      validatePhone(value || '');
    }
  }, [value]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="phone-input" className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          id="phone-input"
          type="tel"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pr-10',
            showWarning && 'border-amber-300 focus:border-amber-500 focus:ring-amber-200',
            isValid && displayValue && 'border-green-300 focus:border-green-500 focus:ring-green-200'
          )}
        />

        {/* Indicador de estado */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {displayValue && (
            <>
              {isValid ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Mensaje de advertencia amigable */}
      {showWarning && displayValue && (
        <div className="flex items-start space-x-2 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <p>
            Debe tener 10 dígitos para número USA.{' '}
            <span className="text-gray-500">
              Formato automático: (123) 456-7890
            </span>
          </p>
        </div>
      )}

      {/* Mensaje de confirmación */}
      {isValid && displayValue && !showWarning && (
        <div className="flex items-start space-x-2 text-xs text-green-600">
          <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <p>Formato de teléfono válido</p>
        </div>
      )}
    </div>
  );
}