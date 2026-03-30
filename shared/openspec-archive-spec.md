# OpenSpec archive workflow (canonical)

**Canonical slug:** `openspec-archive-workflow`  
**File:** `shared/openspec-archive-spec.md`

This document is the **single source of truth** for the OpenSpec archive procedure. The Cursor skill `openspec-archive-change` and the command `/opsx-archive` both defer here—**edit this file only** when changing steps, guardrails, or output templates.

---

## Input

How the change name is supplied depends on entry point:

- **Cursor command (`/opsx-archive`)**: Optionally specify a change name after `/opsx-archive` (e.g. `/opsx-archive add-auth`). If omitted, infer from conversation context when the active change is unambiguous; if vague, ambiguous, or several changes could apply, you MUST use **AskUserQuestion** (after `openspec list --json`) so the user picks.
- **Skill (`openspec-archive-change`)**: Optionally specify a change name. If omitted, infer from conversation context when the active change is unambiguous; if vague, ambiguous, or several changes could apply, you MUST use **AskUserQuestion** (after `openspec list --json`) so the user picks.

---

## Steps

### 1. Resolve the change name

If the user did not pass a name: infer it when there is a single clear match from context (e.g. one active change explicitly in focus). If inference is weak, multiple active changes exist, or the target is unclear, run `openspec list --json`, show only active changes (not already archived), include each change’s schema when available, and use the **AskUserQuestion tool** so the user selects.

**IMPORTANT**: Do not guess or auto-select when more than one active change could apply or context is ambiguous—always confirm via **AskUserQuestion** in those cases.

### 2. Validate and resolve the change name (security gate)

Before any path/file operation:

- Run `openspec list --json` and build an allowlist of active change names.
- Accept `<name>` only if it exists in that allowlist.
- Enforce slug format: `^[a-z0-9][a-z0-9-]*$`
- Reject names containing `/`, `\`, `..`, spaces, or any character outside the slug pattern.
- On validation failure: stop with a clear error and do not continue.

### 3. Check artifact completion status

Run `openspec status --change "<name>" --json` to check artifact completion.

Parse the JSON to understand:

- `schemaName`: The workflow being used
- `artifacts`: List of artifacts with their status (`done` or other)

**If any artifacts are not `done`:**

- Display warning listing incomplete artifacts
- Use **AskUserQuestion tool** to confirm user wants to proceed
- Proceed if user confirms

### 4. Check task completion status

Resolve where tasks live and whether to run this check:

- Prefer `openspec status --change "<name>" --json` (and schema metadata under the change) for a tasks artifact path, `tasksFile`, or a flag such as `skipTaskCheck` when the schema does not use checkbox task lists.
- If the schema opts out (`skipTaskCheck` or equivalent), skip this step entirely.
- Otherwise discover the tasks source: use the resolved `tasksFile` if present; else try common locations (e.g. `openspec/changes/<name>/tasks.md`, `tasks.json`, or paths referenced in change metadata). Only run the incomplete-task logic when a concrete file is found and task checks are allowed.

For markdown checkbox lists, count `- [ ]` (incomplete) vs checked items (complete): treat `- [x]` and `- [X]` the same—match case-insensitively on the letter inside the brackets (e.g. `/^- \[[xX]\]/` or normalize the checkbox character to lowercase before comparison). For other formats, use the schema-appropriate markers only if applicable; if the file is not a checkbox list, skip counting and proceed without this warning unless the schema defines another rule.

**If incomplete tasks found (checkbox flow):**

- Display warning showing count of incomplete tasks
- Use **AskUserQuestion tool** to confirm user wants to proceed
- Proceed if user confirms

**If no eligible tasks file exists or task checks are skipped:** Proceed without task-related warning.

### 5. Assess delta spec sync state

Check for delta specs at `openspec/changes/<name>/specs/`. If none exist, proceed without sync prompt.

**If delta specs exist:**

- Compare each delta spec with its corresponding main spec at `openspec/specs/<capability>/spec.md`
- Determine what changes would be applied (adds, modifications, removals, renames)
- Show a combined summary before prompting

**Prompt options:**

- If changes needed: "Sync now (recommended)", "Archive without syncing", "Cancel"
- If already synced: "Archive now", "Sync anyway", "Cancel"

**Branch explicitly:**

- **"Archive now"** (already-synced path): perform **step 6** immediately—do **not** invoke the Task tool or any sync flow; treat as success for pre-archive sync.
- **"Sync now (recommended)"** or **"Sync anyway"**: use **Task** tool (`subagent_type`: `"general-purpose"`, prompt: `Use Skill tool to invoke openspec-sync-specs for change '<name>'. Delta spec analysis: <include the analyzed delta spec summary>`). After the Task finishes, branch on the outcome—do **not** assume success or advance to **step 6** on failure, timeout, or cancel:
  - **Sync succeeded**: proceed to **step 6**; treat pre-archive sync as successful for the summary (specs synced).
  - **Sync failed, timed out, or was cancelled**: stop the automatic path. Explain the error or outcome to the operator, then prompt with explicit options and outcomes:
    - **Retry sync**: run the same **Task** again (same `subagent_type` and prompt shape); after a successful retry, proceed to **step 6** with specs synced; if retry fails again, repeat this branch or choose another option below.
    - **Archive without syncing**: proceed to **step 6** without running sync; record in the summary that delta specs were **not** merged to main specs (same net effect as choosing **"Archive without syncing"** up front).
    - **Cancel** / **Abort**: end without archiving (no **step 6**).
- **"Archive without syncing"**: continue to **step 6** without sync.
- **"Cancel"**: stop immediately; do not archive.

### 6. Perform the archive

Use only the **same validated change name from step 2** when building paths—never substitute unvalidated or user-typed strings.

Create the archive directory if it doesn't exist:

```bash
mkdir -p openspec/changes/archive
```

Generate target name using current date: `YYYY-MM-DD-<change-name>`

**Before `mv`, verify containment (fail with a clear error if not):**

- Resolved source path must be exactly the directory `openspec/changes/<validated-name>` (a single path segment under `openspec/changes/`, no `..` or extra segments).
- Resolved destination must be under `openspec/changes/archive/` only (e.g. `openspec/changes/archive/YYYY-MM-DD-<validated-name>`).

**Check if target already exists:**

- If yes: Fail with error, suggest renaming existing archive or using different date
- If no: Move the change directory to archive

```bash
mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>
```

(`<name>` here means the validated slug from step 2, substituted as a single path component.)

### 7. Display summary

Show archive completion summary including:

- Change name
- Schema that was used
- Archive location
- Spec sync status (synced / sync skipped / no delta specs)
- Note about any warnings (incomplete artifacts/tasks)

---

## Output templates

### Output on success (default)

```markdown
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs (or "No delta specs" or "Sync skipped")

All artifacts complete. All tasks complete.
```

### Output on success (no delta specs)

```text
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** No delta specs

All artifacts complete. All tasks complete.
```

### Output on success (with warnings)

```text
## Archive Complete (with warnings)

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** Sync skipped (user chose to skip)

**Warnings:**
- Archived with 2 incomplete artifacts
- Archived with 3 incomplete tasks
- Delta spec sync was skipped (user chose to skip)

Review the archive if this was not intentional.
```

### Output on error (archive exists)

```text
## Archive Failed

**Change:** <change-name>
**Target:** openspec/changes/archive/YYYY-MM-DD-<name>/

Target archive directory already exists.

**Options:**
1. Rename the existing archive
2. Delete the existing archive if it's a duplicate
3. Wait until a different date to archive
```

---

## Guardrails

- When no change name is given, prompt via **AskUserQuestion** if inference is ambiguous or multiple active changes exist
- Validate change names against `openspec list --json` and slug pattern `^[a-z0-9][a-z0-9-]*$` before using in paths
- Reject path traversal/path injection inputs (`..`, `/`, `\`, etc.)
- Use artifact graph (openspec status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- If sync is requested, use the Skill tool to invoke `openspec-sync-specs` (agent-driven)
- If delta specs exist, always run the sync assessment and show the combined summary before prompting
- If user chooses "Cancel" at sync prompt, exit without archiving
