import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

/**
 * A dark, low-contrast basemap designed to fit the Frostbite site.
 *
 * Data: OpenFreeMap vector tiles (OpenStreetMap data, free, no API key).
 * Styling: midnight land and water, subtle roads and borders, muted labels, and restrained POI accents.
 * No sprite is used, so there is nothing else to download.
 */

const C = {
  land: '#0b0c12',
  water: '#101c2a',
  waterLabel: '#718ba8',
  park: '#14271f',
  grass: '#111f1a',
  building: '#171b24',
  buildingEdge: '#242a35',
  roadFill: '#252b35',
  roadCasing: '#141820',
  primaryFill: '#34313a',
  primaryCasing: '#4b414e',
  highwayFill: '#41372d',
  highwayCasing: '#5a4935',
  text: '#d8dde6',
  textMuted: '#a3adbd',
  textFaint: '#798496',
  halo: '#0b0c12',
};

// `any` keeps the expression helpers readable; the finished style is validated in the build step.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Expr = any;

const NAME: Expr = ['coalesce', ['get', 'name_en'], ['get', 'name']];
const zoomLinear = (...stops: number[]): Expr => ['interpolate', ['linear'], ['zoom'], ...stops];
const zoomExp = (...stops: number[]): Expr => ['interpolate', ['exponential', 1.2], ['zoom'], ...stops];
const isLine: Expr = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];
const cls = (...names: string[]): Expr => ['match', ['get', 'class'], names, true, false];
const notBridgeTunnel: Expr = ['match', ['get', 'brunnel'], ['bridge', 'tunnel'], false, true];
const VT = 'openmaptiles';

const road = (
  id: string,
  classes: string[],
  paint: { color: string; width: Expr; minzoom?: number; extra?: Expr[]; opacity?: Expr },
): LayerSpecification => ({
  id,
  type: 'line',
  source: VT,
  'source-layer': 'transportation',
  ...(paint.minzoom !== undefined ? { minzoom: paint.minzoom } : {}),
  filter: ['all', isLine, cls(...classes), ...(paint.extra ?? [])],
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': paint.color,
    'line-width': paint.width,
    ...(paint.opacity ? { 'line-opacity': paint.opacity } : {}),
  },
});

const noRamp: Expr = ['!=', ['get', 'ramp'], 1];
const yesRamp: Expr = ['==', ['get', 'ramp'], 1];

const poiColor: Expr = [
  'match', ['get', 'class'],
  ['restaurant', 'cafe', 'fast_food', 'bar', 'ice_cream', 'bakery', 'pub', 'food_court'], '#b87842',
  ['shop', 'grocery', 'clothing_store', 'department_store', 'furniture', 'florist', 'jewelry', 'bicycle', 'convenience', 'mall'], '#688dbb',
  ['lodging', 'hotel'], '#b56f94',
  ['park', 'garden', 'zoo', 'campsite'], '#4f9470',
  ['hospital', 'pharmacy', 'dentist', 'doctors', 'clinic'], '#c46c68',
  ['museum', 'attraction', 'theatre', 'cinema', 'library', 'art_gallery'], '#579ba5',
  '#838c9b',
];

const poiLayers = (suffix: string, minzoom: number, rank: Expr): LayerSpecification[] => [
  {
    id: `poi_dot_${suffix}`,
    type: 'circle',
    source: VT,
    'source-layer': 'poi',
    minzoom,
    filter: ['all', ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false], rank],
    paint: {
      'circle-color': poiColor,
      'circle-radius': zoomLinear(15, 3.5, 19, 6),
      'circle-stroke-color': C.halo,
      'circle-stroke-width': 1.5,
    },
  },
  {
    id: `poi_label_${suffix}`,
    type: 'symbol',
    source: VT,
    'source-layer': 'poi',
    minzoom: minzoom + 0.5,
    filter: ['all', ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false], rank],
    layout: {
      'text-field': NAME,
      'text-font': ['Noto Sans Regular'],
      'text-size': 11.5,
      'text-anchor': 'left',
      'text-offset': [0.8, 0],
      'text-max-width': 8,
      'text-optional': true,
    },
    paint: {
      'text-color': poiColor,
      'text-halo-color': C.halo,
      'text-halo-width': 1.5,
    },
  },
];

const placeLabel = (
  id: string,
  filter: Expr,
  size: Expr,
  opts: { font?: string; color?: string; minzoom?: number; maxzoom?: number; upper?: boolean; spacing?: number } = {},
): LayerSpecification => ({
  id,
  type: 'symbol',
  source: VT,
  'source-layer': 'place',
  ...(opts.minzoom !== undefined ? { minzoom: opts.minzoom } : {}),
  ...(opts.maxzoom !== undefined ? { maxzoom: opts.maxzoom } : {}),
  filter,
  layout: {
    'text-field': NAME,
    'text-font': [opts.font ?? 'Noto Sans Regular'],
    'text-size': size,
    'text-max-width': 7,
    'text-letter-spacing': opts.spacing ?? 0,
    'text-transform': opts.upper ? 'uppercase' : 'none',
    'symbol-sort-key': ['get', 'rank'],
  },
  paint: {
    'text-color': opts.color ?? C.text,
    'text-halo-color': C.halo,
    'text-halo-width': 1.6,
    'text-halo-blur': 0.5,
  },
});

const roadLabel = (id: string, classes: string[], minzoom: number): LayerSpecification => ({
  id,
  type: 'symbol',
  source: VT,
  'source-layer': 'transportation_name',
  minzoom,
  filter: ['all', isLine, cls(...classes)],
  layout: {
    'symbol-placement': 'line',
    'text-field': NAME,
    'text-font': ['Noto Sans Regular'],
    'text-size': zoomLinear(13, 11, 18, 14),
    'text-rotation-alignment': 'map',
    'text-pitch-alignment': 'viewport',
  },
  paint: { 'text-color': C.textMuted, 'text-halo-color': C.halo, 'text-halo-width': 2 },
});

export const GOOGLE_STYLE: StyleSpecification = {
  version: 8,
  name: 'Frostbite / Midnight',
  sources: {
    [VT]: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution:
        '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> ' +
        '<a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a> ' +
        'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    },
  },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': C.land } },

    // ---- Land cover / land use -------------------------------------------------------------
    { id: 'landcover_ice', type: 'fill', source: VT, 'source-layer': 'landcover', filter: cls('ice'), paint: { 'fill-color': '#222a35' } },
    { id: 'landcover_grass', type: 'fill', source: VT, 'source-layer': 'landcover', filter: cls('grass', 'wood'), paint: { 'fill-color': C.grass, 'fill-opacity': 0.55 } },
    { id: 'landcover_sand', type: 'fill', source: VT, 'source-layer': 'landcover', filter: cls('sand'), paint: { 'fill-color': '#272a2e' } },
    { id: 'park', type: 'fill', source: VT, 'source-layer': 'park', paint: { 'fill-color': C.park, 'fill-opacity': 0.85 } },
    { id: 'landuse_green', type: 'fill', source: VT, 'source-layer': 'landuse', filter: cls('pitch', 'track', 'cemetery'), paint: { 'fill-color': C.park, 'fill-opacity': 0.8 } },
    { id: 'landuse_hospital', type: 'fill', source: VT, 'source-layer': 'landuse', filter: cls('hospital'), paint: { 'fill-color': '#2a2027' } },
    { id: 'landuse_school', type: 'fill', source: VT, 'source-layer': 'landuse', filter: cls('school', 'university', 'college'), paint: { 'fill-color': '#20232c' } },

    // ---- Water -----------------------------------------------------------------------------
    {
      id: 'waterway', type: 'line', source: VT, 'source-layer': 'waterway', filter: isLine,
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': C.water, 'line-width': zoomLinear(8, 0.6, 14, 2, 20, 8) },
    },
    { id: 'water', type: 'fill', source: VT, 'source-layer': 'water', filter: ['!=', ['get', 'brunnel'], 'tunnel'], paint: { 'fill-color': C.water } },

    // ---- Airports, buildings ---------------------------------------------------------------
    { id: 'aeroway_fill', type: 'fill', source: VT, 'source-layer': 'aeroway', minzoom: 11, filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false], paint: { 'fill-color': '#181d26' } },
    { id: 'aeroway_runway', type: 'line', source: VT, 'source-layer': 'aeroway', minzoom: 11, filter: ['all', isLine, cls('runway', 'taxiway')], paint: { 'line-color': '#242b36', 'line-width': zoomExp(11, 2, 20, 16) } },
    {
      id: 'building', type: 'fill', source: VT, 'source-layer': 'building', minzoom: 14.5,
      paint: { 'fill-color': C.building, 'fill-outline-color': C.buildingEdge, 'fill-opacity': zoomLinear(14.5, 0, 16, 1) },
    },

    // ---- Roads: casings first, then fills (so junctions merge cleanly) ----------------------
    road('road_service_casing', ['service', 'track'], { color: C.roadCasing, minzoom: 15, width: zoomExp(15, 1, 16, 4, 20, 11) }),
    road('road_minor_casing', ['minor'], { color: C.roadCasing, minzoom: 12, width: zoomExp(12, 0.5, 13, 1, 14, 4, 20, 20), opacity: zoomLinear(12, 0, 12.5, 1) }),
    road('road_secondary_casing', ['secondary', 'tertiary'], { color: C.roadCasing, minzoom: 8, width: zoomExp(8, 1.5, 20, 17) }),
    road('road_primary_casing', ['primary', 'trunk'], { color: C.primaryCasing, minzoom: 5, width: zoomExp(5, 0.4, 6, 0.7, 7, 1.75, 20, 22) }),
    road('road_motorway_casing', ['motorway'], { color: C.highwayCasing, minzoom: 5, extra: [noRamp], width: zoomExp(5, 0.4, 6, 0.7, 7, 1.75, 20, 22) }),
    road('road_motorway_link_casing', ['motorway'], { color: C.highwayCasing, minzoom: 12, extra: [yesRamp], width: zoomExp(12, 1, 13, 3, 14, 4, 20, 15) }),
    {
      id: 'road_path', type: 'line', source: VT, 'source-layer': 'transportation', minzoom: 14,
      filter: ['all', isLine, cls('path', 'pedestrian')],
      paint: { 'line-color': '#343c49', 'line-dasharray': [1, 1.2], 'line-width': zoomExp(14, 0.6, 20, 4) },
    },

    road('road_service', ['service', 'track'], { color: C.roadFill, minzoom: 15.5, width: zoomExp(15.5, 0, 16, 2, 20, 7.5) }),
    road('road_minor', ['minor'], { color: C.roadFill, minzoom: 13.5, width: zoomExp(13.5, 0, 14, 2.5, 20, 18) }),
    road('road_secondary', ['secondary', 'tertiary'], { color: C.roadFill, minzoom: 6.5, width: zoomExp(6.5, 0, 8, 0.5, 20, 13) }),
    road('road_primary', ['primary', 'trunk'], { color: C.primaryFill, minzoom: 5, width: zoomExp(5, 0, 7, 1, 20, 18) }),
    road('road_motorway', ['motorway'], { color: C.highwayFill, minzoom: 5, extra: [noRamp], width: zoomExp(5, 0, 7, 1, 20, 18) }),
    road('road_motorway_link', ['motorway'], { color: C.highwayFill, minzoom: 12.5, extra: [yesRamp], width: zoomExp(12.5, 0, 13, 1.5, 14, 2.5, 20, 11.5) }),
    {
      id: 'rail', type: 'line', source: VT, 'source-layer': 'transportation', minzoom: 13,
      filter: ['all', isLine, cls('rail', 'transit'), notBridgeTunnel],
      paint: { 'line-color': '#343c49', 'line-dasharray': [3, 3], 'line-width': zoomExp(13, 0.5, 20, 2) },
    },

    // ---- Borders ---------------------------------------------------------------------------
    {
      id: 'boundary_state', type: 'line', source: VT, 'source-layer': 'boundary', minzoom: 4,
      filter: ['all', ['>=', ['get', 'admin_level'], 3], ['<=', ['get', 'admin_level'], 6], ['!=', ['get', 'maritime'], 1]],
      paint: { 'line-color': '#343b48', 'line-dasharray': [2, 2], 'line-width': zoomLinear(4, 0.6, 10, 1.2) },
    },
    {
      id: 'boundary_country', type: 'line', source: VT, 'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
      layout: { 'line-join': 'round' },
      paint: { 'line-color': '#505a6a', 'line-dasharray': [3, 1.5], 'line-width': zoomLinear(1, 0.7, 5, 1.2, 12, 2.2) },
    },

    // ---- POIs (coloured dots + labels, like Google's) ----------------------------------------
    ...poiLayers('major', 15, ['<', ['get', 'rank'], 7]),
    ...poiLayers('minor', 16.5, ['>=', ['get', 'rank'], 7]),

    // ---- Labels ----------------------------------------------------------------------------
    roadLabel('road_label_minor', ['minor', 'service', 'track'], 15),
    roadLabel('road_label_major', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'], 12.2),
    {
      id: 'waterway_label', type: 'symbol', source: VT, 'source-layer': 'waterway', minzoom: 10, filter: isLine,
      layout: { 'symbol-placement': 'line', 'text-field': NAME, 'text-font': ['Noto Sans Italic'], 'text-size': 12, 'text-letter-spacing': 0.15 },
      paint: { 'text-color': C.waterLabel, 'text-halo-color': 'rgba(11,12,18,0.78)', 'text-halo-width': 1.5 },
    },
    {
      id: 'water_label', type: 'symbol', source: VT, 'source-layer': 'water_name',
      layout: { 'text-field': NAME, 'text-font': ['Noto Sans Italic'], 'text-size': zoomLinear(0, 10, 8, 14), 'text-letter-spacing': 0.15, 'text-max-width': 6 },
      paint: { 'text-color': C.waterLabel, 'text-halo-color': 'rgba(11,12,18,0.78)', 'text-halo-width': 1.5 },
    },
    {
      id: 'airport_label', type: 'symbol', source: VT, 'source-layer': 'aerodrome_label', minzoom: 10, filter: ['has', 'iata'],
      layout: { 'text-field': NAME, 'text-font': ['Noto Sans Regular'], 'text-size': 11.5, 'text-max-width': 8 },
      paint: { 'text-color': C.textMuted, 'text-halo-color': C.halo, 'text-halo-width': 1.5 },
    },

    placeLabel('label_neighbourhood', ['match', ['get', 'class'], ['suburb', 'quarter', 'neighbourhood', 'hamlet'], true, false], zoomLinear(12, 10.5, 16, 13), { color: C.textFaint, minzoom: 12 }),
    placeLabel('label_village', cls('village'), zoomLinear(9, 11, 13, 13), { color: C.textMuted, minzoom: 9 }),
    placeLabel('label_town', cls('town'), zoomLinear(6, 11.5, 11, 15), { minzoom: 6 }),
    placeLabel('label_city', ['all', cls('city'), ['!=', ['get', 'capital'], 2]], zoomLinear(3, 11, 7, 14, 11, 19), { minzoom: 3 }),
    placeLabel('label_capital', ['all', cls('city'), ['==', ['get', 'capital'], 2]], zoomLinear(3, 11.5, 7, 14.5, 11, 20), { font: 'Noto Sans Bold', minzoom: 3 }),
    placeLabel('label_state', cls('state', 'province'), zoomLinear(4, 10, 8, 13), { color: C.textFaint, minzoom: 4, maxzoom: 8, upper: true, spacing: 0.1 }),
    placeLabel('label_country', cls('country'), zoomLinear(1, 10, 4, 14, 7, 18), { color: C.textMuted, font: 'Noto Sans Bold', minzoom: 1, maxzoom: 9 }),
  ],
};
