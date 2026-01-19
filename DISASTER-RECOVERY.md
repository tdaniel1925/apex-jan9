# Disaster Recovery & Backup Procedures
**Phase 2 - Issue #29: Backup/Restore Documentation**
**Last Updated:** 2026-01-19

---

## 📋 EXECUTIVE SUMMARY

This document outlines backup procedures, disaster recovery plans, and restore processes for the Apex Affinity Group platform.

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 1 hour (maximum data loss acceptable)

---

## 🔄 AUTOMATED BACKUPS

### Supabase Database Backups

**Status:** ✅ ENABLED - Automatic

Supabase provides automated database backups:

**Daily Backups:**
- **Frequency:** Every 24 hours
- **Retention:** 7 days (rolling)
- **Type:** Full database snapshot
- **Storage:** AWS S3 (encrypted)

**Point-in-Time Recovery (PITR):**
- **Availability:** Pro plan and above
- **Granularity:** Up to 2 weeks of WAL (Write-Ahead Logs)
- **Recovery:** Restore to any point in time

**Access:**
```bash
# Via Supabase Dashboard
# Settings → Database → Backups
# Or via CLI:
supabase db dump > backup_$(date +%Y%m%d).sql
```

---

## 💾 BACKUP STRATEGY

### What Gets Backed Up

| Component | Method | Frequency | Retention |
|-----------|--------|-----------|-----------|
| PostgreSQL Database | Supabase Auto | Daily | 7 days |
| Storage Buckets (files) | Supabase Auto | Daily | 7 days |
| Environment Variables | Manual Export | Weekly | Indefinite |
| Application Code | Git Commits | Continuous | Indefinite |
| Configuration Files | Git Commits | Continuous | Indefinite |

### Critical Data Tables

Priority for backup/recovery (in order):

1. **Financial Data** (CRITICAL)
   - `agents` - Agent records
   - `wallets` - Wallet balances
   - `wallet_transactions` - Transaction history
   - `commissions` - Commission records
   - `overrides` - Override commissions
   - `bonuses` - Bonus records
   - `payouts` - Payout history
   - `agent_banking_info` - Banking details
   - `agent_debts` - Debt tracking

2. **Compliance Data** (HIGH)
   - `compliance_logs` - Audit trail
   - `admin_audit_log` - Admin actions
   - `training_certificates` - Certifications

3. **Operational Data** (MEDIUM)
   - `products` - Product catalog
   - `orders` - Order history
   - `contacts` - Contact/lead data
   - `training_courses` - Training content

---

## 📦 MANUAL BACKUP PROCEDURES

### Full Database Backup

```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="apex_backup_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
supabase db dump \
  --db-url "postgresql://postgres.ooltgvfrdodamtezqlno:PASSWORD@aws-0-us-west-2.pooler.supabase.com:5432/postgres" \
  > "$BACKUP_DIR/$BACKUP_FILE"

# Compress
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Upload to secure storage
aws s3 cp "$BACKUP_DIR/${BACKUP_FILE}.gz" \
  s3://apex-backups/database/${DATE}/

echo "✅ Backup complete: ${BACKUP_FILE}.gz"
```

**Schedule:** Run daily at 2:00 AM UTC via cron

### Storage Bucket Backup

```bash
#!/bin/bash
# backup-storage.sh

DATE=$(date +%Y%m%d_%H%M%S)

# List all buckets
BUCKETS=("avatars" "training-materials" "certificates" "documents")

for BUCKET in "${BUCKETS[@]}"; do
  echo "Backing up bucket: $BUCKET"

  # Download all files
  supabase storage download $BUCKET \
    --output "./backups/storage/${DATE}/${BUCKET}/"

  # Compress
  tar -czf "./backups/storage_${BUCKET}_${DATE}.tar.gz" \
    "./backups/storage/${DATE}/${BUCKET}/"

  # Upload to S3
  aws s3 cp "./backups/storage_${BUCKET}_${DATE}.tar.gz" \
    s3://apex-backups/storage/${BUCKET}/${DATE}/
done

echo "✅ Storage backup complete"
```

### Environment Variables Backup

```bash
#!/bin/bash
# backup-env.sh

# NEVER commit this to git!
# Store securely in password manager or encrypted vault

cat > .env.backup <<EOF
# Database
DATABASE_URL=${DATABASE_URL}
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}

# Stripe
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}

# AI
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# Email
RESEND_API_KEY=${RESEND_API_KEY}

# SmartOffice
SMARTOFFICE_API_KEY=${SMARTOFFICE_API_KEY}
SMARTOFFICE_WEBHOOK_SECRET=${SMARTOFFICE_WEBHOOK_SECRET}

# ... add all environment variables
EOF

# Encrypt the backup
gpg --encrypt --recipient admin@theapexway.net .env.backup

# Store encrypted version securely
# DO NOT STORE PLAINTEXT VERSION
```

---

## 🔧 RESTORE PROCEDURES

### Scenario 1: Full Database Restore

**When:** Complete database loss or corruption

```bash
#!/bin/bash
# restore-database.sh

BACKUP_FILE="apex_backup_20260119_020000.sql.gz"

# Download backup from S3
aws s3 cp "s3://apex-backups/database/20260119_020000/${BACKUP_FILE}" ./

# Decompress
gunzip $BACKUP_FILE

# Restore to Supabase
psql "postgresql://postgres.ooltgvfrdodamtezqlno:PASSWORD@aws-0-us-west-2.pooler.supabase.com:5432/postgres" \
  < "${BACKUP_FILE%.gz}"

echo "✅ Database restored"

# Verify critical tables
psql ... -c "SELECT COUNT(*) FROM agents;"
psql ... -c "SELECT COUNT(*) FROM wallets;"
psql ... -c "SELECT SUM(balance) FROM wallets;"
```

**Estimated Time:** 30-60 minutes

### Scenario 2: Point-in-Time Recovery

**When:** Need to restore to specific timestamp (e.g., before accidental deletion)

```bash
# Via Supabase Dashboard:
# 1. Settings → Database → Point in Time Recovery
# 2. Select timestamp (up to 2 weeks ago)
# 3. Click "Restore"
# 4. Wait for restoration (10-30 minutes)

# Or via CLI:
supabase db restore \
  --timestamp "2026-01-19 14:30:00" \
  --confirm
```

**Estimated Time:** 10-30 minutes

### Scenario 3: Single Table Restore

**When:** Corruption in specific table

```bash
#!/bin/bash
# restore-single-table.sh

TABLE_NAME="commissions"
BACKUP_FILE="apex_backup_20260119_020000.sql"

# Extract just the table from backup
pg_restore -a -t $TABLE_NAME $BACKUP_FILE > "${TABLE_NAME}_restore.sql"

# Backup current table first
pg_dump ... -t $TABLE_NAME > "${TABLE_NAME}_before_restore.sql"

# Clear and restore
psql ... <<EOF
TRUNCATE TABLE $TABLE_NAME CASCADE;
\i ${TABLE_NAME}_restore.sql
EOF

echo "✅ Table $TABLE_NAME restored"
```

**Estimated Time:** 5-15 minutes

### Scenario 4: Storage Bucket Restore

**When:** Lost or corrupted files

```bash
#!/bin/bash
# restore-storage.sh

BUCKET_NAME="avatars"
BACKUP_DATE="20260119_020000"

# Download backup
aws s3 cp "s3://apex-backups/storage/${BUCKET_NAME}/${BACKUP_DATE}/storage_${BUCKET_NAME}_${BACKUP_DATE}.tar.gz" ./

# Extract
tar -xzf "storage_${BUCKET_NAME}_${BACKUP_DATE}.tar.gz"

# Upload to Supabase storage
supabase storage upload $BUCKET_NAME \
  "./backups/storage/${BACKUP_DATE}/${BUCKET_NAME}/*" \
  --recursive

echo "✅ Storage bucket $BUCKET_NAME restored"
```

**Estimated Time:** 30-60 minutes

---

## 🚨 DISASTER SCENARIOS & RESPONSES

### Complete Data Center Outage

**Detection:**
- Monitoring alerts (health check failures)
- Customer reports (site down)
- Supabase status page

**Response:**
1. **Immediate (0-15 min):**
   - Confirm outage via Supabase status page
   - Activate incident response team
   - Post status update for users

2. **Short-term (15-60 min):**
   - Monitor Supabase recovery progress
   - Prepare communication for customers
   - Review most recent backup timestamp

3. **Recovery (1-4 hours):**
   - If Supabase recovers: Verify data integrity
   - If prolonged: Initiate backup restore to new instance
   - Run verification tests
   - Resume operations

**Communication Template:**
```
Subject: Platform Maintenance Update

We're currently experiencing technical difficulties due to a data center issue.
Our team is working with our infrastructure provider to restore service.

Current Status: [Status]
Estimated Resolution: [Time]
Data Safety: All data is backed up and secure

We'll update you every 30 minutes.
```

### Ransomware Attack

**Detection:**
- Encrypted files
- Ransom note
- Database access denied

**Response:**
1. **Immediate:**
   - Isolate infected systems
   - DO NOT pay ransom
   - Contact law enforcement (FBI Cyber Division)
   - Activate cybersecurity insurance

2. **Assessment:**
   - Determine infection scope
   - Identify most recent clean backup
   - Check backup integrity

3. **Recovery:**
   - Rebuild infrastructure from scratch
   - Restore from clean backups (verified pre-infection)
   - Change all credentials
   - Implement enhanced security

### Accidental Data Deletion

**Detection:**
- User report (missing data)
- Monitoring alerts (sudden count drop)

**Response:**
1. Immediately stop all write operations to affected tables
2. Identify deletion timestamp
3. Restore from point-in-time backup (before deletion)
4. Verify restored data matches expectations
5. Identify root cause and prevent recurrence

---

## ✅ VERIFICATION & TESTING

### Monthly Backup Test

**Schedule:** First Sunday of each month

```bash
#!/bin/bash
# test-backup-restore.sh

echo "🧪 Testing backup/restore process..."

# 1. Create test database
echo "Creating test database..."
createdb apex_restore_test

# 2. Restore latest backup
echo "Restoring from backup..."
LATEST_BACKUP=$(ls -t backups/*.sql.gz | head -1)
gunzip -c $LATEST_BACKUP | psql apex_restore_test

# 3. Run verification queries
echo "Verifying data..."
psql apex_restore_test <<EOF
-- Count critical tables
SELECT 'agents' as table_name, COUNT(*) as count FROM agents
UNION ALL
SELECT 'wallets', COUNT(*) FROM wallets
UNION ALL
SELECT 'commissions', COUNT(*) FROM commissions;

-- Verify wallet balance totals
SELECT SUM(balance) as total_balance FROM wallets;

-- Check for data integrity
SELECT COUNT(*) as orphaned_wallets
FROM wallets w
LEFT JOIN agents a ON w.agent_id = a.id
WHERE a.id IS NULL;
EOF

# 4. Cleanup
echo "Cleaning up test database..."
dropdb apex_restore_test

echo "✅ Backup test complete!"
```

**Success Criteria:**
- Restore completes without errors
- Record counts match production (within expected variance)
- No orphaned records
- Wallet balances sum correctly

---

## 📞 EMERGENCY CONTACTS

**Infrastructure Team:**
- On-Call Engineer: [Phone/Email]
- Database Admin: [Phone/Email]
- DevOps Lead: [Phone/Email]

**External Support:**
- Supabase Support: support@supabase.com
- AWS Support: [Support Portal]

**Escalation Path:**
1. On-Call Engineer (immediate)
2. DevOps Lead (30 min)
3. CTO (1 hour)
4. CEO (2 hours)

---

## 📚 APPENDIX

### Backup Storage Locations

- **Primary:** Supabase automated backups
- **Secondary:** AWS S3 (s3://apex-backups/)
- **Tertiary:** Offsite encrypted storage

### Recovery Time Estimates

| Scenario | RTO | RPO | Priority |
|----------|-----|-----|----------|
| Single table | 15 min | 1 hour | Medium |
| Full database | 1 hour | 1 hour | Critical |
| Storage files | 2 hours | 24 hours | Low |
| Complete rebuild | 4 hours | 1 hour | Critical |

---

**Document Version:** 1.0
**Last Drill:** [Pending - Schedule first drill]
**Next Review:** 2026-02-19
**Owner:** DevOps Team
