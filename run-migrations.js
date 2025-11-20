#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://idbyrtwdeeruiutoukct.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkYnlydHdkZWVydWl1dG91a2N0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODI1OTQ2NCwiZXhwIjoyMDUzODM1NDY0fQ.WiJMUqoCxlI-FFtD7riPkds-qXcrSHB8f6RyXLhryvc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSQL(sql, description) {
  console.log(`\n🔄 ${description}...`);

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return false;
    }

    console.log(`✅ ${description} - SUCCESS`);
    return true;
  } catch (err) {
    console.error(`❌ ${description} - FAILED:`, err.message);
    return false;
  }
}

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  const migrations = [
    {
      file: 'supabase/migrations/20250121000001_fix_movsense_enterprise_tables.sql',
      name: 'Create movsense enterprise tables'
    },
    {
      file: 'supabase/migrations/20250121000002_fix_movsense_rls.sql',
      name: 'Fix RLS helper functions'
    },
    {
      file: 'supabase/migrations/20250121000003_fix_company_users_view.sql',
      name: 'Fix company_users view'
    }
  ];

  for (const migration of migrations) {
    const sqlPath = path.join(__dirname, migration.file);

    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ Migration file not found: ${migration.file}`);
      continue;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    await runSQL(sql, migration.name);
  }

  console.log('\n✅ All migrations completed!');
}

runMigrations().catch(console.error);
