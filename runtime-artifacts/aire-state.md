# aire State Tracking

## Project Information
- **Project Type**: Brownfield
- **Start Date**: 2026-09-25T10:44:06Z
- **Current Stage**: PLANNING - User Stories

## Tracker
- Type: LOCAL
- Parent Epic: 4702 (Atlas document "Epic: Self-Serve Premium Upgrade", solution 951)
- Epic URL: —
- Project Key / Repo / Org: —

## Workspace State
- **Existing Code**: Yes
- **Programming Languages**: Python (src/backend), JavaScript/JSX - React + Vite (src/frontend)
- **Build System**: pip (requirements.txt), npm (package.json)
- **Project Structure**: Monolith repo with backend + frontend
- **Workspace Root**: C:\Users\shailendra.yadav\Desktop\projects\helix-aire-v1-demo2
- **Reverse Engineering Artifacts**: spec/plans/atlas-deep-dive.md (pulled from Atlas)
- **Reverse Engineering Needed**: No - SKIPPED (Atlas deep dive reused)

## Code Location Rules
- **Application Code**: src/ (NEVER in spec/)
- **Documentation**: spec/ only
- **Structure patterns**: See code-generation.md Critical Rules

## Helix MCP Binding
- **Server**: helix
- **Docs tool(s)**: mcp__helix__list_solution_documents_tool, mcp__helix__get_solution_document_tool — list/fetch Atlas solution documents (Epic brief, deep dive)
- **Graph/Search tool(s)**: mcp__helix__codebase_agent_query, mcp__helix__codebase_cypher_query, mcp__helix__document_chatbot_query — targeted inline answers only
- **Estate / workspace id**: solution_id 951 "Billing-Cycle-Helix-Workshop" (repo Billing-Cycle, branch main, last_ingested_commit 69f67f308492a85648aa25a9ff7d8d574031344a)
- **Resolved**: 2026-09-25T11:03:30Z (rebound from 874 to 951)

## Existing-System Context
- **Workspace type**: brownfield
- **Helix MCP**: connected
- **Source**: atlas (deep dive doc 4699 v31; Epic doc 4702 v1 + linked story doc 4703 v1)
- **Components in scope**: src/backend/main.py, src/frontend/src/pages/Billing.jsx, src/frontend/src/App.css, src/frontend/src/context/AuthContext.jsx (whole deep dive pulled — single small repo)
- **Atlas deep dive doc**: spec/plans/atlas-deep-dive.md
- **Epic brief**: spec/plans/epic-brief.md
- **Recorded**: 2026-09-25T11:04:23Z

## Branching
- Base Branch: main
- Epic Branch: epic/4702-self-serve-premium-upgrade
- Epic PR: (not raised — raised manually at cycle end via pr-generator)

## Context Project
- **Existing Knowledge**: No
- **Existing Knowledge Path(s)**: —
- **New References**: Yes
- **New Reference Path(s)**: C:\Users\shailendra.yadav\Desktop\projects\helix-aire-v1-demo2\spec\context-project\new-references\StreamPlex Billing.html

## Design References
| # | Path / Location | Type | Governs | Read? | Read At Stage |
|---|-----------------|------|---------|-------|---------------|
| 1 | C:\Users\shailendra.yadav\Desktop\projects\helix-aire-v1-demo2\spec\context-project\new-references\StreamPlex Billing.html | UI prototype (bundled single-page React/x-dc export; decoded template + component logic read in full) | Billing page presentation: header, Upgrade CTA placement and label, upgrade modal layout/labels/buttons, post-upgrade confirmation panel, visual styling (Manrope, #0d9b74 palette, card layout). NOT plan data values or pricing/proration rules - those are governed by the Atlas Epic/Story (epic-brief.md) | Yes | Requirements Analysis |

### Reconciliations (decisions taken AGAINST a reference — later stages MUST honour these)
| Ref # | Point in the reference | Decision | Decided At Stage | Recorded |
|-------|------------------------|----------|------------------|----------|
| 1 | Hardcoded 38 days remaining and uncapped charge ($25.33) | Proration governed by Epic AC-3 (days from renew_at, 30-day cycle, charge capped at $20.00, floored at $0.00); prototype value is demo data | Requirements Analysis | 2026-09-25T11:16:50Z |
| 1 | Premium downloads shown as 4 devices (same variable as streams), video quality "4K + HDR" | Premium feature data governed by Epic/Story: 4K Ultra HD, 4 streams, 6 downloads | Requirements Analysis | 2026-09-25T11:16:50Z |
| 1 | Plan perks card shows only 2 perks after upgrade | Premium perks per Epic/Story include Dolby Vision (3 perks) | Requirements Analysis | 2026-09-25T11:16:50Z |
| 1 | Configurable `premiumPrice` prop (20-100) | EXCLUDED - Premium price fixed at $40 per Epic; no configurable pricing | Requirements Analysis | 2026-09-25T11:16:50Z |

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes | Workflow start (mandatory) |
| Playwright Test Automation | Yes | Workflow start (mandatory) |
| Resiliency Baseline | No | Requirements Analysis |
| Property-Based Testing | No | Requirements Analysis |

## Stage Progress
- [x] Workspace Detection
- [x] Reverse Engineering - SKIPPED (Atlas deep dive found and reused)
- [x] Requirements Analysis (approved 2026-09-25T11:48:32Z)
