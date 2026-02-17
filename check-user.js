const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function checkUser() {
  const sql = postgres(process.env.DATABASE_URL);
  
  console.log('\nDistributors with email tdaniel@botmakers.ai:');
  const distributors = await sql`SELECT id, username, first_name, last_name, email, status FROM distributors WHERE email = 'tdaniel@botmakers.ai'`;
  console.table(distributors);
  
  console.log('\nAdmins with email tdaniel@botmakers.ai:');
  const admins = await sql`SELECT id, email, first_name, last_name, role FROM admin_users WHERE email = 'tdaniel@botmakers.ai'`;
  console.table(admins);
  
  await sql.end();
}

checkUser().catch(console.error);
