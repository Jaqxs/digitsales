import { PrismaClient } from '@prisma/client';

async function diagnose() {
    const hosts = ['localhost', '127.0.0.1', 'postgres'];
    const results = [];

    console.log('🔍 Starting Database Connectivity Diagnosis...\n');

    for (const host of hosts) {
        const url = `postgresql://postgres:password@${host}:5432/zantrix_pos`;
        console.log(`📡 Testing connection to: ${host}...`);

        const client = new PrismaClient({
            datasources: {
                db: { url }
            }
        });

        try {
            await client.$connect();
            console.log(`✅ SUCCESS: Connected to ${host}`);
            const version = await client.$queryRaw`SELECT version()`;
            console.log(`📊 DB Version: ${(version as any)[0].version}`);
            results.push({ host, status: 'success' });
            await client.$disconnect();
        } catch (error: any) {
            console.error(`❌ FAILED: ${host}`);
            console.error(`   Error: ${error.message.split('\n')[0]}`);
            results.push({ host, status: 'failure', error: error.message });
        }
    }

    console.log('\n📝 Summary:');
    console.table(results.map(r => ({ Host: r.host, Status: r.status })));
}

diagnose();
