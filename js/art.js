/* art.js: procedural pixel art for tiles, sprites, and scenery. */
(() => {
  'use strict';
  const NES = window.NES;
  const px = NES.px;

  const STARFIELD = Array.from({ length: 64 }, (_, i) => ({
    x: (i * 97 + 31) % 256,
    y: (i * 53 + 17) % 150 + 8,
    s: (i % 3) + 1,
    p: i * 0.73,
  }));

  // ── Characters ───────────────────────────────────────────────
  NES.drawPlayer = (c, x, y, power, facing, frame, moving, air, scale = 1) => {
    const fire = power === 2;
    const red = fire ? '#fff4e0' : '#e73c2e';
    const redDark = fire ? '#c8b8a0' : '#a51f1b';
    const blue = fire ? '#e73c2e' : '#2451d8';
    const blueDark = fire ? '#a51f1b' : '#15318f';
    const skin = '#ffc58f';
    const skinDark = '#d98a55';
    const hair = '#4a210c';
    const shoe = '#5c2a0a';
    const gold = '#ffd24a';
    const white = '#fff6e6';

    c.save();
    c.translate(Math.round(x + (facing < 0 ? 12 * scale : 0)), Math.round(y));
    c.scale(facing < 0 ? -scale : scale, scale);

    if (power === 0) {
      const bob = !air && moving ? [0, 0, 1, 0][frame % 4] : 0;
      px(c, 2, bob, 8, 2, red);
      px(c, 1, bob + 2, 10, 1, red);
      px(c, 0, bob + 3, 12, 1, redDark);
      px(c, 1, bob + 3, 2, 5, hair);
      px(c, 3, bob + 3, 7, 6, skin);
      px(c, 10, bob + 4, 1, 4, skinDark);
      px(c, 8, bob + 4, 1, 2, '#1a100c');
      px(c, 9, bob + 6, 2, 2, skinDark);
      px(c, 4, bob + 7, 5, 1, hair);
      px(c, 6, bob + 8, 3, 1, hair);
      px(c, 4, bob + 9, 4, 1, skinDark);
      px(c, 2, bob + 9, 8, 3, red);
      if (air) {
        px(c, 0, bob + 6, 2, 5, red);
        px(c, 10, bob + 8, 2, 4, red);
        px(c, 0, bob + 11, 2, 1, skin);
        px(c, 10, bob + 12, 2, 1, skin);
      } else {
        px(c, 0, bob + 10, 2, 3, red);
        px(c, 10, bob + 10, 2, 3, red);
        px(c, 0, bob + 13, 2, 1, skin);
        px(c, 10, bob + 13, 2, 1, skin);
      }
      px(c, 1, bob + 11, 10, 3, blue);
      px(c, 3, bob + 10, 2, 2, blue);
      px(c, 7, bob + 10, 2, 2, blue);
      px(c, 3, bob + 11, 1, 1, gold);
      px(c, 8, bob + 11, 1, 1, gold);
      if (air) {
        px(c, 0, bob + 13, 4, 2, shoe);
        px(c, 8, bob + 14, 4, 2, shoe);
      } else if (moving) {
        const f = frame % 4;
        px(c, 1, bob + 14, 4, 2, shoe);
        px(c, 7, bob + 14, 4, 2, shoe);
        if (f === 1) {
          px(c, 0, bob + 14, 4, 1, shoe);
          px(c, 8, bob + 14, 4, 2, shoe);
        } else if (f === 3) {
          px(c, 0, bob + 14, 4, 2, shoe);
          px(c, 8, bob + 14, 4, 1, shoe);
        }
      } else {
        px(c, 1, bob + 14, 4, 2, shoe);
        px(c, 7, bob + 14, 4, 2, shoe);
      }
      px(c, 2, bob + 8, 1, 1, white);
    } else {
      // Big plumber (28px tall)
      px(c, 2, 0, 8, 2, red);
      px(c, 1, 2, 10, 1, red);
      px(c, 0, 3, 12, 1, redDark);
      px(c, 1, 3, 2, 5, hair);
      px(c, 3, 3, 7, 7, skin);
      px(c, 10, 4, 1, 5, skinDark);
      px(c, 8, 4, 1, 2, '#1a100c');
      px(c, 9, 7, 2, 2, skinDark);
      px(c, 4, 8, 5, 1, hair);
      px(c, 6, 9, 4, 1, hair);
      px(c, 4, 10, 4, 2, skinDark);
      px(c, 2, 9, 1, 1, white);

      px(c, 1, 12, 10, 4, red);
      if (air) {
        px(c, 0, 7, 2, 7, red);
        px(c, 10, 9, 2, 6, red);
        px(c, 0, 13, 2, 2, skin);
        px(c, 10, 14, 2, 2, skin);
      } else {
        px(c, 0, 13, 2, 6, red);
        px(c, 10, 13, 2, 6, red);
        px(c, 0, 18, 2, 2, skin);
        px(c, 10, 18, 2, 2, skin);
      }
      px(c, 1, 15, 10, 7, blue);
      px(c, 3, 13, 2, 3, blue);
      px(c, 7, 13, 2, 3, blue);
      px(c, 3, 16, 1, 1, gold);
      px(c, 8, 16, 1, 1, gold);

      px(c, 2, 22, 3, 4, blueDark);
      px(c, 7, 22, 3, 4, blueDark);
      if (air) {
        px(c, 0, 24, 5, 3, shoe);
        px(c, 8, 25, 4, 3, shoe);
      } else if (moving) {
        const f = frame % 4;
        px(c, 0, 25, 5, 3, shoe);
        px(c, 7, 25, 5, 3, shoe);
        if (f === 1) {
          px(c, 0, 24, 5, 2, shoe);
          px(c, 7, 25, 5, 3, shoe);
        } else if (f === 3) {
          px(c, 0, 25, 5, 3, shoe);
          px(c, 8, 24, 4, 2, shoe);
        }
      } else {
        px(c, 0, 25, 5, 3, shoe);
        px(c, 7, 25, 5, 3, shoe);
      }
    }
    c.restore();
  };

  NES.drawGoomba = (c, x, y, scale = 1, flattened = false, time = 0) => {
    c.save();
    c.translate(Math.round(x), Math.round(y));
    c.scale(scale, scale);
    if (flattened) {
      px(c, 1, 12, 14, 4, '#5c2a0a');
      px(c, 3, 11, 10, 3, '#b05618');
      px(c, 5, 12, 2, 1, '#fff6e6');
      px(c, 9, 12, 2, 1, '#fff6e6');
      c.restore();
      return;
    }
    px(c, 3, 2, 10, 2, '#5c2a0a');
    px(c, 2, 4, 12, 8, '#b05618');
    px(c, 1, 7, 14, 5, '#c86a24');
    px(c, 2, 11, 12, 2, '#8c3c10');
    px(c, 0, 13, 5, 3, '#4a1f08');
    px(c, 11, 13, 5, 3, '#4a1f08');
    px(c, 1, 3, 2, 2, '#d87828');
    px(c, 4, 5, 3, 4, '#fff6e6');
    px(c, 9, 5, 3, 4, '#fff6e6');
    const blink = Math.floor(time * 0.9 + x * 0.01) % 7 === 0;
    if (blink) {
      px(c, 5, 7, 1, 1, '#221008');
      px(c, 10, 7, 1, 1, '#221008');
    } else {
      px(c, 5, 6, 2, 2, '#221008');
      px(c, 9, 6, 2, 2, '#221008');
    }
    px(c, 3, 4, 4, 1, '#3a1a08');
    px(c, 9, 4, 4, 1, '#3a1a08');
    px(c, 6, 10, 4, 1, '#3a1a08');
    px(c, 7, 11, 2, 1, '#f0b080');
    c.restore();
  };

  NES.drawKoopa = (c, x, y, scale = 1, shellOnly = false, kicked = false, facing = -1, time = 0) => {
    c.save();
    c.translate(Math.round(x + (facing < 0 ? 16 * scale : 0)), Math.round(y));
    c.scale(facing < 0 ? -scale : scale, scale);
    if (shellOnly) {
      const wobble = kicked ? Math.sin(time * 28) * 1 : 0;
      px(c, 1, 1, 14, 12, '#0d6418');
      px(c, 2, 2, 12, 10, '#2cae32');
      px(c, 3, 3, 10, 2, '#8af08a');
      px(c, 3, 7, 10, 1, '#0d6418');
      px(c, 5, 5, 2, 2, '#e8f8b0');
      px(c, 9, 5, 2, 2, '#e8f8b0');
      px(c, 6, 11, 4, 2, '#f8e070');
      if (kicked) {
        px(c, 1 + Math.round(wobble), 5, 1, 6, '#8af08a');
        px(c, 14 - Math.round(wobble), 5, 1, 6, '#8af08a');
      }
      c.restore();
      return;
    }
    // feet + body
    px(c, 2, 20, 5, 4, '#c88a1c');
    px(c, 9, 20, 5, 4, '#c88a1c');
    px(c, 1, 21, 5, 2, '#f8e070');
    px(c, 10, 21, 5, 2, '#f8e070');
    px(c, 1, 8, 13, 13, '#0d6418');
    px(c, 2, 7, 11, 13, '#2cae32');
    px(c, 4, 9, 7, 2, '#8af08a');
    px(c, 3, 12, 9, 2, '#1d8a28');
    px(c, 4, 15, 7, 2, '#1d8a28');
    px(c, 6, 10, 3, 3, '#c8e070');
    px(c, 6, 14, 3, 3, '#c8e070');
    // head
    px(c, 9, 1, 6, 7, '#f8e070');
    px(c, 10, 0, 5, 3, '#ffe890');
    px(c, 14, 3, 2, 3, '#f8e070');
    px(c, 11, 2, 2, 2, '#201410');
    px(c, 15, 4, 1, 1, '#201410');
    px(c, 9, 3, 1, 1, '#c88a1c');
    // tail
    px(c, 0, 12, 2, 3, '#2cae32');
    c.restore();
  };

  NES.drawMushroom = (c, x, y, scale = 1) => {
    c.save();
    c.translate(Math.round(x), Math.round(y));
    c.scale(scale, scale);
    px(c, 2, 1, 12, 2, '#8a1a10');
    px(c, 1, 3, 14, 6, '#e73c2e');
    px(c, 2, 2, 12, 5, '#ef5a46');
    px(c, 4, 3, 3, 2, '#fff6e6');
    px(c, 10, 4, 3, 3, '#fff6e6');
    px(c, 2, 8, 3, 2, '#fff6e6');
    px(c, 5, 9, 6, 6, '#ffe0b0');
    px(c, 5, 11, 2, 3, '#4a210c');
    px(c, 9, 11, 2, 3, '#4a210c');
    px(c, 6, 15, 4, 1, '#d8a878');
    c.restore();
  };

  NES.drawFlower = (c, x, y, scale = 1, time = 0) => {
    c.save();
    c.translate(Math.round(x), Math.round(y));
    c.scale(scale, scale);
    const glow = Math.floor(time * 8) % 2 ? '#fff6a0' : '#ffd24a';
    px(c, 7, 10, 2, 6, '#2caa32');
    px(c, 3, 12, 4, 2, '#4ad04a');
    px(c, 9, 13, 4, 2, '#4ad04a');
    px(c, 4, 2, 8, 8, '#e73c2e');
    px(c, 2, 4, 12, 4, '#e73c2e');
    px(c, 5, 1, 6, 2, glow);
    px(c, 5, 3, 6, 5, glow);
    px(c, 6, 4, 4, 3, '#fff6e6');
    px(c, 6, 5, 1, 1, '#201410');
    px(c, 9, 5, 1, 1, '#201410');
    px(c, 3, 3, 2, 2, '#ff9a6a');
    px(c, 11, 3, 2, 2, '#ff9a6a');
    c.restore();
  };

  NES.drawFireball = (c, x, y, time) => {
    const f = Math.floor(time * 30) % 2;
    px(c, x, y, 6, 6, '#a51f1b');
    px(c, x + 1, y + 1, 4, 4, f ? '#ff9a3c' : '#ffd24a');
    px(c, x + 2, y + 2, 2, 2, '#fff6e6');
    px(c, x - 2 + (f ? 1 : 0), y + 2, 2, 2, '#ff9a3c');
  };

  NES.drawCoin = (c, cx, cy, phase = 0) => {
    const widths = [10, 8, 5, 8];
    const w = widths[Math.floor(phase) % 4];
    const x = Math.round(cx - w / 2);
    px(c, x, cy - 6, w, 12, '#a86a08');
    px(c, x, cy - 5, w, 10, '#e8a018');
    px(c, x + (w > 4 ? 1 : 0), cy - 4, Math.max(1, w - 2), 8, '#ffd24a');
    px(c, x + (w > 4 ? 2 : 0), cy - 3, 1, 4, '#fff6c0');
    if (w > 6) px(c, x + 2, cy + 2, w - 4, 1, '#c87c10');
  };

  // ── Tiles ────────────────────────────────────────────────────
  NES.drawTile = (c, ch, x, y, themeName, time, tx, ty) => {
    const p = NES.THEMES[themeName];
    switch (ch) {
      case '#': {
        const variant = Math.abs(tx * 17 + ty * 31) % 5;
        px(c, x, y, 16, 16, p.groundDark);
        px(c, x + 1, y + 1, 14, 14, p.ground);
        if (themeName === 'overworld') {
          px(c, x + 1, y + 1, 14, 3, p.grass);
          px(c, x + 1, y + 4, 14, 1, p.grassDark);
        } else if (themeName === 'night') {
          px(c, x + 1, y + 1, 14, 2, p.grass);
          px(c, x + 1, y + 3, 14, 1, p.grassDark);
        } else {
          if (themeName === 'underground' && ty <= 1) px(c, x + 1, y + 1, 14, 2, p.groundDark);
          else px(c, x + 1, y + 1, 14, 1, p.groundLight);
        }
        px(c, x + 1 + variant * 3, y + 8, 2, 2, p.groundLight);
        px(c, x + 11 - variant * 2, y + 12, 2, 2, p.groundDark);
        px(c, x + 1, y + 14, 14, 1, p.groundDark);
        px(c, x + 14, y + 1, 1, 14, p.groundDark);
        break;
      }
      case 'B':
        px(c, x, y, 16, 16, p.brickDark);
        px(c, x + 1, y + 1, 14, 14, p.brick);
        px(c, x + 1, y + 1, 14, 1, p.brickLight);
        px(c, x + 1, y + 6, 14, 1, p.brickDark);
        px(c, x + 1, y + 11, 14, 1, p.brickDark);
        px(c, x + 5, y + 2, 1, 4, p.brickDark);
        px(c, x + 11, y + 2, 1, 4, p.brickDark);
        px(c, x + 8, y + 7, 1, 4, p.brickDark);
        px(c, x + 3, y + 12, 1, 3, p.brickDark);
        px(c, x + 13, y + 12, 1, 3, p.brickDark);
        px(c, x + 2, y + 2, 2, 1, p.brickLight);
        break;
      case '?':
      case 'M': {
        const pulse = Math.sin(time * 5 + tx * 0.7) * 0.5 + 0.5;
        px(c, x, y, 16, 16, p.blockDark);
        px(c, x + 1, y + 1, 14, 14, pulse > 0.55 ? p.blockLight : p.block);
        px(c, x + 2, y + 2, 12, 1, p.blockLight);
        px(c, x + 2, y + 13, 12, 1, p.blockDark);
        px(c, x + 2, y + 2, 1, 12, p.blockLight);
        px(c, x + 13, y + 2, 1, 12, p.blockDark);
        px(c, x + 2, y + 2, 2, 2, '#fff6c0');
        px(c, x + 12, y + 2, 2, 2, '#fff6c0');
        px(c, x + 2, y + 12, 2, 2, '#fff6c0');
        px(c, x + 12, y + 12, 2, 2, '#fff6c0');
        NES.drawText(c, '?', x + 6, y + 5, '#fff6e6', 1, 'left');
        break;
      }
      case 'U':
        px(c, x, y, 16, 16, '#3a2410');
        px(c, x + 1, y + 1, 14, 14, '#7a521e');
        px(c, x + 2, y + 2, 12, 1, '#9a7238');
        px(c, x + 2, y + 2, 2, 2, '#c8a060');
        px(c, x + 12, y + 2, 2, 2, '#c8a060');
        px(c, x + 2, y + 12, 2, 2, '#c8a060');
        px(c, x + 12, y + 12, 2, 2, '#c8a060');
        break;
      case 'S':
        px(c, x, y, 16, 16, p.stoneDark);
        px(c, x + 1, y + 1, 14, 14, p.stone);
        px(c, x + 2, y + 2, 12, 1, p.stoneLight);
        px(c, x + 2, y + 2, 1, 11, p.stoneLight);
        px(c, x + 13, y + 2, 1, 12, p.stoneDark);
        px(c, x + 2, y + 13, 12, 1, p.stoneDark);
        px(c, x + 5, y + 5, 6, 1, p.stoneDark);
        px(c, x + 8, y + 6, 1, 5, p.stoneDark);
        break;
      case '[':
      case ']':
      case '{':
      case '}': {
        const left = ch === '[' || ch === '{';
        const top = ch === '[' || ch === ']';
        px(c, x, y, 16, 16, p.pipeDark);
        px(c, x + 1, y + 1, 14, 14, p.pipe);
        if (top) {
          px(c, x - 1, y, 18, 6, p.pipeDark);
          px(c, x, y + 1, 16, 3, p.pipeLight);
          px(c, x, y + 4, 16, 1, p.pipeDark);
          px(c, x + 1, y + 5, 14, 1, p.pipe);
        }
        if (left) {
          px(c, x + 2, y + (top ? 6 : 0), 2, top ? 10 : 16, p.pipeLight);
          px(c, x + 1, y + (top ? 6 : 0), 1, top ? 10 : 16, p.pipeDark);
        } else {
          px(c, x + 13, y + (top ? 6 : 0), 1, top ? 10 : 16, p.pipeDark);
          px(c, x + 11, y + (top ? 6 : 0), 1, top ? 10 : 16, p.pipeLight);
        }
        break;
      }
      default:
        break;
    }
  };

  // ── Scenery ──────────────────────────────────────────────────
  function drawCloud(c, x, y, s, p) {
    const parts = [
      [2, 5, 12, 6], [8, 2, 10, 7], [17, 4, 10, 6], [25, 7, 9, 5], [11, 8, 11, 4],
    ];
    c.save();
    c.translate(Math.round(x), Math.round(y));
    c.scale(s, s);
    for (const [bx, by, bw, bh] of parts) px(c, bx + 2, by + 2, bw, bh, p.cloudShade);
    for (const [bx, by, bw, bh] of parts) px(c, bx, by, bw, bh, p.cloud);
    px(c, 9, 3, 5, 2, '#ffffff');
    c.restore();
  }

  function drawHill(c, x, baseY, s, p, dark) {
    const w = 54 * s;
    const h = 33 * s;
    const color = dark ? p.hillDark : p.hill;
    for (let i = 0; i < w; i += 3) {
      const t = i / w;
      const hh = Math.round(Math.sin(t * Math.PI) * h);
      px(c, x + i, baseY - hh, 3, hh, color);
    }
    const spot = dark ? '#101c3a' : p.hillDark;
    px(c, x + w * 0.3, baseY - h * 0.35, 3 * s, 5 * s, spot);
    px(c, x + w * 0.58, baseY - h * 0.5, 3 * s, 4 * s, spot);
    px(c, x + w * 0.48, baseY - h * 0.2, 2 * s, 3 * s, spot);
  }

  function drawBush(c, x, baseY, p) {
    const parts = [[0, 6, 13, 8], [7, 3, 14, 11], [18, 6, 12, 8]];
    for (const [bx, by, bw, bh] of parts) px(c, x + bx + 1, baseY - by + 1, bw, bh, p.bushDark);
    for (const [bx, by, bw, bh] of parts) px(c, x + bx, baseY - by, bw, bh, p.bush);
    px(c, x + 9, baseY - 12, 3, 2, p.bushDark);
    px(c, x + 19, baseY - 11, 2, 2, p.bushDark);
  }

  NES.drawBackground = (c, themeName, camera, time) => {
    const p = NES.THEMES[themeName];
    if (themeName === 'overworld') {
      const grad = c.createLinearGradient(0, 0, 0, 240);
      grad.addColorStop(0, p.sky);
      grad.addColorStop(0.65, p.sky);
      grad.addColorStop(1, p.sky2);
      c.fillStyle = grad;
      c.fillRect(0, 0, 256, 240);
      // pixel sun
      c.globalAlpha = 0.85;
      px(c, 205, 28, 20, 3, '#fff3b0');
      px(c, 201, 31, 28, 14, '#fff3b0');
      px(c, 203, 45, 24, 3, '#fff3b0');
      c.globalAlpha = 1;
      px(c, 206, 33, 18, 10, '#fff8d0');

      const cloudShift = (camera * 0.28 + time * 3) % 150;
      for (let i = -1; i < 3; i++) {
        drawCloud(c, i * 150 - cloudShift + 20, 30, 1, p);
        drawCloud(c, i * 150 - cloudShift + 95, 58, 0.72, p);
      }

      const hillShift = (camera * 0.5) % 210;
      for (let i = -1; i < 3; i++) {
        drawHill(c, i * 210 - hillShift + 10, 209, 1, p, false);
        drawHill(c, i * 210 - hillShift + 125, 209, 0.7, p, true);
      }

      const bushShift = (camera * 0.86) % 132;
      for (let i = -1; i < 4; i++) drawBush(c, i * 132 - bushShift + 16, 209, p);
    } else if (themeName === 'night') {
      const grad = c.createLinearGradient(0, 0, 0, 240);
      grad.addColorStop(0, p.sky);
      grad.addColorStop(1, p.sky2);
      c.fillStyle = grad;
      c.fillRect(0, 0, 256, 240);

      for (const s of STARFIELD) {
        const tw = 0.45 + Math.abs(Math.sin(time * 1.7 + s.p)) * 0.55;
        c.globalAlpha = tw;
        px(c, s.x, s.y, s.s, s.s, s.s > 2 ? '#fff6e6' : '#c8d8ff');
      }
      c.globalAlpha = 1;

      // Moon (pixel circle)
      const glow = c.createRadialGradient(207, 38, 4, 207, 38, 24);
      glow.addColorStop(0, 'rgba(255,230,150,0.22)');
      glow.addColorStop(1, 'rgba(255,230,150,0)');
      c.fillStyle = glow;
      c.fillRect(182, 12, 50, 50);
      const moonRows = [8, 14, 18, 20, 20, 20, 18, 14, 8];
      for (let i = 0; i < moonRows.length; i++) {
        const mw = moonRows[i];
        px(c, 207 - mw / 2, 22 + i * 2, mw, 2, i < 4 ? '#fff6d0' : '#f0dca0');
      }
      px(c, 200, 28, 5, 4, '#e4cc88');
      px(c, 209, 35, 3, 3, '#e4cc88');
      px(c, 205, 31, 2, 2, '#f8e8b8');

      const hillShift = (camera * 0.25) % 190;
      for (let i = -1; i < 3; i++) drawHill(c, i * 190 - hillShift + 10, 209, 1.1, p, true);
      const bushShift = (camera * 0.75) % 150;
      for (let i = -1; i < 4; i++) drawBush(c, i * 150 - bushShift + 20, 209, p);
    } else {
      c.fillStyle = p.sky;
      c.fillRect(0, 0, 256, 240);
      const off = -((camera * 0.2) % 32);
      for (let y = -8; y < 248; y += 24) {
        const stagger = (Math.floor(y / 24) % 2) * 16;
        for (let x = off - 32 + stagger; x < 288; x += 32) {
          px(c, x, y, 28, 20, '#0b1330');
          px(c, x + 2, y + 2, 24, 1, '#101c40');
          px(c, x + 2, y + 11, 24, 1, '#081024');
          px(c, x + 2, y + 2, 1, 16, '#101c40');
        }
      }
      c.globalAlpha = 0.5;
      for (let i = 0; i < 5; i++) {
        const lx = (i * 73 - camera * 0.35) % 300;
        if (lx > -20 && lx < 280) {
          px(c, lx, 44 + (i % 3) * 58, 3, 3, '#3c7a9c');
          c.globalAlpha = 0.12;
          px(c, lx - 8, 34 + (i % 3) * 58, 19, 24, '#56b8d8');
          c.globalAlpha = 0.5;
        }
      }
      c.globalAlpha = 1;
    }
  };

  NES.drawCastle = (c, x, baseY, themeName) => {
    const p = NES.THEMES[themeName];
    const w = 80;
    const h = 80;
    const top = baseY - h;
    px(c, x, top, w, h, p.castleDark);
    px(c, x + 3, top + 3, w - 6, h - 3, p.castle);
    // battlements
    for (let i = 0; i < 5; i++) {
      px(c, x + 3 + i * 16, top - 4, 10, 8, p.castleDark);
      px(c, x + 4 + i * 16, top - 3, 8, 7, p.castle);
    }
    // tower
    px(c, x + 28, top - 20, 24, 24, p.castleDark);
    px(c, x + 31, top - 17, 18, 21, p.castle);
    px(c, x + 34, top - 24, 12, 6, p.castleDark);
    // brick seams
    for (let yy = top + 8; yy < baseY - 8; yy += 8) {
      px(c, x + 3, yy, w - 6, 1, p.castleDark);
    }
    for (let yy = top + 8; yy < baseY - 8; yy += 16) {
      for (let xx = x + 7; xx < x + w - 6; xx += 24) px(c, xx, yy, 1, 8, p.castleDark);
      for (let xx = x + 19; xx < x + w - 6; xx += 24) px(c, xx, yy + 8, 1, 8, p.castleDark);
    }
    // door
    px(c, x + 30, baseY - 28, 20, 28, '#0a0a16');
    px(c, x + 34, baseY - 24, 12, 24, '#1a1428');
    px(c, x + 32, baseY - 32, 16, 5, '#0a0a16');
    // windows
    px(c, x + 18, top + 20, 8, 10, '#0a0a16');
    px(c, x + 54, top + 20, 8, 10, '#0a0a16');
    px(c, x + 20, top + 22, 4, 6, '#ffd24a');
    px(c, x + 56, top + 22, 4, 6, '#ffd24a');
    px(c, x + 3, baseY - 4, w - 6, 4, p.castleDark);
  };

  NES.drawFlag = (c, x, baseY, themeName, offset, time) => {
    const p = NES.THEMES[themeName];
    const top = 48;
    px(c, x - 1, top, 3, baseY - top, p.pole);
    px(c, x, top, 1, baseY - top, '#ffffff');
    px(c, x - 4, top - 8, 9, 8, '#a86a08');
    px(c, x - 3, top - 7, 7, 6, '#ffd24a');
    px(c, x - 2, top - 6, 5, 3, '#fff6c0');
    px(c, x - 9, baseY - 16, 17, 16, p.stoneDark);
    px(c, x - 7, baseY - 14, 13, 12, p.stone);
    px(c, x - 5, baseY - 10, 9, 9, p.stoneDark);

    const fy = top + 6 + offset;
    const wave = Math.sin(time * 5) * 2;
    c.fillStyle = p.flag;
    c.beginPath();
    c.moveTo(x - 1, fy);
    c.lineTo(x - 25, fy + 7 + wave);
    c.lineTo(x - 1, fy + 17);
    c.closePath();
    c.fill();
    c.fillStyle = '#fff6e6';
    c.beginPath();
    c.arc(x - 10, fy + 8, 4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = p.flag;
    c.beginPath();
    c.arc(x - 10, fy + 8, 2, 0, Math.PI * 2);
    c.fill();
  };

  NES.drawBrickParticles = (c, particles) => {
    for (const p of particles) {
      if (p.type !== 'brick') continue;
      px(c, p.x, p.y, p.s, p.s, p.color);
    }
  };
})();
