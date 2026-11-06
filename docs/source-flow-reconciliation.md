# TERMA: rekonsiliasi flow sumber pengguna

Sumber utama (6 November 2026): `~/Downloads/Flow Website TERMA (Copy).pdf` (11 halaman), `~/Downloads/Flowchart Perhitungan TERMA (Copy).pdf` (12 halaman). Menggantikan interpretasi alur di role-workspaces.md jika berbeda. Proposal DeveloperDay 2026 hlm4–6 menjadi pendukung. Konversi markitdown, render dan OCR Tesseract: web/output/source-review/ (ignored). Beberapa diagram cetak terpotong di kanan; aturan teks dipakai untuk memastikan cabang, bukan menebak bagian hilang.

Tiga artefak Claude (2tEtEYLtWfc61XPdSCWnMn, YEHkBwBHNWdrHmSeoC1ZaF, 1syc1FtPjL1fBvScCRmsNQ) mendapat Cloudflare403 di browser. HTML shell publik terambil tetapi isi belum terbaca. Pengguna memberi dua PDF sebagai penggantinya.

| ID | Aturan diterima | Sumber | Perubahan |
|---|---|---|---|
| F01 | Admin/HSE/Mandor/Klinik berbeda, pekerja hanya kiosk | Website1,4,11 | Klinik dan guard halaman; URL peran lain tidak mengganti akun |
| F02 | 05.30 persiapan;06.30 HSE;06.45 instruksi;07 check-in;siang monitoring;17 verifikasi;bulanan evaluasi | Website3;Hitung1 | Check-in dan bacaan satu hari penuh bukan prasyarat rencana |
| F03 | Jawaban kondisi hanya Klinik; HSE faktor kesehatan generik; Mandor status/tindakan | Website8,9,11 | Hapus keluhan dari HSE; kotak masuk Klinik |
| F04 | Data yang memperketat rencana disetujui membuat versi baru dan persetujuan ulang | Website10;Hitung3 | Check-in shift aktif; pertahankan versi lama |
| F05 | Station valid, kemudian prakiraan berlabel, kemudian data hilang | Hitung2,3 | Aproksimasi berlabel belum terkalibrasi; jangan otomatis membuat bacaan aktual masa depan |
| F06 | P, status per jam, turun1/2baris;NAB dan batas harian bersamaan | Hitung3,tabel3.1–3.2 | Mesin versi PDF; bobot/ambang sumber tetap asumsi |
| F07 | Aklimatisasi20%/hari;alokasi interval lebih sejuk dahulu | Hitung4 | Urutan ISBB naik, tunduk batas jam dan harian |
| F08 | Consent MCU/obat/Band terpisah; pencabutan menghentikan pemakaian berikutnya | Website9.4;Hitung8 | Klinik mengelola consent dan profil |
| F09 | Mandor mengakui/menjalankan/melapor;HSE mengembalikan/verifikasi/tutup | Website7,6.7,10 | Pertahankan lifecycle dan bukti; ringkas akses per tugas |

Integritas: pertahankan master dan assignment. Jangan menulis ulang shift tertutup, pengiriman, tindakan atau versi disetujui. Versi baru untuk perubahan aktif. Batasi pembacaan check-in historis tanpa menghapus data. Pertahankan provenance. Login server, database bersama, WhatsApp Business, sensor fisik, validasi fisiologis dan lab P2 adalah integrasi terpisah; UI tidak boleh mengklaimnya tersedia.

Rumus aproksimasi WBGT dicek silang dengan [WHO/WMO Heatwaves and Health](https://cdn.who.int/media/docs/default-source/climate-change/heat-waves-and-health---guidance-on-warning-system-development.pdf): 0.567Ta +0.393e +3.94. Pengaruh radiasi dan angin tidak diukur oleh aproksimasi itu. UI tetap menyebut perkiraan belum terkalibrasi. Nilai P/margin/turun baris adalah konfigurasi v0 dari PDF, bukan validasi klinis baru.

## Tambahan yang diminta pengguna

- Detail tabel kesehatan memakai manekin manusia isometrik Anatomy dengan lima marker, dua tampak dan penjelasan sumber; [kontrak dan batas interpretasi](body-monitoring.md).
- Band: consent aktif, satu pemakai per unit/pekerja, serah-terima terbatas regu, pengembalian/pembersihan sebelum pindah pemakai atau penutupan bila unit masih dipakai.
- Klinik: follow-up privat; pencatatan persetujuan terpisah; profil tidak disimpan tanpa izin MCU; pembukaan profil diaudit tanpa menyalin catatan medis ke audit umum.

Tidak diklaim selesai: login server/database bersama/WhatsApp Business/sensor fisik; input otomatis HRIS; model suhu inti Kalman; dosis D90/rujukan medis otomatis; obat/lab P2 dan validasi bobot klinis. Perhitungan P memakai faktor yang tersedia dan menampilkan keterbatasan cakupannya. Rekap menit terverifikasi tidak disebut dosis panas atau hasil pemeriksaan ginjal.

## Bukti verifikasi revisi

- Vitest: 172 tes pada 27 berkas lulus. TypeScript tanpa error. ESLint tanpa error, delapan warning lama pada komponen grafik Bklit.
- Browser Chromium, data QA terisolasi: buat draft satu pekerja, konfirmasi adaptasi, muat rekaman adaptor secara eksplisit, setujui dan terbitkan sebelum check-in, kirim instruksi, Mandor mengakui, kiosk consent dan jawaban Demam, versi kedua tanpa menghapus persetujuan pertama, kotak masuk dan tindak lanjut privat Klinik, persetujuan ulang HSE, kirim/akui versi kedua, laporan Mandor, verifikasi HSE, tutup dan reload tetap CLOSED. Catatan privat tidak ada di audit umum. Tidak ada error console pada perjalanan akhir.
- Tabel/detail tubuh pada 1440, 820 dan 390 px, terang/gelap: lima marker, pilihan sinkron, tanpa overflow halaman/dialog; nilai mentah Band tidak tampil untuk HSE. Kelima marker juga diuji dengan keyboard Enter; indikator sejajar pada pembukaan pertama dan pergantian pilihan. Reduced motion menghentikan seluruh pulsa; emulasi dikembalikan ke no-preference.
- Anatomy depan/belakang: 79 solid, seluruh pemeriksaan geometri nol masalah. Pemeriksaan ujung garis nol pada empat kombinasi tema/tampak; console inspeksi bersih. Tampilan 1× dan 4× diperiksa secara visual.
- Bukti gambar/log berada di `web/output/playwright/`, `web/output/anatomy-body/` dan `web/output/final-*.log` (ignored). Fixture visual memakai REPLAY dan tidak menjadi seed aplikasi. Build produksi revisi akhir tidak dijalankan di Mac mengikuti aturan workspace; verifikasi build hosting mengikuti status commit yang dipush.
