const fs = require('fs');
const path = require('path');

const manualPath = path.join(__dirname, '..', 'docs', 'user-manual.html');

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SDK Orchestration Hub — User Manual v2.5</title>
  <link rel="icon" type="image/png" href="screenshots/logo-sdk.png">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    @page {
      size: A4;
      margin: 20mm 15mm;
      @bottom-center {
        content: "SDK Orchestration Hub — User Manual v2.5 • Halaman " counter(page);
        font-size: 8.5pt;
        color: #64748B;
        font-family: 'Inter', sans-serif;
      }
    }

    @page :first {
      @bottom-center {
        content: none;
      }
    }

    @page cover {
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10.5pt;
      line-height: 1.65;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }

    @media screen {
      body {
        padding: 30px 15px;
      }
      .page-container {
        background: white;
        max-width: 960px;
        margin: 0 auto;
        padding: 50px 70px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        border-radius: 12px;
      }
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .page-container {
        max-width: none;
        padding: 0;
        box-shadow: none;
      }
      .no-print {
        display: none !important;
      }
      a {
        color: #1e293b;
        text-decoration: none;
      }
      .page-break {
        page-break-before: always;
      }
      .avoid-break {
        page-break-inside: avoid;
      }
    }

    /* COVER PAGE */
    .cover-page {
      page: cover;
      page-break-after: always;
      min-height: 280mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 60px 40px;
      background: linear-gradient(145deg, #0B0F19 0%, #172033 100%);
      color: white;
      position: relative;
      border-radius: 8px;
      margin-bottom: 40px;
    }

    .cover-page::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 75% 20%, rgba(249,115,22,0.18) 0%, transparent 55%);
      pointer-events: none;
    }

    .cover-page .logo {
      max-width: 170px;
      margin-bottom: 35px;
      z-index: 1;
      filter: drop-shadow(0 10px 25px rgba(0,0,0,0.5));
    }

    .cover-page h1 {
      font-size: 34pt;
      font-weight: 800;
      margin: 0 0 14px;
      color: #FFFFFF;
      border: none;
      letter-spacing: -0.025em;
      line-height: 1.15;
      z-index: 1;
    }

    .cover-page .subtitle {
      font-size: 15pt;
      color: #94A3B8;
      margin: 0 0 10px;
      font-weight: 400;
      max-width: 620px;
      z-index: 1;
    }

    .cover-page .manual-label {
      font-size: 13pt;
      color: #F97316;
      font-weight: 700;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      margin: 36px 0;
      padding: 10px 28px;
      border: 2px solid #F97316;
      border-radius: 8px;
      background: rgba(249, 115, 22, 0.08);
      z-index: 1;
    }

    .cover-page .meta {
      margin-top: 50px;
      text-align: center;
      z-index: 1;
      font-size: 10pt;
      color: #94A3B8;
      line-height: 1.8;
    }

    .cover-page .meta strong {
      color: #F97316;
    }

    /* HEADINGS */
    h1 {
      font-size: 22pt;
      font-weight: 800;
      color: #F97316;
      border-bottom: 3px solid #F97316;
      padding-bottom: 10px;
      margin: 45px 0 22px;
      page-break-before: always;
      page-break-after: avoid;
      letter-spacing: -0.015em;
    }

    h1:first-of-type,
    h1.no-break {
      page-break-before: avoid;
      margin-top: 10px;
    }

    h2 {
      font-size: 16pt;
      font-weight: 700;
      color: #0B0F19;
      margin: 32px 0 14px;
      page-break-after: avoid;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h3 {
      font-size: 13pt;
      font-weight: 600;
      color: #1e293b;
      margin: 22px 0 10px;
      page-break-after: avoid;
    }

    h4 {
      font-size: 11pt;
      font-weight: 600;
      color: #334155;
      margin: 16px 0 8px;
      page-break-after: avoid;
    }

    /* PARAGRAPHS */
    p {
      margin: 0 0 12px;
      text-align: justify;
      color: #334155;
    }

    /* SCREENSHOTS */
    .screenshot {
      margin: 22px 0 26px;
      page-break-inside: avoid;
      text-align: center;
    }

    .screenshot img {
      max-width: 100%;
      height: auto;
      max-height: 480px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.07);
    }

    .screenshot .caption {
      font-size: 9pt;
      color: #64748B;
      font-style: italic;
      margin-top: 8px;
      line-height: 1.4;
      max-width: 90%;
      margin-left: auto;
      margin-right: auto;
    }

    .screenshot.phone img {
      max-width: 270px;
      border-radius: 20px;
      border: 5px solid #1e293b;
    }

    /* STEPS (NUMBERED) */
    .steps {
      counter-reset: step;
      list-style: none;
      padding-left: 0;
      margin: 16px 0;
    }

    .steps > li {
      counter-increment: step;
      padding-left: 50px;
      position: relative;
      margin-bottom: 18px;
      min-height: 36px;
    }

    .steps > li::before {
      content: counter(step);
      position: absolute;
      left: 0;
      top: 0;
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, #F97316, #EA580C);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      box-shadow: 0 2px 8px rgba(249,115,22,0.3);
    }

    /* TABLES */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }

    table th {
      background: #F97316;
      color: white;
      font-weight: 700;
      padding: 10px 12px;
      text-align: left;
      border: 1px solid #EA580C;
    }

    table td {
      padding: 9px 12px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
      color: #334155;
    }

    table tr:nth-child(even) td {
      background: #f8fafc;
    }

    table tr:hover td {
      background: #fff7ed;
    }

    /* TIP / WARNING / INFO BOXES */
    .callout {
      padding: 14px 18px;
      border-radius: 8px;
      margin: 18px 0;
      page-break-inside: avoid;
      border-left: 5px solid;
      font-size: 10pt;
      line-height: 1.6;
    }

    .callout strong {
      display: block;
      margin-bottom: 5px;
      font-size: 10.5pt;
    }

    .callout.tip {
      background: #ECFDF5;
      border-color: #10B981;
      color: #065F46;
    }
    .callout.tip strong { color: #047857; }

    .callout.warning {
      background: #FEF2F2;
      border-color: #EF4444;
      color: #991B1B;
    }
    .callout.warning strong { color: #B91C1C; }

    .callout.info {
      background: #EFF6FF;
      border-color: #3B82F6;
      color: #1E40AF;
    }
    .callout.info strong { color: #1D4ED8; }

    .callout.note {
      background: #FFFBEB;
      border-color: #F59E0B;
      color: #92400E;
    }
    .callout.note strong { color: #B45309; }

    /* TABLE OF CONTENTS */
    .toc {
      page-break-after: always;
      margin-bottom: 30px;
    }

    .toc h1 {
      page-break-before: avoid;
    }

    .toc ul {
      list-style: none;
      padding-left: 0;
      margin: 0;
    }

    .toc > ul > li {
      margin: 10px 0;
      font-weight: 700;
      font-size: 11pt;
      color: #0B0F19;
      border-bottom: 1px dotted #cbd5e1;
      padding-bottom: 5px;
    }

    .toc > ul > li > a {
      color: #0B0F19;
      text-decoration: none;
      display: flex;
      justify-content: space-between;
    }

    .toc > ul > li > ul {
      padding-left: 24px;
      margin-top: 5px;
    }

    .toc > ul > li > ul > li {
      font-weight: 500;
      font-size: 10pt;
      margin: 5px 0;
      border: none;
      color: #475569;
    }

    .toc a {
      text-decoration: none;
      color: inherit;
    }

    .toc a:hover {
      color: #F97316;
    }

    .toc .page-num {
      float: right;
      color: #94A3B8;
      font-family: 'Courier New', monospace;
      font-size: 9.5pt;
    }

    /* ROLE BADGES */
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 5px;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .badge-admin {
      background: #FEE2E2;
      color: #991B1B;
      border: 1px solid #FCA5A5;
    }

    .badge-lead {
      background: #FEF3C7;
      color: #92400E;
      border: 1px solid #FCD34D;
    }

    .badge-staff {
      background: #DBEAFE;
      color: #1E40AF;
      border: 1px solid #93C5FD;
    }

    .badge-client {
      background: #D1FAE5;
      color: #065F46;
      border: 1px solid #6EE7B7;
    }

    /* FEATURE CARD */
    .feature-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #F97316;
      border-radius: 8px;
      padding: 14px 18px;
      margin: 14px 0;
      page-break-inside: avoid;
    }

    .feature-card h4 {
      margin-top: 0;
      color: #0B0F19;
      font-size: 11pt;
    }

    .feature-card p {
      margin-bottom: 0;
      font-size: 9.5pt;
    }

    /* CODE */
    code {
      background: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 9.5pt;
      color: #dc2626;
      border: 1px solid #e2e8f0;
    }

    pre {
      background: #0B0F19;
      color: #e2e8f0;
      padding: 14px 18px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 8.5pt;
      line-height: 1.55;
      page-break-inside: avoid;
    }

    pre code {
      background: none;
      color: inherit;
      padding: 0;
      border: none;
    }

    .quick-nav {
      position: sticky;
      top: 15px;
      float: right;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 8.5pt;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      z-index: 100;
    }

    @media print {
      .quick-nav {
        display: none !important;
      }
    }
  </style>
</head>
<body>

<div class="page-container">

  <!-- ============================================= -->
  <!-- COVER PAGE -->
  <!-- ============================================= -->
  <section class="cover-page">
    <img src="screenshots/logo-sdk.png" alt="SDK Logo" class="logo">
    <h1 style="page-break-before: avoid;">SDK Orchestration Hub</h1>
    <p class="subtitle">Platform Manajemen Proyek, Alur Kerja & Orkestrasi Terpadu</p>
    <div class="manual-label">User Manual Resmi</div>
    
    <div class="meta">
      <p><strong>Versi Dokumen:</strong> v2.5.0 • <strong>Tanggal Rilis:</strong> 23 September 2026</p>
      <p style="margin-top: 14px; font-size: 11pt; color: #FFFFFF;"><strong>Klien & Penerima Proyek:</strong></p>
      <p style="color: #F97316; font-weight: 800; font-size: 12pt; margin: 2px 0;">PT Subaga Digital Kreatif</p>
      <p style="color: #94A3B8; font-size: 9.5pt; margin: 0 0 16px;"><em>(Deliverable Tugas Besar Program Magang Industri)</em></p>
      <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 12px 16px; margin: 10px auto; max-width: 520px; text-align: left; font-size: 9.5pt; color: #E2E8F0; line-height: 1.6;">
        <div style="font-weight: 700; color: #F97316; margin-bottom: 6px; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; font-size: 9pt;">Disusun & Dikembangkan Oleh Tim Magang:</div>
        <div>• <strong>Naufal Azka Pradifa Utomo</strong> — Backend Developer (Database, API, Security)</div>
        <div>• <strong>Hadid Firdaus</strong> — UI/UX Designer (Design System, Usability & Research)</div>
        <div>• <strong>Muhammad Abrurrahman Arrody</strong> — Frontend Developer (Core UI, QA & PWA)</div>
      </div>
      <p style="margin-top: 14px; font-size: 9pt;">Talavera Office Park 28th Floor, Jakarta Selatan 12430<br>
      Website: www.subagakreatif.com • Email: admin@subagakreatif.com</p>
    </div>
  </section>

  <!-- ============================================= -->
  <!-- DOKUMEN & CONFIDENTIALITY -->
  <!-- ============================================= -->
  <section class="avoid-break" style="margin-top: 30px;">
    <h2 style="margin-top: 0;">Informasi Pengendalian Dokumen & Tim Pengembang</h2>
    <table>
      <tr><td style="width: 28%;"><strong>Judul Dokumen</strong></td><td>SDK Orchestration Hub — User Manual & Panduan Operasional</td></tr>
      <tr><td><strong>Konteks Pengembangan</strong></td><td>Tugas Besar Program Magang Industri (Internship Capstone Project)</td></tr>
      <tr><td><strong>Klien / Penerima Manfaat</strong></td><td><strong>PT Subaga Digital Kreatif</strong></td></tr>
      <tr><td><strong>Nomor Dokumen</strong></td><td>SDK-DOC-UM-2026-09</td></tr>
      <tr><td><strong>Versi Aplikasi</strong></td><td>v2.5.0 (Build 2026.09)</td></tr>
      <tr><td><strong>Tanggal Rilis</strong></td><td>23 September 2026</td></tr>
      <tr><td><strong>Tim Pengembang Magang</strong></td><td>
        <ul style="margin: 0; padding-left: 18px; line-height: 1.7;">
          <li><strong>Naufal Azka Pradifa Utomo</strong> — <em>Backend Developer</em> (Arsitektur Database PostgreSQL/Supabase, REST & Realtime API, Auth RBAC & Security Middleware)</li>
          <li><strong>Hadid Firdaus</strong> — <em>UI/UX Designer</em> (Perancangan Desain Sistem, Wireframe & Prototype Interaktif, Riset Pengguna, Aset Visual & Usability Testing)</li>
          <li><strong>Muhammad Abrurrahman Arrody</strong> — <em>Frontend Developer</em> (Implementasi Antarmuka React 19/Vite, State Management, Quality Assurance / QA Lead & PWA Integration)</li>
        </ul>
      </td></tr>
      <tr><td><strong>Tugas Pendukung Tim</strong></td><td>Pengujian Kualitas (QA Audit), Performance Tuning, Integrasi CI/CD, dan Dokumentasi Panduan Teknis dijalankan secara kolaboratif oleh seluruh anggota tim magang.</td></tr>
      <tr><td><strong>Status</strong></td><td>Approved & Handed Over sebagai Deliverable Tugas Besar Magang</td></tr>
      <tr><td><strong>Klasifikasi Distribusi</strong></td><td>Internal Tim SDK & Mitra Klien Resmi</td></tr>
    </table>

    <div class="callout warning">
      <strong>⚠️ CONFIDENTIAL & PROPRIETARY</strong>
      Dokumen ini memuat informasi arsitektur alur kerja, standar operasi prosedur (SOP), dan rancangan fungsional milik PT Subaga Digital Kreatif. Dilarang menggandakan, menyebarluaskan, atau mempublikasikan sebagian atau seluruh dokumen ini tanpa persetujuan tertulis dari manajemen PT Subaga Digital Kreatif.
    </div>
  </section>

  <!-- ============================================= -->
  <!-- DAFTAR ISI -->
  <!-- ============================================= -->
  <section class="toc" id="daftar-isi">
    <h1 class="no-break">Daftar Isi</h1>
    <ul>
      <li>
        <a href="#pendahuluan"><span>1. Pendahuluan</span> <span class="page-num">01</span></a>
        <ul>
          <li><a href="#tentang">1.1 Tentang SDK Orchestration Hub</a></li>
          <li><a href="#fitur-utama">1.2 Pilar Fitur Utama</a></li>
          <li><a href="#tujuan">1.3 Tujuan & Manfaat Dokumen</a></li>
          <li><a href="#target-pembaca">1.4 Target Pembaca</a></li>
          <li><a href="#prasyarat">1.5 Prasyarat Perangkat & Sistem</a></li>
        </ul>
      </li>
      <li>
        <a href="#roles"><span>2. Daftar Role & Matriks Hak Akses</span> <span class="page-num">04</span></a>
        <ul>
          <li><a href="#role-admin">2.1 Administrator (ADMIN)</a></li>
          <li><a href="#role-lead">2.2 Project Lead (PROJECT_LEAD)</a></li>
          <li><a href="#role-staff">2.3 Staff Engineer (STAFF)</a></li>
          <li><a href="#role-client">2.4 Client PIC (CLIENT)</a></li>
          <li><a href="#perbandingan">2.5 Matriks Komparasi Hak Akses (RBAC)</a></li>
        </ul>
      </li>
      <li>
        <a href="#getting-started"><span>3. Panduan Memulai (Getting Started)</span> <span class="page-num">07</span></a>
        <ul>
          <li><a href="#login">3.1 Prosedur Login ke Sistem</a></li>
          <li><a href="#role-simulator">3.2 Simulasi Cepat (Role Simulator)</a></li>
          <li><a href="#logout">3.3 Prosedur Logout Aman</a></li>
          <li><a href="#change-password">3.4 Mengubah Kata Sandi & Profil</a></li>
          <li><a href="#theme-toggle">3.5 Personalisasi Tema (Dark / Light)</a></li>
          <li><a href="#language-toggle">3.6 Pengaturan Bahasa (ID / EN)</a></li>
          <li><a href="#global-search">3.7 Navigasi Cepat Global Search (⌘K / Ctrl+K)</a></li>
        </ul>
      </li>
      <li>
        <a href="#admin"><span>4. Panduan Lengkap Administrator (ADMIN)</span> <span class="page-num">11</span></a>
        <ul>
          <li><a href="#admin-dashboard">4.1 Dashboard Eksekutif & Ringkasan KPI</a></li>
          <li><a href="#admin-projects">4.2 Manajemen Direktori Proyek</a></li>
          <li><a href="#admin-create-project">4.3 Wizard Pembuatan Proyek Baru</a></li>
          <li><a href="#admin-kanban">4.4 Papan Orkestrasi & Kontrol Tugas (Kanban)</a></li>
          <li><a href="#admin-timeline">4.5 Jadwal Proyek (Gantt Timeline)</a></li>
          <li><a href="#admin-global-timeline">4.6 Jadwal Global Lintas Portofolio</a></li>
          <li><a href="#admin-cockpit">4.7 Monitoring Kokpit Klien</a></li>
          <li><a href="#admin-files">4.8 Repositori Dokumen & Berkas Proyek</a></li>
          <li><a href="#admin-chat">4.9 Kolaborasi & Realtime Chat</a></li>
          <li><a href="#admin-resources">4.10 Alokasi Sumber Daya & Beban Tim</a></li>
          <li><a href="#admin-time-tracking">4.11 Monitoring Presensi & Jam Kerja (Time Tracking)</a></li>
          <li><a href="#admin-clients">4.12 Manajemen Mitra Klien & Akun Baru</a></li>
          <li><a href="#admin-templates">4.13 Template Alur Kerja Standar (Workflow Templates)</a></li>
          <li><a href="#admin-activity">4.14 Log Audit Aktivitas Sistem</a></li>
          <li><a href="#admin-users">4.15 Manajemen Akun Pengguna & Izin</a></li>
          <li><a href="#admin-reports">4.16 Analitik Performa & Laporan Eksekutif</a></li>
          <li><a href="#admin-settings">4.17 Pusat Pengaturan Sistem</a></li>
        </ul>
      </li>
      <li>
        <a href="#project-lead"><span>5. Panduan Project Lead (PROJECT_LEAD)</span> <span class="page-num">29</span></a>
        <ul>
          <li><a href="#lead-dashboard">5.1 Dashboard Operasional Project Lead</a></li>
          <li><a href="#lead-overdue">5.2 Sistem Deteksi Hambatan (Client Overdue Alert)</a></li>
          <li><a href="#lead-projects">5.3 Manajemen Proyek Binaan</a></li>
          <li><a href="#lead-kanban">5.4 Penugasan & Prioritas Sprint</a></li>
          <li><a href="#lead-resources">5.5 Penyeimbangan Utilisasi Jam Kerja Tim</a></li>
          <li><a href="#lead-approval">5.6 Alur Review Deliverable & Revisi</a></li>
          <li><a href="#lead-chat">5.7 Komunikasi Terpadu dengan Klien</a></li>
        </ul>
      </li>
      <li>
        <a href="#staff"><span>6. Panduan Staff Engineer (STAFF)</span> <span class="page-num">36</span></a>
        <ul>
          <li><a href="#staff-dashboard">6.1 Dashboard Personal Staff</a></li>
          <li><a href="#staff-clock">6.2 Tata Cara Presensi Kerja (Clock In / Clock Out)</a></li>
          <li><a href="#staff-tasks">6.3 Manajemen Tugas Saya (My Tasks)</a></li>
          <li><a href="#staff-kanban">6.4 Eksekusi Tugas pada Kanban Board</a></li>
          <li><a href="#staff-chat">6.5 Koordinasi Teknis via Chat</a></li>
          <li><a href="#staff-workload">6.6 Pemantauan Beban Kerja & Timesheet</a></li>
        </ul>
      </li>
      <li>
        <a href="#client"><span>7. Panduan Pengguna Klien (CLIENT)</span> <span class="page-num">42</span></a>
        <ul>
          <li><a href="#client-cockpit">7.1 Penjelajahan Portal Client Cockpit</a></li>
          <li><a href="#client-upload">7.2 Mengunggah Dokumen Acuan & Berkas</a></li>
          <li><a href="#client-chat">7.3 Berkomunikasi dengan Tim Proyek</a></li>
          <li><a href="#client-revision">7.4 Mengajukan Permintaan Revisi</a></li>
          <li><a href="#client-approve">7.5 Menyetujui Hasil Kerja (Approve Deliverable)</a></li>
        </ul>
      </li>
      <li>
        <a href="#flow"><span>8. Alur Kerja Terpadu End-to-End (E2E Scenario)</span> <span class="page-num">47</span></a>
      </li>
      <li>
        <a href="#faq"><span>9. Pertanyaan yang Sering Diajukan (FAQ)</span> <span class="page-num">51</span></a>
      </li>
      <li>
        <a href="#troubleshooting"><span>10. Panduan Troubleshooting & Pemecahan Masalah</span> <span class="page-num">54</span></a>
      </li>
      <li>
        <a href="#contact"><span>11. Kontak & Dukungan Teknis</span> <span class="page-num">56</span></a>
      </li>
    </ul>
  </section>

  <!-- ============================================= -->
  <!-- BAB 1: PENDAHULUAN -->
  <!-- ============================================= -->
  <section id="pendahuluan">
    <h1>1. Pendahuluan</h1>

    <h2 id="tentang">1.1 Tentang SDK Orchestration Hub</h2>
    <p>
      <strong>SDK Orchestration Hub</strong> adalah sistem platform enterprise yang dirancang dan dikembangkan oleh <strong>Tim Magang</strong> yang beranggotakan <strong>Naufal Azka Pradifa Utomo</strong> (Backend Developer & Database Architect), <strong>Hadid Firdaus</strong> (UI/UX Designer & Product Design), dan <strong>Muhammad Abrurrahman Arrody</strong> (Frontend Developer & Lead QA Engineer). Aplikasi ini dibangun secara khusus sebagai <strong>Tugas Besar Program Magang</strong> untuk <strong>PT Subaga Digital Kreatif (SDK)</strong> yang bertindak sebagai klien dan penerima manfaat utama aplikasi.
    </p>
    <p>
      Sebelum hadirnya platform ini, operasional internal dan kolaborasi klien di PT Subaga Digital Kreatif menghadapi tantangan fragmentasi data akibat penggunaan berbagai perangkat lunak pihak ketiga yang terpisah-pisah untuk kanban, pencatatan waktu kerja (time tracking), pelaporan progres ke klien, dan penyimpanan dokumen artefak. Melalui SDK Orchestration Hub v2.5, seluruh proses mulai dari inisiasi kontrak, pemetaan alur kerja teknis, monitoring beban kerja insinyur, pencatatan jam kerja presisi, hingga interaksi langsung dengan klien berlangsung secara sinkron dan transparan berbasis data cloud real-time.
    </p>

    <div class="screenshot">
      <img src="screenshots/02-admin-dashboard.png" alt="Dashboard Utama SDK Orchestration Hub">
      <div class="caption">Gambar 1.1 — Antarmuka Dashboard Eksekutif SDK Orchestration Hub</div>
    </div>

    <h2 id="fitur-utama">1.2 Pilar Fitur Utama</h2>
    <div class="feature-card">
      <h4>🎨 1. Project Canvas & Inisiasi Adaptif</h4>
      <p>Memungkinkan pengelola proyek memetakan tujuan bisnis (Business Objectives) ke model delivery yang presisi (Consulting, Custom Development, Subscription Service) untuk menghasilkan kerangka kerja (skeleton plan) otomatis.</p>
    </div>

    <div class="feature-card">
      <h4>📋 2. Orchestration Board & Template Khusus</h4>
      <p>Papan alur kerja berbasis Kanban modern dengan dukungan pelacakan dependensi, penandaan status terhambat (blocked tasks), dan otomatisasi penugasan berdasarkan kepakaran anggota tim.</p>
    </div>

    <div class="feature-card">
      <h4>⏱️ 3. Resource & Timeline Orchestrator</h4>
      <p>Mesin komputasi kapasitas cerdas yang memantau batas maksimum beban kerja tim (40 jam/minggu), memprediksi tabrakan jadwal, dan memvisualisasikan Gantt Chart multi-tahun.</p>
    </div>

    <div class="feature-card">
      <h4>🏢 4. Client Cockpit (Portal Transparansi Klien)</h4>
      <p>Ruang kerja khusus mitra luar untuk meninjau milestone progres secara real-time, mengunggah materi proyek, mengajukan revisi deliverable, dan menyetujui hasil kerja tanpa membuka celah data internal.</p>
    </div>

    <h2 id="tujuan">1.3 Tujuan & Manfaat Dokumen</h2>
    <p>Buku petunjuk operasional (User Manual) ini disusun untuk:</p>
    <ol class="steps">
      <li>Memberikan panduan komprehensif bagi seluruh pengguna dalam mengeksekusi peran dan tugas harian di SDK Orchestration Hub.</li>
      <li>Menstandarisasi alur koordinasi proyek agar selaras dengan Service Level Agreement (SLA) PT Subaga Digital Kreatif.</li>
      <li>Mempercepat proses orientasi (onboarding) bagi karyawan baru dan perwakilan PIC mitra klien.</li>
      <li>Menyajikan prosedur penyelesaian masalah teknis secara mandiri (*self-service troubleshooting*).</li>
    </ol>

    <h2 id="target-pembaca">1.4 Target Pembaca</h2>
    <p>Manual ini ditujukan kepada 4 kelompok pengguna dengan fokus bab bahasan sebagai berikut:</p>
    <table>
      <thead>
        <tr>
          <th style="width: 20%;">Peran Pengguna</th>
          <th style="width: 55%;">Deskripsi Tanggung Jawab</th>
          <th style="width: 25%;">Bab Referensi</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge badge-admin">ADMIN</span></td>
          <td>Manajemen tingkat eksekutif, konfigurasi master sistem, penambahan klien, otorisasi akun pengguna, dan audit trail global.</td>
          <td><strong>Bab 4</strong> & Bab 8</td>
        </tr>
        <tr>
          <td><span class="badge badge-lead">PROJECT LEAD</span></td>
          <td>Manajer proyek teknis yang memimpin pembagian sprint, mengawasi beban tim, mengelola risiko, dan memfasilitasi kebutuhan klien.</td>
          <td><strong>Bab 5</strong> & Bab 8</td>
        </tr>
        <tr>
          <td><span class="badge badge-staff">STAFF</span></td>
          <td>Anggota tim pelaksana teknis (Engineer, QA, Designer) yang mencatat presensi kerja, mengerjakan tiket tugas, dan update status alur.</td>
          <td><strong>Bab 6</strong> & Bab 8</td>
        </tr>
        <tr>
          <td><span class="badge badge-client">CLIENT</span></td>
          <td>Mitra luar / PIC resmi klien yang memantau milestone, mengunggah brief, mengajukan perbaikan, dan memberikan approval akhir.</td>
          <td><strong>Bab 7</strong> & Bab 8</td>
        </tr>
      </tbody>
    </table>

    <h2 id="prasyarat">1.5 Prasyarat Perangkat & Sistem</h2>
    <p>Untuk memastikan performa optimal dan interaksi real-time tanpa hambatan, pastikan lingkungan kerja Anda memenuhi spesifikasi berikut:</p>
    <table>
      <thead>
        <tr>
          <th>Kebutuhan</th>
          <th>Spesifikasi Minimum</th>
          <th>Spesifikasi Rekomendasi</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Peramban (Browser)</strong></td>
          <td>Google Chrome 100+, Edge 100+, Safari 15+</td>
          <td>Versi Chrome / Edge terbaru dengan JavaScript aktif</td>
        </tr>
        <tr>
          <td><strong>Koneksi Jaringan</strong></td>
          <td>Broadband 1 Mbps (Latensi &lt; 200ms)</td>
          <td>Koneksi 5 Mbps+ untuk transfer dokumen cepat</td>
        </tr>
        <tr>
          <td><strong>Perangkat Keras</strong></td>
          <td>RAM 4 GB, Layar 1366x768 (Desktop)</td>
          <td>RAM 8 GB+, Resolusi Full HD 1920x1080</td>
        </tr>
        <tr>
          <td><strong>Perangkat Mobile</strong></td>
          <td>Android 10+ / iOS 15+ (Layar min 360px)</td>
          <td>Android 13+ / iOS 17+ via Progressive Web App</td>
        </tr>
      </tbody>
    </table>

    <div class="callout tip">
      <strong>💡 Portabilitas PWA (Progressive Web App)</strong>
      SDK Orchestration Hub mendukung pemasangan PWA mandiri di desktop Windows/macOS maupun smartphone. Aplikasi dapat diakses langsung dari Home Screen tanpa perlu mengetikkan URL di browser setiap saat.
    </div>
  </section>

  <!-- ============================================= -->
  <!-- BAB 2: DAFTAR ROLE & HAK AKSES -->
  <!-- ============================================= -->
  <section id="roles">
    <h1>2. Daftar Role & Matriks Hak Akses</h1>
    <p>
      Keamanan dan privasi data pada SDK Orchestration Hub diatur secara ketat melalui arsitektur <strong>Role-Based Access Control (RBAC)</strong>. Setiap pengguna memiliki hak akses yang dibatasi sesuai fungsi organisasi guna mencegah kebocoran data sensitif antar proyek dan klien.
    </p>

    <h2 id="role-admin">2.1 Administrator (ADMIN)</h2>
    <p>
      Administrator memegang hak akses tertinggi atas seluruh fungsionalitas sistem. Admin memiliki wewenang untuk:
    </p>
    <ul>
      <li>Mengelola seluruh proyek dan melihat status portofolio perusahaan.</li>
      <li>Mendaftarkan klien baru dan menghasilkan kunci kredensial akun klien secara otomatis.</li>
      <li>Mengelola data master pengguna (Profiles), penugasan departemen, dan pengaturan batas jam mingguan.</li>
      <li>Mengakses laporan analitik eksekutif dan seluruh rekaman log audit keamanan.</li>
      <li>Memantau presensi dan rekapitulasi jam kerja seluruh karyawan.</li>
    </ul>

    <h2 id="role-lead">2.2 Project Lead (PROJECT_LEAD)</h2>
    <p>
      Project Lead berfokus pada manajemen siklus pelaksanaan proyek dan orkestrasi tim. Wewenang Project Lead mencakup:
    </p>
    <ul>
      <li>Membuat dan mengonfigurasi proyek baru dengan wizard panduan.</li>
      <li>Mengorganisir papan kanban, mendefinisikan tugas sprint, estimasi jam, dan menetapkan assignee.</li>
      <li>Memonitor sistem <em>Client Overdue Alert</em> untuk memitigasi keterlambatan respon dari sisi klien.</li>
      <li>Memantau utilisasi kapasitas tim di modul Resources agar beban tidak berlebih (*overcapacity*).</li>
      <li>Membuka jalur percakapan langsung dengan perwakilan klien di kanal komunikasi proyek.</li>
    </ul>

    <h2 id="role-staff">2.3 Staff Engineer (STAFF)</h2>
    <p>
      Staff Engineer mencakup tim pelaksana teknis (Frontend, Backend, Mobile, UI/UX, dan QA). Wewenang Staff mencakup:
    </p>
    <ul>
      <li>Melakukan <strong>Clock In</strong> saat memulai hari kerja dan <strong>Clock Out</strong> saat mengakhiri pekerjaan.</li>
      <li>Melihat dan memfilter tugas yang secara spesifik ditugaskan ke dirinya (*Assigned to Me*).</li>
      <li>Memperbarui status tugas pada Kanban Board (Backlog → Todo → In Progress → Review → Done).</li>
      <li>Menandai status tugas yang terhambat (*is_blocked*) disertai catatan kendala.</li>
      <li>Berkoordinasi di chat realtime channel proyek yang diikutinya.</li>
    </ul>

    <h2 id="role-client">2.4 Client PIC (CLIENT)</h2>
    <p>
      Akun perwakilan klien dikhususkan untuk menjaga transparansi kerja sama tanpa mengekspos data operasional internal SDK. Klien berhak untuk:
    </p>
    <ul>
      <li>Mengakses halaman <strong>Client Cockpit</strong> untuk melihat persentase penyelesaian proyek dan milestone.</li>
      <li>Mengunduh deliverable hasil kerja yang telah diserahkan oleh tim SDK.</li>
      <li>Mengunggah dokumen brief, aset brand, atau materi data acuan ke repositori proyek.</li>
      <li>Mengajukan permohonan revisi secara terstruktur dengan catatan detail.</li>
      <li>Memberikan persetujuan (*approval*) resmi atas deliverable proyek.</li>
    </ul>

    <h2 id="perbandingan">2.5 Matriks Komparasi Hak Akses (RBAC)</h2>
    <p>Tabel berikut memetakan ketersediaan 18 modul dan halaman sistem untuk masing-masing peran:</p>

    <table>
      <thead>
        <tr>
          <th>Modul / Fitur Sistem</th>
          <th style="text-align: center;"><span class="badge badge-admin">ADMIN</span></th>
          <th style="text-align: center;"><span class="badge badge-lead">LEAD</span></th>
          <th style="text-align: center;"><span class="badge badge-staff">STAFF</span></th>
          <th style="text-align: center;"><span class="badge badge-client">CLIENT</span></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Dashboard Eksekutif (/)</strong></td>
          <td style="text-align: center;">✅ Penuh</td>
          <td style="text-align: center;">✅ Khusus Lead</td>
          <td style="text-align: center;">✅ Khusus Staff</td>
          <td style="text-align: center;">❌ Dibatasi</td>
        </tr>
        <tr>
          <td><strong>Direktori Proyek (/projects)</strong></td>
          <td style="text-align: center;">✅ Semua Proyek</td>
          <td style="text-align: center;">✅ Semua Proyek</td>
          <td style="text-align: center;">✅ Hanya Terdaftar</td>
          <td style="text-align: center;">❌ Dibatasi</td>
        </tr>
        <tr>
          <td><strong>Pembuatan Proyek Baru (/projects/new)</strong></td>
          <td style="text-align: center;">✅ Ya</td>
          <td style="text-align: center;">✅ Ya</td>
          <td style="text-align: center;">❌ Dibatasi</td>
          <td style="text-align: center;">❌ Dibatasi</td>
        </tr>
        <tr>
          <td><strong>Papan Kanban (/kanban)</strong></td>
          <td style="text-align: center;">✅ Baca / Tulis</td>
          <td style="text-align: center;">✅ Baca / Tulis</td>
          <td style="text-align: center;">✅ Update Tugas</td>
          <td style="text-align: center;">❌ Dibatasi</td>
        </tr>
        <tr>
          <td><strong>Gantt Timeline (/timeline)</strong></td>
          <td style="text-align: center;">✅ Penuh</td>
          <td style="text-align: center;">✅ Penuh</td>
          <td style="text-align: center;">👁️ Lihat Saja</td>
          <td style="text-align: center;">❌ Dibatasi</td>
        </tr>
        <tr>
          <td><strong>Jadwal Global (/timeline/global)</strong></td>
          <td style="text-align: center;">✅ Penuh</td>
          <td style="text-align: center;">✅ Penuh</td>
          <td style="text-align: center;">👁️ Lihat Saja</td>
          <td style="text-align: center;">❌ Dibatasi</td>
        </tr>
        <tr>
          <td><strong>Client Cockpit (/cockpit)</strong></td>
          <td style="text-align: center;">✅ Supervisi</td>
          <td style="text-align: center;">✅ Supervisi</td>
          <td style="text-align: center;">❌ Dibatasi</td>
          <td style="text-align: center;">✅ Portal Utama</td>
        </tr>
        <tr>
          <td><strong>Manajemen Sumber Daya (/resources)</strong></td>
          <td style="text-align: center;">✅ Penuh</td>
          <td style="text-align: center;">✅ Penuh</td>
          <td style="text-align: center;">❌ Dibatasi</td>
          <td style="text-align: center;">❌ Dibatasi</td>
        </tr>
        <tr>
          <td><strong>Repositori Berkas (/files)</strong></td>
          <td style="text-align: center;">✅ Penuh</td>
          <td style="text-align: center;">✅ Penuh</td>
          <td style="text-align: center;">✅ Upload/Download</td>
          <td style="text-align: center;">✅ Sesuai Proyek</td>
        </tr>
        <tr>
          <td><strong>Chat Realtime (/chat)</strong></td>
          <td style="text-align: center;">✅ Semua Channel</td>
          <td style="text-align: center;">✅ Channel Proyek</td>
          <td style="text-align: center;">✅ Channel Tim</td>
          <td style="text-align: center;">✅ Channel Resmi</td>
        </tr>
        <tr>
          <td><strong>Presensi & Jam Kerja (/time-tracking)</strong></td>
          <td style="text-align: center;">✅ Audit Seluruh Tim</td>
          <td style="text-align: center;">✅ Rekapitulasi Tim</td>
          <td style="text-align: center;">✅ Presensi Pribadi</td>
          <td style="text-align: center;">❌ Dibatasi</td>
        </tr>
        <tr>
          <td><strong>Manajemen Klien (/clients)</strong></td>
          <td style="text-align: center;">✅ Penuh</td>
          <td style="text-align: center;">👁️ Lihat Saja</td>
          <td style="text-align: center;">❌ Dibatasi</td>
          <td style="text-align: center;">❌ Dibatasi</td>
        </tr>
        <tr>
          <td><strong>Template Alur Kerja (/templates)</strong></td>
          <td style="text-align: center;">✅ Buat & Edit</td>
          <td style="text-align: center;">👁️ Gunakan Template</td>
          <td style="text-align: center;">❌ Dibatasi</td>
          <td style="text-align: center;">❌ Dibatasi</td>
        </tr>
        <tr>
          <td><strong>Manajemen Pengguna (/users)</strong></td>
          <td style="text-align: center;">✅ Penuh (CRUD)</td>
          <td style="text-align: center;">❌ Dibatasi</td>
          <td style="text-align: center;">❌ Dibatasi</td>
          <td style="text-align: center;">❌ Dibatasi</td>
        </tr>
        <tr>
          <td><strong>Laporan & Analitik (/reports)</strong></td>
          <td style="text-align: center;">✅ Penuh</td>
          <td style="text-align: center;">✅ Laporan Proyek</td>
          <td style="text-align: center;">❌ Dibatasi</td>
          <td style="text-align: center;">❌ Dibatasi</td>
        </tr>
        <tr>
          <td><strong>Log Aktivitas Audit (/activity)</strong></td>
          <td style="text-align: center;">✅ Penuh</td>
          <td style="text-align: center;">👁️ Proyek Terkait</td>
          <td style="text-align: center;">❌ Dibatasi</td>
          <td style="text-align: center;">❌ Dibatasi</td>
        </tr>
        <tr>
          <td><strong>Notifikasi (/notifications)</strong></td>
          <td style="text-align: center;">✅ Ada</td>
          <td style="text-align: center;">✅ Ada</td>
          <td style="text-align: center;">✅ Ada</td>
          <td style="text-align: center;">✅ Ada</td>
        </tr>
        <tr>
          <td><strong>Pengaturan Akun (/settings)</strong></td>
          <td style="text-align: center;">✅ Ada</td>
          <td style="text-align: center;">✅ Ada</td>
          <td style="text-align: center;">✅ Ada</td>
          <td style="text-align: center;">✅ Ada</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- ============================================= -->
  <!-- BAB 3: MEMULAI -->
  <!-- ============================================= -->
  <section id="getting-started">
    <h1>3. Panduan Memulai (Getting Started)</h1>

    <h2 id="login">3.1 Prosedur Login ke Sistem</h2>
    <p>
      Untuk masuk ke SDK Orchestration Hub, ikuti langkah-langkah mudah berikut:
    </p>

    <ol class="steps">
      <li>
        <p>Buka peramban dan akses alamat portal resmi: <code>https://sdk-orchestration-hub.vercel.app/login</code> (atau <code>http://localhost:5173/login</code> pada instalasi lokal).</p>
        <div class="screenshot">
          <img src="screenshots/01-login-page.png" alt="Halaman Login SDK">
          <div class="caption">Gambar 3.1 — Tampilan Halaman Autentikasi SDK Orchestration Hub</div>
        </div>
      </li>
      <li>
        <p>Masukkan <strong>Email Perusahaan</strong> atau <strong>Username</strong> Anda pada kolom input pertama.</p>
      </li>
      <li>
        <p>Masukkan <strong>Kata Sandi (Password)</strong> Anda pada kolom kedua. Anda dapat mengklik ikon mata di sisi kanan kolom untuk menampilkan/menyembunyikan karakter sandi.</p>
        <div class="screenshot">
          <img src="screenshots/01d-login-password-shown.png" alt="Fitur Tampil Kata Sandi">
          <div class="caption">Gambar 3.2 — Fitur Tampil Kata Sandi untuk Menghindari Kesalahan Ketik</div>
        </div>
      </li>
      <li>
        <p>Klik tombol <strong>Sign in</strong> yang berwarna oranye terang.</p>
      </li>
      <li>
        <p>Sistem akan memvalidasi kredensial via Supabase. Setelah sukses, Anda akan langsung dialihkan ke halaman beranda sesuai peran akun Anda.</p>
      </li>
    </ol>

    <h2 id="role-simulator">3.2 Simulasi Cepat (Role Simulator)</h2>
    <p>
      Untuk keperluan pengujian alur, demonstrasi, dan QA internal, halaman login dilengkapi dengan panel <strong>Role Simulator</strong> di bagian bawah kartu login. Anda dapat mengklik salah satu tombol peran untuk login secara instan tanpa perlu mengetik kredensial manual:
    </p>
    <ul>
      <li><span class="badge badge-admin">Administrator</span> — Akun: <code>arya.admin@subaga.id</code></li>
      <li><span class="badge badge-lead">Project Lead</span> — Akun: <code>ulba.lead@subaga.id</code></li>
      <li><span class="badge badge-staff">Staff Engineer</span> — Akun: <code>andi.qa@subaga.id</code></li>
      <li><span class="badge badge-client">Client PIC</span> — Akun: <code>dr.budi@rsud-sehat.id</code></li>
    </ul>

    <div class="screenshot">
      <img src="screenshots/01b-login-role-simulator.png" alt="Tombol Role Preset Simulator">
      <div class="caption">Gambar 3.3 — Tombol Role Switcher Cepat pada Lingkungan Staging & QA</div>
    </div>

    <h2 id="logout">3.3 Prosedur Logout Aman</h2>
    <p>
      Untuk menjaga kerahasiaan data di komputer bersama (*shared workstation*), selalu lakukan logout setelah selesai bekerja:
    </p>
    <ol class="steps">
      <li>
        <p>Klik <strong>Avatar / Foto Profil</strong> Anda yang terletak di sudut kanan atas bilah navigasi (header).</p>
      </li>
      <li>
        <p>Jendela menu profil akan terbuka menampilkan detail nama, email, dan jabatan Anda.</p>
        <div class="screenshot">
          <img src="screenshots/03-admin-profile-dropdown.png" alt="Menu Dropdown Profil">
          <div class="caption">Gambar 3.4 — Menu Dropdown Profil di Pojok Kanan Atas</div>
        </div>
      </li>
      <li>
        <p>Pilih opsi <strong>Sign Out (Keluar)</strong> di baris terbawah. Seluruh session terenkripsi akan dihapus dan Anda diarahkan kembali ke layar login.</p>
      </li>
    </ol>

    <h2 id="change-password">3.4 Mengubah Kata Sandi & Profil</h2>
    <ol class="steps">
      <li>
        <p>Buka menu <strong>Pengaturan (Settings)</strong> dari navigasi sidebar atau dropdown profil.</p>
      </li>
      <li>
        <p>Pilih tab <strong>Akun & Keamanan</strong>.</p>
        <div class="screenshot">
          <img src="screenshots/21b-admin-settings-account.png" alt="Tab Akun di Settings">
          <div class="caption">Gambar 3.5 — Formulir Perubahan Kata Sandi & Pengaturan Keamanan</div>
        </div>
      </li>
      <li>
        <p>Masukkan kata sandi lama, lalu tentukan kata sandi baru (minimal 8 karakter kombinasi huruf dan angka), lalu klik <strong>Simpan Perubahan</strong>.</p>
      </li>
      <li>
        <p>Untuk mengganti foto profil, buka tab <strong>Profil & Avatar</strong>, klik <strong>Unggah Foto</strong>, sesuaikan crop lingkaran, lalu simpan.</p>
        <div class="screenshot">
          <img src="screenshots/21c-admin-avatar-crop.png" alt="Modal Crop Avatar">
          <div class="caption">Gambar 3.6 — Modal Circular Cropper untuk Foto Avatar Profesional</div>
        </div>
      </li>
    </ol>

    <h2 id="theme-toggle">3.5 Personalisasi Tema (Dark / Light Mode)</h2>
    <p>
      Aplikasi mendukung peralihan mode tampilan secara instan sesuai kenyamanan mata pengguna:
    </p>
    <ul>
      <li><strong>Dark Mode (Mode Gelap):</strong> Nuansa dark navy (#0B0F19) elegan yang mengurangi ketegangan mata saat bekerja di malam hari.</li>
      <li><strong>Light Mode (Mode Terang):</strong> Tampilan bersih dengan kontras tinggi untuk ruangan beriluminasi terang.</li>
    </ul>
    <p>Cara mengganti: Klik ikon Matahari / Bulan pada header atas atau melalui tab Preferensi di Pengaturan.</p>

    <div class="screenshot">
      <img src="screenshots/21d-admin-theme-dark.png" alt="Tampilan Dark Mode">
      <div class="caption">Gambar 3.7 — Antarmuka Pengaturan dalam Tema Mode Gelap (Dark Mode)</div>
    </div>

    <h2 id="language-toggle">3.6 Pengaturan Bahasa (ID / EN)</h2>
    <p>
      SDK Orchestration Hub mendukung antarmuka dwibahasa:
    </p>
    <ul>
      <li><strong>Bahasa Indonesia (ID):</strong> Pilihan default resmi operasional SDK.</li>
      <li><strong>English (EN):</strong> Cocok untuk stakeholder multinasional atau mitra luar negeri.</li>
    </ul>
    <p>Klik tombol bendera/bahasa di bilah navigasi atas untuk berpindah bahasa seketika.</p>

    <h2 id="global-search">3.7 Navigasi Cepat Global Search (⌘K / Ctrl+K)</h2>
    <p>
      Untuk efisiensi kerja tinggi, sistem dilengkapi modal pencarian global terpadu. Tekan kombinasi tombol <code>Ctrl + K</code> (Windows/Linux) atau <code>⌘ + K</code> (macOS) dari halaman mana pun.
    </p>
    <div class="screenshot">
      <img src="screenshots/global-search-modal.png" alt="Modal Global Search">
      <div class="caption">Gambar 3.8 — Modal Global Search Memungkinkan Navigasi Instan ke Proyek, Task, atau Menu</div>
    </div>
    <p>Ketikkan kata kunci proyek atau nama anggota tim, gunakan tombol panah keyboard untuk memilih hasil, dan tekan <strong>Enter</strong> untuk langsung menuju halaman target.</p>
  </section>

  <!-- ============================================= -->
  <!-- BAB 4: PANDUAN ADMIN -->
  <!-- ============================================= -->
  <section id="admin">
    <h1>4. Panduan Lengkap Administrator (ADMIN)</h1>
    <p>
      Bab ini menyajikan petunjuk terperinci bagi pemegang peran <span class="badge badge-admin">ADMIN</span> dalam memanfaatkan ke-17 modul sistem SDK Orchestration Hub.
    </p>

    <h2 id="admin-dashboard">4.1 Dashboard Eksekutif & Ringkasan KPI</h2>
    <p>
      Dashboard Eksekutif berfungsi sebagai pusat komando operasional yang menyajikan metrik kesehatan proyek, alokasi sumber daya, dan riwayat aktivitas terkini secara real-time.
    </p>

    <div class="screenshot">
      <img src="screenshots/04-admin-dashboard-full.png" alt="Dashboard Penuh Admin">
      <div class="caption">Gambar 4.1 — Tampilan Utuh Dashboard Eksekutif Administrator</div>
    </div>

    <h3>Elemen Antarmuka Utama:</h3>
    <ul>
      <li><strong>Kartu KPI Metrik:</strong> Menampilkan ringkasan Total Proyek Aktif, Jumlah Sprint Task Terbuka, Total Proyek Selesai, dan Rata-rata Skor Kesehatan (Health Score).</li>
      <li><strong>Diagram Distribusi Proyek (Pie Chart):</strong> Visualisasi persentase proyek berdasarkan fase tahapan (Pitching, Discovery, Architecture, Sprints, Handover). Hover di atas diagram untuk menampilkan tooltip detail.</li>
      <li><strong>Tabel Status Proyek Terkini:</strong> Memuat nama proyek, klien, project lead, progress bar persentase, tanggal target selesai, dan badge kesehatan warna.</li>
      <li><strong>Bilah Feed Aktivitas Terkini:</strong> Rekaman aktivitas terbaru yang dilakukan seluruh staf secara kronologis.</li>
    </ul>

    <div class="screenshot">
      <img src="screenshots/04c-admin-chart-tooltip.png" alt="Tooltip Pie Chart">
      <div class="caption">Gambar 4.2 — Tooltip Interaktif Diagram Status Proyek</div>
    </div>

    <h2 id="admin-projects">4.2 Manajemen Direktori Proyek</h2>
    <p>
      Melalui menu <strong>Proyek (Projects)</strong>, Administrator dapat meninjau seluruh portofolio proyek SDK yang sedang berjalan maupun yang telah diarsipkan.
    </p>
    <div class="screenshot">
      <img src="screenshots/04-admin-projects-list.png" alt="Daftar Proyek">
      <div class="caption">Gambar 4.3 — Halaman Direktori Proyek dengan Fitur Pencarian dan Filter Cerdas</div>
    </div>
    <ol class="steps">
      <li>Gunakan bilah <strong>Cari Proyek</strong> untuk menemukan proyek berdasarkan judul atau kode kontrak.</li>
      <li>Gunakan filter dropdown untuk memilah proyek berdasarkan <strong>Model Pengiriman</strong> (Consulting, Custom, Subscription) atau <strong>Status Kesehatan</strong>.</li>
      <li>Klik baris kartu proyek untuk membuka jendela modal detail komprehensif.</li>
    </ol>

    <div class="screenshot">
      <img src="screenshots/05-admin-project-detail-modal.png" alt="Modal Detail Proyek">
      <div class="caption">Gambar 4.4 — Modal Detail Proyek Menyediakan Tautan Cepat ke Kanban, Timeline, dan Berkas</div>
    </div>

    <h2 id="admin-create-project">4.3 Wizard Pembuatan Proyek Baru</h2>
    <p>
      Untuk mendaftarkan kontrak pekerjaan baru ke sistem, buka menu <strong>Proyek</strong> lalu klik tombol <strong>New Project (+ Buat Proyek)</strong> di sudut kanan atas.
    </p>
    <div class="screenshot">
      <img src="screenshots/05b-admin-create-project.png" alt="Form Pembuatan Proyek">
      <div class="caption">Gambar 4.5 — Wizard Pembuatan Proyek Baru (Langkah Inisialisasi)</div>
    </div>
    <ol class="steps">
      <li><strong>Langkah 1 (Identitas Proyek):</strong> Masukkan Judul Proyek, Kode Unik Proyek (contoh: <code>PRJ-RSUD-01</code>), dan deskripsi ruang lingkup kerja.</li>
      <li><strong>Langkah 2 (Klien & Penanggung Jawab):</strong> Pilih Mitra Klien dari daftar dan tentukan Project Lead yang memimpin pengiriman.</li>
      <li><strong>Langkah 3 (Model Pengiriman & Anggaran):</strong> Pilih model delivery (Consulting, Custom Development, Subscription) dan tentukan estimasi nominal budget.</li>
      <li><strong>Langkah 4 (Pilihan Template Alur Kerja):</strong> Pilih template alur (misal: <em>Healthcare System Workflow</em> atau <em>Social Sentiment Analysis</em>) untuk menggenerate struktur tugas otomatis.</li>
      <li>Klik <strong>Simpan & Terbitkan Proyek</strong>. Sistem akan menginisiasi repositori file dan channel chat secara otomatis.</li>
    </ol>

    <h2 id="admin-kanban">4.4 Papan Orkestrasi & Kontrol Tugas (Kanban)</h2>
    <p>
      Papan Kanban (Orchestration Board) adalah ruang pemantauan status penyelesaian fitur secara visual.
    </p>
    <div class="screenshot">
      <img src="screenshots/06-admin-kanban.png" alt="Papan Kanban Admin">
      <div class="caption">Gambar 4.6 — Papan Kanban Alur Kerja Tugas End-to-End</div>
    </div>
    <h3>Fitur Utama Kanban:</h3>
    <ul>
      <li><strong>Kolom Tahapan:</strong> Terdiri dari <code>BACKLOG</code>, <code>TODO</code>, <code>IN PROGRESS</code>, <code>REVIEW</code>, dan <code>DONE</code>.</li>
      <li><strong>Drag and Drop:</strong> Geser kartu tugas antar kolom untuk memperbarui progres pekerjaan secara otomatis.</li>
      <li><strong>Filter Prioritas:</strong> Tampilkan tugas berdasarkan prioritas <em>URGENT</em>, <em>HIGH</em>, <em>MEDIUM</em>, atau <em>LOW</em>.</li>
      <li><strong>Membuat Tugas Baru:</strong> Klik tombol <strong>+ Add Task</strong> di kepala kolom untuk membuka modal pembuatan tugas.</li>
    </ul>

    <div class="screenshot">
      <img src="screenshots/07-admin-kanban-create-task.png" alt="Modal Buat Task">
      <div class="caption">Gambar 4.7 — Modal Pembuatan Tugas dengan Pengaturan Estimasi Jam dan Assignee</div>
    </div>

    <div class="callout warning">
      <strong>⚠️ Penandaan Tugas Terhambat (Is Blocked)</strong>
      Jika staf mengalami hambatan eksternal (misal: keterlambatan API mitra atau izin akses server), centang opsi <strong>Task is Blocked</strong> pada detail tiket dan tuliskan alasannya. Kartu tugas akan diberi highlight merah peringatan agar segera ditindaklanjuti Project Lead.
    </div>

    <div class="screenshot">
      <img src="screenshots/07b-admin-kanban-task-blocked.png" alt="Task Blocked Highlight">
      <div class="caption">Gambar 4.8 — Indikator Visual Tugas Berstatus Blocked</div>
    </div>

    <h2 id="admin-timeline">4.5 Jadwal Proyek (Gantt Timeline)</h2>
    <p>
      Modul Jadwal Proyek memvisualisasikan durasi tugas pada diagram batang horizontal (*Gantt Chart*).
    </p>
    <div class="screenshot">
      <img src="screenshots/08-admin-timeline.png" alt="Gantt Timeline Proyek">
      <div class="caption">Gambar 4.9 — Visualisasi Timeline Gantt per Proyek</div>
    </div>
    <p>
      Gunakan tombol navigasi <code>&lt; Prev</code>, <code>Today</code>, dan <code>Next &gt;</code> untuk menelusuri rentang waktu pelaksanaan sprint. Durasi tugas yang melewati batas tenggat waktu akan ditandai dengan strip peringatan merah.
    </p>

    <h2 id="admin-global-timeline">4.6 Jadwal Global Lintas Portofolio</h2>
    <p>
      Halaman <strong>Jadwal Global (Global Timeline)</strong> menyajikan peta waktu seluruh proyek perusahaan dalam satu layar tahunan.
    </p>
    <div class="screenshot">
      <img src="screenshots/08c-admin-global-timeline.png" alt="Global Timeline Portofolio">
      <div class="caption">Gambar 4.10 — Jadwal Global Multi-Proyek untuk Analisis Kapasitas Tahunan</div>
    </div>
    <p>
      Modul ini sangat bermanfaat bagi tim eksekutif untuk melihat utilisasi pipeline perusahaan pada Kuartal I hingga Kuartal IV dan mengantisipasi benturan tenggat waktu antar proyek besar.
    </p>

    <h2 id="admin-cockpit">4.7 Monitoring Kokpit Klien</h2>
    <p>
      Administrator memiliki akses peninjauan (*supervisory view*) terhadap portal <strong>Client Cockpit</strong> guna memastikan data yang ditampilkan kepada mitra klien akurat, rapi, dan sesuai standar representasi SDK.
    </p>
    <div class="screenshot">
      <img src="screenshots/26-client-cockpit.png" alt="Client Cockpit Supervisory">
      <div class="caption">Gambar 4.11 — Tampilan Portal Client Cockpit yang Dipantau oleh Admin</div>
    </div>

    <h2 id="admin-files">4.8 Repositori Dokumen & Berkas Proyek</h2>
    <p>
      Modul <strong>Berkas (Files Repository)</strong> menyediakan penyimpanan dokumen terorganisir per proyek.
    </p>
    <div class="screenshot">
      <img src="screenshots/16-admin-files.png" alt="Repositori File">
      <div class="caption">Gambar 4.12 — Repositori Dokumen Terkategori (Brief, Design, Specs, Deliverables)</div>
    </div>
    <ul>
      <li><strong>Kategori Tab:</strong> Pilah berkas berdasarkan tab <em>All Files</em>, <em>Briefs & Requirements</em>, <em>Design Assets</em>, <em>Deliverables</em>, dan <em>Legal & Invoices</em>.</li>
      <li><strong>Pencarian Dokumen:</strong> Cari dokumen berdasarkan nama file atau ekstensi (.pdf, .fig, .zip, .docx).</li>
      <li><strong>Unggah File:</strong> Seret berkas ke area dropzone atau klik <strong>Upload File</strong>.</li>
    </ul>

    <h2 id="admin-chat">4.9 Kolaborasi & Realtime Chat</h2>
    <p>
      Komunikasi instan antar tim dan klien terpusat di modul <strong>Chat</strong> tanpa perlu berpindah ke aplikasi pesan pihak ketiga.
    </p>
    <div class="screenshot">
      <img src="screenshots/15-admin-chat.png" alt="Realtime Chat Admin">
      <div class="caption">Gambar 4.13 — Saluran Komunikasi Proyek Real-Time dengan Fitur Lampiran</div>
    </div>
    <ul>
      <li>Pilih saluran channel di panel sebelah kiri (misal: <code>#prj-rsud-sehat</code> atau <code>#internal-engineering</code>).</li>
      <li>Ketikkan pesan pada kolom chat dan tekan <strong>Enter</strong> atau klik ikon kirim.</li>
      <li>Gunakan tombol <strong>+ Buat Grup Baru</strong> untuk membuka dialog pembentukan channel kolaborasi ad-hoc.</li>
    </ul>

    <div class="screenshot">
      <img src="screenshots/15c-admin-chat-group-modal.png" alt="Modal Buat Grup Chat">
      <div class="caption">Gambar 4.14 — Modal Pembentukan Saluran Obrolan Tim Baru</div>
    </div>

    <h2 id="admin-resources">4.10 Alokasi Sumber Daya & Beban Tim</h2>
    <p>
      Modul <strong>Sumber Daya (Resources)</strong> mengawasi distribusi jam kerja mingguan seluruh staf teknologi untuk mencegah kelelahan kerja (*burnout*).
    </p>
    <div class="screenshot">
      <img src="screenshots/09-admin-resources.png" alt="Alokasi Sumber Daya">
      <div class="caption">Gambar 4.15 — Matriks Kapasitas dan Beban Jam Kerja Karyawan Mingguan</div>
    </div>
    <p>
      Setiap profil memiliki batas beban normal <strong>40 jam/minggu</strong>. Jika akumulasi estimasi tugas yang ditugaskan melebihi ambang batas, kartu staf akan berubah warna menjadi merah dengan peringatan *Overcapacity*. Klik kartu staf untuk membuka drawer detail alokasi tugas yang sedang diemban.
    </p>

    <div class="screenshot">
      <img src="screenshots/09b-admin-resource-drawer.png" alt="Drawer Profil Resource">
      <div class="caption">Gambar 4.16 — Drawer Rincian Beban Kerja dan Tugas Aktif Anggota Tim</div>
    </div>

    <h2 id="admin-time-tracking">4.11 Monitoring Presensi & Jam Kerja (Time Tracking)</h2>
    <p>
      Modul Presensi Jam Kerja memuat log absensi real-time karyawan berbasis fitur <em>Clock In / Clock Out</em>.
    </p>
    <div class="screenshot">
      <img src="screenshots/17-admin-time-tracking.png" alt="Time Tracking Admin">
      <div class="caption">Gambar 4.17 — Dasbor Monitoring Presensi dan Akumulasi Jam Kerja Karyawan</div>
    </div>
    <ol class="steps">
      <li><strong>Tab Ringkasan:</strong> Melihat siapa staf yang sedang berstatus <em>Active Clocked In</em> hari ini.</li>
      <li><strong>Tab Analitik:</strong> Menampilkan diagram tren jam kerja harian, perbandingan jam kerja per departemen, dan rasio lembur.</li>
      <li><strong>Tab Audit Presensi:</strong> Memeriksa riwayat lengkap pencatatan jam masuk, jam keluar, durasi menit, serta catatan aktivitas staf untuk keperluan payroll.</li>
    </ol>

    <div class="screenshot">
      <img src="screenshots/17c-admin-time-audit.png" alt="Tab Audit Log Presensi">
      <div class="caption">Gambar 4.18 — Rekapitulasi Audit Jam Kerja Karyawan Terperinci</div>
    </div>

    <h2 id="admin-clients">4.12 Manajemen Mitra Klien & Akun Baru</h2>
    <p>
      Menu <strong>Klien (Clients Management)</strong> adalah tempat Administrator mendaftarkan instansi mitra dan mengelola data PIC resmi.
    </p>
    <div class="screenshot">
      <img src="screenshots/12-admin-clients-list.png" alt="Daftar Klien">
      <div class="caption">Gambar 4.19 — Direktori Mitra Klien PT Subaga Digital Kreatif</div>
    </div>
    <ol class="steps">
      <li>Klik tombol <strong>+ Add New Client</strong> di pojok kanan atas.</li>
      <li>Lengkapi nama perusahaan, alamat, nama PIC, email resmi PIC, dan nomor kontak aktif.</li>
      <li>Klik <strong>Create Client & Generate Credentials</strong>.</li>
      <li>Sistem akan menampilkan modal kredensial akun dengan kata sandi sementara yang dienkripsi. Salin informasi akun tersebut untuk diserahkan kepada klien.</li>
    </ol>

    <div class="screenshot">
      <img src="screenshots/13c-admin-client-credentials.png" alt="Modal Kredensial Klien">
      <div class="caption">Gambar 4.20 — Modal Kredensial Akun Klien Baru Siap Dikirim</div>
    </div>

    <h2 id="admin-templates">4.13 Template Alur Kerja Standar (Workflow Templates)</h2>
    <p>
      Untuk menjamin standar mutu yang konsisten di setiap proyek, SDK Orchestration Hub menyediakan katalog template alur kerja.
    </p>
    <div class="screenshot">
      <img src="screenshots/14-admin-templates.png" alt="Katalog Template">
      <div class="caption">Gambar 4.21 — Katalog Standar Template Alur Kerja Proyek</div>
    </div>
    <p>
      Template populer mencakup: <strong>Social Sentiment Analysis Engine</strong> (tahap scraping, NLP modeling, visualisasi) dan <strong>Healthcare Hospital Management</strong> (audit kepatuhan medis, integrasi BPJS, modul rawat jalan). Klik <strong>Preview Structure</strong> untuk meninjau pohon struktur task sebelum diterapkan ke proyek baru.
    </p>

    <h2 id="admin-activity">4.14 Log Audit Aktivitas Sistem</h2>
    <p>
      Untuk memenuhi standar tata kelola kepatuhan (*compliance*) dan transparansi operasional, modul <strong>Log Aktivitas (Activity Log)</strong> merekam seluruh aksi krusial di sistem.
    </p>
    <div class="screenshot">
      <img src="screenshots/19-admin-activity.png" alt="Log Audit Aktivitas">
      <div class="caption">Gambar 4.22 — Rekam Jejak Audit Seluruh Operasi dan Modifikasi Data</div>
    </div>
    <p>
      Gunakan tombol filter kategori (Auth, Tasks, Projects, Files, Users) untuk mengisolasi penelusuran audit terhadap modifikasi data tertentu.
    </p>

    <h2 id="admin-users">4.15 Manajemen Akun Pengguna & Izin</h2>
    <p>
      Menu <strong>Pengguna (Users Management)</strong> diperuntukkan khusus bagi Administrator guna menambah, mengedit profil, dan menetapkan peran staf.
    </p>
    <div class="screenshot">
      <img src="screenshots/10-admin-users-list.png" alt="Manajemen Pengguna">
      <div class="caption">Gambar 4.23 — Panel Manajemen Akun Karyawan dan Pembagian Role</div>
    </div>
    <ol class="steps">
      <li>Klik tombol <strong>+ Add User</strong>.</li>
      <li>Masukkan nama lengkap, alamat email korporat, departemen, dan jabatan struktural.</li>
      <li>Tentukan peran hak akses: <code>ADMIN</code>, <code>PROJECT_LEAD</code>, atau <code>STAFF</code>.</li>
      <li>Atur batas kapasitas jam kerja mingguan (default: 40 jam) lalu klik <strong>Simpan Pengguna</strong>.</li>
    </ol>

    <div class="screenshot">
      <img src="screenshots/11-admin-users-add-modal.png" alt="Modal Tambah User">
      <div class="caption">Gambar 4.24 — Modal Penambahan Karyawan Baru ke Sistem</div>
    </div>

    <h2 id="admin-reports">4.16 Analitik Performa & Laporan Eksekutif</h2>
    <p>
      Halaman <strong>Laporan & Analitik (Reports)</strong> menyajikan evaluasi metrik penyelesaian tugas, velocity sprint, dan rasio ketepatan waktu pengiriman proyek.
    </p>
    <div class="screenshot">
      <img src="screenshots/18-admin-reports.png" alt="Laporan & Analitik">
      <div class="caption">Gambar 4.25 — Dashboard Analisis Kinerja Operasional dan Ekspor Laporan</div>
    </div>

    <h2 id="admin-settings">4.17 Pusat Pengaturan Sistem</h2>
    <p>
      Melalui menu <strong>Pengaturan (Settings)</strong>, Administrator dapat mengonfigurasi preferensi global, format tanggal regional, notifikasi email, dan profil administrator.
    </p>
    <div class="screenshot">
      <img src="screenshots/21-admin-settings.png" alt="Pengaturan Sistem">
      <div class="caption">Gambar 4.26 — Pusat Pengaturan Preferensi dan Keamanan Sistem</div>
    </div>
  </section>

  <!-- ============================================= -->
  <!-- BAB 5: PANDUAN PROJECT LEAD -->
  <!-- ============================================= -->
  <section id="project-lead">
    <h1>5. Panduan Project Lead (PROJECT_LEAD)</h1>
    <p>
      Peran <span class="badge badge-lead">PROJECT_LEAD</span> bertanggung jawab atas orkestrasi teknis di lapangan, koordinasi tim pengembang, serta menjadi jembatan utama komunikasi dengan mitra klien.
    </p>

    <h2 id="lead-dashboard">5.1 Dashboard Operasional Project Lead</h2>
    <p>
      Saat login sebagai Project Lead, dashboard akan menampilkan fokus pada proyek-proyek yang ditugaskan di bawah binaan Anda.
    </p>
    <div class="screenshot">
      <img src="screenshots/22-lead-dashboard.png" alt="Dashboard Project Lead">
      <div class="caption">Gambar 5.1 — Dashboard Operasional Project Lead</div>
    </div>

    <h2 id="lead-overdue">5.2 Sistem Deteksi Hambatan (Client Overdue Alert)</h2>
    <p>
      Salah satu keunggulan SDK Orchestration Hub adalah kapabilitas <strong>Client Overdue Alert</strong>. Jika suatu tugas berstatus <em>Waiting for Client</em> (misal menunggu review atau data sampel dari klien) selama lebih dari 48 jam kerja, sistem akan memicu kartu peringatan khusus di dashboard Lead.
    </p>
    <div class="screenshot">
      <img src="screenshots/23-lead-overdue-alert.png" alt="Peringatan Overdue Klien">
      <div class="caption">Gambar 5.2 — Notifikasi Peringatan Tugas Tertunda Akibat Menunggu Respon Klien</div>
    </div>
    <p>
      Lead dapat mengklik tombol <strong>Hubungi Klien</strong> pada kartu peringatan untuk langsung membuka obrolan chat resmi dan mengirimkan pengingat ramah.
    </p>

    <h2 id="lead-projects">5.3 Manajemen Proyek Binaan</h2>
    <p>
      Project Lead memiliki wewenang untuk memperbarui rincian tahapan (Stage) proyek binaan dari <em>PITCHING</em>, <em>DISCOVERY</em>, <em>SPRINTS</em>, hingga <em>HANDOVER</em>.
    </p>

    <h2 id="lead-kanban">5.4 Penugasan & Prioritas Sprint</h2>
    <ol class="steps">
      <li>Buka Papan Kanban proyek binaan Anda.</li>
      <li>Tinjau kartu pada kolom <code>BACKLOG</code> bersama tim saat Sprint Planning.</li>
      <li>Tetapkan <strong>Assignee</strong> kepada staf yang memiliki keahlian relevan dan belum kelebihan jam kerja.</li>
      <li>Atur tanggal tenggat (*Due Date*) dan estimasi jam (*Estimated Hours*).</li>
      <li>Pindahkan kartu ke kolom <code>TODO</code> untuk menandakan tugas siap dikerjakan di sprint aktif.</li>
    </ol>

    <h2 id="lead-resources">5.5 Penyeimbangan Utilisasi Jam Kerja Tim</h2>
    <p>
      Sebelum menetapkan tiket tugas, Lead wajib membuka modul <strong>Resources</strong> untuk memeriksa beban kerja masing-masing engineer. Hindari menugaskan lebih dari 35–40 jam per minggu ke satu staf agar mutu kode dan kesehatan tim tetap terjaga optimal.
    </p>

    <h2 id="lead-approval">5.6 Alur Review Deliverable & Revisi</h2>
    <p>
      Ketika staf memindahkan tugas ke kolom <code>REVIEW</code> dan mengunggah hasil deliverable ke repositori, Project Lead melakukan *Quality Gate* pertama:
    </p>
    <ol class="steps">
      <li>Periksa hasil kerja staf terhadap kriteria penerimaan (*acceptance criteria*).</li>
      <li>Jika sesuai, tandai berkas sebagai <em>Ready for Client Review</em>.</li>
      <li>Jika klien kemudian mengajukan revisi melalui Cockpit, Lead akan menerima notifikasi prioritas tinggi dan membuat subtask perbaikan bagi tim pengembang.</li>
    </ol>

    <h2 id="lead-chat">5.7 Komunikasi Terpadu dengan Klien</h2>
    <p>
      Seluruh komunikasi klarifikasi teknis dengan perwakilan klien dilakukan melalui channel proyek resmi untuk memastikan adanya rekam jejak tertulis yang transparan dan dapat diaudit jika terjadi perubahan ruang lingkup (*scope creep*).
    </p>
  </section>

  <!-- ============================================= -->
  <!-- BAB 6: PANDUAN STAFF -->
  <!-- ============================================= -->
  <section id="staff">
    <h1>6. Panduan Staff Engineer (STAFF)</h1>
    <p>
      Bab ini memandu anggota tim pelaksana teknis <span class="badge badge-staff">STAFF</span> (Frontend, Backend, Mobile Developer, QA Engineer, dan UI/UX Designer) dalam menjalani rutinitas kerja harian.
    </p>

    <h2 id="staff-dashboard">6.1 Dashboard Personal Staff</h2>
    <p>
      Dashboard Staff menyajikan informasi yang relevan langsung dengan pekerjaan pribadi Anda: widget presensi kerja, daftar tiket yang harus dikerjakan hari ini, dan pengumuman tim.
    </p>
    <div class="screenshot">
      <img src="screenshots/24-staff-dashboard.png" alt="Dashboard Staff">
      <div class="caption">Gambar 6.1 — Tampilan Beranda Dashboard Staff Engineer</div>
    </div>

    <h2 id="staff-clock">6.2 Tata Cara Presensi Kerja (Clock In / Clock Out)</h2>
    <p>
      SDK menerapkan sistem pencatatan kehadiran presisi berbasis waktu server:
    </p>
    <ol class="steps">
      <li>
        <p><strong>Saat Memulai Kerja (Pagi):</strong> Buka dashboard Anda dan klik tombol hijau besar <strong>Clock In</strong>. Indikator status akan berubah menjadi aktif dengan timer hitungan jam kerja berjalan.</p>
        <div class="screenshot">
          <img src="screenshots/25-staff-clock-in.png" alt="Status Clocked In">
          <div class="caption">Gambar 6.2 — Status Presensi Aktif setelah Berhasil Clock In</div>
        </div>
      </li>
      <li>
        <p><strong>Saat Istirahat atau Selesai Kerja:</strong> Klik tombol merah <strong>Clock Out</strong>. Masukkan ringkasan singkat pekerjaan yang telah Anda selesaikan hari ini pada kotak dialog konfirmasi, lalu simpan.</p>
        <div class="screenshot">
          <img src="screenshots/25b-staff-clock-out.png" alt="Status Clocked Out">
          <div class="caption">Gambar 6.3 — Konfirmasi Akhir Kerja Saat Melakukan Clock Out</div>
        </div>
      </li>
    </ol>

    <div class="callout note">
      <strong>⏱️ Kepatuhan Timesheet</strong>
      Pastikan selalu melakukan Clock In sebelum mulai menarik tugas di Kanban Board. Data presensi ini tersinkronisasi otomatis dengan rekapitulasi penilaian kinerja dan payroll bulanan.
    </div>

    <h2 id="staff-tasks">6.3 Manajemen Tugas Saya (My Tasks)</h2>
    <p>
      Gunakan tab <strong>Tugas Saya</strong> pada dashboard untuk melihat daftar tugas yang secara khusus ditugaskan kepada Anda, diurutkan berdasarkan tingkat urgensi tenggat waktu.
    </p>
    <div class="screenshot">
      <img src="screenshots/25c-staff-tasks.png" alt="Daftar Tugas Staff">
      <div class="caption">Gambar 6.4 — Filter Khusus Tugas yang Ditugaskan ke Akun Saya</div>
    </div>

    <h2 id="staff-kanban">6.4 Eksekusi Tugas pada Kanban Board</h2>
    <ol class="steps">
      <li>Ambil tugas dari kolom <code>TODO</code> lalu geser kartu ke kolom <code>IN PROGRESS</code> saat Anda mulai melakukan koding / pengerjaan.</li>
      <li>Bila menemukan kendala teknis tak terduga (misal server down atau kredensial API belum diserahkan), buka detail kartu dan aktifkan tanda <strong>Blocked</strong>.</li>
      <li>Setelah pekerjaan selesai diuji lokal, geser kartu ke kolom <code>REVIEW</code> untuk diverifikasi oleh Project Lead dan QA.</li>
    </ol>
    <div class="screenshot">
      <img src="screenshots/25d-staff-kanban-move.png" alt="Perpindahan Status Kanban">
      <div class="caption">Gambar 6.5 — Pembaruan Progres Kerja via Drag-and-Drop pada Papan Kanban</div>
    </div>

    <h2 id="staff-chat">6.5 Koordinasi Teknis via Chat</h2>
    <p>
      Gunakan saluran chat proyek untuk berdiskusi dengan Project Lead dan rekan satu sprint, membagikan cuplikan kode (*snippet*), dan mengonfirmasi hasil pull request.
    </p>

    <h2 id="staff-workload">6.6 Pemantauan Beban Kerja & Timesheet</h2>
    <p>
      Staf dapat melihat total jam kerja kumulatif mingguan mereka pada bilah ringkasan profil untuk memastikan tidak melebihi kuota 40 jam standar perusahaan.
    </p>
  </section>

  <!-- ============================================= -->
  <!-- BAB 7: PANDUAN CLIENT -->
  <!-- ============================================= -->
  <section id="client">
    <h1>7. Panduan Pengguna Klien (CLIENT)</h1>
    <p>
      Bab ini didedikasikan bagi perwakilan mitra klien <span class="badge badge-client">CLIENT</span> untuk memandu pemantauan proyek dan proses persetujuan deliverable secara mudah dan nyaman.
    </p>

    <h2 id="client-cockpit">7.1 Penjelajahan Portal Client Cockpit</h2>
    <p>
      Setelah berhasil login, perwakilan klien akan langsung diarahkan ke portal <strong>Client Cockpit</strong>. Portal ini menyajikan informasi proyek dengan bahasa bisnis yang mudah dipahami:
    </p>
    <div class="screenshot">
      <img src="screenshots/26-client-cockpit.png" alt="Portal Client Cockpit">
      <div class="caption">Gambar 7.1 — Antarmuka Utama Client Cockpit untuk Transparansi Milestone Proyek</div>
    </div>
    <ul>
      <li><strong>Persentase Progres Real-Time:</strong> Menunjukkan tingkat ketercapaian deliverable secara keseluruhan.</li>
      <li><strong>Kesehatan Proyek (Health Score):</strong> Indikator status kelancaran proyek (*On Track*, *Needs Attention*, atau *Critical*).</li>
      <li><strong>Timeline Milestone:</strong> Tahapan pencapaian proyek beserta tanggal perkiraan serah terima.</li>
    </ul>

    <h2 id="client-upload">7.2 Mengunggah Dokumen Acuan & Berkas</h2>
    <p>
      Jika tim SDK membutuhkan aset brand, logo resolusi tinggi, atau dokumen brief tambahan:
    </p>
    <ol class="steps">
      <li>Klik tombol <strong>Upload Brief / Asset</strong> di panel samping Cockpit.</li>
      <li>Pilih kategori berkas (Brief, Asset Gambar, Dokumen Legal).</li>
      <li>Pilih file dari komputer Anda (mendukung PDF, PNG, JPG, ZIP hingga 50 MB).</li>
      <li>Klik <strong>Kirim Berkas</strong>. Dokumen akan langsung tersimpan aman di repositori proyek dan tim SDK akan menerima notifikasi instan.</li>
    </ol>
    <div class="screenshot">
      <img src="screenshots/27-client-upload.png" alt="Modal Upload Berkas Klien">
      <div class="caption">Gambar 7.2 — Jendela Pengunggahan Berkas Materi Acuan oleh Klien</div>
    </div>

    <h2 id="client-chat">7.3 Berkomunikasi dengan Tim Proyek</h2>
    <p>
      Klien dapat berkomunikasi langsung dengan Project Lead melalui menu <strong>Chat dengan Tim</strong> di Cockpit tanpa perlu mengirim email bolak-balik. Seluruh riwayat obrolan terdokumentasi rapi.
    </p>
    <div class="screenshot">
      <img src="screenshots/29b-client-chat.png" alt="Chat Klien dengan Tim SDK">
      <div class="caption">Gambar 7.3 — Saluran Obrolan Resmi Klien dengan Project Lead SDK</div>
    </div>

    <h2 id="client-revision">7.4 Mengajukan Permintaan Revisi</h2>
    <p>
      Bila hasil pengujian deliverable memerlukan penyesuaian:
    </p>
    <ol class="steps">
      <li>Klik tombol <strong>Request Revision</strong> pada deliverable terkait.</li>
      <li>Tuliskan catatan perbaikan secara spesifik (misal: penyesuaian warna header atau perbaikan alur login).</li>
      <li>Lampirkan tangkapan layar jika diperlukan, lalu klik <strong>Kirim Permintaan Revisi</strong>. Tim SDK akan segera memasukkannya ke sprint perbaikan.</li>
    </ol>

    <h2 id="client-approve">7.5 Menyetujui Hasil Kerja (Approve Deliverable)</h2>
    <p>
      Jika deliverable telah sesuai dengan kesepakatan spesifikasi, klik tombol hijau <strong>Approve Deliverable</strong>. Persetujuan ini akan mengunci versi rilis tersebut dan secara resmi memajukan milestone proyek ke tahapan berikutnya (*Handover* atau *Go-Live*).
    </p>
  </section>

  <!-- ============================================= -->
  <!-- BAB 8: ALUR KERJA END-TO-END -->
  <!-- ============================================= -->
  <section id="flow">
    <h1>8. Alur Kerja Terpadu End-to-End (E2E Scenario)</h1>
    <p>
      Bagian ini menggambarkan simulasi alur kerja nyata dari sebuah proyek baru sejak penandatanganan kerja sama hingga serah terima akhir yang melibatkan koordinasi ke-4 role.
    </p>

    <h2>Tahap 1: Admin Mendaftarkan Klien & Menerbitkan Akun</h2>
    <ol class="steps">
      <li>
        <p>Administrator membuka menu <strong>Klien (Clients)</strong> dan mengklik <strong>+ Add New Client</strong>.</p>
        <div class="screenshot">
          <img src="screenshots/flow-01-admin-clients.png" alt="Tahap 1 Buka Klien">
          <div class="caption">Langkah 1.1 — Administrator Membuka Manajemen Klien</div>
        </div>
      </li>
      <li>
        <p>Admin menginput identitas instansi mitra (contoh: RSUD Sehat) dan PIC resmi.</p>
        <div class="screenshot">
          <img src="screenshots/flow-02-admin-add-client.png" alt="Tahap 1 Form Klien">
          <div class="caption">Langkah 1.2 — Mengisi Formulir Registrasi Mitra Klien</div>
        </div>
      </li>
      <li>
        <p>Admin menyalin kredensial login otomatis dan menyerahkannya ke pihak PIC klien.</p>
        <div class="screenshot">
          <img src="screenshots/flow-03-admin-credentials.png" alt="Tahap 1 Kredensial Klien">
          <div class="caption">Langkah 1.3 — Kredensial Diterbitkan Secara Aman</div>
        </div>
      </li>
    </ol>

    <h2>Tahap 2: Project Lead Menginisiasi Proyek & Memilih Template</h2>
    <ol class="steps">
      <li>
        <p>Project Lead membuka menu <strong>Proyek Baru</strong> dan mengisi identitas proyek.</p>
        <div class="screenshot">
          <img src="screenshots/flow-04-lead-create-project.png" alt="Tahap 2 Buat Proyek">
          <div class="caption">Langkah 2.1 — Project Lead Menentukan Template Alur Kerja Proyek</div>
        </div>
      </li>
      <li>
        <p>Sistem secara otomatis menduplikasi seluruh task skeleton alur kerja standar ke dalam papan Kanban proyek tersebut.</p>
      </li>
    </ol>

    <h2>Tahap 3: Pembagian Tugas & Penugasan Insinyur</h2>
    <ol class="steps">
      <li>
        <p>Project Lead memeriksa ketersediaan jam kerja di modul <strong>Resources</strong>.</p>
      </li>
      <li>
        <p>Tugas sprint dibagikan kepada Staff Engineer (misal: Andi Kusuma sebagai Lead QA).</p>
      </li>
    </ol>

    <h2>Tahap 4: Staff Melakukan Presensi Kerja & Menyelesaikan Tugas</h2>
    <ol class="steps">
      <li>
        <p>Staff Engineer login, melakukan <strong>Clock In</strong> di awal hari, dan membuka Kanban Board.</p>
        <div class="screenshot">
          <img src="screenshots/flow-06-staff-clock-in.png" alt="Tahap 4 Clock In">
          <div class="caption">Langkah 4.1 — Staff Memulai Hari Kerja dengan Presensi Presisi</div>
        </div>
      </li>
      <li>
        <p>Staff menggeser tiket ke <code>IN PROGRESS</code>, menyelesaikan pekerjaan, lalu memindahkannya ke <code>REVIEW</code>.</p>
        <div class="screenshot">
          <img src="screenshots/flow-05-staff-kanban-board.png" alt="Tahap 4 Kanban Update">
          <div class="caption">Langkah 4.2 — Staff Memperbarui Status Tiket pada Papan Orkestrasi</div>
        </div>
      </li>
    </ol>

    <h2>Tahap 5: Klien Memantau di Cockpit & Memberikan Approval</h2>
    <ol class="steps">
      <li>
        <p>Perwakilan Klien login dan melihat progres proyek di <strong>Client Cockpit</strong>.</p>
        <div class="screenshot">
          <img src="screenshots/flow-07-client-cockpit-view.png" alt="Tahap 5 Klien Review">
          <div class="caption">Langkah 5.1 — Klien Memverifikasi Milestone Progres di Cockpit</div>
        </div>
      </li>
      <li>
        <p>Klien mengunduh hasil deliverable, mengunggah dokumen pelengkap, dan menekan tombol <strong>Approve Deliverable</strong>.</p>
        <div class="screenshot">
          <img src="screenshots/flow-08-client-upload-modal.png" alt="Tahap 5 Upload Asset">
          <div class="caption">Langkah 5.2 — Klien Mengunggah Berkas Verifikasi Kerja Sama</div>
        </div>
      </li>
    </ol>
  </section>

  <!-- ============================================= -->
  <!-- BAB 9: FAQ -->
  <!-- ============================================= -->
  <section id="faq">
    <h1>9. Pertanyaan yang Sering Diajukan (FAQ)</h1>

    <h3>Q1: Bagaimana cara mereset kata sandi jika saya lupa password akun saya?</h3>
    <p>
      Hubungi Administrator sistem SDK via email <code>admin@subagakreatif.com</code> atau hubungi Project Lead Anda. Administrator dapat melakukan reset kata sandi akun Anda melalui menu <strong>Manajemen Pengguna (Users)</strong>.
    </p>

    <h3>Q2: Apakah saya bisa menggunakan aplikasi ini di smartphone Android atau iPhone?</h3>
    <p>
      Ya. SDK Orchestration Hub dirancang responsive penuh dan mendukung Progressive Web App (PWA). Cukup buka URL aplikasi di Google Chrome (Android) atau Safari (iOS), lalu pilih opsi <em>Add to Home Screen</em> / <em>Install app</em>.
    </p>

    <h3>Q3: Apa yang harus dilakukan jika ada tugas berstatus "Blocked"?</h3>
    <p>
      Buka detail kartu tugas untuk membaca catatan hambatan yang ditulis oleh staf terkait. Project Lead atau Admin bertanggung jawab menghubungi pihak terkait (misal mitra API atau penyedia server) untuk mengeliminasi kendala tersebut.
    </p>

    <h3>Q4: Mengapa tombol Clock In saya tidak aktif?</h3>
    <p>
      Pastikan sesi login Anda masih valid dan koneksi internet stabil. Jika sebelumnya Anda lupa melakukan Clock Out pada hari sebelumnya, lakukan Clock Out terlebih dahulu dengan menambahkan catatan sebelum memulai presensi sesi hari baru.
    </p>

    <h3>Q5: Apakah klien dapat melihat obrolan chat internal antar engineer?</h3>
    <p>
      Tidak. Saluran chat di SDK Orchestration Hub terisolasi secara ketat. Klien hanya dapat mengakses channel resmi proyek yang diikutsertakan, sedangkan channel internal engineering dan diskusi manajemen tidak dapat dilihat oleh peran CLIENT.
    </p>

    <h3>Q6: Bagaimana cara mengganti avatar / foto profil saya?</h3>
    <p>
      Buka menu <strong>Pengaturan (Settings)</strong> → tab <strong>Profil & Avatar</strong> → klik tombol <strong>Unggah Foto</strong> → sesuaikan crop lingkaran foto → klik <strong>Simpan Foto</strong>.
    </p>

    <h3>Q7: Berapa batas ukuran maksimal file yang dapat diunggah ke repositori berkas?</h3>
    <p>
      Batas maksimal per berkas adalah <strong>50 MB</strong>. Untuk aset multimedia atau dump database yang berukuran ratusan megabyte, disarankan mengunggah tautan repositori cloud terenkripsi pada kolom catatan berkas.
    </p>

    <h3>Q8: Apakah sistem menyimpan riwayat revisi tugas yang pernah diubah?</h3>
    <p>
      Ya. Seluruh perubahan status tugas, pemindahan kolom kanban, penambahan waktu, dan pergantian assignee tercatat otomatis di tabel audit log sistem dan dapat diperiksa di menu <strong>Log Aktivitas</strong> oleh Administrator.
    </p>

    <h3>Q9: Bagaimana cara mengekspor data laporan ke format cetak atau PDF?</h3>
    <p>
      Buka halaman <strong>Laporan & Analitik</strong> atau User Manual ini, lalu tekan tombol shortcut keyboard <code>Ctrl + P</code> (Windows) atau <code>Cmd + P</code> (macOS). Pilih printer tujuan <em>Save as PDF</em> dan centang opsi <em>Background graphics</em>.
    </p>

    <h3>Q10: Siapa yang dapat saya hubungi jika server mengalami gangguan (downtime)?</h3>
    <p>
      Segera hubungi tim Helpdesk & Infrastruktur PT Subaga Digital Kreatif melalui nomor hotline darurat <strong>+62-8131-8122-504</strong> untuk eskalasi prioritas Level 1.
    </p>
  </section>

  <!-- ============================================= -->
  <!-- BAB 10: TROUBLESHOOTING -->
  <!-- ============================================= -->
  <section id="troubleshooting">
    <h1>10. Panduan Troubleshooting & Pemecahan Masalah</h1>
    <p>
      Gunakan panduan matriks pemecahan masalah berikut sebelum mengajukan tiket kendala ke tim teknis:
    </p>

    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Gejala Masalah</th>
          <th style="width: 35%;">Kemungkinan Penyebab</th>
          <th style="width: 40%;">Langkah Solusi Perbaikan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Gagal Login / Pesan "Kata Sandi Salah"</strong></td>
          <td>Salah pengetikan email/password, Caps Lock aktif, atau kredensial akun belum diverifikasi.</td>
          <td>Klik ikon mata untuk memeriksa teks sandi, pastikan Caps Lock mati. Bila tetap gagal, minta Admin melakukan reset password akun.</td>
        </tr>
        <tr>
          <td><strong>Halaman Tiba-Tiba Kosong / Blank Screen</strong></td>
          <td>Cache peramban korup atau Service Worker versi lama tersangkut di memory browser.</td>
          <td>Lakukan Hard Refresh dengan menekan <code>Ctrl + Shift + R</code> (Windows) atau <code>Cmd + Shift + R</code> (macOS). Bila perlu, bersihkan cache situs di Application tab.</td>
        </tr>
        <tr>
          <td><strong>Pemberitahuan "Failed to Fetch" atau Data Tidak Terupdate</strong></td>
          <td>Koneksi internet terputus atau batas limit kuota request Supabase Cloud tercapai.</td>
          <td>Periksa konektivitas jaringan Anda. Uji akses ke situs lain. Jika internet normal, hubungi Administrator untuk memverifikasi status koneksi Supabase.</td>
        </tr>
        <tr>
          <td><strong>Kartu Kanban Tidak Bisa Digeser (Drag & Drop Macet)</strong></td>
          <td>Izin role Anda tidak memiliki hak menulis (*write permission*) pada proyek tersebut atau browser zoom bukan 100%.</td>
          <td>Pastikan Anda login dengan peran ADMIN, LEAD, atau STAFF yang ditugaskan pada proyek tersebut. Kembalikan zoom browser ke 100% (Ctrl + 0).</td>
        </tr>
        <tr>
          <td><strong>Gagal Mengunggah Berkas / Dokumen</strong></td>
          <td>Ukuran file melampaui kuota 50 MB atau ekstensi file diblokir oleh kebijakan keamanan server.</td>
          <td>Kompres file gambar atau jadikan file .zip berukuran di bawah 50 MB. Pastikan ekstensi file diizinkan (PDF, PNG, JPG, DOCX, XLSX, ZIP).</td>
        </tr>
        <tr>
          <td><strong>PWA Tidak Memunculkan Opsi "Install" di Browser</strong></td>
          <td>Aplikasi diakses melalui protokol HTTP biasa yang tidak terenkripsi SSL.</td>
          <td>Pastikan alamat diawali dengan <code>https://</code>. PWA mensyaratkan standar enkripsi TLS/HTTPS untuk menjamin keamanan aplikasi.</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- ============================================= -->
  <!-- BAB 11: KONTAK & DUKUNGAN TEKNIS -->
  <!-- ============================================= -->
  <section id="contact">
    <h1>11. Kontak & Dukungan Teknis</h1>
    <p>
      PT Subaga Digital Kreatif berkomitmen memberikan layanan orkestrasi teknologi terbaik bagi seluruh pemangku kepentingan. Untuk bantuan operasional, pelaporan bug, atau permintaan training pengguna, silakan hubungi saluran resmi berikut:
    </p>

    <table>
      <tr>
        <td style="width: 30%;"><strong>📧 Email Dukungan Resmi</strong></td>
        <td><a href="mailto:admin@subagakreatif.com">admin@subagakreatif.com</a></td>
      </tr>
      <tr>
        <td><strong>📞 Telepon / WhatsApp Helpline</strong></td>
        <td>+62-8131-8122-504</td>
      </tr>
      <tr>
        <td><strong>🌐 Portal Web Resmi</strong></td>
        <td><a href="https://www.subagakreatif.com" target="_blank">www.subagakreatif.com</a></td>
      </tr>
      <tr>
        <td><strong>📍 Alamat Kantor Operasional</strong></td>
        <td>
          <strong>PT Subaga Digital Kreatif</strong><br>
          Talavera Office Park, 28th Floor<br>
          Jl. T. B. Simatupang Kav. 22–26, Cilandak Barat, Jakarta Selatan, DKI Jakarta 12430
        </td>
      </tr>
    </table>

    <h2>Standar Waktu Respon Layanan (Service Level Agreement - SLA)</h2>
    <table>
      <thead>
        <tr>
          <th>Tingkat Urgensi (Severity)</th>
          <th>Kriteria Insiden</th>
          <th>Target Respon Awal</th>
          <th>Target Resolusi</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Tingkat 1 (Critical)</strong></td>
          <td>Sistem down total, tidak ada staf atau klien yang bisa login.</td>
          <td>&lt; 30 Menit</td>
          <td>&lt; 4 Jam Kerja</td>
        </tr>
        <tr>
          <td><strong>Tingkat 2 (Major)</strong></td>
          <td>Fitur vital terganggu (misal: Kanban tidak sinkron, upload error).</td>
          <td>&lt; 2 Jam</td>
          <td>&lt; 12 Jam Kerja</td>
        </tr>
        <tr>
          <td><strong>Tingkat 3 (Minor)</strong></td>
          <td>Pertanyaan operasional, tata cara penggunaan, perbaikan minor UI.</td>
          <td>&lt; 4 Jam</td>
          <td>1 x 24 Jam Kerja</td>
        </tr>
      </tbody>
    </table>

    <div class="callout info">
      <strong>🕒 Jam Operasional Tim Support</strong>
      Senin – Jumat: 09:00 – 18:00 WIB • Sabtu: 09:00 – 13:00 WIB (Tiket darurat Severity 1 dimonitor 24/7).
    </div>
  </section>

  <!-- ============================================= -->
  <!-- HALAMAN PENUTUP (CLOSING PAGE) -->
  <!-- ============================================= -->
  <section style="page-break-before: always; min-height: 240mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 60px 40px;">
    <img src="screenshots/logo-sdk.png" alt="SDK Logo" style="max-width: 130px; margin-bottom: 25px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));">
    <h1 style="border: none; page-break-before: avoid; color: #F97316; font-size: 26pt; margin-bottom: 12px;">Terima Kasih</h1>
    <p style="font-size: 13pt; color: #475569; max-width: 640px; margin: 15px auto 25px; line-height: 1.6;">
      Aplikasi <strong>SDK Orchestration Hub</strong> ini dipersembahkan dengan dedikasi penuh oleh <strong>Tim Magang</strong> sebagai hasil karya <strong>Tugas Besar Program Magang</strong> kepada <strong>PT Subaga Digital Kreatif</strong>.
    </p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px 28px; max-width: 620px; margin: 15px auto 25px; text-align: left;">
      <h4 style="margin-top: 0; color: #0B0F19; font-size: 11pt; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; letter-spacing: 0.05em; text-transform: uppercase;">Tim Pengembang Magang:</h4>
      <p style="margin: 8px 0; font-size: 10pt; line-height: 1.6;">👨‍💻 <strong>Naufal Azka Pradifa Utomo</strong> — Backend Developer (Database Architecture, API Integration & Security)</p>
      <p style="margin: 8px 0; font-size: 10pt; line-height: 1.6;">🎨 <strong>Hadid Firdaus</strong> — UI/UX Designer (Design System, User Research & Usability Testing)</p>
      <p style="margin: 8px 0; font-size: 10pt; line-height: 1.6;">⚡ <strong>Muhammad Abrurrahman Arrody</strong> — Frontend Developer (Core UI, State Management & Lead QA)</p>
      <div style="border-top: 1px dashed #cbd5e1; margin-top: 12px; padding-top: 10px; font-size: 9.5pt; color: #64748B; text-align: center;">
        🏢 <strong>Klien & Organisasi Penerima:</strong> PT Subaga Digital Kreatif
      </div>
    </div>

    <div style="border-top: 2px solid #e2e8f0; width: 140px; margin: 20px auto;"></div>

    <p style="font-size: 11pt; color: #64748B; margin-top: 20px; line-height: 1.8;">
      <strong style="color: #0B0F19; font-size: 12pt;">PT Subaga Digital Kreatif</strong><br>
      <em>Orchestration, Technology Solutions & Digital Innovation</em><br>
      Talavera Office Park 28th Floor, Jakarta Selatan 12430<br>
      © 2026 PT Subaga Digital Kreatif. All rights reserved.
    </p>
  </section>

</div>

</body>
</html>
`;

fs.writeFileSync(manualPath, htmlContent, 'utf8');
console.log('✅ Successfully generated docs/user-manual.html (Size: ' + (Buffer.byteLength(htmlContent, 'utf8') / 1024).toFixed(2) + ' KB)');
