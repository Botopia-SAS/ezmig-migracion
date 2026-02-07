'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DisclaimerCheckboxProps {
  value: boolean;
  onChange: (checked: boolean) => void;
  agencyType: 'law_firm' | 'immigration_services' | null;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DisclaimerCheckbox({
  value,
  onChange,
  agencyType,
  required = true,
  disabled = false,
  className
}: DisclaimerCheckboxProps) {
  const [showFullText, setShowFullText] = useState(false);

  // Diferentes disclaimers según el tipo de agencia
  const disclaimerContent = {
    law_firm: {
      title: 'Declaración Legal - Bufete de Abogados',
      shortText: 'Confirmo que soy un abogado licenciado autorizado para representar clientes ante USCIS y cortes de inmigración.',
      fullText: `
        Como bufete de abogados registrado en la plataforma EZMig, declaro bajo juramento que:

        1. **Licencia Legal**: Poseo una licencia válida para ejercer la abogacía en al menos una jurisdicción de Estados Unidos.

        2. **Autorización para Representación**: Estoy autorizado(a) para representar clientes ante el Servicio de Ciudadanía e Inmigración de Estados Unidos (USCIS) y en cortes de inmigración.

        3. **Cumplimiento Ético**: Me comprometo a cumplir con todas las reglas éticas profesionales aplicables, incluyendo las del Colegio de Abogados correspondiente.

        4. **Responsabilidad Profesional**: Asumo plena responsabilidad profesional y legal por todos los servicios prestados a través de esta plataforma.

        5. **Supervisión de Casos**: Todo trabajo legal será supervisado directamente por mí o por otro abogado licenciado de mi bufete.

        **ADVERTENCIA**: La representación legal no autorizada es un delito federal. Solo abogados licenciados pueden brindar asesoría legal y representación ante USCIS.
      `,
      consequences: [
        'Representación completa ante USCIS y cortes',
        'Responsabilidad profesional y legal total',
        'Supervisión obligatoria por abogado licenciado',
        'Cumplimiento de reglas éticas profesionales'
      ]
    },
    immigration_services: {
      title: 'Declaración de Servicios de Inmigración',
      shortText: 'Entiendo que NO soy un abogado y NO puedo brindar asesoría legal ni representar clientes ante USCIS.',
      fullText: `
        Como proveedor de servicios de inmigración registrado en la plataforma EZMig, declaro que:

        1. **NO soy abogado**: Entiendo y reconozco que NO soy un abogado licenciado y NO puedo brindar asesoría legal.

        2. **Limitaciones de Servicios**: Mis servicios se limitan a:
           - Completar formularios de inmigración bajo supervisión del cliente
           - Revisar documentos por completitud (no por validez legal)
           - Brindar información general (no consejos legales)
           - Preparar solicitudes bajo instrucciones del cliente

        3. **Prohibiciones Claras**: NO puedo:
           - Representar clientes ante USCIS o cortes
           - Brindar consejos legales o interpretación de leyes
           - Aparecer como representante legal en ningún procedimiento
           - Garantizar resultados de solicitudes de inmigración

        4. **Advertencias al Cliente**: Me comprometo a informar claramente a cada cliente que mis servicios NO constituyen representación legal.

        5. **Derivación a Abogados**: Cuando un caso requiera asesoría legal, derivaré inmediatamente al cliente a un abogado calificado.

        **IMPORTANTE**: El cliente mantiene total responsabilidad sobre las decisiones y consecuencias de su caso de inmigración.
      `,
      consequences: [
        'Solo completar formularios, no asesoría legal',
        'No representación ante USCIS o cortes',
        'Cliente mantiene responsabilidad total del caso',
        'Derivación obligatoria a abogados cuando sea necesario'
      ]
    }
  };

  const currentDisclaimer = agencyType ? disclaimerContent[agencyType] : null;

  if (!agencyType) {
    return (
      <div className={cn('p-4 bg-gray-50 border border-gray-200 rounded-lg', className)}>
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <p className="text-sm text-gray-600">
            Selecciona el tipo de agencia para ver la declaración correspondiente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Encabezado con advertencia */}
      <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            Declaración Legal Obligatoria
          </h3>
          <p className="text-xs text-amber-700 mt-1">
            Esta declaración es obligatoria y define los alcances legales de tus servicios
          </p>
        </div>
      </div>

      {/* Contenido del disclaimer */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-gray-900">
            {currentDisclaimer.title}
          </h4>
          <button
            type="button"
            onClick={() => setShowFullText(!showFullText)}
            className="text-xs text-violet-600 hover:text-violet-700 flex items-center"
          >
            {showFullText ? 'Ver resumen' : 'Ver texto completo'}
            <ExternalLink className="h-3 w-3 ml-1" />
          </button>
        </div>

        {/* Texto del disclaimer */}
        <div className="prose prose-sm max-w-none">
          {showFullText ? (
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {currentDisclaimer.fullText}
            </div>
          ) : (
            <p className="text-sm text-gray-700">
              {currentDisclaimer.shortText}
            </p>
          )}
        </div>

        {/* Consecuencias importantes */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Implicaciones importantes:
          </p>
          <ul className="space-y-1">
            {currentDisclaimer.consequences.map((consequence, index) => (
              <li
                key={index}
                className="text-xs text-gray-600 flex items-start"
              >
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-2 mt-1.5 flex-shrink-0" />
                {consequence}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Checkbox de aceptación */}
      <div className="flex items-start space-x-3 p-4 border-2 border-dashed border-violet-200 rounded-lg">
        <Checkbox
          id="disclaimer-acceptance"
          checked={value}
          onCheckedChange={onChange}
          disabled={disabled}
          className="mt-1"
        />
        <div className="flex-1">
          <Label
            htmlFor="disclaimer-acceptance"
            className="text-sm font-medium text-gray-900 cursor-pointer"
          >
            Acepto y entiendo esta declaración legal
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <p className="text-xs text-gray-600 mt-1">
            Al marcar esta casilla, confirmo que he leído, entendido y acepto cumplir con todas las obligaciones y limitaciones descritas en la declaración legal correspondiente a mi tipo de agencia.
          </p>
        </div>
      </div>

      {/* Mensaje de validación */}
      {required && !value && (
        <div className="flex items-start space-x-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Aceptación obligatoria:</strong> Debes aceptar la declaración legal para completar el registro de tu agencia. Esta declaración define los alcances legales de tus servicios.
          </p>
        </div>
      )}

      {/* Confirmación cuando está aceptado */}
      {value && (
        <div className="flex items-start space-x-2 text-xs text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 mt-0.5" />
          <p>
            <strong>Declaración aceptada:</strong> Has aceptado cumplir con las obligaciones y limitaciones legales correspondientes a tu tipo de agencia.
          </p>
        </div>
      )}
    </div>
  );
}