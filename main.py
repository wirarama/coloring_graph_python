"""
main.py
=======
Entry point tunggal. Menjalankan seluruh pipeline:
1. Generate data random (level 1-5) -> data/data_level{n}.json
2. Bangun conflict graph & jalankan Greedy Coloring vs DSATUR Coloring
3. Hasilkan tabel evaluasi -> output/tabel_evaluasi.csv
4. Ekspor jadwal final (hasil DSATUR, algoritma terbaik) tiap level
   -> output/jadwal_level{n}.json dan .csv
5. Hasilkan visualisasi:
   - output/graph_coloring_level{N}.png
   - output/perbandingan_algoritma.png
   - output/heatmap_jadwal_level{N}_dsatur.png / _greedy.png

Cara pakai:
    python3 main.py
"""

import os
import json
import pandas as pd

from data_generator import generate_all_levels
from evaluate import evaluate_all_levels
from visualize import plot_colored_graphs, plot_comparison_charts, plot_schedule_heatmap

DATA_DIR = "data"
OUT_DIR = "output"
GRAPH_VIZ_LEVEL = 2       # level yang digunakan utk visual graph (agar tetap terbaca)
HEATMAP_LEVEL = 3         # level yang digunakan utk contoh heatmap jadwal


def export_schedules(schedules, out_dir=OUT_DIR):
    for level, s in schedules.items():
        jadwal = s["jadwal_dsatur"]  # gunakan hasil algoritma terbaik (DSATUR)
        with open(os.path.join(out_dir, f"jadwal_level{level}.json"), "w", encoding="utf-8") as f:
            json.dump(jadwal, f, ensure_ascii=False, indent=2)
        pd.DataFrame(jadwal).to_csv(os.path.join(out_dir, f"jadwal_level{level}.csv"), index=False)


def main():
    print("=" * 70)
    print("PIPELINE PENJADWALAN PRAKTIKUM - GRAPH COLORING vs GREEDY COLORING")
    print("=" * 70)

    print("\n[1/4] Generating random data (level 1-5)...")
    generate_all_levels(out_dir=DATA_DIR)

    print("\n[2/4] Menjalankan & mengevaluasi algoritma di semua level...")
    df, schedules, csv_path = evaluate_all_levels(data_dir=DATA_DIR, out_dir=OUT_DIR)
    pd.set_option("display.width", 160)
    pd.set_option("display.max_columns", None)
    print(df.to_string(index=False))

    print("\n[3/4] Mengekspor jadwal final (DSATUR) per level...")
    export_schedules(schedules, out_dir=OUT_DIR)

    print("\n[4/4] Membuat visualisasi...")
    p1 = plot_colored_graphs(schedules, level=GRAPH_VIZ_LEVEL, out_dir=OUT_DIR)
    p2 = plot_comparison_charts(df, out_dir=OUT_DIR)
    p3 = plot_schedule_heatmap(schedules, level=HEATMAP_LEVEL, algo="dsatur", out_dir=OUT_DIR)
    p4 = plot_schedule_heatmap(schedules, level=HEATMAP_LEVEL, algo="greedy", out_dir=OUT_DIR)

    print("\nSemua file output:")
    for f in sorted(os.listdir(OUT_DIR)):
        print(f"  - {os.path.join(OUT_DIR, f)}")

    print("\nSELESAI.")


if __name__ == "__main__":
    main()
