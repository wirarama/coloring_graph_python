"""
visualize.py
============
Menghasilkan visualisasi:
1. Graph konflik berwarna (hasil coloring) - Greedy vs DSATUR, untuk
   satu level yang representatif (default level 2, agar graph tidak
   terlalu padat untuk dilihat).
2. Grafik batang perbandingan jumlah warna (slot) & waktu eksekusi
   Greedy vs DSATUR di semua level 1-5.
3. Heatmap jadwal (hari x slot) hasil DSATUR untuk satu level.
"""

import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import networkx as nx

from evaluate import evaluate_all_levels

PALETTE = plt.cm.tab20.colors


def plot_colored_graphs(schedules, level, out_dir="output"):
    G = schedules[level]["G"]
    g_colors = schedules[level]["g_colors"]
    d_colors = schedules[level]["d_colors"]

    pos = nx.spring_layout(G, seed=7, k=0.6)

    fig, axes = plt.subplots(1, 2, figsize=(15, 7))
    for ax, colors, title, n_used in [
        (axes[0], g_colors, "Greedy Coloring (urutan sekuensial)", len(set(g_colors.values()))),
        (axes[1], d_colors, "DSATUR Coloring (saturation degree)", len(set(d_colors.values()))),
    ]:
        node_colors = [PALETTE[colors[n] % len(PALETTE)] for n in G.nodes()]
        nx.draw_networkx_edges(G, pos, ax=ax, alpha=0.25, width=0.8)
        nx.draw_networkx_nodes(G, pos, ax=ax, node_color=node_colors,
                                node_size=260, edgecolors="black", linewidths=0.6)
        nx.draw_networkx_labels(G, pos, ax=ax, font_size=6)
        ax.set_title(f"{title}\n{G.number_of_nodes()} sesi, {G.number_of_edges()} konflik, "
                      f"{n_used} slot waktu dipakai", fontsize=11)
        ax.axis("off")

    fig.suptitle(f"Perbandingan Pewarnaan Graph Konflik Sesi Praktikum — Level {level}",
                  fontsize=14, fontweight="bold")
    fig.tight_layout()
    path = os.path.join(out_dir, f"graph_coloring_level{level}.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return path


def plot_comparison_charts(df, out_dir="output"):
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))

    levels = df["Level"]
    x = np.arange(len(levels))
    w = 0.35

    # Chart 1: jumlah warna minimum (chromatic estimate)
    ax = axes[0]
    b1 = ax.bar(x - w/2, df["Greedy - Warna Minimum"], w, label="Greedy Coloring", color="#e07a5f")
    b2 = ax.bar(x + w/2, df["DSATUR - Warna Minimum"], w, label="DSATUR Coloring", color="#3d5a80")
    ax.set_xticks(x)
    ax.set_xticklabels([f"Level {l}" for l in levels])
    ax.set_ylabel("Jumlah Warna Minimum Dibutuhkan")
    ax.set_title("Efisiensi Pemampatan (Warna Minimum)")
    ax.legend()
    ax.bar_label(b1, fontsize=8)
    ax.bar_label(b2, fontsize=8)
    ax.grid(axis="y", alpha=0.3)

    # Chart 2: waktu eksekusi
    ax = axes[1]
    ax.plot(x, df["Greedy - Waktu (ms)"], marker="o", label="Greedy Coloring", color="#e07a5f")
    ax.plot(x, df["DSATUR - Waktu (ms)"], marker="s", label="DSATUR Coloring", color="#3d5a80")
    ax.set_xticks(x)
    ax.set_xticklabels([f"Level {l}" for l in levels])
    ax.set_ylabel("Waktu Eksekusi (ms)")
    ax.set_title("Waktu Eksekusi Algoritma")
    ax.legend()
    ax.grid(alpha=0.3)

    fig.suptitle("Evaluasi Algoritma: Greedy Coloring vs DSATUR Coloring (Level 1-5)",
                  fontsize=14, fontweight="bold")
    fig.tight_layout()
    path = os.path.join(out_dir, "perbandingan_algoritma.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return path


def plot_schedule_heatmap(schedules, level, algo="dsatur", out_dir="output"):
    data = schedules[level]["data"]
    jadwal = schedules[level][f"jadwal_{algo}"]
    hari_list = data["hari"]
    slot_per_hari = data["slot_per_hari"]

    grid = np.full((slot_per_hari, len(hari_list)), "", dtype=object)
    count = np.zeros((slot_per_hari, len(hari_list)))
    for s in jadwal:
        if s["slot"] == -1:
            continue
        r, c = s["slot"] - 1, hari_list.index(s["hari"])
        grid[r, c] = s["mata_kuliah"][:14]
        count[r, c] += 1

    fig, ax = plt.subplots(figsize=(9, 7))
    im = ax.imshow(count, cmap="Blues", vmin=0, vmax=1, aspect="auto")
    ax.set_xticks(range(len(hari_list)))
    ax.set_xticklabels(hari_list)
    ax.set_yticks(range(slot_per_hari))
    ax.set_yticklabels([f"Slot {i+1}" for i in range(slot_per_hari)])
    ax.set_title(f"Heatmap Jadwal Praktikum — Level {level} "
                  f"({'DSATUR' if algo=='dsatur' else 'Greedy'} Coloring)",
                  fontsize=12, fontweight="bold")

    for r in range(slot_per_hari):
        for c in range(len(hari_list)):
            if grid[r, c]:
                ax.text(c, r, grid[r, c], ha="center", va="center", fontsize=6.5)

    fig.colorbar(im, ax=ax, label="Terisi (1) / Kosong (0)", shrink=0.7)
    fig.tight_layout()
    path = os.path.join(out_dir, f"heatmap_jadwal_level{level}_{algo}.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return path


if __name__ == "__main__":
    df, schedules, csv_path = evaluate_all_levels()
    p1 = plot_colored_graphs(schedules, level=2)
    p2 = plot_comparison_charts(df)
    p3 = plot_schedule_heatmap(schedules, level=2, algo="dsatur")
    p4 = plot_schedule_heatmap(schedules, level=2, algo="greedy")
    print("Generated:", p1, p2, p3, p4, sep="\n- ")
