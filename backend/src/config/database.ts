import { PrismaClient } from '@prisma/client';
import { config } from './environment';

// Prisma client instance
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

// Test database connection
export const testDatabaseConnection = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connection established successfully');
    const databaseUrl = process.env.DATABASE_URL || '';
    const maskedUrl = databaseUrl.replace(/:([^@]+)@/, ':****@');
    console.log(`📡 Connected to: ${maskedUrl}`);

    // Test query
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log(`✅ Database query test passed. Version: ${(result as any)[0].version}`);
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message || error);

    if (error.code === 'P1000') {
      console.error('\n💡 DIAGNOSTIC: Authentication failed.');
      console.error('   This usually means the password in .env does not match the database.');
      console.error('   Note: If you have a local PostgreSQL service (postgres.exe) running on Windows,');
      console.error('   it might be taking port 5432, preventing your Docker container from being reached.');
    } else if (error.code === 'P1001') {
      console.error('\n💡 DIAGNOSTIC: Database unreachable.');
      console.error('   Ensure your database is running and the hostname is correct.');
      console.error('   Inside Docker? Use the service name (e.g., "postgres") instead of "localhost".');
    }

    throw error;
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
export default prisma;
