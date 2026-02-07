import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSession } from '@/lib/auth/session';

// Inicializar Claude con la API key desde variables de entorno
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({
        success: false,
        error: 'No estás autenticado. Por favor inicia sesión para usar el asistente.'
      }, { status: 401 });
    }

    const body = await request.json();
    const { message, formContext, conversationHistory = [] } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({
        success: false,
        error: 'El asistente IA no está configurado. Falta ANTHROPIC_API_KEY.'
      }, { status: 503 });
    }

    if (!message) {
      return Response.json({
        success: false,
        error: 'El mensaje es requerido'
      }, { status: 400 });
    }

    // Construir el contexto del sistema
    const systemPrompt = `Eres un asistente de inmigración que ayuda a completar formularios USCIS. Responde SIEMPRE en español.

FORMATO DE RESPUESTA OBLIGATORIO:
- Máximo 2-3 oraciones por respuesta
- Ve directo al punto, sin introducciones ni despedidas
- Usa viñetas solo si listas más de 2 elementos
- NO repitas la pregunta del usuario
- Si necesitas dar un ejemplo, ponlo directamente: Ej: "John Smith"

${formContext ? `FORMULARIO ACTUAL: ${formContext.formCode || 'N/A'}
${formContext.currentSection ? `SECCIÓN: ${formContext.currentSection.title}` : ''}
${formContext.currentFields ? `CAMPOS: ${formContext.currentFields.map((f: any) => f.label).join(', ')}` : ''}` : ''}

Solo da información general. Para casos complejos di "consulta con tu abogado".`;

    // Construir mensajes de conversación
    const messages = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    // Llamar a Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 300,
      system: systemPrompt,
      messages: messages
    });

    const assistantMessage = response.content[0];

    if (assistantMessage.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return Response.json({
      success: true,
      message: assistantMessage.text,
      usage: response.usage
    });

  } catch (error) {
    console.error('AI Assistant error:', error);

    // Manejar errores específicos de Anthropic
    if (error instanceof Error && error.message.includes('rate_limit')) {
      return Response.json(
        {
          success: false,
          error: 'Límite de uso alcanzado. Intenta de nuevo en unos minutos.'
        },
        { status: 429 }
      );
    }

    return Response.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}