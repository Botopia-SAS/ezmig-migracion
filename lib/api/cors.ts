import { NextRequest, NextResponse } from 'next/server';

function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  if (process.env.ALLOWED_ORIGINS) {
    origins.push(
      ...process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    );
  }

  if (origins.length === 0) {
    origins.push('http://localhost:3000');
  }

  return origins;
}

export function setCorsHeaders(
  response: NextResponse,
  origin?: string | null
): NextResponse {
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = origin && allowedOrigins.includes(origin);

  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

export function handlePreflight(req: NextRequest): NextResponse | null {
  if (req.method !== 'OPTIONS') return null;

  const origin = req.headers.get('Origin');
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response, origin);
}
