# Technical Debt Register – [Product Name] v[MVP]
**Date:** [YYYY-MM-DD] | **Author:** [Name] | **Status:** [Active/Under Review/Closed]
**Current coverage:** [XX.XX%] functions / [XX.XX%] lines
<!-- Delete all HTML comments once the placeholders are filled. -->

---

<!-- Count the items in each priority band and those closed this cycle. -->
## 1. Executive Summary
| Metric | Value |
|--------|-------|
| Total items | [N] |
| Critical (P0) | [N] |
| High (P1) | [N] |
| Medium (P2) | [N] |
| Low (P3) | [N] |
| Items closed this cycle | [N] |

---

<!-- Add one subsection per file with low coverage; fill each from the coverage report. -->
## 2. Coverage Debt (Production Code)

<!-- Name the file, paste its coverage numbers and explain the gap. -->
### 2.1 [File/class] — [XX.XX%] functions / [XX.XX%] lines
| Field | Detail |
|-------|--------|
| **Uncovered lines** | [list of lines or ranges] |
| **What's there** | [brief description of uncovered code] |
| **Why it's low** | [reason: coverage artifact, unreachable path, etc.] |
| **Risk** | [None / Low / Medium / High] |
| **Recommendation** | [suggested action] |

<!-- Repeat the table for the next low-coverage file. -->
### 2.2 [File/class] — [XX.XX%] functions / [XX.XX%] lines
| Field | Detail |
|-------|--------|
| **Uncovered lines** | [list of lines or ranges] |
| **What's there** | [description] |
| **Why it's low** | [reason] |
| **Risk** | [None / Low / Medium / High] |
| **Recommendation** | [suggested action] |

---

<!-- One subsection per structural problem; state why it exists and the risk. -->
## 3. Architectural Debt

<!-- Describe the problem, its origin and the refactor that would retire it. -->
### 3.1 [Architectural problem]
| Field | Detail |
|-------|--------|
| **Problem** | [description of the architectural problem] |
| **Why it's here** | [historical or design reason] |
| **Risk** | [None / Low / Medium / High] |
| **Recommendation** | [suggested action, e.g., refactor in v1.1.0] |

<!-- Repeat the table for the next architectural problem. -->
### 3.2 [Architectural problem]
| Field | Detail |
|-------|--------|
| **Problem** | [description] |
| **Why it's here** | [reason] |
| **Risk** | [None / Low / Medium / High] |
| **Recommendation** | [suggested action] |

---

<!-- One subsection per outdated or risky dependency. -->
## 4. Dependency Debt

<!-- Compare the installed version with the latest and record breaking changes. -->
### 4.1 [Dependency]
| Field | Detail |
|-------|--------|
| **Current version** | [installed version] |
| **Latest version** | [most recent version] |
| **Impact** | [what changes, breaking changes] |
| **Risk** | [None / Low / Medium / High] |
| **Recommendation** | [when and how to update] |

---

<!-- One subsection per weakness in the testing setup. -->
## 5. Test Infrastructure Debt

<!-- State what the gap loses and how to close it. -->
### 5.1 [Testing problem]
| Field | Detail |
|-------|--------|
| **Problem** | [description] |
| **Impact** | [what is lost: coverage, regressions, etc.] |
| **Risk** | [None / Low / Medium / High] |
| **Recommendation** | [suggested action] |

---

<!-- One subsection per process gap that slows or weakens delivery. -->
## 6. Process Debt

<!-- Record the mitigation in place today and the improvement to make. -->
### 6.1 [Process problem]
| Field | Detail |
|-------|--------|
| **Problem** | [description] |
| **Impact** | [what is lost] |
| **Mitigation** | [how it's currently handled] |
| **Recommendation** | [suggested action] |

---

<!-- Move an item here only after its resolution is shipped. -->
## 7. Closed Items (History)
| ID | Description | Closed in | Resolution |
|----|-------------|-----------|------------|
| [TD-001] | [description] | [version/date] | [how it was resolved] |

---

<!-- Assign every planned item a priority, estimate and owner. -->
## 8. Reduction Plan (Next Cycle)
| ID | Priority | Estimated Effort | Impact | Assigned to |
|----|----------|------------------|--------|-------------|
| [TD-001] | [P0/P1/P2/P3] | [Xh/days] | [high/medium/low] | [name] |

---

*Last updated: [YYYY-MM-DD]*
