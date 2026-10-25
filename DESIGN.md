---
name: "TERMA Atmosphere"
description: "Ruang kerja paparan panas dengan layout presisi, permukaan netral, dan aksen biru."
colors:
  background: "#fafbfc"
  foreground: "#24282e"
  card: "#ffffff"
  popover: "#ffffff"
  primary: "#285ea8"
  primary-hover: "#1f4b86"
  primary-foreground: "#ffffff"
  secondary: "#eef2f7"
  muted: "#f5f6f8"
  muted-foreground: "#626b78"
  panel-muted: "#526174"
  accent: "#edf2f8"
  destructive: "#9b2c2c"
  border: "#e2e5e9"
  input: "#929ba8"
  status-tersedia: "#285ea8"
  status-adaptasi: "#815815"
  status-tinjau: "#475569"
  status-batasi: "#9b2c2c"
  zone-blue: "#dbe8f7"
  zone-steel: "#e4e9f1"
  zone-ice: "#edf1f7"
  heritage-moss: "#596779"
  sidebar-background: "#fcfcfd"
  sidebar-foreground: "#24282e"
  sidebar-muted: "#626b78"
  sidebar-hover: "#f0f2f5"
  sidebar-active: "#eaf0f8"
  sidebar-border: "#e5e8ed"
  panel-accent: "#f1f5fa"
  panel-blue: "#f1f5fa"
  panel-soft: "#f6f7f9"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "48px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.625
  body-compact:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "7": "28px"
  "8": "32px"
  "9": "36px"
  "12": "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-destructive:
    backgroundColor: "color-mix(in oklab, #9b2c2c 10%, transparent)"
    textColor: "{colors.destructive}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "4px 12px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "24px"
  navigation-active:
    backgroundColor: "{colors.sidebar-active}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  workspace-sidebar:
    backgroundColor: "{colors.sidebar-background}"
    textColor: "{colors.sidebar-foreground}"
    padding: "22px 12px"
    width: "216px"
    height: "100dvh"
  quality-badge:
    backgroundColor: "{colors.card}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
---

# Design System: TERMA Atmosphere

## Overview

**Creative North Star: "TERMA Atmosphere"**

Atmosphere adalah ruang kerja yang tenang untuk membaca paparan panas dan menentukan tindak lanjut. Penyempurnaan yang disetujui pada 25 Oktober 2026 mengikuti layout referensi PlanetScale: kanvas putih, sidebar netral pucat, garis tipis, sudut ringkas, dan Plus Jakarta Sans. Biru tetap menjadi aksen tindakan dan pilihan sesuai arahan pengguna, “Tetap biru, fokus layout PlanetScale”. Wordmark teks terma. dipertahankan sambil menunggu logo tim.

Warna zona membantu mengenali area; status tindakan, kualitas sumber, dan asal data tetap terpisah. Bahasa antarmuka tetap Bahasa Indonesia. Skema isometrik memberi umpan balik pilihan tanpa menyatakan lokasi nyata atau pelacakan pekerja. Komposisi serta aset landing tetap dipertahankan, dengan font dan token bersama mengikuti sistem ini.

**Key Characteristics:**

- Kanvas putih, sidebar pucat, panel solid, dan pemisah abu netral.
- Plus Jakarta Sans untuk judul, isi, label, angka, dan grafik.
- Biru untuk tindakan dan pilihan; warna zona tidak menyatakan risiko.
- Kontrol ringkas, fokus keyboard terlihat, dan rincian bertahap.
- Isometri bergerak mengikuti pilihan; reduced motion menghapus transisinya.

Frontmatter adalah ringkasan normatif dari `web/src/app/globals.css`, `layout.tsx`, dan komponen yang telah dibangun. Ekstensi serta contoh mandiri ada di `.impeccable/design.json`; kontrak komposisi Dashboard ada di `.impeccable/surfaces/web-src-app-ringkasan-page-tsx.md`. Bagian terkini ini menggantikan arahan font, sidebar gelap, dan gradasi dari iterasi sebelumnya.

## Colors

Palet menggabungkan putih dan abu netral yang ringan dengan aksen biru tindakan yang terarah.

### Primary

- **Biru tindakan** (`primary`, `primary-hover`, `primary-foreground`): tombol utama, tautan, fokus, garis grafik, dan detail pilihan aktif.
- **Status tindakan** (`status-tersedia`, `status-adaptasi`, `status-tinjau`, `status-batasi`): biru, amber, slate, dan merah tanah, selalu disertai label keputusan lengkap.
- **Merah koreksi** (`destructive`): error, sumber kedaluwarsa, dan keadaan yang perlu perhatian.

### Secondary

- **Biru zona**, **slate zona**, dan **es zona** (`zone-blue`, `zone-steel`, `zone-ice`): pembeda area pada pilihan dan geometri ilustratif.
- `panel-accent` dan `panel-blue` adalah bidang biru pucat solid; `panel-soft` adalah bidang abu pucat solid. Nama historis ini tidak menyatakan gradasi.

### Neutral

- `background` menjadi latar pengantar; ruang kerja mengoverride latar ke `card`. `card` dan `popover` membentuk permukaan putih.
- `foreground` adalah tinta utama; `muted-foreground` untuk pendamping, sedangkan `panel-muted` berlaku pada rekap berwarna dan bacaan zona.
- `secondary`, `muted`, dan `accent` membentuk lapisan kontrol; `border` memisahkan isi, `input` menegaskan batas field.
- Sidebar memakai `sidebar-background`, tinta `sidebar-foreground`, teks pendamping `sidebar-muted`, hover `sidebar-hover`, pilihan `sidebar-active`, dan garis `sidebar-border`.
- `heritage-moss` tetap menjadi nama kompatibilitas titik REPLAY, tanpa mengembalikan identitas Heritage. Alias warna tinta dan `ring` mengikuti foreground atau primary dalam CSS.

**The Separate Signals Rule.** Status tindakan, kualitas sumber, dan asal data harus tetap menjadi label terpisah; warna zona tidak menyatakan pekerja aman.

## Typography

**Display Font:** Plus Jakarta Sans dengan sans-serif sebagai fallback.
**Body Font:** Plus Jakarta Sans dengan sans-serif sebagai fallback.
**Label/Mono Font:** Plus Jakarta Sans untuk label; monospace sistem untuk ID dan jejak audit.

Font dimuat melalui `next/font/google` dan digunakan bersama pada landing, ruang kerja, grafik, dan panduan. Hierarki bergantung pada ukuran, bobot, dan jarak, bukan pergantian keluarga font.

### Hierarchy

- **Display:** angka WBGT tabular; satuan (24px) lebih kecil dan pesan kosong memakai (24px), bukan angka nol.
- **Headline:** judul operasional; Dashboard memakai (26px, 600). Hero landing mempertahankan ukuran fluid `clamp(36px, 4vw, 54px)` dengan bobot (500).
- **Title:** judul kartu; varian kecil memakai (16px).
- **Body:** pengantar dan petunjuk; uraian panjang dibatasi sekitar 65ch.
- **Body compact:** formulir, tabel, navigasi, dan isi kartu. Sidebar memakai (13px).
- **Label:** metadata, badge, dan grafik. Grafik menjaga ukuran teks (12px) saat lebarnya berubah; catatan sekunder tertentu memakai (11px).
- **Mono:** identitas catatan, nomor baris impor, dan waktu audit.

**The Shared Type Rule.** Gunakan Plus Jakarta Sans pada seluruh antarmuka; monospace tetap terbatas pada identitas dan jejak yang perlu dibandingkan tepat.

## Layout

Kerangka operasional memiliki lebar maksimum (1800px). Mulai (1024px), sidebar sticky selebar (216px) dan setinggi viewport berdampingan dengan konten fleksibel. Header menjadi satu toolbar dengan breadcrumb, utilitas, pengguna, dan tanggal. Gutter header/konten (32px); konten memakai padding atas (24px) dan bawah (48px). Di bawah (768px), gutter (16px) dan padding bawah (32px). Jarak mengikuti ritme dasar (4px).

Di bawah (1024px), navigasi memakai drawer Dialog yang mengelola fokus; submenu kelompok juga tersedia dalam konten. Di bawah (640px), konteks pengguna dan tanggal memakai dua kolom. Lima kelompok navigasi tetap menaungi seluruh alur kerja.

Dashboard menempatkan tugas berikutnya pada strip putih bergaris, disusul tiga pilihan zona, interval tersegmentasi, peta, dan bacaan putih selebar (280px), dengan gap (16px). Pada (1024–1199px), peta dan bacaan bertumpuk, dengan isi bacaan dua kolom. Di bawah (768px), pilihan zona bergulir horizontal dan sisanya bertumpuk. Riwayat grafik terbuka secara default dalam accordion yang dapat ditutup; tabel nilai/sumber per jam tersedia di accordion dalamnya. Daftar pekerjaan dan lingkup shift memakai kolom fleksibel / (300px), menjadi fleksibel / (260px) di bawah (1024px), lalu satu kolom di bawah (768px).

Landing berdiri di luar shell operasional, dengan lebar maksimum (1360px) dan gutter (48px), menjadi (20px) di bawah (768px). Hero menjadi satu kolom di bawah (1024px). Ilustrasi konstruksi, penanda bernomor, pilihan berlabel, alur HSE–mandor–HSE, dan tautan masuk ke `/ringkasan` mempertahankan komposisinya. Asal aset ada di `web/public/images/ASSETS.md`.

Tabel lebar bergulir di kontainernya dengan petunjuk geser; minimum tabel versi (1000px) dan audit (760px) dilepas saat cetak. Grafik memiliki lebar minimum (540px), area gulir yang dapat difokuskan, dan label tetap terbaca. Kelompok provenance boleh membungkus antar item; badge kualitas dan asal data tetap utuh.

## Elevation & Depth

Kedalaman ruang kerja terutama berasal dari bidang solid, ruang kosong, dan border penuh. Card tidak memakai bayangan; pilihan sidebar memakai tint dan bobot. Bayangan halus tetap ada pada tab aktif, pin ilustrasi landing, dokumen serah-terima, dan popover panduan. Nilai lengkap berada pada sidecar. Isometri memakai bentuk SVG dan perubahan posisi sebagai umpan balik pilihan.

**The Quiet Depth Rule.** Pisahkan permukaan kerja dengan tonalitas dan garis; gunakan gerak dan bayangan pada komponen yang memiliki fungsi keadaan atau lapisan yang jelas.

## Shapes

Skala sudut utama berada di `rounded`: kecil untuk tombol, field, badge, dan tautan navigasi; medium untuk pilihan zona, interval, peta, strip tugas, dan bacaan; besar untuk wadah tab; ekstra besar untuk Card. Landing dan popover panduan mempertahankan sudut lokal (16px); lingkaran tetap dipakai untuk penanda bernomor dan titik sumber.

Tombol dan field utama memiliki target (44px); navigasi menjadi (48px) di bawah (640px). Badge merupakan label, bukan tombol. Bentuk ilustratif tidak boleh memotong informasi operasional.

## Components

### Buttons

Button menyediakan primary, outline, secondary, ghost, destructive, dan link. Primary menggelap saat hover; outline memakai garis `border` dan permukaan card; outline/ghost memakai muted saat hover; destructive memakai tint merah. Padding default ada di frontmatter, tinggi minimum (44px), dan transisi keadaan (150ms).

Fokus memakai ring (3px); invalid memakai destructive. Disabled memakai opacity (50%) dan mematikan pointer. Aksi turun (1px) saat ditekan kecuali pemicu popup; reduced motion meniadakan gerak tekan.

### Chips

StatusChip menampilkan keputusan lengkap dengan bobot semibold. QualityBadge memakai card, border, dan tinta pendamping; TERUKUR/REPLAY memiliki titik, PRAKIRAAN SAJA/TIDAK TERSEDIA memiliki garis putus, dan KEDALUWARSA memakai destructive. OriginBadge menyebut asal data secara terpisah. Label kualitas dan asal data tidak menyusut atau pecah; kontainer membungkus antar item. Badge pada rekap berwarna memakai dasar card solid.

### Cards / Containers

Card memakai border penuh, sudut ekstra besar, padding/gap (24px), atau (16px) pada ukuran kecil. Header dan Content memasok padding horizontal masing-masing. Footer memakai garis pemisah dan muted (50%). Rekap berwarna memakai panel solid; peta dan bacaan terpilih memakai card bergaris. Strip tugas memakai padding (16px 20px), menjadi (16px) pada mobile.

### Inputs / Fields

Input memakai card, garis input, dan ukuran di frontmatter. Teks (16px) pada mobile, lalu (14px) mulai (768px). Fokus memakai ring (3px), invalid memakai border destructive, dan disabled memakai opacity (50%). Label tetap terkait ke kontrol, termasuk label tersembunyi pilihan pengguna.

### Navigation

Sidebar pucat memakai ikon dan label teks. Kelompok aktif memakai tint `sidebar-active`, tinta foreground, ikon primary, dan bobot semibold. Turunan aktif memakai primary pada sidebar-hover. Drawer/subnavigasi memakai tint aktif dengan teks primary. Gunakan `aria-current="page"` pada rute tepat. Navigasi memiliki transisi warna/latar (160ms), dinonaktifkan pada reduced motion.

Sumber kelompok adalah `web/src/lib/navigation.ts`: Dashboard, Data lapangan, Rencana kerja, Tindak lanjut, dan Laporan. Panduan penggunaan dan Tentang TERMA berada di bagian pendamping. Drawer menutup setelah navigasi. Skip link muncul saat fokus. Wordmark menggunakan keluarga font bersama dan titik primary; tautannya menuju `/` di pengantar dan `/ringkasan` di ruang kerja.

### Zone overview and chart

Daftar, skema, dan Mapbox opsional menyelaraskan zona, bacaan, kualitas sumber, dan grafik tanpa mengganti interval. Kontrol memakai `aria-pressed`; bacaan memakai live region. Interval berada dalam wadah muted bergaris; pilihan aktif putih dengan teks primary.

Skema isometrik merupakan tampilan awal yang dapat digunakan tanpa layanan eksternal, setinggi (340px), menjadi (300px) pada mobile. Platform SVG naik (3px) saat hover dan (9px) saat dipilih, dengan transisi (240ms) `cubic-bezier(.16, 1, .3, 1)`. Reduced motion menghapus transisi, tetapi posisi dan tanda pilihan tetap tersedia. Label zona, bacaan, border, dan tanda centang menyampaikan pilihan tanpa bergantung pada gerak.

Mapbox dimuat hanya ketika token publik tersedia dan pengguna memilihnya. Koordinat fiktif, tanpa geolokasi atau pelacakan pekerja; kegagalan kembali ke skema dengan pesan. Bacaan hilang menjadi “Belum diukur” atau “Belum tersedia” dan celah grafik. Segmen hanya menghubungkan interval bertetangga yang memiliki bacaan. REPLAY tetap dilabeli.

### Task rows and guidance

Baris pekerjaan menghubungkan label, kemajuan, kelengkapan, dan langkah berikutnya. Rincian rencana mempertahankan batas harian/interval, alasan, sumber, dan persetujuan. Panduan dashboard enam langkah dimuat saat diminta, dapat dilewati/diulang, mengembalikan fokus ke pemicu, dan tidak mengubah data. Popover memakai card, padding (24px), lebar maksimum (360px) yang dibatasi viewport, judul (18px), dan isi (14px).

Landing mempertahankan contoh serah-terima yang dapat dijeda/diulang atau dipilih langsung. Gerak berhenti di luar layar atau tab tersembunyi; reduced motion meniadakan autoplay dan perpindahan spasial. Pilihan ilustrasi tetap memiliki alternatif label dan fallback gambar. Seluruh gerak ilustratif tidak mengubah data demo.

## Do's and Don'ts

### Do:

- Do gunakan token bersama, Plus Jakarta Sans, dan komponen yang ada pada layar berikutnya.
- Do pertahankan aksen biru, permukaan solid netral, dan garis pemisah yang tenang.
- Do tampilkan status tindakan, kualitas sumber, dan asal data secara terpisah.
- Do pertahankan label simulasi, replay, data hilang, dan fixture dalam keputusan serta hasil cetak.
- Do gunakan data sesuai tanggal, interval, zona, dan lingkup pengguna; beri label skema pada geometri ilustratif.
- Do pertahankan fokus keyboard, petunjuk geser, dan reduced motion.

### Don't:

- Don't gunakan warna zona atau gerak isometri sebagai klaim keamanan atau lokasi nyata.
- Don't mengisi celah pengukuran dengan nol atau angka dari referensi visual.
- Don't mematahkan badge kualitas dan asal data; bungkus kelompok di sekelilingnya.
- Don't mengembalikan font lama, sidebar navy, atau gradasi sebagai sistem ruang kerja terkini.
- Don't menyembunyikan batas harian, batas interval, alasan keputusan, atau tinjauan HSE demi tampilan.
