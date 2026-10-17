// InkForge Trees - top-down canopy views. Drawn by the same engine as the side views
// (treesA.js) so colours, clumps, ink and lighting match their family.
import { TREE } from './treesA.js';

export const STAMPS_VIEWS_TREES = [
  // =========================================================================
  // tree_pine (Evergreen Pine) -> TOP VIEW (Concentric prickly star/circle canopy)
  // =========================================================================
  {
    id: 'tree_pine_top',
    name: 'Evergreen Pine (Top)',
    family: 'tree_pine',
    view: 'top',
    category: 'world_nature',
    rotate: 'free',
    group: 'tree_conifer',
    groupName: 'Conifers',
    defaultScale: 0.9,
    aspect: 1.0,
    render: (ctx, size, color = '#2c221e', fill = '#4a7a4a', seed) => TREE.topPine(ctx, size, color, fill, 201, seed),
  },

  // =========================================================================
  // tree_oak (Ancient Oak) -> TOP VIEW (Organic cloud-like canopy with branch glimpses)
  // =========================================================================
  {
    id: 'tree_oak_top',
    name: 'Ancient Oak (Top)',
    family: 'tree_oak',
    view: 'top',
    category: 'world_nature',
    rotate: 'free',
    group: 'tree_broadleaf',
    groupName: 'Broadleaf Trees',
    defaultScale: 1.0,
    aspect: 1.0,
    render: (ctx, size, color = '#2c221e', fill = '#557a46', seed) => TREE.topBroad(ctx, size, color, [fill], 202, seed),
  },

  // =========================================================================
  // tree_autumn (Autumn Maple) -> TOP VIEW (Warm golden/orange/crimson top-down canopy)
  // =========================================================================
  {
    id: 'tree_autumn_top',
    name: 'Autumn Maple (Top)',
    family: 'tree_autumn',
    view: 'top',
    category: 'world_nature',
    rotate: 'free',
    group: 'tree_broadleaf',
    groupName: 'Broadleaf Trees',
    defaultScale: 1.0,
    aspect: 1.0,
    render: (ctx, size, color = '#3f2212', fill = '#d97706', seed) => TREE.topBroad(ctx, size, color, [fill, '#c8402a', '#e0a030'], 203, seed),
  },

  // =========================================================================
  // tree_dead (Gnarled Dead Tree) -> TOP VIEW (Radial twisted skeletal branches)
  // =========================================================================
  {
    id: 'tree_dead_top',
    name: 'Gnarled Dead Tree (Top)',
    family: 'tree_dead',
    view: 'top',
    category: 'world_nature',
    rotate: 'free',
    group: 'tree_dead_grp',
    groupName: 'Dead & Gnarled',
    defaultScale: 0.9,
    aspect: 1.0,
    render: (ctx, size, color = '#1c1917', fill, seed) => TREE.topDead(ctx, size, color, 204, seed),
  },

  // =========================================================================
  // tree_palm (Palm Tree) -> TOP VIEW (Radial starburst of arched fronds + coconuts)
  // =========================================================================
  {
    id: 'tree_palm_top',
    name: 'Palm Tree (Top)',
    family: 'tree_palm',
    view: 'top',
    category: 'world_nature',
    rotate: 'free',
    group: 'tree_palms',
    groupName: 'Palms',
    defaultScale: 0.9,
    aspect: 1.0,
    render: (ctx, size, color = '#2c221e', fill = '#4f9e48', seed) => TREE.topPalm(ctx, size, color, fill, 229, seed),
  }
];
