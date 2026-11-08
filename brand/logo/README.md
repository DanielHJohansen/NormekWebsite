# Normek logo concepts

Three routes for the provisional name, drawn as filled vector outlines. See `preview.png` for the side-by-side sheet. **Do not print, register or publish any of this until the name is cleared** (see `docs/open-questions.md`, item 1).

## The routes

| Route | Idea | Strengths | Watch out for |
|---|---|---|---|
| **01 Trace** (recommended) | A chamfered housing around the letter N, drawn as a 45 degree circuit trace with two via pads. It is rotationally symmetric, like the N | Says "enclosure plus electronics" at a glance. Strong silhouette. The solid icon tile holds up at 16 px | Needs a name that starts with N. The outline version is too fine below about 20 px, so use the icon tile there |
| **02 Section** | A part cut on the diagonal. One half solid, the other hatched like an engineering section view. The cutting plane is orange | Name-agnostic, so it survives a rename. Engineers read it instantly. The hatch works as a site pattern | Less explicit about electronics. The hatching vanishes below about 32 px, so use the icon tile there |
| **03 Via** | A wordmark in Sora with one orange letter, the O, read as a via pad | Simple, premium, easy to apply | Type only, so the name carries the identity. The icon is just the O |

## Files

Each route folder holds SVGs with text already converted to outlines, so no fonts are needed:

- `symbol.svg` and `symbol-reversed.svg` (routes 01 and 02)
- `lockup.svg` and `lockup-reversed.svg` (routes 01 and 02), `wordmark.svg` and `wordmark-reversed.svg` (route 03)
- `favicon.svg`, an icon tile for browser tabs and social avatars

"Reversed" files are for dark backgrounds. Everything is filled shapes with no strokes, so the files are safe for laser engraving, vinyl cutting and CNC marking. At a 20 mm symbol height the thinnest line is about 0.8 mm.

## Colour

| Name | Hex | Use |
|---|---|---|
| Ink | `#0F1B2D` | Main colour, text, tiles |
| Signal | `#FF5A1F` | The one accent, for shapes only |
| Paper | `#F4F5F2` | Light backgrounds |
| Steel | `#6B7686` | Secondary text |

Ink on Paper is 15.8:1. Signal on Ink is 5.5:1. Signal on white is only 3.1:1, so never use it for body text.

## Typography

Barlow Semi Condensed 600 (routes 01 and 02) and Sora 600 (route 03). Both are under the SIL Open Font License 1.1, which allows outlining them into a logo. The site type pairing is decided later by `ui-designer`.

## Basic rules

- Leave clear space around the logo of at least a quarter of the symbol height.
- Do not recolour the orange into text, stretch, rotate, add effects, or place the logo on busy photos without a solid panel.
- Use the icon tile (`favicon.svg`) wherever the full mark would be smaller than about 24 px.

## If the name changes

The files are generated, not hand drawn. After running `npm install` in `brand/logo/source`:

```
node brand/logo/source/build.mjs --name "New Name"
node brand/logo/source/preview.mjs --name "New Name"
```

Check every glyph in the result. The font parser has a known problem with some lowercase glyphs in Sora, so route 03 uses capitals only. Route 01 only makes sense for a name starting with N. Route 02 works with any name.
