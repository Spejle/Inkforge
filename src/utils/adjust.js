// Wheel adjustments: turning scroll deltas into discrete steps and applying them to a value.

/** Accumulates scroll deltas into whole steps; one mouse notch (100) is one step, a trackpad needs a longer swipe. */
export function makeStepper(threshold = 100) {
  let acc = 0;
  return (delta) => {
    if (!delta) return 0;
    if (Math.sign(delta) !== Math.sign(acc)) acc = 0; // a reversal starts over
    acc += delta;
    const steps = Math.trunc(acc / threshold);
    acc -= steps * threshold;
    return steps === 0 ? 0 : -steps; // scrolling up (negative delta) grows
  };
}

/** `value` scaled by factor^steps within [min, max], rounded to `decimals`; always moves at least one unit when it can. */
export function stepScale(value, steps, { min, max, factor = 1.08, decimals = 0 }) {
  const unit = 10 ** -decimals;
  let next = Number((value * factor ** steps).toFixed(decimals));
  if (next === value && steps !== 0) next = value + Math.sign(steps) * unit;
  return Number(Math.min(max, Math.max(min, next)).toFixed(decimals));
}

/** `rad` turned by steps * degrees, wrapped into (-PI, PI]. */
export function stepAngle(rad, steps, degrees) {
  let a = rad + (steps * degrees * Math.PI) / 180;
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a <= -Math.PI) a += 2 * Math.PI;
  return Number(a.toFixed(3));
}
