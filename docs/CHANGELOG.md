# Riwayat Perubahan (Changelog) — SDK Orchestration Hub

Semua catatan pembaruan, peningkatan performa, perbaikan bug, dan penambahan fitur pada platform **SDK Orchestration Hub** didokumentasikan dalam dokumen ini. Format penulisan mengikuti pedoman [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan [Semantic Versioning](https://semver.org/).

---

## [v2.5.0] — 2026-09-23 *(Rilis Stabil)*

### 🚀 Fitur Baru & Peningkatan Utama
- **Sistem Presensi & Jam Kerja (Time Tracking):**
  - Widget interaktif *Clock In / Clock Out* pada Dashboard Staff dan Admin.
  - Perhitungan durasi kerja otomatis berbasis waktu presisi server.
  - Tab Analitik & Tab Audit Logs presensi untuk review kepatuhan jam kerja karyawan.
- **Peningkatan Client Cockpit:**
  - Integrasi tombol aksi cepat: *Request Revision*, *Approve Deliverable*, dan *Direct Chat ke Tim*.
  - Upload berkas interaktif dengan deteksi tipe dokumen dan konfirmasi visual.
  - Tampilan persentase progres proyek real-time dengan status indikator visual.
- **Integrasi PWA & Offline Support:**
  - Dukungan Service Worker untuk caching asset statis.
  - Manifest PWA lengkap dengan shortcut instalasi di Android, iOS, dan Desktop.
  - Halaman tutorial instalasi PWA interaktif di `/download`.
- **Global Search Modal (⌘K / Ctrl+K):**
  - Pencarian cepat lintas proyek, tugas, anggota tim, klien, dan berkas.
  - Navigasi instan menggunakan tombol keyboard (Arrow keys + Enter).

### 🛡️ Keamanan & Kepatuhan RBAC
- Penegakan ketat izin akses (*Role-Based Access Control*) pada seluruh 18 route aplikasi:
  - Role `CLIENT` dibatasi hanya dapat mengakses Cockpit, Files, Chat, Settings, dan Notifikasi.
  - Role `STAFF` dibatasi dari menu manajemen tingkat tinggi seperti Users, Clients, dan Templates.
  - Role `PROJECT_LEAD` memiliki akses penuh supervisi tim dan operasional proyek binaan.
  - Role `ADMIN` memiliki kontrol eksekutif menyeluruh.
- Sanitasi input formulir dan modal reset state saat ditutup.

### 🎨 Desain & UI/UX
- Palet warna konsisten SDK Brand (#F97316 Primary Orange & #0B0F19 Dark Navy).
- Dukungan tema Dark Mode dan Light Mode yang mulus tanpa kedipan (*flicker*).
- Dukungan dwibahasa penuh (Bahasa Indonesia & English).
- Tooltip interaktif pada diagram distribusi proyek (Pie Chart) dan KPI metric cards.

---

## [v2.4.0] — 2026-08-15

### Ditambahkan
- Modul *Realtime Chat* dengan channel proyek dan percakapan tim terisolasi.
- Modal pembuatan grup chat baru dan lampiran berkas pesan.
- Indikator pengetikan (*typing indicator*) dan timestamp pengiriman pesan real-time.
- Sistem notifikasi drawer dengan pemisahan tab (Semua, Belum Dibaca, Mendesak).

### Diperbaiki
- Perbaikan sinkronisasi kanban board saat memindahkan task status antar kolom (*drag-and-drop*).
- Penanganan task yang berstatus *Blocked* dengan catatan alasan hambatan yang jelas.

---

## [v2.0.0] — 2026-06-30

### Ditambahkan
- Migrasi arsitektur dari mock in-memory ke **Supabase Cloud PostgreSQL**.
- Fitur *Project Creation Wizard* dengan kalkulator estimasi anggaran dan jadwal.
- Template alur kerja siap pakai (*Workflow Templates*): *Social Sentiment Analysis*, *Healthcare Information System*, dan *Custom Blank Template*.
- Gantt Chart Timeline dan Global Timeline lintas tahun untuk monitoring alokasi kapasitas tahunan.

---

## [v1.0.0] — 2026-04-10

### Rilis Inisial
- Implementasi sistem autentikasi dasar dengan role simulator.
- Dashboard eksekutif dengan KPI proyek aktif, selesai, dan rasio kesehatan (*health score*).
- Direktori daftar proyek dan filter berdasarkan model pengiriman (*Consulting*, *Custom*, *Subscription*).
- Papan kanban dasar dengan kolom *Backlog*, *In Progress*, *Review*, dan *Done*.
- Manajemen profil pengguna dan pengaturan preferensi tema.

---
*Dikelola oleh Tim Engineering & QA PT Subaga Digital Kreatif.*
