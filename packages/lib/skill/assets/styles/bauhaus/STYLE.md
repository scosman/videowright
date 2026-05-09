---
title: Bauhaus
slug: bauhaus
picker_description: Geometric forms, primary-color palette, strict grid. Functional typography and bold shapes in the 1920s Bauhaus tradition.
font_sources:
  - https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&display=swap
---

# Style: Bauhaus

## When to use

Use for content that benefits from visual authority and structural clarity: brand manifestos, architecture or design showcases, educational explainers, data-driven narratives, and anything that should feel constructed rather than decorated. Bauhaus conveys intentionality -- every element exists for a reason. It pairs well with subjects that have inherent structure (processes, systems, comparisons) because the grid and geometry reinforce the content's logic.

## Aesthetic rules

- **Warm off-white ground.** Background is #f5f0e8 -- a parchment tone that references paper stock and avoids the sterile feel of pure white. Dark-mode variant uses #1a1a1a with the same warm undertone.
- **Primary palette only.** Three accent colors: Bauhaus blue (#2454a6), signal red (#c93a3a), and construction yellow (#e8b828). Use one as the dominant accent per composition; the other two appear as supporting elements. Never introduce colors outside this triad plus the ground and foreground.
- **Near-black text.** Primary text is #1a1a1a on light ground. Dense, confident, no gray body text -- every word earns its weight.
- **Jost for everything.** A geometric sans-serif in the Futura lineage. Headlines at 700-800 weight, body at 400-500. Letter-spacing tightened aggressively on headlines (-0.03em to -0.04em), slightly loose on body (0.01em) for readability.
- **Geometry as composition.** Circles, squares, and rectangles are first-class visual elements -- not decorations but structural components of the layout. A circle can anchor a section, a rectangle can frame a heading, a square can hold a number. Use them at scale.
- **Strict grid.** All layout on an 8px baseline grid with column structure. No freeform positioning. Elements snap to grid lines. Asymmetric layouts are encouraged -- full symmetry feels static.
- **Bold scale contrast.** Headlines are very large (4-6rem) against small body text (0.875-1rem). The scale gap communicates hierarchy without needing weight or color variation.
- **No ornamentation.** Every visual element is functional: it communicates, structures, or guides the eye. No drop shadows, no gradients, no decorative borders, no texture.
- **Confident negative space.** Large empty areas are compositional elements, not wasted space. At least 30% of the viewport should be ground color in any given frame.

## Motion vocabulary

- **Geometric entrances.** Elements arrive along grid axes -- horizontal or vertical, never diagonal. Translation distances match grid units (multiples of 2rem).
- **Precise easing.** Use `cubic-bezier(0.25, 0, 0, 1)` for entrances -- quick departure, deliberate arrival. Duration 350-500ms. Motion should feel mechanical and intentional.
- **Shape reveals.** Circles scale from center (0 to 1). Rectangles extend along one axis (scaleX or scaleY from 0 to 1). These are the primary motion primitives.
- **No fade-in for primary elements.** Headlines and shapes enter via transform, not opacity. Opacity fades are reserved for secondary text and labels only.
- **Sequential, not staggered.** Elements enter one at a time in deliberate sequence with clear 150-250ms gaps. Avoid overlapping animations -- each motion deserves its own moment.
- **Hold the composition.** After all elements are placed, hold the complete composition for at least 1 second before any transition. The arranged result is the point.

## Don'ts

- Do not use gradients, textures, or background images.
- Do not use rounded corners on rectangles. Circles are circles; rectangles are rectangles. No in-between.
- Do not use more than three colors (plus foreground and background) in a single composition.
- Do not use drop shadows or any depth simulation. Everything lives on the same plane.
- Do not center-align body text. Left-align or justify. Centered headlines are acceptable.
- Do not use thin font weights (below 400). Bauhaus typography is confident and present.
- Do not introduce decorative icons, illustrations, or photographic elements. Visual interest comes from geometry and color alone.
- Do not animate color transitions. Colors are assigned, not blended.
