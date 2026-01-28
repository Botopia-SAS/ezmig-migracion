'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Country codes - For USCIS, primarily US numbers are used
// Can expand this list if needed for international support
const COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  // Add more countries here if needed in the future
  // { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  // { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
] as const;

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onCountryChange?: (countryCode: string) => void;
  defaultCountryCode?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * Format phone number as (XXX) XXX-XXXX for US format
 */
function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');

  // Limit to 10 digits for US numbers
  const limited = numbers.slice(0, 10);

  // Format based on length
  if (limited.length === 0) {
    return '';
  } else if (limited.length <= 3) {
    return `(${limited}`;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
}

/**
 * Extract raw numbers from formatted phone
 */
function extractNumbers(value: string): string {
  return value.replace(/\D/g, '');
}

export function PhoneInput({
  value,
  onChange,
  onCountryChange,
  defaultCountryCode = '+1',
  name,
  id,
  placeholder = '(555) 123-4567',
  disabled = false,
  required = false,
  className,
}: PhoneInputProps) {
  const [countryCode, setCountryCode] = React.useState(defaultCountryCode);
  const [phoneValue, setPhoneValue] = React.useState(() => {
    if (value) {
      // If value starts with country code, extract just the number part
      const withoutCode = value.replace(/^\+\d+\s*/, '');
      return formatPhoneNumber(withoutCode);
    }
    return '';
  });

  // Hidden input for form submission with full formatted value
  const fullValue = phoneValue ? `${countryCode} ${phoneValue}` : '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numbers = extractNumbers(input);
    const formatted = formatPhoneNumber(numbers);

    setPhoneValue(formatted);

    if (onChange) {
      // Return full value with country code
      onChange(formatted ? `${countryCode} ${formatted}` : '');
    }
  };

  const handleCountryChange = (newCode: string) => {
    setCountryCode(newCode);
    if (onCountryChange) {
      onCountryChange(newCode);
    }
    if (onChange && phoneValue) {
      onChange(`${newCode} ${phoneValue}`);
    }
  };

  // Handle paste - extract only numbers
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const numbers = extractNumbers(pastedText);
    const formatted = formatPhoneNumber(numbers);
    setPhoneValue(formatted);

    if (onChange) {
      onChange(formatted ? `${countryCode} ${formatted}` : '');
    }
  };

  // Handle keydown - only allow numbers and control keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    // Allow control combinations (Ctrl+A, Ctrl+C, Ctrl+V, etc.)
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // Allow special keys
    if (allowedKeys.includes(e.key)) {
      return;
    }

    // Only allow numeric keys
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={cn('flex gap-2', className)}>
      {/* Country Code Dropdown */}
      <Select
        value={countryCode}
        onValueChange={handleCountryChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[100px] shrink-0">
          <SelectValue>
            {COUNTRY_CODES.find(c => c.code === countryCode)?.flag} {countryCode}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.code}</span>
                <span className="text-gray-500 text-xs">({country.country})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Phone Number Input */}
      <input
        type="tel"
        id={id}
        value={phoneValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
        autoComplete="tel-national"
      />

      {/* Hidden input for form submission */}
      {name && (
        <input type="hidden" name={name} value={fullValue} />
      )}
    </div>
  );
}

export { COUNTRY_CODES };
