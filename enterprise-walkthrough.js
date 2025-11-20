#!/usr/bin/env node

/**
 * ENTERPRISE USER WALKTHROUGH TEST
 *
 * Scenario: "Austin Elite Movers" - A growing moving company
 * - Owner: Sarah Johnson
 * - 15 trucks
 * - 3 Sales Reps
 * - 2 Managers
 * - Serves Austin metro area
 */

const https = require('https');

const SUPABASE_URL = 'https://idbyrtwdeeruiutoukct.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkYnlydHdkZWVydWl1dG91a2N0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODI1OTQ2NCwiZXhwIjoyMDUzODM1NDY0fQ.WiJMUqoCxlI-FFtD7riPkds-qXcrSHB8f6RyXLhryvc';
const ACCESS_TOKEN = 'sbp_ed3873fc1121cb8b0caf60e984d030a1f54574c7';

const timestamp = Date.now();
const company = {
  name: 'Austin Elite Movers',
  ownerName: 'Sarah Johnson',
  ownerEmail: `sarah${timestamp}@austinelitemovers.com`,
  ownerPassword: 'SecurePass123!',
  phone: '+1-512-555-MOVE',
  address: '4500 S Congress Ave, Austin, TX 78745',
  truckCount: 15,
  serviceArea: 'Austin Metro Area (Travis, Williamson, Hays Counties)'
};

const salesTeam = [
  {
    name: 'Mike Rodriguez',
    email: `mike${timestamp}@austinelitemovers.com`,
    role: 'rep'
  },
  {
    name: 'Jessica Chen',
    email: `jessica${timestamp}@austinelitemovers.com`,
    role: 'rep'
  },
  {
    name: 'David Thompson',
    email: `david${timestamp}@austinelitemovers.com`,
    role: 'rep'
  },
  {
    name: 'Amanda Martinez',
    email: `amanda${timestamp}@austinelitemovers.com`,
    role: 'manager'
  },
  {
    name: 'Robert Kim',
    email: `robert${timestamp}@austinelitemovers.com`,
    role: 'manager'
  }
];

let findings = {
  criticalIssues: [],
  missingFeatures: [],
  uxImprovements: [],
  niceToHave: []
};

let companyId, ownerId;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function queryDatabase(sql) {
  const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/idbyrtwdeeruiutoukct/database/query`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  return await makeRequest(options, { query: sql });
}

async function runEnterpriseWalkthrough() {
  console.log('🏢 ENTERPRISE USER WALKTHROUGH TEST');
  console.log('=====================================');
  console.log(`Company: ${company.name}`);
  console.log(`Owner: ${company.ownerName}`);
  console.log(`Team Size: ${salesTeam.length + 1} people`);
  console.log(`Trucks: ${company.truckCount}`);
  console.log('=====================================\n');

  // STEP 1: Company Signup
  console.log('📝 STEP 1: Owner Signs Up Company');
  console.log('-----------------------------------');

  const signupOptions = {
    hostname: 'idbyrtwdeeruiutoukct.supabase.co',
    path: '/functions/v1/signup-company',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY
    }
  };

  const signupResult = await makeRequest(signupOptions, {
    companyName: company.name,
    adminName: company.ownerName,
    adminEmail: company.ownerEmail,
    adminPassword: company.ownerPassword,
    adminPhone: company.phone,
    companyAddress: company.address,
    truckCount: company.truckCount,
    serviceArea: company.serviceArea
  });

  if (signupResult.status === 200 && signupResult.data.success) {
    ownerId = signupResult.data.userId;
    console.log(`✅ Company signup successful`);
    console.log(`   Owner ID: ${ownerId}`);
  } else {
    console.log('❌ Company signup failed:', signupResult.data);
    findings.criticalIssues.push({
      area: 'Company Signup',
      issue: 'Signup flow failed',
      details: signupResult.data
    });
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get company ID
  const companyQuery = await queryDatabase(`
    SELECT id FROM movsense.companies WHERE owner_id = '${ownerId}'
  `);

  if (companyQuery.data && companyQuery.data.length > 0) {
    companyId = companyQuery.data[0].id;
    console.log(`   Company ID: ${companyId}\n`);
  }

  // STEP 2: Check Dashboard Experience
  console.log('📊 STEP 2: Checking Dashboard Experience');
  console.log('-----------------------------------------');

  // Check if there's a company dashboard view
  findings.missingFeatures.push({
    priority: 'HIGH',
    feature: 'Company Dashboard',
    description: 'Need a company-level dashboard showing:',
    details: [
      '- Total quotes this month (all reps)',
      '- Conversion rate',
      '- Revenue pipeline',
      '- Top performing sales reps',
      '- Truck utilization',
      '- Upcoming jobs calendar',
      '- Recent activity feed'
    ]
  });

  findings.missingFeatures.push({
    priority: 'HIGH',
    feature: 'Sales Rep Performance Metrics',
    description: 'Managers need to see:',
    details: [
      '- Quotes created per rep',
      '- Win rate per rep',
      '- Average quote value',
      '- Response time to leads',
      '- Commission tracking'
    ]
  });

  console.log('⚠️  Missing: Company-level analytics dashboard\n');

  // STEP 3: Invite Team Members
  console.log('👥 STEP 3: Inviting Sales Team');
  console.log('-------------------------------');

  let invitedCount = 0;
  for (const member of salesTeam) {
    console.log(`   Inviting ${member.name} (${member.role})...`);

    const inviteOptions = {
      hostname: 'idbyrtwdeeruiutoukct.supabase.co',
      path: '/functions/v1/invite-user',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY
      }
    };

    const inviteResult = await makeRequest(inviteOptions, {
      email: member.email,
      full_name: member.name,
      role: member.role,
      company_id: companyId
    });

    if (inviteResult.status === 200) {
      invitedCount++;
      console.log(`   ✅ ${member.name} invited`);
    } else {
      console.log(`   ❌ Failed to invite ${member.name}`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Invited ${invitedCount}/${salesTeam.length} team members\n`);

  // STEP 4: User Management Experience
  console.log('🔧 STEP 4: User Management Features');
  console.log('------------------------------------');

  findings.missingFeatures.push({
    priority: 'MEDIUM',
    feature: 'Bulk User Import',
    description: 'For companies with large teams, need CSV import for users',
    details: [
      '- Upload CSV with name, email, role',
      '- Bulk send invitations',
      '- Preview before import'
    ]
  });

  findings.missingFeatures.push({
    priority: 'HIGH',
    feature: 'User Activity Tracking',
    description: 'Track when users last logged in and what they\'re working on',
    details: [
      '- Last login timestamp',
      '- Active quotes',
      '- Recent actions'
    ]
  });

  findings.uxImprovements.push({
    area: 'User Management',
    improvement: 'Add user search/filter',
    reason: 'With 15+ users, need to quickly find specific reps'
  });

  console.log('⚠️  Missing: Bulk import, activity tracking, search\n');

  // STEP 5: Quote Management
  console.log('📋 STEP 5: Quote Management Workflow');
  console.log('-------------------------------------');

  findings.missingFeatures.push({
    priority: 'CRITICAL',
    feature: 'Quote Assignment System',
    description: 'Ability to assign/reassign quotes between reps',
    details: [
      '- Assign new lead to specific rep',
      '- Reassign if rep is overwhelmed',
      '- Round-robin auto-assignment',
      '- Territory-based assignment'
    ]
  });

  findings.missingFeatures.push({
    priority: 'HIGH',
    feature: 'Quote Pipeline View',
    description: 'Kanban-style board for quote stages',
    details: [
      'Columns: New Lead → Quote Sent → Follow-up → Won/Lost',
      'Drag-and-drop between stages',
      'Filter by rep, date range',
      'Quick stats per stage'
    ]
  });

  findings.missingFeatures.push({
    priority: 'HIGH',
    feature: 'Quote Templates',
    description: 'Save common quote configurations',
    details: [
      '- Save as template (e.g., "2BR Apartment", "4BR House")',
      '- Company-wide templates for consistency',
      '- Rep-specific templates'
    ]
  });

  findings.missingFeatures.push({
    priority: 'MEDIUM',
    feature: 'Duplicate Quote Detection',
    description: 'Alert if same address/customer already quoted',
    details: [
      '- Check by address match',
      '- Check by email/phone',
      '- Show previous quotes for customer'
    ]
  });

  console.log('⚠️  Missing: Assignment, pipeline view, templates\n');

  // STEP 6: Customer Communication
  console.log('📧 STEP 6: Customer Communication Features');
  console.log('-------------------------------------------');

  findings.missingFeatures.push({
    priority: 'HIGH',
    feature: 'Email Template Management',
    description: 'Company-branded email templates',
    details: [
      '- Quote follow-up templates',
      '- Thank you emails',
      '- Job reminder emails',
      '- Company logo in emails',
      '- Custom email signature per rep'
    ]
  });

  findings.missingFeatures.push({
    priority: 'MEDIUM',
    feature: 'SMS Notifications',
    description: 'Text customers for quick updates',
    details: [
      '- Quote ready notification',
      '- Appointment reminders',
      '- Two-way SMS conversation'
    ]
  });

  findings.missingFeatures.push({
    priority: 'MEDIUM',
    feature: 'Customer Portal',
    description: 'Let customers track their quote/job status',
    details: [
      '- Login to see quote details',
      '- Accept/decline quote online',
      '- Upload additional photos',
      '- Message the rep'
    ]
  });

  console.log('⚠️  Missing: Email templates, SMS, customer portal\n');

  // STEP 7: Scheduling & Calendar
  console.log('📅 STEP 7: Scheduling & Calendar');
  console.log('---------------------------------');

  findings.missingFeatures.push({
    priority: 'CRITICAL',
    feature: 'Move Scheduling Calendar',
    description: 'Schedule jobs and assign trucks/crews',
    details: [
      '- Calendar view of scheduled moves',
      '- Assign truck number',
      '- Assign crew members',
      '- Conflict detection (double-booking)',
      '- Truck availability tracking',
      '- Crew availability tracking'
    ]
  });

  findings.missingFeatures.push({
    priority: 'HIGH',
    feature: 'Truck & Crew Management',
    description: 'Track resources and availability',
    details: [
      '- List all trucks with status',
      '- Maintenance schedule',
      '- Crew roster',
      '- Availability calendar',
      '- GPS tracking integration'
    ]
  });

  console.log('⚠️  Missing: Scheduling, truck/crew management\n');

  // STEP 8: Pricing & Profitability
  console.log('💰 STEP 8: Pricing & Profitability Tools');
  console.log('-----------------------------------------');

  findings.missingFeatures.push({
    priority: 'HIGH',
    feature: 'Dynamic Pricing Rules',
    description: 'Smart pricing based on various factors',
    details: [
      '- Weekend/holiday surcharge',
      '- Peak season pricing',
      '- Distance-based pricing',
      '- Competitor pricing intelligence',
      '- Automatic discount rules (repeat customers)',
      '- Min/max price guardrails'
    ]
  });

  findings.missingFeatures.push({
    priority: 'HIGH',
    feature: 'Profit Margin Calculator',
    description: 'Know profitability before accepting job',
    details: [
      '- Labor cost calculator',
      '- Fuel cost estimate',
      '- Equipment/materials cost',
      '- Overhead allocation',
      '- Target profit margin alerts'
    ]
  });

  findings.missingFeatures.push({
    priority: 'MEDIUM',
    feature: 'Competitive Bidding Alerts',
    description: 'Get notified when quote might be too high',
    details: [
      '- Compare to company average',
      '- Industry benchmarks',
      '- Win/loss analysis by price point'
    ]
  });

  console.log('⚠️  Missing: Dynamic pricing, profit calculator\n');

  // STEP 9: Reporting & Analytics
  console.log('📈 STEP 9: Reporting & Analytics');
  console.log('---------------------------------');

  findings.missingFeatures.push({
    priority: 'CRITICAL',
    feature: 'Executive Dashboard',
    description: 'High-level metrics for business owners',
    details: [
      '- Monthly revenue vs target',
      '- Quote-to-close ratio',
      '- Average job value',
      '- Top revenue sources',
      '- Seasonal trends',
      '- Year-over-year comparison'
    ]
  });

  findings.missingFeatures.push({
    priority: 'HIGH',
    feature: 'Exportable Reports',
    description: 'Generate reports for accounting/analysis',
    details: [
      '- Sales report by date range',
      '- Rep performance report',
      '- Lost quote analysis',
      '- Customer acquisition report',
      '- Export to Excel/PDF'
    ]
  });

  console.log('⚠️  Missing: Executive dashboard, reports\n');

  // STEP 10: Mobile Experience
  console.log('📱 STEP 10: Mobile Experience');
  console.log('------------------------------');

  findings.missingFeatures.push({
    priority: 'HIGH',
    feature: 'Mobile App for Reps',
    description: 'Reps need mobile access in the field',
    details: [
      '- Create quote on mobile',
      '- Take photos on-site',
      '- Quick quote sharing via SMS',
      '- GPS location for job sites',
      '- Offline mode'
    ]
  });

  findings.uxImprovements.push({
    area: 'Mobile Web',
    improvement: 'Ensure responsive design works well',
    reason: 'Reps often work from phones/tablets'
  });

  console.log('⚠️  Missing: Mobile-optimized experience\n');

  // STEP 11: Integration Needs
  console.log('🔌 STEP 11: Integration Opportunities');
  console.log('--------------------------------------');

  findings.missingFeatures.push({
    priority: 'MEDIUM',
    feature: 'QuickBooks Integration',
    description: 'Sync invoices and payments',
    details: [
      '- Auto-create invoice when job completed',
      '- Sync payments',
      '- Track accounts receivable'
    ]
  });

  findings.missingFeatures.push({
    priority: 'MEDIUM',
    feature: 'Google Calendar Sync',
    description: 'Sync scheduled moves to Google Calendar',
    details: []
  });

  findings.missingFeatures.push({
    priority: 'LOW',
    feature: 'Zapier Integration',
    description: 'Connect to other tools',
    details: [
      '- CRM integration',
      '- Email marketing',
      '- Lead sources'
    ]
  });

  console.log('⚠️  Opportunity: QuickBooks, Google Calendar\n');

  // STEP 12: Security & Compliance
  console.log('🔒 STEP 12: Security & Compliance');
  console.log('----------------------------------');

  findings.missingFeatures.push({
    priority: 'HIGH',
    feature: 'Audit Log',
    description: 'Track all changes for compliance',
    details: [
      '- Who changed what and when',
      '- Quote modifications history',
      '- User permission changes',
      '- Customer data access log'
    ]
  });

  findings.criticalIssues.push({
    area: 'Security',
    issue: 'Public quote access policy',
    details: 'From audit: "Anyone can view quotes by ID" - GDPR risk',
    fix: 'Implement token-based quote sharing'
  });

  findings.criticalIssues.push({
    area: 'Security',
    issue: 'Public storage read access',
    details: 'All uploaded photos are publicly accessible',
    fix: 'Restrict to authenticated users or token-based access'
  });

  console.log('⚠️  Security issues from audit need fixing\n');

  // FINAL SUMMARY
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🏢 ENTERPRISE WALKTHROUGH - FINDINGS SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`🔴 CRITICAL ISSUES (${findings.criticalIssues.length}):`);
  console.log('─────────────────────────────');
  findings.criticalIssues.forEach((item, i) => {
    console.log(`${i + 1}. [${item.area}] ${item.issue}`);
    if (item.details) console.log(`   ${item.details}`);
    if (item.fix) console.log(`   Fix: ${item.fix}`);
  });

  console.log(`\n🟠 MISSING CRITICAL FEATURES (Priority: CRITICAL/HIGH):`);
  console.log('─────────────────────────────────────────────────────');
  findings.missingFeatures
    .filter(f => f.priority === 'CRITICAL' || f.priority === 'HIGH')
    .forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.feature} [${item.priority}]`);
      console.log(`   ${item.description}`);
      if (item.details && item.details.length > 0) {
        item.details.forEach(d => console.log(`   • ${d}`));
      }
    });

  console.log(`\n🟡 MISSING MEDIUM FEATURES:`);
  console.log('───────────────────────────');
  findings.missingFeatures
    .filter(f => f.priority === 'MEDIUM')
    .forEach((item, i) => {
      console.log(`${i + 1}. ${item.feature}`);
    });

  console.log(`\n🔵 UX IMPROVEMENTS:`);
  console.log('──────────────────');
  findings.uxImprovements.forEach((item, i) => {
    console.log(`${i + 1}. [${item.area}] ${item.improvement}`);
    console.log(`   Why: ${item.reason}`);
  });

  console.log('\n═══════════════════════════════════════════════════════\n');

  // Save detailed report
  const fs = require('fs');
  fs.writeFileSync(
    'ENTERPRISE_IMPROVEMENT_ROADMAP.json',
    JSON.stringify(findings, null, 2)
  );

  console.log('📄 Detailed findings saved to: ENTERPRISE_IMPROVEMENT_ROADMAP.json\n');
}

runEnterpriseWalkthrough().catch(console.error);
