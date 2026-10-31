/* game.js: simulation, input, scoring, and game flow. */
(() => {
  'use strict';
  const NES = window.NES;
  const { clamp, approach, overlap, TILE, ROWS, GROUND_Y, W, H, STEP } = NES;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const game = (NES.game = {
    state: 'title', paused: false, levelIndex: 0,
    score: 0, coins: 0, lives: 3, power: 0,
    time: 300, stateTimer: 0, elapsed: 0, titleTime: 0,
    shake: 0, camera: 0, fireCooldown: 0, muted: false,
    flagOffset: 0, transitioned: false,
  });

  let level = null;
  let player = null;
  let entities = [];
  let powers = [];
  let fireballs = [];
  let particles = [];
  let popups = [];
  let bumps = new Map();
  let jumpBuffer = 0;
  let runPressed = false;

  const keyDown = new Set();
  const touchHeld = { left: false, right: false, jump: false, run: false };
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyZ: 'jump',
    KeyX: 'run', ShiftLeft: 'run', ShiftRight: 'run',
  };

  const sound = NES.sound;

  function held(action) {
    for (const code of keyDown) if (KEYMAP[code] === action) return true;
    return !!touchHeld[action];
  }

  function addScore(n) {
    game.score = Math.min(999999, game.score + n);
  }

  function addPopup(text, x, y, color = '#fff6e6') {
    popups.push({ text, x, y, color, vy: -26, life: 0.9, max: 0.9 });
  }

  function addCoin(points = 200) {
    game.coins++;
    addScore(points);
    sound.coin();
    const px = player ? player.x : 0;
    const py = player ? player.y : 0;
    if (game.coins >= 100) {
      game.coins -= 100;
      game.lives++;
      sound.oneup();
      addPopup('1UP', px, py - 10, '#8aff9a');
    }
  }

  // ── Level lifecycle ──────────────────────────────────────────
  function loadLevel(index, keepPower) {
    game.levelIndex = index;
    level = NES.level = NES.buildLevel(index);
    const power = keepPower ? game.power : 0;
    game.power = power;
    game.time = 300;
    game.state = 'intro';
    game.stateTimer = 0;
    game.transitioned = false;
    game.flagOffset = 0;
    game.camera = 0;
    game.shake = 0;
    game.fireCooldown = 0;

    const h = power === 0 ? 16 : 28;
    player = NES.player = {
      x: level.start.x, y: GROUND_Y - h, w: 12, h,
      vx: 0, vy: 0, facing: 1, grounded: true,
      power, invuln: 0, coyote: 0, anim: 0, frame: 0,
      sliding: false, dead: false, cooldown: 0, jumpGrace: 0,
    };

    entities = NES.entities = level.spawns.map((s) => {
      const isKoopa = s.type === 'koopa';
      const w = isKoopa ? 14 : 16;
      const hh = isKoopa ? 22 : 16;
      const feet = (s.row + 1) * TILE;
      return {
        type: s.type, x: s.tx * TILE, y: feet - hh, w, h: hh,
        vx: isKoopa ? -22 : -26, vy: 0, alive: true,
        squash: 0, shell: false, kicked: false, grounded: false,
        dir: -1,
      };
    });

    powers = NES.powers = [];
    fireballs = NES.fireballs = [];
    particles = NES.particles = [];
    popups = NES.popups = [];
    bumps = NES.bumps = new Map();
    jumpBuffer = 0;
    runPressed = false;

    if (sound.ctx && !sound.playing) sound.startMusic();
  }

  function startRun() {
    sound.init();
    game.score = 0;
    game.coins = 0;
    game.lives = 3;
    game.power = 0;
    game.paused = false;
    game.titleTime = 0;
    loadLevel(0, false);
    sound.startMusic();
  }

  function beginClear() {
    if (game.state !== 'playing') return;
    game.state = 'clear';
    game.stateTimer = 0;
    game.flagOffset = 0;
    player.sliding = true;
    player.vx = 0;
    player.vy = 0;
    player.x = level.flagTile * TILE - 14;
    const heightBonus = Math.max(0, Math.round((GROUND_Y - (player.y + player.h)) * 6));
    addScore(1000 + heightBonus);
    addPopup(String(1000 + heightBonus), player.x + 6, player.y - 8, '#ffd24a');
    sound.clear();
  }

  function killPlayer() {
    if (game.state !== 'playing') return;
    game.state = 'dying';
    game.stateTimer = 0;
    player.dead = true;
    player.vy = -420;
    player.vx = 0;
    player.invuln = 0;
    sound.die();
  }

  function damagePlayer() {
    if (game.state !== 'playing' || player.invuln > 0) return;
    if (player.power > 0) {
      setPower(player.power === 2 ? 1 : 0);
      player.invuln = NES.INVULN_TIME;
      game.shake = 5;
      sound.shrink();
    } else {
      killPlayer();
    }
  }

  function setPower(next) {
    const feet = player.y + player.h;
    player.power = next;
    game.power = next;
    player.h = next === 0 ? 16 : 28;
    player.y = feet - player.h;
    player.invuln = Math.max(player.invuln, 0.9);
  }

  // ── Player physics ───────────────────────────────────────────
  function solidAt(tx, ty) {
    if (tx < 0 || tx >= level.width) return true;
    if (ty < 0 || ty >= ROWS) return false;
    return NES.isSolidChar(level.grid[ty][tx]);
  }

  function solidAtPixel(x, y) {
    return solidAt(Math.floor(x / TILE), Math.floor(y / TILE));
  }

  function movePlayer(dt) {
    const p = player;
    p.x += p.vx * dt;
    if (p.x < 0) { p.x = 0; p.vx = 0; }
    if (p.x > level.width * TILE - p.w) {
      p.x = level.width * TILE - p.w; p.vx = 0;
    }

    if (p.vx > 0) {
      const tx = Math.floor((p.x + p.w - 0.01) / TILE);
      const y0 = Math.floor(p.y / TILE);
      const y1 = Math.floor((p.y + p.h - 0.01) / TILE);
      for (let ty = y0; ty <= y1; ty++) {
        if (solidAt(tx, ty)) { p.x = tx * TILE - p.w; p.vx = 0; break; }
      }
    } else if (p.vx < 0) {
      const tx = Math.floor(p.x / TILE);
      const y0 = Math.floor(p.y / TILE);
      const y1 = Math.floor((p.y + p.h - 0.01) / TILE);
      for (let ty = y0; ty <= y1; ty++) {
        if (solidAt(tx, ty)) { p.x = (tx + 1) * TILE; p.vx = 0; break; }
      }
    }

    p.grounded = false;
    p.vy = Math.min(p.vy + NES.GRAVITY * dt, NES.MAX_FALL);
    p.y += p.vy * dt;

    if (p.vy >= 0) {
      const ty = Math.floor((p.y + p.h - 0.01) / TILE);
      const x0 = Math.floor(p.x / TILE);
      const x1 = Math.floor((p.x + p.w - 0.01) / TILE);
      for (let tx = x0; tx <= x1; tx++) {
        if (solidAt(tx, ty)) {
          p.y = ty * TILE - p.h;
          p.vy = 0;
          p.grounded = true;
          break;
        }
      }
    } else {
      const ty = Math.floor(p.y / TILE);
      const x0 = Math.floor(p.x / TILE);
      const x1 = Math.floor((p.x + p.w - 0.01) / TILE);
      const hit = [];
      let bottom = -Infinity;
      for (let tx = x0; tx <= x1; tx++) {
        if (solidAt(tx, ty)) {
          hit.push([tx, ty]);
          bottom = Math.max(bottom, (ty + 1) * TILE);
        }
      }
      if (hit.length) {
        p.y = bottom;
        p.vy = 0;
        for (const [tx, by] of hit) hitBlock(tx, by);
      }
    }
  }

  function updatePlayer(dt) {
    const p = player;
    p.invuln = Math.max(0, p.invuln - dt);
    p.cooldown = Math.max(0, p.cooldown - dt);

    const dir = (held('right') ? 1 : 0) - (held('left') ? 1 : 0);
    const running = held('run');
    const maxSpeed = running ? NES.RUN_SPEED : NES.WALK_SPEED;

    if (dir !== 0) {
      const accel = p.grounded ? NES.ACCEL : NES.AIR_ACCEL;
      p.vx += dir * accel * dt;
      p.vx = clamp(p.vx, -maxSpeed, maxSpeed);
      p.facing = dir;
      p.anim += Math.abs(p.vx) * dt * 0.095;
    } else {
      p.vx = approach(p.vx, 0, NES.FRICTION * dt);
      if (Math.abs(p.vx) < 2) p.vx = 0;
      if (p.grounded) p.anim += Math.abs(p.vx) * dt * 0.06;
    }

    if (p.grounded) p.coyote = NES.COYOTE;
    else p.coyote -= dt;
    if (jumpBuffer > 0) jumpBuffer -= dt;

    if (jumpBuffer > 0 && p.coyote > 0) {
      p.vy = -(NES.JUMP_V + (Math.abs(p.vx) > NES.WALK_SPEED + 4 ? 20 : 0));
      p.grounded = false;
      p.coyote = 0;
      p.jumpGrace = 0.15;
      jumpBuffer = 0;
      sound.jump(p.power > 0);
    }
    p.jumpGrace = Math.max(0, p.jumpGrace - dt);
    if (!held('jump') && p.jumpGrace <= 0 && p.vy < -60) {
      p.vy = Math.max(p.vy, -220);
    }

    if (runPressed && p.power === 2 && p.cooldown <= 0) {
      spawnFireball();
      p.cooldown = 0.32;
      sound.fire();
    }
    runPressed = false;

    p.frame = Math.floor(p.anim) % 4;
    movePlayer(dt);

    // Land on the castle / level floor cleanly.
    if (p.y > H + 48) killPlayer();
  }

  // ── Blocks, coins, power-ups ─────────────────────────────────
  function bumpKey(tx, ty) { return tx + ',' + ty; }

  function hitBlock(tx, ty) {
    const ch = level.grid[ty][tx];
    if (!ch || ch === ' ') return;
    bumps.set(bumpKey(tx, ty), 0);

    if (ch === '?') {
      level.grid[ty][tx] = 'U';
      addCoin(200);
      spawnCoinPop(tx * TILE + 4, ty * TILE - 12);
    } else if (ch === 'M') {
      level.grid[ty][tx] = 'U';
      spawnPower(tx, ty);
    } else if (ch === 'B') {
      if (player.power > 0) {
        level.grid[ty][tx] = ' ';
        addScore(50);
        spawnBrickParticles(tx, ty);
        game.shake = 3;
        sound.brick();
      } else {
        sound.bump();
      }
    } else {
      sound.bump();
    }

    // Bumping a block flips enemies standing on it.
    for (const e of entities) {
      if (!e.alive || e.squash > 0) continue;
      if (e.x + e.w > tx * TILE && e.x < (tx + 1) * TILE &&
        Math.abs(e.y + e.h - ty * TILE) < 7) {
        e.alive = false;
        addScore(100);
        addPopup('100', e.x, e.y - 6);
        sound.kick();
      }
    }
  }

  function spawnPower(tx, ty) {
    const type = player.power === 0 ? 'mushroom' : 'flower';
    powers.push({
      type, x: tx * TILE, y: ty * TILE, baseY: ty * TILE,
      w: 14, h: 16, vx: 0, vy: 0, emerge: 0.55, active: false,
    });
  }

  function spawnCoinPop(x, y) {
    particles.push({ type: 'coin', x, y, vx: 0, vy: -95, life: 0.55, max: 0.55, s: 10 });
    for (let i = 0; i < 5; i++) {
      particles.push({
        type: 'spark', x: x + 3, y: y + 5,
        vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 60 - 10,
        life: 0.35 + Math.random() * 0.2, max: 0.55, s: 2,
        color: '#ffe070', gravity: 160,
      });
    }
  }

  function spawnBrickParticles(tx, ty) {
    const p = NES.THEMES[level.theme];
    const colors = [p.brick, p.brickLight, p.brickDark];
    for (let i = 0; i < 6; i++) {
      particles.push({
        type: 'brick', x: tx * TILE + 2 + (i % 3) * 5, y: ty * TILE + 4 + (i >> 1) * 5,
        vx: (i % 3 - 1) * 70 + (Math.random() - 0.5) * 40,
        vy: -120 - Math.random() * 110,
        s: 4, life: 0.7, max: 0.7, gravity: 520,
        color: colors[i % colors.length],
      });
    }
  }

  function spawnFireball() {
    if (fireballs.length >= 2) return;
    fireballs.push({
      x: player.x + (player.facing > 0 ? player.w - 2 : -6),
      y: player.y + (player.power > 0 ? 13 : 6),
      w: 6, h: 6, vx: player.facing * 205, vy: 80,
      life: 3.2, spin: 0,
    });
  }

  function collectCoins() {
    const x0 = Math.floor(player.x / TILE);
    const x1 = Math.floor((player.x + player.w - 0.01) / TILE);
    const y0 = Math.floor(player.y / TILE);
    const y1 = Math.floor((player.y + player.h - 0.01) / TILE);
    for (let ty = Math.max(0, y0); ty <= Math.min(ROWS - 1, y1); ty++) {
      for (let tx = Math.max(0, x0); tx <= Math.min(level.width - 1, x1); tx++) {
        if (level.grid[ty][tx] === 'o') {
          level.grid[ty][tx] = ' ';
          addCoin(200);
          spawnCoinPop(tx * TILE + 4, ty * TILE + 2);
        }
      }
    }
  }

  function updateBumps(dt) {
    for (const [k, t] of bumps) {
      const next = t + dt;
      if (next > 0.28) bumps.delete(k);
      else bumps.set(k, next);
    }
  }

  function bumpOffset(tx, ty) {
    const t = bumps.get(bumpKey(tx, ty));
    if (t == null) return 0;
    return -Math.sin((t / 0.28) * Math.PI) * 6;
  }

  // ── Enemies ──────────────────────────────────────────────────
  function moveEntity(e, dt) {
    e.x += e.vx * dt;
    if (e.x < 0) { e.x = 0; e.vx = Math.abs(e.vx); }
    if (e.x + e.w > level.width * TILE) {
      e.x = level.width * TILE - e.w; e.vx = -Math.abs(e.vx);
    }

    if (e.vx !== 0) {
      const dir = Math.sign(e.vx);
      const tx = Math.floor((dir > 0 ? e.x + e.w - 0.01 : e.x) / TILE);
      const y0 = Math.floor(e.y / TILE);
      const y1 = Math.floor((e.y + e.h - 0.01) / TILE);
      for (let ty = y0; ty <= y1; ty++) {
        if (solidAt(tx, ty)) {
          if (dir > 0) e.x = tx * TILE - e.w;
          else e.x = (tx + 1) * TILE;
          e.vx *= -1;
          break;
        }
      }
    }

    e.grounded = false;
    e.vy = Math.min(e.vy + NES.GRAVITY * dt, NES.MAX_FALL);
    e.y += e.vy * dt;

    if (e.vy >= 0) {
      const ty = Math.floor((e.y + e.h - 0.01) / TILE);
      const x0 = Math.floor(e.x / TILE);
      const x1 = Math.floor((e.x + e.w - 0.01) / TILE);
      for (let tx = x0; tx <= x1; tx++) {
        if (solidAt(tx, ty)) {
          e.y = ty * TILE - e.h;
          e.vy = 0;
          e.grounded = true;
          break;
        }
      }
    } else {
      const ty = Math.floor(e.y / TILE);
      const x0 = Math.floor(e.x / TILE);
      const x1 = Math.floor((e.x + e.w - 0.01) / TILE);
      for (let tx = x0; tx <= x1; tx++) {
        if (solidAt(tx, ty)) { e.y = (ty + 1) * TILE; e.vy = 0; break; }
      }
    }
  }

  function collideEnemy(e) {
    if (!overlap(player, e) || player.sliding) return;
    const stomping = player.vy > 0 && player.y + player.h - player.vy * STEP <= e.y + 9;

    if (stomping) {
      player.y = e.y - player.h;
      player.vy = -300;
      if (e.type === 'goomba') {
        e.squash = 0.4;
        e.vx = 0;
        addScore(100);
        addPopup('100', e.x + 2, e.y - 4);
        sound.stomp();
      } else if (!e.shell) {
        e.shell = true;
        e.kicked = false;
        e.y += e.h - 14;
        e.h = 14;
        e.w = 14;
        e.vx = 0;
        e.vy = 0;
        addScore(100);
        addPopup('100', e.x + 2, e.y - 4);
        sound.stomp();
      } else if (e.vx === 0) {
        e.vx = player.x < e.x ? 158 : -158;
        e.kicked = true;
        addScore(400);
        addPopup('400', e.x + 2, e.y - 4);
        sound.kick();
      } else {
        e.vx = 0;
        e.kicked = false;
        sound.stomp();
      }
    } else if (e.shell && e.vx === 0) {
      e.vx = player.x < e.x ? 164 : -164;
      e.kicked = true;
      addScore(400);
      addPopup('400', e.x + 2, e.y - 4);
      sound.kick();
    } else {
      damagePlayer();
    }
  }

  function updateEnemies(dt) {
    for (const e of entities) {
      if (!e.alive) continue;
      if (e.squash > 0) {
        e.squash -= dt;
        if (e.squash <= 0) e.alive = false;
        continue;
      }
      if (e.x > game.camera + 360 || e.x < game.camera - 140) continue;
      moveEntity(e, dt);
      if (e.y > H + 48) { e.alive = false; continue; }

      if (e.shell && e.kicked && e.vx !== 0) {
        for (const other of entities) {
          if (other === e || !other.alive || other.squash > 0) continue;
          if (overlap(e, other)) {
            other.alive = false;
            addScore(200);
            addPopup('200', other.x, other.y - 4);
            sound.stomp();
          }
        }
      }
      if (game.state === 'playing') collideEnemy(e);
      if (game.state !== 'playing') break;
    }
  }

  function updatePowers(dt) {
    for (let i = powers.length - 1; i >= 0; i--) {
      const p = powers[i];
      if (!p.active) {
        p.emerge -= dt;
        const progress = clamp(1 - p.emerge / 0.55, 0, 1);
        p.y = p.baseY - progress * TILE;
        if (p.emerge <= 0) {
          p.active = true;
          p.y = p.baseY - TILE;
          if (p.type === 'mushroom') p.vx = 34;
        }
      } else if (p.type === 'mushroom') {
        p.x += p.vx * dt;
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        if (p.x + p.w > level.width * TILE) { p.x = level.width * TILE - p.w; p.vx = -Math.abs(p.vx); }
        const dir = Math.sign(p.vx);
        const tx = Math.floor((dir > 0 ? p.x + p.w - 0.01 : p.x) / TILE);
        const y0 = Math.floor(p.y / TILE);
        const y1 = Math.floor((p.y + p.h - 0.01) / TILE);
        let hit = false;
        for (let ty = y0; ty <= y1; ty++) {
          if (solidAt(tx, ty)) {
            p.x = dir > 0 ? tx * TILE - p.w : (tx + 1) * TILE;
            p.vx *= -1; hit = true; break;
          }
        }
        p.vy = Math.min(p.vy + NES.GRAVITY * dt, NES.MAX_FALL);
        p.y += p.vy * dt;
        if (p.vy > 0) {
          const ty = Math.floor((p.y + p.h - 0.01) / TILE);
          const x0 = Math.floor(p.x / TILE);
          const x1 = Math.floor((p.x + p.w - 0.01) / TILE);
          for (let x = x0; x <= x1; x++) {
            if (solidAt(x, ty)) { p.y = ty * TILE - p.h; p.vy = 0; break; }
          }
        }
        if (!hit && p.y > H + 32) { powers.splice(i, 1); continue; }
      }

      if (p.active && overlap(player, p)) {
        if (p.type === 'mushroom') {
          if (player.power === 0) setPower(1);
          addScore(1000);
          addPopup('1000', p.x, p.y - 6, '#ffd24a');
        } else {
          setPower(2);
          addScore(1000);
          addPopup('1000', p.x, p.y - 6, '#ffd24a');
        }
        sound.power();
        powers.splice(i, 1);
      }
    }
  }

  function updateFireballs(dt) {
    for (let i = fireballs.length - 1; i >= 0; i--) {
      const f = fireballs[i];
      f.life -= dt;
      f.spin += dt * 20;
      if (f.life <= 0) { fireballs.splice(i, 1); continue; }

      f.x += f.vx * dt;
      if (solidAtPixel(f.x + (f.vx > 0 ? f.w : 0), f.y + f.h / 2)) {
        f.vx *= -1;
        f.x += f.vx * dt * 2;
      }

      f.vy = Math.min(f.vy + 700 * dt, 420);
      f.y += f.vy * dt;
      if (f.vy > 0 && solidAtPixel(f.x + f.w / 2, f.y + f.h)) {
        f.y = Math.floor((f.y + f.h) / TILE) * TILE - f.h;
        f.vy = -215;
      } else if (f.vy < 0 && solidAtPixel(f.x + f.w / 2, f.y)) {
        f.vy = 40;
      }

      let hit = false;
      for (const e of entities) {
        if (!e.alive || e.squash > 0) continue;
        if (overlap(f, e)) {
          e.alive = false;
          addScore(200);
          addPopup('200', e.x + 2, e.y - 4, '#ffb84a');
          sound.stomp();
          for (let k = 0; k < 6; k++) {
            particles.push({
              type: 'spark', x: e.x + 8, y: e.y + 8,
              vx: (Math.random() - 0.5) * 130, vy: (Math.random() - 0.5) * 130,
              life: 0.35, max: 0.35, s: 2, color: '#ff9a3c', gravity: 70,
            });
          }
          hit = true;
          break;
        }
      }
      if (hit || f.x < -20 || f.x > level.width * TILE + 20) fireballs.splice(i, 1);
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy += (p.gravity || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i];
      p.life -= dt;
      p.y += p.vy * dt;
      p.vy *= 0.94;
      if (p.life <= 0) popups.splice(i, 1);
    }
  }

  function updateCamera(dt) {
    const target = clamp(player.x - 96 + clamp(player.vx * 0.2, -18, 18), 0, level.width * TILE - W);
    game.camera += (target - game.camera) * Math.min(1, dt * 8);
    if (Math.abs(target - game.camera) < 0.05) game.camera = target;
  }

  function checkFlag() {
    const pole = level.flagTile * TILE + 6;
    if (player.x + player.w >= pole - 2 && player.y + player.h > 44) beginClear();
  }

  // ── State updates ────────────────────────────────────────────
  function update(dt) {
    game.elapsed += dt;
    if (game.state !== 'title') game.stateTimer += dt;

    if (game.state === 'title') {
      game.titleTime += dt;
      return;
    }

    if (game.state === 'intro') {
      if (game.stateTimer > 1.45) {
        game.state = 'playing';
        game.stateTimer = 0;
        if (!sound.playing) sound.startMusic();
      }
      return;
    }

    if (game.state === 'playing') {
      game.time -= dt * 2.45;
      if (game.time <= 0) { game.time = 0; killPlayer(); return; }
      updatePlayer(dt);
      updatePowers(dt);
      updateEnemies(dt);
      updateFireballs(dt);
      collectCoins();
      updateParticles(dt);
      updateBumps(dt);
      updateCamera(dt);
      game.shake = Math.max(0, game.shake - 26 * dt);
      if (game.state === 'playing') checkFlag();
      return;
    }

    if (game.state === 'dying') {
      player.vy += 900 * dt;
      player.y += player.vy * dt;
      updateParticles(dt);
      updateCamera(dt);
      if (game.stateTimer > 2.25) {
        game.lives--;
        if (game.lives <= 0) {
          game.state = 'gameover';
          game.stateTimer = 0;
          sound.gameover();
        } else {
          game.power = 0;
          loadLevel(game.levelIndex, false);
          sound.startMusic();
        }
      }
      return;
    }

    if (game.state === 'clear') {
      const targetY = GROUND_Y - player.h;
      if (game.stateTimer < 0.9) {
        player.y = Math.min(targetY, player.y + 125 * dt);
        game.flagOffset = Math.min(1, game.stateTimer / 0.9) * (GROUND_Y - 48 - 18);
      } else {
        player.y = targetY;
        if (game.stateTimer < 2.35) {
          player.x += 62 * dt;
          player.facing = 1;
          player.anim += dt * 9;
          player.frame = Math.floor(player.anim) % 4;
        }
      }
      updateParticles(dt);
      updateBumps(dt);
      updateCamera(dt);
      if (game.stateTimer > 2.8 && !game.transitioned) {
        game.transitioned = true;
        if (game.levelIndex < NES.BUILDERS.length - 1) {
          game.power = player.power;
          loadLevel(game.levelIndex + 1, true);
          sound.startMusic();
        } else {
          game.state = 'victory';
          game.stateTimer = 0;
          sound.victory();
        }
      }
      return;
    }

    if (game.state === 'gameover' || game.state === 'victory') {
      updateParticles(dt);
    }
  }

  // ── Input ────────────────────────────────────────────────────
  function isMenuState() {
    return game.state === 'title' || game.state === 'gameover' || game.state === 'victory';
  }

  function confirmPressed() {
    sound.init();
    if (isMenuState()) {
      startRun();
    } else if (game.paused) {
      togglePause();
    }
  }

  function registerPress(action) {
    if (action === 'jump') jumpBuffer = 0.14;
    if (action === 'run') runPressed = true;
    if (isMenuState() && (action === 'jump' || action === 'run')) {
      sound.init();
      startRun();
    }
  }

  function togglePause() {
    if (game.state !== 'playing' && game.state !== 'intro') return;
    game.paused = !game.paused;
    if (game.paused) sound.pauseMusic();
    else sound.resumeMusic();
  }

  function toggleMute() {
    game.muted = !game.muted;
    sound.setMuted(game.muted);
    const btn = document.getElementById('muteButton');
    btn.textContent = game.muted ? '🔇' : '🔊';
    btn.classList.toggle('muted', game.muted);
  }

  window.addEventListener('keydown', (e) => {
    const action = KEYMAP[e.code];
    if (action) {
      e.preventDefault();
      const wasHeld = held(action);
      keyDown.add(e.code);
      if (!wasHeld) registerPress(action);
      return;
    }
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      e.preventDefault();
      confirmPressed();
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      e.preventDefault();
      togglePause();
    } else if (e.code === 'KeyM') {
      toggleMute();
    } else if (e.code === 'KeyR' && game.state === 'playing' && e.shiftKey) {
      startRun();
    }
  }, { passive: false });

  window.addEventListener('keyup', (e) => {
    if (KEYMAP[e.code]) {
      e.preventDefault();
      keyDown.delete(e.code);
    }
  }, { passive: false });

  window.addEventListener('blur', () => keyDown.clear());

  canvas.addEventListener('pointerdown', () => {
    sound.init();
    canvas.focus({ preventScroll: true });
    if (isMenuState()) startRun();
  });

  document.getElementById('muteButton').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMute();
  });
  document.getElementById('pauseButton').addEventListener('click', (e) => {
    e.stopPropagation();
    togglePause();
  });

  document.querySelectorAll('.tbtn').forEach((btn) => {
    const action = btn.dataset.action;
    const down = (e) => {
      e.preventDefault();
      e.stopPropagation();
      sound.init();
      try { btn.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      if (!touchHeld[action]) {
        touchHeld[action] = true;
        registerPress(action);
      }
      btn.classList.add('active');
    };
    const up = (e) => {
      e.preventDefault();
      e.stopPropagation();
      touchHeld[action] = false;
      btn.classList.remove('active');
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', up);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  function updateTouchMode() {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    document.body.classList.toggle('touch-mode', coarse || window.innerWidth <= 860);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === 'playing' && !game.paused) togglePause();
  });

  // ── Main loop ────────────────────────────────────────────────
  let last = performance.now();
  let accumulator = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;

    if (!game.paused) {
      accumulator += dt;
      let steps = 0;
      while (accumulator >= STEP && steps < 6) {
        update(STEP);
        accumulator -= STEP;
        steps++;
      }
    } else {
      game.elapsed += dt;
    }

    NES.render(ctx);
  }

  NES.loadLevel = loadLevel;
  NES.startRun = startRun;
  NES.beginClear = beginClear;
  NES.togglePause = togglePause;
  NES.toggleMute = toggleMute;
  NES.updateTouchMode = updateTouchMode;

  // Small debug hook used by the project smoke test.
  window.__MARIO = {
    game,
    get player() { return player; },
    get level() { return level; },
    get entities() { return entities; },
    startRun,
    loadLevel,
    beginClear,
  };

  updateTouchMode();
  window.addEventListener('resize', updateTouchMode);
  requestAnimationFrame(frame);
})();
