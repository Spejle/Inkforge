import test from 'node:test';
import assert from 'node:assert/strict';
import { orderOf } from '../src/utils/layout.js';

test('every layout keeps the canvas between or beside the panels in a consistent order', () => {
  const sides = [['left', 'right'], ['right', 'left'], ['left', 'left'], ['right', 'right']];
  for (const [toolbarSide, panelSide] of sides) {
    const o = orderOf({ toolbarSide, panelSide });
    assert.equal(new Set([o.toolbar, o.stage, o.panel]).size, 3, 'distinct slots');
    assert.equal(o.toolbar < o.stage, toolbarSide === 'left', 'toolbar side');
    assert.equal(o.panel < o.stage, panelSide === 'left', 'panel side');
  }
});
