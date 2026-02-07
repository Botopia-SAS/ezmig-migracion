import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    return Response.json({
      success: true,
      message: 'Endpoint funcionando correctamente',
      authenticated: !!session?.user?.id,
      userId: session?.user?.id || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test endpoint error:', error);

    return Response.json({
      success: false,
      error: 'Error en endpoint de prueba',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();

    return Response.json({
      success: true,
      message: 'Test de POST exitoso',
      authenticated: !!session?.user?.id,
      receivedData: body,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test POST endpoint error:', error);

    return Response.json({
      success: false,
      error: 'Error en test POST',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}