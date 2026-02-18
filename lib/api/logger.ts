type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  event: string;
  correlationId?: string;
  userId?: number;
  teamId?: number;
  ip?: string;
  [key: string]: unknown;
}

const REDACTED_FIELDS = [
  'password',
  'token',
  'key',
  'secret',
  'authorization',
  'keyHash',
  'passwordHash',
];

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const clean = { ...obj };
  for (const field of REDACTED_FIELDS) {
    if (field in clean) clean[field] = '[REDACTED]';
  }
  return clean;
}

export function securityLog(entry: LogEntry): void {
  const clean = redact(entry as Record<string, unknown>);
  const timestamp = new Date().toISOString();
  const method = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'info';
  console[method](`[SECURITY] [${timestamp}]`, JSON.stringify(clean));
}
