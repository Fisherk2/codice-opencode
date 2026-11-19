---
name: spreadsheet-analysis
description: "Use this skill any time a spreadsheet file is the primary input or output. This means any task where the user wants to: open, read, edit, or fix an existing .xlsx, .xlsm, .csv, or .tsv file (adding columns, computing formulas, formatting, charting, cleaning messy data); create a new spreadsheet from scratch or from other data sources; run pivot tables, statistical analysis, or charts over tabular data; or convert between tabular formats. Trigger especially when the user references a spreadsheet file by name or path — even casually (like 'the xlsx in my downloads') — and wants something done to it or produced from it. Merged from excel-analysis (analysis workflow) and xlsx (creation/editing with formulas-first discipline). Do NOT trigger when the primary deliverable is a Word document, HTML report, standalone Python script, database pipeline, or Google Sheets API integration, even if tabular data is involved."
license: Proprietary. LICENSE.txt has complete terms
---

# Spreadsheet Analysis

Create, edit, and analyze `.xlsx` / `.xlsm` / `.csv` / `.tsv` files. Analysis workflow (pandas) comes from `excel-analysis`; creation/editing discipline (openpyxl, formulas-first, recalculation, financial conventions, OOXML repair) comes from `xlsx`. Origin skills are retired; this file is the single entry point.

## When to Use / When NOT to Use

Use when the deliverable is a spreadsheet file: reading/analyzing data, pivot tables, charts from tabular data, cleaning messy sheets, merging workbooks, creating formatted workbooks with formulas, fixing formula errors, converting tabular formats.

Do NOT use when the deliverable is a docx report, HTML page, database pipeline, or Google Sheets API integration. For presentation posters built from spreadsheet results, hand verified numbers to `posters-generator` instead.

## Workflow

1. **Choose tool**: pandas for read/analyze/bulk ops; openpyxl for formulas, formatting, and editing that must preserve existing structure.
2. **Read first**: inspect shape, dtypes, head/tail, nulls before any write.
3. **Modify with formulas, not hardcodes** (every derived value is an Excel formula so the sheet recalculates).
4. **Recalculate** with `scripts/recalc.py` whenever formulas were written — mandatory.
5. **Validate** the OOXML package with `scripts/office/validate.py` when touching raw XML or repairing a file.
6. **Verify**: zero formula errors, correct references, file opens without repair prompts.

## Reading and Analysis (pandas)

```python
import pandas as pd

df = pd.read_excel("data.xlsx", sheet_name="Sheet1")
print(df.head(), df.describe(), df.dtypes)

# Pivot: values/index/columns/aggfunc must match the metric
pivot = pd.pivot_table(df, values="sales", index="region",
                       columns="product", aggfunc="sum", fill_value=0)

# Clean before aggregating
df = df.drop_duplicates()
df["name"] = df["name"].str.strip()
df["date"] = pd.to_datetime(df["date"])
df["amount"] = pd.to_numeric(df["amount"], errors="coerce")

# Merge workbooks
merged = pd.merge(pd.read_excel("sales.xlsx"),
                  pd.read_excel("customers.xlsx"),
                  on="customer_id", how="left")
```

Tips: `usecols`/`dtype`/`parse_dates` for speed and correct inference; `chunksize` for very large files; `matplotlib` for charts saved as PNG (embed, never invent numbers).

## Creating and Editing (openpyxl, Formulas-First)

```python
from openpyxl import Workbook, load_workbook

wb = Workbook(); ws = wb.active
ws["A1"] = "Revenue"
ws["B2"] = "=SUM(B5:B9)"        # derived values are ALWAYS formulas
ws["C5"] = "=(C4-C2)/C2"        # never Python-computed hardcodes
wb.save("output.xlsx")

wb = load_workbook("existing.xlsx")  # default data_only=False preserves formulas
ws = wb["SheetName"]
ws.insert_rows(2)
wb.save("modified.xlsx")
```

Rules:

- Assumptions live in their own cells and are referenced (`=B5*(1+$B$6)`, never `=B5*1.05`).
- Never open with `data_only=True` for editing — saving then destroys formulas permanently.
- Cell indices are 1-based; cross-sheet links use `Sheet1!A1`.
- Guard divisions against `#DIV/0!`; verify every reference against `#REF!`/`#VALUE!`/`#NAME?`.

## Output Standards

- Professional font throughout (e.g., Arial); bold headers; sane column widths.
- Zero formula errors in the delivered file.
- Existing template conventions always override house style — match format exactly when updating a template.
- Financial models: blue text = hardcode inputs, black = formulas, green = intra-workbook links, red = external links, yellow background = assumptions needing attention. Years as text (`"2024"`), currency `$#,##0` with units in headers, zeros as `-`, percentages `0.0%`, multiples `0.0x`, negatives in parentheses. Document every hardcode beside the cell: `Source: [System/Document], [Date], [Reference], [URL]`.

## Scripts

All paths relative to this skill root.

- `scripts/recalc.py` — recalculate all formulas via LibreOffice and scan for errors. Run after every formula write: `python scripts/recalc.py output.xlsx [timeout]`. Returns JSON (`status`, `total_errors`, `total_formulas`, `error_summary` with cell locations); fix reported `#REF!`/`#DIV/0!`/`#VALUE!`/`#NAME?` and re-run. Auto-configures its macro on first run, including sandboxed hosts (see `scripts/office/soffice.py`).
- `scripts/office/unpack.py` — unzip `.xlsx`/`.docx`/`.pptx` to a directory with pretty-printed XML; optional run-merging and redline simplification for docx.
- `scripts/office/pack.py` — repack an unpacked directory into a valid Office file, with auto-repair and XML condensing (`pack.py unpacked/ out.xlsx --original in.xlsx`).
- `scripts/office/validate.py` — validate package XML against XSD schemas plus tracked-change (redlining) checks: `python validate.py <dir|file> [--original f] [--auto-repair] [--author NAME]`. Auto-repair fixes over-limit `paraId`/`durableId` and missing `xml:space="preserve"`.
- `scripts/office/soffice.py` — `run_soffice()` / `get_soffice_env()` helpers for headless LibreOffice where AF_UNIX sockets are blocked (LD_PRELOAD shim).
- `scripts/office/helpers/merge_runs.py` — merge adjacent docx runs with identical formatting (used by `unpack.py`).
- `scripts/office/helpers/simplify_redlines.py` — simplify adjacent tracked changes from the same author (used by `unpack.py`).
- `scripts/office/validators/base.py` — shared validator base consumed by the format validators.
- `scripts/office/validators/docx.py` — `DOCXSchemaValidator` (XSD validation entry used by `pack.py`/`validate.py`).
- `scripts/office/validators/pptx.py` — `PPTXSchemaValidator` (same role for presentations; xlsx packages validate through the shared base + schema set).
- `scripts/office/validators/redlining.py` — `RedliningValidator` for tracked-change integrity.
- `scripts/office/schemas/` — bundled XSDs so validation works offline: `ISO-IEC29500-4_2016/` (incl. `sml.xsd` for spreadsheets, `wml.xsd`, `pml.xsd`, drawing/chart/vml/math/shared parts), `ecma/fouth-edition/` (OPC content types, core properties, digSig, relationships), `mce/mc.xsd` (markup compatibility), `microsoft/` (wml extensions).

## Verification

- [ ] Shape, dtypes, head/tail checked; nulls/duplicates handled before aggregation
- [ ] All computed cells are formulas, not hardcodes; assumptions in separate cells
- [ ] `scripts/recalc.py` run — `status: success`, zero errors
- [ ] Column mapping and row offsets verified (Excel is 1-indexed; far-right FY columns double-checked)
- [ ] Edge cases tested (zero, negative, very large values)
- [ ] `scripts/office/validate.py` clean when raw XML was touched
- [ ] File opens in Excel/LibreOffice without repair prompts

## Overview

Single entry point for spreadsheet work: pandas-based reading/analysis (pivots, cleaning, merges, charts-as-PNG) from `excel-analysis`, plus openpyxl formulas-first creation/editing (assumptions in cells, financial conventions, recalculation, OOXML repair) from `xlsx`.

## Unique Capabilities

- Formulas-first editing: every derived value is an Excel formula, assumptions in referenced cells, never Python hardcodes.
- Mandatory recalculation (`scripts/recalc.py`) plus OOXML validation/repair (`scripts/office/validate.py`, `pack.py`/`unpack.py`) so files open without repair prompts.
- Pandas analysis discipline (shape/dtypes/nulls first, clean before aggregate, exact pivot semantics) with offline XSD-bundled validation.

## References

No `references/` directory in this skill; workflow guidance lives in this file (Reading/Creating sections above).

## Additional Scripts Detail

- `scripts/office/helpers/__init__.py`, `scripts/office/validators/__init__.py` — package markers for the helpers/validators packages.

## Assets

No `assets/` directory in this skill; output is the delivered spreadsheet file itself.

## Boundaries

- Deliverable must be a spreadsheet (`.xlsx`/`.xlsm`/`.csv`/`.tsv`); docx reports, HTML pages, database pipelines, and Google Sheets API integrations are out of scope.
- Never invent numbers: charts/tables come from verified file data; hand verified numbers to `posters-generator` for posters.
- Never open with `data_only=True` for editing; never hardcode derived values; zero formula errors before delivery.
