# Technical Diagnoses

This directory documents technical diagnoses for issues identified in the project. Each diagnosis follows a structured format for consistency and traceability.

## Purpose

- Capture root cause analysis for bugs, incidents, and technical issues
- Provide a searchable record of past diagnoses for future reference
- Track recurring patterns that may need automation or systemic fixes

## Index

| File | Issue | Date | Severity |
|------|-------|------|----------|
<!-- Add entries here as diagnoses are created -->

## Workflow

1. An issue is identified (user report, automated alert, code review)
2. Run `/diagnosis` to analyze and document the root cause
3. Run `/plan` to create an execution plan for the fix
4. Update the diagnosis if the fix reveals additional insights

## Template

Use `diagnosis-template.md` as a starting point for new diagnoses.

## Naming Convention

```
fix<NNN>-<short-description>.md
```

Where `<NNN>` is a sequential number (01, 02, ...) and `<short-description>` is a kebab-case summary of the issue.
