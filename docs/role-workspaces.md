# Ruang peran dan alur TERMA

Diperbarui 6 November 2026. Acuan: proposal DeveloperDay2026, [Google Docs kebutuhan](https://docs.google.com/document/d/1UTxFQ2EdwfWitttrZUgQ2hsZY3bLZM31DXF4VBfyxIw/edit), tiga gambar yang dikirim pengguna, serta klarifikasi tentang tiga role, absen kondisi tubuh, dan baseline kesehatan perusahaan. [Artefak Claude](https://claude.ai/artifact/2tEtEYLtWfc61XPdSCWnMn) tertahan halaman verifikasi, sehingga isinya belum menjadi sumber yang terverifikasi.

## Pintu masuk

| Peran | Halaman awal | Tugas utama |
| --- | --- | --- |
| Petugas data | `/admin` | Master pekerja, kelengkapan dokumen/absensi, bacaan WBGT, prakiraan |
| HSE | `/hse` | Baseline ringkasan kerja, tinjauan kondisi/adaptasi, rencana, terbitkan, bagikan instruksi, verifikasi, tutup |
| Mandor | `/mandor` | Instruksi, pengakuan, monitoring, dan laporan untuk regu sendiri |
| Pekerja di kios | `/kiosk` | Pilih kamera/kartu, konfirmasi identitas, isi kondisi tubuh, catat kehadiran |

`/ringkasan` mengarahkan ke beranda sesuai akun. Memasukkan URL beranda role lain mengarahkan kembali ke role aktif, tanpa mengganti akun. Pergantian akun dari header mengubah identitas, lingkup, beranda, dan URL. Di halaman shift, URL dipertahankan untuk serah terima.

## Awal, serah terima, dan akhir

Master dan ringkasan pemeriksaan perusahaan → HSE membuat draft → pekerja absen dan menjawab kondisi tubuh → HSE meninjau kondisi, pembatasan kerja, dan adaptasi → petugas data/HSE melengkapi bacaan WBGT → HSE menyetujui serta menerbitkan → HSE membagikan instruksi → mandor menerima serta melapor → HSE memverifikasi → HSE menutup shift → laporan akhir.

Baseline perusahaan dapat dipakai untuk persiapan sebelum pekerja hadir. Gambar referensi menempatkan check-in setelah rencana awal; implementasi ini menempatkan check-in dan tinjauan kondisi sebelum persetujuan final/penerbitan. Dengan demikian laporan kondisi pagi tidak dilepas menjadi instruksi tanpa tinjauan. Waktu pada gambar tidak dijadikan scheduler otomatis.

Forecasting berada di `/forecasting` untuk persiapan: peta ilustratif yang sama dengan monitoring, tanggal, interval asli sumber, suhu udara, kelembapan, lokasi, waktu produksi, dan perbandingan periode. Satu prakiraan lokasi menjadi konteks seluruh zona; tidak dibuat estimasi WBGT atau tingkat risiko per zona. Prakiraan berasal langsung dari JSON BMKG Kemayoran melalui `/api/weather`; interval asli sumber dipertahankan. Peta OpenStreetMap menjadi tampilan utama dengan zoom, geser, dan marker zona ilustratif.

Monitoring berada di `/monitoring`: shift dan tanggal terpilih, progres tindakan, peta zona, interval WBGT, kualitas sumber, riwayat, dan tautan kembali ke tugas. `/perangkat` tetap tersedia sebagai rincian ekosistem alat. Laporan, analitik, insight, dan rekap paparan dikelompokkan dalam Laporan & evaluasi.

## Data kondisi awal

Ringkasan perusahaan mencatat sumber dokumen, tanggal pemeriksaan, masa berlaku, kesimpulan kerja, dan pembatasan/tindak lanjut. HSE mencatat ringkasan; petugas data melihat kelengkapannya, mandor tidak melihat isinya. Tidak ada diagnosis, obat, atau hasil laboratorium yang diimpor pada perubahan ini. Klinik belum menjadi role aktif.

Kehadiran tidak disimpulkan dari pemilihan peserta. Kios menyimpan satu check-in per pekerja pada draft, kondisi BAIK/KURANG_BUGAR/ADA_KELUHAN, keluhan yang dipilih, dan waktu. Jawaban bukan izin medis. HSE perlu mencatat tindak lanjut; TUNDA_PENUGASAN tetap menghalangi persetujuan/penerbitan. Koreksi jawaban atau pembaruan baseline pada draft sebelum persetujuan membatalkan tinjauan terkait. Submit ulang identik tidak menggandakan absen. Setelah persetujuan pertama, check-in awal dikunci; perubahan kondisi selama pelaksanaan perlu SOP/tindak lanjut terpisah.

Master baseline disalin ke shift. Perubahan setelah rencana disetujui, pada shift berjalan, atau pada riwayat tertutup tidak menulis ulang salinan sebelumnya. Draft lama yang belum memiliki persetujuan atau tindakan ditambahkan pencatatan kondisi awal saat dibaca; kehadiran lama yang hanya berasal dari pemilihan peserta tidak dianggap absen aktual. Shift lama yang sudah disetujui, berjalan, atau ditutup tetap memakai riwayatnya. Mandor melihat status tindak lanjut dan kehadiran untuk regu sendiri; audit umum tidak berisi teks keluhan/pembatasan.

## Batas runtime

Akun masih pemilihan role di klien, penyimpanan masih localStorage browser yang sama. Kios belum memakai token perangkat, pembaca kartu fisik, autentikasi pekerja, atau sinkronisasi lintas perangkat. Ringkasan kesehatan dalam prototype bukan pemisahan keamanan server. BMKG JSON dan ubin OpenStreetMap terhubung langsung. Company Data Hub menyediakan delapan master/baseline referensi hanya pada ruang kosong, tanpa menimpa pekerjaan lama. Sensor memakai adaptor lokal dengan provenance dan sinkron otomatis pada tugas Sensor. Instruksi dikirim ke kotak masuk mandor di TERMA. Tidak ada formulir impor CSV. Tidak ada diagnosis atau prediksi penyakit baru.

## Kamera dan kartu

Kios membuka kamera hanya setelah tombol ditekan. Efek termal adalah visualisasi; kamera biasa tidak mengukur suhu. Identitas dipilih dan dikonfirmasi pekerja, tanpa pengenalan wajah. Metode kamera, pratinjau tanpa kamera, atau tap kartu tersimpan bersama jawaban kondisi, tanpa gambar/video. Stream dihentikan saat ganti metode, konfirmasi, keluar halaman, atau tab disembunyikan. Tap kartu bersifat interaksi kios dengan durasi yang sama seperti reader water station. Kedua jalur menuju pertanyaan kondisi tubuh lalu bukti absen; HSE meninjau hasilnya di tugas awal shift.

## Pemeriksaan kamera, konektor, dan OSM

- 148 pengujian / 22 berkas lulus, TypeScript lulus, ESLint 0 error / 8 warning Bklit yang sudah ada. Build produksi lulus.
- Browser dengan perangkat kamera uji Chromium: stream hidup; ganti metode dan konfirmasi menghentikan track. Absen kartu, kamera, dan pratinjau menghasilkan tiga catatan berbeda; tiga jawaban/kehadiran tetap tersimpan setelah reload dan ditinjau HSE.
- Keluhan wajib dipilih untuk jawaban Ada keluhan. Kios pertanyaan dan bukti absen diperiksa pada 390px.
- BMKG nyata mengembalikan Kemayoran dan 18 periode pada waktu uji. Peta memuat 12 ubin OSM dan tiga marker; pilihan zona serta zoom berfungsi. Error HTTP 502 yang disisipkan lewat browser menampilkan pembaruan tertunda dan mempertahankan data terakhir; refresh berikutnya pulih.
- Bukti browser pada `web/output/playwright/`: `kiosk-camera-live.png`, `kiosk-questions-new-390.png`, `kiosk-receipt-new-390.png`, `osm-bmkg-current.png`.

## Pemeriksaan sebelumnya (rilis 9c4183f)

- Final: **138 pengujian / 19 berkas lulus**; pemeriksaan TypeScript dan build produksi Next.js lulus.
- TypeScript dan Vitest: alur, permissions, read-back, check-in idempoten, invalidasi tinjauan, baseline snapshot, format simpan, dan kompatibilitas data lama.
- ESLint: tidak ada error; delapan warning lama pada Bklit.
- Browser nyata: dua pekerja dari regu berbeda ditambahkan melalui petugas data; baseline dicatat HSE; draft dibuat; kios mencatat keluhan dan kondisi baik; HSE meninjau keduanya dan adaptasi; petugas data menyimpan bacaan serta mengimpor tiga periode prakiraan. Reload mempertahankan dua absensi/check-in dan tiga periode. Mandor tidak melihat pembatasan perusahaan.
- Browser siklus lengkap: HSE menerbitkan/membagikan dua rencana; Budi dan Sari masing-masing hanya melihat regunya, mengakui instruksi dan melaporkan 80 menit; HSE memverifikasi masing-masing 75 menit, menutup shift dan membuka laporan. CLOSED, dua check-in, dan verifikasi tetap tersimpan setelah reload.
- Browser produksi: 36 kombinasi enam halaman × 1440/820/390px × light/dark tanpa overflow atau page error; beranda petugas data/mandor diperiksa lagi pada tiga lebar/kedua tema. Pergantian Budi→Sari tetap benar setelah reload. Kios pertanyaan dan submit diperiksa pada 390px. Alias `/ringkasan?buat=1` tetap membuka pembuatan draft HSE; petugas data tidak ditawari pembuatan shift.
- Panduan Driver.js terbuka dan Escape menutupnya; delapan animasi masuk halaman teramati, reduced motion menghasilkan `animation: none` dan `transform: none`.
- Control artifact: `af15cee`, hanya baseline visual; **tidak tersedia timing produksi control yang sebanding**. Pengukuran lokal warm navigation ke Forecasting pada build baru 39/28/30 ms, bersifat observasi satu perangkat, bukan klaim peningkatan atau latensi lapangan. Tidak ada benchmark perbandingan/RUM.
- Bukti browser tersimpan pada `web/output/playwright/` yang diabaikan Git: `forecast-map-desktop-final.png`, `forecast-map-mobile-final.png`, `kiosk-questions-390-dark.png`, `role-admin-*`, `role-mandor-*`, `closed-report.png`.
- Proposal dikonversi secara lokal ke `/tmp/TERMA_Proposal_DeveloperDay2026.md`; PDF asli tidak diubah.
