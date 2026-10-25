-- =====================================================================
-- TERMA — Skema DDL PostgreSQL (P0 / MVP lomba)
-- Mengikat ke PRD Revisi 2, bagian 8 (kontrak keputusan) & bagian 9 (14 entitas).
--
-- Prinsip yang ditegakkan di skema ini:
--   P2: status tindakan != status sehat  -> enum action_status tanpa label medis
--   P3: kualitas data sumbu terpisah      -> enum data_quality, kolom terpisah dari status
--   P4: fail-safe                          -> data hilang/kedaluwarsa tidak boleh jadi "siap"
--   P5: keterlacakan                       -> source/event_time/record_time/origin di catatan operasional
--   LogAudit append-only                   -> trigger menolak UPDATE/DELETE
--   Idempoten impor ulang                  -> UNIQUE natural key + import_batch
--
-- Target: PostgreSQL 16. Bootstrap awal; Alembic mengambil alih sesudahnya.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. ENUM — kontrak keputusan & label (bagian 8)
-- ---------------------------------------------------------------------

-- Sumbu KEPUTUSAN (bukan status kesehatan).
CREATE TYPE action_status AS ENUM (
    'RENCANA_TERSEDIA',
    'ADAPTASI_DIPERLUKAN',
    'TINJAU_HSE',
    'BATASI_ATAU_PINDAHKAN'
);

-- Sumbu KUALITAS DATA (ditampilkan terpisah dari status tindakan).
CREATE TYPE data_quality AS ENUM (
    'TERUKUR',
    'REPLAY',
    'PRAKIRAAN_SAJA',
    'KEDALUWARSA',
    'TIDAK_TERSEDIA'
);

-- Asal catatan operasional (P5: setiap catatan menyatakan dirinya).
CREATE TYPE data_origin AS ENUM (
    'AKTUAL',
    'SINTETIS',
    'MANUAL',
    'REPLAY'
);

-- Siklus hidup tindakan (F-ACT-01). Pengakuan != kepatuhan.
CREATE TYPE action_lifecycle AS ENUM (
    'DIBUAT',
    'DISAMPAIKAN',
    'DIAKUI',
    'TINDAKAN_DILAPORKAN',
    'TERVERIFIKASI',
    'BELUM_SELESAI'
);

-- Profil aklimatisasi (F-ACCL-02, NIOSH).
CREATE TYPE accl_profile AS ENUM (
    'PEKERJA_BARU',           -- awal maks 20%, +20 poin persen/hari
    'BERPENGALAMAN_KEMBALI'   -- 50% / 60% / 80% / 100%
);

-- Kategori beban kerja (menentukan baris NAB).
CREATE TYPE workload_category AS ENUM (
    'RINGAN',
    'SEDANG',
    'BERAT',
    'SANGAT_BERAT'
);

-- Peran (F-PRIV-01). Otorisasi ditegakkan di service layer, bukan hanya di sini.
CREATE TYPE user_role AS ENUM (
    'HSE',
    'MANDOR',
    'PETUGAS_DATA'
);

-- Status kehadiran (F-DATA): pemicu tinjauan, BUKAN bukti paparan.
CREATE TYPE attendance_status AS ENUM (
    'HADIR',
    'CUTI',
    'SAKIT',
    'ALFA'
);

-- Status pengiriman notifikasi (F-NOTIF-01). Status simulasi harus terlihat.
CREATE TYPE delivery_status AS ENUM (
    'SIMULASI',
    'SANDBOX',
    'TERKIRIM',   -- hanya boleh jika ada bukti kanal
    'GAGAL'
);


-- =====================================================================
-- MASTER / ORGANISASI
-- (Pendukung; P0 = satu lokasi, tapi dimodelkan untuk otorisasi per-lokasi/regu.)
-- =====================================================================

CREATE TABLE lokasi (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kode            TEXT        NOT NULL UNIQUE,
    nama            TEXT        NOT NULL,
    kode_wilayah    TEXT,                               -- kode wilayah administrasi BMKG
    -- Konfigurasi fail-safe yang ditetapkan HSE (F-ENV-03):
    ambang_usia_bacaan_menit INTEGER NOT NULL DEFAULT 120, -- bacaan lebih tua -> KEDALUWARSA
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app_user (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username        TEXT        NOT NULL UNIQUE,
    nama            TEXT        NOT NULL,
    role            user_role   NOT NULL,
    lokasi_id       BIGINT      REFERENCES lokasi(id),   -- lingkup otorisasi
    aktif           BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =====================================================================
-- 14 ENTITAS P0 (PRD bagian 9)
-- =====================================================================

-- (1) Regu — unit kerja; basis otorisasi mandor.
CREATE TABLE regu (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lokasi_id       BIGINT      NOT NULL REFERENCES lokasi(id),
    kode            TEXT        NOT NULL,
    nama            TEXT        NOT NULL,
    mandor_user_id  BIGINT      REFERENCES app_user(id),
    UNIQUE (lokasi_id, kode)
);

-- (2) Zona — area kerja dengan kondisi panas berbeda.
CREATE TABLE zona (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lokasi_id       BIGINT      NOT NULL REFERENCES lokasi(id),
    kode            TEXT        NOT NULL,
    nama            TEXT        NOT NULL,
    UNIQUE (lokasi_id, kode)
);

-- (3) Tugas — pekerjaan + kategori beban + APD.
CREATE TABLE tugas (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kode            TEXT        NOT NULL UNIQUE,
    nama            TEXT        NOT NULL,
    kategori_beban  workload_category NOT NULL,
    apd             TEXT[]      NOT NULL DEFAULT '{}'    -- daftar APD; koreksi APD hanya dari acuan disetujui
);

-- (4) Pekerja — identitas (alias demo untuk P0).
CREATE TABLE pekerja (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kode_pekerja        TEXT        NOT NULL,            -- ID dari berkas impor
    nama_atau_alias     TEXT        NOT NULL,
    regu_id             BIGINT      REFERENCES regu(id),
    lokasi_id           BIGINT      NOT NULL REFERENCES lokasi(id),
    tanggal_lahir       DATE,
    tanggal_mulai_kerja DATE,                            -- CATATAN: tanggal mulai saja TIDAK membuktikan adaptasi
    -- provenance (P5):
    source              TEXT        NOT NULL,
    import_batch        UUID,                            -- idempotensi impor
    origin              data_origin NOT NULL DEFAULT 'SINTETIS',
    record_time         TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Idempoten: impor ulang berkas sama tidak menggandakan pekerja (F-DATA-01).
    UNIQUE (lokasi_id, kode_pekerja)
);

-- (5) Kehadiran — hadir/cuti/sakit. Pemicu tinjauan, bukan bukti paparan (F-DATA-02).
CREATE TABLE kehadiran (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pekerja_id      BIGINT      NOT NULL REFERENCES pekerja(id),
    tanggal         DATE        NOT NULL,
    jam_masuk       TIME,
    jam_pulang      TIME,
    status          attendance_status NOT NULL,
    -- provenance (P5):
    source          TEXT        NOT NULL,
    import_batch    UUID,
    origin          data_origin NOT NULL DEFAULT 'SINTETIS',
    event_time      TIMESTAMPTZ,
    record_time     TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Idempoten: satu catatan kehadiran per pekerja per hari (F-DATA-01).
    UNIQUE (pekerja_id, tanggal)
);

-- (6) RiwayatPaparan — membedakan dirancang vs dilaporkan mandor vs diverifikasi HSE.
--     Laporan tidak mengubah data rencana menjadi data aktual.
CREATE TABLE riwayat_paparan (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pekerja_id             BIGINT   NOT NULL REFERENCES pekerja(id),
    zona_id                BIGINT   REFERENCES zona(id),
    tanggal                DATE     NOT NULL,
    durasi_dirancang_menit    INTEGER,                  -- dari Rencana
    durasi_dilaporkan_menit   INTEGER,                  -- dari mandor
    durasi_diverifikasi_menit INTEGER,                  -- dari HSE
    dikonfirmasi_hse       BOOLEAN  NOT NULL DEFAULT FALSE, -- maju hari adaptasi butuh ini, bukan kalender
    -- provenance (P5):
    source                 TEXT     NOT NULL,
    origin                 data_origin NOT NULL DEFAULT 'SINTETIS',
    record_time            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT durasi_non_negatif CHECK (
        COALESCE(durasi_dirancang_menit, 0)    >= 0 AND
        COALESCE(durasi_dilaporkan_menit, 0)   >= 0 AND
        COALESCE(durasi_diverifikasi_menit, 0) >= 0
    )
);

-- (7) Penugasan — tugas + zona + blok waktu + sumber info (F-DATA-02).
CREATE TABLE penugasan (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pekerja_id          BIGINT      NOT NULL REFERENCES pekerja(id),
    tugas_id            BIGINT      NOT NULL REFERENCES tugas(id),
    zona_id             BIGINT      NOT NULL REFERENCES zona(id),
    tanggal             DATE        NOT NULL,
    blok_mulai          TIMESTAMPTZ NOT NULL,
    blok_selesai        TIMESTAMPTZ NOT NULL,
    pengalaman_panas    BOOLEAN,                         -- untuk pemilihan profil aklimatisasi
    -- provenance (P5):
    source              TEXT        NOT NULL,
    import_batch        UUID,
    origin              data_origin NOT NULL DEFAULT 'SINTETIS',
    record_time         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT blok_urut CHECK (blok_selesai > blok_mulai)
);

-- (8) PengukuranWBGT — bacaan terlabel + metadata alat/kalibrasi (F-ENV-02).
CREATE TABLE pengukuran_wbgt (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    zona_id             BIGINT      NOT NULL REFERENCES zona(id),
    waktu_ukur          TIMESTAMPTZ NOT NULL,
    suhu_bola_basah_alami NUMERIC(4,1),                  -- °C
    suhu_bola_hitam     NUMERIC(4,1),                    -- °C
    suhu_kering         NUMERIC(4,1),                    -- °C
    kelembapan          NUMERIC(4,1),                    -- %
    isbb                NUMERIC(4,1),                     -- °C; dihitung dari rumus Permenaker (fixture berlabel)
    id_alat             TEXT,
    pencatat            TEXT,
    info_kalibrasi      TEXT,
    kualitas            data_quality NOT NULL,            -- TERUKUR / REPLAY / ...
    -- provenance (P5):
    source              TEXT        NOT NULL,
    origin              data_origin NOT NULL DEFAULT 'SINTETIS',
    record_time         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wbgt_zona_waktu ON pengukuran_wbgt (zona_id, waktu_ukur DESC);

-- (9) PrakiraanCuaca — BMKG dengan interval & lokasi asli (F-ENV-01).
--     Data publik 3 jam TIDAK diubah jadi pengukuran/ISBB per jam.
CREATE TABLE prakiraan_cuaca (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lokasi_id           BIGINT      NOT NULL REFERENCES lokasi(id),
    waktu_prakiraan     TIMESTAMPTZ NOT NULL,            -- waktu yang diprakirakan
    waktu_produksi      TIMESTAMPTZ NOT NULL,            -- kapan BMKG memproduksi
    interval_menit      INTEGER     NOT NULL DEFAULT 180, -- interval asli (3 jam)
    suhu                NUMERIC(4,1),
    kelembapan          NUMERIC(4,1),
    isbb_perkiraan      NUMERIC(4,1),                    -- hanya jika metode tervalidasi
    kualitas            data_quality NOT NULL DEFAULT 'PRAKIRAAN_SAJA',
    source              TEXT        NOT NULL DEFAULT 'BMKG',
    origin              data_origin NOT NULL DEFAULT 'AKTUAL',
    record_time         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (lokasi_id, waktu_prakiraan, waktu_produksi)  -- idempoten impor prakiraan
);

-- (10) Aturan — aturan iklim kerja berversi, tertelusur ke sumber (F-RULE-01).
--      Fixture TIDAK boleh tampil sebagai aturan operasional yang disahkan.
CREATE TABLE aturan (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kode                TEXT        NOT NULL,
    versi               TEXT        NOT NULL,
    sumber              TEXT        NOT NULL,            -- mis. "Permenaker 5/2018"
    halaman_rujukan     TEXT,
    beban_didukung      workload_category[] NOT NULL,
    perlakuan_apd       TEXT,
    periode_mulai       DATE,
    periode_selesai     DATE,
    peninjau            TEXT,
    is_fixture          BOOLEAN     NOT NULL DEFAULT TRUE, -- TRUE sampai disahkan untuk lapangan
    -- Parameter NAB per interval, disimpan sebagai JSON terstruktur.
    -- Sel kosong = kombinasi TIDAK DIDUKUNG (bukan nol) — ditangani di app layer.
    nab_rows            JSONB       NOT NULL DEFAULT '[]',
    record_time         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (kode, versi)
);

-- (11) Rencana — jadwal kerja-istirahat; batas harian & interval TERPISAH.
CREATE TABLE rencana (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pekerja_id              BIGINT       NOT NULL REFERENCES pekerja(id),
    penugasan_id            BIGINT       REFERENCES penugasan(id),
    tanggal                 DATE         NOT NULL,
    status                  action_status NOT NULL,       -- sumbu keputusan
    rencana_belum_layak     BOOLEAN      NOT NULL DEFAULT FALSE, -- F-PLAN-02
    alasan                  TEXT[]       NOT NULL DEFAULT '{}',  -- faktor penyumbang (dapat dijelaskan)
    -- Dua batas disimpan TERPISAH dan dicek bersamaan (bagian 8.3):
    batas_harian_menit      INTEGER,                      -- dari aklimatisasi; mis. hari-1 = 96
    batas_interval_json     JSONB        NOT NULL DEFAULT '{}', -- pola kerja/istirahat per interval NAB
    -- Aklimatisasi:
    profil_aklimatisasi     accl_profile,
    hari_adaptasi           INTEGER,                      -- maju hanya dengan konfirmasi + tinjauan HSE
    -- Kualitas sumber yang mendasari (sumbu TERPISAH dari status):
    kualitas_data           data_quality NOT NULL,
    -- Versi & persetujuan (bagian 8.4):
    aturan_id               BIGINT       REFERENCES aturan(id),
    versi_input_hash        TEXT,                         -- hash snapshot input untuk penelusuran
    disetujui_oleh          BIGINT       REFERENCES app_user(id),
    waktu_persetujuan       TIMESTAMPTZ,
    waktu_berlaku           TIMESTAMPTZ,
    versi_rencana           INTEGER      NOT NULL DEFAULT 1, -- perubahan batas -> versi baru, lama tetap tersimpan
    perlu_tinjau_ulang      BOOLEAN      NOT NULL DEFAULT FALSE,
    record_time             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT batas_harian_wajar CHECK (batas_harian_menit IS NULL OR batas_harian_menit >= 0),
    -- Idempoten/versi: satu versi rencana per pekerja per hari per versi.
    UNIQUE (pekerja_id, tanggal, versi_rencana)
);
CREATE INDEX idx_rencana_status ON rencana (status, tanggal);

-- (12) Tindakan — siklus hidup tindak lanjut (F-ACT-01/02).
CREATE TABLE tindakan (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rencana_id          BIGINT       NOT NULL REFERENCES rencana(id),
    deskripsi           TEXT         NOT NULL,
    status              action_lifecycle NOT NULL DEFAULT 'DIBUAT',
    penanggung_jawab    TEXT,
    waktu_tindakan      TIMESTAMPTZ,
    pelaksana           TEXT,
    alasan_tidak_dijalankan TEXT,
    pemeriksa           BIGINT       REFERENCES app_user(id), -- verifikasi HSE
    waktu_verifikasi    TIMESTAMPTZ,
    record_time         TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_tindakan_status ON tindakan (status);

-- (13) Pengiriman — catatan kirim notifikasi (F-NOTIF-01). Status simulasi terlihat.
CREATE TABLE pengiriman (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rencana_id          BIGINT       REFERENCES rencana(id),
    regu_id             BIGINT       REFERENCES regu(id),
    kanal               TEXT         NOT NULL DEFAULT 'whatsapp',
    status              delivery_status NOT NULL DEFAULT 'SIMULASI',
    bukti_kanal         TEXT,                             -- wajib ada untuk klaim TERKIRIM
    isi_ringkasan       TEXT,
    waktu_kirim         TIMESTAMPTZ,
    record_time         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- Fail-safe: TERKIRIM tanpa bukti kanal ditolak.
    CONSTRAINT terkirim_butuh_bukti CHECK (
        status <> 'TERKIRIM' OR bukti_kanal IS NOT NULL
    )
);

-- (14) LogAudit — jejak immutable (F-AUDIT-01). Append-only.
CREATE TABLE log_audit (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id   BIGINT      REFERENCES app_user(id),
    aksi            TEXT        NOT NULL,                 -- IMPOR / UBAH_PENUGASAN / VERSI_ATURAN / SETUJU_RENCANA / UBAH_TINDAKAN / VERIFIKASI
    entitas         TEXT        NOT NULL,                 -- nama tabel terdampak
    entitas_id      BIGINT,
    detail          JSONB       NOT NULL DEFAULT '{}',
    waktu           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entitas ON log_audit (entitas, entitas_id);
CREATE INDEX idx_audit_waktu ON log_audit (waktu DESC);

-- LogAudit append-only: tolak UPDATE/DELETE (perubahan tidak menghapus riwayat keputusan).
CREATE OR REPLACE FUNCTION tolak_mutasi_audit() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'log_audit bersifat append-only: % tidak diizinkan', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_no_update
    BEFORE UPDATE OR DELETE ON log_audit
    FOR EACH ROW EXECUTE FUNCTION tolak_mutasi_audit();

COMMIT;

-- =====================================================================
-- Catatan implementasi (ditegakkan di SERVICE LAYER, bukan skema):
--   * Sel NAB kosong = kombinasi tidak didukung. Rule engine mengembalikan
--     BATASI_ATAU_PINDAHKAN / RENCANA_BELUM_LAYAK, bukan 0.
--   * batas_harian_menit & batas_interval_json dicek BERSAMAAN; persentase
--     adaptasi TIDAK dikalikan dengan persen baris NAB.
--   * Bacaan WBGT lebih tua dari lokasi.ambang_usia_bacaan_menit -> KEDALUWARSA
--     -> status TINJAU_HSE (fail-safe, F-FAIL-01).
--   * Otorisasi per lokasi/regu (F-PRIV-01) difilter di query service, mandor
--     hanya pekerja/rencana yang ditugaskan.
--   * Setiap operasi menulis baris log_audit.
-- =====================================================================
