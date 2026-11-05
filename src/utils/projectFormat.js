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

const MAP_KEYS = ['landmasses', 'brushStrokes', 'stamps', 'paths', 'texts', 'width', 'height', 'title', 'template', 'type'];

/** Checks a parsed value is a map, then returns it sanitised. Throws ProjectFileError otherwise. */
export function readProject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new ProjectFileError('This file is not an InkForge map.');
  if (obj.format === 'inkforge-plugin') throw new ProjectFileError('This is a content pack, not a map. Install it in Settings > Plugins.');
  if (!MAP_KEYS.some((k) => Object.hasOwn(obj, k))) throw new ProjectFileError('This file is not an InkForge map.');
  return sanitizeProject(obj);
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
