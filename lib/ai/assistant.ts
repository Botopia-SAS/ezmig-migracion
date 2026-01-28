import { generateText, streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { logAIInteraction } from './logging';

// Immigration-specific system prompt with guardrails
const IMMIGRATION_SYSTEM_PROMPT = `You are an AI assistant specialized in US immigration law and USCIS procedures. You help attorneys, legal staff, and clients with immigration-related questions.

## Your Role
- Provide accurate information about US immigration forms, procedures, and requirements
- Help explain USCIS processes and timelines
- Assist with understanding visa categories, green card processes, and naturalization
- Guide users through form requirements and documentation

## Guardrails - You MUST follow these rules:
1. **Stay in Scope**: Only answer questions related to US immigration. Politely decline to answer questions about other legal areas or unrelated topics.
2. **No Legal Advice**: Always clarify that you provide general information, NOT legal advice. Users should consult with a licensed attorney for their specific situation.
3. **No Predictions**: Do not predict case outcomes, approval chances, or processing times. Refer users to official USCIS resources.
4. **Privacy**: Never ask for or store sensitive personal information like SSN, A-Numbers, or passport numbers in your responses.
5. **Accuracy**: If unsure about something, say so. Direct users to official USCIS.gov resources for authoritative information.
6. **Professional Tone**: Maintain a helpful, professional, and empathetic tone.

## Disclaimer (include when relevant):
"This information is for educational purposes only and does not constitute legal advice. Please consult with a licensed immigration attorney for advice specific to your situation."

## Topics You Can Help With:
- Visa categories (family, employment, student, tourist, etc.)
- Green card processes (family-based, employment-based, diversity lottery)
- Naturalization and citizenship
- USCIS forms and their requirements
- Supporting documentation requirements
- General timeline expectations (with disclaimer about case-by-case variation)
- Adjustment of status vs. consular processing
- Work authorization (EAD)
- Travel documents (Advance Parole)

## Topics to Decline:
- Non-immigration legal matters
- Tax advice
- Criminal law questions
- Specific case predictions
- Anything requiring legal judgment`;

export interface AIAssistantOptions {
  userId: number;
  teamId: number;
  caseId?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Generate a response from the AI assistant
 */
export async function chat(
  messages: ChatMessage[],
  options: AIAssistantOptions
): Promise<string> {
  const startTime = Date.now();

  const { text, usage } = await generateText({
    model: anthropic('claude-3-5-haiku-latest'),
    system: IMMIGRATION_SYSTEM_PROMPT,
    messages: messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const endTime = Date.now();
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

  // Log the interaction
  await logAIInteraction({
    userId: options.userId,
    teamId: options.teamId,
    caseId: options.caseId,
    prompt: lastUserMessage?.content || '',
    response: text,
    tokensUsed: usage?.totalTokens || 0,
    model: 'claude-3-5-haiku-latest',
    latencyMs: endTime - startTime,
  });

  return text;
}

/**
 * Stream a response from the AI assistant
 */
export async function chatStream(
  messages: ChatMessage[],
  options: AIAssistantOptions
) {
  const result = streamText({
    model: anthropic('claude-3-5-haiku-latest'),
    system: IMMIGRATION_SYSTEM_PROMPT,
    messages: messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    onFinish: async ({ text, usage }) => {
      const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

      // Log the interaction
      await logAIInteraction({
        userId: options.userId,
        teamId: options.teamId,
        caseId: options.caseId,
        prompt: lastUserMessage?.content || '',
        response: text,
        tokensUsed: usage?.totalTokens || 0,
        model: 'claude-3-5-haiku-latest',
        latencyMs: 0, // Can't measure accurately with streaming
      });
    },
  });

  return result;
}

/**
 * Quick question - single turn conversation
 */
export async function askQuestion(
  question: string,
  options: AIAssistantOptions
): Promise<string> {
  return chat([{ role: 'user', content: question }], options);
}

/**
 * Check if a message is within scope (immigration-related)
 */
export function isInScope(message: string): boolean {
  const immigrationKeywords = [
    'visa', 'green card', 'uscis', 'immigration', 'citizenship',
    'naturalization', 'i-130', 'i-485', 'i-765', 'ead', 'advance parole',
    'adjustment of status', 'consular processing', 'h1b', 'h-1b', 'f1', 'f-1',
    'b1', 'b-1', 'b2', 'b-2', 'k1', 'k-1', 'asylum', 'refugee',
    'deportation', 'removal', 'petition', 'sponsor', 'beneficiary',
    'priority date', 'visa bulletin', 'rfe', 'noid', 'denial', 'appeal',
    'passport', 'travel document', 'work permit', 'employment authorization',
    'immigrant', 'nonimmigrant', 'lawful permanent resident', 'lpr',
    'daca', 'tps', 'form', 'filing', 'processing time'
  ];

  const lowerMessage = message.toLowerCase();
  return immigrationKeywords.some((keyword) => lowerMessage.includes(keyword));
}
