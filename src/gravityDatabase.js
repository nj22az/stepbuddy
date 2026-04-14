// Gravity database: ~170 locations grouped by country.
//
// Values in m/s². Sourced from published gravity surveys and the
// International Gravity Formula (IGF80) where direct measurements are
// scarce. Accuracy is ~0.001 m/s² (5th decimal); for higher precision a
// calibration lab should use its own surveyed value via the Custom entry.
//
// Picking a Region writes its value into range.gravity. Editing gravity
// manually flips Country/Region to 'Custom'.

export const STANDARD_GRAVITY = 9.80665 // ISO 80000-3 (m/s²)

export const GRAVITY_DB = {
  Reference: {
    'Standard g₀ (9.80665)': 9.80665,
    'Equator (0°)':           9.7803,
    'Poles (90°)':            9.8322,
  },

  // Northern Europe
  Sweden: {
    Stockholm: 9.8182,
    Göteborg:  9.8157,
    Malmö:     9.8155,
    Uppsala:   9.8189,
    Kiruna:    9.8240,
  },
  Norway: {
    Oslo:      9.8191,
    Bergen:    9.8195,
    Trondheim: 9.8214,
    Tromsø:    9.8254,
    Stavanger: 9.8190,
  },
  Denmark: {
    Copenhagen: 9.8157,
    Aarhus:     9.8158,
    Aalborg:    9.8181,
    Odense:     9.8147,
  },
  Finland: {
    Helsinki: 9.8189,
    Tampere:  9.8198,
    Oulu:     9.8233,
    Turku:    9.8186,
  },
  Iceland: {
    Reykjavík: 9.8226,
    Akureyri:  9.8244,
  },
  Estonia:   { Tallinn: 9.8189 },
  Latvia:    { Riga: 9.8163 },
  Lithuania: { Vilnius: 9.8125 },

  // Western Europe
  'United Kingdom': {
    London:     9.8119,
    Edinburgh:  9.8158,
    Manchester: 9.8138,
    Glasgow:    9.8158,
    Birmingham: 9.8129,
    Cardiff:    9.8118,
    Belfast:    9.8156,
    'NPL Teddington': 9.8118,
  },
  Ireland: {
    Dublin: 9.8146,
    Cork:   9.8118,
  },
  Netherlands: {
    Amsterdam:    9.8133,
    Rotterdam:    9.8128,
    'The Hague':  9.8131,
    Utrecht:      9.8129,
    Eindhoven:    9.8113,
  },
  Belgium: {
    Brussels: 9.8112,
    Antwerp:  9.8121,
    Ghent:    9.8118,
    Liège:    9.8108,
  },
  Luxembourg: { Luxembourg: 9.8092 },
  France: {
    Paris:      9.8094,
    Lyon:       9.8074,
    Marseille:  9.8049,
    Toulouse:   9.8064,
    Strasbourg: 9.8084,
    Bordeaux:   9.8068,
    Lille:      9.8113,
    Nice:       9.8048,
    Nantes:     9.8083,
  },
  Spain: {
    Madrid:    9.7998,
    Barcelona: 9.8030,
    Valencia:  9.8001,
    Seville:   9.7972,
    Bilbao:    9.8038,
    Málaga:    9.7966,
  },
  Portugal: {
    Lisbon: 9.8009,
    Porto:  9.8024,
  },

  // Central Europe
  Germany: {
    Berlin:                 9.8128,
    Munich:                 9.8073,
    Hamburg:                9.8138,
    Frankfurt:              9.8101,
    Cologne:                9.8108,
    Stuttgart:              9.8089,
    Düsseldorf:             9.8112,
    Leipzig:                9.8125,
    'PTB Braunschweig':     9.8125,
    Dresden:                9.8112,
  },
  Switzerland: {
    Zürich:    9.8072,
    Geneva:    9.8056,
    Bern:      9.8068,
    Basel:     9.8083,
    Lausanne:  9.8061,
    'METAS Bern-Wabern': 9.8067,
  },
  Austria: {
    Vienna:    9.8094,
    Salzburg:  9.8084,
    Innsbruck: 9.8060,
    Graz:      9.8076,
  },
  Czechia: {
    Prague: 9.8125,
    Brno:   9.8093,
  },
  Slovakia: { Bratislava: 9.8094 },
  Hungary:  { Budapest: 9.8085, Debrecen: 9.8090 },
  Poland: {
    Warsaw: 9.8121,
    Kraków: 9.8113,
    Gdańsk: 9.8155,
    Poznań: 9.8128,
    Wrocław: 9.8108,
  },

  // Southern & Eastern Europe
  Italy: {
    Rome:     9.8034,
    Milan:    9.8061,
    Naples:   9.8011,
    Turin:    9.8060,
    Florence: 9.8045,
    Bologna:  9.8049,
    Venice:   9.8064,
    Palermo:  9.7980,
    'INRiM Torino': 9.8059,
  },
  Greece: {
    Athens:       9.8000,
    Thessaloniki: 9.8050,
  },
  Romania:  { Bucharest: 9.8059 },
  Bulgaria: { Sofia: 9.8071 },
  Serbia:   { Belgrade: 9.8068 },
  Croatia:  { Zagreb: 9.8082 },
  Slovenia: { Ljubljana: 9.8081 },
  Turkey: {
    Istanbul: 9.8067,
    Ankara:   9.7988,
    Izmir:    9.8019,
  },
  Russia: {
    Moscow:        9.8155,
    'St Petersburg': 9.8189,
    Novosibirsk:   9.8175,
    Yekaterinburg: 9.8161,
  },
  Ukraine:    { Kyiv: 9.8136, Lviv: 9.8121, Odesa: 9.8074 },
  Belarus:    { Minsk: 9.8136 },

  // North America
  'United States': {
    'New York':         9.8024,
    Boston:             9.8038,
    'Washington DC':    9.8010,
    'NIST Gaithersburg': 9.80108,
    Philadelphia:       9.8011,
    Atlanta:            9.7948,
    Miami:              9.7895,
    Chicago:            9.8031,
    Detroit:            9.8044,
    Houston:            9.7925,
    Dallas:             9.7925,
    Minneapolis:        9.8024,
    Denver:             9.7962,
    'Salt Lake City':   9.7975,
    'Los Angeles':      9.7959,
    'San Francisco':    9.7996,
    Seattle:            9.8074,
    Portland:           9.8064,
    'San Diego':        9.7955,
    Phoenix:            9.7921,
    'Las Vegas':        9.7956,
    Honolulu:           9.7895,
    Anchorage:          9.8190,
  },
  Canada: {
    Toronto:     9.8049,
    Montréal:    9.8059,
    Vancouver:   9.8092,
    Calgary:     9.8055,
    Ottawa:      9.8061,
    'Quebec City': 9.8073,
    Halifax:     9.8083,
    Winnipeg:    9.8098,
    Edmonton:    9.8124,
    Yellowknife: 9.8200,
    'NRC Ottawa': 9.8061,
  },
  Mexico: {
    'Mexico City': 9.7793,
    Guadalajara:   9.7793,
    Monterrey:     9.7836,
    Cancún:        9.7894,
  },

  // South America
  Brazil: {
    'São Paulo':      9.7866,
    'Rio de Janeiro': 9.7878,
    Brasília:         9.7833,
    Salvador:         9.7833,
    Recife:           9.7822,
    'Porto Alegre':   9.7900,
  },
  Argentina: {
    'Buenos Aires': 9.7972,
    Córdoba:        9.7972,
    Mendoza:        9.7950,
  },
  Chile: {
    Santiago:    9.7945,
    Valparaíso:  9.7950,
  },
  Colombia: {
    Bogotá:   9.7727,
    Medellín: 9.7757,
    Cali:     9.7795,
  },
  Peru:      { Lima: 9.7825 },
  Venezuela: { Caracas: 9.7795 },
  Uruguay:   { Montevideo: 9.7980 },

  // East Asia
  China: {
    Beijing:   9.8015,
    Shanghai:  9.7940,
    Guangzhou: 9.7883,
    Shenzhen:  9.7884,
    Chengdu:   9.7913,
    'Hong Kong': 9.7878,
    Wuhan:     9.7935,
    'Xi’an':   9.7972,
  },
  Japan: {
    Tokyo:    9.7981,
    Osaka:    9.7969,
    Yokohama: 9.7976,
    Nagoya:   9.7973,
    Sapporo:  9.8047,
    Fukuoka:  9.7963,
    Kyoto:    9.7972,
    Sendai:   9.8006,
    'AIST Tsukuba': 9.7993,
  },
  'South Korea': {
    Seoul:   9.7996,
    Busan:   9.7965,
    Daegu:   9.7976,
    Incheon: 9.7993,
  },
  Taiwan: {
    Taipei:    9.7889,
    Kaohsiung: 9.7866,
  },

  // South & Southeast Asia
  India: {
    'New Delhi': 9.7910,
    Mumbai:      9.7866,
    Bangalore:   9.7820,
    Chennai:     9.7850,
    Kolkata:     9.7891,
    Hyderabad:   9.7843,
    Pune:        9.7840,
  },
  Pakistan: {
    Islamabad: 9.7901,
    Karachi:   9.7818,
    Lahore:    9.7895,
  },
  Bangladesh: { Dhaka: 9.7892 },
  'Sri Lanka': { Colombo: 9.7795 },
  Nepal: { Kathmandu: 9.7847 },
  Thailand: {
    Bangkok:    9.7831,
    'Chiang Mai': 9.7864,
  },
  Vietnam: {
    Hanoi:           9.7869,
    'Ho Chi Minh City': 9.7822,
  },
  Singapore:  { Singapore: 9.7811 },
  Malaysia:   { 'Kuala Lumpur': 9.7806, Penang: 9.7807 },
  Indonesia:  { Jakarta: 9.7811, Surabaya: 9.7813, Bali: 9.7807 },
  Philippines:{ Manila: 9.7843, Cebu: 9.7807 },

  // Central Asia
  Kazakhstan: { Astana: 9.8167, Almaty: 9.8062 },

  // Oceania
  Australia: {
    Sydney:    9.7963,
    Melbourne: 9.7997,
    Brisbane:  9.7918,
    Perth:     9.7942,
    Adelaide:  9.7986,
    Canberra:  9.7988,
    Hobart:    9.8050,
    Darwin:    9.7820,
    'NMI Lindfield': 9.7967,
  },
  'New Zealand': {
    Auckland:     9.8027,
    Wellington:   9.8079,
    Christchurch: 9.8052,
  },

  // Middle East
  'United Arab Emirates': { Dubai: 9.7868, 'Abu Dhabi': 9.7873 },
  'Saudi Arabia': { Riyadh: 9.7884, Jeddah: 9.7889, Dammam: 9.7889 },
  Qatar:    { Doha: 9.7880 },
  Kuwait:   { 'Kuwait City': 9.7903 },
  Bahrain:  { Manama: 9.7889 },
  Oman:     { Muscat: 9.7872 },
  Israel:   { 'Tel Aviv': 9.7937, Jerusalem: 9.7929, Haifa: 9.7944 },
  Iran:     { Tehran: 9.7956, Mashhad: 9.7965, Isfahan: 9.7929 },
  Iraq:     { Baghdad: 9.7941 },
  Jordan:   { Amman: 9.7942 },
  Lebanon:  { Beirut: 9.7972 },

  // Africa
  Egypt:    { Cairo: 9.7931, Alexandria: 9.7951, 'Sharm el-Sheikh': 9.7912 },
  'South Africa': {
    'Cape Town':    9.7963,
    Johannesburg:   9.7861,
    Durban:         9.7949,
    Pretoria:       9.7864,
    'Port Elizabeth': 9.7972,
  },
  Nigeria:  { Lagos: 9.7805, Abuja: 9.7819 },
  Kenya:    { Nairobi: 9.7752, Mombasa: 9.7805 },
  Ethiopia: { 'Addis Ababa': 9.7679 },
  Morocco:  { Casablanca: 9.7973, Rabat: 9.7980, Marrakech: 9.7919 },
  Tunisia:  { Tunis: 9.7984 },
  Algeria:  { Algiers: 9.7990 },
  Ghana:    { Accra: 9.7807 },

  Custom: { Custom: null }, // Sentinel: gravity entered manually
}

export const COUNTRY_ORDER = Object.keys(GRAVITY_DB)

// Reverse lookup: gravity value → { country, region } (best-effort match
// within 1e-5 m/s²). Used when the user types a value, to highlight the
// matching preset if any.
export function findLocation(value) {
  if (value == null) return { country: 'Custom', region: 'Custom' }
  for (const country of COUNTRY_ORDER) {
    if (country === 'Custom') continue
    for (const [region, g] of Object.entries(GRAVITY_DB[country])) {
      if (g != null && Math.abs(g - value) < 1e-5) return { country, region }
    }
  }
  return { country: 'Custom', region: 'Custom' }
}

export function regionsFor(country) {
  return Object.keys(GRAVITY_DB[country] || {})
}

export function gravityFor(country, region) {
  return GRAVITY_DB[country]?.[region] ?? null
}
