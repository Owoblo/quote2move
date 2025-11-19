# 🏗️ Project Management Architecture Proposal

## Current Problems

### 1. **Data is Ephemeral (Memory Only)**
- ❌ MLS photos loaded → Not saved to DB → Refresh = Lost
- ❌ Manual uploads → Saved to storage → Not linked to anything → Lost on refresh
- ❌ Customer uploads → Saved but orphaned → Hard to find in Dashboard
- ❌ Detections → Only in browser state → Lost on refresh
- ❌ Inventory edits → Only in browser state → Lost on refresh

### 2. **No Session/Project Tracking**
- ❌ Can't save work-in-progress
- ❌ Can't come back to a quote later
- ❌ Can't manage multiple properties simultaneously
- ❌ Can't see "Today I worked on 123 Main St, 456 Oak Ave"

### 3. **Customer Uploads Not Integrated**
- ✅ Customer uploads photos via link
- ❌ Photos saved but no workflow to process them
- ❌ No notification "John Doe uploaded 15 photos"
- ❌ No easy way to create quote from customer upload

### 4. **Duplicate Data Structures**
- `projects` table exists but only used for save/load (not real-time)
- `uploads` table exists for customer uploads
- `quotes` table has photos as JSONB (not optimal)
- No clear relationship between them

---

## Proposed Solution: Unified Project System

### 🎯 Core Concept: **Everything is a Project**

**Project Lifecycle:**
```
1. Create Project (from MLS, Manual Upload, or Customer Upload)
   ↓
2. Add Photos (auto-saved to DB + Storage)
   ↓
3. Run AI Detection (auto-saved to project)
   ↓
4. Edit Inventory (auto-saved to project)
   ↓
5. Generate Quote (links to project)
   ↓
6. Send to Customer (project marked "sent")
```

---

## Database Schema Updates

### **Update `projects` table:**
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS:
  -- Customer Info
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,

  -- Property Details
  bedrooms INT,
  bathrooms NUMERIC,
  sqft INT,

  -- Source Tracking
  source TEXT CHECK (source IN ('mls', 'manual_upload', 'customer_upload')),
  upload_session_id UUID REFERENCES uploads(id), -- Link to customer upload if applicable

  -- Photos (reference to storage, not JSONB)
  photo_urls TEXT[], -- Array of storage URLs

  -- Workflow Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'detecting', 'editing', 'quote_sent', 'archived')),

  -- Detection State
  detection_completed_at TIMESTAMPTZ,
  rooms_classified JSONB, -- Stores room classification

  -- Quote Reference
  quote_id UUID REFERENCES quotes(id);
```

### **Update `uploads` table:**
```sql
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS:
  -- Link to project when mover processes customer upload
  project_id UUID REFERENCES projects(id);
```

### **Keep `upload_files` as-is** (stores actual file records)

---

## Data Flow

### **Flow 1: MLS Search → Project**
```
User searches MLS address
  → Fetch photos from Zillow/MLS
  → Create project with source='mls'
  → Save photo URLs to projects.photo_urls
  → Display photos (from DB, not memory)
  → User runs detection
  → Save detections to project
  → Auto-save inventory edits
```

### **Flow 2: Manual Upload → Project**
```
User uploads photos manually
  → Upload to Supabase Storage
  → Create upload session
  → Create project with source='manual_upload'
  → Link upload_files to project
  → Save photo URLs to projects.photo_urls
  → Auto-run detection
  → Save results to project
```

### **Flow 3: Customer Upload Link → Project**
```
Mover creates shareable link
  → Upload session created (upload_type='customer')
  → Customer uploads photos
  → Photos saved to upload_files table
  → Upload appears in "Customer Uploads" panel

Mover clicks "Load & Detect":
  → Create project with source='customer_upload'
  → Link project to upload session (project.upload_session_id)
  → Copy photo URLs to project
  → Run detection
  → Save to project
  → Upload marked as "processed"
```

---

## UI Changes

### **Dashboard Tabs:**
```
┌────────────────────────────────────────┐
│ [Active Projects] [Quotes] [Settings]  │ ← Tabs
└────────────────────────────────────────┘

Active Projects Tab:
├─ [+ New Project]  [Import from Customer Upload]
├─ Projects List:
│  ├─ 📍 123 Main St (Draft) - 2 hrs ago
│  │  └─ 15 photos • 42 items detected
│  ├─ 📍 456 Oak Ave (Editing) - 1 day ago
│  │  └─ 8 photos • 31 items detected
│  └─ 📍 789 Pine Rd (Quote Sent) - 3 days ago
│     └─ Quote #Q-12345 sent to John Doe
└─ Customer Uploads (Pending):
   ├─ 🔔 Jane Smith uploaded 12 photos (New!)
   └─ [Load & Create Project]
```

### **Project View:**
```
┌─────────────────────────────────────────────┐
│ Project: 123 Main St                   [⋮]  │
│ Status: Draft • Created 2 hours ago          │
│ ────────────────────────────────────────────│
│ [MLS Search] [Upload Photos] [Edit]         │ ← Modes
│                                              │
│ Property Info:                               │
│ 3 bed • 2 bath • 1,500 sqft                 │
│                                              │
│ Photos (15):                                 │
│ [🖼️] [🖼️] [🖼️] [🖼️] [🖼️]...                │
│                                              │
│ Detections (42 items):                       │
│ Living Room: Sofa, Coffee Table...          │
│ Bedroom 1: King Bed, Dresser...             │
│                                              │
│ [Run Detection] [Generate Quote]            │
│                                              │
│ Auto-saved 5 seconds ago                    │
└─────────────────────────────────────────────┘
```

---

## Implementation Plan

### **Phase 1: Database Migrations** ⏱️ 30 min
- [ ] Update `projects` table schema
- [ ] Add `project_id` to `uploads` table
- [ ] Create indexes for performance
- [ ] Run migrations in Supabase

### **Phase 2: Project Service** ⏱️ 2 hours
- [ ] Create `src/lib/projectService.ts`
  - `createProject()`
  - `updateProject()`
  - `getProject()`
  - `listUserProjects()`
  - `deleteProject()`
  - `addPhotosToProject()`
  - `updateDetections()`
  - `linkCustomerUpload()`

### **Phase 3: Update Dashboard** ⏱️ 3 hours
- [ ] Add "Active Project" state
- [ ] Auto-save on every change
- [ ] Load project on mount (if editing existing)
- [ ] Add "Save Project" before detection
- [ ] Link customer uploads to projects
- [ ] Show project list

### **Phase 4: MLS Integration** ⏱️ 1 hour
- [ ] On MLS search → Create/update project
- [ ] Save photos to project
- [ ] Load photos from project (not fetch again)

### **Phase 5: Manual Upload Integration** ⏱️ 1 hour
- [ ] On manual upload → Create/update project
- [ ] Link upload_files to project
- [ ] Save to database

### **Phase 6: Customer Upload Integration** ⏱️ 1 hour
- [ ] "Load & Detect" → Create project
- [ ] Link upload session to project
- [ ] Mark upload as processed
- [ ] Show in projects list

### **Phase 7: Projects List UI** ⏱️ 2 hours
- [ ] Create ProjectsList component
- [ ] Show all user projects
- [ ] Click to load/edit project
- [ ] Search/filter projects
- [ ] Archive completed projects

---

## Benefits

### ✅ **Data Persistence**
- Everything auto-saved to database
- Never lose work
- Refresh-safe
- Can close browser and come back

### ✅ **Multi-Project Management**
- Work on multiple properties
- Switch between projects
- See all active work

### ✅ **Customer Upload Workflow**
- Customer uploads → Notification
- Click "Create Project" → Process photos
- All in one place

### ✅ **Better Organization**
- See all projects at a glance
- Filter by status (draft, sent, archived)
- Track progress over time

### ✅ **Quote History**
- Projects linked to quotes
- See which quote came from which project
- Reuse project data for new quotes

---

## Migration Strategy

### **Backwards Compatibility**
- Existing quotes still work
- No data loss
- Gradual rollout

### **Data Migration**
- Existing projects table compatible
- New columns nullable
- Can add later

---

## Timeline

| Phase | Time | Priority |
|-------|------|----------|
| Database Migrations | 30 min | 🔴 Critical |
| Project Service | 2 hrs | 🔴 Critical |
| Dashboard Updates | 3 hrs | 🔴 Critical |
| MLS Integration | 1 hr | 🟡 High |
| Manual Upload Integration | 1 hr | 🟡 High |
| Customer Upload Integration | 1 hr | 🟡 High |
| Projects List UI | 2 hrs | 🟢 Medium |

**Total: ~10-12 hours of work**

---

## Questions for You

1. **Should we start with Phase 1 (Database) immediately?**
2. **Do you want projects auto-saved on every change, or manual "Save" button?**
3. **Should customer uploads auto-create projects, or require manual "Create Project" click?**
4. **Any other features you want in project management?**

---

## Next Steps

If approved:
1. I'll create the database migration
2. Build the project service
3. Update Dashboard to use projects
4. Test with MLS, manual upload, and customer uploads
5. Deploy

**Ready to proceed?** 🚀
