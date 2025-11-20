#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://idbyrtwdeeruiutoukct.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkYnlydHdkZWVydWl1dG91a2N0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODI1OTQ2NCwiZXhwIjoyMDUzODM1NDY0fQ.WiJMUqoCxlI-FFtD7riPkds-qXcrSHB8f6RyXLhryvc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkDatabase() {
  console.log('🔍 Checking database state...\n');

  // Check if movsense.companies exists
  const { data: companies, error: companiesError } = await supabase
    .from('movsense.companies')
    .select('id')
    .limit(1);

  if (companiesError) {
    console.log('❌ movsense.companies does NOT exist');
    console.log('   Error:', companiesError.message);
  } else {
    console.log('✅ movsense.companies exists!');
  }

  // Check if movsense.profiles exists
  const { data: profiles, error: profilesError } = await supabase
    .from('movsense.profiles')
    .select('id')
    .limit(1);

  if (profilesError) {
    console.log('❌ movsense.profiles does NOT exist');
    console.log('   Error:', profilesError.message);
  } else {
    console.log('✅ movsense.profiles exists!');
  }

  // Check if movsense.pricing_rules exists
  const { data: pricing, error: pricingError } = await supabase
    .from('movsense.pricing_rules')
    .select('id')
    .limit(1);

  if (pricingError) {
    console.log('❌ movsense.pricing_rules does NOT exist');
    console.log('   Error:', pricingError.message);
  } else {
    console.log('✅ movsense.pricing_rules exists!');
  }

  console.log('\n' + '='.repeat(50));

  if (!companiesError && !profilesError && !pricingError) {
    console.log('🎉 ALL TABLES EXIST! Database is ready!');
    console.log('\nYou can now test company signup!');
  } else {
    console.log('⚠️  Some tables are missing. Run APPLY_ALL_MIGRATIONS.sql');
  }
}

checkDatabase().catch(console.error);
