# SDK Orchestration Hub — Subaga Digital Kreatif

Platform orkestrasi proyek dan manajemen sumber daya digital terpusat untuk tim **Subaga Digital Kreatif**, dibangun dengan arsitektur modern, performa tinggi, dan integrasi real-time Supabase.

---

## 🚀 Ringkasan Sistem & Fitur Utama

1. **Role-Based Access Control (RBAC)**:
   - **ADMIN**: Akses penuh ke seluruh fitur, manajemen user, klien, template, dashboard eksekutif, dan konfigurasi sistem.
   - **PROJECT_LEAD**: Memimpin proyek, mengelola sprint Kanban, alokasi jam kerja tim, meninjau alur revisi, dan berinteraksi langsung dengan klien di Cockpit.
   - **STAFF**: Pelacakan tugas sprint personal, pencatatan waktu kerja (time tracking/presensi) real-time, dan status pengerjaan tugas.
   - **CLIENT**: Akses khusus ke **Client Cockpit** untuk memantau milestone, progres pengerjaan deliverable, mengunggah berkas kebutuhan, serta mengajukan persetujuan atau revisi.

2. **Papan Orkestrasi (Kanban Pipeline)**:
   - Manajemen tugas drag-and-drop (`@dnd-kit`).
   - Status pipeline: *TODO, IN_PROGRESS, CODE_REVIEW, TESTING, DEPLOYED, COMPLETED*.
   - Filter prioritas, assignee, status terhambat (*Blocked*), dan penanda menunggu klien.

3. **Sumber Daya & Jadwal (Live Gantt Timeline)**:
   - Tampilan visual alokasi jam kerja tim berbasis **Minggu (7 hari)** dan **Bulan**.
   - Penanda waktu dinamis **HARI INI** (*Dynamic Today Marker*).
   - Deteksi otomatis konflik jadwal penugasan (*Schedule Conflict Detection*).
   - Navigasi rentang waktu presisi dan sinkronisasi data Supabase.

4. **Kokpit Klien (Client Cockpit)**:
   - Dasbor transparansi deliverable untuk pihak klien.
   - Alur persetujuan (*Approval Workflow*) dan pengajuan revisi dengan estimasi delay timeline.
   - Repositori dokumen dan aset pendukung proyek.

5. **Komunikasi & Pelacakan Waktu**:
   - **Realtime Chat**: Saluran komunikasi internal dan kolaborasi klien dengan attachment berkas dan konversi chat menjadi tugas (*Chat-to-Task Bridge*).
   - **Presensi & Jam Kerja**: Timer shift kerja aktif dan pencatatan riwayat alokasi jam kerja tim per tugas.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Visualisasi & Grafik**: Recharts (Pie Chart Status Proyek, Health Metrics)
- **Drag and Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Storage, Realtime subscriptions)
- **Notifikasi**: Sonner Toast Notifications
- **Linter & Compiler**: Oxlint, TypeScript compiler (`tsc`)

---

## 📦 Menjalankan Proyek Secara Lokal

### 1. Prasyarat
- Node.js (v20+ disarankan)
- npm atau pnpm

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment
Buat berkas `.env` di root direktori proyek:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Aplikasi dapat diakses di `http://localhost:5173`.

### 5. Validasi & Build Produksi
```bash
# Validasi TypeScript
npx tsc --noEmit

# Validasi Linting
npm run lint

# Build Bundle Produksi
npm run build
```

---

## 🛡️ Kebijakan Keamanan & Reset Data

- **Form Reset Policy**: Seluruh modal dan formulir input (Tambah Tugas, Tambah Klien, Tambah User, Tambah Resource, Upload Berkas) secara otomatis mengosongkan nilai input saat ditutup maupun setelah submit berhasil.
- **Proteksi Rute CLIENT**: Akun dengan peran `CLIENT` secara otomatis dialihkan ke `/cockpit` saat mencoba mengakses dashboard eksekutif atau direktori manajemen internal.
- **Anon Key Only**: Sisi frontend hanya menggunakan `VITE_SUPABASE_ANON_KEY` dengan proteksi Row Level Security (RLS) di database Supabase.
