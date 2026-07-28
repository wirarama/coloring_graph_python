const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  ImageRun, SectionType, Header, Footer, PageNumber, convertInchesToTwip,
  TabStopType, TabStopPosition, VerticalAlign,
} = require("docx");

// ---------------------------------------------------------------------
// Page / column geometry (US Letter, IEEE-style 2-column)
// ---------------------------------------------------------------------
const PAGE_W = 12240, PAGE_H = 15840; // 8.5 x 11 in, DXA
const MARGIN = { top: 1080, bottom: 1440, left: 900, right: 900 }; // .75/1/.625/.625 in
const COL_SPACE = 288; // 0.2in
const TEXT_W = PAGE_W - MARGIN.left - MARGIN.right; // 10440
const COL_W = (TEXT_W - COL_SPACE) / 2; // ~5076

const BODY_FONT = "Times New Roman";
const MONO_FONT = "Consolas";
const NAVY = "1F3864";

const onecol = { page: { size: { width: PAGE_W, height: PAGE_H }, margin: MARGIN }, column: { count: 1 }, type: SectionType.CONTINUOUS };
const twocol = { page: { size: { width: PAGE_W, height: PAGE_H }, margin: MARGIN }, column: { count: 2, space: COL_SPACE }, type: SectionType.CONTINUOUS };

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
function bodyPara(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 264 },
    indent: opts.indent ? { firstLine: 288 } : undefined,
    children: Array.isArray(text) ? text : [new TextRun({ text, font: BODY_FONT, size: 20 })],
  });
}

function run(text, extra = {}) {
  return new TextRun({ text, font: BODY_FONT, size: 20, ...extra });
}

function heading1(num, text) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `${num}. ${text.toUpperCase()}`, bold: true, font: BODY_FONT, size: 20 })],
  });
}

function heading2(label, text) {
  return new Paragraph({
    spacing: { before: 140, after: 80 },
    children: [new TextRun({ text: `${label}. ${text}`, bold: true, italics: true, font: BODY_FONT, size: 20 })],
  });
}

function caption(label, text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 200 },
    children: [new TextRun({ text: `${label}. ${text}`, font: BODY_FONT, size: 18 })],
  });
}

function pseudocodeBlock(lines) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: "F2F2F2" },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: lines.map((l, i) => new Paragraph({
              spacing: { after: 0 },
              children: [new TextRun({ text: l, font: MONO_FONT, size: 17 })],
            })),
          }),
        ],
      }),
    ],
  });
}

function imageFullWidth(path, widthPx, heightPx, maxWidthTwip) {
  const maxWidthPx = maxWidthTwip / 15; // ~15 twips per px at 96dpi approx (1440/96)
  const scale = Math.min(1, maxWidthPx / widthPx);
  const w = Math.round(widthPx * scale);
  const h = Math.round(heightPx * scale);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 0 },
    children: [
      new ImageRun({ type: "png", data: fs.readFileSync(path), transformation: { width: w, height: h } }),
    ],
  });
}

// ---------------------------------------------------------------------
// Evaluation table data (from output/tabel_evaluasi.csv)
// ---------------------------------------------------------------------
const evalRows = [
  ["1", "10", "29", "0.644", "6", "5", "16.7"],
  ["2", "18", "81", "0.529", "8", "7", "12.5"],
  ["3", "26", "164", "0.505", "9", "8", "11.1"],
  ["4", "34", "254", "0.453", "10", "8", "20.0"],
  ["5", "44", "423", "0.447", "13", "11", "15.4"],
];
const evalHeaders = ["Level", "Sessions", "Conflicts", "Density", "Greedy", "DSATUR", "Reduction (%)"];

function evalTable() {
  const colWidths = [900, 1300, 1400, 1300, 1200, 1200, 1440]; // sums ~ page width in 1-col section
  const headerRow = new TableRow({
    tableHeader: true,
    children: evalHeaders.map((h, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: NAVY },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, color: "FFFFFF", font: BODY_FONT, size: 18 })] })],
    })),
  });
  const bodyRows = evalRows.map((r, ri) => new TableRow({
    children: r.map((v, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? "FFFFFF" : "DCE6F1" },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 50, bottom: 50, left: 80, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v, font: BODY_FONT, size: 18 })] })],
    })),
  }));
  return new Table({
    width: { size: colWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...bodyRows],
  });
}

// ---------------------------------------------------------------------
// Document assembly
// ---------------------------------------------------------------------
const titleSection = {
  properties: onecol,
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 160 },
      children: [new TextRun({
        text: "A Graph-Coloring Approach to Laboratory Practicum Scheduling: A Comparative Study of Sequential Greedy Coloring and DSATUR",
        bold: true, size: 30, font: BODY_FONT,
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text: "Wirarama Wedashwara Wyrawan", size: 22, font: BODY_FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text: "Program Studi Teknik Informatika, Fakultas Teknik, Universitas Mataram", italics: true, size: 20, font: BODY_FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "Mataram, Indonesia", italics: true, size: 20, font: BODY_FONT })],
    }),
  ],
};

const bodySection1 = {
  properties: twocol,
  children: [
    // Abstract
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: "Abstract— ", bold: true, italics: true, font: BODY_FONT, size: 19 }),
        new TextRun({
          text:
            "Scheduling laboratory practicum sessions is a constrained combinatorial problem: every session simultaneously reserves a lecturer, one or more teaching assistants, a laboratory room, and laboratory equipment, and no two sessions sharing any of these resources may be assigned the same time slot. This paper formulates the problem as a graph-coloring instance, where practicum sessions are vertices, resource-sharing conflicts are edges, and available time slots (five weekdays x ten slots) are colors. We implement and compare two coloring strategies — a naive sequential Greedy Coloring algorithm and the DSATUR (Degree of Saturation) heuristic of Brelaz — on five synthetically generated problem instances of increasing size and conflict density (10 to 44 sessions). Across all instances DSATUR produces a feasible, conflict-free schedule using 11.1%-20.0% fewer time slots than the sequential greedy baseline, at the cost of modestly higher but still sub-millisecond runtime. We present the scheduling model, both algorithms, a synthetic data generator with five difficulty levels, and an experimental evaluation with visualizations of the resulting colored conflict graphs and schedules.",
          italics: true, font: BODY_FONT, size: 19,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({ text: "Index Terms— ", bold: true, italics: true, font: BODY_FONT, size: 19 }),
        new TextRun({ text: "graph coloring, DSATUR, greedy algorithm, timetabling, laboratory scheduling, combinatorial optimization", italics: true, font: BODY_FONT, size: 19 }),
      ],
    }),

    heading1("I", "Introduction"),
    bodyPara("Laboratory practicum courses in higher-education informatics and engineering programs require the coordinated allocation of four resource types for every session: a supervising lecturer (dosen), one or more teaching assistants (asisten), a laboratory room, and a set of laboratory equipment items. As the number of course offerings, sections, and resource constraints grows, manually constructing a conflict-free weekly schedule becomes increasingly error-prone and time-consuming, and manual schedules are frequently sub-optimal in the number of distinct time slots they occupy."),
    bodyPara("This problem is a natural instance of the classical timetabling problem, which is well known to be reducible to graph coloring: courses (or sessions) that cannot share a time slot are represented as adjacent vertices in a conflict graph, and a valid timetable corresponds to a proper vertex coloring of that graph, where each color represents a distinct time slot. Since graph coloring is NP-hard in general, exact solutions are impractical for realistically sized instances, motivating the use of coloring heuristics."),
    bodyPara("In this work we (i) formulate laboratory practicum scheduling as a graph-coloring problem over a 5-day x 10-slot weekly grid, (ii) implement a synthetic data generator that produces five levels of increasing problem size and resource contention, (iii) implement and compare two coloring heuristics — sequential Greedy Coloring and DSATUR — and (iv) evaluate both algorithms in terms of the number of time slots used, execution time, and schedule feasibility/validity across all five difficulty levels."),

    heading1("II", "Related Work"),
    bodyPara("The equivalence between timetabling and graph coloring was established by de Werra, who surveyed graph-theoretic formulations of school and university timetabling problems [4]. The intractability of finding a minimum coloring (the chromatic number) is a direct consequence of the NP-completeness of graph coloring, formally established by Garey and Johnson [3]. Because exact algorithms do not scale, practical timetabling systems rely on coloring heuristics."),
    bodyPara("Welsh and Powell proposed an early and influential greedy heuristic that orders vertices by descending degree before coloring sequentially, and applied it explicitly to timetabling [2]. Brelaz later introduced DSATUR, which replaces the static vertex ordering with a dynamic rule based on saturation degree — the number of distinct colors already used by a vertex's colored neighbors — recoloring priority as the graph is processed [1]. DSATUR remains one of the most widely used and effective heuristics for graph coloring in practice, frequently approaching the chromatic number on sparse-to-moderately-dense graphs. Our conflict-graph construction and coloring routines are implemented on top of the NetworkX library [5], which provides the underlying graph data structure."),

    heading1("III", "Problem Formulation"),
    bodyPara("Let S = {s1, s2, ..., sn} be the set of practicum sessions to be scheduled. Each session si is associated with a lecturer d(si), a set of assistants a(si), a room r(si), and a set of equipment items e(si). Two sessions si and sj are said to conflict, written si ~ sj, if and only if"),
    bodyPara([
      run("d(si)=d(sj)  OR  r(si)=r(sj)  OR  a(si)∩a(sj)≠∅  OR  e(si)∩e(sj)≠∅.", { italics: true }),
    ]),
    bodyPara("We construct an undirected conflict graph G=(V,E) with V=S and (si,sj)∈E iff si~sj. A weekly schedule is a proper coloring c:V→{0,1,...,k-1} such that (si,sj)∈E implies c(si)≠c(sj). Each color value is mapped onto one of the T=|Days|x|SlotsPerDay|=5x10=50 available time slots (day = c(si) div 10, slot = c(si) mod 10 + 1). A coloring is feasible if it uses at most T colors, and the scheduling objective is to minimize k, the number of distinct colors (time slots) used — equivalently, to approximate the chromatic number chi(G) of the conflict graph."),

    heading1("IV", "Proposed Methodology"),
    heading2("A", "Synthetic Data Generation"),
    bodyPara("To evaluate both algorithms under varying problem sizes and conflict densities, we implemented a synthetic data generator that produces five difficulty levels (Level 1-5). For each level, pools of lecturers, assistants, rooms, and equipment are generated with sizes that grow more slowly than the number of sessions, so that resource contention — and hence conflict-graph density — increases with level. Each session is assigned one randomly selected lecturer, one to two assistants, one room, and one to three equipment items, uniformly sampled from the corresponding resource pool. Table I (Section VI) summarizes the resulting instance sizes."),
    heading2("B", "Conflict Graph Construction"),
    bodyPara("For every pair of sessions in a given level, the generator tests the four disjunction conditions in Section III and adds an edge whenever any condition holds. This is implemented as an O(n^2) pairwise comparison, which is tractable for the instance sizes considered (n <= 44)."),
    heading2("C", "Greedy Coloring (Sequential Baseline)"),
    bodyPara("The baseline algorithm processes vertices in their natural insertion order (i.e., the order sessions were generated) with no reordering heuristic. For each vertex it assigns the smallest color index not already used by any already-colored neighbor."),
    pseudocodeBlock([
      "Algorithm 1: Sequential Greedy Coloring",
      "Input: Graph G = (V, E)",
      "for each v in V (natural order):",
      "    used <- { color[u] : u in N(v), u colored }",
      "    color[v] <- min{ c >= 0 : c not in used }",
      "return color",
    ]),
    heading2("D", "DSATUR Coloring"),
    bodyPara("DSATUR (Brelaz [1]) replaces the fixed vertex order with a dynamic selection rule. At every step, the uncolored vertex with the highest saturation degree — the number of distinct colors present among its already-colored neighbors — is colored next; ties are broken by selecting the vertex of highest degree in G. This prioritizes vertices that are most constrained at the current stage of coloring, typically reducing the total number of colors used relative to a static ordering."),
    pseudocodeBlock([
      "Algorithm 2: DSATUR Coloring",
      "Input: Graph G = (V, E)",
      "sat[v] <- {} for all v ;  deg[v] <- degree(v)",
      "while uncolored vertices remain:",
      "    v <- argmax_v ( |sat[v]|, deg[v] )   // saturation, tie->degree",
      "    used <- { color[u] : u in N(v), u colored }",
      "    color[v] <- min{ c >= 0 : c not in used }",
      "    for each neighbor u of v (uncolored):",
      "        sat[u] <- sat[u] U { color[v] }",
      "return color",
    ]),
  ],
};

const figure1Section = {
  properties: onecol,
  children: [
    imageFullWidth("graph_coloring_level2.png", 2235, 1036, TEXT_W),
    caption("Fig. 1", "Conflict graph of Level-2 instance (18 sessions, 81 conflicts) colored by Greedy Coloring (left, 8 slots) versus DSATUR (right, 7 slots). Node color denotes assigned time slot."),
  ],
};

const bodySection2 = {
  properties: twocol,
  children: [
    heading1("V", "Experimental Setup"),
    bodyPara("All experiments were implemented in Python 3 using NetworkX for graph construction and coloring, pandas for tabulation, and Matplotlib for visualization. For each of the five difficulty levels, we (1) build the conflict graph, (2) run Greedy Coloring, (3) run DSATUR, (4) map each resulting coloring onto the 5x10 weekly slot grid, and (5) validate the resulting schedule by independently re-checking that no two sessions sharing a resource were assigned the same day/slot. Execution time was measured with a monotonic performance counter around each coloring routine, averaged over the single run reported (both algorithms complete in well under one millisecond for all tested sizes, so run-to-run variance is negligible relative to the reported differences)."),
    heading1("VI", "Results and Discussion"),
    bodyPara("Table I reports, for each level, the conflict-graph size (sessions/nodes and conflicts/edges), graph density, the number of time slots (colors) used by each algorithm, and the percentage reduction achieved by DSATUR relative to Greedy Coloring. Fig. 1 visualizes the colored conflict graph for the Level-2 instance under both algorithms, and Fig. 2 summarizes the slot count and runtime of both algorithms across all five levels. Fig. 3 shows an example resulting weekly schedule, rendered as a day-by-slot heatmap for the Level-3 instance under DSATUR."),
  ],
};

const tableAndFiguresSection = {
  properties: onecol,
  children: [
    caption("TABLE I", "Evaluation of Greedy Coloring vs. DSATUR Coloring Across Five Difficulty Levels"),
    evalTable(),
    imageFullWidth("perbandingan_algoritma.png", 2080, 815, TEXT_W),
    caption("Fig. 2", "Number of time slots used (left) and execution time (right) for Greedy Coloring vs. DSATUR Coloring across Levels 1-5."),
    imageFullWidth("heatmap_jadwal_level3_dsatur.png", 1261, 1032, TEXT_W * 0.62),
    caption("Fig. 3", "Example weekly schedule (Level 3, DSATUR) rendered as a day x slot occupancy heatmap; labels denote the assigned course per slot."),
  ],
};

const bodySection3 = {
  properties: twocol,
  children: [
    bodyPara("Across all five levels, DSATUR consistently uses fewer time slots than sequential Greedy Coloring, with reductions ranging from 11.1% (Level 3) to 20.0% (Level 4). The absolute gap widens with problem size: at Level 1, DSATUR saves a single slot (5 vs. 6); at Level 5, it saves two slots (11 vs. 13) on a much denser graph (423 conflicts, density 0.447). This is consistent with DSATUR's design rationale — by always coloring the currently most-constrained vertex first, it avoids the situations in which a static ordering is forced to \"waste\" a new color late in the process on a vertex whose neighbors happen to already occupy every low-numbered color."),
    bodyPara("Both algorithms remained comfortably feasible with respect to the 50-slot weekly capacity at every tested level, and independent post-hoc validation found zero resource-sharing violations in every generated schedule, confirming that both colorings are proper with respect to the conflict graph. The execution-time cost of DSATUR's more informed vertex selection is visible in Fig. 2 (right panel): DSATUR's runtime grows from roughly 0.04ms at Level 1 to about 0.52ms at Level 5, versus roughly 0.02ms to 0.10ms for Greedy Coloring — driven by the repeated argmax scan over uncolored vertices at each step, an O(n) operation performed up to n times, giving O(n^2) versus Greedy Coloring's O(n) vertex processing (excluding the shared O(n^2) graph-construction cost). Even so, both algorithms complete in sub-millisecond time at all tested sizes, so this overhead is immaterial for practical scheduling use and is vastly outweighed by the benefit of a more compact schedule."),
    bodyPara("An additional observation from Fig. 1 is that the colors (time slots) DSATUR assigns to densely connected, high-degree sessions tend to be established earlier and more consistently reused across the graph, whereas Greedy Coloring's fixed processing order occasionally colors a peripheral, low-degree vertex before a highly constrained one, forcing a later high-degree vertex into a new color that DSATUR would have avoided."),

    heading1("VII", "Conclusion and Future Work"),
    bodyPara("We presented a graph-coloring formulation of laboratory practicum scheduling that jointly accounts for lecturer, assistant, room, and equipment constraints, together with a synthetic data generator spanning five difficulty levels. Comparing sequential Greedy Coloring against DSATUR across all five levels shows that DSATUR produces a feasible, conflict-free schedule using 11-20% fewer time slots than the naive greedy baseline, at a modest and practically negligible increase in sub-millisecond runtime. These results support the use of DSATUR, rather than a naive sequential greedy pass, as the default coloring strategy in automated laboratory scheduling tools."),
    bodyPara("Future work includes: (i) incorporating multi-slot session durations and day/time preference constraints as additional soft or hard constraints; (ii) comparing against further heuristics such as Recursive Largest First (RLF) and metaheuristic approaches (e.g., simulated annealing, tabu search); (iii) evaluating on real institutional scheduling data rather than synthetic instances; and (iv) extending the model to jointly optimize secondary objectives such as balancing daily session load or minimizing gaps in lecturer/assistant schedules."),

    new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [new TextRun({ text: "ACKNOWLEDGMENT", bold: true, size: 20, font: BODY_FONT })],
    }),
    bodyPara("The author thanks the Program Studi Teknik Informatika, Fakultas Teknik, Universitas Mataram, for supporting this work."),

    new Paragraph({
      spacing: { before: 160, after: 80 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "REFERENCES", bold: true, size: 20, font: BODY_FONT })],
    }),
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "[1] D. Brelaz, \"New methods to color the vertices of a graph,\" Communications of the ACM, vol. 22, no. 4, pp. 251-256, 1979.", size: 18, font: BODY_FONT })] }),
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "[2] D. J. A. Welsh and M. B. Powell, \"An upper bound for the chromatic number of a graph and its application to timetabling problems,\" The Computer Journal, vol. 10, no. 1, pp. 85-86, 1967.", size: 18, font: BODY_FONT })] }),
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "[3] M. R. Garey and D. S. Johnson, Computers and Intractability: A Guide to the Theory of NP-Completeness. New York: W.H. Freeman, 1979.", size: 18, font: BODY_FONT })] }),
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "[4] D. de Werra, \"An introduction to timetabling,\" European Journal of Operational Research, vol. 19, no. 2, pp. 151-162, 1985.", size: 18, font: BODY_FONT })] }),
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "[5] A. Hagberg, D. Schult, and P. Swart, \"Exploring network structure, dynamics, and function using NetworkX,\" in Proc. 7th Python in Science Conf. (SciPy 2008), Pasadena, CA, 2008, pp. 11-15.", size: 18, font: BODY_FONT })] }),
  ],
};

const doc = new Document({
  creator: "Wirarama Wedashwara Wyrawan",
  title: "A Graph-Coloring Approach to Laboratory Practicum Scheduling",
  sections: [titleSection, bodySection1, figure1Section, bodySection2, tableAndFiguresSection, bodySection3],
  styles: {
    default: { document: { run: { font: BODY_FONT, size: 20 } } },
  },
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("Paper_Lab_Scheduling_GraphColoring.docx", buf);
  console.log("Written Paper_Lab_Scheduling_GraphColoring.docx");
});
