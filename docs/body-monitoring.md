# Peta sinyal tubuh pekerja

Dibuat dari permintaan pengguna 6 November 2026: detail dari tabel pekerja menampilkan tubuh isometrik, marker hidrasi/panas/Band/konteks risiko ginjal. Panduan: skill Anatomy MIT yang sudah dipakai pada visual IoT. Ukuran Figure: 79 bagian fisik. Manekin potongan depan/belakang pada alas, tungkai dan sendi, torso, ruas tulang belakang, rusuk, paru, jantung, ginjal dan saluran, serta cuff lengan atas. Model merupakan ilustrasi pendidikan; lokasi marker tidak menyatakan organ sudah sakit.

Geometri: `web/scripts/anatomy/body/build.mjs`, memakai kit yang sudah divendor. Setiap bentuk direkam dengan geometri sebenarnya, disusun melalui `A.settle`, dan diperiksa melalui audit. Sambungan disesuaikan secara geometris, bukan dengan mengabaikan pasangan atau mengganti kunci painter. Tidak ada dependency baru. `npm run figure:body` meregenerasi modul; `npm run figure:body:audit` menjalankan audit. `--review` juga menghasilkan halaman inspeksi depan/belakang kedua tema pada output/anatomy-body (ignored).

UI: `worker-health-detail.tsx` memuat `worker-body-monitor.tsx` saat dialog dibuka. Kedua tampak memakai model yang sama. Klik/keyboard pada marker dan daftar sinyal memilih penjelasan yang sama; satu indikator bergerak di daftar. Pulsa perhatian berhenti di luar viewport, pada tab tersembunyi dan reduced motion. SVG tidak dibangun ulang per frame. Angka bersumber dari model data yang sama dengan marker.

## Data dan arti marker

| Marker | Data | Batas interpretasi |
|---|---|---|
| Panas | Puncak WBGT dari versi rencana, beserta kualitas sumber | Panas lingkungan, bukan suhu tubuh |
| Hidrasi | Kejadian kunjungan dan heartbeat cakupan Water Station dengan ID pekerja yang sama | Jeda >1,5× interval target menjadi perhatian; tanpa koneksi segar tetap tidak diketahui. Scan tidak mengukur volume atau membuktikan dehidrasi |
| Band | HR, suhu kulit, kualitas, perangkat dan waktu | Harus sesuai periode pemakaian dan persetujuan aktif. Klinik melihat nilai mentah; HSE hanya status. Suhu inti tidak diestimasi |
| Ginjal | Konteks paparan/hidrasi; faktor klinis hanya jika berizin dan pembaca Klinik | Tidak ada skor kerusakan atau diagnosis penyakit ginjal. Fungsi ginjal memerlukan pemeriksaan klinis |
| Beban/pemulihan | Alokasi rencana dan menit yang diverifikasi | Durasi rencana tidak menjadi paparan aktual |

Dasar konteks: [NIOSH tentang panas, kekurangan cairan dan risiko cedera ginjal](https://cdc.gov/niosh/bulletin/2021/heat-stress.html), serta flow website §8–11 dan flow perhitungan §5–8 yang diberikan pengguna. Ambang kunjungan mengikuti parameter draft PDF, bukan validasi diagnosis baru.

## Batas adaptor

`personal-telemetry.ts` adalah batas input kejadian per pekerja. Reducer memeriksa izin input, peserta/tanggal shift, format/rentang/waktu, ID kejadian idempoten, dan pencocokan Band dengan consent/periode pemakaian. Batch tidak ditulis sebagian saat invalid. Shift tertutup tidak menerima perubahan. Provenance AKTUAL/REPLAY dan observedAt disimpan; angka animasi umum `telemetryFrame` tidak diubah menjadi bacaan personal.

Belum ada transport sensor fisik/API autentikasi perangkat. Karena itu pekerja tanpa kejadian individual yang tersimpan menampilkan keadaan tidak diketahui. Dataset berisi untuk QA hanya dibuat dalam sesi browser terisolasi, menggunakan label REPLAY; tidak menjadi seed operasional atau data browser pengguna.

## Verifikasi

Audit depan dan belakang: 79 solid; clearance, support, depth order, terminals, folds, self-overlap, wobble, stand-in shapes dan crowding semuanya nol. Pemeriksaan ujung garis dijalankan pada halaman inspeksi kedua tema/tampak. Uji model mencakup data kosong, kunjungan terlambat dengan heartbeat segar, koneksi kedaluwarsa/offline, isolasi pekerja, consent Band, redaksi HSE, retry/ID konflik, invalid/future event, dan closed history. Hasil build, browser dan total tes akhir dicatat di source-flow-reconciliation.md.
