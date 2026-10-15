// Map "cores": what a new map starts as, and which brushes and stamps it offers.
// `mode` is the renderer mode ('world' paints ocean, ripples and sand; 'battle' is a flat tabletop).
import { BIOMES } from './biomesCatalog.js';

const WORLD_STAMPS = ['world_nature', 'world_civilization', 'world_nautical'];
const WORLD_BIOMES = ['grassland', 'parchment', 'desert', 'snow', 'badlands', 'swamp_mire', 'lava_molten', 'shallows', 'deep_ocean', 'forest_floor', 'savanna', 'tundra', 'jungle', 'ash_waste', 'farmland'];
const hex = (size) => ({ enabled: true, type: 'hex_flat', size, opacity: 0.12, color: '#1e293b', offsetX: 0, offsetY: 0, snap: false });
const square = (size) => ({ enabled: true, type: 'square', size, opacity: 0.22, color: '#1e293b', offsetX: 0, offsetY: 0, snap: true });
const noGrid = { enabled: false, type: 'hex_flat', size: 64, opacity: 0.08, color: '#1e293b', offsetX: 0, offsetY: 0, snap: false };
const aged = { vignette: 0.35, parchmentGrain: 0.25, sepia: 0.15, brightness: 1.0 };
const clean = { vignette: 0.15, parchmentGrain: 0.05, sepia: 0, brightness: 1.0 };

export const TEMPLATES = [
  {
    id: 'world', name: 'World Map', mode: 'world', icon: 'Globe',
    desc: 'Continents, oceans, mountain ranges and kingdoms. Ocean backdrop, coast ripples, hex overlay.',
    sizes: [{ name: 'Small', w: 1920, h: 1080 }, { name: 'Standard', w: 3200, h: 2000 }, { name: 'Large', w: 4800, h: 3000 }], defaultSize: 1,
    grid: noGrid, atmosphere: aged, stampCategories: WORLD_STAMPS, biomes: WORLD_BIOMES,
    defaultBiome: 'grassland', defaultStamp: 'mountain_grand'
  },
  {
    id: 'region', name: 'Region Map', mode: 'world', icon: 'Map',
    desc: 'A kingdom, coast or valley: towns, roads, rivers, forests and ruins.',
    sizes: [{ name: 'Small', w: 1920, h: 1280 }, { name: 'Standard', w: 2800, h: 1800 }, { name: 'Large', w: 4000, h: 2600 }], defaultSize: 1,
    grid: hex(48), atmosphere: aged, stampCategories: WORLD_STAMPS, biomes: WORLD_BIOMES,
    defaultBiome: 'grassland', defaultStamp: 'tr_oak'
  },
  {
    id: 'town', name: 'Town & City', mode: 'battle', icon: 'Castle',
    desc: 'Streets, markets and walls. Settlements, buildings, trees and props on flat ground.',
    sizes: [{ name: 'Village', w: 1600, h: 1200 }, { name: 'Town', w: 2400, h: 1600 }, { name: 'City', w: 3600, h: 2400 }], defaultSize: 1,
    grid: square(60), atmosphere: clean,
    stampCategories: ['world_civilization', 'world_nature', 'battle_props'],
    biomes: ['grassland', 'farmland', 'cobblestone_town', 'dirt_cave', 'forest_floor', 'savanna', 'parchment', 'wooden_planks', 'shallows', 'snow'],
    defaultBiome: 'cobblestone_town', defaultStamp: 'set_human_village'
  },
  {
    id: 'battle', name: 'Battle Map', mode: 'battle', icon: 'Swords',
    desc: 'Outdoor encounter on a 5 ft square grid: terrain, cover, props and tokens.',
    sizes: [{ name: 'Skirmish', w: 1400, h: 1050 }, { name: 'Standard', w: 1960, h: 1400 }, { name: 'Large', w: 2800, h: 2100 }], defaultSize: 1,
    grid: square(70), atmosphere: clean,
    stampCategories: ['world_nature', 'battle_props', 'battle_tokens', 'battle_rooms'],
    biomes: ['grassland', 'forest_floor', 'savanna', 'desert', 'snow', 'tundra', 'swamp_mire', 'jungle', 'badlands', 'ash_waste', 'lava_molten', 'shallows', 'dirt_cave', 'farmland'],
    defaultBiome: 'grassland', defaultStamp: 'tr_oak'
  },
  {
    id: 'dungeon', name: 'Dungeon', mode: 'battle', icon: 'Skull',
    desc: 'Rooms, corridors, doors and traps on a dark square grid. Dungeon-only brushes and stamps.',
    sizes: [{ name: 'Small', w: 1400, h: 1050 }, { name: 'Standard', w: 1960, h: 1400 }, { name: 'Large', w: 2800, h: 2100 }], defaultSize: 1,
    grid: square(70), atmosphere: { vignette: 0.5, parchmentGrain: 0.1, sepia: 0, brightness: 0.95 },
    stampCategories: ['battle_rooms', 'battle_props', 'battle_tokens'],
    biomes: ['dungeon_flagstone', 'wooden_planks', 'cobblestone_town', 'dirt_cave', 'lava_molten', 'ash_waste'],
    defaultBiome: 'dungeon_flagstone', defaultStamp: 'dungeon_wall_block'
  },
  {
    id: 'free', name: 'Free Canvas', mode: 'world', icon: 'Brush',
    desc: 'Everything unlocked: every brush and every stamp.',
    sizes: [{ name: 'Standard', w: 1920, h: 1080 }, { name: 'Large', w: 3200, h: 2000 }], defaultSize: 0,
    grid: noGrid, atmosphere: aged, stampCategories: null, biomes: null,
    defaultBiome: 'grassland', defaultStamp: 'mountain_grand'
  }
];

/** Old files only know 'world' or 'battle'. */
export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES.find((t) => t.id === (id === 'battle' ? 'battle' : 'world'));
}

export const biomesFor = (tpl) => (tpl.biomes ? BIOMES.filter((b) => tpl.biomes.includes(b.id)) : BIOMES);

/** The empty project a template starts from. */
export function blankProject(tpl, title, w, h) {
  return {
    title, type: tpl.mode, template: tpl.id, width: w, height: h,
    landmasses: [], brushStrokes: [], stamps: [], paths: [], texts: [],
    grid: tpl.grid, atmosphere: tpl.atmosphere, layers: {}, customStamps: []
  };
}
