# Magic Spot

A phone-first web app for parking in Miami. It covers the free and government-run parking in the Miami parking list: City of Miami (Miami Parking Authority), Miami-Dade County, Miami Beach, Coral Gables, Metrorail and Park & Ride, county parks and the airport's economy lot. Type where you're going and it sorts the parking by how far you'd walk from there.

## What it does

- **Where are you going?** Type a place, like "Wynwood Walls" or "Lincoln Road". As you type it suggests real places (via Photon, a free OpenStreetMap search) and car parks from the list. Pick a place and a flag drops on the map, and the list sorts by walking time from there. Without a destination it sorts from you, or from Downtown.
- **The list** shows the price first ("$3 first hr · $22 max", "Free at most lots", "$4.50 a day"), then the area and whether it's open now in Miami time, where hours are listed. Far-away places show miles instead of walking minutes. Filter by Garage, Lot or Park & ride. Permit-only and residents-only places sort to the bottom under their own heading.
- **Details** for each place: full rates, when it's free, restrictions and rules, hours for each day of the week, clearance and spaces, the address and the operator's page. **Drive here** opens Google Maps driving directions. With a destination set, **Walk to …** gives walking directions from the car park to where you're going.
- **Tips:** the parts of the list that aren't places. Free parking at a glance, the cheapest options, street meter zones, how to pay, and what to watch for.
- **Works like an app.** Add it to your home screen. It keeps working on patchy signal (place search needs a connection).

The look follows a small Miami Art Deco design system; see [DESIGN.md](DESIGN.md).

## Notes on the data

- Rates, hours and rules come from "Miami Parking List — Free and Government Parking", checked on 31 October 2026. Where the list gives no rate or hours, the app shows none rather than guessing. Event, flood and hurricane rates override the standard ones.
- Positions come from OpenStreetMap (Nominatim and Photon), checked by hand. Places with a street address are pinned exactly. 29 places are named after a station, park, landmark or intersection instead; their pins have a dashed outline and mark that place, not the exact entrance.
- About 60 numbered Miami Parking Authority lots (Lot 1, Lot 13, …) have no published address, so they aren't on the map. The Tips tab links to the MPA's own map for them.
- Your destination and filters are remembered on your phone only.
- To preview a time, add `?now=2026-11-01T22:00` to the URL. It sets the clock to that Miami time, and the title row says "Preview".

## Running it

It's a static site with no build step: `index.html`, `app.css`, `app.js` and `data.js`, plus MapLibre GL in `vendor/`, which draws the map. It has the same architecture as [Pour Decisions](https://github.com/thinkscientist/pourdecisions).

- Locally: `python3 -m http.server`, then open http://localhost:8000.
- On your phone: it needs HTTPS for location. Any static host works, such as GitHub Pages.

The map is [OpenFreeMap](https://openfreemap.org) (free vector tiles, no key), recoloured with the app's design tokens. Map data © OpenStreetMap contributors, © OpenMapTiles. Place search by [Photon](https://photon.komoot.io).

## Licence

The app's code is released under the [MIT licence](LICENSE). That covers the code only. The parking information in `data.js` comes from the operators' published pages via the parking list, and MapLibre GL JS in `vendor/` keeps its own BSD licence. The app isn't affiliated with any parking operator; to report something wrong, open an issue.
