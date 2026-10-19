# REA Capability Audit & Architecture Assessment

**Date:** 17 October 2026  
**Auditor:** Application-Behaviour Investigator & Tooling Specialist  
**Target Package:** `rea-agents@6.5.0` (morluto/rea)  
**Deliverable Path:** `docs/research/rea-capability-audit.md`  

---

## 1. Executive Summary

This audit assesses the capabilities, host dependencies, execution modes, and security boundaries of **REA (Reverse Engineer Anything)** (`github.com/morluto/rea`), packaged on npm as `rea-agents@6.5.0`. 

In MarketMimic, REA is deployed solely as an investigation and evidence-collection toolkit to systematically observe, trace, and document user-facing interaction patterns from publicly observable financial applications (specifically Groww's web and Android presentations). **REA is strictly not an application template, scaffolding engine, or bypass mechanism.**

---

## 2. Tool Architecture and Inventory

REA exposes a dual-interface architecture:
1. **Model Context Protocol (MCP) Server:** Allows AI coding agents to query binary symbols, inspect unpacked client code, and trace data flow.
2. **Command Line Interface (CLI):** Provides 153 deterministic commands that can be invoked directly from terminal sessions or shell scripts without requiring persistent agent server hooks.

### Catalog Metrics (`rea doctor` baseline)
- **CLI Package Version:** `6.5.0`
- **MCP Tools:** 207 tools
- **MCP Prompts:** 6 prompts
- **CLI Commands:** 153 commands
- **Canonical Tools Digest (SHA-256):** `805433f17bb4f709558ff20c04f96fe561fca2938fd0f459b1f8cc0f6b438ded`

---

## 3. Analysis Targets & Real Capabilities

| Analysis Target | Supported Capabilities in REA | Required Host Engine / Dependency | Status on Current Workstation |
|---|---|---|---|
| **JavaScript / Web Bundles** | Static module extraction, AST parsing, source-map resolution, IPC routing, API contract identification | None (Node.js runtime built-in) | **Ready / Available** (Node v26.11.1) |
| **Network & Web Captures** | HAR analysis, payload inspection, endpoint schema inference, header auditing | None (Built-in HAR and DOM parsers) | **Ready / Available** |
| **Android APKs** | Manifest extraction, resource inspection (`AndroidManifest.xml`, layout structures, assets) | JADX MCP jar (`REA_JADX_MCP_JAR`) required for full DEX decompilation | **Partial** (Static asset inspection available; headless JADX jar not configured) |
| **Native Binaries (x86/ARM)** | Pseudocode, assembly, symbols, strings, cross-references | Ghidra, Hopper, or IDA Pro | **Not Configured** (Engines not installed; not required for frontend observation) |
| **Managed Assemblies (.NET)** | Metadata inspection, CIL disassembly | Built-in .NET PE/CLI parser | **Available** |

---

## 4. Agent & Client Integration Findings

During our dry-run audit (`npx -y rea-agents@6.5.0 setup --dry-run --json`):
1. **Antigravity Detection:** REA's setup engine natively detects Google Antigravity:
   ```json
   {
     "client": {
       "name": "antigravity",
       "displayName": "Antigravity",
       "configPath": "/home/rayhan/.gemini/config/mcp_config.json",
       "markerPath": "/home/rayhan/.gemini/config",
       "format": "json"
     },
     "detected": true,
     "configured": false,
     "status": "needs_configuration"
   }
   ```
2. **Global Configuration Scope:**
   - Full setup modifies machine-global configuration files:
     - `/home/rayhan/.gemini/config/mcp_config.json` (Antigravity MCP servers)
     - `/home/rayhan/.gemini/settings.json` (Gemini CLI)
     - `/home/rayhan/.config/Code/User/mcp.json` (VS Code)
   - **Boundary Enforcement:** To strictly adhere to Section 2 ("Never modify shell startup files, global Git configuration, unrelated IDE settings, or other projects. Do not install packages globally unless absolutely necessary and explicitly approved"), global setup was **not** applied.
3. **Approved Non-Invasive Execution Mode:**
   - REA commands can be run deterministically on demand via:
     ```bash
     npx -y rea-agents@6.5.0 <command> [args] --json
     ```
   - Workflow instructions and evidence runbooks are installed cleanly inside the project workspace at:
     ```text
     /mnt/d/Vyuk Projects/stock/.agents/skills/reverse-engineer-anything/SKILL.md
     ```
   - This provides the full power of REA's structured inquiry methodology while maintaining complete isolation from the global host environment.

---

## 5. Security, Legal & Ethical Boundaries

When using REA or observing third-party services:
1. **Zero Authentication Bypass:** Never attempt to bypass logins, authentication tokens, 2FA, anti-tamper mechanisms, or rate limits.
2. **Zero Private API Abuse:** MarketMimic is an offline, local-first paper-trading simulator. No automated trading bots or private endpoint scraping are permitted.
3. **Zero Asset Theft:** All visual assets, logos, brand names, color palettes, typography, and styling must be completely original. Groww brand assets must not be extracted or bundled.
4. **Independent Implementation:** All domain logic (order matching, financial arithmetic, ledger updates, margin rules) must be implemented independently from clean-room specifications derived from public behavioral observation.
