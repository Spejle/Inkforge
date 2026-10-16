// Turns a validated stamp (declarative shapes or an embedded image) into the def.render(ctx, size, color, fill, seed)
// function the stamp catalog uses. Shapes live in a 0-100 box, scaled to `size`.

const imgs = new Map();
/** Decodes an image stamp; calls onLoad once so the app can repaint (render() draws nothing until then). */
export function preloadImage(src, onLoad) {
  if (typeof Image === 'undefined' || imgs.has(src)) return;
  const im = new Image();
  imgs.set(src, im);
  im.onload = () => onLoad && onLoad();
  im.src = src;
}

function paint(ctx, sh, color, fill) {
  const pick = (c) => (c === '$color' ? color : c === '$fill' ? fill : c);
  const f = pick(sh.fill), st = pick(sh.stroke);
  ctx.globalAlpha = sh.opacity ?? 1;
  if (f && f !== 'none') { ctx.fillStyle = f; (sh.path2d ? ctx.fill(sh.path2d) : ctx.fill()); }
  if (st && st !== 'none') { ctx.strokeStyle = st; ctx.lineWidth = sh.lineWidth ?? 1; ctx.lineJoin = 'round'; (sh.path2d ? ctx.stroke(sh.path2d) : ctx.stroke()); }
}

export function makeRender(stamp) {
  if (stamp.image) {
    return (ctx, size) => {
      const im = imgs.get(stamp.image);
      if (im && im.complete && im.naturalWidth) ctx.drawImage(im, 0, 0, size * (stamp.aspect || 1), size);
    };
  }
  return (ctx, size, color = '#2c221e', fill = '#f2ebd9') => {
    const k = size / 100;
    ctx.save();
    ctx.scale(k, k);
    for (const sh of stamp.vector) {
      ctx.beginPath();
      let p2 = null;
      if (sh.type === 'circle') ctx.arc(sh.cx, sh.cy, sh.r, 0, Math.PI * 2);
      else if (sh.type === 'rect') (sh.rx ? ctx.roundRect(sh.x, sh.y, sh.w, sh.h, sh.rx) : ctx.rect(sh.x, sh.y, sh.w, sh.h));
      else if (sh.type === 'polygon') { sh.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }
      else p2 = new Path2D(sh.d); // SVG path data: geometry only, validated against a character allow-list
      paint(ctx, { ...sh, path2d: p2 }, color, fill);
    }
    ctx.restore();
  };
}
