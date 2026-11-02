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
 *    callbacks only fire when the driver advances time. Animations on the
 *    document timeline (WAAPI, CSS animations, CSS transitions) are held
 *    paused and driven by explicit currentTime updates. The browser's
 *    document timeline itself keeps running on the real clock, so anything
 *    found running on it is taken over at the next clock advance.
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
 * - Element.prototype.animate, and Animation.prototype play, pause,
 *   reverse, finish, cancel, the currentTime and startTime setters and the
 *   playState getter (so author control of an animation works on the
 *   virtual clock)
 *
 * It exposes:
 * - window.__VW_ADVANCE_CLOCK__(deltaMs) — advance the virtual clock, fire timers/RAFs, drive animations
 * - window.__VW_ENGAGE_VIRTUAL_TIME__() — switch from passthrough to driver-controlled mode
 * - window.__VW_DEFER_FRAME__(promise) — the hook behind ctx.deferFrame: the clock advance in
 *   progress does not return (so the frame is not captured) until the promise settles
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
  var AnimationProto = Animation.prototype;
  var realPlay = AnimationProto.play;
  var realPause = AnimationProto.pause;
  var realReverse = AnimationProto.reverse;
  var realFinish = AnimationProto.finish;
  var realCancel = AnimationProto.cancel;
  var currentTimeAccessor = Object.getOwnPropertyDescriptor(AnimationProto, 'currentTime');
  var startTimeAccessor = Object.getOwnPropertyDescriptor(AnimationProto, 'startTime');
  var playStateAccessor = Object.getOwnPropertyDescriptor(AnimationProto, 'playState');
  var RealCSSAnimation = window.CSSAnimation;

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
  var frameStartMs = 0;       // virtualMs a change seen late applies from (see localTimeOf)
  var lastScanVirtualMs = 0;  // virtualMs at the latest scan for running animations

  // ----- Driver-mode animation state -----
  // Every animation the shim controls has an entry: a model of its local
  // time on the virtual clock. At virtual time originVirtualMs its local time
  // was originLocalMs, advancing at rate, unless cssPaused (held there by
  // animation-play-state). entry.state is:
  //   'playing'  - held paused and driven every frame (listed in drivenEntries)
  //   'paused'   - paused by the author, at originLocalMs
  //   'finished' - finished at limitMs (its end time, or 0 playing backwards)
  //   'detached' - never finishes, but its element left the document
  //   'idle'     - cancelled, or can't be driven
  // A WeakMap, so the shim never keeps an animation alive.
  var entries = new WeakMap(); // Animation -> entry
  // Entries in state 'playing'. Entries that leave it are removed lazily, at
  // the next frame's driveAnimations().
  var drivenEntries = [];
  // CSS animations the author played or paused with the API: as in a
  // browser, animation-play-state no longer applies to them (CSS Animations 2).
  var cssPlayStateOverridden = new WeakSet();

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

  // ----- Animations: virtual-time model -----

  // Scroll and view timelines (and a null timeline) aren't time-based:
  // the shim leaves animations on them to the browser.
  function onDocumentTimeline(anim) {
    return anim.timeline === document.timeline;
  }

  function getCurrentTime(anim) {
    return currentTimeAccessor.get.call(anim);
  }

  function setCurrentTime(anim, ms) {
    currentTimeAccessor.set.call(anim, ms);
  }

  // The browser's play state. The shim reads this one: the patched getter
  // reports its model instead.
  function realPlayState(anim) {
    return playStateAccessor.get.call(anim);
  }

  function entryOf(anim) {
    var entry = entries.get(anim);
    if (!entry) {
      entry = {
        animation: anim,
        state: 'idle',
        originLocalMs: 0,
        originVirtualMs: 0,
        rate: 1,
        cssPaused: false,
        limitMs: 0,
        listed: false
      };
      entries.set(anim, entry);
    }
    return entry;
  }

  function setOrigin(entry, localMs, atVirtualMs, rate) {
    entry.originLocalMs = localMs;
    entry.originVirtualMs = atVirtualMs;
    entry.rate = rate;
  }

  function drive(entry) {
    entry.state = 'playing';
    if (!entry.listed) {
      entry.listed = true;
      drivenEntries.push(entry);
    }
  }

  // Take over an animation now: hold it paused at localMs and drive it from
  // the virtual clock, until the clock finishes it at its end time. An
  // infinite loop never finishes, as in a browser.
  function takeOver(anim, localMs) {
    realPause.call(anim);
    setCurrentTime(anim, localMs);
    var entry = entryOf(anim);
    // Read the rate after the pause and seek, which apply a rate change that
    // reverse() left pending.
    setOrigin(entry, localMs, virtualMs, anim.playbackRate);
    entry.cssPaused = false;
    drive(entry);
    return anim;
  }

  // The finished state at limitMs, reached at virtual time atVirtualMs. The
  // model's clock keeps running from there, as the browser's document
  // timeline does: a timing change that revives the animation continues it
  // from where it would be had it kept playing.
  function markFinished(entry, limitMs, atVirtualMs, rate) {
    entry.state = 'finished';
    entry.limitMs = limitMs;
    setOrigin(entry, limitMs, atVirtualMs, rate);
  }

  // The local time of a driven animation at the current virtual time. Local
  // time advances at the animation's playbackRate. The shim can't see when
  // during a clock advance the rate changed, so a new rate applies from
  // frameStartMs: the start of the advance, or between advances, the current
  // virtual time.
  function localTimeOf(entry, rate) {
    if (rate !== entry.rate) {
      moveOrigin(entry, Math.max(frameStartMs, entry.originVirtualMs));
      entry.rate = rate;
    }
    if (entry.cssPaused) return entry.originLocalMs;
    return entry.originLocalMs + (virtualMs - entry.originVirtualMs) * rate;
  }

  // Move the model's origin to virtual time atMs, keeping its local time there.
  function moveOrigin(entry, atMs) {
    if (!entry.cssPaused) entry.originLocalMs += (atMs - entry.originVirtualMs) * entry.rate;
    entry.originVirtualMs = atMs;
  }

  // The entry of an animation the shim drives on the virtual clock, or
  // undefined. One running that the shim doesn't drive yet is adopted first,
  // so author control never reads its real-clock time:
  // - New and pending: created since the scan that starts each clock advance
  //   (a CSS animation or transition started by a callback), with no frame
  //   rendered since. Its currentTime is exact: taken over at it.
  // - Otherwise (it escaped since the previous scan, e.g. a revived finished
  //   one) by the scan's rule. That lists it for driving but doesn't hold it
  //   paused: the caller does, or the next driveAnimations().
  function drivenEntryOf(anim) {
    if (mode !== 'driver') return undefined;
    var entry = entries.get(anim);
    if (entry && (entry.state === 'playing' || entry.state === 'detached')) return entry;
    if (!onDocumentTimeline(anim) || realPlayState(anim) !== 'running') return undefined;
    if (!entry && anim.pending) {
      takeOver(anim, getCurrentTime(anim) || 0);
      return entries.get(anim);
    }
    return adoptEscaped(anim, entry);
  }

  // The shim's local time for an animation at the current virtual time.
  function currentLocalMs(anim) {
    var driven = drivenEntryOf(anim);
    if (driven) return localTimeOf(driven, anim.playbackRate);
    var entry = entries.get(anim);
    if (entry && entry.state === 'paused') return entry.originLocalMs;
    if (entry && entry.state === 'finished') return entry.limitMs;
    return getCurrentTime(anim) || 0;
  }

  // A CSS animation follows animation-play-state until the author plays or
  // pauses it with the API. The shim's own pause makes the browser ignore
  // animation-play-state, so the shim applies it itself.
  function followsCssPlayState(anim) {
    return !!RealCSSAnimation && anim instanceof RealCSSAnimation && !cssPlayStateOverridden.has(anim);
  }

  function noteApiPlayStateChange(anim) {
    if (RealCSSAnimation && anim instanceof RealCSSAnimation) cssPlayStateOverridden.add(anim);
  }

  // The computed animation-play-state that applies to a CSS animation: the
  // one at its name's position in the animation-name list.
  function pausedByCss(anim) {
    var effect = anim.effect;
    var target = effect && effect.target;
    if (!target) return false;
    var style = getComputedStyle(target, effect.pseudoElement);
    var names = style.animationName.split(',');
    var states = style.animationPlayState.split(',');
    for (var i = 0; i < names.length; i++) {
      if (names[i].trim() === anim.animationName) return states[i % states.length].trim() === 'paused';
    }
    return false;
  }

  // The shim can't see when animation-play-state changed, so the change
  // applies from frameStartMs, like a playbackRate change.
  function setCssPaused(entry, paused) {
    moveOrigin(entry, Math.max(frameStartMs, entry.originVirtualMs));
    entry.cssPaused = paused;
  }

  // End of the animation's active interval in its local time: delay + every
  // iteration + endDelay, and Infinity for an infinite loop. Undefined when
  // the browser can't report it: the animation is still driven but never
  // auto-finished. Callers read it every frame rather than caching it,
  // because updateTiming() or a CSS change can alter it at any time.
  function computeEndTime(anim) {
    var effect = anim.effect;
    // Per the WAAPI spec, an animation without an effect ends at time 0.
    if (!effect) return 0;
    try {
      var endTime = effect.getComputedTiming().endTime;
      return typeof endTime === 'number' && !isNaN(endTime) ? endTime : undefined;
    } catch (e) {
      return undefined;
    }
  }

  // The browser's finished condition: playing forwards, an animation
  // finishes at its end time; playing backwards, at 0; at rate 0, never.
  function hasFinished(localMs, rate, endTime) {
    if (rate > 0) return localMs >= endTime;
    if (rate < 0) return localMs <= 0;
    return false;
  }

  function canNeverFinish(rate, endTime) {
    return rate === 0 || (rate > 0 && endTime === Infinity);
  }

  function targetIsDetached(anim) {
    var target = anim.effect && anim.effect.target;
    return !!target && !target.isConnected;
  }

  // ----- Animations: creation and author control -----
  // In driver mode these keep an animation's model in step with what the
  // author asks for, and keep the animation held paused, so it never runs on
  // the real-time document timeline. In passthrough mode they only call the
  // browser's own implementation.

  Element.prototype.animate = function(keyframes, options) {
    var anim = realElementAnimate.call(this, keyframes, options);
    // In passthrough mode the animation runs normally during boot; engagement
    // takes it over if it's still running.
    if (mode === 'driver' && onDocumentTimeline(anim)) takeOver(anim, 0);
    return anim;
  };

  // play() and reverse() keep the browser's semantics (auto-rewind, a new
  // finished promise for a finished animation, new Animation(...).play());
  // the shim then plays the animation on the virtual clock from the time
  // they start it at. That time is exact: a pending play holds it.
  function playOnVirtualClock(realMethod) {
    return function() {
      // A driven animation shows the previous frame's time: bring it to the
      // current virtual time first, so play() on a playing animation is a
      // no-op and reverse() turns at the right time.
      var entry = drivenEntryOf(this);
      if (entry) setCurrentTime(this, localTimeOf(entry, this.playbackRate));
      var result = realMethod.apply(this, arguments);
      noteApiPlayStateChange(this);
      if (mode === 'driver' && onDocumentTimeline(this)) takeOver(this, getCurrentTime(this));
      return result;
    };
  }
  AnimationProto.play = playOnVirtualClock(realPlay);
  AnimationProto.reverse = playOnVirtualClock(realReverse);

  AnimationProto.pause = function() {
    var driven = drivenEntryOf(this);
    var localMs = driven ? localTimeOf(driven, this.playbackRate) : undefined;
    var result = realPause.apply(this, arguments);
    noteApiPlayStateChange(this);
    var entry = mode === 'driver' ? entries.get(this) : undefined;
    if (entry) {
      // A driven animation shows the previous frame's time: pause it at the
      // current virtual time instead.
      if (driven) setCurrentTime(this, localMs);
      entry.state = 'paused';
      entry.originLocalMs = getCurrentTime(this);
    }
    return result;
  };

  AnimationProto.finish = function() {
    var result = realFinish.apply(this, arguments);
    var entry = mode === 'driver' ? entries.get(this) : undefined;
    if (entry) markFinished(entry, getCurrentTime(this), virtualMs, this.playbackRate);
    return result;
  };

  AnimationProto.cancel = function() {
    var result = realCancel.apply(this, arguments);
    var entry = entries.get(this);
    if (entry) {
      entry.state = 'idle';
      entries.delete(this);
    }
    return result;
  };

  Object.defineProperty(AnimationProto, 'currentTime', {
    configurable: true,
    enumerable: currentTimeAccessor.enumerable,
    get: currentTimeAccessor.get,
    set: function(value) {
      setCurrentTime(this, value);
      if (mode !== 'driver' || !onDocumentTimeline(this)) return;
      var localMs = getCurrentTime(this);
      if (typeof localMs === 'number') seekOnVirtualClock(this, localMs);
    }
  });

  // An author's startTime is a time on the browser's real-time document
  // timeline, or, from a library that times itself off performance.now() or
  // rAF (Motion does), a virtual time mistaken for one. Neither maps onto the
  // virtual clock repeatably, so the write doesn't move the animation: it
  // keeps playing from the shim's current time for it, or pauses there for
  // null, as setting a null startTime does in a browser. The shim holds it
  // again before returning: a microtask must not see it finished on the
  // real-time timeline.
  Object.defineProperty(AnimationProto, 'startTime', {
    configurable: true,
    enumerable: startTimeAccessor.enumerable,
    get: startTimeAccessor.get,
    set: function(value) {
      var driven = mode === 'driver' && onDocumentTimeline(this);
      var localMs = driven ? currentLocalMs(this) : undefined;
      startTimeAccessor.set.call(this, value);
      noteApiPlayStateChange(this);
      if (!driven) return;
      if (value !== null) {
        takeOver(this, localMs);
        return;
      }
      setCurrentTime(this, localMs);
      var entry = entryOf(this);
      entry.state = 'paused';
      entry.originLocalMs = localMs;
    }
  });

  // A driven animation plays on the virtual clock while the browser holds it
  // paused: report it as running, so author code that checks playState sees
  // what a browser would show.
  Object.defineProperty(AnimationProto, 'playState', {
    configurable: true,
    enumerable: playStateAccessor.enumerable,
    get: function() {
      var playState = realPlayState(this);
      var entry = mode === 'driver' ? entries.get(this) : undefined;
      var moving = entry && (entry.state === 'playing' || entry.state === 'detached') && !entry.cssPaused;
      return moving && playState === 'paused' ? 'running' : playState;
    }
  });

  // An author's seek: the animation goes on from localMs at the current
  // virtual time. Seeking a finished animation back revives it: running on
  // the real-time timeline, until the shim takes it over here.
  function seekOnVirtualClock(anim, localMs) {
    var playState = realPlayState(anim);
    if (playState === 'running') {
      takeOver(anim, localMs);
      return;
    }
    var entry = entries.get(anim);
    if (!entry) return;
    if (entry.state === 'playing' || entry.state === 'detached') {
      setOrigin(entry, localMs, virtualMs, anim.playbackRate);
    } else if (playState === 'paused') {
      entry.state = 'paused';
      entry.originLocalMs = localMs;
    } else if (playState === 'finished') {
      markFinished(entry, localMs, virtualMs, anim.playbackRate);
    }
  }

  // ----- Animations: per-frame scan and drive -----

  // Take over animations on the document timeline that are running: the
  // shim holds everything it drives paused, so a running animation has
  // escaped onto the real clock. That's a CSS animation or transition that
  // started since the previous scan, or an animation an author's change
  // revived after it finished (a longer duration, more iterations, a CSS
  // animation-duration or iteration-count change, a playbackRate flip). Also
  // takes over CSS animations paused by animation-play-state, and resumes a
  // never-ending animation whose element is back in the document.
  function adoptRunningAnimations() {
    var live;
    try {
      live = document.getAnimations();
    } catch (e) {
      return;
    }
    for (var i = 0; i < live.length; i++) {
      var anim = live[i];
      var entry = entries.get(anim);
      // Driven: driveAnimations() holds it paused again if it escaped.
      if (entry && entry.state === 'playing') continue;
      if (!onDocumentTimeline(anim)) continue;
      // getAnimations() only lists animations whose element is in the
      // document: it's back. Its model kept running while it was detached,
      // as the browser's timeline does.
      if (entry && entry.state === 'detached') {
        drive(entry);
        continue;
      }
      var playState = realPlayState(anim);
      if (playState === 'paused' && !entry && followsCssPlayState(anim)) {
        // Paused by animation-play-state: its currentTime is the time it
        // holds. Taken over now, it resumes from exactly there whenever the
        // CSS resumes it (driveAnimations() applies animation-play-state).
        entry = entryOf(anim);
        setOrigin(entry, getCurrentTime(anim) || 0, lastScanVirtualMs, anim.playbackRate);
        entry.cssPaused = true;
        drive(entry);
        continue;
      }
      if (playState === 'running') adoptEscaped(anim, entry);
    }
    lastScanVirtualMs = virtualMs;
  }

  // Take over an animation running on the real clock that the shim doesn't
  // drive (entry is its current entry, if any), from a local time derived
  // only from virtual time.
  function adoptEscaped(anim, entry) {
    var rate = anim.playbackRate;
    if (!entry) {
      // New: a CSS animation or transition, which starts at local time 0.
      // Its currentTime counts real milliseconds since it started (the
      // screenshot of the previous frame can start it), so it can't be
      // used: treat it as started at the previous scan's virtual time
      // instead. That is repeatable at any render speed, and off by at most
      // a frame.
      entry = entryOf(anim);
      setOrigin(entry, 0, lastScanVirtualMs, rate);
    } else if (entry.state === 'finished') {
      // Revived. A timing change continues the model's clock from the
      // finish (see markFinished); a playbackRate flip plays back from
      // where it finished, from frameStartMs (see localTimeOf).
      if (rate !== entry.rate) setOrigin(entry, entry.limitMs, frameStartMs, rate);
    } else {
      // Restarted some other way: resume from where the shim last had it.
      setOrigin(entry, entry.originLocalMs, lastScanVirtualMs, rate);
    }
    drive(entry);
    return entry;
  }

  // Set every driven animation to its local time at the current virtual time,
  // and finish those that reached their end. Returns whether any finished.
  // Reads every animation before writing any: a write invalidates style, so a
  // read after it flushes style again, once per CSS animation.
  function driveAnimations() {
    var finishedAny = false;
    var rates = [];
    var endTimes = [];
    var escaped = [];
    var kept = 0;
    for (var i = 0; i < drivenEntries.length; i++) {
      var entry = drivenEntries[i];
      if (entry.state !== 'playing') {
        entry.listed = false;
        continue;
      }
      var anim = entry.animation;
      // Reading playState first flushes pending style, so the end time and
      // animation-play-state read below reflect the latest CSS.
      var playState = realPlayState(anim);
      if (playState === 'idle') {
        // Cancelled, e.g. a CSS animation whose element left the document.
        entry.state = 'idle';
        entry.listed = false;
        entries.delete(anim);
        continue;
      }
      var rate = anim.playbackRate;
      var endTime = computeEndTime(anim);
      if (followsCssPlayState(anim)) {
        var cssPaused = pausedByCss(anim);
        if (cssPaused !== entry.cssPaused) setCssPaused(entry, cssPaused);
      }
      // An animation that never finishes on an element that has left the
      // document (e.g. an infinite loop in an unmounted segment) can't be
      // seen: stop driving it so entries don't pile up across segments.
      // adoptRunningAnimations() resumes it if the element comes back.
      if (canNeverFinish(rate, endTime) && targetIsDetached(anim)) {
        entry.state = 'detached';
        entry.listed = false;
        continue;
      }
      drivenEntries[kept] = entry;
      rates[kept] = rate;
      endTimes[kept] = endTime;
      escaped[kept] = playState !== 'paused';
      kept++;
    }
    drivenEntries.length = kept;

    for (var j = 0; j < kept; j++) {
      var driven = drivenEntries[j];
      var a = driven.animation;
      var localMs = localTimeOf(driven, rates[j]);
      try {
        if (escaped[j]) realPause.call(a);
        setCurrentTime(a, localMs);
      } catch (e) {
        driven.state = 'idle';
        continue;
      }
      // A paused animation never finishes, as in a browser.
      var finishes = !driven.cssPaused && endTimes[j] !== undefined;
      if (finishes && hasFinished(localMs, rates[j], endTimes[j])) {
        // Puts the animation in the browser's finished state: resolves its
        // own finished promise (however early it was read) and queues its
        // finish / animationend events. A finished animation stays on the
        // live, real-time document timeline. Anything that revives it (play(),
        // a seek back, a timing change, a playbackRate flip) sets it running
        // there; the patched methods or adoptRunningAnimations() take it back
        // under the virtual clock, from a time derived only from virtual time.
        try { realFinish.call(a); } catch (e) {}
        var limitMs = rates[j] < 0 ? 0 : endTimes[j];
        var finishedAtMs = driven.originVirtualMs + (limitMs - driven.originLocalMs) / rates[j];
        markFinished(driven, limitMs, finishedAtMs, rates[j]);
        finishedAny = true;
      }
    }
    return finishedAny;
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

    // Take over animations (WAAPI and CSS) still running from boot, at the
    // local time they reached: boot ran on the real clock, and virtualMs is
    // synced to real elapsed time here. Paused ones (by pause() or
    // animation-play-state) stay paused, as in a browser; the first clock
    // advance takes over those paused by animation-play-state. Reads all of
    // them before taking any over, so style is flushed once.
    try {
      var running = document.getAnimations().filter(function(a) {
        return onDocumentTimeline(a) && realPlayState(a) === 'running';
      });
      var startLocalMs = running.map(function(a) { return getCurrentTime(a) || 0; });
      for (var i = 0; i < running.length; i++) takeOver(running[i], startLocalMs[i]);
    } catch(e) {
      // document.getAnimations may not be available in all contexts
    }
    frameStartMs = virtualMs;
    lastScanVirtualMs = virtualMs;

    mode = 'driver';
  };

  // ----- Clock advance driver -----
  window.__VW_ADVANCE_CLOCK__ = async function(deltaMs) {
    if (mode === 'passthrough') return; // no-op during boot

    frameStartMs = virtualMs;
    var target = virtualMs + deltaMs;

    // Take over what escaped onto the real clock since the previous advance
    // (e.g. a CSS animation started during the screenshot) before any
    // callback runs, so one that is new and pending during the callbacks was
    // created by them (see drivenEntryOf).
    adoptRunningAnimations();

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
      await drainMicrotasks();
    }

    // Final advance to target
    virtualMs = target;

    // Fire all queued RAF callbacks
    var queued = rafCallbacks.splice(0);
    for (var i = 0; i < queued.length; i++) {
      try { queued[i].cb(virtualMs); } catch(e) { console.error('[VW shim] RAF error:', e); }
    }

    // Let promise continuations of this frame's callbacks run, so style
    // changes they make start their CSS animations before the scan rather
    // than during the screenshot.
    await drainMicrotasks();

    adoptRunningAnimations();
    var finishedAny = driveAnimations();
    // Virtual time stands still from here until the next advance: a change
    // made meanwhile (in a finished handler, or an event handler during the
    // screenshot) applies from now.
    frameStartMs = virtualMs;

    // Let continuations of the finished promises just resolved run (e.g.
    // awaiting anim.finished, then a class change), and take over what they
    // start at this frame's virtual time. After the advance returns, a short
    // CSS transition they start could run and finish on the real clock before
    // the next scan sees it. Bounded, for chains of animations that finish at
    // once.
    for (var pass = 0; finishedAny && pass < 8; pass++) {
      await drainMicrotasks();
      adoptRunningAnimations();
      finishedAny = driveAnimations();
    }

    // Hold the frame until the work deferred during it has settled (e.g. a <video> seek made
    // in a frame callback), so the screenshot that follows shows its result.
    await settleDeferredWork();
  };

  // ----- Deferred frame work (ctx.deferFrame) -----
  // Promises registered during a clock advance. The advance does not return (so the driver
  // does not capture the frame) until they settle. Waits on the real clock: the virtual clock
  // stands still meanwhile. Work deferred while settling (a continuation that defers again) is
  // waited for too, a bounded number of rounds.
  var deferredWork = [];
  var DEFERRED_WORK_TIMEOUT_MS = 10000;
  // Tests shorten the limit with window.__VW_DEFER_TIMEOUT_MS__.
  function deferredWorkTimeoutMs() {
    return window.__VW_DEFER_TIMEOUT_MS__ > 0 ? window.__VW_DEFER_TIMEOUT_MS__ : DEFERRED_WORK_TIMEOUT_MS;
  }

  window.__VW_DEFER_FRAME__ = function(work) {
    if (mode !== 'driver') return;
    deferredWork.push(Promise.resolve(work).then(
      function() {},
      function(e) { console.error('[VW shim] deferred frame work failed:', e); }
    ));
  };

  async function settleDeferredWork() {
    for (var round = 0; deferredWork.length > 0 && round < 8; round++) {
      var batch = deferredWork.splice(0);
      var timer;
      var timedOut = await Promise.race([
        Promise.all(batch).then(function() { return false; }),
        new Promise(function(resolve) {
          timer = realSetTimeout(function() { resolve(true); }, deferredWorkTimeoutMs());
        })
      ]);
      realClearTimeout(timer);
      if (timedOut) {
        deferredWork = [];
        throw new Error('ctx.deferFrame: work deferred at ' + virtualMs.toFixed(1) +
          'ms was still pending after ' + deferredWorkTimeoutMs() + 'ms');
      }
      // Changes made as the work settled start their animations at this frame's time.
      await drainMicrotasks();
      adoptRunningAnimations();
      driveAnimations();
    }
  }

  async function drainMicrotasks() {
    for (var d = 0; d < 8; d++) await Promise.resolve();
  }
})();
`;
