// Check for distributors in database
import postgres from 'postgres';

const sql = postgres('postgresql://postgres.pmawmgvjrfqmpcbnrutk:ttandSellaBella1234@aws-1-us-east-1.pooler.supabase.com:5432/postgres');

try {
  const distributors = await sql`
    SELECT id, first_name, last_name, username, email, photo_url, bio
    FROM distributors
    LIMIT 5
  `;

  if (distributors.length === 0) {
    console.log('❌ No distributors found in database');
    console.log('Run this to create test data: npm run db:seed');
  } else {
    console.log(`✅ Found ${distributors.length} distributor(s):\n`);
    distributors.forEach(d => {
      console.log(`👤 ${d.first_name} ${d.last_name}`);
      console.log(`   Username: ${d.username}`);
      console.log(`   Replicated URL: http://localhost:3500/${d.username}`);
      console.log(`   Email: ${d.email}`);
      console.log('');
    });
  }

  process.exit(0);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
