"""
data_generator.py
==================
Generator data random untuk sistem penjadwalan praktikum.
Menghasilkan data dosen, asisten, ruang lab, peralatan lab, dan
daftar sesi praktikum yang perlu dijadwalkan, dalam 5 tingkat
kesulitan (level 1 = ringan, level 5 = berat/padat konflik).

Setiap sesi praktikum membutuhkan:
- 1 dosen pengampu
- 1-2 asisten praktikum
- 1 ruang lab
- 1-3 unit peralatan lab

Semakin tinggi level, semakin banyak sesi tetapi jumlah pool
sumber daya (dosen/asisten/ruang/alat) relatif tidak bertambah
secepat jumlah sesi -> kepadatan konflik (graph density) naik.

Output: file JSON per level di folder data/ (data_level{n}.json)
"""

import json
import random
import os

MATA_KULIAH = [
    "Algoritma & Pemrograman", "Basis Data", "Jaringan Komputer",
    "Sistem Operasi", "Kecerdasan Buatan", "Pemrograman Web",
    "Struktur Data", "Sistem Digital", "Mikrokontroler", "IoT",
    "Machine Learning", "Grafika Komputer", "Keamanan Jaringan",
    "Sistem Tertanam", "Rekayasa Perangkat Lunak", "Data Mining",
    "Pemrograman Mobile", "Robotika", "Komputasi Awan", "Multimedia"
]

NAMA_DEPAN = ["Adi", "Budi", "Citra", "Dewi", "Eka", "Farhan", "Gita",
              "Hadi", "Indah", "Joko", "Kartika", "Lutfi", "Maya",
              "Nanda", "Oka", "Putri", "Rama", "Sari", "Taufik", "Umi",
              "Vina", "Wira", "Yoga", "Zahra"]

GELAR = ["S.T., M.T.", "S.Kom., M.Kom.", "M.Eng.", "Ph.D.", "M.Cs."]

LEVEL_CONFIG = {
    1: dict(n_sesi=10, n_dosen=8,  n_asisten=10, n_ruang=5,  n_alat=8),
    2: dict(n_sesi=18, n_dosen=10, n_asisten=14, n_ruang=6,  n_alat=10),
    3: dict(n_sesi=26, n_dosen=12, n_asisten=18, n_ruang=7,  n_alat=12),
    4: dict(n_sesi=34, n_dosen=14, n_asisten=22, n_ruang=8,  n_alat=14),
    5: dict(n_sesi=44, n_dosen=16, n_asisten=26, n_ruang=9,  n_alat=16),
}


def _buat_nama(prefix, idx):
    nama = random.choice(NAMA_DEPAN)
    return f"{prefix}-{idx:02d} ({nama} {random.choice(GELAR) if prefix=='D' else ''})".strip()


def generate_level_data(level: int, seed: int = None) -> dict:
    if level not in LEVEL_CONFIG:
        raise ValueError("Level harus 1-5")
    if seed is not None:
        random.seed(seed)

    cfg = LEVEL_CONFIG[level]

    dosen = [f"Dr. {random.choice(NAMA_DEPAN)} {random.choice(GELAR)} (D{idx+1:02d})"
              for idx in range(cfg["n_dosen"])]
    asisten = [f"{random.choice(NAMA_DEPAN)} (A{idx+1:02d})"
               for idx in range(cfg["n_asisten"])]
    ruang = [f"Lab-{chr(65+idx)}" for idx in range(cfg["n_ruang"])]
    alat = [f"Alat-{idx+1:02d}" for idx in range(cfg["n_alat"])]

    sesi_list = []
    for i in range(cfg["n_sesi"]):
        matkul = random.choice(MATA_KULIAH)
        n_asisten_sesi = random.randint(1, 2)
        n_alat_sesi = random.randint(1, 3)
        sesi = {
            "id_sesi": f"L{level}-S{i+1:03d}",
            "mata_kuliah": matkul,
            "kelas": random.choice(["A", "B", "C"]),
            "dosen": random.choice(dosen),
            "asisten": sorted(random.sample(asisten, k=n_asisten_sesi)),
            "ruang_lab": random.choice(ruang),
            "peralatan_lab": sorted(random.sample(alat, k=n_alat_sesi)),
            "durasi_slot": 1,  # dalam satuan slot (1 slot = 1 sesi praktikum)
        }
        sesi_list.append(sesi)

    data = {
        "level": level,
        "deskripsi_level": {
            1: "Ringan - sedikit sesi, sumber daya longgar",
            2: "Sedang-ringan",
            3: "Sedang",
            4: "Sedang-berat",
            5: "Berat - banyak sesi, sumber daya padat/terbatas",
        }[level],
        "hari": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
        "slot_per_hari": 10,
        "total_slot_tersedia": 5 * 10,
        "sumber_daya": {
            "dosen": dosen,
            "asisten": asisten,
            "ruang_lab": ruang,
            "peralatan_lab": alat,
        },
        "sesi_praktikum": sesi_list,
    }
    return data


def generate_all_levels(out_dir="data", seed_base=42):
    os.makedirs(out_dir, exist_ok=True)
    paths = []
    for level in range(1, 6):
        data = generate_level_data(level, seed=seed_base + level)
        path = os.path.join(out_dir, f"data_level{level}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        paths.append(path)
        print(f"[OK] Level {level}: {len(data['sesi_praktikum'])} sesi -> {path}")
    return paths


if __name__ == "__main__":
    generate_all_levels()
