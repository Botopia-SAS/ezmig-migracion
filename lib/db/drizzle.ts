import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { Sql } from 'postgres';
import * as schema from './schema';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Declare global type for development singleton
declare global {
  // eslint-disable-next-line no-var
  var postgresClient: Sql | undefined;
}

// Use singleton pattern in development to avoid connection leaks during hot reload
function getClient() {
  if (process.env.NODE_ENV === 'production') {
    return postgres(connectionString!, {
      prepare: false,
      max: 10, // Maximum connections in pool
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Connection timeout in seconds
    });
  }

  // In development, reuse the client across hot reloads
  globalThis.postgresClient ??= postgres(connectionString!, {
    prepare: false,
    max: 5, // Lower limit for development
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return globalThis.postgresClient;
}

const client = getClient();

export const db = drizzle(client, { schema });
