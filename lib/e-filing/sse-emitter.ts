import type { EFilingEvent } from './types';

/**
 * SSE (Server-Sent Events) emitter backed by a ReadableStream.
 *
 * Usage:
 *   const emitter = new SSEEmitter();
 *   emitter.emit({ type: 'step', ... });
 *   return new Response(emitter.stream, { headers: { 'Content-Type': 'text/event-stream' } });
 */
export class SSEEmitter {
  private controller: ReadableStreamDefaultController | null = null;
  private encoder = new TextEncoder();
  readonly stream: ReadableStream;

  constructor() {
    this.stream = new ReadableStream({
      start: (controller) => {
        this.controller = controller;
      },
      cancel: () => {
        this.controller = null;
      },
    });
  }

  emit(event: EFilingEvent): void {
    if (!this.controller) return;
    try {
      const data = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
      this.controller.enqueue(this.encoder.encode(data));
    } catch {
      // Stream already closed — ignore
    }
  }

  close(): void {
    try {
      this.controller?.close();
    } catch {
      // Already closed
    }
    this.controller = null;
  }

  get isOpen(): boolean {
    return this.controller !== null;
  }
}
