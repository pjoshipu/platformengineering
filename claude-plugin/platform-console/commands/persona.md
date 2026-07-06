---
description: Set or switch the persona the Platform Console remembers, so /idp and /catalog-add don't re-ask. Persists to .claude/platform-console.local.md.
argument-hint: "[optional: a persona id, e.g. data-engineer]"
allowed-tools: Read, Write, AskUserQuestion
---

Set the **active IDP persona** the plugin remembers.

1. Valid ids (see the `pe-idp` skill): `ai-engineer`, `agentic-engineer`,
   `data-scientist`, `app-engineer`, `mlops`, `security`, `data-engineer`.
2. If `$ARGUMENTS` is a valid id, use it. Otherwise ask with AskUserQuestion
   (header "Persona"), showing each persona's focus.
3. Read `.claude/platform-console.local.md` if present, then write it with the
   chosen persona in YAML frontmatter:

   ```markdown
   ---
   persona: <chosen-id>
   ---
   Platform Console — remembered settings. Edit `persona` or run /persona to change.
   ```

4. Confirm: "Active persona is now **<name>**. /idp and /catalog-add will use it."

Only write `.claude/platform-console.local.md`. Do not touch any other file.
