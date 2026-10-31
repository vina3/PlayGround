/* render.js: frame composition, HUD, title and overlay screens. */
(() => {
  'use strict';
  const NES = window.NES;
  const px = NES.px;

  function drawTitle(c) {
    const game = NES.game;
    const t = game.titleTime;
    NES.drawBackground(c, 'overworld', 0, t);

    for (let x = 0; x < 16; x++) {
      NES.drawTile(c, '#', x * 16, 208, 'overworld', t, x, 13);
      NES.drawTile(c, '#', x * 16, 224, 'overworld', t, x, 14);
    }

    // A little scenery in front of the logo.
    px(c, 20, 176, 16, 16, '#7c3208');
    px(c, 21, 177, 14, 14, '#d06a18');
    px(c, 22, 177, 12, 3, '#45b43a');
    NES.drawTile(c, '?', 224, 176, 'overworld', t, 14, 11);

    NES.drawText(c, 'MARIO', 131, 34, '#10142a', 5, 'center');
    NES.outlineText(c, 'MARIO', 128, 29, '#ef4433', '#10142a', 5, 'center', 3);
    NES.drawText(c, 'MARIO', 128, 29, '#ef4433', 5, 'center');
    NES.drawText(c, 'SUPER', 128, 11, '#fff6e6', 2, 'center');
    NES.drawText(c, 'SUPER', 129, 12, '#10142a', 2, 'center');
    NES.drawText(c, 'SUPER', 128, 11, '#fff6e6', 2, 'center');
    NES.outlineText(c, 'BROS.', 128, 69, '#ffd24a', '#10142a', 2, 'center', 2);

    const pulse = 0.5 + Math.sin(t * 6) * 0.5;
    px(c, 47, 99, 162, 18, 'rgba(6,10,28,0.8)');
    px(c, 47, 99, 162, 1, 'rgba(255,210,74,0.65)');
    px(c, 47, 116, 162, 1, 'rgba(255,210,74,0.3)');
    NES.drawText(c, 'PRESS ENTER OR TAP TO START', 128, 104,
      pulse > 0.35 ? '#fff6e6' : '#ffd24a', 1, 'center');

    const touchMode = document.body.classList.contains('touch-mode');
    NES.label(c, touchMode ? 'A JUMP   B RUN' : 'Z JUMP   X RUN   P PAUSE',
      128, 123, '#c8d4ff', 1, 'center', '#10142a');

    const bob = Math.sin(t * 3.2) * 2;
    NES.drawPlayer(c, 40, 158 + bob, 0, 1, Math.floor(t * 6) % 4, true, false, 3);
    NES.drawGoomba(c, 176, 160 - bob, 3, false, t);
    NES.drawCoin(c, 127, 149 + Math.sin(t * 4) * 3, t * 9);

    NES.drawText(c, '2026 PLAYGROUND ARCADE', 128, 218, '#ffe0b0', 1, 'center');
  }

  function drawWorld(c) {
    const game = NES.game;
    const level = NES.level;
    const player = NES.player;
    if (!level || !player) return;
    const theme = level.theme;

    NES.drawBackground(c, theme, game.camera, game.elapsed);

    c.save();
    if (game.shake > 0.2) {
      c.translate(Math.round((Math.random() - 0.5) * game.shake),
        Math.round((Math.random() - 0.5) * game.shake));
    }
    c.translate(-Math.round(game.camera), 0);

    NES.drawCastle(c, level.castleTile * 16, 208, theme);

    const from = Math.max(0, Math.floor(game.camera / 16) - 1);
    const to = Math.min(level.width - 1, Math.floor((game.camera + 272) / 16));
    for (let ty = 0; ty < 15; ty++) {
      for (let tx = from; tx <= to; tx++) {
        const ch = level.grid[ty][tx];
        if (!ch || ch === ' ') continue;
        if (ch === 'o') {
          NES.drawCoin(c, tx * 16 + 8, ty * 16 + 9 + Math.sin(game.elapsed * 4 + tx) * 1.5, game.elapsed * 5 + tx * 1.37);
        } else {
          const bump = NES.bumps.get(tx + ',' + ty);
          const oy = bump != null ? -Math.sin((bump / 0.28) * Math.PI) * 6 : 0;
          NES.drawTile(c, ch, tx * 16, ty * 16 + oy, theme, game.elapsed, tx, ty);
        }
      }
    }

    NES.drawFlag(c, level.flagTile * 16, 208, theme, game.flagOffset, game.elapsed);

    for (const p of NES.powers) {
      if (p.type === 'mushroom') NES.drawMushroom(c, p.x - 1, p.y, 1);
      else NES.drawFlower(c, p.x - 1, p.y, 1, game.elapsed);
    }

    for (const e of NES.entities) {
      if (!e.alive) continue;
      if (e.x > game.camera + 280 || e.x + e.w < game.camera - 24) continue;
      if (e.type === 'goomba') {
        NES.drawGoomba(c, e.x, e.y, 1, e.squash > 0, game.elapsed);
      } else {
        NES.drawKoopa(c, e.x - 1, e.y - (e.shell ? 0 : 2), 1, e.shell, e.kicked, e.dir, game.elapsed);
      }
    }

    for (const f of NES.fireballs) NES.drawFireball(c, f.x, f.y, game.elapsed);

    if (player && !(player.dead && player.y < -40)) {
      const blink = player.invuln > 0 && Math.floor(game.elapsed * 22) % 2 === 0;
      if (!blink) {
        NES.drawPlayer(c, player.x, player.y, player.power, player.facing,
          player.frame, Math.abs(player.vx) > 4 || player.sliding, !player.grounded, 1);
      }
    }

    for (const p of NES.particles) {
      const alpha = Math.max(0, p.life / p.max);
      c.globalAlpha = alpha;
      if (p.type === 'coin') {
        NES.drawCoin(c, p.x + 5, p.y + 5, game.elapsed * 22);
      } else {
        px(c, p.x, p.y, p.s, p.s, p.color || '#ffd24a');
      }
      c.globalAlpha = 1;
    }

    for (const p of NES.popups) {
      c.globalAlpha = Math.min(1, p.life / p.max * 1.4);
      NES.drawText(c, p.text, p.x, p.y, p.color, 1, 'center');
      c.globalAlpha = 1;
    }

    c.restore();
  }

  function drawHUD(c) {
    const game = NES.game;
    const level = NES.level;
    NES.label(c, 'MARIO', 8, 6, '#ffffff', 1, 'left', '#10142a');
    NES.label(c, String(game.score).padStart(6, '0'), 8, 15, '#ffffff', 1, 'left', '#10142a');

    NES.drawCoin(c, 71, 18, 0);
    NES.label(c, '×' + String(game.coins).padStart(2, '0'), 81, 15, '#ffffff', 1, 'left', '#10142a');

    NES.label(c, 'WORLD', 132, 6, '#ffffff', 1, 'left', '#10142a');
    NES.label(c, '1-' + (game.levelIndex + 1), 138, 15, '#ffffff', 1, 'left', '#10142a');

    NES.label(c, 'TIME', 204, 6, '#ffffff', 1, 'left', '#10142a');
    NES.label(c, String(Math.max(0, Math.ceil(game.time))).padStart(3, '0'), 210, 15,
      game.time < 60 ? '#ff9a8a' : '#ffffff', 1, 'left', '#10142a');
  }

  function panel(c, y, h) {
    px(c, 34, y, 188, h, 'rgba(5,8,24,0.9)');
    px(c, 34, y, 188, 1, 'rgba(255,210,74,0.7)');
    px(c, 34, y + h - 1, 188, 1, 'rgba(255,210,74,0.3)');
  }

  function drawIntro(c) {
    const game = NES.game;
    const level = NES.level;
    c.fillStyle = 'rgba(3,6,18,0.86)';
    c.fillRect(0, 0, 256, 240);
    NES.drawText(c, 'WORLD', 128, 63, '#ffd24a', 2, 'center');
    NES.outlineText(c, '1-' + (game.levelIndex + 1), 128, 85, '#fff6e6', '#10142a', 4, 'center', 2);
    NES.drawText(c, level.name, 128, 126, '#9fb4ff', 1, 'center');

    NES.drawPlayer(c, 84, 151, game.power, 1, 0, false, false, 2);
    NES.drawText(c, '× ' + game.lives, 116, 163, '#fff6e6', 2, 'left');
    NES.drawText(c, 'GET READY', 150, 204, (Math.floor(game.elapsed * 3) % 2) ? '#ffd24a' : '#fff6e6', 1, 'center');
  }

  function drawPause(c) {
    c.fillStyle = 'rgba(3,6,18,0.74)';
    c.fillRect(0, 0, 256, 240);
    panel(c, 88, 58);
    NES.outlineText(c, 'PAUSED', 128, 99, '#fff6e6', '#10142a', 3, 'center', 2);
    NES.drawText(c, 'PRESS P TO RESUME', 128, 132, '#aab8ee', 1, 'center');
  }

  function drawGameOver(c) {
    const game = NES.game;
    c.fillStyle = 'rgba(3,6,18,0.8)';
    c.fillRect(0, 0, 256, 240);
    panel(c, 70, 92);
    NES.outlineText(c, 'GAME OVER', 128, 84, '#ef4433', '#10142a', 3, 'center', 2);
    NES.drawText(c, 'SCORE ' + String(game.score).padStart(6, '0'), 128, 120, '#fff6e6', 1, 'center');
    NES.drawText(c, 'COINS ×' + String(game.coins).padStart(2, '0'), 128, 133, '#ffd24a', 1, 'center');
    if ((game.stateTimer % 1.6) < 1.2) {
      NES.drawText(c, 'PRESS ENTER OR TAP TO RETRY', 128, 188, '#aab8ee', 1, 'center');
    }
  }

  function drawFireworks(c) {
    const t = NES.game.elapsed;
    const spots = [[58, 54], [202, 46], [92, 86], [166, 82], [128, 38]];
    for (let i = 0; i < spots.length; i++) {
      const phase = (t * 0.7 + i * 0.29) % 1;
      if (phase > 0.78) continue;
      const [cx, cy] = spots[i];
      const radius = phase * 38;
      c.globalAlpha = 1 - phase / 0.78;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + i;
        px(c, cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, 2, 2,
          ['#ffd24a', '#ff8a6a', '#8affb0'][i % 3]);
      }
      c.globalAlpha = 1;
    }
  }

  function drawVictory(c) {
    const game = NES.game;
    c.fillStyle = 'rgba(3,6,18,0.74)';
    c.fillRect(0, 0, 256, 240);
    drawFireworks(c);
    panel(c, 70, 106);
    NES.outlineText(c, 'YOU WIN!', 128, 82, '#ffd24a', '#10142a', 3, 'center', 2);
    NES.drawText(c, 'THE PIXEL KINGDOM IS SAFE', 128, 117, '#fff6e6', 1, 'center');
    NES.drawText(c, 'FINAL SCORE ' + String(game.score).padStart(6, '0'), 128, 136, '#fff6e6', 1, 'center');
    NES.drawText(c, 'COINS ×' + String(game.coins).padStart(2, '0'), 128, 149, '#ffd24a', 1, 'center');
    if ((game.stateTimer % 1.7) < 1.3) {
      NES.drawText(c, 'PRESS ENTER OR TAP TO PLAY AGAIN', 128, 193, '#aab8ee', 1, 'center');
    }
  }

  function drawClearBanner(c) {
    const game = NES.game;
    if (game.stateTimer < 0.65) return;
    c.globalAlpha = Math.min(1, (game.stateTimer - 0.65) * 4);
    NES.outlineText(c, 'COURSE CLEAR!', 128, 73, '#ffd24a', '#10142a', 2, 'center', 2);
    NES.drawText(c, 'TIME BONUS', 128, 96, '#fff6e6', 1, 'center');
    c.globalAlpha = 1;
  }

  NES.render = (c) => {
    const game = NES.game;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = false;

    if (game.state === 'title') {
      drawTitle(c);
      return;
    }

    drawWorld(c);
    drawHUD(c);

    if (game.state === 'intro') drawIntro(c);
    else if (game.state === 'clear') drawClearBanner(c);
    else if (game.state === 'gameover') drawGameOver(c);
    else if (game.state === 'victory') drawVictory(c);

    if (game.paused) drawPause(c);
  };
})();
