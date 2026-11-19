# Technical Diagnoses

This directory documents technical diagnoses for issues identified in the project. Each diagnosis follows a structured format for consistency and traceability.
<!-- Delete all HTML comments once the placeholders are filled. -->

<!-- Explain what kinds of issues belong here and why a record is kept. -->
## Purpose

- Capture root cause analysis for bugs, incidents, and technical issues
- Provide a searchable record of past diagnoses for future reference
- Track recurring patterns that may need automation or systemic fixes

<!-- One row per diagnosis file; keep Date and Severity current. -->
## Index

| File | Issue | Date | Severity |
|------|-------|------|----------|

<!-- Follow these steps from issue detection through to the fix. -->
## Workflow

1. An issue is identified (user report, automated alert, code review)
2. Run `/diagnosis` to analyze and document the root cause
3. Run `/plan` to create an execution plan for the fix
4. Update the diagnosis if the fix reveals additional insights

<!-- Point new diagnoses at the template file described below. -->
## Template

Use `diagnosis-template.md` as a starting point for new diagnoses.

<!-- State the file-name pattern so new diagnoses are easy to find. -->
## Naming Convention

```
fix<NNN>-<short-description>.md
```

Where `<NNN>` is a sequential number (01, 02, ...) and `<short-description>` is a kebab-case summary of the issue.
