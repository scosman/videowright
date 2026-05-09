---
title: Retro
slug: retro
picker_description: 80s/90s warmth with neon accents, bold typography, and VHS-era personality. Expressive but tasteful.
font_sources:
  - https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap
  - https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap
  - https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap
---

# Style: Retro

## When to use

Use for brand launches, event promos, creative showcases, music-adjacent content, portfolio pieces, or any video that benefits from warmth and personality. Retro works well when the content itself is forward-looking -- the nostalgic frame creates contrast that makes new ideas feel exciting. Avoid for clinical or corporate subjects where personality would undermine trust.

## Aesthetic rules

- **Warm dark foundation.** Background is a deep plum-charcoal (#14101e), not pure black. The warmth is deliberate -- it evokes the low-key hum of a CRT monitor. Surfaces step up in warm tones (#1c1628, #241e32).
- **Neon accent.** Primary accent is a hot magenta-pink (#e040a0) that reads as neon signage -- punchy enough to glow against dark backgrounds. Use it for headlines, highlights, key data, and decorative strokes. Never more than 30% of a composition's visual weight.
- **Secondary accent.** A warm amber (#f0b040) for supporting highlights, badges, and secondary emphasis. The magenta-amber pairing is the pack's signature -- use both but let magenta lead.
- **Warm off-white text.** Primary text is #f0ece4 -- cream-tinted, not clinical white. This is the single biggest "retro" tell; pure white breaks the mood.
- **Space Grotesk for display.** Headlines at 600-700 weight. Its geometric construction with slightly quirky details (the asymmetric 'G', the open '4') gives it period character without being a novelty face. Track slightly tight (-0.01em) on large sizes.
- **DM Sans for body.** Clean, contemporary, excellent readability at all sizes. The neutral body face lets the display type carry the personality.
- **IBM Plex Mono for code and labels.** Industrial and utilitarian -- evokes terminal screens and early desktop publishing. Used for metadata, technical labels, category tags, and code.
- **Bold color blocking.** Sections are separated by full-bleed color bands or thick accent bars (4-6px), not hairline rules. Negative space is generous but punctuated by strong graphic elements.
- **Texture is allowed, sparingly.** Subtle scan-line overlays, grain, or noise gradients can add atmosphere. Keep them at very low opacity (0.03-0.08) so they register subconsciously without degrading readability. Never use them on text areas.
- **Content hierarchy through contrast and color.** Headlines are large (2.5-4rem), often in the accent color or tinted. Body text stays cream. The hierarchy should be readable from across the room.

## Motion vocabulary

- **Ease with personality.** Entrance easing is `cubic-bezier(0.22, 1, 0.36, 1)` -- slightly snappier than Modern, with a gentle overshoot that gives motion a tactile feel. Duration 350-550ms.
- **Slide + fade for content.** Standard entrance is opacity 0 to 1 combined with translateX(24-32px) to 0 -- horizontal motion is the default, evoking a film strip or tape shuttle. Vertical slides are the exception.
- **Stagger with wider gaps.** When multiple elements appear, stagger them by 100-150ms. The slightly wider gap than Modern gives each element a moment of presence.
- **Glow pulses for emphasis.** Key moments (title reveal, stat callout) can use a brief box-shadow or text-shadow glow that blooms and settles. Duration 600-900ms, ease-in-out. The glow color should match the accent.
- **Wipe transitions welcome.** Hard horizontal wipes, color-band reveals, and slide-behind-mask effects suit the style. Crossfades are fine but less distinctive.
- **Scale is bolder.** Scale animations use a wider range (0.85-1.0 for entrances) than Modern. The bigger swing matches the bolder aesthetic.

## Don'ts

- Do not use pure white (#fff) for text or backgrounds. Always warm it to cream/off-white.
- Do not use pure black (#000) for backgrounds. Always warm it toward plum or deep brown.
- Do not use thin, hairline borders. Minimum 2px; prefer 3-4px for decorative rules.
- Do not use more than two accent colors per composition. Magenta + amber is the core pair.
- Do not overuse scan-line or grain textures -- they should be felt, not seen. If you notice them at a glance, the opacity is too high.
- Do not use bouncy spring physics or cartoon easing. The motion should feel analog and weighted, not digital and springy.
- Do not pair multiple decorative or display typefaces. Space Grotesk carries the personality alone; adding a second display face makes it kitschy.
- Do not use rounded corners larger than 8px. Keep shapes relatively crisp -- the roundness of the era was in the CRT, not the content.
