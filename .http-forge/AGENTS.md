# HTTP Forge — AI Agent Guide

This folder is already the **HTTP Forge workspace root**. Do not create a second nested `.http-forge/` directory inside it.

> **GitHub Copilot tip:** To keep this guide in every Copilot conversation, add one line to
> `.github/copilot-instructions.md`: `See .http-forge/AGENTS.md for the HTTP Forge AI guide.`

---

## Decision Tree — What to Use and When

HTTP Forge gives AI agents three ways to interact with a workspace.
**Choose the lowest-cost option that can complete the task:**

```
Task
 │
 ├─ Discover structure / read or edit collections, requests, environments, suites?
 │    └─ ✅ Read / write the JSON files directly  (zero token cost, always available)
 │
 ├─ Execute a request, collection, folder, or suite?
 │    ├─ Is @http-forge/cli installed?  (check: http-forge --version)
 │    │    ├─ YES → ✅ CLI  (lower token cost — no tool schema preloaded)
 │    │    │            http-forge run collection <name> --env <env> --json
 │    │    │            http-forge run suite <name> --json
 │    │    │            http-forge run request <name> --collection <ref> --json
 │    │    └─ NO  → ✅ MCP  run_collection / run_suite / run_request
 │    │
 │    └─ Need async execution or real-time polling?
 │         └─ ✅ MCP  run_collection --async, then get_run_status / get_run_summary
 │
 └─ Diagnose failures, suggest assertions, explain errors?
      └─ ✅ MCP  explain_failure / suggest_assertions / analyze-test-failure prompt

 └─ Design a NEW API from a plain-English intent (endpoints + DTOs + auth)?
      ├─ Is @http-forge/cli installed?  (check: http-forge --version)
      │    └─ YES → ✅ CLI  http-forge architect "I need a shopping cart"
      └─ NO  → ✅ MCP  design_api_from_intent  (then review; apply:true to approve)
```

---

## Why This Ordering?

| Method | Token cost | Always available | Can execute | Best for |
|--------|:----------:|:----------------:|:-----------:|---------|
| Direct file access | **Zero** | ✅ (if file system access) | ❌ | Discover, read, create, edit |
| CLI `http-forge run` | **Low** (no tool schema) | ❌ (must be installed + shell access) | ✅ | Execution when CLI is present |
| MCP tools | **Medium** (schemas preloaded) | ✅ (when extension runs) | ✅ | Execution fallback; AI analysis |

**Key rule:** Never use MCP or CLI to discover structure — just read the JSON files.
`list_collections`, `list_requests`, `get_request` are redundant when you have file access.

---

## Folder Structure

> Important: this directory is the workspace root. Use the paths below as-is; do not create another nested `.http-forge/` directory.

```
assets/
  collections/
    {collection-slug}/
      collection.json          ← collection metadata (id, name, variables, auth, order)
      scripts/
        pre-request.js         ← collection-level pre-request script
        post-response.js       ← collection-level post-response script
      {folder-slug}/
        folder.json            ← folder metadata
        scripts/
          pre-request.js       ← folder-level pre-request script
          post-response.js     ← folder-level post-response script
        {request-slug}/
          request.json         ← request (method, url, headers, auth, body, scripts…)
          body.json            ← JSON body (when bodyContentType is application/json)
          body.txt             ← raw text body
          body.graphql         ← GraphQL query
          doc.md               ← optional business docs for this request (fed to AI)
          scripts/
            pre-request.js     ← request-level pre-request script
            post-response.js   ← assertions live here (pm.test() calls)
  environments/
    _global.json               ← global variables + defaultHeaders (all envs)
    {env}.json                 ← per-environment variables
    {env}.local.json           ← local overrides — gitignored, never commit
  suites/
    {name}.suite.json          ← test suite with control-flow nodes
```

---

## Business Knowledge (`.http-forge/knowledge/`)

HTTP Forge feeds business context into every AI feature (assertion suggestions,
failure diagnosis, request generation, scenario generation, env-var suggestions,
collection enhancement, and the `analyze-test-failure` / `suggest-assertions` /
`review-collection` prompts). The AI uses it to write realistic tests and
accurate diagnoses.

Drop markdown files into `.http-forge/knowledge/` (any depth):

```
.http-forge/
  knowledge/
    api-overview.md          ← Confluence export: what the API does, auth model
    jira/API-123.md          ← Jira ticket summaries / ACs relevant to tests
    decisions/adr-007.md     ← Architecture decision records
    field-glossary.md        ← Meanings of domain fields the tests assert on
```

Every `*.md` file under `.http-forge/knowledge/` is loaded and included in AI
prompts, along with the workspace `README.md` and `AGENTS.md`. Prefer short,
dense notes — the knowledge is bounded to keep token cost predictable. There is
no need to paste Confluence/Jira content into collection files themselves.

Per-request business docs can also live next to a request as `doc.md`
(alongside `request.json`) — HTTP Forge loads it and passes it to AI features
automatically.

---

## JSON Schemas

Every file contains a `$schema` field — your editor and AI can validate files automatically.

| File | Schema URL |
|------|-----------|
| `collection.json` | `https://raw.githubusercontent.com/hsl1230/http-forge/main/resources/collection.schema.json` |
| `folder.json`     | `https://raw.githubusercontent.com/hsl1230/http-forge/main/resources/folder.schema.json` |
| `request.json`    | `https://raw.githubusercontent.com/hsl1230/http-forge/main/resources/request.schema.json` |
| `{env}.json`      | `https://raw.githubusercontent.com/hsl1230/http-forge/main/resources/environment.schema.json` |
| `_global.json`    | `https://raw.githubusercontent.com/hsl1230/http-forge/main/resources/global-environment.schema.json` |
| `*.suite.json`    | `https://raw.githubusercontent.com/hsl1230/http-forge/main/resources/suite.schema.json` |

---

## Authoring by Direct File Editing

### Create a new request
1. Create directory: `assets/collections/{collection-slug}/{optional-folder-slug}/{request-slug}/`
2. Write `request.json` (use the schema above for all valid fields)
3. Add the slug to `order` in the parent `collection.json` or `folder.json`
4. Optionally add `pre-request.js` and/or `post-response.js` for scripts/assertions

### Edit a request
Read `request.json`, modify fields, write it back.
Variables: `{{variableName}}`. Filters: `{{value | upper}}`, `{{date | date:'YYYY-MM-DD'}}`.

### Bulk update (e.g. change baseUrl across all requests)
Find-and-replace across the `assets/collections/` tree — no MCP needed.

### Add / update environment variables
Edit `assets/environments/{env}.json` directly.

### Create or edit a test suite
Write or edit `assets/suites/{name}.suite.json`.
Supports: `request`, `block`, `if/elseif/else`, `for`, `while`, `switch`, `script` nodes.

---

## Execution: CLI Commands (when installed)

```bash
# Check if CLI is available
http-forge --version

# Run a collection (outputs JSON to stdout)
http-forge run collection <name> --env <env> --json

# Run a specific folder within a collection
http-forge run folder <folder-path> --collection <name> --json

# Run a single request
http-forge run request <request-name> --collection <name> --json

# Run a test suite
http-forge run suite <name> --json

# Design a new API from an intent (persists a collection; add --apply to
# persist the suite + write flow/docs/OpenAPI byproducts)
http-forge architect "I need a shopping cart"
http-forge architect "a todo list" --apply --flow-out ./todo.flow.js --docs-out ./todo.md

# Pipe output to filter results (saves tokens — AI only sees what it needs)
http-forge run collection auth --json | jq '.failedRequests'
http-forge run suite checkout --json | jq '.summary'
```

Output always contains: `summary` (total/passed/failed) and `failedRequests` (when failures exist).
For collection/suite/folder runs, add `--include report` to generate an HTML report (`report.uri`) with full response details — useful for inspecting large response bodies without consuming extra tokens.

---

## Execution: MCP Tools (always available when extension runs)

Use MCP when:
- CLI is not installed or no shell access is available
- Async / long-running execution with real-time polling is needed
- AI analysis tools are needed (failure diagnosis, assertion suggestions)

```
run_request      → execute one request
run_folder       → execute a folder within a collection
run_collection   → execute an entire collection
run_suite        → execute a test suite
  └─ add async:true for background execution, then poll with get_run_status

get_run_summary  → summary + failed requests after a run completes
get_failed_requests → paginated failed request details
explain_failure  → AI-powered root cause analysis
suggest_assertions → generate pm.test() assertions for a request
```

> **Token tip:** Response bodies are truncated at 4 KB by default.
> Pass `include: ["fullBody"]` to get the complete body.
> For collection / suite / folder runs, pass `include: ["report"]` to generate an HTML report
> (`report.uri`) — open it in a browser to inspect full response details without consuming tokens.
> Single `run_request` calls do not generate a report unless `include: ["report"]` is also passed.
