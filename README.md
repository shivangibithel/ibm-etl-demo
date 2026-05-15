# ibm-etl-demo
### SIGMOD 2026 Demo · IBM India Pvt. Ltd.

---

## 📁 File Structure

```
ibm-etl-demo/
├── index.html            ← Main demo page
├── style.css             ← IBM Carbon-inspired dark theme
├── app.js                ← Full demo orchestration logic
├── pipeline_diagram.png  ← (You add this) Your ETL pipeline image
└── README.md             ← This file
```

---

## 🎬 Demo Workflow

| Step | Action |
|------|--------|
| 01 | Upload a DataStage pipeline `.json` file → pipeline diagram & metadata appear |
| 02 | Click **Validate Pipeline** → 3-second animated spinner |
| 03 | Four analysis steps unfold with live status (RUNNING → COMPLETE / WARNING) |
| 04 | **Validation Report** shown with pass/warn/fail counts and check table |
| 05 | Click **Proceed to Pre-Execution Checks** → 3-second spinner |
| 06 | Five infra/data checks unfold with JSON & list outputs |
| 07 | **Pre-Execution Report** shown → all clear banner |
| 08 | Click **Execute ETL Pipeline** → live log stream plays out |

---

## 🎨 Design Notes

- IBM Carbon Design System colour palette (IBM Blue `#0F62FE`, etc.)
- IBM Plex font family (Sans, Mono, Condensed) — loaded from Google Fonts
- Fully dark-mode, responsive layout
- No build tools required — pure HTML/CSS/JS, works offline after fonts load

---

*IBM India Pvt. Ltd. · Research Demo · SIGMOD 2026*