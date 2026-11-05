// Reading .inkforge files and library entries. Anything that is not recognisably a map is refused with a message the
// user can act on, so a damaged or wrong file can never replace a map with a blank one.
import { sanitizeProject } from './importGuard.js';

/** An error whose message is meant for the user. */
export class ProjectFileError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProjectFileError';
  }
}

/**
 * Version of the map format this build writes (`formatVersion` in files and library entries).
 * Bump it when the shape changes, and add a step to MIGRATIONS that turns version n-1 into n.
 *   1: everything before formatVersion existed (files say version "1.1.0"; maps up to 1.6 have `type` but no `template`)
 *   2: formatVersion recorded; `template` always set
 */
export const FORMAT_VERSION = 2;
const MIGRATIONS = {
  2: (p) => ({ ...p, template: p.template || p.type })
};

/** Brings an older map up to FORMAT_VERSION. Refuses maps from a newer InkForge, which this one would damage. */
export function migrateProject(obj) {
  const from = obj.formatVersion === undefined ? 1 : obj.formatVersion;
  if (!Number.isInteger(from) || from < 1) throw new ProjectFileError('This map has an unknown format version.');
  if (from > FORMAT_VERSION) {
    throw new ProjectFileError(`This map was saved by a newer version of InkForge (format ${from}; this one reads up to ${FORMAT_VERSION}). Update InkForge to open it. Nothing was changed.`);
  }
  let p = obj;
  for (let v = from + 1; v <= FORMAT_VERSION; v++) p = MIGRATIONS[v](p);
  return { ...p, formatVersion: FORMAT_VERSION };
}

const MAP_KEYS = ['landmasses', 'brushStrokes', 'stamps', 'paths', 'texts', 'width', 'height', 'title', 'template', 'type'];

/** Checks a parsed value is a map, then returns it sanitised. Throws ProjectFileError otherwise. */
export function readProject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new ProjectFileError('This file is not an InkForge map.');
  if (obj.format === 'inkforge-plugin') throw new ProjectFileError('This is a content pack, not a map. Install it in Settings > Plugins.');
  if (!MAP_KEYS.some((k) => Object.hasOwn(obj, k))) throw new ProjectFileError('This file is not an InkForge map.');
  return sanitizeProject(migrateProject(obj));
}

/** Parses the text of an .inkforge file. Throws ProjectFileError with a readable message. */
export function parseProjectText(text) {
  if (typeof text !== 'string' || !text.trim()) throw new ProjectFileError('The file is empty.');
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new ProjectFileError('The file is damaged or incomplete (not valid JSON). Nothing was changed.');
  }
  return readProject(obj);
}
