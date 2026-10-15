import { STAMPS_TREESA } from './treesA.js';
import { STAMPS_TREESB } from './treesB.js';
import { STAMPS_SETTLEMENTSA } from './settlementsA.js';
import { STAMPS_SETTLEMENTSB } from './settlementsB.js';
import { STAMPS_VIEWS_BATTLE } from './viewsBattle.js';
import { STAMPS_VIEWS_TOKENS } from './viewsTokens.js';
import { STAMPS_VIEWS_NAUTICAL } from './viewsNautical.js';
import { STAMPS_VIEWS_LAND } from './viewsLand.js';
import { STAMPS_VIEWS_CIVA } from './viewsCivA.js';
import { STAMPS_VIEWS_CIVB } from './viewsCivB.js';

export const EXTRA_STAMPS = [
  ...STAMPS_TREESA, ...STAMPS_TREESB, ...STAMPS_SETTLEMENTSA, ...STAMPS_SETTLEMENTSB,
  // extra viewing directions of directional stamps (family / view)
  ...STAMPS_VIEWS_BATTLE, ...STAMPS_VIEWS_TOKENS, ...STAMPS_VIEWS_NAUTICAL, ...STAMPS_VIEWS_LAND, ...STAMPS_VIEWS_CIVA, ...STAMPS_VIEWS_CIVB
];
