const postgres = require('postgres');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkAuth() {
  const sql = postgres(process.env.DATABASE_URL);
  
  console.log('\nAdmin users with auth_user_id:');
  const admins = await sql`SELECT id, auth_user_id, email, first_name, last_name, role FROM admin_users WHERE email = 'tdaniel@botmakers.ai'`;
  console.table(admins);
  
  // Check Supabase auth users
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching auth users:', error);
  } else {
    console.log('\nSupabase Auth users with email tdaniel@botmakers.ai:');
    const filtered = authUsers.users.filter(u => u.email === 'tdaniel@botmakers.ai');
    console.table(filtered.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })));
  }
  
  await sql.end();
}

checkAuth().catch(console.error);
