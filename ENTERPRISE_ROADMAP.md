# 🚀 MovSense Enterprise - Product Roadmap

**Generated from:** Enterprise User Walkthrough
**Date:** November 20, 2025
**Perspective:** Growing moving company with 15 trucks, multiple sales reps, managers

---

## 🔴 IMMEDIATE (Fix Now - Security & Blockers)

### 1. Fix Security Vulnerabilities ⚠️ **CRITICAL**
**Problem:** Major security holes found in audit
- Anyone can view ALL quotes (RLS policy: `USING (true)`)
- All uploaded photos are publicly readable
- GDPR/privacy violation risk

**Impact:** Data leakage, legal liability, customer trust

**Solution:**
```sql
-- Remove public quote access
DROP POLICY "Anyone can view quotes by ID" ON movsense.quotes;

-- Add token-based access for customers
CREATE POLICY "Customers can view quotes via token"
  ON movsense.quotes
  FOR SELECT
  USING (
    share_token = current_setting('request.headers')::json->>'x-quote-token'
  );

-- Restrict storage to authenticated users
DROP POLICY "Public can read all files";
CREATE POLICY "Authenticated users can read files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'property-uploads');
```

**Estimated Time:** 2-4 hours

---

### 2. Fix User Invitation Flow ⚠️ **BLOCKER**
**Problem:** User invitation edge function failed in walkthrough (0/5 invites succeeded)

**Likely Issues:**
- RPC function might not exist or have wrong parameters
- Email service not configured
- invite-user edge function needs debugging

**Solution:**
- Debug invite-user edge function logs
- Verify email service (Resend API) setup
- Add better error handling and logging

**Estimated Time:** 2-3 hours

---

## 🟠 PHASE 1: Core Enterprise Features (Weeks 1-4)

### Week 1: Company Dashboard & Analytics

#### 1.1 Executive Dashboard 📊 **CRITICAL**
**Why:** Owners need to see business health at a glance

**Features:**
- Monthly revenue vs. target (with trend graph)
- Quote-to-close conversion rate
- Top performing sales reps leaderboard
- Active quotes pipeline value
- Scheduled jobs this week/month
- Revenue by service type (local vs. long distance)

**Wireframe:**
```
┌─────────────────────────────────────────────────────┐
│  AUSTIN ELITE MOVERS - November 2025                │
├───────────┬──────────────┬──────────────┬───────────┤
│ Revenue   │ Quotes This  │ Conversion   │ Avg Quote │
│ $125,450  │ Month: 47    │ Rate: 68%    │ $2,670    │
│ +15% ↑    │ +8 from last │ ↑ 5%         │ +$200     │
└───────────┴──────────────┴──────────────┴───────────┘

┌──────────────────────┐  ┌──────────────────────────┐
│ Revenue Trend        │  │ Top Performers           │
│ [Line graph]         │  │ 1. Mike R.    $45K  ⭐   │
│                      │  │ 2. Jessica C. $38K       │
│                      │  │ 3. David T.   $35K       │
└──────────────────────┘  └──────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Pipeline Value by Stage                              │
│ New Leads: $125K | Quoted: $89K | Won: $67K         │
│ [Progress bars]                                      │
└─────────────────────────────────────────────────────┘
```

**Database Changes:**
- Add `quotes.status` enum: `new_lead`, `quoted`, `followed_up`, `won`, `lost`
- Add `quotes.quoted_amount` (vs. final `actual_price`)
- Add `quotes.assigned_to` (user_id of sales rep)

**Estimated Time:** 5-7 days

---

#### 1.2 Sales Rep Performance Tracking 📈 **HIGH**
**Why:** Managers need visibility into team performance

**Features:**
- Rep leaderboard (by revenue, quotes, win rate)
- Individual rep drill-down dashboard
- Commission tracking
- Activity timeline
- Win/loss analysis per rep

**New Tables:**
```sql
CREATE TABLE movsense.commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES movsense.profiles(id),
  quote_id UUID REFERENCES movsense.quotes(id),
  amount DECIMAL(10, 2),
  paid BOOLEAN DEFAULT false,
  paid_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Estimated Time:** 4-6 days

---

### Week 2: Quote Management Enhancements

#### 2.1 Quote Assignment System 🎯 **CRITICAL**
**Why:** With multiple reps, need to route leads effectively

**Features:**
- **Manual Assignment:** Admin/manager assigns quote to specific rep
- **Auto-Assignment:** Round-robin or territory-based
- **Reassignment:** Transfer quote between reps (with history)
- **Team Inbox:** Unassigned quotes pool

**UI:**
```
┌─────────────────────────────────────────┐
│ New Quote from: John Smith              │
│ 📍 1234 Main St, Austin, TX             │
│                                         │
│ Assign to: [Dropdown: All Reps] ▼      │
│                                         │
│ Or use auto-assignment:                 │
│ ○ Round Robin                           │
│ ● Territory (Austin = Mike R.)          │
│                                         │
│ [Assign Quote]                          │
└─────────────────────────────────────────┘
```

**Database Changes:**
- Add `quotes.assigned_to` (user_id)
- Add `quotes.assigned_at` (timestamp)
- Add `quote_assignments` history table

**Estimated Time:** 3-4 days

---

#### 2.2 Quote Pipeline Board (Kanban) 📋 **HIGH**
**Why:** Visual workflow management

**Features:**
- Columns: New Lead → Quote Sent → Follow-up → Won/Lost
- Drag-and-drop between stages
- Filter by rep, date range
- Card shows: customer name, value, age, assigned rep
- Click card for details

**Tech Stack:**
- Use `@dnd-kit/core` for drag-and-drop
- Real-time updates via Supabase subscriptions

**Estimated Time:** 5-7 days

---

#### 2.3 Quote Templates 📄 **HIGH**
**Why:** Faster quoting for common move types

**Features:**
- Save quote as template
- Company-wide templates (admin only)
- Personal templates (per rep)
- Template library: "2BR Apt", "3BR House", "Office Move"
- One-click apply template

**New Tables:**
```sql
CREATE TABLE movsense.quote_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES movsense.companies(id),
  created_by UUID REFERENCES movsense.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB, -- stores detection items, pricing, etc.
  is_company_wide BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Estimated Time:** 3-4 days

---

### Week 3: Scheduling & Resource Management

#### 3.1 Move Scheduling Calendar 📅 **CRITICAL**
**Why:** Coordinate 15 trucks and crews effectively

**Features:**
- Calendar view (day/week/month)
- Drag-and-drop job scheduling
- Assign truck # to job
- Assign crew members
- Conflict detection (double-booking)
- Color-coding by job status
- Export to Google Calendar

**UI Components:**
- FullCalendar.js or React Big Calendar
- Truck availability sidebar
- Crew availability sidebar

**New Tables:**
```sql
CREATE TABLE movsense.trucks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES movsense.companies(id),
  truck_number TEXT NOT NULL,
  license_plate TEXT,
  capacity_cubic_feet INT,
  status TEXT DEFAULT 'available', -- available, in_use, maintenance
  last_maintenance_date DATE,
  next_maintenance_date DATE
);

CREATE TABLE movsense.crew_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES movsense.companies(id),
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT, -- driver, mover, team_lead
  hourly_rate DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE movsense.scheduled_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES movsense.quotes(id),
  company_id UUID REFERENCES movsense.companies(id),
  scheduled_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  truck_id UUID REFERENCES movsense.trucks(id),
  crew_member_ids UUID[], -- array of crew member IDs
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Estimated Time:** 8-10 days

---

### Week 4: Customer Communication

#### 4.1 Email Template Management 📧 **HIGH**
**Why:** Consistent, branded communication

**Features:**
- Rich text editor for templates
- Variables: `{{customer_name}}`, `{{quote_amount}}`, etc.
- Company logo in header
- Custom email signature per rep
- Templates:
  - Quote follow-up (Day 1, 3, 7)
  - Thank you after job
  - Job reminder (day before)
  - Review request
- Preview before send
- Send tracking (opened, clicked)

**New Tables:**
```sql
CREATE TABLE movsense.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES movsense.companies(id),
  created_by UUID REFERENCES movsense.profiles(id),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body HTML NOT NULL,
  category TEXT, -- quote_followup, thank_you, reminder
  is_company_wide BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Integration:** Resend API (already using for invites)

**Estimated Time:** 5-6 days

---

## 🟡 PHASE 2: Advanced Features (Weeks 5-8)

### Week 5: Pricing & Profitability

#### 5.1 Dynamic Pricing Engine 💰 **HIGH**
**Features:**
- Base price calculator (current system)
- Surcharges:
  - Weekend: +15%
  - Holiday: +25%
  - Peak season (May-Sep): +10%
  - Last-minute (< 7 days): +20%
- Distance-based pricing
- Bulk discount (repeat customer)
- Minimum price floor
- Maximum price cap (competitive guardrails)

**New Tables:**
```sql
CREATE TABLE movsense.pricing_modifiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES movsense.companies(id),
  name TEXT NOT NULL,
  modifier_type TEXT, -- surcharge, discount, multiplier
  value DECIMAL(5, 2), -- 15.00 = 15%
  conditions JSONB, -- when to apply
  is_active BOOLEAN DEFAULT true
);
```

**Estimated Time:** 4-5 days

---

#### 5.2 Profit Margin Calculator 📊 **HIGH**
**Features:**
- Input costs:
  - Labor: $X/hour × Y hours
  - Fuel: distance × fuel price
  - Materials: boxes, tape, wrap
  - Truck depreciation
  - Overhead allocation (%)
- Display: Cost / Revenue / Profit / Margin %
- Alert if margin < target (e.g., 30%)
- Historical profit analysis per job type

**Estimated Time:** 3-4 days

---

### Week 6: Reporting & Analytics

#### 6.1 Exportable Reports 📄 **HIGH**
**Reports:**
1. Sales Summary (date range, by rep, by service type)
2. Rep Performance Report
3. Lost Quote Analysis (reason for loss)
4. Customer Acquisition Report
5. Revenue Forecast

**Export Formats:** Excel, PDF, CSV

**Libraries:**
- ExcelJS for Excel generation
- jsPDF for PDF generation

**Estimated Time:** 5-7 days

---

### Week 7-8: Mobile Optimization & UX Polish

#### 7.1 Mobile-Responsive Design 📱 **HIGH**
**Focus Areas:**
- Dashboard works on tablet (iPad)
- Quote creation mobile-friendly
- Calendar works on mobile
- Photo upload from mobile camera
- Touch-friendly drag-and-drop

**Estimated Time:** 6-8 days

---

#### 7.2 UX Improvements
**Quick Wins:**
- User search/filter in user management
- Keyboard shortcuts (Cmd+K global search)
- Dark mode consistency
- Loading states and skeletons
- Better error messages
- Onboarding tour for new users

**Estimated Time:** 4-5 days

---

## 🔵 PHASE 3: Growth Features (Weeks 9-12)

### 8.1 Customer Portal 🌐 **MEDIUM**
**Features:**
- Customer login (magic link)
- View quote status
- Accept/decline quote online
- Upload additional photos
- Message the rep
- Review & rating after job

**Estimated Time:** 7-10 days

---

### 8.2 Integrations 🔌 **MEDIUM**

**QuickBooks Integration:**
- Auto-create invoice when job marked complete
- Sync payments
- Expense tracking

**Google Calendar Sync:**
- Two-way sync of scheduled jobs

**Zapier:**
- Connect to 1000+ apps
- CRM integration
- Lead sources tracking

**Estimated Time:** 10-14 days (per integration)

---

### 8.3 Advanced Features

**SMS Notifications:** Twilio integration
**Mobile App:** React Native version
**GPS Tracking:** Track trucks in real-time
**Customer Reviews:** Auto-request after job
**Referral Program:** Customer referral tracking

---

## 📈 Metrics to Track (Post-Launch)

After each phase, measure:
- Quote creation time (should decrease with templates)
- Quote-to-close rate (should increase with follow-ups)
- Rep productivity (quotes per rep per week)
- Customer satisfaction (NPS score)
- Revenue per truck
- Average job profitability

---

## 🛠️ Tech Stack Recommendations

**Frontend:**
- Calendar: FullCalendar or React Big Calendar
- Drag-and-Drop: @dnd-kit/core
- Charts: Recharts or Chart.js
- Excel Export: ExcelJS
- PDF Export: jsPDF + html2canvas
- Rich Text Editor: TipTap or Quill
- Date Picker: react-datepicker

**Backend:**
- Email: Resend (already using)
- SMS: Twilio
- File Storage: Supabase Storage (already using)
- Real-time: Supabase Subscriptions

**Integrations:**
- QuickBooks: OAuth 2.0 API
- Google Calendar: Google Calendar API
- Zapier: Webhooks

---

## 💰 Estimated Timeline & Effort

| Phase | Duration | Features | Priority |
|-------|----------|----------|----------|
| **Immediate** | 1 week | Security fixes, invite debugging | 🔴 CRITICAL |
| **Phase 1** | 4 weeks | Dashboard, assignment, scheduling | 🟠 HIGH |
| **Phase 2** | 4 weeks | Pricing, reports, mobile UX | 🟡 MEDIUM |
| **Phase 3** | 4 weeks | Portal, integrations | 🔵 GROWTH |

**Total:** ~13 weeks for full enterprise feature set

---

## 🎯 Quick Wins (Can Do in 1-2 Days Each)

1. **Fix security holes** (quote access, storage)
2. **Add user search** in user management
3. **Add quote status dropdown** (New/Quoted/Won/Lost)
4. **Add "Last Login"** column in user table
5. **Add bulk actions** (select multiple quotes, archive)
6. **Add keyboard shortcuts** (Cmd+K search)
7. **Add quote duplicate detection** (warn if same address)
8. **Add rep assignment** to quotes
9. **Add basic export** (quotes to CSV)
10. **Add quote templates** (simple version)

---

## 📝 Recommendations

### Start With:
1. **Fix security issues** (1 day) ← Do this NOW
2. **Build executive dashboard** (1 week) ← High ROI
3. **Add quote assignment** (3 days) ← Critical for teams
4. **Build scheduling calendar** (2 weeks) ← Core need

### Why This Order:
- Security = Trust & compliance
- Dashboard = Visibility & decision-making
- Assignment = Team efficiency
- Scheduling = Operations backbone

Once these 4 are done, you have a **solid enterprise product** that can scale to 100+ employees.

---

**Questions to Consider:**

1. What's your target customer size? (2-5 trucks vs. 10-50 trucks vs. 50+ trucks)
2. What's the #1 pain point for moving companies? (I'd guess: scheduling conflicts)
3. What do competitors charge? (helps with pricing model)
4. Is this B2B SaaS ($99/month) or usage-based ($X per quote)?

Let me know which features you want to tackle first! 🚀
