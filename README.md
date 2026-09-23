# SDK Orchestration Hub — Subaga Digital Kreatif

Platform orkestrasi proyek dan manajemen sumber daya digital terpusat untuk **PT Subaga Digital Kreatif**, dibangun dengan arsitektur modern, performa tinggi, dan integrasi cloud real-time Supabase.

> 🎓 **Konteks Proyek**: Aplikasi ini dikembangkan sebagai **Tugas Besar Program Magang Industri** dengan klien dan penerima manfaat langsung adalah **PT Subaga Digital Kreatif**.

---

## 👥 Tim Pengembang Magang (Internship Development Team)

Aplikasi ini dirancang, dibangun, dan diuji secara kolaboratif oleh tim magang dengan pembagian peran utama dan tugas pendukung sebagai berikut:

| Nama Anggota | Peran Utama | Tugas & Tanggung Jawab Utama |
|---|---|---|
| **Naufal Azka Pradifa Utomo** | **Backend Developer** | • Perancangan & Pemodelan Skema Basis Data Relasional PostgreSQL (Supabase)<br>• REST API Services & Sinkronisasi Event Real-Time (Supabase Subscriptions)<br>• Autentikasi, Keamanan, Row Level Security (RLS) & Multi-Tenant Isolation Scoping<br>• Manajemen Environment, Cloud Storage Buckets, & Maintenance Database |
| **Hadid Firdaus** | **UI/UX Designer** | • Riset Kebutuhan Pengguna (*User Research*) & Pemetaan Alur Pengguna (*User Journey*)<br>• Penyusunan Design System (Color Tokens, Tipografi, Mode Gelap & Terang)<br>• Desain Wireframe, High-Fidelity Mockup, dan Prototype Interaktif<br>• Pengujian Kegunaan (*Usability Testing*), Aset Grafis, & Ilustrasi Panduan Pengguna |
| **Muhammad Abrurrahman Arrody** | **Frontend Developer** | • Rekayasa Frontend dengan React 19, TypeScript, Vite, dan Tailwind CSS v4<br>• Arsitektur State Management Global (`AuthContext`, `ProjectContext`, `NotificationContext`)<br>• Implementasi Fitur Interaktif (Kanban Drag-and-Drop `@dnd-kit`, Live Gantt Timeline, Filter Dinamis)<br>• **Lead Quality Assurance (QA)**: Audit Kualitas, End-to-End Testing, & Validasi RBAC<br>• Integrasi Progressive Web App (PWA) & Optimasi Responsif Multi-Perangkat |

> 🤝 **Kolaborasi Bersama**: Seluruh anggota tim juga turut aktif menjalankan pengujian silang (*cross-testing* QA), perbaikan bug berkala, integrasi deployment Vercel/ngrok, dan penulisan dokumentasi teknis serta manual operasional.

---

## 🏢 Klien Proyek
- **Klien / Organisasi**: PT Subaga Digital Kreatif
- **Alamat**: Talavera Office Park 28th Floor, Jl. T. B. Simatupang Kav. 22–26, Jakarta Selatan 12430
- **Website**: [www.subagakreatif.com](https://www.subagakreatif.com)

---

## 🚀 Ringkasan Sistem & Fitur Utama

1. **Role-Based Access Control (RBAC) & Multi-Tenant Isolation**:
   - **ADMIN**: Akses penuh ke seluruh konfigurasi, audit log, manajemen user, klien, template, dashboard eksekutif, dan analitik performa.
   - **PROJECT_LEAD**: Memimpin proyek binaan, kontrol sprint Kanban, penyeimbangan beban kerja tim, approval deliverable, dan komunikasi langsung dengan klien.
   - **STAFF**: Pelacakan tugas personal, presensi jam kerja (Clock-in / Clock-out) real-time, dan pembaruan progres pengerjaan.
   - **CLIENT**: Akses terisolasi khusus ke **Client Cockpit** untuk memantau milestone deliverable, menyetujui hasil kerja, mengunggah berkas kebutuhan, atau mengajukan revisi. *Klien hanya dapat melihat proyek miliknya sendiri.*

2. **Papan Orkestrasi (Kanban Pipeline)**:
   - Manajemen tugas drag-and-drop (`@dnd-kit`).
   - Tahapan alur: *BACKLOG, TODO, IN_PROGRESS, CODE_REVIEW, TESTING, DEPLOYED, DONE*.
   - Fitur penanda status terhambat (*Blocked*) dan penanda menunggu respon klien (*Waiting for Client*).

3. **Sumber Daya & Jadwal (Live Gantt Timeline)**:
   - Visualisasi jadwal proyek dan alokasi tim berbasis Mingguan (7 hari) dan Bulanan.
   - Penanda dinamis waktu sekarang (*Today Marker*) dan deteksi otomatis konflik jadwal (*Conflict Detection*).

4. **Kokpit Klien (Client Cockpit)**:
   - Portal transparansi deliverable proyek khusus mitra klien.
   - Alur persetujuan (*Approval Workflow*) dan pengajuan revisi dengan estimasi delay.

5. **Komunikasi & Realtime Collaboration**:
   - **Realtime Chat**: Saluran chat grup internal dan kolaborasi klien dengan lampiran dokumen dan konversi chat menjadi tugas (*Chat-to-Task Bridge*).
   - **Presensi & Jam Kerja**: Timer shift kerja aktif dan pencatatan riwayat alokasi jam kerja tim per tugas.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Visualisasi**: Recharts (Project Progress, Status Distribution, Health Metrics)
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **Backend & Database**: Supabase (PostgreSQL 15+, Row Level Security, Storage, Realtime Engine)
- **Notifikasi**: Sonner Toast Notifications
- **Linter & Compiler**: Oxlint, TypeScript compiler (`tsc`)

---

## 📦 Menjalankan Proyek Secara Lokal

### 1. Prasyarat Sistem
- Node.js v20.19+ atau v22+
- npm (v10+) atau pnpm
- Git

### 2. Kloning Repositori & Install Dependensi
```bash
git clone https://github.com/Naufalazka17/SDK-Hub.git
cd SDK-Hub
npm install
```

### 3. Konfigurasi Environment (`.env`)
Buat berkas `.env` pada root direktori:
```env
# URL & Kunci Publik Supabase
VITE_SUPABASE_URL=https://txalmuvcfihqxvydford.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YWxtdXZjZmlocXh2eWRmb3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NzA2MjgsImV4cCI6MjEwNDU0NjYyOH0.vYBTQJXD7LSx1hKECDqyVWknmZtDj6PTjuUiGK92Nho
```
> 💡 *Aplikasi saat ini telah terhubung ke cloud Supabase pengembang. Jika Anda ingin menggunakan database Supabase Anda sendiri, ikuti bagian **Setup & Migrasi Database Supabase** di bawah.*

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Akses aplikasi melalui peramban web di `http://localhost:5173`.

### 5. Validasi & Build Produksi
```bash
# Pengecekan Type Integrity
npx tsc --noEmit

# Validasi Linting
npm run lint

# Build Bundle Produksi
npm run build
```

---

## 🗄️ Setup, Migrasi & Seed Database Supabase

Jika Anda ingin menyiapkan instansi database Supabase baru secara mandiri, ikuti langkah-langkah di bawah ini:

### 1. Pembuatan Proyek Baru di Supabase
1. Buka [https://supabase.com](https://supabase.com) dan login ke akun Anda.
2. Klik **New Project**, tentukan organisasi Anda, beri nama proyek (misal: `SDK-Hub`), dan pilih Region terdekat (misal: `Singapore`).
3. Tentukan kata sandi database yang aman.
4. Setelah proyek selesai dibuat (~2 menit), buka **Project Settings** (ikon gerigi) → **API**.
5. Salin **Project URL** ke `VITE_SUPABASE_URL` dan **anon / public key** ke `VITE_SUPABASE_ANON_KEY` di file `.env` Anda.

### 2. Setup Storage Bucket
Aplikasi menggunakan Supabase Storage untuk menyimpan dokumen deliverable, lampiran chat, dan foto profil.
1. Buka menu **Storage** pada panel kiri Supabase Dashboard.
2. Klik **New Bucket**, beri nama: `sdk-files`.
3. Aktifkan opsi **Public bucket** (agar URL berkas dan avatar dapat diakses publik oleh aplikasi).
4. Klik **Save**.

---

### 3. Migrasi Skema Database (DDL Migration)
Buka menu **SQL Editor** pada Supabase Dashboard, klik **New query**, lalu salin dan jalankan (*Run*) seluruh skrip SQL migrasi berikut:

```sql
-- ========================================================
-- 1. TABEL ROLES
-- ========================================================
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

INSERT INTO roles (id, name, description) VALUES
  ('ADMIN', 'Administrator', 'Akses penuh ke seluruh konfigurasi dan data sistem'),
  ('PROJECT_LEAD', 'Project Lead', 'Mengelola proyek, tugas, alokasi tim, dan komunikasi klien'),
  ('STAFF', 'Staff Engineer', 'Mengerjakan tugas operasional, presensi jam kerja, dan chat'),
  ('CLIENT', 'Client PIC', 'Akses portal Client Cockpit, berkas, revisi, dan approval')
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- 2. TABEL CLIENTS (MITRA KLIEN)
-- ========================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  pic_name TEXT NOT NULL,
  pic_email TEXT NOT NULL,
  pic_phone TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 3. TABEL PROFILES (PENGGUNA SISTEM)
-- ========================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role_id TEXT REFERENCES roles(id) DEFAULT 'STAFF',
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  avatar_url TEXT,
  department TEXT,
  position TEXT,
  phone TEXT,
  max_weekly_hours INTEGER DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 4. TABEL PROJECTS (PROYEK)
-- ========================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  stage TEXT DEFAULT 'PITCHING',
  delivery_model TEXT DEFAULT 'Custom',
  template_type TEXT DEFAULT 'Blank Workflow',
  health_score INTEGER DEFAULT 95,
  progress_percentage INTEGER DEFAULT 0,
  budget NUMERIC DEFAULT 0,
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 5. TABEL PROJECT STAGES & MEMBERS
-- ========================================================
CREATE TABLE IF NOT EXISTS project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  position_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_in_project TEXT DEFAULT 'Contributor',
  allocated_hours_per_week NUMERIC DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 6. TABEL TASKS (TUGAS KANBAN)
-- ========================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stage_key TEXT DEFAULT 'BACKLOG',
  status TEXT DEFAULT 'TODO',
  priority TEXT DEFAULT 'MEDIUM',
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  estimated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  position_order INTEGER DEFAULT 0,
  start_date DATE,
  due_date DATE,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,
  is_waiting_for_client BOOLEAN DEFAULT FALSE,
  client_waiting_since TIMESTAMPTZ,
  source_message_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 7. TABEL MILESTONES & TIMELINES
-- ========================================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 8. TABEL TIME ENTRIES (PRESENSI & JAM KERJA)
-- ========================================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 9. TABEL FILES & DOCUMENTS
-- ========================================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Deliverables',
  storage_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  mime_type TEXT,
  is_confidential BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 10. TABEL CHAT & NOTIFIKASI
-- ========================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'SYSTEM',
  is_read BOOLEAN DEFAULT FALSE,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 11. TABEL APPROVALS, REVISIONS & AUDIT LOGS
-- ========================================================
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Pending',
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  decision_notes TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  approval_id UUID REFERENCES approvals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT NOT NULL,
  impact_level TEXT DEFAULT 'MODERATE',
  status TEXT DEFAULT 'Open',
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON projects FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON tasks FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON time_entries FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON files FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON messages FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON notifications FOR SELECT USING (true);

CREATE POLICY "Allow All Inserts" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow All Inserts" ON time_entries FOR ALL USING (true);
CREATE POLICY "Allow All Inserts" ON files FOR ALL USING (true);
CREATE POLICY "Allow All Inserts" ON messages FOR ALL USING (true);
CREATE POLICY "Allow All Inserts" ON notifications FOR ALL USING (true);

-- ========================================================
-- 13. ENABLE REALTIME ENGINE
-- ========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE time_entries;
```

---

### 4. Seeding Data Awal (Initial Seed)
Setelah DDL migration selesai, buat query baru di **SQL Editor** dan jalankan skrip seed data berikut untuk membuat akun demo, klien, dan proyek acuan:

```sql
-- 1. SEED DATA MITRA KLIEN
INSERT INTO clients (id, name, company, pic_name, pic_email, pic_phone) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'RSUD Kota Digital', 'PT Medika Sejahtera Digital', 'dr. Budi Santoso, Sp.A', 'dr.budi@rsud-sehat.id', '+62 811-2345-6789'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Kementerian Komunikasi & Informatika', 'Ditjen Aplikasi Informatika', 'Ir. Hendra Wijaya, M.Kom', 'hendra@kominfo.go.id', '+62 812-9876-5432'),
  ('8e816f28-4f81-40d7-9aeb-c5a6b401e60f', 'Subaga Digital Kreatif', 'PT Subaga Digital Kreatif', 'Arya Subaga', 'arya.admin@subaga.id', '+62 813-1122-3344')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED DATA PROFIL PENGGUNA
INSERT INTO profiles (id, email, full_name, role_id, client_id, department, position) VALUES
  ('11111111-1111-1111-1111-111111111111', 'arya.admin@subaga.id', 'Arya Subaga', 'ADMIN', NULL, 'Executive Management', 'Chief Executive Officer'),
  ('22222222-2222-2222-2222-222222222222', 'ulba.lead@subaga.id', 'Ulba', 'PROJECT_LEAD', NULL, 'Project Management', 'Senior Project Lead'),
  ('44444444-4444-4444-4444-444444444444', 'andi.qa@subaga.id', 'Andi Kusuma', 'STAFF', NULL, 'Quality Assurance', 'Lead QA Engineer'),
  ('33333333-3333-3333-3333-333333333333', 'mukhlis.dev@subaga.id', 'Mukhlis Pratama', 'STAFF', NULL, 'Engineering', 'Senior Fullstack Engineer'),
  ('55555555-5555-5555-5555-555555555555', 'dina.designer@subaga.id', 'Dina Lestari', 'STAFF', NULL, 'Product Design', 'UI/UX Designer'),
  ('66666666-6666-6666-6666-666666666666', 'dr.budi@rsud-sehat.id', 'dr. Budi Santoso', 'CLIENT', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Stakeholder Eksternal', 'Direktur IT & Transformasi Digital RSUD')
ON CONFLICT (email) DO NOTHING;

-- 3. SEED PROFIL TIM MAGANG (INTERNSHIP CREATORS)
INSERT INTO profiles (email, full_name, role_id, department, position) VALUES
  ('naufal.backend@subaga.id', 'Naufal Azka Pradifa Utomo', 'STAFF', 'Engineering', 'Backend Developer & Database Architect (Intern)'),
  ('hadid.designer@subaga.id', 'Hadid Firdaus', 'STAFF', 'Product Design', 'UI/UX Designer & Researcher (Intern)'),
  ('arrody.frontend@subaga.id', 'Muhammad Abrurrahman Arrody', 'STAFF', 'Engineering', 'Frontend Developer & QA Lead (Intern)')
ON CONFLICT (email) DO NOTHING;

-- 4. SEED DATA PROYEK
INSERT INTO projects (id, code, title, description, client_id, lead_id, stage, delivery_model, health_score, progress_percentage, budget, start_date, target_end_date) VALUES
  (
    '10101010-1010-1010-1010-101010101010',
    'SDK-PRJ-2026-001',
    'Sistem Informasi Kesehatan RSUD',
    'Pengembangan sistem rekam medis elektronik (RME) terintegrasi SatuSehat Kemenkes dan bridging BPJS VClaim.',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'DEVELOPMENT',
    'Custom Development',
    98,
    75,
    350000000,
    '2026-01-15',
    '2026-10-31'
  ),
  (
    '20202020-2020-2020-2020-202020202020',
    'SDK-PRJ-2026-002',
    'Social Analysis Big Data & Sentiment',
    'Pipeline pengolahan opini publik berbasis AI dan analitik percakapan media sosial untuk analisis sentimen nasional.',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'UAT',
    'Subscription Service',
    88,
    90,
    500000000,
    '2026-02-01',
    '2026-09-30'
  )
ON CONFLICT (id) DO NOTHING;

-- 5. SEED TAHAPAN MILESTONE
INSERT INTO milestones (project_id, title, description, target_date, is_completed) VALUES
  ('10101010-1010-1010-1010-101010101010', 'Sprint 1: Modul Rekam Medis Elektronik', 'Penyusunan format RME sesuai standar Kemenkes', '2026-03-31', TRUE),
  ('10101010-1010-1010-1010-101010101010', 'Sprint 2: Bridging SatuSehat FHIR API', 'Integrasi API sandbox SatuSehat untuk Encounter & Condition', '2026-06-30', TRUE),
  ('10101010-1010-1010-1010-101010101010', 'Sprint 3: Modul Farmasi & E-Prescription', 'Manajemen stok obat FIFO dan e-resep poliklinik', '2026-09-15', FALSE),
  ('10101010-1010-1010-1010-101010101010', 'Sprint 4: UAT & Production Handover', 'Pengujian pengguna akhir dan serah terima produksi', '2026-10-31', FALSE)
ON CONFLICT DO NOTHING;
```

---

## 🔑 Kredensial Uji Coba Default

Seluruh akun default menggunakan kata sandi: `password123`

| Peran (Role) | Nama Pengguna | Alamat Email | Password | Halaman Awal (*Default Landing*) |
|---|---|---|---|---|
| **ADMIN** | Arya Subaga | `arya.admin@subaga.id` | `password123` | Dashboard Eksekutif (`/`) |
| **PROJECT_LEAD** | Ulba | `ulba.lead@subaga.id` | `password123` | Dashboard Project Lead (`/`) |
| **STAFF** | Andi Kusuma | `andi.qa@subaga.id` | `password123` | Dashboard Staf (`/`) |
| **CLIENT** | dr. Budi Santoso | `dr.budi@rsud-sehat.id` | `password123` | Kokpit Klien (`/cockpit`) |

---

## 📄 User Manual & Panduan Lengkap

Dokumentasi pengguna komprehensif (User Manual) tersedia dalam dua format di folder `docs/`:
- **Versi Interaktif Web**: [`docs/user-manual.html`](docs/user-manual.html) (Mendukung navigasi bab dan pencarian)
- **Versi Cetak / PDF Resmi**: [`docs/SDK-Orchestration-Hub-User-Manual-v2.5.pdf`](docs/SDK-Orchestration-Hub-User-Manual-v2.5.pdf) (Tercetak rapi standar A4 sebanyak 56+ halaman berbobot 9.99 MB)
- **Panduan Instalasi & Deployment Lanjutan**: [`docs/README.md`](docs/README.md)

---

## 🛡️ Kebijakan Keamanan & Reset Formulir

- **Form Reset Policy**: Seluruh modal formulir input (Tambah Tugas, Tambah Klien, Tambah User, Tambah Resource, Upload Berkas) secara otomatis mengosongkan nilai input saat ditutup maupun setelah berhasil submit.
- **Proteksi Multi-Tenant Role CLIENT**: Klien secara otomatis dialihkan ke `/cockpit` dan **hanya dapat melihat dan memilih proyek yang terdaftar atas nama organisasinya**.
- **Anon Key Only**: Frontend sepenuhnya beroperasi menggunakan `VITE_SUPABASE_ANON_KEY` dengan lapisan proteksi Row Level Security (RLS) di database PostgreSQL.

---

© 2026 PT Subaga Digital Kreatif. Seluruh hak cipta dilindungi. Dikembangkan oleh Tim Magang: Naufal Azka Pradifa Utomo, Hadid Firdaus, Muhammad Abrurrahman Arrody.
