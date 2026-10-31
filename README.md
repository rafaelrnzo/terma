# TERMA - Thermal Exposure & Renal Monitoring Assistant

DeveloperDay prototype from [rafaelrnzo/terma](https://github.com/rafaelrnzo/terma), enhanced with the Summon design system, Phosphor icons and upstream Bklit animated charts. Contributions are prepared with the Raya46 account directly for the Rafael repository.

## Run

```sh
cd web
npm ci
npm run dev
```

The app is a local interactive demo. It has no production authentication, cloud database, live sensor ingest, trained AI model or clinical data integration. Existing rule-driven plans and HSE/foreman workflows persist in the browser.

## Guided shift workflow

The dashboard starts with the active role and four stages: prepare data, approve plans, run the shift, verify and report. Guidance distinguishes work the current user can do, a handoff waiting for another role, and verified completion. Bottom-of-page guidance follows current records instead of sending everyone to the next menu.

Use **Panduan alur shift** for a role-specific Driver.js journey, or the header's help button for the current page. The HSE journey includes the worker plan review; the foreman journey covers receipt and reporting. Tours navigate and explain without submitting data or switching roles. Close, previous and next controls work across route changes.

## Proposal alignment

The 2026 DeveloperDay proposal is the product direction: site WBGT stations, RFID/QR water points, rotating upper-arm bands, individual daily plans, HSE approval, foreman execution and monthly clinic handoff. The dashboard and device / exposure-review pages reflect that scope without labelling planned integrations as live. See [scope and verification](docs/proposal-alignment.md).

- `web/src/app/globals.css`: canonical app tokens adapted from Summon; shared component recipes in `styles/summon.css`.
- `web/src/components/charts`: upstream Bklit registry source (vendored); see `docs/bklit-provenance.md`.
- `web/src/lib/exposure-review.ts`: monthly verified exposure, crew-scoped and deduplicated per worker/day.

The following original architecture describes the earlier PRD and must be read as historical context where it differs from the proposal.

---

# Earlier architecture

**TERMA** (Thermal Exposure Risk Management Assistant) adalah asisten pengelolaan paparan panas kerja untuk pekerja lapangan. Sistem mengubah data penugasan, kehadiran, status aklimatisasi, dan pengukuran panas lokasi (WBGT/ISBB) menjadi **rencana kerja yang bisa ditindaklanjuti mandor dan ditinjau HSE**.

Nilai inti MVP bukan prediksi kesehatan, melainkan **keputusan dan tindak lanjut yang bisa ditelusuri**. Dokumen ini mengikat ke **PRD Revisi 2** (18 Oktober 2026), fokus Engineering & Construction, satu lokasi, satu alur penugasan.

> Dokumen arsitektur ini greenfield: menjelaskan sistem yang akan dibangun, bukan yang sudah ada.

### Dokumen terkait

| Dokumen | Isi |
| :--- | :--- |
| `README.md` (ini) | Arsitektur, model data, kontrak keputusan, stack. |
| `DESIGN.md` | Sistem desain **Atmosphere** di atas **shadcn/ui** + terapannya ke UI TERMA (warna status, badge kualitas data, komponen). |
| `db/schema.sql` | DDL PostgreSQL untuk 14 entitas P0 (tervalidasi terhadap PostgreSQL). |

---

## 1. Prinsip arsitektur yang mengikat

Aturan ini membentuk setiap keputusan desain di bawah. Melanggarnya berarti membangun produk yang berbeda.

1. **Aturan yang bisa dijelaskan, bukan ML.** Status keluar dari batas lingkungan, aklimatisasi, dan kelengkapan data, bukan dari skor probabilistik atau model terlatih. Tidak ada `F-RISK` skor personal PRD lama.
2. **Status tindakan ≠ status sehat.** Label tidak pernah menyatakan "sehat", bebas risiko, atau izin medis. Warna hanya bantuan navigasi.
3. **Kualitas data ditampilkan terpisah dari status tindakan.** Keputusan dan keyakinan atas sumbernya adalah dua sumbu berbeda.
4. **Gagal aman (fail-safe).** Data hilang atau kedaluwarsa tidak boleh menghasilkan status siap. Keluaran jadi `TINJAU HSE` / "perlu pengukuran".
5. **Keterlacakan di atas segalanya.** Setiap catatan operasional menyimpan sumber, waktu kejadian, waktu pencatatan, dan status sintetis/aktual. Perubahan tidak menghapus riwayat.
6. **Tanpa over-engineering.** Tidak wajib ML, microservice, LoRa, atau perangkat rakitan untuk P0. Reuse stack yang dikuasai tim.
7. **Otorisasi di layer layanan, bukan di menu.** Penolakan akses diterapkan di service data, bukan dengan menyembunyikan tombol.

---

## 2. Gambaran arsitektur P0

Arsitektur P0 sengaja sederhana: impor + validasi data → basis data → mesin aturan → penjadwal perhitungan → dashboard HSE & mandor → adaptor notifikasi (opsional).

```
                    ┌─────────────────────────────────────────────────┐
   Sumber data      │                    TERMA                         │
   ───────────      │                                                  │
   CSV pekerja ────▶│  ┌───────────────┐      ┌──────────────────┐     │
   CSV kehadiran    │  │ Ingest &      │      │  Rule Engine     │     │
   CSV WBGT ───────▶│  │ Validation    │─────▶│  (aturan v0,     │     │
   BMKG (3 jam) ───▶│  │ Layer         │      │   dapat dijelaskan)│    │
                    │  └───────┬───────┘      └────────┬─────────┘     │
                    │          │                       │               │
                    │          ▼                       ▼               │
                    │  ┌───────────────┐      ┌──────────────────┐     │
                    │  │  PostgreSQL   │◀────▶│  Planner /       │     │
                    │  │  (14 entitas  │      │  Scheduler       │     │
                    │  │   P0 + audit) │      │  (batas harian + │     │
                    │  └───────┬───────┘      │   interval)      │     │
                    │          │              └────────┬─────────┘     │
                    │          ▼                       ▼               │
                    │  ┌───────────────────────────────────────┐      │
                    │  │  API (REST) + Auth/RBAC per lokasi/regu│      │
                    │  └───────┬───────────────────────┬───────┘      │
                    └──────────┼───────────────────────┼──────────────┘
                               ▼                       ▼
                    ┌──────────────────┐    ┌────────────────────────┐
                    │ Dashboard HSE    │    │ Notifikasi mandor       │
                    │ Dashboard Mandor │    │ (WhatsApp sandbox/      │
                    │ (web)            │    │  pratinjau, berlabel)   │
                    └──────────────────┘    └────────────────────────┘
```

### Komponen

| Komponen | Tanggung jawab | Catatan P0 |
| :--- | :--- | :--- |
| **Ingest & Validation** | Impor CSV/Excel, validasi per baris, tolak duplikat/zona tak dikenal/tanggal tak masuk akal. Impor ulang **idempoten**. | Baris invalid dilaporkan dengan alasan, tidak menggagalkan seluruh impor. |
| **Database** | Menyimpan 14 entitas P0 + log audit. Setiap catatan: sumber, waktu kejadian, waktu catat, flag sintetis/aktual. | Rencana menyimpan batas harian dan interval **terpisah**. |
| **Rule Engine** | Menghasilkan status tindakan + daftar faktor penyumbang dari batas lingkungan, aklimatisasi, kelengkapan data. | Deterministik dan dapat ditelusuri ke `Aturan` (ID + versi + sumber). |
| **Planner / Scheduler** | Gabungkan batas paparan harian aklimatisasi dengan pola kerja-istirahat interval NAB. | Jika tak ada alokasi memenuhi batas → `RENCANA BELUM LAYAK` + alasan. |
| **API + Auth/RBAC** | Endpoint data, otorisasi per lokasi/regu di layer layanan. | Mandor hanya melihat pekerja/rencana yang ditugaskan. |
| **Dashboard (web)** | HSE: daftar tindakan, pekerja perlu adaptasi, rencana perlu tinjau, sumber WBGT, data kurang. Mandor: ringkasan rencana per regu. | Laporan dasar dicetak dari browser; PDF audit khusus → P1. |
| **Notification Adapter** | Ringkasan rencana per regu ke mandor. | P0 cukup pratinjau/sandbox; status simulasi harus terlihat. Klaim "terkirim" butuh bukti kanal. |

---

## 3. Model data — 14 entitas P0

Entitas inti (PRD bagian 9). Setiap catatan operasional menyimpan `sumber`, `waktu_kejadian`, `waktu_pencatatan`, dan `status_data` (sintetis/aktual/manual/replay) bila relevan.

```
Pekerja ──┬── Penugasan ──┬── Zona
          │               ├── Tugas (kategori beban, APD)
          │               └── blok waktu
          │
          ├── Kehadiran          (pemicu tinjauan, bukan bukti paparan)
          ├── RiwayatPaparan     (dirancang / dilaporkan mandor / diverifikasi HSE — dibedakan)
          └── Regu

Zona ──── PengukuranWBGT  (waktu, ID alat, pencatat, kalibrasi, label kualitas)
Zona ──── PrakiraanCuaca  (BMKG, interval asli 3 jam, lokasi administrasi)

Aturan ── (ID, versi, sumber + halaman, beban kerja, perlakuan APD, periode, peninjau)
   │
   ▼
Rencana ──┬── batas_harian_menit        (terpisah)
          ├── batas_interval            (terpisah)
          ├── versi_input + sumber_aturan + keputusan_HSE + waktu_berlaku
          └── Tindakan ── Pengiriman

LogAudit  (impor, perubahan penugasan, versi aturan, persetujuan, perubahan tindakan, verifikasi)
```

| Entitas | Peran |
| :--- | :--- |
| `Pekerja` | Identitas pekerja (alias demo untuk P0). |
| `Regu` | Unit kerja; basis otorisasi mandor. |
| `Zona` | Area kerja dengan kondisi panas berbeda. |
| `Tugas` | Pekerjaan + kategori beban (ringan/sedang/berat) + APD. |
| `Kehadiran` | Catatan hadir/cuti/sakit. **Pemicu** tinjauan, bukan bukti seluruh shift terpapar. |
| `RiwayatPaparan` | Membedakan durasi **dirancang** vs **dilaporkan mandor** vs **diverifikasi HSE**. |
| `Penugasan` | Tugas + zona + blok waktu + sumber informasi. |
| `PengukuranWBGT` | Bacaan terlabel (TERUKUR/REPLAY) dengan metadata alat & kalibrasi. |
| `PrakiraanCuaca` | Prakiraan BMKG dengan interval dan lokasi aslinya. |
| `Aturan` | Aturan iklim kerja berversi, tertelusur ke sumber. Fixture ≠ aturan operasional. |
| `Rencana` | Jadwal kerja-istirahat; simpan batas harian & interval terpisah + versi. |
| `Tindakan` | Status siklus hidup: DIBUAT → DISAMPAIKAN → DIAKUI → DILAPORKAN → TERVERIFIKASI / BELUM SELESAI. |
| `Pengiriman` | Catatan kirim notifikasi (status simulasi terlihat). |
| `LogAudit` | Jejak immutable semua keputusan. |

---

## 4. Kontrak keputusan

Bagian ini adalah jantung demo dan harus dapat diuji.

### 4.1 Status tindakan (sumbu keputusan)

| Status | Arti |
| :--- | :--- |
| `RENCANA TERSEDIA` | Ada alokasi kerja-istirahat yang memenuhi semua batas. |
| `ADAPTASI DIPERLUKAN` | Pekerja dalam masa aklimatisasi; batas harian dibatasi. |
| `TINJAU HSE` | Data hilang/kedaluwarsa/riwayat tak lengkap. **Tidak boleh** status siap dari prakiraan saja. |
| `BATASI ATAU PINDAHKAN PEKERJAAN` | Batas lingkungan terlampaui; pindahkan waktu/zona, ubah tugas, atau hentikan. |

Jika beberapa kondisi berlaku sekaligus, keluaran **mempertahankan pembatasan paling ketat**.

### 4.2 Kualitas data (sumbu terpisah)

`TERUKUR` · `REPLAY` · `PRAKIRAAN SAJA` · `KEDALUWARSA` · `TIDAK TERSEDIA`

Ambang usia bacaan dan cakupan zona ditetapkan HSE di konfigurasi lokasi. Nilai fixture demo diberi label asumsi.

### 4.3 Batas harian + interval (dicek bersamaan)

- Batas **harian aklimatisasi** dan pola **kerja-istirahat interval NAB** harus **sama-sama** terpenuhi.
- Persentase adaptasi **tidak dikalikan** dengan persentase baris NAB.
- Keduanya dihitung dalam **menit eksplisit** dan diperiksa terhadap rencana aktual.
- **Contoh fixture:** paparan normal 8 jam, profil hari-1 maksimal 20% → batas harian **96 menit**. Alokasi per jam tetap harus memenuhi aturan lingkungan.
- Sel NAB kosong = **kombinasi tidak didukung**, bukan nol dan bukan nilai yang boleh diperkirakan.

### 4.4 Aklimatisasi (NIOSH)

- **Pekerja baru:** paparan awal maksimal 20%, naik maksimal 20 poin persentase per hari.
- **Pekerja berpengalaman kembali:** 50% / 60% / 80% / 100%.
- Hari adaptasi maju berdasarkan **paparan terkonfirmasi + tinjauan HSE**, bukan otomatis per pergantian kalender. Absensi hanya **pemicu tinjauan**.

---

## 5. Peran & otorisasi

| Peran | Akses |
| :--- | :--- |
| **HSE** | Lihat semua, setujui rencana, tetapkan konfigurasi lokasi, verifikasi tindakan. |
| **Mandor** | Hanya pekerja & rencana yang ditugaskan. Dapat catat hambatan dan pilih tindakan **lebih** protektif; **tidak dapat** menurunkan batas keselamatan dengan menulis alasan. |
| **Petugas data** | Impor & validasi data. |

Detail medis tidak pernah sampai ke mandor. Otorisasi diberlakukan di **layanan data**, bukan hanya di navigasi UI.

---

## 6. Alur end-to-end (re-runnable)

Definition of Done MVP adalah satu alur lengkap yang bisa dijalankan ulang tanpa menggandakan data:

```
Impor ─▶ Validasi ─▶ Pengukuran terlabel ─▶ Klasifikasi adaptasi ─▶ Rencana
   ─▶ Persetujuan HSE ─▶ Instruksi mandor ─▶ Catat tindakan ─▶ Verifikasi ─▶ Laporan
```

Properti yang dijamin:
- **Idempoten:** impor ulang / kirim ulang tidak menggandakan catatan.
- **Tahan refresh:** rencana dan tindakan bertahan setelah reload.
- **Tertelusur:** aturan tertaut ke sumber atau label fixture; data hilang/kombinasi tak didukung selalu terlihat di keluaran.
- **Ketepatan jadwal 100%** terhadap aturan fixture pada kasus kritis sebelum demo (target penerimaan, belum hasil uji).

---

## 7. Stack (terkunci untuk P0)

Dipilih untuk kecepatan bangun (~2 hari ke demo) dan karena sudah dikuasai tim. Monolit, bukan microservice — sesuai Prinsip 6.

| Lapisan | Pilihan | Alasan |
| :--- | :--- | :--- |
| **Backend/API** | **FastAPI** (Python 3.12) + Pydantic v2 | REST + validasi skema cepat; mesin aturan hidup in-process di sini. |
| **ORM / migrasi** | **SQLAlchemy 2.0 (async)** + **Alembic** | Satu rantai migrasi linear; audit immutable. |
| **Database** | **PostgreSQL 16** | Relasional kuat untuk 14 entitas + `ENUM` kontrak keputusan + jejak audit. |
| **Mesin aturan** | **Modul Python deterministik** in-process | Aturan v0 transparan; **tanpa** ML, engine eksternal, atau microservice. |
| **Frontend** | **Next.js 15 (App Router)** + React + Tailwind + **shadcn/ui** | Dashboard HSE & mandor; komponen dari shadcn, token Atmosphere (lihat `DESIGN.md`). |
| **Auth** | Session/cookie + RBAC di service layer | Otorisasi per lokasi/regu ditegakkan di layanan, bukan menu (Prinsip 7). |
| **Notifikasi** | Adaptor WhatsApp (sandbox/pratinjau P0) | Status simulasi harus terlihat; klaim "terkirim" butuh bukti kanal. |
| **Deploy** | Docker Compose (Postgres + API) + Caddy | Satu lokasi, satu alur; cukup untuk MVP lomba. |

Yang **mengikat** tetap batasan arsitektur di Bagian 1. Stack boleh diganti hanya jika batasan itu tetap terpenuhi.

---

## 7a. Menjalankan frontend

Frontend ada di `web/` (Next.js 15 + shadcn/ui + token Atmosphere). Aplikasi langsung membuka ruang demo berisi data fiktif. Data simulasi dapat diperbarui lewat impor CSV atau input manual; jangan masukkan data operasional nyata. Master data lokasi (regu, zona, tugas, akun, aturan NAB) ada di `web/src/lib/config.ts`. Mesin aturan di `web/src/lib/rules.ts` mengikuti bagian 4 dokumen ini.

```bash
cd web
npm install
npm run dev -- -H 127.0.0.1 -p 3001   # http://127.0.0.1:3001
npm test                      # aturan, impor, alur, seed, lingkup, ruang demo
npm run build && npx next start -H 127.0.0.1 -p 3001
```

Tanpa login. Aplikasi terbuka sebagai HSE (Ratna); pengguna aktif dipilih di header: `Ratna` (HSE), `Budi` (mandor Regu Cor), `Sari` (mandor Regu Bekisting), `Tono` (petugas data). Daftar pengguna ada di `config.ts`. Peran tetap membatasi aksi: tombol di luar wewenang dinonaktifkan dan lapisan data menolaknya, dan setiap pergantian pengguna tercatat di audit.

**Batas yang harus ditutup backend sebelum data pekerja nyata disimpan:**
- Tidak ada autentikasi: siapa pun yang membuka aplikasi bisa memilih pengguna mana saja, termasuk HSE. Pembatasan peran mencegah salah klik, bukan penyalahgunaan. Jangan buka aplikasi ini ke jaringan publik; untuk data nyata perlu autentikasi dan otorisasi per lokasi/regu di server (bagian 9 PRD).
- Data tersimpan di `localStorage` satu browser, tidak dibagi antar perangkat dan tidak terenkripsi. Mandor dan HSE baru benar-benar berbagi data setelah API + PostgreSQL (`db/schema.sql`) tersambung.
- Belum ada integrasi kanal pesan: instruksi dibagikan manual (salin / WhatsApp) dan dicatat DIBAGIKAN MANUAL, tidak pernah TERKIRIM.
- Tabel NAB masih berlabel belum disahkan sampai diverifikasi ke naskah resmi Permenaker 5/2018.

### Data demo untuk mencoba frontend

Seed tersedia langsung di browser, bukan sebagai seed PostgreSQL karena frontend belum terhubung ke database:

1. Buka `http://127.0.0.1:3001` (jalankan dari `web/` dengan `npm run dev -- -H 127.0.0.1 -p 3001`).
2. Data mock terisi otomatis pada kunjungan pertama, dengan peran **Ratna · HSE** dan tanggal hari itu.
3. Buka **Pekerja & data** untuk profil pekerja, atau **Panduan** untuk mencoba peran mandor/petugas data. Pencarian global dapat dibuka dengan Ctrl/⌘ K.

Seed memuat 8 pekerja fiktif, 92 catatan kehadiran selama 14 hari sebelumnya, 16 bacaan WBGT replay sintetis, 3 periode prakiraan simulasi, 2 konfirmasi adaptasi, 8 rencana, serta contoh persetujuan, pembagian instruksi, laporan, dan verifikasi. Semua tanggal mengikuti tanggal rencana. Empat status tindakan tersedia; zona Bekisting sengaja tidak mempunyai bacaan WBGT untuk menunjukkan keluaran fail-safe.

Data tersimpan di `localStorage` dengan kunci `terma-demo-v2`. Data lama `terma-v1` tetap utuh, tidak dibaca atau ditimpa. Seed tidak berjalan ulang saat reload; tanggal awal demo tetap dipertahankan. Untuk demo baru, gunakan jendela privat baru. Tanggal lain mungkin kosong dan menyediakan tombol kembali ke tanggal demo. Gangguan penyimpanan ditampilkan agar perubahan yang belum tersimpan tidak dianggap berhasil. Penyimpanan port 3000 dan 3001 terpisah.

Banner **Ruang demo** tampil di seluruh halaman, termasuk saat mencetak. Identitas pekerja ditandai `SINTETIS`, bacaan ditandai `REPLAY`, dan pesan yang disalin menyertakan peringatan simulasi. Tombol WhatsApp membuka pratinjau lokal, bukan mengirim pesan. Jangan campurkan data nyata ke ruang demo atau gunakan hasilnya sebagai keputusan operasional.

Halaman **AI Insight individu** (`/insight`) adalah mockup frontend MVP yang menampilkan sinyal paparan per pekerja dari rencana aktif. Halaman ini menampilkan cakupan WBGT, menit paparan yang direncanakan, faktor pembentuk insight, interval tanpa alokasi, alasan aturan, saran tinjauan HSE, serta simulasi read-only jika zona kerja berubah. Seluruh output AI berlabel simulasi. Belum ada model AI yang dilatih, API AI, atau prediksi peluang sakit; data kosong tidak diberi label aman. Sebelum model prediktif individual digunakan, tim perlu data outcome yang sah, validasi HSE/klinis, autentikasi server, serta pengujian performa pada populasi dan kondisi lapangan yang dituju.

Sumber seed: `web/src/lib/seed-data.ts`; pengisian melalui validasi, mesin aturan, dan alur reducer yang sama di `web/src/lib/store.tsx`. Uji regresi: `npm test` dari direktori `web/`.

Uji browser: `node scripts/ui-smoke.cjs` dari `web/` dengan server port 3001 berjalan dan Playwright/Chromium tersedia. Jika memakai runtime yang sudah terpasang di luar proyek, berikan `PLAYWRIGHT_MODULE` dan `CHROMIUM_EXECUTABLE`. Skrip memakai konteks browser terisolasi, memeriksa tautan serta alur aksi, dan menyimpan tangkapan desktop/mobile di `.impeccable/review/workspace/`; `SKIP_CAPTURE=1` melewati penulisan gambar.

## 8. Di luar lingkup P0 (ditunda)

Dipindah ke P1/P2 dan **tidak boleh diam-diam memengaruhi keputusan P0**:

- Impor MCU, diagnosis, obat, nilai laboratorium (P1+).
- Seluruh fitur wearable (`F-WEAR`) dan estimasi suhu inti (P2).
- Rujukan otomatis dosis panas/ginjal (`F-DOSE`, P2).
- Defisit minum dari scan hidrasi (`F-HYD-02`, ditunda — scan tidak mengukur asupan).
- Sinkronisasi HRIS otomatis (P2).
- ML / model statistik terkalibrasi (P2).

Di luar lingkup **semua** rilis: diagnosis medis otomatis, sanksi otomatis ke pekerja, pengendalian langsung alat kerja.

---

## 9. Sumber & catatan kepatuhan

- Tabel NAB & rumus ISBB mengacu **Permenaker No. 5 Tahun 2018** — masih **fixture berlabel**, belum disahkan sebagai aturan operasional. Lampiran resmi harus ditranskripsi dan ditinjau sebelum penggunaan lapangan.
- Pedoman aklimatisasi mengacu **NIOSH/OSHA**.
- Fixture sintetis **tidak** boleh diklaim sebagai hasil pilot atau akurasi klinis.
- Rubrik penilaian (Industrial): keunikan 30% / fungsi 30% / pasar 20% / kualitas teknologi 20%.
- Tenggat demo: **25 Oktober 2026**.
