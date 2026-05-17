---
status: complete
---

# Phase 2: SPA-Cleanup Pass

## Overview

Remove dead code from `dev_frame.ts` that existed solely because the SPA reused module scope across navigations. In MPA mode, every page load gets fresh module state, so de-duplication guards, module-level mutable state tracking, and test-only reset helpers are no longer needed.

## Steps

1. **Remove `hudVisible` module state and `getCurrentHudHeight`**: Replace the module-level `let hudVisible` flag with a direct check against the DOM. `toggleDevHud` already manipulates the DOM (grid template rows), so we can derive visibility from that. However, the simpler approach: since each page load starts fresh with `hudVisible = true`, and there's no cross-navigation persistence concern, the variable is still useful within a single page session for `toggleDevHud` and `getCurrentHudHeight`. The issue is the `_resetHudVisible` test helper and the de-dup guards — those are the dead code.

2. **Remove `_resetHudVisible` export from `dev_frame.ts`**: This function exists only to reset module state between tests because in SPA mode the module persisted across navigations. In MPA, each test that imports the module gets fresh state anyway (vitest re-evaluates modules per test file by default, and `beforeEach` in the test already isolates state). However, since vitest shares module scope within a single test file, we still need some way to reset between describe blocks. We'll keep a minimal internal reset but remove the "SPA cleanup" framing — actually, looking more carefully, the tests DO need `_resetHudVisible` because vitest doesn't re-import modules between `it()` blocks within a file. The real dead code is:
   - The `resizeHandler` removal-before-re-register pattern (comment says "prevents listener leaks on repeated calls" — in MPA, `applyDevFrameSize` is only called once per page load)
   - The `hudKeyHandler` de-dup pattern (comment says "Remove any existing listener to avoid double-registration" — in MPA, `installHudKeyListener` is only called once per page load)
   - The comment in `dev_frame.ts` header mentioning "holds module-level mutable state ... that assumes a single browser instance" can be simplified

3. **Simplify `applyDevFrameSize`**: Remove the `resizeHandler` tracking variable and the removal-before-re-register guard. Just register the listener directly.

4. **Simplify `installHudKeyListener`**: Remove the `hudKeyHandler` module variable and the removal-before-re-register guard. The function registers a listener and returns a cleanup fn. No need to track the handler at module scope.

5. **Simplify `_resetHudVisible`**: Since we removed `resizeHandler` and `hudKeyHandler` module variables, `_resetHudVisible` simplifies to just resetting `hudVisible = true` and `updateScaleFn = null`. Actually — without `resizeHandler` and `hudKeyHandler` at module level, the reset function can't clean those up. But the tests that call `_resetHudVisible` also relied on it cleaning up listeners. We need to rethink: keep `_resetHudVisible` but simplify it to only reset what remains (hudVisible and updateScaleFn).

6. **Update `dev_frame.test.ts`**: Remove the test "removes previous resize listener when called again" since that scenario (calling `applyDevFrameSize` multiple times) no longer needs guarding. Remove tests that specifically test the de-dup behavior.

## Tests

- Existing tests for `computeScale`, `getCurrentHudHeight`, `toggleDevHud`, `installHudKeyListener` remain (they test real behavior)
- Remove: "removes previous resize listener when called again" test
- All other tests should pass as-is after adjustments to `_resetHudVisible` usage
