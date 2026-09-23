# SDK Orchestration Hub — Installation & Deployment Guide

Panduan instalasi dan deployment lengkap untuk **SDK Orchestration Hub** di perangkat baru (developer & end-user).

> 🎓 **Konteks Proyek**: Aplikasi ini dikembangkan sebagai **Tugas Besar Program Magang Industri** dengan klien dan penerima manfaat langsung adalah **PT Subaga Digital Kreatif**.

---

## 👥 Tim Pengembang Magang (Internship Project Team)

Aplikasi ini dikembangkan dan diuji oleh tim magang dengan pembagian peran:

| Nama Anggota | Peran Utama | Tanggung Jawab Utama |
|---|---|---|
| **Naufal Azka Pradifa Utomo** | **Backend Developer** | Arsitektur Basis Data PostgreSQL (Supabase), REST & Realtime API, Security Middleware & RBAC Multi-Tenant Scoping |
| **Hadid Firdaus** | **UI/UX Designer** | Perancangan Design System, Riset Pengguna, Wireframing, High-Fidelity Prototype, Aset Grafis & Usability Testing |
| **Muhammad Abrurrahman Arrody** | **Frontend Developer** | Rekayasa Frontend React 19 / TypeScript / Vite, Global State Management, Kanban `@dnd-kit`, **Lead Quality Assurance (QA)** & PWA Integration |

*Seluruh anggota tim magang berkolaborasi aktif dalam pengujian mutu (QA Audit), optimasi performa, dan penyusunan dokumentasi.*

---

## 🏢 Klien / Organisasi Penerima Manfaat
- **Perusahaan**: PT Subaga Digital Kreatif
- **Alamat**: Talavera Office Park 28th Floor, Jl. T. B. Simatupang Kav. 22–26, Cilandak Barat, Jakarta Selatan 12430
- **Website**: [www.subagakreatif.com](https://www.subagakreatif.com) • **Email**: admin@subagakreatif.com

---

## 📋 Daftar Isi

1. [Instalasi untuk Developer](#-instalasi-untuk-developer)
2. [Instalasi PWA untuk End-User](#-instalasi-pwa-untuk-end-user)
3. [Konfigurasi Environment](#-konfigurasi-environment)
4. [Setup Database Supabase](#-setup-database-supabase)
5. [Menjalankan Development Server](#-menjalankan-development-server)
6. [Deploy ke Production](#-deploy-ke-production)
7. [Troubleshooting Instalasi](#-troubleshooting-instalasi)
8. [Kontak & Dukungan](#-kontak--dukungan)

---

## 🛠️ Instalasi untuk Developer

### Prasyarat Perangkat & Sistem

| Software / Tool | Versi Minimal | Cara Memeriksa | Keterangan |
|---|---|---|---|
| **Node.js** | v20.19+ atau v22.12+ | `node --version` | LTS direkomendasikan |
| **npm** | v10.0+ | `npm --version` | Package manager bawaan Node |
| **Git** | v2.30+ | `git --version` | Version control system |
| **Browser Modern** | Chrome 100+, Edge 100+ | - | Mendukung PWA & DevTools |
| **Akun Supabase** | Cloud Free / Pro tier | [supabase.com](https://supabase.com) | Database PostgreSQL & Auth |

---

### Langkah 1: Clone Repository

Buka terminal (Git Bash, Command Prompt, atau Terminal macOS/Linux) dan jalankan:

```bash
git clone https://github.com/your-org/sdk-orchestration-hub.git
cd sdk-orchestration-hub
```

---

### Langkah 2: Install Dependensi

Jalankan perintah berikut untuk mengunduh seluruh dependensi proyek:

```bash
npm install
```

> ⏱️ *Estimasi waktu instalasi: 1–3 menit tergantung koneksi internet.*

---

### Langkah 3: Setup Environment Variables

Duplikasi file template lingkungan:

```bash
# Windows (PowerShell)
cp .env.example .env

# Atau Command Prompt
copy .env.example .env
```

Buka file `.env` dan isi nilai kredensial proyek Supabase Anda:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

#### Cara Mendapatkan Kredensial Supabase:
1. Buka [https://app.supabase.com](https://app.supabase.com) dan login ke akun Anda.
2. Pilih project **SUBAGA** (atau buat project baru).
3. Di panel menu kiri, klik **Project Settings** (ikon gear ⚙️) → **API**.
4. Salin **Project URL** dan masukkan ke `VITE_SUPABASE_URL`.
5. Salin **Project API Keys** bagian `anon` `public` dan masukkan ke `VITE_SUPABASE_ANON_KEY`.

---

### Langkah 4: Menjalankan Development Server

Jalankan server pengembangan lokal:

```bash
npm run dev
```

Output terminal akan menampilkan URL server lokal:
```text
  VITE v8.2.2  ready in 420 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Buka browser dan navigasikan ke `http://localhost:5173`.

---

### Langkah 5: Verifikasi Instalasi & Quality Check

Untuk memastikan instalasi bersih tanpa error TypeScript maupun linting, jalankan:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint audit (oxlint)
npm run lint

# 3. Validasi Build Production
npm run build
```

Semua pemeriksaan harus menghasilkan kode keluar `0` (berhasil tanpa error).

---

## 📱 Instalasi PWA untuk End-User

SDK Orchestration Hub dikembangkan dengan kapabilitas **Progressive Web App (PWA)**, sehingga pengguna akhir (Admin, Project Lead, Staff, dan Klien) dapat menginstalnya layaknya aplikasi native tanpa perlu mendownload installer terpisah.

### 1. Android (Google Chrome)

1. Buka browser **Google Chrome** di ponsel Android Anda.
2. Kunjungi alamat aplikasi (misal: `https://sdk-orchestration-hub.vercel.app`).
3. Ketuk ikon titik tiga (⋮) di pojok kanan atas browser.
4. Pilih menu **"Add to Home screen"** (Tambahkan ke Layar Utama) atau **"Install app"**.
5. Tekan tombol **"Install"** pada jendela konfirmasi.
6. Ikon **SDK Hub** akan muncul di app drawer dan home screen ponsel.

---

### 2. iOS / iPadOS (Safari)

1. Buka browser **Safari** di iPhone atau iPad.
2. Akses alamat web aplikasi SDK.
3. Ketuk tombol **Share** (ikon kotak dengan panah mengarah ke atas di bar bawah).
4. Gulir ke bawah pada daftar opsi dan pilih **"Add to Home Screen"** (Tambah ke Layar Utama).
5. Konfirmasi nama aplikasi (SDK Orchestration Hub) lalu ketuk **"Add"** di pojok kanan atas.
6. Aplikasi akan tersimpan sebagai ikon mandiri dengan pengalaman layar penuh (*standalone mode*).

---

### 3. Desktop (Windows / macOS / Linux)

Gunakan browser berbasis Chromium seperti **Google Chrome** atau **Microsoft Edge**:
1. Buka URL aplikasi di peramban desktop Anda.
2. Perhatikan ikon monitor kecil bertanda panah ke bawah di sisi kanan kolom alamat URL (*address bar*).
3. Alternatif lain: klik menu browser (⋮) → pilih **"Install SDK Orchestration Hub..."**.
4. Klik **Install** pada dialog pop-up konfirmasi.
5. Aplikasi akan terbuka di jendela terisolasi tanpa tab browser dan tersimpan di Start Menu (Windows) atau folder Applications (macOS).

#### ✨ Keunggulan PWA:
- ✅ **Tanpa instalasi ribet:** Tidak perlu unduhan file `.exe` atau toko aplikasi pihak ketiga.
- ✅ **Pembaruan instan:** Kode aplikasi diperbarui secara otomatis setiap kali ada rilis baru.
- ✅ **Dukungan offline / cache:** Cache Service Worker menjamin UI terbuka cepat meski internet fluktuatif.
- ✅ **Ringan & hemat memori:** Mengonsumsi penyimpanan perangkat kurang dari 10 MB.

---

## ⚙️ Konfigurasi Environment

### 1. Lingkungan Pengembangan Lokal (`.env`)

```env
# URL Project Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co

# Anon Public Key (Aman digunakan pada client-side)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Lingkungan Production (Vercel / Netlify)

Pastikan memasukkan kedua variabel di atas pada portal penyedia hosting Anda:

- **Vercel:**
  1. Masuk ke dashboard proyek di [vercel.com](https://vercel.com).
  2. Buka tab **Settings** → **Environment Variables**.
  3. Tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
  4. Lakukan re-deploy project.
- **Netlify:**
  1. Buka dashboard proyek di [netlify.com](https://netlify.com).
  2. Masuk ke **Site configuration** → **Environment variables**.
  3. Masukkan key-value yang sama.
  4. Trigger rebuild & deploy.

---

## 🗄️ Setup Database Supabase

Jika Anda menghubungkan aplikasi ke instansi database Supabase baru, ikuti panduan skema dan migration berikut.

### 1. Pembuatan Proyek Baru di Supabase
1. Masuk ke [app.supabase.com](https://app.supabase.com).
2. Klik **New Project**, tentukan organisasi, beri nama `SUBAGA`, dan pilih region terdekat (misal: `Southeast Asia - Singapore`).
3. Simpan database password Anda di password manager terpercaya.
4. Tunggu inisialisasi server selesai (sekitar 2 menit).

---

### 2. Skrip Migration SQL Lengkap

Buka menu **SQL Editor** pada Supabase Dashboard, buat *query* baru, lalu jalankan perintah DDL di bawah ini:

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
-- 2. TABEL CLIENTS
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
-- 3. TABEL PROFILES
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
-- 4. TABEL PROJECTS
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
-- 5. TABEL TASKS
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

-- ========================================================
-- 6. TABEL TIME ENTRIES (PRESENSI & TIMESHEET)
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
-- 7. TABEL FILES & DOCUMENTS REPOSITORY
-- ========================================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Deliverables',
  file_url TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  mime_type TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 8. TABEL CHAT & NOTIFIKASI
-- ========================================================
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'PROJECT',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
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
-- 9. TABEL AUDIT LOGS
-- ========================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3. Konfigurasi Row Level Security (RLS)

Untuk membatasi hak akses data secara aman di sisi database:

```sql
-- Aktifkan RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Global (Dapat disesuaikan sesuai kebutuhan)
CREATE POLICY "Public Read Access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON projects FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON tasks FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON time_entries FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON files FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON notifications FOR SELECT USING (true);

-- Izinkan write untuk user terautentikasi
CREATE POLICY "Allow All Inserts" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow All Inserts" ON time_entries FOR ALL USING (true);
CREATE POLICY "Allow All Inserts" ON files FOR ALL USING (true);
CREATE POLICY "Allow All Inserts" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Allow All Inserts" ON notifications FOR ALL USING (true);
```

---

### 4. Seed Data Demo & Tim Pengembang Awal

Tambahkan data acuan, akun default, dan profil tim pengembang ke database:

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
```

---

## 🚀 Menjalankan Development Server

```bash
# Menjalankan dev server Vite
npm run dev

# Menjalankan build production
npm run build

# Menjalankan preview lokal dari hasil build (dist/)
npm run preview
```

---

## 🌐 Deploy ke Production

### Opsi 1: Deploy ke Vercel (Rekomendasi)

1. Pastikan Anda telah menginstal Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Login dan deploy langsung dari terminal:
   ```bash
   vercel login
   vercel --prod
   ```
3. Set environment variable di project settings Vercel (`VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`).

### Opsi 2: Deploy ke Netlify

1. Instal Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```
2. Lakukan build lalu deploy direktori `dist/`:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

### Opsi 3: Shared Hosting (Apache / cPanel)

1. Jalankan `npm run build` untuk menghasilkan direktori `dist/`.
2. Unggah seluruh isi folder `dist/` ke direktori root web Anda (misal `public_html/`).
3. Buat file `.htaccess` di dalam root direktori untuk menangani routing SPA (Single Page Application):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 🐛 Troubleshooting Instalasi

### 1. Error: "Missing VITE_SUPABASE_URL"
- **Penyebab:** File `.env` belum dibuat atau variabel belum terdefinisi.
- **Solusi:** Salin template dengan `cp .env.example .env` lalu periksa kembali isi kredensial Supabase Anda.

### 2. Error: "Cannot find module '@supabase/supabase-js'"
- **Penyebab:** Direktori `node_modules` belum terinstal lengkap atau korup.
- **Solusi:** Hapus `node_modules` dan instal ulang:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### 3. Error: "Port 5173 is already in use"
- **Penyebab:** Ada proses lain atau terminal lain yang sedang memakai port 5173.
- **Solusi:**
  - *Windows:* `netstat -ano | findstr :5173` lalu matikan proses dengan `taskkill /PID <PID> /F`
  - *macOS/Linux:* `lsof -ti:5173 | xargs kill -9`
  - Atau jalankan dengan port baru: `npm run dev -- --port 5174`

### 4. Login Gagal / "Failed to fetch"
- **Penyebab:** URL Supabase tidak dapat dijangkau dari koneksi Anda, atau izin RLS memblokir query publik.
- **Solusi:** Periksa koneksi internet, pastikan URL Supabase valid, dan periksa kebijakan RLS pada tabel `profiles`.

### 5. PWA Tidak Memunculkan Pilihan "Install"
- **Penyebab:** PWA membutuhkan koneksi terenkripsi HTTPS (kecuali pada `localhost`).
- **Solusi:** Pastikan Anda mengakses aplikasi melalui protokol `https://` atau saat uji coba lokal gunakan `http://localhost:5173`.

---

## 📞 Kontak & Dukungan

- **Email Dukungan:** [admin@subagakreatif.com](mailto:admin@subagakreatif.com)
- **Telepon / WhatsApp:** +62-8131-8122-504
- **Website Resmi:** [www.subagakreatif.com](https://www.subagakreatif.com)
- **Kantor Operasional:** Talavera Office Park, 28th Floor, Jl. T. B. Simatupang Kav. 22–26, Cilandak Barat, Jakarta Selatan 12430

---
*© 2026 PT Subaga Digital Kreatif. All rights reserved.*
