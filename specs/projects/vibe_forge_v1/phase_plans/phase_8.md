---
status: complete
---

# Phase 8: CI

## Overview

Add GitHub Actions CI workflows so that typecheck, lint, unit/integration tests, and Playwright e2e tests run automatically on every push and pull request. This ensures code quality gates are enforced before merging.

## Steps

1. Create `.github/workflows/` directory.

2. Create `.github/workflows/ci.yml` -- fast-path workflow:
   - Trigger: push to main, pull_request.
   - Single job on `ubuntu-latest`, Node 22 (LTS).
   - Steps: checkout, setup Node with npm cache, `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`.

3. Create `.github/workflows/e2e.yml` -- Playwright workflow:
   - Trigger: push to main, pull_request.
   - Single job on `ubuntu-latest`, Node 22 (LTS).
   - Steps: checkout, setup Node with npm cache, `npm ci`, install Playwright Chromium with system deps, `npm run test:e2e -w packages/lib`.
   - Upload Playwright HTML report as artifact on failure.

4. Write a smoke test (`packages/lib/test/unit/ci_workflows.test.ts`) that asserts both workflow YAML files exist and parse as valid YAML.

5. Verify locally: run lint, typecheck, and all tests to confirm green.

Note: the implementation plan says "Verify on a test branch before merging." That is a manual step the user performs after this phase -- push a test branch, observe the workflows run in GitHub Actions, then merge.

## Tests

- `ci_workflows.test.ts: ci.yml exists and is valid YAML`: reads the file, parses it with a YAML parser, asserts the `on` and `jobs` keys exist.
- `ci_workflows.test.ts: e2e.yml exists and is valid YAML`: same for the e2e workflow.
- `ci_workflows.test.ts: ci.yml runs typecheck, lint, and test steps`: asserts the job's steps include the expected npm run commands.
- `ci_workflows.test.ts: e2e.yml installs Playwright and uploads report on failure`: asserts the expected steps are present.
