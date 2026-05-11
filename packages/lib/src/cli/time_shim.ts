/**
 * JS time injection shim for deterministic rendering.
 *
 * This module exports the shim source code as a string. The render driver
 * injects it into the page via `page.addInitScript()` BEFORE navigation,
 * so it runs in every frame context before any user code.
 *
 * ## Two-mode design
 *
 * The shim operates in two modes:
 *
 * 1. **Passthrough mode** (default, during boot): Virtual clock advances at
 *    wall-clock rate. setTimeout, setInterval, requestAnimationFrame all
 *    delegate to the REAL browser implementations so that Vite HMR, module
 *    loading, library init (lottie-web, echarts, three.js), and the render
 *    entry boot() function can complete normally. `performance.now()` and
 *    `Date.now()` return real elapsed time since shim install. Real timer
 *    IDs and metadata are tracked so they can be converted to virtual
 *    timers at mode switch (preserving pending callbacks).
 *
 * 2. **Driver-controlled mode** (during render capture): The driver controls
 *    advancement via `__VW_ADVANCE_CLOCK__(deltaMs)`. Timers and RAF
 *    callbacks only fire when the driver advances time. WAAPI animations
 *    are paused and driven by explicit currentTime updates.
 *
 * The shim starts in passthrough mode. When the Node driver is ready to
 * start capture (after `__VW_RENDER_READY__` is set), it calls
 * `window.__VW_ENGAGE_VIRTUAL_TIME__()` to switch to driver-controlled
 * mode. From that point, real timers stop firing and the driver advances
 * virtual time explicitly.
 *
 * The shim overrides:
 * - Date (no-arg constructor), Date.now
 * - performance.now
 * - setTimeout, setInterval, clearTimeout, clearInterval
 * - requestAnimationFrame, cancelAnimationFrame
 * - Element.prototype.animate (for WAAPI determinism)
 *
 * It exposes:
 * - window.__VW_ADVANCE_CLOCK__(deltaMs) — advance the virtual clock, fire timers/RAFs, update WAAPI
 * - window.__VW_ENGAGE_VIRTUAL_TIME__() — switch from passthrough to driver-controlled mode
 */

export const TIME_SHIM_SOURCE = `
(function() {
  // Preserve real implementations
  var RealDate = Date;
  var realDateNow = Date.now.bind(Date);
  var realPerfNow = performance.now.bind(performance);
  var realSetTimeout = window.setTimeout.bind(window);
  var realClearTimeout = window.clearTimeout.bind(window);
  var realSetInterval = window.setInterval.bind(window);
  var realClearInterval = window.clearInterval.bind(window);
  var realRAF = window.requestAnimationFrame.bind(window);
  var realCAF = window.cancelAnimationFrame.bind(window);
  var realElementAnimate = Element.prototype.animate;

  // ----- Mode state -----
  // 'passthrough' = boot phase, real timers run normally
  // 'driver'      = render capture, driver controls time
  var mode = 'passthrough';

  // ----- Passthrough bookkeeping -----
  // Wall-clock reference captured at shim install time
  var shimInstallPerf = realPerfNow();
  var shimInstallDate = realDateNow();
  // Track real timer/RAF IDs with metadata so we can convert them at mode switch
  var realTimerMeta = new Map();      // real setTimeout ID -> { cb, args, fireAtRealMs }
  var realIntervalMeta = new Map();   // real setInterval ID -> { cb, args, intervalMs, nextFireRealMs }
  var realRafMeta = new Map();        // real RAF ID -> { cb }

  // ----- Driver-mode state -----
  var virtualMs = 0;
  var nextTimerId = 1;
  var timers = new Map();     // id -> { fireAt, cb, args, repeat? }
  var rafCallbacks = [];      // [{ id, cb }]
  var trackedAnimations = []; // [{ animation, startVirtualMs }]

  // ----- performance.now -----
  performance.now = function() {
    if (mode === 'passthrough') {
      return realPerfNow() - shimInstallPerf;
    }
    return virtualMs;
  };

  // ----- Date -----
  function VirtualDate() {
    if (arguments.length === 0) {
      if (mode === 'passthrough') {
        return new RealDate(realDateNow());
      }
      return new RealDate(shimInstallDate + virtualMs);
    }
    switch (arguments.length) {
      case 1: return new RealDate(arguments[0]);
      case 2: return new RealDate(arguments[0], arguments[1]);
      case 3: return new RealDate(arguments[0], arguments[1], arguments[2]);
      case 4: return new RealDate(arguments[0], arguments[1], arguments[2], arguments[3]);
      case 5: return new RealDate(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
      case 6: return new RealDate(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
      default: return new RealDate(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
    }
  }
  VirtualDate.now = function() {
    if (mode === 'passthrough') {
      return realDateNow();
    }
    return Math.floor(shimInstallDate + virtualMs);
  };
  VirtualDate.parse = RealDate.parse;
  VirtualDate.UTC = RealDate.UTC;
  VirtualDate.prototype = RealDate.prototype;
  window.Date = VirtualDate;

  // ----- setTimeout / clearTimeout -----
  window.setTimeout = function(cb, ms) {
    if (typeof cb !== 'function') return 0;
    var delay = (ms || 0);
    var args = Array.prototype.slice.call(arguments, 2);
    if (mode === 'passthrough') {
      var fireAtRealMs = realPerfNow() + delay;
      // Wrap the callback so that if the real timer fires before engagement,
      // its metadata is removed -- preventing a double-fire at engagement.
      var realId = realSetTimeout(function() { realTimerMeta.delete(realId); cb.apply(null, args); }, delay);
      realTimerMeta.set(realId, { cb: cb, args: args, fireAtRealMs: fireAtRealMs });
      return realId;
    }
    var id = nextTimerId++;
    timers.set(id, { fireAt: virtualMs + delay, cb: cb, args: args });
    return id;
  };
  window.clearTimeout = function(id) {
    if (mode === 'passthrough') {
      realTimerMeta.delete(id);
      realClearTimeout(id);
      return;
    }
    timers.delete(id);
  };

  // ----- setInterval / clearInterval -----
  window.setInterval = function(cb, ms) {
    if (typeof cb !== 'function') return 0;
    if (mode === 'passthrough') {
      var intervalMs = Math.max(ms || 0, 1);
      var args = Array.prototype.slice.call(arguments, 2);
      var meta = { cb: cb, args: args, intervalMs: intervalMs, nextFireRealMs: realPerfNow() + intervalMs };
      // Wrap the callback to update nextFireRealMs each time the real interval
      // fires, so that at engagement we compute an accurate remaining time
      // instead of using the stale initial registration time.
      var realId = realSetInterval(function() { meta.nextFireRealMs = realPerfNow() + intervalMs; cb.apply(null, args); }, intervalMs);
      realIntervalMeta.set(realId, meta);
      return realId;
    }
    var interval = Math.max(ms || 0, 1);
    var id = nextTimerId++;
    var args = Array.prototype.slice.call(arguments, 2);
    timers.set(id, { fireAt: virtualMs + interval, cb: cb, args: args, repeat: interval });
    return id;
  };
  window.clearInterval = function(id) {
    if (mode === 'passthrough') {
      realIntervalMeta.delete(id);
      realClearInterval(id);
      return;
    }
    timers.delete(id);
  };

  // ----- requestAnimationFrame / cancelAnimationFrame -----
  window.requestAnimationFrame = function(cb) {
    if (mode === 'passthrough') {
      // Wrap the callback so that if the real rAF fires before engagement,
      // its metadata is removed -- preventing a double-fire at engagement.
      var realId = realRAF(function(timestamp) { realRafMeta.delete(realId); cb(timestamp); });
      realRafMeta.set(realId, { cb: cb });
      return realId;
    }
    var id = nextTimerId++;
    rafCallbacks.push({ id: id, cb: cb });
    return id;
  };
  window.cancelAnimationFrame = function(id) {
    if (mode === 'passthrough') {
      realRafMeta.delete(id);
      realCAF(id);
      return;
    }
    for (var i = 0; i < rafCallbacks.length; i++) {
      if (rafCallbacks[i].id === id) {
        rafCallbacks.splice(i, 1);
        break;
      }
    }
  };

  // ----- WAAPI: Element.prototype.animate -----
  Element.prototype.animate = function(keyframes, options) {
    var anim = realElementAnimate.call(this, keyframes, options);
    if (mode === 'passthrough') {
      // Let the animation run normally during boot; it will be captured
      // at mode-switch time if still running.
      return anim;
    }
    // Driver mode: pause and drive via currentTime
    return trackAnimation(anim, options);
  };

  function trackAnimation(anim, options) {
    anim.pause();
    anim.currentTime = 0;
    var entry = { animation: anim, startVirtualMs: virtualMs };
    trackedAnimations.push(entry);
    var duration = 0;
    if (typeof options === 'number') {
      duration = options;
    } else if (options && typeof options.duration === 'number') {
      duration = options.duration;
    }
    var delay = 0;
    if (options && typeof options === 'object' && typeof options.delay === 'number') {
      delay = options.delay;
    }
    var totalDuration = delay + duration;
    entry.totalDuration = totalDuration;
    entry.resolved = false;
    var finishedPromise = new Promise(function(resolve) {
      entry.resolve = resolve;
    });
    Object.defineProperty(anim, 'finished', {
      get: function() { return finishedPromise; },
      configurable: true
    });
    return anim;
  }

  // ----- Mode switch: passthrough -> driver -----
  window.__VW_ENGAGE_VIRTUAL_TIME__ = function() {
    if (mode === 'driver') return; // already engaged

    // Set virtual time to current real elapsed so animations don't jump
    var nowReal = realPerfNow();
    virtualMs = nowReal - shimInstallPerf;

    // Convert pending real setTimeouts to virtual timers instead of discarding
    realTimerMeta.forEach(function(meta, realId) {
      realClearTimeout(realId);
      var remaining = Math.max(0, meta.fireAtRealMs - nowReal);
      var id = nextTimerId++;
      timers.set(id, { fireAt: virtualMs + remaining, cb: meta.cb, args: meta.args });
    });
    realTimerMeta.clear();

    // Convert pending real setIntervals to virtual intervals
    realIntervalMeta.forEach(function(meta, realId) {
      realClearInterval(realId);
      var remaining = Math.max(0, meta.nextFireRealMs - nowReal);
      var id = nextTimerId++;
      timers.set(id, { fireAt: virtualMs + remaining, cb: meta.cb, args: meta.args, repeat: meta.intervalMs });
    });
    realIntervalMeta.clear();

    // Convert pending real rAF callbacks into virtual RAF queue
    realRafMeta.forEach(function(meta, realId) {
      realCAF(realId);
      var id = nextTimerId++;
      rafCallbacks.push({ id: id, cb: meta.cb });
    });
    realRafMeta.clear();

    // Capture any WAAPI animations still running from boot and pause+track them
    try {
      var liveAnims = document.getAnimations();
      for (var i = 0; i < liveAnims.length; i++) {
        var a = liveAnims[i];
        if (a.playState === 'running' || a.playState === 'paused') {
          var ct = a.currentTime || 0;
          a.pause();
          a.currentTime = ct;
          var entry = {
            animation: a,
            startVirtualMs: virtualMs - ct,
            totalDuration: undefined,
            resolved: false,
            resolve: undefined
          };
          // Try to read duration from the animation effect
          try {
            var timing = a.effect && a.effect.getTiming ? a.effect.getTiming() : null;
            if (timing) {
              var dur = typeof timing.duration === 'number' ? timing.duration : 0;
              var del = typeof timing.delay === 'number' ? timing.delay : 0;
              entry.totalDuration = del + dur;
            }
          } catch(e) {}
          var finishedPromise = new Promise(function(resolve) {
            entry.resolve = resolve;
          });
          Object.defineProperty(a, 'finished', {
            get: function() { return finishedPromise; },
            configurable: true
          });
          trackedAnimations.push(entry);
        }
      }
    } catch(e) {
      // document.getAnimations may not be available in all contexts
    }

    mode = 'driver';
  };

  // ----- Clock advance driver -----
  window.__VW_ADVANCE_CLOCK__ = async function(deltaMs) {
    if (mode === 'passthrough') return; // no-op during boot

    var target = virtualMs + deltaMs;

    // Fire timers in chronological order up to target.
    // The function is async so that microtasks (e.g. Promise resolutions from
    // ctx.hold) drain between timer fires. This ensures awaiting code resumes
    // at virtualMs = fireAt (the timer's actual scheduled time) rather than at
    // the frame boundary (target), eliminating per-hold rounding drift.
    var safety = 10000;
    while (safety-- > 0) {
      var earliestId = null;
      var earliestTimer = null;
      timers.forEach(function(t, id) {
        if (t.fireAt <= target && (earliestTimer === null || t.fireAt < earliestTimer.fireAt)) {
          earliestId = id;
          earliestTimer = t;
        }
      });
      if (!earliestTimer) break;

      virtualMs = earliestTimer.fireAt;
      if (earliestTimer.repeat !== undefined) {
        timers.set(earliestId, {
          fireAt: virtualMs + earliestTimer.repeat,
          cb: earliestTimer.cb,
          args: earliestTimer.args,
          repeat: earliestTimer.repeat
        });
      } else {
        timers.delete(earliestId);
      }
      try { earliestTimer.cb.apply(null, earliestTimer.args || []); } catch(e) { console.error('[VW shim] timer error:', e); }

      // Drain microtasks so awaiting code (e.g. ctx.hold Promise resolution)
      // resumes at virtualMs = fireAt and registers its next timer relative to
      // fireAt, not target. Multiple awaits handle chained async continuations.
      for (var d = 0; d < 8; d++) await Promise.resolve();
    }

    // Final advance to target
    virtualMs = target;

    // Fire all queued RAF callbacks
    var queued = rafCallbacks.splice(0);
    for (var i = 0; i < queued.length; i++) {
      try { queued[i].cb(virtualMs); } catch(e) { console.error('[VW shim] RAF error:', e); }
    }

    // Update WAAPI animations
    for (var j = trackedAnimations.length - 1; j >= 0; j--) {
      var entry = trackedAnimations[j];
      var anim = entry.animation;
      // Skip cancelled animations
      if (anim.playState === 'idle') {
        trackedAnimations.splice(j, 1);
        continue;
      }
      var elapsed = virtualMs - entry.startVirtualMs;
      try {
        anim.currentTime = elapsed;
      } catch(e) {
        trackedAnimations.splice(j, 1);
        continue;
      }
      // Check if animation is complete
      if (entry.totalDuration !== undefined && elapsed >= entry.totalDuration && !entry.resolved) {
        entry.resolved = true;
        if (entry.resolve) entry.resolve(anim);
        trackedAnimations.splice(j, 1);
      }
    }
  };
})();
`;
