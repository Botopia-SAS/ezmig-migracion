'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, Loader2, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  checkAvailability?: boolean; // Para emails de business que deben ser únicos
  description?: string;
}

interface ValidationResult {
  available?: boolean;
  email?: string;
  error?: string;
  isExistingUser?: boolean;
  userType?: string;
}

export function EmailInput({
  value,
  onChange,
  label = 'Email',
  placeholder = 'ejemplo@empresa.com',
  required = false,
  disabled = false,
  className,
  checkAvailability = false,
  description
}: EmailInputProps) {
  const [isValid, setIsValid] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Validación de formato básico
  const validateEmailFormat = (email: string) => {
    if (!email.trim()) {
      setIsValid(true);
      setShowValidation(false);
      return true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isFormatValid = emailRegex.test(email);
    setIsValid(isFormatValid);
    return isFormatValid;
  };

  // Debounced email availability check
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email.trim() || !validateEmailFormat(email) || !checkAvailability) {
      return;
    }

    setIsChecking(true);
    setShowValidation(false);

    try {
      // Debounce de 800ms
      await new Promise(resolve => setTimeout(resolve, 800));

      const response = await fetch(`/api/agencies/validate/email/${encodeURIComponent(email)}`);
      const result: ValidationResult = await response.json();

      setValidationResult(result);
      setShowValidation(true);
    } catch (error) {
      console.error('Error checking email availability:', error);
      // En caso de error, asumir que está disponible para no bloquear
      setValidationResult({
        available: true,
        email,
        error: 'No se pudo verificar la disponibilidad en este momento'
      });
      setShowValidation(true);
    } finally {
      setIsChecking(false);
    }
  }, [checkAvailability]);

  // Effect para validación en tiempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkEmailAvailability(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value, checkEmailAvailability]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.toLowerCase().trim();
    validateEmailFormat(inputValue);
    onChange(inputValue);
  };

  // Estado visual del input
  const getInputState = () => {
    if (!value || !isValid) return 'default';
    if (isChecking) return 'checking';
    if (!checkAvailability) return isValid ? 'valid' : 'invalid';
    if (validationResult?.available === false) return 'unavailable';
    if (validationResult?.available === true) return 'available';
    return 'default';
  };

  const inputState = getInputState();

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="email-input" className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      <div className="relative">
        <Input
          id="email-input"
          type="email"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pl-10 pr-10',
            inputState === 'checking' && 'border-blue-300 focus:border-blue-500 focus:ring-blue-200',
            inputState === 'invalid' && 'border-red-300 focus:border-red-500 focus:ring-red-200',
            inputState === 'unavailable' && 'border-amber-300 focus:border-amber-500 focus:ring-amber-200',
            inputState === 'available' && 'border-green-300 focus:border-green-500 focus:ring-green-200',
            inputState === 'valid' && 'border-green-300 focus:border-green-500 focus:ring-green-200'
          )}
        />

        {/* Icono de email */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Mail className="h-4 w-4 text-gray-400" />
        </div>

        {/* Indicador de estado */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {value && (
            <>
              {isChecking ? (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              ) : (
                <>
                  {inputState === 'invalid' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {inputState === 'unavailable' && (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  {(inputState === 'available' || inputState === 'valid') && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mensajes de validación */}
      {value && (
        <>
          {/* Error de formato */}
          {!isValid && (
            <div className="flex items-start space-x-2 text-xs text-red-600">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>
                Formato de email inválido. Debe incluir @ y un dominio válido.
              </p>
            </div>
          )}

          {/* Checking availability */}
          {isChecking && checkAvailability && isValid && (
            <div className="flex items-start space-x-2 text-xs text-blue-600">
              <Loader2 className="h-3 w-3 mt-0.5 animate-spin flex-shrink-0" />
              <p>Verificando disponibilidad del email...</p>
            </div>
          )}

          {/* Email no disponible */}
          {showValidation && validationResult && !validationResult.available && isValid && (
            <div className="flex items-start space-x-2 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">
                  Este email ya está en uso
                </p>
                {validationResult.isExistingUser && (
                  <p className="text-amber-700">
                    {validationResult.userType === 'agency'
                      ? 'Ya existe una agencia registrada con este email'
                      : 'Ya existe un usuario registrado con este email'
                    }
                  </p>
                )}
                <p className="text-gray-500 mt-1">
                  💡 Puedes usar este email si ya tienes una cuenta, o usar uno diferente para registrar una nueva agencia.
                </p>
              </div>
            </div>
          )}

          {/* Email disponible */}
          {showValidation && validationResult?.available && isValid && (
            <div className="flex items-start space-x-2 text-xs text-green-600">
              <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>✅ Email disponible para registro</p>
            </div>
          )}

          {/* Email válido (sin check de disponibilidad) */}
          {!checkAvailability && isValid && (
            <div className="flex items-start space-x-2 text-xs text-green-600">
              <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>Formato de email válido</p>
            </div>
          )}

          {/* Error al verificar */}
          {showValidation && validationResult?.error && (
            <div className="flex items-start space-x-2 text-xs text-gray-500">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>{validationResult.error}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}