# Sistem Penjadwalan Praktikum Berbasis Graph Coloring

Sistem penjadwalan sesi praktikum (dosen, asisten, ruang lab, peralatan lab)
untuk hari Senin–Jumat dengan maksimal 10 slot per hari, menggunakan
pendekatan **graph coloring**. Proyek ini juga membandingkan dua algoritma
pewarnaan graph: **Greedy Coloring** (sekuensial) vs **DSATUR Coloring**
(Degree of Saturation, Brelaz 1979).

## Daftar Isi
- [Konsep & Model Masalah](#konsep--model-masalah)
- [Struktur Proyek](#struktur-proyek)
- [Instalasi](#instalasi)
- [Cara Menjalankan](#cara-menjalankan)
- [Penjelasan Tiap Modul](#penjelasan-tiap-modul)
- [Format Data](#format-data)
- [Level Kesulitan Data](#level-kesulitan-data)
- [Algoritma yang Dibandingkan](#algoritma-yang-dibandingkan)
- [Metrik Evaluasi](#metrik-evaluasi)
- [Output yang Dihasilkan](#output-yang-dihasilkan)
- [Hasil Ringkas](#hasil-ringkas)

## Konsep & Model Masalah

Setiap **sesi praktikum** membutuhkan 4 jenis sumber daya:
- 1 **dosen** pengampu
- 1–2 **asisten** praktikum
- 1 **ruang lab**
- 1–3 unit **peralatan lab**

Dua sesi praktikum **tidak boleh dijadwalkan pada slot waktu yang sama**
jika keduanya berbagi salah satu sumber daya di atas (misalnya dosen yang
sama, atau ruang lab yang sama).

Masalah ini dipetakan ke **graph coloring**:
- **Node** = sesi praktikum
- **Edge** = dua sesi yang bentrok sumber daya (tidak boleh 1 slot yang sama)
- **Warna** = slot waktu (hari + slot ke-berapa)
- **Constraint proper coloring** (dua node bertetangga tidak boleh warna
  sama) otomatis menjamin tidak ada bentrok jadwal
- **Tujuan**: meminimalkan jumlah warna (slot waktu unik) yang dipakai,
  supaya jadwal sepadat/seefisien mungkin dan tidak melebihi kapasitas
  50 slot yang tersedia (5 hari × 10 slot)

## Struktur Proyek

```
lab_scheduling/
├── main.py                  # entry point — jalankan seluruh pipeline
├── data_generator.py        # generator data acak level 1-5 (JSON)
├── scheduler.py             # conflict graph + algoritma Greedy & DSATUR
├── evaluate.py               # jalankan & bandingkan algoritma, buat tabel
├── visualize.py              # graph berwarna, chart, heatmap jadwal
├── README.md
├── data/                     # (dihasilkan otomatis)
│   ├── data_level1.json
│   ├── data_level2.json
│   ├── data_level3.json
│   ├── data_level4.json
│   └── data_level5.json
└── output/                   # (dihasilkan otomatis)
    ├── tabel_evaluasi.csv
    ├── perbandingan_algoritma.png
    ├── graph_coloring_level2.png
    ├── heatmap_jadwal_level3_dsatur.png
    ├── heatmap_jadwal_level3_greedy.png
    ├── jadwal_level{1..5}.json
    └── jadwal_level{1..5}.csv
```

## Instalasi

Membutuhkan Python 3.9+ dan library berikut:

```bash
pip install networkx matplotlib pandas numpy
```

## Cara Menjalankan

Jalankan seluruh pipeline (generate data → jadwalkan → evaluasi →
visualisasi) dengan satu perintah:

```bash
python3 main.py
```

Atau jalankan tiap tahap secara terpisah:

```bash
python3 data_generator.py   # hanya generate data JSON level 1-5
python3 scheduler.py        # demo penjadwalan 1 level (level 3) di terminal
python3 evaluate.py         # jalankan & bandingkan algoritma semua level
python3 visualize.py        # hasilkan semua grafik/visualisasi
```

Untuk mengganti level yang divisualisasikan (graph & heatmap), sunting
konstanta `GRAPH_VIZ_LEVEL` dan `HEATMAP_LEVEL` di `main.py`.

## Penjelasan Tiap Modul

### `data_generator.py`
Menghasilkan data acak (dosen, asisten, ruang lab, peralatan lab, dan
daftar sesi praktikum) untuk 5 level kesulitan, disimpan sebagai JSON.
Fungsi utama:
- `generate_level_data(level, seed)` — generate 1 level, return dict
- `generate_all_levels(out_dir)` — generate & simpan level 1–5 sekaligus

### `scheduler.py`
Inti algoritma. Fungsi utama:
- `build_conflict_graph(data)` — bangun graph konflik dari data sesi
- `greedy_coloring(G)` — pewarnaan greedy sekuensial (urutan alami)
- `dsatur_coloring(G)` — pewarnaan DSATUR (saturation degree tertinggi
  dipilih lebih dulu tiap iterasi)
- `map_colors_to_schedule(color_of, data)` — ubah hasil warna menjadi
  jadwal (hari, slot)
- `validate_schedule(jadwal)` — hitung jumlah pelanggaran bentrok
  sumber daya pada jadwal akhir (harus 0 jika coloring valid)

### `evaluate.py`
Menjalankan kedua algoritma di semua level dan mengumpulkan metrik ke
dalam `pandas.DataFrame`, lalu diekspor ke `output/tabel_evaluasi.csv`.

### `visualize.py`
Menghasilkan 3 jenis visualisasi menggunakan `matplotlib` + `networkx`:
1. Graph konflik dengan node diwarnai sesuai hasil coloring (Greedy vs
   DSATUR berdampingan)
2. Grafik batang & garis: jumlah slot dipakai dan waktu eksekusi per
   level, Greedy vs DSATUR
3. Heatmap jadwal (hari × slot) hasil satu algoritma untuk satu level

### `main.py`
Menjalankan seluruh pipeline di atas secara berurutan dan mencetak
ringkasan tabel evaluasi ke terminal.

## Format Data

Contoh struktur `data_level{n}.json`:

```json
{
  "level": 3,
  "deskripsi_level": "Sedang",
  "hari": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
  "slot_per_hari": 10,
  "total_slot_tersedia": 50,
  "sumber_daya": {
    "dosen": ["Dr. Adi S.T., M.T. (D01)", "..."],
    "asisten": ["Budi (A01)", "..."],
    "ruang_lab": ["Lab-A", "Lab-B", "..."],
    "peralatan_lab": ["Alat-01", "Alat-02", "..."]
  },
  "sesi_praktikum": [
    {
      "id_sesi": "L3-S001",
      "mata_kuliah": "Kecerdasan Buatan",
      "kelas": "A",
      "dosen": "Dr. Adi S.T., M.T. (D01)",
      "asisten": ["Budi (A01)"],
      "ruang_lab": "Lab-A",
      "peralatan_lab": ["Alat-02", "Alat-05"],
      "durasi_slot": 1
    }
  ]
}
```

Output jadwal (`output/jadwal_level{n}.json`) berisi array sesi dengan
tambahan field `hari`, `slot`, dan `warna_graph`.

## Level Kesulitan Data

| Level | Jumlah Sesi | Pool Dosen | Pool Asisten | Pool Ruang | Pool Alat | Karakteristik |
|---|---|---|---|---|---|---|
| 1 | 10 | 8 | 10 | 5 | 8 | Ringan, sumber daya longgar |
| 2 | 18 | 10 | 14 | 6 | 10 | Sedang-ringan |
| 3 | 26 | 12 | 18 | 7 | 12 | Sedang |
| 4 | 34 | 14 | 22 | 8 | 14 | Sedang-berat |
| 5 | 44 | 16 | 26 | 9 | 16 | Berat, sumber daya padat/terbatas |

Semakin tinggi level, rasio jumlah sesi terhadap pool sumber daya makin
besar sehingga kepadatan graph konflik (density) meningkat dan masalah
coloring menjadi lebih sulit.

## Algoritma yang Dibandingkan

### 1. Greedy Coloring (sekuensial)
Memproses node sesuai urutan insersi/alami pada graph, memberi tiap
node warna terkecil yang belum dipakai tetangganya. Sederhana dan
cepat, tetapi hasil jumlah warnanya sangat bergantung pada urutan
pemrosesan — tidak ada strategi pemilihan node yang cerdas.

### 2. DSATUR (Degree of Saturation — Brelaz, 1979)
Pada tiap iterasi memilih node **belum berwarna** dengan *saturation
degree* tertinggi (banyaknya warna berbeda yang sudah dipakai oleh
tetangganya); jika seri, dipilih node dengan derajat (degree) tertinggi.
Strategi ini lebih adaptif karena mendahulukan node yang paling
"terkekang" pilihannya, sehingga umumnya menghasilkan jumlah warna
(chromatic number) yang lebih kecil / mendekati optimal dibanding
greedy sekuensial biasa.

## Metrik Evaluasi

Untuk tiap level dan tiap algoritma, dihitung:
- **Jumlah node & edge** graph konflik, serta **densitas graph**
- **Jumlah warna/slot** yang dipakai (semakin kecil semakin baik)
- **Waktu eksekusi** (ms)
- **Feasible** — apakah jumlah warna masih ≤ 50 slot tersedia
- **Jumlah pelanggaran** pada jadwal akhir (validasi ulang bentrok
  sumber daya — harus 0 jika coloring benar)
- **Efisiensi DSATUR (%)** — persentase pengurangan jumlah slot DSATUR
  dibanding Greedy

## Output yang Dihasilkan

| File | Deskripsi |
|---|---|
| `data/data_level{1-5}.json` | Data mentah (sumber daya + sesi) tiap level |
| `output/tabel_evaluasi.csv` | Tabel perbandingan metrik semua level |
| `output/jadwal_level{1-5}.json` / `.csv` | Jadwal final (hasil DSATUR) tiap level |
| `output/graph_coloring_level2.png` | Visual graph konflik berwarna, Greedy vs DSATUR |
| `output/perbandingan_algoritma.png` | Chart jumlah slot & waktu eksekusi per level |
| `output/heatmap_jadwal_level3_dsatur.png` | Heatmap jadwal (hari × slot) hasil DSATUR |
| `output/heatmap_jadwal_level3_greedy.png` | Heatmap jadwal (hari × slot) hasil Greedy |

## Hasil Ringkas

| Level | Sesi | Konflik (edge) | Greedy (slot) | DSATUR (slot) | Efisiensi DSATUR |
|---|---|---|---|---|---|
| 1 | 10 | 29 | 6 | 5 | 16.7% |
| 2 | 18 | 81 | 8 | 7 | 12.5% |
| 3 | 26 | 164 | 9 | 8 | 11.1% |
| 4 | 34 | 254 | 10 | 8 | 20.0% |
| 5 | 44 | 423 | 13 | 11 | 15.4% |

DSATUR konsisten memakai jumlah slot waktu lebih sedikit daripada
Greedy sekuensial di semua level, dengan trade-off waktu eksekusi
sedikit lebih lama (overhead pelacakan saturasi) — namun keduanya
tetap berjalan sub-milidetik bahkan pada level 5, dan **0 pelanggaran**
bentrok sumber daya pada seluruh jadwal yang dihasilkan.

## Catatan / Pengembangan Lanjutan

- Data dihasilkan dengan `random.seed` tetap (`seed_base=42` + level)
  agar hasil dapat direproduksi; ubah `seed_base` di
  `generate_all_levels()` untuk data acak yang berbeda.
- Untuk kebutuhan nyata, `durasi_slot` bisa dikembangkan untuk sesi
  yang butuh >1 slot berturut-turut (saat ini diasumsikan tiap sesi =
  1 slot).
- Bisa ditambahkan constraint preferensi (misal dosen tidak bisa hari
  tertentu) dengan menambah edge semu ke "warna terlarang".
