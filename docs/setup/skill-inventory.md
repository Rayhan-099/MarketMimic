# MarketMimic Skill Inventory

**Date:** 17 October 2026  
**Auditor:** Developer-Environment Engineer & Antigravity Agent  
**Customization Root:** `/mnt/d/Vyuk Projects/stock/.agents/skills/`  
**Lockfile:** `/mnt/d/Vyuk Projects/stock/skills-lock.json`  

---

## 1. Overview and Selection Rationale

To prepare MarketMimic for disciplined implementation without bloating the workspace with redundant packages, candidate skills across six architectural categories were audited against the official Antigravity customization specification, security guidelines, and the ₹0 budget personal Android simulator PRD.

The capabilities are satisfied by:
1. **Antigravity Built-in & Global Superpowers:** Structured development, planning, TDD, code review, systematic debugging, and verification (already globally active in `~/.gemini/config/plugins/superpowers/`).
2. **Project-Local Visual Design & Taste:** `high-end-visual-design` and `stitch-design-taste` (from `Leonxlnx/taste-skill`) to prevent generic AI frontend tells, enforce deliberate typography, and establish calibrated token foundations.
3. **Project-Local Interface Critique:** `impeccable` (from `pbakaus/impeccable`) for rigorous mobile layout, accessibility, and UI polish.
4. **Project-Local Mobile Engineering:** Curated Expo core skills (`expo-overview`, `expo-design-system`, `expo-router`, `expo-data-fetching`, `expo-examples`) from the official `expo/skills` repository.
5. **Project-Local Investigation Runbook:** `reverse-engineer-anything` (from `morluto/rea`) for structured application observation and evidence-backed tracing.

---

## 2. Active Skill Inventory

| Skill | Source Repository | Version / Hash Pin | Scope | Intended Use | Verification Method | Status |
|---|---|---|---|---|---|---|
| **superpowers** (14 skills: `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion`, etc.) | `obra/superpowers` (via `gemini-cli`) | `6.3.0` | Global (`~/.gemini/config/plugins/superpowers`) | TDD, planning, incremental development, code review, deterministic financial testing | Tested via Antigravity plugin manifest & runtime discovery | **Active** (Global) |
| **impeccable** | `pbakaus/impeccable` | Hash `2b16bd2...` | Project-Local (`.agents/skills/impeccable`) | Design critique, UX review, mobile typography, accessibility, token consistency | Verified via `skills-lock.json`, `SKILL.md` frontmatter, `skills list -a antigravity` | **Active** (Local) |
| **high-end-visual-design** | `Leonxlnx/taste-skill` | Hash `7db385e...` | Project-Local (`.agents/skills/high-end-visual-design`) | Eliminating generic AI visual patterns; enforcing intentional typography, layout, spacing, and mobile aesthetics | Verified via `skills-lock.json`, `SKILL.md` frontmatter, `skills list -a antigravity` | **Active** (Local) |
| **stitch-design-taste** | `Leonxlnx/taste-skill` | Hash `13322f3...` | Project-Local (`.agents/skills/stitch-design-taste`) | Generating structured `DESIGN.md` tokens, color palettes, and motion guidelines for Indian financial UI | Verified via `skills-lock.json`, `SKILL.md` frontmatter, `skills list -a antigravity` | **Active** (Local) |
| **expo-overview** | `expo/skills` | Hash `ae10834...` | Project-Local (`.agents/skills/expo-overview`) | Router and rule orchestrator for all Expo SDK and React Native architecture decisions | Verified via `skills-lock.json`, `SKILL.md` frontmatter, `skills list -a antigravity` | **Active** (Local) |
| **expo-design-system** | `expo/skills` | Hash `06ee277...` | Project-Local (`.agents/skills/expo-design-system`) | Mobile theme tokens, component conventions, dark/light modes, avoiding mobile UI tells | Verified via `skills-lock.json`, `SKILL.md` frontmatter, `skills list -a antigravity` | **Active** (Local) |
| **expo-router** | `expo/skills` | Hash `512978d...` | Project-Local (`.agents/skills/expo-router`) | File-based routing, stacks, bottom tabs (Watchlist, Orders, Portfolio), modal sheets | Verified via `skills-lock.json`, `SKILL.md` frontmatter, `skills list -a antigravity` | **Active** (Local) |
| **expo-data-fetching** | `expo/skills` | Hash `e3d3152...` | Project-Local (`.agents/skills/expo-data-fetching`) | Offline caching, optimistic state updates, loading/empty/error states for market data | Verified via `skills-lock.json`, `SKILL.md` frontmatter, `skills list -a antigravity` | **Active** (Local) |
| **expo-examples** | `expo/skills` | Hash `f6a8135...` | Project-Local (`.agents/skills/expo-examples`) | Canonical patterns for `expo-sqlite`, SQLite migrations, and local persistence | Verified via `skills-lock.json`, `SKILL.md` frontmatter, `skills list -a antigravity` | **Active** (Local) |
| **reverse-engineer-anything** | `morluto/rea` | Hash `fad7ec0...` | Project-Local (`.agents/skills/reverse-engineer-anything`) | Investigation procedures, runbooks, and evidence collection for public UI behaviors | Verified via `skills-lock.json`, `SKILL.md` frontmatter, `skills list -a antigravity` | **Active** (Local) |

---

## 3. Evaluated, Deferred, or Rejected Skills

| Candidate Skill / Package | Source | Decision | Technical Rationale |
|---|---|---|---|
| `design-taste-frontend` (v2) | `Leonxlnx/taste-skill` | **Deferred / Not Applicable** | Description explicitly specifies "Not for dashboards or app screens" (focused on marketing sites/landing pages). Replaced with `high-end-visual-design` and `expo-design-system` which specifically target mobile applications and dashboards. |
| `imagegen-frontend-mobile` | `Leonxlnx/taste-skill` | **Deferred** | Generates phone mockup images via image models; does not provide code, logic, or deterministic test procedures. |
| `eas-build` / `eas-app-stores` | `expo/skills` | **Deferred to Phase G** | Pertains to cloud build infrastructure and store releases. PRD requires a zero-operating-cost local build workflow first. Local APK generation through Expo Prebuild + Gradle is preferred. |
| `expo-dom` | `expo/skills` | **Rejected for MVP** | Runs web code inside webviews. MarketMimic is an installable, high-performance native Android application with local SQLite and Skia/SVG charts; webviews introduce unnecessary memory overhead and latency. |
| Global REA MCP Server Registration | `npx rea-agents setup` | **Deferred (Reported)** | REA's full setup attempts to write to global configuration (`~/.gemini/config/mcp_config.json` or `~/.gemini/settings.json`). In compliance with prompt restrictions, global modification is deferred and documented. CLI invocation (`npx -y rea-agents@6.5.0 <command>`) remains completely available without global side effects. |
