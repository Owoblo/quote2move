# 🏢 Enterprise Multi-User & Data Logging Implementation Plan

## Current State Analysis

### ✅ What We Have:
- **Single-user tenancy**: 1 signup = 1 moving company account
- **Solid RLS foundation**: All tables have user-based access control
- **Company settings**: Each user has company branding
- **Projects & Quotes**: Full workflow for creating estimates
- **Customer uploads**: Shareable links for customers to upload photos
- **Supabase Auth**: Email/password authentication

### ❌ What's Missing:
- **No multi-user companies**: Can't have multiple reps under one company
- **No roles/permissions**: Everyone has same access level
- **No invitation system**: Can't add team members
- **No data logging**: Not tracking accuracy or outcomes
- **No analytics**: Can't measure AI performance or business metrics

---

## PART 1: ENTERPRISE ONBOARDING & MULTI-USER SETUP

### Phase 1A: Database Schema Migration (2-3 hours)

#### New Tables to Create:

```sql
-- 1. Companies table (the core tenant)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Company details
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  number_of_trucks INTEGER,
  primary_service_area TEXT, -- City/state

  -- Branding (migrate from company_settings)
  company_logo_url TEXT,

  -- Subscription/billing
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled')),
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',

  -- Pricing configuration
  default_hourly_rate NUMERIC DEFAULT 75,
  default_crew_size INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Company members (users within companies)
CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role-based access
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'sales_rep')),

  -- Status
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,

  -- Metadata
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(company_id, user_id),
  UNIQUE(company_id, email)
);

-- 3. Invitations (pending team member invites)
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'sales_rep')),

  -- Invitation token
  token TEXT NOT NULL UNIQUE,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pricing rules (company-specific pricing)
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Base rates
  hourly_rate NUMERIC NOT NULL DEFAULT 75,
  crew_size INTEGER DEFAULT 3,

  -- Truck fees (JSON array)
  truck_fees JSONB DEFAULT '{"small": 100, "medium": 150, "large": 200, "xlarge": 250}'::jsonb,

  -- Special items (JSON object)
  special_items JSONB DEFAULT '{
    "piano": 200,
    "pool_table": 150,
    "gun_safe": 100,
    "hot_tub": 300
  }'::jsonb,

  -- Distance/travel
  travel_fee_per_mile NUMERIC DEFAULT 2.50,
  minimum_travel_fee NUMERIC DEFAULT 50,

  -- Packing services
  packing_rate_per_box NUMERIC DEFAULT 10,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Modify Existing Tables:

```sql
-- Add company_id to all core tables
ALTER TABLE projects ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE quotes ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE uploads ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE custom_upsells ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_quotes_company_id ON quotes(company_id);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);
CREATE INDEX idx_company_members_user_id ON company_members(user_id);
```

#### New RLS Policies:

```sql
-- Companies: Only members can view their company
CREATE POLICY "Company members can view their company"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = companies.id
      AND company_members.user_id = auth.uid()
      AND company_members.is_active = true
    )
  );

-- Only owners/admins can update company
CREATE POLICY "Owners and admins can update company"
  ON companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = companies.id
      AND company_members.user_id = auth.uid()
      AND company_members.role IN ('owner', 'admin')
      AND company_members.is_active = true
    )
  );

-- Projects: Company members can view all projects
CREATE POLICY "Company members can view all company projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = projects.company_id
      AND company_members.user_id = auth.uid()
      AND company_members.is_active = true
    )
  );

-- Sales reps can only update their own projects
CREATE POLICY "Sales reps can update own projects"
  ON projects FOR UPDATE
  USING (
    projects.user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = projects.company_id
      AND company_members.user_id = auth.uid()
      AND company_members.role IN ('owner', 'admin', 'manager')
      AND company_members.is_active = true
    )
  );

-- Similar policies for quotes, uploads, etc.
```

---

### Phase 1B: Authentication & Onboarding Flow (3-4 hours)

#### Files to Create:

1. **`src/lib/companyService.ts`** - Company CRUD operations
```typescript
export class CompanyService {
  static async createCompany(data: CreateCompanyInput): Promise<Company>
  static async getCompanyForUser(userId: string): Promise<Company | null>
  static async updateCompany(companyId: string, updates: UpdateCompanyInput): Promise<Company>
  static async inviteMember(companyId: string, email: string, role: Role): Promise<Invitation>
  static async acceptInvitation(token: string, userId: string): Promise<void>
  static async getCompanyMembers(companyId: string): Promise<CompanyMember[]>
  static async updateMemberRole(memberId: string, role: Role): Promise<void>
  static async deactivateMember(memberId: string): Promise<void>
}
```

2. **`src/contexts/CompanyContext.tsx`** - Global company state
```typescript
interface CompanyContextValue {
  company: Company | null;
  userRole: Role | null;
  isLoading: boolean;
  canManageUsers: boolean;
  canEditPricing: boolean;
  canViewAllQuotes: boolean;
}
```

3. **`src/pages/OnboardingPage.tsx`** - Multi-step company setup
   - Step 1: Company details
   - Step 2: Pricing configuration (optional, skip for now)
   - Step 3: Invite team members (optional)

4. **`src/pages/AdminDashboard.tsx`** - Team management UI
   - List all team members
   - Invite new members
   - Change roles
   - Deactivate users

---

### Phase 1C: Migration Strategy for Existing Users (1-2 hours)

**Data Migration Script:**
```sql
-- For each existing user, create a company
INSERT INTO companies (company_name, admin_user_id, company_email, company_phone, company_logo_url)
SELECT
  cs.company_name,
  u.id as admin_user_id,
  cs.company_email,
  cs.company_phone,
  cs.company_logo_url
FROM auth.users u
LEFT JOIN company_settings cs ON cs.user_id = u.id;

-- Add each user as owner of their company
INSERT INTO company_members (company_id, user_id, role, full_name, email, is_active, joined_at)
SELECT
  c.id as company_id,
  u.id as user_id,
  'owner' as role,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.email,
  true as is_active,
  NOW() as joined_at
FROM auth.users u
JOIN companies c ON c.admin_user_id = u.id;

-- Update all existing projects/quotes with company_id
UPDATE projects p
SET company_id = cm.company_id
FROM company_members cm
WHERE cm.user_id = p.user_id;

UPDATE quotes q
SET company_id = cm.company_id
FROM company_members cm
WHERE cm.user_id = q.user_id;
```

---

## PART 2: DATA LOGGING & ACCURACY IMPROVEMENT

### Phase 2A: Detection & Quote Logging (2-3 hours)

#### New Tables:

```sql
-- 1. Detection logs (every AI detection run)
CREATE TABLE detection_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('mls', 'manual_upload', 'customer_upload')),

  -- Photos
  photo_count INTEGER NOT NULL,
  photo_urls TEXT[] NOT NULL,
  photo_quality_metrics JSONB, -- {avg_resolution, lighting_score, angle_score}

  -- Detection results
  detected_items JSONB NOT NULL, -- Array of detections with confidence scores
  total_items_detected INTEGER NOT NULL,
  rooms_classified JSONB, -- {living_room: [...], bedroom_1: [...]}
  room_count INTEGER,

  -- AI performance
  detection_time_ms INTEGER, -- How long AI took
  model_version TEXT DEFAULT 'gpt-4o-2024-08-06',

  -- Property context
  property_address TEXT,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  sqft INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Quote outcomes (track quote → booking conversion)
CREATE TABLE quote_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  detection_log_id UUID REFERENCES detection_logs(id),

  -- Estimated values (from AI)
  estimated_cubic_feet NUMERIC,
  estimated_hours NUMERIC,
  estimated_truck_size TEXT,
  estimated_price NUMERIC,

  -- Outcome
  status TEXT NOT NULL CHECK (status IN ('sent', 'viewed', 'booked', 'lost', 'expired')),

  -- If booked:
  booked_at TIMESTAMPTZ,
  move_date DATE,

  -- If lost:
  lost_reason TEXT, -- 'price_too_high', 'used_competitor', 'changed_mind', 'other'
  lost_notes TEXT,

  -- Actual move data (filled after move completes)
  actual_cubic_feet NUMERIC,
  actual_hours NUMERIC,
  actual_truck_size TEXT,
  actual_price NUMERIC,
  actual_items JSONB, -- What was actually moved

  -- Variance tracking
  cubic_feet_variance NUMERIC, -- (actual - estimated) / estimated * 100
  hours_variance NUMERIC,
  price_variance NUMERIC,

  -- Feedback
  items_missed JSONB, -- Items AI didn't detect but were there
  items_extra JSONB, -- Items AI detected but weren't there
  rep_notes TEXT,

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI accuracy metrics (aggregated daily)
CREATE TABLE ai_accuracy_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,

  -- Overall stats
  total_detections INTEGER NOT NULL DEFAULT 0,
  total_quotes_sent INTEGER NOT NULL DEFAULT 0,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC, -- bookings / quotes_sent

  -- Accuracy metrics (from completed moves)
  avg_cubic_feet_variance NUMERIC,
  avg_hours_variance NUMERIC,
  avg_price_variance NUMERIC,

  -- Detection quality
  avg_detection_time_ms INTEGER,
  avg_items_per_detection NUMERIC,
  avg_confidence_score NUMERIC,

  -- Source breakdown
  mls_detections INTEGER DEFAULT 0,
  manual_upload_detections INTEGER DEFAULT 0,
  customer_upload_detections INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(date)
);
```

---

### Phase 2B: Post-Move Feedback Form (1-2 hours)

#### New Component: `src/components/PostMoveFeedbackForm.tsx`

**Trigger:**
- When quote status changes to "booked" → show reminder to collect data after move
- Rep clicks "Move Completed" button → opens feedback form

**Form Fields:**
```typescript
interface PostMoveFeedback {
  actualCubicFeet: number;
  actualHours: number;
  actualTruckSize: 'small' | 'medium' | 'large' | 'xlarge';
  actualPrice: number;

  itemsMissed: Array<{
    name: string;
    quantity: number;
    room: string;
  }>;

  itemsExtra: Array<{
    name: string; // Items AI detected but weren't there
    quantity: number;
  }>;

  repNotes?: string;
}
```

**60-Second Quick Form UI:**
```
┌─────────────────────────────────────────────┐
│  Move Completed - Help Improve Accuracy    │
│                                             │
│  Actual cubic feet: [___] (Est: 500 cf)   │
│  Actual hours: [___] (Est: 4 hrs)          │
│  Actual truck: [Medium ▼] (Est: Medium)    │
│  Final price: $[___] (Est: $450)           │
│                                             │
│  Items we missed:                          │
│  [+ Add item] (Optional)                   │
│                                             │
│  Items that weren't there:                 │
│  [+ Add item] (Optional)                   │
│                                             │
│  Notes: [____________] (Optional)          │
│                                             │
│  [Skip for Now]  [Submit & Close]         │
└─────────────────────────────────────────────┘
```

---

### Phase 2C: Analytics Dashboard (2-3 hours)

#### New Page: `src/pages/AnalyticsDashboard.tsx`

**Metrics to Show:**

1. **Conversion Funnel**
   ```
   Quotes Created: 150
   ↓
   Quotes Sent: 120
   ↓
   Quotes Viewed: 90
   ↓
   Quotes Booked: 30 (25% conversion)
   ```

2. **AI Accuracy**
   ```
   Avg Cubic Feet Variance: +8% (AI slightly overestimates)
   Avg Hours Variance: -5% (AI slightly underestimates)
   Avg Price Variance: +3%
   ```

3. **Detection Performance**
   ```
   Avg Detection Time: 12 seconds
   Avg Items per Detection: 42
   Most Missed Items: [Piano, Pool Table, Workout Equipment]
   Most False Positives: [Decorative items counted as furniture]
   ```

4. **Business Insights**
   ```
   Top Loss Reasons:
   - Price too high: 40%
   - Used competitor: 30%
   - Changed mind: 20%
   - Other: 10%
   ```

---

## IMPLEMENTATION STRATEGY

### Recommended Phased Rollout:

**Week 1-2: Foundation**
- ✅ Create database schema
- ✅ Build CompanyService
- ✅ Add CompanyContext
- ✅ Migrate existing users

**Week 3: Team Management**
- ✅ Build invitation flow
- ✅ Create AdminDashboard
- ✅ Test role-based access

**Week 4: Data Logging**
- ✅ Add detection logging to AI workflow
- ✅ Create quote outcome tracking
- ✅ Build post-move feedback form

**Week 5: Analytics**
- ✅ Build analytics dashboard
- ✅ Create daily aggregation cron job
- ✅ Add AI accuracy reports

**Week 6: Polish & Launch**
- ✅ Test multi-user workflows
- ✅ Documentation
- ✅ Launch to beta users

---

## KEY ARCHITECTURAL DECISIONS

### 1. **Migration Strategy**
- **Backward compatible**: Existing single-user accounts become "companies" with one owner
- **No breaking changes**: Current users see no difference until they invite team members
- **Gradual rollout**: Can enable multi-user features company-by-company

### 2. **Role-Based Access**
```typescript
const permissions = {
  owner: {
    canManageUsers: true,
    canEditPricing: true,
    canViewAllQuotes: true,
    canDeleteCompany: true
  },
  admin: {
    canManageUsers: true,
    canEditPricing: true,
    canViewAllQuotes: true,
    canDeleteCompany: false
  },
  manager: {
    canManageUsers: false,
    canEditPricing: false,
    canViewAllQuotes: true,
    canDeleteCompany: false
  },
  sales_rep: {
    canManageUsers: false,
    canEditPricing: false,
    canViewAllQuotes: false, // Only see their own
    canDeleteCompany: false
  }
};
```

### 3. **Data Ownership**
- **Company owns**: All quotes, projects, uploads, pricing rules
- **User creates**: Individual quotes/projects (but company can see all)
- **Analytics are company-wide**: Admins see aggregated data from all reps

### 4. **Logging Strategy**
- **Automatic**: Log every AI detection run (no manual work)
- **Optional feedback**: Post-move form is optional but incentivized
- **Daily aggregation**: Run cron job to calculate daily metrics

---

## COMPETITIVE MOAT

### Why This Creates a Moat:

1. **Network Effects**: More data → Better AI → More accurate quotes → More bookings → More data
2. **Switching Costs**: Once you've trained the AI on your specific market/items, leaving means starting over
3. **Intelligence Layer**: You'll know:
   - Which items AI consistently misses
   - Optimal pricing for different property types
   - Conversion rates by quote source (MLS vs customer upload)
   - Which reps are most accurate
4. **Business Intelligence**: Competitors can copy UI, but can't copy your data insights

### Example Insights You'll Have (That Competitors Won't):

- "3-bedroom homes in Brooklyn average 650 cf, not 500 cf"
- "Customer uploads have 15% more items than MLS photos (people hide clutter for listings)"
- "Piano bookings have 40% higher cancellation rates (customers underestimate difficulty)"
- "Rep John has 5% better accuracy than team average (maybe he does property visits?)"

---

## NEXT STEPS

1. **Review & Approve** this plan
2. **Prioritize**: Which phase to start first?
3. **Timeline**: How fast do you want to move?
4. **Testing**: Beta companies to test multi-user with?

**My Recommendation:**
Start with Phase 1A (database schema) since it's the foundation for everything else. We can build and test incrementally from there.

Ready to start building? 🚀
