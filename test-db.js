// Quick database connection test
import postgres from 'postgres';

const sql = postgres('postgresql://postgres.pmawmgvjrfqmpcbnrutk:ttandSellaBella1234@aws-1-us-east-1.pooler.supabase.com:5432/postgres', {
  connect_timeout: 5,
});

try {
  const result = await sql`SELECT NOW() as time`;
  console.log('✅ Database connected successfully!');
  console.log('Server time:', result[0].time);
  process.exit(0);
} catch (error) {
  console.error('❌ Database connection failed:');
  console.error(error.message);
  process.exit(1);
}
