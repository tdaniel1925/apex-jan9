const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function checkAdmins() {
  const sql = postgres(process.env.DATABASE_URL);
  
  console.log('\nAdmin users:');
  const admins = await sql`SELECT id, email, first_name, last_name, role FROM admin_users ORDER BY created_at`;
  console.table(admins);
  
  await sql.end();
}

checkAdmins().catch(console.error);
