// Weather: seeded rain or snow drawn over the map.

/** Rain streaks or snowflakes scattered over the map; seeded, so a redraw or an export looks the same. */
export function drawWeather(ctx, width, height, kind, amount) {
  let seed = 1234567;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const unit = Math.max(width, height) / 1000; // sizes are relative to the map, so a big map is not sparse
  const n = Math.round(amount * (kind === 'snow' ? 900 : 1500) * (width * height) / 1e6);
  ctx.save();
  if (kind === 'snow') {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(rnd() * width, rnd() * height, (0.8 + rnd() * 2.2) * unit * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = 'rgba(200,220,240,0.45)';
    ctx.lineWidth = Math.max(1, unit * 1.1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = rnd() * width, y = rnd() * height, len = (14 + rnd() * 20) * unit;
      ctx.moveTo(x, y);
      ctx.lineTo(x - len * 0.25, y + len);
    }
    ctx.stroke();
  }
  ctx.restore();
}
