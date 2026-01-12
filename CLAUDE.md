# Instructions for Claude

## Before Starting Any Work

**READ THESE FILES FIRST:**
1. `docs/ARCHITECTURE.md` - The rules for how code should be structured
2. `docs/PROJECT_STATE.md` - What's currently built and what's next
3. `docs/DEVLOG.md` - History of all decisions and changes

## After Completing Work

**UPDATE THE DOCS:**
1. Add an entry to `docs/DEVLOG.md` with what you did and why
2. Update `docs/PROJECT_STATE.md` with new status

## Key Rules (Summary)

1. **Use workflows** - Never process events inline. Call `/lib/workflows/on-*.ts`
2. **Use engines** - Never duplicate calculations. Call `/lib/engines/*-engine.ts`
3. **Use config** - Never hardcode business rules. Read from `/lib/config/*.ts`

## Project Overview

MLM Back Office for insurance agents. See `docs/` for full details.
