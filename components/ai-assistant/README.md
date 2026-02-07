# Asistente de IA para Formularios

Un asistente de IA especializado en inmigración que ayuda a los usuarios finales a completar formularios USCIS con precisión y confianza.

## 🚀 Características

### ✨ Chat Widget Minimalista
- **Diseño elegante**: Botón flotante discreto que se expande en chat
- **Responsive**: Se adapta a todos los tamaños de pantalla
- **Contexto inteligente**: Conoce el formulario actual, sección y campos
- **Autoscroll**: Navegación fluida en la conversación
- **Estado visual**: Indicadores de "en línea", "escribiendo" y "guardado"

### 🧠 IA Especializada
- **Claude 3.5 Sonnet**: Modelo de última generación de Anthropic
- **Especialización legal**: Conocimiento específico de inmigración estadounidense
- **Contexto del formulario**: Comprende qué sección está completando el usuario
- **Respuestas responsables**: No da consejos legales específicos, solo orientación general

### 🎯 Casos de Uso

#### Para Usuarios Finales:
- **"¿Qué información necesito para este campo?"**
- **"¿Puedes darme un ejemplo de cómo llenar esta dirección?"**
- **"¿Qué documentos necesito para esta sección?"**
- **"No entiendo este término legal, ¿puedes explicármelo?"**

#### Para Administradores:
- **Reducción de consultas**: Los usuarios resuelven dudas sin contactar soporte
- **Mayor precisión**: Formularios completados con mejor calidad
- **Experiencia mejorada**: Los usuarios se sienten más seguros

## 🛠️ Implementación

### 1. Instalación de Dependencias
```bash
npm install @assistant-ui/react @anthropic-ai/sdk
```

### 2. Configuración de API
```typescript
// app/api/ai-assistant/route.ts
const anthropic = new Anthropic({
  apiKey: 'tu-api-key-de-claude',
});
```

### 3. Uso en Formularios
```tsx
import { ChatWidget } from '@/components/ai-assistant';

// En tu componente de formulario
<ChatWidget
  formContext={{
    formCode: 'I-485',
    currentSection: 'personal-information',
    currentFields: [...]
  }}
/>
```

## 📋 Contexto del Formulario

El asistente recibe automáticamente:

```typescript
interface FormContext {
  formCode: string;           // 'I-485', 'I-130', etc.
  currentPart: {
    id: string;
    title: string;
    index: number;
    total: number;
  };
  currentSection: {
    id: string;
    title: string;
    description?: string;
    index: number;
    total: number;
  };
  currentFields: Array<{
    id: string;
    type: string;
    label: string;
    required: boolean;
    helpText?: string;
    currentValue: any;
    isEmpty: boolean;
  }>;
  progress: number;           // 0-100
  locale: string;            // 'es', 'en', 'pt'
}
```

## 🎨 Personalización

### Cambiar Estilo
```tsx
<ChatWidget
  className="bottom-4 left-4"  // Posición izquierda
  formContext={context}
/>
```

### Versión Avanzada con Assistant-UI
```tsx
import { FormAssistant } from '@/components/ai-assistant';

<FormAssistant
  formContext={context}
  formData={currentFormData}
/>
```

## 🔒 Seguridad y Privacidad

### ✅ Prácticas Implementadas:
- **No almacenamiento**: Las conversaciones no se guardan en base de datos
- **Autenticación requerida**: Solo usuarios logueados pueden usar el asistente
- **Contexto limitado**: Solo datos del formulario actual, no información personal
- **Disclaimers claros**: Advertencias sobre limitaciones del consejo legal

### ⚠️ Importantes:
- El asistente NO proporciona consejos legales específicos
- Siempre recomienda consultar con un abogado para casos complejos
- Las respuestas son orientativas e informativas únicamente

## 📊 Ejemplos de Conversación

### Ejemplo 1: Campo de Dirección
```
Usuario: "¿Cómo lleno el campo de dirección actual?"

Asistente: "Para el campo 'Dirección Física Actual', necesitas proporcionar:

• Número y nombre de la calle (ej: 123 Main Street)
• Apartamento/Suite si aplica (ej: Apt 4B)
• Ciudad (ej: Los Angeles)
• Estado (ej: California o CA)
• Código postal (ej: 90210)

Importante: Usa la dirección donde realmente vives, no un apartado postal. Si vives con familiares o amigos, usa esa dirección física."
```

### Ejemplo 2: Documentos Requeridos
```
Usuario: "¿Qué documentos necesito para la sección de empleo?"

Asistente: "Para la sección de historial de empleo típicamente necesitas:

📄 Para cada trabajo de los últimos 5 años:
• Carta del empleador con fechas de empleo
• Recibos de pago (pay stubs) recientes
• Formularios W-2 o 1099
• Contrato de trabajo si es independiente

💡 Consejo: Organiza los empleos en orden cronológico inverso (más reciente primero).

⚖️ Recuerda: Para casos específicos o situaciones complejas de empleo, consulta con un abogado de inmigración."
```

## 🚦 Estados del Widget

### Cerrado
- Botón flotante minimalista
- Gradiente violeta/púrpura
- Efecto hover con escala

### Abierto
- Chat completo con header elegante
- Área de mensajes con scroll automático
- Input con placeholder contextual
- Botones de minimizar/cerrar

### Conversando
- Indicador de "escribiendo" con spinner
- Mensajes con avatares diferenciados
- Timestamps implícitos
- Manejo de errores graceful

## 🔧 API Reference

### ChatWidget Props
```typescript
interface ChatWidgetProps {
  formContext?: FormContext;  // Contexto del formulario actual
  className?: string;         // Clases CSS adicionales
}
```

### FormAssistant Props
```typescript
interface FormAssistantProps {
  formContext?: FormContext;  // Contexto del formulario
  formData?: any;            // Datos actuales del formulario
  className?: string;        // Clases CSS adicionales
}
```

## 🎯 Próximos Pasos

### Mejoras Planificadas:
1. **Historial de conversaciones** por formulario
2. **Sugerencias proactivas** basadas en campos vacíos
3. **Integración con documentos** para verificar requisitos
4. **Traducción automática** para múltiples idiomas
5. **Analytics** para mejorar respuestas comunes

### Integraciones Futuras:
- **USCIS API** para verificar estatus en tiempo real
- **Validación de documentos** con OCR
- **Calendario** para citas y deadlines
- **Notificaciones push** para recordatorios

---

**Desarrollado con ❤️ para simplificar el proceso de inmigración**