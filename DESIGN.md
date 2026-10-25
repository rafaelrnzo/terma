---
name: TERMA Atmosphere
description: Ruang kerja paparan panas dengan permukaan kabut, sidebar operasional, dan data yang dapat ditelusuri.
colors:
  background: "#f1f4f2"
  foreground: "#263a32"
  card: "#fcfdfc"
  popover: "#ffffff"
  primary: "#31694c"
  primary-hover: "#245039"
  primary-foreground: "#ffffff"
  secondary: "#e5ece7"
  muted: "#eaf0ec"
  muted-foreground: "#586960"
  panel-muted: "#46574d"
  accent: "#e3eddf"
  destructive: "#9b2c2c"
  border: "#dde5df"
  input: "#85958b"
  status-tersedia: "#296342"
  status-adaptasi: "#815815"
  status-tinjau: "#475569"
  status-batasi: "#9b2c2c"
  zone-blue: "#a7c8df"
  zone-sage: "#b3d2bf"
  zone-lime: "#d9e9b4"
  heritage-moss: "#53685e"
typography:
  display:
    fontFamily: "Manrope, Inter, sans-serif"
    fontSize: "58px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Manrope, Inter, sans-serif"
    fontSize: "clamp(26px, 2.6vw, 38px)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Manrope, Inter, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.625
  body-compact:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
  metric:
    fontFamily: "Manrope, Inter, sans-serif"
    fontSize: "30px"
    fontWeight: 500
    lineHeight: 1.1
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
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
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
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
  input:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "4px 10px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "24px"
  navigation-active:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  workspace-sidebar:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    padding: "24px 12px"
    width: "224px"
    height: "100dvh"
  dashboard-tour:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "24px"
  status-tinjau:
    backgroundColor: "color-mix(in oklab, #475569 10%, transparent)"
    textColor: "{colors.status-tinjau}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  quality-badge:
    backgroundColor: "{colors.card}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
---

# Design System: TERMA Atmosphere

## Overview

**Creative North Star: "TERMA Atmosphere"**

Atmosphere adalah ruang kerja yang lapang untuk membaca paparan panas dan menentukan tindak lanjut. Permukaan kabut, panel putih lembut, judul Manrope yang ringan, dan bidang gradasi hijau–kuning mengikuti gabungan dua referensi yang disetujui pengguna. Sidebar operasional mengelompokkan pekerjaan; konteks ringkas, peta zona yang langsung terlihat, dan rincian yang dapat dibuka memberi ruang bagi tindakan utama. Identitas tampil sebagai wordmark teks terma. sambil menunggu logo tim.

Warna zona membantu mengenali area, sedangkan status tindakan dan kualitas sumber tetap memiliki label tersendiri. Angka berasal dari data aplikasi pada tanggal, zona, interval, dan lingkup pengguna yang dipilih. Skema lokasi bersifat ilustratif; tampilannya tidak menyatakan posisi geografis atau pelacakan langsung. Bahasa antarmuka tetap Bahasa Indonesia.

**Key Characteristics:**

- Permukaan kabut dan panel solid yang terasa ringan.
- Manrope untuk judul dan angka utama, Inter untuk pekerjaan sehari-hari.
- Gradasi hijau, biru, dan pasir sebagai bidang data yang terarah.
- Status tindakan, kualitas sumber, dan asal data terbaca terpisah.
- Lima kelompok navigasi sidebar, drawer pada layar kecil, konteks ringkas, rincian bertahap, dan fokus keyboard yang terlihat.

Dokumen ini menggantikan identitas Heritage sesuai persetujuan penggantian visual pada 25 Oktober 2026. Nilai di frontmatter diekstrak dari `web/src/app/globals.css`, `layout.tsx`, komponen shadcn di `web/src/components/ui/`, dan komposisi aplikasi. CSS dan komponen adalah sumber implementasi; frontmatter merangkum token yang digunakan. Ekstensi dan contoh mandiri berada di `.impeccable/design.json`.

Penyederhanaan kegunaan yang disetujui mempertahankan seluruh nilai token, palet, dan font Atmosphere. Komposisi pengantar dan pekerjaan harian dicatat pada `.impeccable/usability-simplification.md`; kontrak tersebut memperbarui urutan masuk dan prioritas Ringkasan dari `.impeccable/reference-redesign.md` tanpa mengganti dunia visualnya.

Perluasan dashboard yang disetujui pada 25 Oktober 2026 mengganti navigasi atas ruang kerja dengan sidebar, memperlihatkan pemantauan zona, dan menambahkan panduan opsional. Kontrak terbaru berada pada `.impeccable/surfaces/web-src-app-ringkasan-page-tsx.md`. Landing tetap mengikuti komposisi yang sudah disetujui; perubahan ini tidak mengganti identitas Atmosphere.

## Colors

Palet menggabungkan hijau hutan yang tenang, permukaan kabut, serta area data biru, sage, dan lime yang pucat.

### Primary

- **Hijau tindakan** (`primary`, `primary-hover`): tombol utama, fokus, pilihan interval, dan garis data; teks tombol memakai `primary-foreground`.
- **Status tindakan** (`status-tersedia`, `status-adaptasi`, `status-tinjau`, `status-batasi`): hijau, amber, slate, dan merah tanah dengan label keputusan lengkap. Badge memakai teks berwarna pada tint 10%; ringkasan hijau memakai dasar `card` yang solid.
- **Merah koreksi** (`destructive`): kesalahan, sumber kedaluwarsa, serta tindakan yang memerlukan perhatian.

### Secondary

- **Biru zona**, **sage zona**, dan **lime zona** (`zone-blue`, `zone-sage`, `zone-lime`): identitas area pada skema dan penanda pilihan; warna tersebut bukan kategori risiko.
- Gradasi `panel-green`, `panel-blue`, dan `panel-sand` berasal dari CSS. Nilai lengkap disimpan sebagai ekstensi karena gradasi bukan token warna tunggal.

### Neutral

- **Kabut** (`background`), **putih panel** (`card`), dan **putih popover** (`popover`): lapisan latar, isi, dan kontrol mengambang.
- **Tinta hutan** (`foreground`) dan **tinta sekunder** (`muted-foreground`): teks utama dan pendamping. `panel-muted` adalah override lokal untuk teks pendamping pada bidang hijau.
- `secondary`, `muted`, dan `accent` membentuk latar kontrol dan keadaan hover. `border` adalah pemisah halus; `input` adalah garis kontrol yang lebih jelas.
- `heritage-moss` adalah nama kompatibilitas yang masih dipakai untuk titik REPLAY. Nama lama pada kode tidak mengembalikan identitas Heritage. `heritage-ink`, warna teks card/popover/secondary/accent, dan `ring` mengikuti nilai tinta atau primary yang sudah dicatat.

**The Separate Signals Rule.** Status tindakan, kualitas sumber, dan asal data harus tetap menjadi label terpisah; warna zona atau gradasi tidak menyatakan pekerja aman.

## Typography

**Display Font:** Manrope dengan Inter dan sans-serif sebagai fallback.  
**Body Font:** Inter dengan sans-serif sebagai fallback.  
**Label/Mono Font:** Inter untuk label; monospace sistem untuk ID versi, waktu, dan jejak audit.

Manrope memberi judul dan angka utama bentuk yang terbuka tanpa kehilangan ketegasan. Inter membawa formulir, tabel, panduan, dan metadata. Font dimuat melalui `next/font/google`; nama keluarga di frontmatter mewakili font tersebut, bukan nama internal yang dihasilkan Next.js.

### Hierarchy

- **Display:** angka WBGT; satuan lebih kecil dan angka tabular.
- **Headline:** judul halaman dengan ukuran fluid dan bobot medium.
- **Title:** judul kartu dan kelompok kerja; kartu kecil turun ke 16px.
- **Body:** pengantar dan panduan dengan leading longgar serta lebar sekitar 65ch.
- **Body compact:** formulir, tabel, navigasi, dan isi kartu.
- **Label:** metadata dan badge; label status tindakan memakai bobot 600.
- **Metric:** rekap operasional; pada layar di bawah 768px turun ke 26px.
- **Mono:** identitas catatan dan waktu yang perlu dibandingkan secara tepat.

## Layout

Kerangka aplikasi terpusat dengan lebar maksimum 1800px. Mulai 1024px, sidebar sticky selebar 224px dan setinggi viewport mendampingi ruang kerja fleksibel; sidebar dapat bergulir sendiri. Header dan konten memakai gutter 28px; konten memiliki padding atas 24px dan bawah 48px. Di bawah 768px, gutter menjadi 16px dengan padding konten atas 24px dan bawah 32px. Jarak mengikuti skala Tailwind 4px.

Navigasi sidebar ditampilkan mulai 1024px. Di bawahnya, tombol menu membuka Dialog sisi kiri yang mengelola fokus. Kontrol pengguna dan tanggal tetap berada di header; di bawah 640px konteks memakai dua kolom. Desktop dan mobile memakai lima kelompok tugas dengan ikon pendamping dan label teks; kelompok aktif desktop menampilkan rute turunannya, sedangkan drawer menampilkan seluruh rute turunan. Header halaman operasional merangkum tujuan dalam satu kalimat, panduan panjang tersedia melalui “Cara kerja”, dan kemajuan serta peran penanggung jawab tampil pada satu baris ringkas.

Pengantar `/` berdiri di luar shell operasional dengan lebar maksimum 1360px dan gutter 48px. Tujuan produk dan aksi masuk berdampingan dengan contoh alur HSE–mandor–HSE; di bawah 768px komposisi menjadi satu kolom dengan gutter 20px. Tautan masuk di header, hero, dan penutup menuju `/ringkasan`. Label simulasi dan batas penggunaan tetap terlihat.

Pada `/ringkasan`, pekerjaan berikutnya berada pada bidang hijau ringkas di atas pemantauan zona yang langsung terlihat. Pilihan zona memakai tiga kolom, diikuti pemilih interval, lalu peta fleksibel dan panel bacaan 268px dengan jarak 16px. Pada 1024–1199px peta dan bacaan bertumpuk; isi bacaan memakai dua kolom. Di bawah 768px pilihan zona bergulir horizontal, lalu interval, peta, dan bacaan tersusun vertikal. Profil panas dan riwayat bacaan berada dalam accordion di bawah peta; tabel nilai dan sumber per jam dapat dibuka di dalamnya. Daftar pekerjaan serta lingkup shift mengikuti pemantauan, memakai kolom fleksibel / 300px, menjadi fleksibel / 260px di bawah 1024px, lalu satu kolom di bawah 768px. Komposisi ini milik pengantar dan pekerjaan harian, bukan kewajiban setiap halaman operasional.

Tabel lebar bergulir di kontainernya dengan petunjuk geser. Tabel versi rencana memakai minimum 1000px; audit memakai 760px; batas ini dilepas saat cetak. Grafik memakai minimum 540px pada mobile dan kontainer yang dapat difokuskan. Kelompok provenance boleh membungkus antar item, sedangkan label kualitas dan asal data tetap utuh. Status dalam tabel versi juga tidak dipatahkan.

## Elevation & Depth

Kedalaman terutama berasal dari perbedaan tonal, gradasi lembut, ruang kosong, dan garis tipis. Kartu memakai border pada 60% warna `border` tanpa bayangan. Navigasi aktif memperoleh satu bayangan ambient kecil (`0 3px 12px rgb(38 58 50 / 5%)`); fokus kontrol memakai ring yang jelas. Popover panduan memakai bayangan `0 10px 32px rgb(38 58 50 / 18%)` untuk terpisah dari halaman yang sedang disorot. Panel bergradasi adalah permukaan solid, tanpa kebutuhan backdrop blur.

**The Quiet Depth Rule.** Pertahankan kedalaman melalui tonalitas; bayangan navigasi aktif dan ring fokus memiliki fungsi keadaan yang jelas.

## Shapes

Kontrol dan badge memakai sudut kecil; navigasi serta pilihan zona memakai sudut medium; bidang tindak lanjut, peta, panel bacaan, dan popover panduan memakai sudut besar; kartu memakai sudut ekstra besar. Nilai normatif berada di `rounded`. Tombol ukuran kecil memiliki override sudut dari komponennya, sehingga tidak semua ukuran tombol identik. Identitas menggunakan teks tanpa lambang; lingkaran bernomor pada contoh alur pengantar menyatakan urutan pekerjaan.

Kontrol utama mempunyai sasaran minimal 44px; navigasi menjadi minimal 48px di bawah 640px. Badge boleh lebih kecil karena merupakan label, bukan tombol. Potongan dekoratif dan bentuk skema tidak boleh memotong informasi operasional.

## Components

### Buttons

Gunakan primitif Button shadcn dan API variannya. Default memakai hijau tindakan; outline memakai permukaan card dan garis input; secondary memakai permukaan secondary; ghost muncul melalui hover; destructive memakai tint merah; link memakai teks primary dan garis bawah saat hover. Padding default ada di frontmatter, dengan tinggi minimum 44px. Hover default menggelapkan primary; outline dan ghost memakai muted.

Fokus memakai ring 3px, dengan keadaan invalid pada warna destructive. Disabled menurunkan opacity ke 50% serta mematikan pointer. Tombol aksi turun 1px saat ditekan, kecuali pemicu popup; gerak tekan dinonaktifkan saat reduced motion.

### Chips

StatusChip menampilkan keputusan lengkap dengan bobot semibold dan nama aksesibel yang menyebut status tindakan. QualityBadge menampilkan kualitas sumber pada permukaan card: TERUKUR dan REPLAY memakai titik, PRAKIRAAN SAJA serta TIDAK TERSEDIA memakai garis putus, KEDALUWARSA memakai teks destructive. OriginBadge menampilkan asal data sebagai badge outline. Ketiganya tidak digabung menjadi satu kategori.

Di panel ringkasan hijau, seluruh badge mempunyai dasar card solid agar teks status tetap jelas. QualityBadge dan OriginBadge tidak menyusut atau mematahkan label; kontainer di sekelilingnya membungkus.

### Cards / Containers

Card memakai sudut ekstra besar, padding dan gap default 24px, serta border halus. Varian kecil memakai 16px. CardHeader dan CardContent masing-masing memasok padding horizontal; jangan menggandakan padding pada komposisi. CardTitle memakai Manrope. Footer memiliki pemisah dan latar muted 50%.

Bidang hijau pada rekap rencana/laporan menghapus border dan memakai override teks panel-muted. Peta zona memakai permukaan card dengan kanvas muted dan garis border; bacaan terpilih memakai bidang hijau.

### Inputs / Fields

Input default transparan dengan garis input, tinggi 44px, padding horizontal 10px dan vertikal 4px. Ukuran teks adalah 16px pada mobile, lalu 14px mulai 768px. Kontrol tanggal di shell menambahkan latar card. Fokus memakai ring 3px; invalid memakai border destructive; disabled memakai opacity 50%. Label harus tetap terkait ke kontrol, termasuk label tersembunyi untuk pilihan pengguna.

### Navigation

Sidebar desktop memakai permukaan secondary solid, teks Inter, ikon pendamping, sudut medium pada tautan, dan warna teks sekunder. Hover menambah muted; kelompok aktif memakai card, tinta utama, dan bayangan ambient. Gunakan `aria-current="page"` pada rute yang tepat; turunan aktif memakai primary, bobot semibold, dan latar muted. Sumber pengelompokan adalah `web/src/lib/navigation.ts`: Dashboard (`/ringkasan`), Data lapangan (`/impor`, `/paparan`, `/pengukuran`), Rencana kerja (`/rencana`), Tindak lanjut (`/instruksi`, `/tindakan`, masuk melalui `/tindakan`), dan Laporan (`/laporan`). Profil pekerja dan regu berada dalam kelompok Data lapangan. Dialog mobile menampilkan kelompok beserta rute turunannya dan menutup setelah navigasi; subnavigasi kelompok juga tersedia di konten pada layar di bawah 1024px. Skip link muncul saat fokus.

Wordmark `terma.` memakai Manrope semibold dengan titik primary; pada pengantar tautannya menuju `/`, pada ruang kerja menuju `/ringkasan`. Logo baru menunggu aset tim. Utilitas header menyediakan pencarian halaman/pekerja dan tautan Panduan; sidebar menambahkan Panduan penggunaan, Tentang TERMA, dan catatan simulasi. Antrean pekerjaan berada pada Dashboard.

### Task and record rows

Daftar pekerjaan memakai baris bertaut dengan label, kemajuan, status kelengkapan, dan panah menuju langkah terkait. Pada `/rencana`, filter persetujuan dan regu mendahului baris pekerja yang menampilkan identitas, persetujuan, status tindakan, kualitas sumber, dan total menit. Tautan `/pekerja/{kode}#rencana` membuka rincian untuk batas harian/interval, alasan, jadwal, dan persetujuan. Baris rencana berubah dari tiga kolom menjadi susunan vertikal di bawah 768px; ringkasan dan peringatan data tetap terlihat sebelum daftar.

### Zone overview and chart

Monitor langsung terlihat pada Dashboard. Pemilihan zona dari daftar, skema, atau penanda Mapbox menyelaraskan bacaan, kualitas sumber, dan riwayat tanpa mengganti interval. Kontrol zona dan interval memakai `aria-pressed`; bacaan terpilih diumumkan melalui live region. Profil panas dan riwayat tetap dapat dibuka melalui accordion, dengan label data per jam dan alternatif tabel nilai/sumber.

Skema simulasi adalah tampilan awal yang dapat digunakan tanpa token atau layanan peta eksternal. Area berupa tombol dengan label zona, bacaan atau “Belum diukur”, serta status pilihan; warna zona hanya membedakan area. Garis primary menandai pilihan dan outline tinta menandai fokus keyboard. Kanvas skema setinggi 280px, menjadi 300px di bawah 768px. Judul dan rincian “Tentang peta” menyatakan posisi ilustratif dan tanpa pelacakan pekerja.

Mapbox opsional dimuat secara lazy hanya jika token publik `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` tersedia dan pengguna memilih Mapbox. Kanvasnya setinggi 320px; koordinat seluruh zona adalah contoh fiktif, bukan lokasi proyek. Tidak ada permintaan geolokasi. Tanpa token, pilihan Mapbox tidak muncul. Kegagalan memuat, token tidak valid, WebGL tidak didukung, atau timeout 12 detik mengembalikan skema dan menampilkan pesan untuk mencoba lagi. Daftar zona tetap menjadi alternatif keyboard yang tersedia.

Bacaan hilang tampil sebagai em dash serta celah pada grafik; segmen hanya menghubungkan dua interval bertetangga yang memiliki bacaan. Angka tidak boleh disintesis dari referensi desain. Sumber REPLAY tetap ditandai sebagai replay.

Navigasi memakai transisi warna/latar 160ms; tombol skema memakai transisi border 160ms. Reduced motion menonaktifkan keduanya serta animasi Dialog, Select, dan Accordion yang ditargetkan CSS.

### Dashboard tour

Tombol “Panduan dashboard” memuat Driver.js saat diminta; panduan tidak berjalan otomatis dan dapat diulang. Enam langkah menjelaskan peran simulasi, tanggal, navigasi, zona, interval/sumber, lalu pekerjaan berikutnya. Sasaran navigasi dan peran mengikuti kontrol yang terlihat pada ukuran layar saat panduan dimulai. “Lewati”, “Kembali”, “Lanjut”, dan “Selesai” serta progres langkah tersedia; menutup panduan mengembalikan fokus ke tombol pemicu. Kesalahan pemuatan menyediakan pesan dan percobaan ulang.

Popover memakai card, tinta utama, sudut besar, dan padding 24px; lebar maksimum 360px dibatasi viewport dikurangi 24px. Judul Manrope 18px dan isi Inter 14px mengikuti hierarki yang ada. Tombol tetap minimal 44px. Gerak sorotan 200ms dinonaktifkan saat reduced motion; panduan tidak mengubah peran, tanggal, atau data aplikasi.

Pada landing saja, contoh serah-terima HSE–mandor–HSE menjadi fokus gerak: tiga tahap berjalan sekali selama 4,2 detik ketika terlihat, dapat dijeda/diulang atau dipilih langsung, dan berhenti saat keluar layar atau tab tersembunyi. Konektor memakai 550ms ease-out, pergantian dokumen 380ms, dan masuknya contoh profil 600ms sekali saat terlihat. Indikator baca serta garis navigasi menunjukkan posisi halaman; hover panah bergeser 3px. Reduced motion meniadakan autoplay dan perpindahan spasial sambil mempertahankan pilihan tahap dan umpan balik warna. Konten awal tetap terlihat tanpa JavaScript; seluruh gerak bersifat ilustratif, tidak mengubah data demo. Tidak ada dependensi animasi tambahan atau loop tanpa akhir.

## Do's and Don'ts

### Do:

- Do gunakan token Atmosphere dan komponen shadcn yang ada untuk layar berikutnya.
- Do tampilkan status tindakan, kualitas sumber, dan asal data sebagai informasi terpisah.
- Do pertahankan label demo, sumber replay, data hilang, dan aturan fixture dalam konteks keputusan serta hasil cetak.
- Do gunakan data aplikasi sesuai tanggal, interval, zona, dan lingkup pengguna; beri label skema pada geometri ilustratif.
- Do pertahankan fokus keyboard, petunjuk geser, dan sasaran kontrol minimal 44px.
- Do pakai teks panel-muted dan dasar badge card solid pada ringkasan hijau.

### Don't:

- Don't gunakan warna zona atau gradasi sebagai klaim keamanan atau diagnosis kesehatan.
- Don't mengisi celah pengukuran dengan nol atau angka dari referensi visual.
- Don't mematahkan badge kualitas dan asal data; bungkus kelompok di sekelilingnya.
- Don't menghidupkan kembali token Heritage yang telah diganti atau mengganti identitas Atmosphere saat memperluas sidebar.
- Don't menyembunyikan batas harian, batas interval, alasan keputusan, atau kebutuhan tinjauan HSE demi tampilan.
