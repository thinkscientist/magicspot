// Magic Spot: parking data, transcribed from "Miami Parking List — Free and Government
// Parking" (last checked 31 October 2026). Only government-run parking and free parking.
//
// kind:   garage | lot | ride (Metrorail and Park & Ride: park to take transit)
// op:     who runs it
// rate:   the headline price, as the list gives it; rates: the full detail
// free:   when parking is free here, if ever
// hours:  weekly hours by weekday where the list gives them ("HH:MM-HH:MM"; past midnight
//         is written 24:30 etc.); a missing day means not listed
// only:   a restriction that stops most people parking here (monthly permits, residents)
// rule:   a condition anyone can meet (ride transit), shown on the details page
// approx: true when the list names a place, not a street address, so the pin marks that
//         station, park or landmark rather than the exact entrance
// q:      Google Maps search text for directions

window.CITY = {
  name: "Miami",
  tz: "America/New_York",
  center: { lat: 25.7743, lng: -80.1937 }, // Downtown Miami
  checked: "31 October 2026",
};

const ALL = (h) => ({ sun: h, mon: h, tue: h, wed: h, thu: h, fri: h, sat: h });
const WEEKDAYS = (h, weekend) => ({ mon: h, tue: h, wed: h, thu: h, fri: h, sat: weekend, sun: weekend });

const MPA_LINK = "https://commerce.miamiparking.com/facility/findparking";
const COUNTY_LINK = "https://www.miamidade.gov/global/business/facilitiesandfueling/parking-facilities.page";
const MB_LINK = "https://www.miamibeachfl.gov/city-hall/parking/";
const RAIL_LINK = "http://www.miamidade.gov/global/service.page?Mduid_service=ser1478206784102858";
const PNR_LINK = "https://www.miamidade.gov/global/transportation/tracker/metrobus-park-and-ride-locations.page";
const CG_LINK = "https://www.coralgables.com/department/parking-department/parking-garages-fees-information";

// Shared rate text
const COUNTY_RATES = "$3 per half hour up to 2.5 hours · $15 for 2.5–12 hours · $24 over 12 hours · $24 lost ticket. Monthly pass $74.90.";
const MB_GARAGE_RATES = "$3 first hour, then $6, $9, $12, $14, $16, $18, $20 · $22 maximum per 24 hours · Fri–Sun 8pm–5am event flat rate $22 · lost ticket $22.";
const RAIL_RATES = "$4.50 a day at the ticket machine, or $4.85 with PayByPhone. Monthly pass + parking $123.75.";

window.SPOTS = [
  // ── City of Miami: Miami Parking Authority garages ──────────────────────
  { id: "mpa-courthouse", name: "Courthouse Center Garage", op: "MPA", kind: "garage", area: "Downtown",
    addr: "40 NW 3rd Street", geo: "40 NW 3rd Street, Miami, FL 33128",
    notes: ["Clearance 8'1\"", "Facility #20001", "Courts and Government Center"],
    warn: "Not the County's \"Courthouse Center\" at 175 NW 1st Ave, which is monthly only.",
    link: MPA_LINK },
  { id: "mpa-college-station", name: "College Station Garage", op: "MPA", kind: "garage", area: "Downtown",
    addr: "190 NE 3rd Street", geo: "190 NE 3rd Street, Miami, FL 33132",
    notes: ["Clearance 7'0\"", "Facility #20003", "Miami Dade College, Bayside", "Hurricane / flood parking garage"],
    link: MPA_LINK },
  { id: "mpa-knight-center", name: "Knight Center Garage", op: "MPA", kind: "garage", area: "Downtown",
    addr: "100 SE 1st Street", geo: "100 SE 1st Street, Miami, FL 33131",
    rates: "Monthly parking $155.01.",
    notes: ["Low clearance: 6'2\"", "Facility #20004", "Riverfront, Knight Center, Metromover", "Hurricane / flood parking garage"],
    link: MPA_LINK },
  { id: "mpa-regatta-harbour", name: "Regatta Harbour Garage", op: "MPA", kind: "garage", area: "Coconut Grove",
    addr: "3351 Pan American Drive", geo: "3351 Pan American Drive, Miami, FL 33133",
    rates: "Monthly parking $100.",
    free: "Free during an activated hurricane watch or flood event, for households enrolled in advance.",
    notes: ["Clearance 8'0\"", "Facility #20005", "Hurricane / flood parking garage"],
    link: MPA_LINK },
  { id: "mpa-home-plate", name: "Home Plate Garage P1", op: "MPA", kind: "garage", area: "loanDepot Park",
    addr: "1502 NW 7th Street", geo: "1502 NW 7th Street, Miami, FL 33125",
    rates: "Game and event days: prepaid or PayByPhone, price varies by event.",
    notes: ["Marlins ballpark garage", "Little Havana"], link: MPA_LINK },
  { id: "mpa-3rd-base", name: "3rd Base Garage P2", op: "MPA", kind: "garage", area: "loanDepot Park",
    addr: "1402 NW 7th Street", geo: "1402 NW 7th Street, Miami, FL 33125",
    rates: "Game and event days: prepaid or PayByPhone, price varies by event.",
    notes: ["Marlins ballpark garage"], link: MPA_LINK },
  { id: "mpa-1st-base", name: "1st Base Garage P3", op: "MPA", kind: "garage", area: "loanDepot Park",
    addr: "1502 NW 4th Street", geo: "1502 NW 4th Street, Miami, FL 33125",
    rates: "Game and event days: prepaid or PayByPhone, price varies by event.",
    notes: ["Marlins ballpark garage"], link: MPA_LINK },
  { id: "mpa-center-field", name: "Center Field Garage P4", op: "MPA", kind: "garage", area: "loanDepot Park",
    addr: "1402 NW 4th Street", geo: "1402 NW 4th Street, Miami, FL 33125",
    rates: "Game and event days: prepaid or PayByPhone, price varies by event.",
    notes: ["Marlins ballpark garage"], link: MPA_LINK },

  // ── City of Miami: MPA lots named after a landmark (pin marks the landmark) ──
  { id: "mpa-lot-42", name: "Lot 42", op: "MPA", kind: "lot", area: "Downtown",
    addr: "114 SE 4th Street", geo: "114 SE 4th Street, Miami, FL", notes: ["Facility #30042"], link: MPA_LINK },
  { id: "mpa-lot-2", name: "Lot 2 – Bayfront Park", op: "MPA", kind: "lot", area: "Downtown waterfront", approx: true,
    geo: "Bayfront Park, Miami", notes: ["Facility #30002", "Bayfront Park, Bayside"], link: MPA_LINK },
  { id: "mpa-lot-62", name: "Lot 62 – Regatta Park", op: "MPA", kind: "lot", area: "Coconut Grove", approx: true,
    addr: "Regatta Park, 3500 Pan American Dr", geo: "Regatta Park, Coconut Grove, Miami", notes: ["Facility #30062"], link: MPA_LINK },
  { id: "mpa-lot-6", name: "Lot 6 – Playhouse", op: "MPA", kind: "lot", area: "Coconut Grove", approx: true,
    geo: "Coconut Grove Playhouse, Miami", notes: ["Facility #30006"], link: MPA_LINK },
  { id: "mpa-lot-72", name: "Lot 72 – Monty's", op: "MPA", kind: "lot", area: "Coconut Grove", approx: true,
    geo: "Monty's Raw Bar, Coconut Grove, Miami", notes: ["Facility #30072"], link: MPA_LINK },
  { id: "mpa-lot-28", name: "Lots 28 & 29 – Jose Marti", op: "MPA", kind: "lot", area: "Little Havana", approx: true,
    geo: "Jose Marti Park, Miami", notes: ["Facilities #30028 and #30029", "Jose Marti Park"], link: MPA_LINK },
  { id: "mpa-lot-82", name: "Lot 82 – Domino Park", op: "MPA", kind: "lot", area: "Little Havana", approx: true,
    geo: "Domino Park, Calle Ocho, Miami", notes: ["Facility #30082"], link: MPA_LINK },
  { id: "mpa-lot-87", name: "Lot 87 – Tower Theatre", op: "MPA", kind: "lot", area: "Little Havana", approx: true,
    geo: "Tower Theater, 1508 SW 8th Street, Miami", notes: ["Facility #30087"], link: MPA_LINK },
  { id: "mpa-lot-89", name: "Lot 89 – Lummus Park", op: "MPA", kind: "lot", area: "Downtown riverfront", approx: true,
    geo: "Lummus Park, Miami River", notes: ["Facility #30089"], link: MPA_LINK },
  { id: "mpa-lot-c", name: "Lot C – Arsht Center", op: "MPA", kind: "lot", area: "Omni", approx: true,
    geo: "Adrienne Arsht Center, Miami", notes: ["Facility #30207", "Event rates apply on show nights"], link: MPA_LINK },
  { id: "mpa-marine-stadium", name: "Miami Marine Stadium Lot", op: "MPA", kind: "lot", area: "Virginia Key", approx: true,
    geo: "Miami Marine Stadium, Virginia Key", notes: ["Facility #30311"], link: MPA_LINK },
  { id: "mpa-watson-ramp", name: "Lot 70 – Watson Island Boat Ramp", op: "MPA", kind: "lot", area: "Watson Island", approx: true,
    geo: "Watson Island, Miami", notes: ["Facility #30070"], link: MPA_LINK },

  // ── Miami-Dade County garages and lots ──────────────────────────────────
  { id: "cty-hickman", name: "Hickman Garage (Garage 5)", op: "County", kind: "garage", area: "Downtown",
    addr: "270 NW 2nd Street", geo: "270 NW 2nd Street, Miami, FL 33128",
    rate: "$3 / 30 min · $15 day", rates: COUNTY_RATES,
    hours: { mon: "05:30-24:30", tue: "05:30-24:30", wed: "05:30-24:30", thu: "05:30-24:30", fri: "05:30-24:30", sat: "closed", sun: "closed" },
    hoursNote: "Hourly parking Mon–Fri 5:30am–12:30am; closed for hourly parking on weekends and county holidays.",
    free: "Free for disabled parkers and jurors, subject to availability. 15-minute grace period.",
    notes: ["1,059 spaces", "Near Government Center Metrorail"], link: COUNTY_LINK },
  { id: "cty-cultural-center", name: "Cultural Center Garage", op: "County", kind: "garage", area: "Downtown",
    addr: "50 NW 2nd Avenue", geo: "50 NW 2nd Avenue, Miami, FL 33128",
    rate: "$3 / 30 min · $15 day", rates: COUNTY_RATES,
    hours: WEEKDAYS("05:30-23:00", "05:30-20:00"),
    free: "Free for disabled parkers and jurors, subject to availability. 15-minute grace period.",
    notes: ["623 spaces", "Best for the library, museums and HistoryMiami"], link: COUNTY_LINK },
  { id: "cty-overtown", name: "Overtown Transit Village Garage", op: "County", kind: "garage", area: "Overtown",
    addr: "701 NW 1st Court", geo: "701 NW 1st Court, Miami, FL 33136",
    rate: "$3 / 30 min · $15 day", rates: COUNTY_RATES, hours: ALL("00:00-24:00"),
    free: "Free for disabled parkers and jurors, subject to availability. 15-minute grace period.",
    notes: ["886 spaces", "Open 24/7", "Near Historic Overtown / Lyric Theatre Metrorail"], link: COUNTY_LINK },
  { id: "cty-west-lot", name: "West Lot Garage", op: "County", kind: "garage", area: "Downtown",
    addr: "220 NW 3rd Street", geo: "220 NW 3rd Street, Miami, FL 33128",
    rate: "$3 / 30 min · $15 day", rates: COUNTY_RATES,
    hours: { mon: "05:30-23:00", tue: "05:30-23:00", wed: "05:30-23:00", thu: "05:30-23:00", fri: "05:30-23:00", sat: "05:30-20:00", sun: "06:00-20:00" },
    free: "Free for disabled parkers and jurors, subject to availability. 15-minute grace period.",
    notes: ["800 spaces", "Near Government Center Metrorail"], link: COUNTY_LINK },
  { id: "cty-jury-lot", name: "Civic Center Jury Lot", op: "County", kind: "lot", area: "Civic Center",
    addr: "1250 NW 12th Street", geo: "1250 NW 12th Street, Miami, FL 33136",
    rate: "$15 a day", rates: "$15 daily flat rate.",
    hours: WEEKDAYS("10:00-18:00", "closed"), hoursNote: "Lot opens 6am; public parking starts at 10am. Closed weekends and county holidays.",
    free: "Free for disabled parkers and jurors.", notes: ["149 spaces"], link: COUNTY_LINK },
  { id: "cty-lot-25", name: "Civic Center Lot 25 (Kristi House)", op: "County", kind: "lot", area: "Civic Center",
    addr: "1355 NW 12th Avenue", geo: "1355 NW 12th Avenue, Miami, FL 33136",
    rate: "$15 a day", rates: "$15 daily flat rate. Monthly pass available.",
    hours: WEEKDAYS("06:00-18:00", "closed"), hoursNote: "Closed weekends and county holidays.",
    free: "Free for disabled parkers and jurors.", notes: ["240 spaces"], link: COUNTY_LINK },
  { id: "cty-courthouse", name: "County Courthouse Center", op: "County", kind: "garage", area: "Downtown",
    addr: "175 NW 1st Avenue", geo: "175 NW 1st Avenue, Miami, FL 33128",
    only: "Monthly permits only, not open to the public",
    hours: WEEKDAYS("06:00-19:00", "closed"), notes: ["326 spaces"],
    warn: "Not the MPA's public Courthouse Center Garage at 40 NW 3rd St.", link: COUNTY_LINK },
  { id: "cty-hickman-lot", name: "Hickman Lot (JAC)", op: "County", kind: "lot", area: "Downtown",
    addr: "275 NW 2nd Street", geo: "275 NW 2nd Street, Miami, FL 33128",
    only: "Monthly permits only", hours: ALL("00:00-24:00"), notes: ["45 spaces"], link: COUNTY_LINK },
  { id: "cty-graham", name: "Graham Building Lot", op: "County", kind: "lot", area: "Civic Center",
    addr: "1350 NW 13th Avenue", geo: "1350 NW 13th Avenue, Miami, FL 33136",
    only: "Monthly permits only", hours: ALL("00:00-24:00"), notes: ["341 spaces", "Near Civic Center Metrorail"], link: COUNTY_LINK },

  // ── Miami Beach: city garages ───────────────────────────────────────────
  { id: "mb-g8", name: "5th & Alton Garage", code: "G8", op: "Miami Beach", kind: "garage", area: "South of Fifth",
    addr: "550 Lenox Avenue", geo: "550 Lenox Avenue, Miami Beach, FL 33139",
    rate: "2 hrs free with receipt · $22 max", rates: MB_GARAGE_RATES, hours: ALL("00:00-24:00"),
    free: "First 2 hours free with retail validation or a receipt. Without one, the standard rates apply.",
    notes: ["Publix, Best Buy, MacArthur Causeway"], warn: "Excluded from flood / king-tide free openings.", link: MB_LINK },
  { id: "mb-g1", name: "7th Street Garage", code: "G1", op: "Miami Beach", kind: "garage", area: "South Beach",
    addr: "200 7th Street", geo: "200 7th Street, Miami Beach, FL 33139",
    rate: "$3 first hr · $22 max", rates: MB_GARAGE_RATES, hours: ALL("00:00-24:00"),
    notes: ["646 spaces", "Entrance on 7th St between Washington and Collins", "Ocean Drive, Lummus Park"], link: MB_LINK },
  { id: "mb-g2", name: "12th Street Garage", code: "G2", op: "Miami Beach", kind: "garage", area: "South Beach",
    addr: "512 12th Street", geo: "512 12th Street, Miami Beach, FL 33139",
    rate: "$3 first hr · $22 max", rates: MB_GARAGE_RATES,
    notes: ["134 spaces", "Washington Ave, Ocean Drive"], link: MB_LINK },
  { id: "mb-g3", name: "13th Street Garage", code: "G3", op: "Miami Beach", kind: "garage", area: "South Beach",
    addr: "1301 Collins Avenue", geo: "1301 Collins Avenue, Miami Beach, FL 33139",
    rate: "$3 first hr · $22 max", rates: MB_GARAGE_RATES, hours: ALL("00:00-24:00"),
    notes: ["286 spaces", "One block from Ocean Drive"], link: MB_LINK },
  { id: "mb-g4", name: "16th Street Garage", code: "G4", op: "Miami Beach", kind: "garage", area: "South Beach",
    addr: "1557 Washington Avenue", geo: "1557 Washington Avenue, Miami Beach, FL 33139",
    rate: "$3 first hr · $22 max", rates: MB_GARAGE_RATES, hours: ALL("00:00-24:00"),
    notes: ["Lincoln Road, Washington Ave"], link: MB_LINK },
  { id: "mb-g5", name: "17th Street Garage", code: "G5", op: "Miami Beach", kind: "garage", area: "South Beach",
    addr: "640 17th Street", geo: "640 17th Street, Miami Beach, FL 33139",
    rate: "$3 first hr · $22 max", rates: MB_GARAGE_RATES, hours: ALL("00:00-24:00"),
    notes: ["About 1,460–1,490 spaces: the biggest city garage", "Lincoln Road, Convention Center, New World Center"], link: MB_LINK },
  { id: "mb-g6", name: "42nd Street Garage", code: "G6", op: "Miami Beach", kind: "garage", area: "Mid-Beach",
    addr: "400 West 42nd Street", geo: "400 West 42nd Street, Miami Beach, FL 33140",
    rate: "$2 first hr · $16 max", rates: "$2 first hour, rising to a $16 maximum per 24 hours · $16 event flat rate.",
    notes: ["The cheapest city garage", "Mt. Sinai area"], link: MB_LINK },
  { id: "mb-g7", name: "City Hall Garage", code: "G7", op: "Miami Beach", kind: "garage", area: "South Beach",
    addr: "1755 Meridian Avenue", geo: "1755 Meridian Avenue, Miami Beach, FL 33139",
    rate: "$3 first hr · $22 max", rates: MB_GARAGE_RATES, hours: ALL("00:00-24:00"),
    notes: ["650 spaces", "City Hall, Lincoln Road"], warn: "Excluded from flood / king-tide free openings.", link: MB_LINK },
  { id: "mb-g9", name: "Pennsylvania Avenue Garage", code: "G9", op: "Miami Beach", kind: "garage", area: "South Beach",
    addr: "1661 Pennsylvania Avenue", geo: "1661 Pennsylvania Avenue, Miami Beach, FL 33139",
    rate: "$3 first hr · $22 max", rates: MB_GARAGE_RATES,
    notes: ["550 spaces, 5 levels", "New World Center, Fillmore"], link: MB_LINK },
  { id: "mb-g10", name: "Sunset Harbour Garage", code: "G10", op: "Miami Beach", kind: "garage", area: "Sunset Harbour",
    addr: "1900 Bay Road", geo: "1900 Bay Road, Miami Beach, FL 33139",
    rate: "$3 first hr · $22 max", rates: MB_GARAGE_RATES, hours: ALL("00:00-24:00"),
    notes: ["Sunset Harbour restaurants, Maurice Gibb Park"], link: MB_LINK },
  { id: "mb-g11", name: "Convention Center Garage", code: "G11", op: "Miami Beach", kind: "garage", area: "South Beach",
    addr: "1901 Convention Center Drive", geo: "1901 Convention Center Drive, Miami Beach, FL 33139",
    notes: ["Miami Beach Convention Center"], warn: "Excluded from flood / king-tide free openings.", link: MB_LINK },
  { id: "mb-g12", name: "Collins Park Garage", code: "G12", op: "Miami Beach", kind: "garage", area: "Collins Park",
    addr: "340 23rd Street", geo: "340 23rd Street, Miami Beach, FL 33139",
    rate: "$3 first hr · $22 max", rates: MB_GARAGE_RATES, hours: ALL("00:00-24:00"),
    notes: ["Bass Museum, library, beach at 21st–23rd"], link: MB_LINK },
  { id: "mb-67th", name: "67th Street Garage", op: "Miami Beach", kind: "garage", area: "North Beach",
    addr: "260 67th Street", geo: "260 67th Street, Miami Beach, FL 33141",
    notes: ["Opened to residents during flood warnings"], link: MB_LINK },

  // ── Miami Beach: named surface lots ─────────────────────────────────────
  { id: "mb-p92", name: "Lot P-92", op: "Miami Beach", kind: "lot", area: "North Beach",
    addr: "Collins Avenue & 72nd Street", geo: "Collins Avenue & 72nd Street, Miami Beach",
    rate: "$1/hr", rates: "$1 an hour (North Beach lots). Enforced 8am–11pm daily.", link: MB_LINK },
  { id: "mb-p100", name: "Lot P-100", op: "Miami Beach", kind: "lot", area: "North Beach",
    addr: "8100 Hawthorne Avenue", geo: "8100 Hawthorne Avenue, Miami Beach, FL",
    rate: "$1/hr", rates: "$1 an hour (North Beach lots). Enforced 8am–11pm daily.", link: MB_LINK },
  { id: "mb-p71", name: "Lot P-71 – 46 Street", op: "Miami Beach", kind: "lot", area: "Mid-Beach", approx: true,
    addr: "46th Street", geo: "West 46th Street & Prairie Avenue, Miami Beach",
    rates: "An exception to the $1 an hour West Middle Beach lot rate; check the sign.", link: MB_LINK },
  { id: "mb-p45", name: "Lot P-45 – Maurice Gibb Boat Ramp", op: "Miami Beach", kind: "lot", area: "Sunset Harbour", approx: true,
    geo: "Maurice Gibb Memorial Park, Miami Beach", only: "Miami Beach residents only", link: MB_LINK },

  // ── Metrorail station parking (transit riders only) ─────────────────────
  ...[
    ["allapattah", "Allapattah", "Surface"], ["brownsville", "Brownsville", "Garage"], ["coconut-grove", "Coconut Grove", "Surface"],
    ["culmer", "Culmer", "Surface"], ["dadeland-north", "Dadeland North", "Garage"], ["dadeland-south", "Dadeland South", "Surface and garage"],
    ["douglas-road", "Douglas Road", "Surface"], ["mlk", "Dr. Martin Luther King Jr. Plaza", "Surface, 100 spaces"],
    ["earlington", "Earlington Heights", "Garage"], ["hialeah", "Hialeah", "Surface"], ["overtown", "Historic Overtown / Lyric Theatre", "Surface, 40 spaces"],
    ["mia", "Miami International Airport", "Surface, 40 spaces"], ["northside", "Northside", "Surface"], ["okeechobee", "Okeechobee", "Surface and garage"],
    ["palmetto", "Palmetto", "Surface"], ["santa-clara", "Santa Clara", "Garage"], ["south-miami", "South Miami", "Garage"],
    ["university", "University", "Surface"], ["vizcaya", "Vizcaya", "Surface"],
  ].map(([id, name, type]) => ({
    id: "rail-" + id, name: `${name} Metrorail`, op: "Metrorail", kind: "ride", area: "Metrorail",
    geo: `${name} station, Metrorail, Miami-Dade`,
    rate: "$4.50 a day", rates: RAIL_RATES, rule: "Transit riders only: you must board Metrorail or Metrobus.",
    hours: ALL(id === "earlington" ? "00:00-24:00" : "05:00-25:00"),
    hoursNote: ["earlington", "okeechobee", "south-miami"].includes(id)
      ? `Overnight parking allowed here (extra $4 a night, up to 30 days)${id === "earlington" ? "; the only 24-hour Metrorail garage" : ""}.`
      : "Garages open 5am–1am. No overnight parking at this station.",
    notes: [type], link: RAIL_LINK,
  })),

  // ── Metrobus Park & Ride (mostly free) ──────────────────────────────────
  ...[
    ["dolphin", "Dolphin Station", "NW 12th Street & NW 122nd Avenue", "NW 12th Street and NW 122nd Avenue, Sweetwater, FL", ["836 Dolphin Express to Downtown"]],
    ["tamiami", "Tamiami Station", "SW 8th Street & SW 147th Avenue", "SW 8th Street and SW 147th Avenue, Miami, FL", ["458 spaces", "EV charging", "837 Express to Downtown, weekday peaks"]],
    ["golden-glades", "Golden Glades", "16000 NW 7th Avenue", "16000 NW 7th Avenue, Miami Gardens, FL", ["Transfer to Tri-Rail"]],
    ["127-kendall", "SW 127th Ave & Kendall Dr", "9001 SW 127th Avenue", "9001 SW 127th Avenue, Miami, FL", ["Routes 288 / 288A to Dadeland North"]],
    ["west-kendall", "West Kendall Transit Terminal", "9155 SW 162nd Avenue", "9155 SW 162nd Avenue, Miami, FL", []],
    ["344th", "SW 344th Street", "254 West Palm Drive, Florida City", "254 West Palm Drive, Florida City, FL", ["Busway park & ride"]],
    ["coral-reef", "Coral Reef Dr / Turnpike", "SW 152nd Street & SW 117th Avenue", "SW 152nd Street and SW 117th Avenue, Miami, FL", ["Route 252"]],
    ["hammocks", "Hammocks Town Center", "10201 Hammocks Blvd", "10201 Hammocks Boulevard, Miami, FL", ["Routes 104, 204"]],
    ["tw-152", "TransitWay SW 152nd St", "9300 Coral Reef Drive", "9300 Coral Reef Drive, Miami, FL", ["Routes 31, 34, 38, 52, 57, 252"]],
    ["tw-112", "TransitWay SW 112th Ave", "20500 SW 112th Avenue", "20500 SW 112th Avenue, Miami, FL", ["Next to Target", "Routes 31, 34"]],
    ["tw-168", "TransitWay SW 168th St Garage", "SW 168th Street & SW 97th Avenue", "SW 168th Street and SW 97th Avenue, Miami, FL", ["Parking garage"]],
    ["tw-197", "TransitWay SW 197th St", "19755 SW 110th Court", "19755 SW 110th Court, Miami, FL", []],
    ["tw-244", "TransitWay SW 244th St", "24400 South Dixie Highway", "24400 South Dixie Highway, Homestead, FL", []],
    ["miami-gardens", "Miami Gardens Drive", "NW 186th Street & NW 73rd Avenue", "NW 186th Street and NW 73rd Avenue, Hialeah, FL", []],
  ].map(([id, name, addr, geo, notes]) => ({
    id: "pnr-" + id, name: `${name} Park & Ride`, op: "Park & Ride", kind: "ride", area: "Park & Ride",
    addr, geo, rate: "Free at most lots",
    free: "The county says most Park & Ride lots are free; policies vary by site.",
    rule: "Park & Ride: you're parking to take the bus.", hours: ALL("05:00-22:00"),
    hoursNote: "Open daily 5am–10pm. No overnight parking.", notes, link: PNR_LINK,
  })),

  // ── Airport (county-run) ────────────────────────────────────────────────
  { id: "mia-economy", name: "MIA Economy Park-and-Ride", op: "Airport", kind: "ride", area: "Miami Airport",
    addr: "NW 45th Ave, between NW 13th & 15th St", geo: "NW 45th Avenue and NW 14th Street, Miami, FL",
    rate: "$12 a day", rates: "$12 a day: about half the terminal garages. Free shuttle to the terminal every 15 minutes.",
    notes: ["460 spaces", "Cards, Apple Pay, Google Pay"], link: "https://www.miamidade.gov/global/release.page?Mduid_release=rel1668523780319994" },
  { id: "mia-dolphin", name: "MIA Dolphin Garage", op: "Airport", kind: "garage", area: "Miami Airport", approx: true,
    geo: "Dolphin Garage, Miami International Airport", notes: ["Faces the north terminals (D / E)"],
    warn: "The most expensive government parking in this list; check current rates.", link: "https://www.miami-airport.com" },
  { id: "mia-flamingo", name: "MIA Flamingo Garage", op: "Airport", kind: "garage", area: "Miami Airport", approx: true,
    geo: "Flamingo Garage, Miami International Airport", notes: ["Faces the south terminals (H / J)"],
    warn: "The most expensive government parking in this list; check current rates.", link: "https://www.miami-airport.com" },

  // ── County parks and marinas (MPA-managed) ──────────────────────────────
  ...[
    ["amelia", "Amelia Earhart Park", "Hialeah", "401 E 65th Street, Hialeah, FL", "401 E 65th Street", false],
    ["black-point", "Black Point Park & Marina", "Cutler Bay", "Black Point Park, Cutler Bay, FL", "", true],
    ["crandon", "Crandon Park & Marina", "Key Biscayne", "Crandon Park, Key Biscayne, FL", "", true],
    ["greynolds", "Greynolds Park", "North Miami Beach", "Greynolds Park, North Miami Beach, FL", "", true],
    ["haulover", "Haulover Beach Park & Marina", "Haulover", "Haulover Park, Miami Beach, FL", "", true],
    ["homestead-bayfront", "Homestead Bayfront Park & Marina", "Homestead", "Homestead Bayfront Park, Homestead, FL", "", true],
    ["matheson", "Matheson Hammock Park & Marina", "Coral Gables", "Matheson Hammock Park, Coral Gables, FL", "", true],
    ["pelican-harbor", "Pelican Harbor Park & Marina", "79th Street Causeway", "Pelican Harbor Park, Miami, FL", "", true],
    ["maceo", "Antonio Maceo Marina", "Miami River", "Antonio Maceo Park, Miami, FL", "", true],
    ["curtis", "Curtis Park Marina", "Allapattah", "Curtis Park, Miami, FL", "", true],
  ].map(([id, name, area, geo, addr, approx]) => ({
    id: "park-" + id, name, op: "County parks", kind: "lot", area, geo, addr: addr || undefined, approx,
    rate: id === "amelia" ? "Free weekdays · $4 weekends" : undefined,
    rates: id === "amelia"
      ? "Parking reported free on weekdays and $4 a car at weekends, from a travel guide rather than a county page. Verify on arrival."
      : "Park entry / parking fee set by Miami-Dade Parks; often charged at weekends, often free on quiet weekdays. Varies by park.",
    free: id === "amelia" ? "Reported free on weekdays (unverified)." : undefined,
    notes: ["Parking managed by the MPA"], link: MPA_LINK,
  })),

  // ── Coral Gables (its own municipal parking) ────────────────────────────
  ...[
    ["cg-1", "Municipal Garage 1", "garage", "245 Andalusia Avenue", ["Half a block south of Miracle Mile", "Mostly permits, small public allocation"]],
    ["cg-4", "Municipal Garage 4", "garage", "385 Andalusia Avenue", ["Miracle Mile area, public and permit", "Also listed as 345 Andalusia Ave"]],
    ["cg-5", "Municipal Garage 5", "garage", "50 Andalusia Avenue", []],
    ["cg-6", "Municipal Garage 6", "garage", "1 Aragon Avenue", ["101 public spaces plus permits"]],
    ["cg-lot-3", "Coral Gables Lot 3", "lot", "380 Aragon Avenue", ["City surface lot"]],
  ].map(([id, name, kind, addr, notes]) => ({
    id, name, op: "Coral Gables", kind, area: "Coral Gables", addr, geo: `${addr}, Coral Gables, FL 33134`,
    rate: "From about $1.50/hr", rates: "Municipal garages and lots start around $1.50 an hour. Meters run Mon–Sat daytime; free Sundays and select holidays.",
    notes, link: CG_LINK,
  })),
];

// Google Maps search text: the full address where there is one, otherwise the name.
for (const s of window.SPOTS) {
  s.q = s.addr && /\d/.test(s.addr) ? `${s.name}, ${s.geo}` : s.geo;
}

// ── Coordinates ──────────────────────────────────────────────────────────
// Geocoded from OpenStreetMap (Nominatim and Photon) on 31 Oct 2026: by street address where
// the list gives one, otherwise by the station, park or landmark the facility is named after.
// Every result was checked by hand; wrong matches were re-queried.
const COORDS = {
  "mpa-courthouse": [25.77646, -80.19446],
  "mpa-college-station": [25.77706, -80.19060],
  "mpa-knight-center": [25.77296, -80.19141],
  "mpa-regatta-harbour": [25.72945, -80.23567],
  "mpa-home-plate": [25.78013, -80.22044],
  "mpa-3rd-base": [25.77959, -80.21898],
  "mpa-1st-base": [25.77667, -80.22058],
  "mpa-center-field": [25.77664, -80.21895],
  "mpa-lot-42": [25.77101, -80.19178],
  "mpa-lot-2": [25.77538, -80.18617],
  "mpa-lot-62": [25.72841, -80.23657],
  "mpa-lot-6": [25.72602, -80.24497],
  "mpa-lot-72": [25.73212, -80.23244],
  "mpa-lot-28": [25.77015, -80.20043],
  "mpa-lot-82": [25.76549, -80.21937],
  "mpa-lot-87": [25.76536, -80.21967],
  "mpa-lot-89": [25.77619, -80.20124],
  "mpa-lot-c": [25.78947, -80.18801],
  "mpa-marine-stadium": [25.74285, -80.16989],
  "mpa-watson-ramp": [25.78446, -80.17537],
  "cty-hickman": [25.77547, -80.19858],
  "cty-cultural-center": [25.77454, -80.19789],
  "cty-overtown": [25.78141, -80.19666],
  "cty-west-lot": [25.77633, -80.19800],
  "cty-jury-lot": [25.78542, -80.21548],
  "cty-lot-25": [25.78722, -80.21490],
  "cty-courthouse": [25.77579, -80.19475],
  "cty-hickman-lot": [25.77650, -80.19906],
  "cty-graham": [25.78695, -80.21629],
  "mb-g8": [25.77506, -80.13960],
  "mb-g1": [25.77687, -80.13263],
  "mb-g2": [25.78249, -80.13326],
  "mb-g3": [25.78440, -80.13066],
  "mb-g4": [25.78845, -80.13171],
  "mb-g5": [25.79168, -80.13498],
  "mb-g6": [25.81462, -80.12761],
  "mb-g7": [25.79300, -80.13615],
  "mb-g9": [25.79148, -80.13400],
  "mb-g10": [25.79459, -80.14409],
  "mb-g11": [25.79553, -80.13352],
  "mb-g12": [25.79859, -80.12970],
  "mb-67th": [25.85052, -80.12102],
  "mb-p92": [25.85784, -80.12063],
  "mb-p100": [25.86705, -80.12887],
  "mb-p71": [25.82209, -80.13592],
  "mb-p45": [25.79288, -80.14479],
  "rail-allapattah": [25.80778, -80.21555],
  "rail-brownsville": [25.82203, -80.24071],
  "rail-coconut-grove": [25.74034, -80.24014],
  "rail-culmer": [25.78470, -80.20726],
  "rail-dadeland-north": [25.69137, -80.30625],
  "rail-dadeland-south": [25.68503, -80.31368],
  "rail-douglas-road": [25.73260, -80.25529],
  "rail-mlk": [25.83215, -80.24070],
  "rail-earlington": [25.81276, -80.22979],
  "rail-hialeah": [25.84620, -80.25977],
  "rail-overtown": [25.78092, -80.19628],
  "rail-mia": [25.79601, -80.25807],
  "rail-northside": [25.84582, -80.24882],
  "rail-okeechobee": [25.83990, -80.30175],
  "rail-palmetto": [25.84354, -80.32367],
  "rail-santa-clara": [25.79608, -80.21534],
  "rail-south-miami": [25.70543, -80.28880],
  "rail-university": [25.71312, -80.27924],
  "rail-vizcaya": [25.74949, -80.21272],
  "pnr-dolphin": [25.78395, -80.38999],
  "pnr-tamiami": [25.76038, -80.43399],
  "pnr-golden-glades": [25.92110, -80.21453],
  "pnr-127-kendall": [25.68363, -80.40075],
  "pnr-west-kendall": [25.68104, -80.45678],
  "pnr-344th": [25.44861, -80.48029],
  "pnr-coral-reef": [25.62720, -80.38236],
  "pnr-hammocks": [25.67221, -80.44309],
  "pnr-tw-152": [25.62498, -80.34618],
  "pnr-tw-112": [25.57646, -80.37532],
  "pnr-tw-168": [25.61352, -80.34949],
  "pnr-tw-197": [25.58244, -80.37100],
  "pnr-tw-244": [25.53971, -80.40862],
  "pnr-miami-gardens": [25.94165, -80.31895],
  "mia-economy": [25.78689, -80.26976],
  "mia-dolphin": [25.79594, -80.27625],
  "mia-flamingo": [25.79468, -80.27662],
  "park-amelia": [25.88691, -80.27787],
  "park-black-point": [25.54017, -80.32972],
  "park-crandon": [25.71445, -80.15745],
  "park-greynolds": [25.94174, -80.15422],
  "park-haulover": [25.91094, -80.12324],
  "park-homestead-bayfront": [25.46118, -80.33915],
  "park-matheson": [25.67738, -80.26608],
  "park-pelican-harbor": [25.84757, -80.16701],
  "park-maceo": [25.77888, -80.27893],
  "park-curtis": [25.79322, -80.23454],
  "cg-1": [25.74885, -80.25967],
  "cg-4": [25.74853, -80.26232],
  "cg-5": [25.74888, -80.25626],
  "cg-6": [25.75079, -80.25577],
  "cg-lot-3": [25.75012, -80.26231],
};
// Pins at a road intersection rather than an address: the lot is on one of its corners.
const AT_CORNER = new Set(["pnr-coral-reef", "pnr-tw-168", "pnr-miami-gardens", "pnr-tw-152", "mia-economy"]);
for (const s of window.SPOTS) {
  [s.lat, s.lng] = COORDS[s.id];
  if (AT_CORNER.has(s.id)) s.approx = true;
}
