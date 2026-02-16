1. Supabase Setup

  Q1: Do you already have a Supabase project for this app?
Yes. Supabase creds are already in .env file.


  ---
  2. Company Root Distributor Details

  This is the "company" position that orphaned sign-ups (from /join with no sponsor) will be placed under.

  Q3: What details should the root distributor have?
  - Username: _______ (e.g., "apex.corporate" or "company.root")
  - First Name: _______ (e.g., "Apex")
  - Last Name: _______ (e.g., "Corporate")
  - Email: _______ (e.g., "corporate@apexaffinitygroup.com")
  - Phone: _______ (optional)

Correct.

  ---
  3. Initial Admin Account

  You need at least one super admin to manage the system.

  Q4: What details for the first admin account?
  - First Name: _______ (your name)
  - Last Name: _______
  - Email: _______ (your email)
  - Role: super_admin (recommended) or admin or viewer
  - Password: _______ (min 8 chars, 1 uppercase, 1 number)

Trent Daniel
tdaniel@botmakers.ai
super admin
4Xkilla1@ is password

  Q5: Do you want additional admin accounts created now?
  - NO, just one for now
  -

No yet but need ot have a way to add new uadmis user (do atomica dependcey on this)

  ---
  4. Resend Email Service

  Q6: Do you already have a Resend account? 

Yes. Api Key: re_DjMiknb1_T8MdjYu6hBvdpCbbxeZeKi7A

  Q7: What domain will emails come from?
  - theapexway.net (production domain - requires DNS verification)
  - Resend's test domain (onboarding@resend.dev - works immediately, for testing)
  - Other: _______

  ---
  5. Deployment Platform

  Q8: Where do you want to deploy?
  - Vercel 

  Q9: Do you already have a Vercel account?
  - YES


  ---
  6. Domain & Environment

  Q10: What domain will the production app use?
  - theapexway.net (as specified in docs)


  Q11: Do you want to deploy to production immediately, or set up a staging environment first?
  - Production (go live immediately)


  ---
  7. Cron Jobs (Optional)

  Q12: The app has a CRON_SECRET for future drip campaigns. Should I generate one now?

