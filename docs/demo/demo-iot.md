# Lembar demo TERMA dengan alat IoT

Untuk demo lomba memakai laptop + hotspot HP. Semua langkah di bawah sudah diuji pada lingkungan ini.

## 1. Sebelum berangkat (sekali saja)

- **Akun demo**: `ratna`, `budi`, `sari`, `tono`, `dewi` — semua password `password123`. Alur langkah demi langkah dengan screenshot: `docs/demo/terma-demo-flow.pdf`.
- **Kartu RFID**: tap kartu di Water Station → Data pekerja → ⋯ → Edit pekerja → **Pakai kartu yang baru di-tap** → Simpan perubahan.
  Sekarang: `CB:3C:2B:54` = Andi Saputra. Kartu kedua `97:F5:D5:05` belum dipasangkan.
- **Sumbu bola basah** Station: basahi kapas, ujungnya tercelup air (bacaan kering membuat ISBB terlalu tinggi).
- **Stiker QR Band**: cetak QR berisi teks `BAND-01` dan `BAND-02`, tempel di Band (untuk serah-terima dengan scan).

## 2. Menyalakan (±3 menit sebelum tampil)

1. Hotspot HP `rayarayaraya` → **2,4 GHz**. Laptop masuk ke hotspot itu.
2. Terminal 1, backend alat:
   `cd ~/projects/proj-go/terma-iot && TERMA_IOT_KEY=$(grep TERMA_IOT_KEY ~/projects/proj-nextjs/terma/web/.env.local | cut -d= -f2) PORT=3028 ./terma-iot`
3. Terminal 2, web: `cd ~/projects/proj-nextjs/terma/web && npm run dev -- -p 3030`
4. Nyalakan Station, Water Station, Band. Buka `localhost:3030/perangkat` (akun Ratna): ketiganya **Online** dalam ±30 detik.

## 3. Alur cerita demo

| # | Akun | Halaman | Tunjukkan |
| --- | --- | --- | --- |
| 1 | Ratna (HSE) | Beranda & shift | Buat shift hari ini, pilih pekerja yang punya kartu dan Band |
| 2 | Ratna | Peta prakiraan | Penempatan Station di peta (klik peta → zona → simpan); selisih globe 0 untuk teduh |
| 3 | Dewi (Klinik) | Data pekerja | Kolom TERMA Band → **Catat persetujuan Band** |
| 4 | Ratna | Data pekerja | **Terapkan usulan Band** (prioritas merah → kuning → hijau) |
| 5 | Ratna | Perencanaan shift | Alasan rencana (aklimatisasi, ISBB, faktor), setujui, terbitkan |
| 6 | Tono (tablet) | `/kiosk` | Absen masuk + kondisi tubuh; nama yang sudah absen ditandai |
| 7 | Budi (Mandor) | Tugas regu | **Serah-terima TERMA Band** (tombol atau Scan QR di laptop) |
| 8 | — | — | Pekerja memakai Band (jari di sensor), tap kartu di Water Station |
| 9 | Ratna | Perangkat IoT · Pantau shift → Minum / Bacaan ISBB | Data alat masuk langsung; kunjungan minum tercatat atas nama pekerja |
| 10 | Budi | Tugas regu | **Peringatan regu** muncul (telat minum, Band); tekan tindakan |
| 11 | Dewi | Pantau → pekerja | Denyut, suhu kulit, estimasi suhu inti (hanya Klinik) |
| 12 | Tono | `/kiosk` → Absen pulang | Lalu Pusat laporan → **Dosis panas & kepatuhan** |

Ganti akun: tombol **Keluar** di kanan atas, lalu masuk dengan akun lain. Untuk menampilkan beberapa peran sekaligus, pakai jendela browser terpisah (atau mode samaran) per akun.

## 4. Kalau ada yang macet

| Gejala | Penyebab | Atasi |
| --- | --- | --- |
| Alat tidak muncul di Perangkat IoT | Laptop beda WiFi dengan alat | Laptop ke hotspot `rayarayaraya`, tunggu 30 detik |
| Tap kartu tidak tercatat di Minum | Kartu belum dipasangkan / pekerja bukan peserta shift | Edit pekerja → Pakai kartu yang baru di-tap; pastikan pekerja ada di shift |
| Band tidak mengirim | Jari tidak menempel / belum serah-terima / tanpa persetujuan | Tempel jari ±5 detik; cek kolom TERMA Band |
| ISBB jam ini kosong | Jam valid butuh ≥ 8 slot 5 menit (≥ 40 menit data) | Tunjukkan nilai langsung di Perangkat IoT; jam berikutnya terisi |
| Scan QR / kamera / notifikasi tidak jalan di HP | Browser HP memblokir kamera di alamat `http://IP:3030` | Demokan di laptop (`localhost`), atau pakai tombol manual di HP |
| Layar minta masuk lagi | Sesi berlaku 12 jam | Masuk ulang; data tetap di server |
