---
status: complete
---

# Phase 1: Repo Bootstrap & Tooling

## Overview

Stand up the monorepo skeleton so every subsequent phase starts with working lint, typecheck, and test infrastructure. No runtime code yet -- just the scaffolding that makes adding code frictionless.

## Tooling Decision: Biome over ESLint + Prettier

Biome is chosen over ESLint + Prettier for these reasons:
- Single tool for both linting and formatting (fewer deps, simpler config)
- Extremely fast (Rust-based)
- Sensible defaults out of the box, less config churn
- MIT-licensed, consistent with project license requirements
- Actively maintained with good TypeScript support

## Steps

1. **Root `package.json`** with npm workspaces pointing to `packages/lib`. Add root scripts: `typecheck`, `lint`, `lint:fix`, `test`. Set `"type": "module"`.

2. **`tsconfig.base.json`** at repo root. Strict mode, ES2022 target, module NodeNext, composite for workspace references.

3. **`packages/lib/package.json`** -- the `videowright` package skeleton. Fields: `name`, `version`, `type: "module"`, `bin: { videowright: "./dist/cli/index.js" }`, `exports` for `"."` and `"./cli"`, `files: ["dist", "skill"]`. Dev deps: `typescript`, `vitest`, `biome`, `vite`, `vite-plugin-dts`.

4. **`packages/lib/tsconfig.json`** extending `../../tsconfig.base.json` with `rootDir: "src"`, `outDir: "dist"`, includes `src/**/*`.

5. **`packages/lib/src/` skeleton** -- empty barrel files:
   - `src/index.ts` (public API barrel, empty)
   - `src/types.ts` (placeholder)
   - `src/player/` directory with empty `index.ts`
   - `src/segment/` directory with empty `index.ts`
   - `src/timeline/` directory with empty `index.ts`
   - `src/script/` directory with empty `index.ts`
   - `src/cli/` directory with empty `index.ts`

6. **Biome config** at repo root: `biome.json` with recommended rules, TypeScript support, format on save defaults matching the project style.

7. **Vitest config** at `packages/lib/vitest.config.ts`. Test root at `test/`, globals enabled. Empty test dirs: `packages/lib/test/unit/`, `packages/lib/test/integration/`.

8. **A trivial passing test** in `packages/lib/test/unit/smoke.test.ts` so `npm test` exits 0.

9. **`LICENSE`** file at repo root -- MIT license.

10. **Update `.gitignore`** -- add `node_modules/`, `dist/`, coverage dirs, OS files.

11. **Install dependencies** via `npm install` from root.

12. **Verify all checks pass**: `npm run typecheck`, `npm run lint`, `npm run test`.

## Notes

- `notes_for_readme.md` already exists at `specs/projects/vibe_forge_v1/notes_for_readme.md` from a prior commit. It is intentionally untouched in this phase. The implementation plan says to accumulate highlights there across phases; it does not call for a separate root-level copy.

## Tests

- `smoke.test.ts`: trivial assertion that Vitest runs (e.g., `expect(true).toBe(true)`). This validates the test infrastructure works. Real tests come in Phase 2+.
