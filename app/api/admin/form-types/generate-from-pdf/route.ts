import { withAdmin } from '@/lib/api/middleware';
import { badRequestResponse } from '@/lib/api/response';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Robustly extract and parse a JSON object from Claude's response.
 */
function parseJSONObject(raw: string): Record<string, unknown> {
  let text = raw.trim();

  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  if (!text.startsWith('{')) {
    const jsonStart = text.indexOf('{');
    if (jsonStart !== -1) {
      text = text.slice(jsonStart);
    }
  }

  const lastBrace = text.lastIndexOf('}');
  if (lastBrace !== -1) {
    text = text.slice(0, lastBrace + 1);
  }

  return JSON.parse(text);
}

const SYSTEM_PROMPT = `You are a USCIS immigration form schema generator. You receive PDF documents of official USCIS forms and must produce a structured JSON wizard schema.

The schema follows this exact structure:
{
  "formCode": "I-XXX",
  "parts": [
    {
      "id": "part1",
      "title": "Part 1. Title",
      "translations": {
        "es": { "title": "Parte 1. Título" },
        "pt": { "title": "Parte 1. Título" }
      },
      "sections": [
        {
          "id": "sectionName",
          "title": "Section Title",
          "description": "Optional description",
          "translations": {
            "es": { "title": "Título", "description": "Descripción" },
            "pt": { "title": "Título", "description": "Descrição" }
          },
          "fields": [
            {
              "id": "fieldName",
              "type": "text",
              "label": "Field Label",
              "required": true,
              "translations": {
                "es": { "label": "Etiqueta" },
                "pt": { "label": "Rótulo" }
              }
            }
          ]
        }
      ]
    }
  ]
}

RULES:
1. Field types must be one of: text, textarea, date, select, radio, checkbox, checkbox_group, phone, email, number, address, ssn, alien_number
2. Use camelCase for all IDs (partId, sectionId, fieldId)
3. Part IDs should be "part1", "part2", etc.
4. Section and field IDs should be descriptive camelCase (e.g. "petitionerName", "currentAddress")
5. Include Spanish (es) and Portuguese (pt) translations for all titles, labels, descriptions
6. For select/radio/checkbox_group fields, include "options" array with { value, label } and translations with options map
7. Use "conditionalDisplay" when fields should only show based on another field's value: { "field": "partId.sectionId.fieldId", "value": "expectedValue" }
8. Include "pdfField" when you can identify the PDF AcroForm field name
9. Mark fields as required: true when the form indicates they are required
10. Group related fields logically into sections
11. Return ONLY the JSON schema, no markdown fences or explanation`;

export const POST = withAdmin(async (req) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return badRequestResponse('ANTHROPIC_API_KEY not configured');
  }

  const formData = await req.formData();
  const files = formData.getAll('pdfs') as File[];
  const formCode = formData.get('formCode') as string;

  if (!files.length) {
    return badRequestResponse('At least one PDF file is required');
  }

  if (!formCode) {
    return badRequestResponse('formCode is required');
  }

  // Convert PDF files to base64 for Claude
  const pdfContents: Anthropic.Messages.ContentBlockParam[] = [];

  for (const file of files) {
    if (file.type !== 'application/pdf') {
      return badRequestResponse(`File "${file.name}" is not a PDF`);
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    pdfContents.push({
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: base64,
      },
    });
  }

  pdfContents.push({
    type: 'text',
    text: `Analyze these PDF document(s) of USCIS form ${formCode}. Generate the complete wizard JSON schema following the structure defined in your instructions. The formCode should be "${formCode}". Return ONLY valid JSON.`,
  });

  // Stream SSE events to the client for real-time feedback
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        sendEvent('status', { message: 'Sending PDF to Claude...' });

        const aiStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 64000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: pdfContents }],
        });

        let fullText = '';
        let tokenCount = 0;

        sendEvent('status', { message: 'Claude is analyzing the PDF...' });

        aiStream.on('text', (text) => {
          fullText += text;
          tokenCount++;
          // Send progress every 20 chunks to avoid flooding
          if (tokenCount % 20 === 0) {
            sendEvent('progress', {
              chars: fullText.length,
              tokens: tokenCount,
            });
          }
        });

        const finalMessage = await aiStream.finalMessage();

        // Check if truncated
        if (finalMessage.stop_reason === 'max_tokens') {
          sendEvent('error', {
            message: 'The form is too large. Try uploading fewer pages.',
          });
          controller.close();
          return;
        }

        sendEvent('status', { message: 'Parsing JSON schema...' });

        const textBlock = finalMessage.content.find((b) => b.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
          sendEvent('error', { message: 'No text response from AI' });
          controller.close();
          return;
        }

        const schema = parseJSONObject(textBlock.text);

        sendEvent('done', {
          schema,
          usage: finalMessage.usage,
        });
      } catch (error) {
        const message =
          error instanceof SyntaxError
            ? 'AI returned invalid JSON. Please try again.'
            : error instanceof Error
              ? error.message
              : 'Unknown error generating schema';
        sendEvent('error', { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});

export const maxDuration = 300;
