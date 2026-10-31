# Magic Spot design system

All tokens live at the top of `app.css`. Components use only the semantic tokens, never the raw palette, so dark mode (which redefines the semantic tokens) just works. The structure matches Pour Decisions; the identity is Miami's.

## Palette: Miami Art Deco

| Token | Light | From | Used for |
|---|---|---|---|
| `--mia-flamingo` | `#D63D73` | Flamingo pink | Accent: the destination flag, the Drive button, the active tab, selection |
| `--mia-ocean` | `#0B7285` | Biscayne Bay | Garages |
| `--mia-mango` | `#C76A12` | Mango / sunset | Lots |
| `--mia-orchid` | `#7A4BB0` | Art Deco neon | Park & ride (Metrorail, Metrobus, airport economy) |
| `--mia-palm` | `#1D7F55` | Royal palm | Open now, and anything free |
| `--mia-seafoam-50…500` | `#EEF5F4` → `#5B7078` | Sea foam | Page, surfaces, lines, muted text |
| `--mia-night` | `#0E2230` | Ocean Drive after dark | Text, and the dark-mode background family |
| `--mia-amber` | `#A15C00` | — | Closing soon, restrictions and warnings |

Rules:
- Flamingo is the only accent. It marks where you're going and what to do next.
- Kind colours appear only on pins, list dots and the selected filter chip.
- Prices lead each row. Free is green; "not listed" is muted, never hidden.
- Restricted places (permits, residents) are dimmed and sorted to the bottom, never mixed in with places anyone can use.

## Map

OpenFreeMap's "Positron" style, recoloured at load from the `--map-*` tokens: turquoise water, sea-foam land, white streets; the bay at night in dark mode. Parking pins are **rounded squares** (a parking sign, not a café dot) carrying a glyph: a garage building, **P** for a lot, a train for park & ride. Free places get a small green **$0** badge. Dashed outlines mark pins at a station, park, landmark or intersection rather than an address. Your destination is a flamingo map pin; your own position is a blue dot.

## Type

- **Josefin Sans** (bold) for the wordmark and sheet titles: geometric 1930s lettering, like Deco signage. Nothing else uses it.
- **Atkinson Hyperlegible** for everything else, for reading in Miami sunlight.
- Scale: 12, 13, 15, 18, 24, plus `--fs-brand` 30 for the wordmark.

## Layout

The map fills the screen and runs under the status bar. The list is a drawer laid over it; its title row carries the **Magic Spot.** wordmark, a grab handle and the tagline *FREE & CITY PARKING / MIAMI*. Drag the title row down to hide the list, up to bring it back; tap to toggle. Under it, the **Where are you going?** search and three kind chips. On wide screens the drawer is a fixed side panel.

## Components

- **Row:** kind dot and name, then the price line, then area · status, with a fixed-width distance column on the right: a walking icon and minutes up to 30, a car icon and miles beyond.
- **Search suggestions:** "Places" first (from Photon), then "Car parks" from the list; keyboard and touch friendly. Picking a place sets the destination; picking a car park opens it.
- **Sheet:** title, meta line (kind · area · distance), status, the price in large type, notes (restricted, rule, heads up, free), rates, a Monday–Sunday hours table with today marked, detail tags, address, operator. Actions: **Drive here** and **Walk to [destination]** (or Google Maps).

## Motion

Same tokens and moments as Pour Decisions: rows rise in after a filter or destination change, pins ripple in from the middle of the map, the drawer and sheet slide, the destination pin drops in. All of it is off under reduced motion.
