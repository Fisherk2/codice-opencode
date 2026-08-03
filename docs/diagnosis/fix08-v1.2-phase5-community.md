# Diagnosis: FEV-15 — Community Standards (Issue #55)

**Issue:** [#55](https://github.com/fisherk2/codice-opencode/issues/55) — Añadir codigo de conducta
**Date:** 2026-07-27
**Severity:** low (community standards and project professionalism)
**Status:** pending

---

## Summary

Create a `CODE_OF_CONDUCT.md` file for both the Códice project and the workspace template. The project needs a code of conduct to establish community standards and provide a safe, inclusive environment for contributors. The template needs a placeholder code of conduct that users can customize for their own projects.

## Symptoms

- No `CODE_OF_CONDUCT.md` in the project root
- No `CODE_OF_CONDUCT.md` in the workspace template
- Contributors have no reference for expected behavior
- No clear process for reporting violations
- Project appears less professional compared to other open-source projects

## Root Cause

The project focused on functional features and technical documentation in early phases. Community standards documentation (CODE_OF_CONDUCT, CONTRIBUTING guidelines) was deferred as lower priority. Now that the project is mature (v1.1.3, 596 tests, 10+ FEV phases completed), community standards should be established.

> Why wasn't this done earlier? → _The project is primarily a single-contributor project (Fisherk2). Community standards become more critical as the project attracts external contributors. Now that the workspace is being adopted by other developers, a code of conduct is necessary._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | Contributors (project CoC), workspace users (template CoC) |
| Functionality | No change (documentation only) |
| Data integrity | Safe (new files, no modifications) |
| Risk | None (additive, no breaking changes) |

## Environment

- **Version:** v1.1.3
- **Contributors:** Primarily single-contributor (Fisherk2), with AI agents as co-authors
- **Platform:** GitHub, npm
- **Template categories:** obligatorio, estandar, opcional

---

## Proposed Solution — FEV-15

### Scope

1. Create `CODE_OF_CONDUCT.md` for the Códice project (root directory)
2. Create `CODE_OF_CONDUCT.md` placeholder for the workspace template (`template/estandar/`)
3. Research and adopt a standardized code of conduct (Contributor Covenant recommended)

### Tasks

| ID | Description | File(s) | Effort |
|----|-------------|---------|--------|
| FEV15-T1 | Research code of conduct options (Contributor Covenant, Django CoC, etc.) | Research | 30min |
| FEV15-T2 | Create `CODE_OF_CONDUCT.md` for the project | `CODE_OF_CONDUCT.md` (new) | 30min |
| FEV15-T3 | Create `CODE_OF_CONDUCT.md` placeholder for the template | `template/estandar/CODE_OF_CONDUCT.md` (new) | 30min |
| FEV15-T4 | Add `CODE_OF_CONDUCT.md` to `FileRuleManifestData.ts` | `src/domain/entities/FileRuleManifestData.ts` | 15min |
| FEV15-T5 | Update CONTRIBUTING.md to reference the code of conduct | `CONTRIBUTING.md` | 15min |
| FEV15-T6 | Update Wiki to mention the code of conduct | `docs/wiki-source/Home.md`, `docs/wiki-source/Getting-Started.md` | 15min |

### Implementation Steps

1. **Research code of conduct options:**
   - **Contributor Covenant** (https://www.contributor-covenant.org/) — Most widely adopted, used by React, Rails, Node.js, etc.
   - **Django Code of Conduct** — Community-focused, detailed enforcement process
   - **Citizen Code of Conduct** — Detailed, covers online and offline interactions
   
   **Recommendation:** Use Contributor Covenant v2.1 (latest version). It's the industry standard, well-maintained, and familiar to most contributors.

2. **Create project `CODE_OF_CONDUCT.md`:**
   - Adapt Contributor Covenant v2.1 for Códice
   - Fill in project-specific contact information:
     - Contact: dev@fisherk2.com
     - GitHub: https://github.com/fisherk2/codice-opencode
   - Include sections: Pledge, Standards, Responsibilities, Scope, Enforcement, Attribution

3. **Create template `CODE_OF_CONDUCT.md`:**
   - Create a placeholder version in `template/estandar/CODE_OF_CONDUCT.md`
   - Use placeholders for project-specific information:
     - `[PROJECT_NAME]` — Users replace with their project name
     - `[CONTACT_EMAIL]` — Users replace with their contact email
     - `[PROJECT_URL]` — Users replace with their project URL
   - Add a note at the top: "This is a placeholder. Customize the bracketed placeholders for your project."

4. **Update `FileRuleManifestData.ts`:**
   - Add entry for `CODE_OF_CONDUCT.md` in the `estandar` category:
   ```typescript
   {
     path: "CODE_OF_CONDUCT.md",
     category: "standard",
     description: "Code of conduct for contributors (placeholder, customize for your project)",
   }
   ```

5. **Update CONTRIBUTING.md:**
   - Add a "Code of Conduct" section near the top:
   ```markdown
   ## Code of Conduct
   
   This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.
   ```

6. **Update Wiki:**
   - Mention the code of conduct in Home.md and Getting-Started.md
   - Emphasize that the template includes a customizable code of conduct

### Example: Project CODE_OF_CONDUCT.md

```markdown
# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, religion, or sexual identity
and orientation.

We pledge to act and interact in ways that contribute to an open, welcoming,
diverse, inclusive, and healthy community.

## Our Standards

Examples of behavior that contributes to a positive environment for our
community include:

* Demonstrating empathy and kindness toward other people
* Being respectful of differing opinions, viewpoints, and experiences
* Giving and gracefully accepting constructive feedback
* Accepting responsibility and apologizing to those affected by our mistakes,
  and learning from the experience
* Focusing on what is best not just for us as individuals, but for the
  overall community

Examples of unacceptable behavior include:

* The use of sexualized language or imagery, and sexual attention or
  advances of any kind
* Trolling, insulting or derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information, such as a physical or email
  address, without their explicit permission
* Other conduct which could reasonably be considered inappropriate in a
  professional setting

## Enforcement Responsibilities

Community leaders are responsible for clarifying and enforcing our standards of
acceptable behavior and will take appropriate and fair corrective action in
response to any behavior that they deem inappropriate, threatening, offensive,
or harmful.

Community leaders have the right and responsibility to remove, edit, or reject
comments, commits, code, wiki edits, issues, and other contributions that are
not aligned to this Code of Conduct, and will communicate reasons for moderation
decisions when appropriate.

## Scope

This Code of Conduct applies within all community spaces, and also applies when
an individual is officially representing the community in public spaces.
Examples of representing our community include using an official e-mail address,
posting via an official social media account, or acting as an appointed
representative at an online or offline event.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the community leaders responsible for enforcement at
dev@fisherk2.com.
All complaints will be reviewed and investigated promptly and fairly.

All community leaders are obligated to respect the privacy and security of the
reporter of any incident.

## Enforcement Guidelines

Community leaders will follow these Community Impact Guidelines in determining
the consequences for any action they deem in violation of this Code of Conduct:

### 1. Correction

**Community Impact**: Use of inappropriate language or other behavior deemed
unprofessional or unwelcome in the community.

**Consequence**: A private, written warning from community leaders, providing
clarity around the nature of the violation and an explanation of why the
behavior was inappropriate. A public apology may be requested.

### 2. Warning

**Community Impact**: A violation through a single incident or series
of actions.

**Consequence**: A warning with consequences for continued behavior. No
interaction with the people involved, including unsolicited interaction with
those enforcing the Code of Conduct, for a specified period of time. This
includes avoiding interactions in community spaces as well as external channels
like social media. Violating these terms may lead to a temporary or
permanent ban.

### 3. Temporary Ban

**Community Impact**: A serious violation of community standards, including
sustained inappropriate behavior.

**Consequence**: A temporary ban from any sort of interaction or public
communication with the community for a specified period of time. No public or
private interaction with the people involved, including unsolicited interaction
with those enforcing the Code of Conduct, is allowed during this period.
Violating these terms may lead to a permanent ban.

### 4. Permanent Ban

**Community Impact**: Demonstrating a pattern of violation of community
standards, including sustained inappropriate behavior, harassment of an
individual, or aggression toward or disparagement of classes of individuals.

**Consequence**: A permanent ban from any sort of public interaction within
the community.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage],
version 2.1, available at
[https://www.contributor-covenant.org/version/2/1/code_of_conduct.html][v2.1].

[homepage]: https://www.contributor-covenant.org
[v2.1]: https://www.contributor-covenant.org/version/2/1/code_of_conduct.html
```

### Example: Template CODE_OF_CONDUCT.md (Placeholder)

```markdown
# Code of Conduct

> **Note:** This is a placeholder code of conduct based on the Contributor Covenant. Customize the bracketed placeholders for your project.

## Our Pledge

We as members, contributors, and leaders pledge to make participation in **[PROJECT_NAME]** a harassment-free experience for everyone.

## Our Standards

[Same as project CODE_OF_CONDUCT.md]

## Enforcement

Report violations to **[CONTACT_EMAIL]**.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage],
version 2.1, available at
[https://www.contributor-covenant.org/version/2/1/code_of_conduct.html][v2.1].

[homepage]: https://www.contributor-covenant.org
[v2.1]: https://www.contributor-covenant.org/version/2/1/code_of_conduct.html
```

### DoD (Definition of Done)

- [ ] Project `CODE_OF_CONDUCT.md` created (root directory)
- [ ] Template `CODE_OF_CONDUCT.md` created (`template/estandar/`)
- [ ] Template version includes customizable placeholders
- [ ] `FileRuleManifestData.ts` updated with `CODE_OF_CONDUCT.md` entry
- [ ] CONTRIBUTING.md references the code of conduct
- [ ] Wiki updated (Home.md, Getting-Started.md)
- [ ] `bun test`: 0 fail, no regression
- [ ] `just check`: 0 errors

---

## References

- **Issue:** https://github.com/fisherk2/codice-opencode/issues/55
- **Contributor Covenant:** https://www.contributor-covenant.org/version/2/1/code_of_conduct.html
- **FileRuleManifestData.ts:** `src/domain/entities/FileRuleManifestData.ts`

---

_Diagnosed by Quetzalcoatl (Visionary Sage) — 2026-07-27_
