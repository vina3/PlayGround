/* SUPER MARIO — an original NES-style platformer.
   core.js: constants, pixel font, utility, chiptune audio. */
(() => {
  'use strict';

  const NES = (window.NES = window.NES || {});

  NES.W = 256;
  NES.H = 240;
  NES.TILE = 16;
  NES.ROWS = 15;
  NES.STEP = 1 / 60;
  NES.GROUND_ROW = 13;
  NES.GROUND_Y = NES.GROUND_ROW * NES.TILE;

  NES.GRAVITY = 1500;
  NES.MAX_FALL = 620;
  NES.WALK_SPEED = 108;
  NES.RUN_SPEED = 172;
  NES.ACCEL = 1050;
  NES.AIR_ACCEL = 820;
  NES.FRICTION = 1350;
  NES.JUMP_V = 460;
  NES.COYOTE = 0.09;
  NES.INVULN_TIME = 1.8;

  NES.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  NES.approach = (v, target, amount) =>
    v < target ? Math.min(v + amount, target) : Math.max(v - amount, target);
  NES.overlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  NES.px = (c, x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  // ── 5×7 bitmap font ──────────────────────────────────────────
  const GLYPHS = {
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
    X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
    0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
    7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
    '.': ['00000', '00000', '00000', '00000', '00000', '00110', '00110'],
    ':': ['00000', '00110', '00110', '00000', '00110', '00110', '00000'],
    '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
    '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
    '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
    '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
    "'": ['00100', '00100', '00000', '00000', '00000', '00000', '00000'],
    '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
    ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
    '×': ['00000', '10001', '01010', '00100', '01010', '10001', '00000'],
    '←': ['00100', '01000', '11111', '01000', '00100', '00000', '00000'],
    '→': ['00100', '00010', '11111', '00010', '00100', '00000', '00000'],
    ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  };

  NES.textWidth = (text, scale = 1) => {
    let w = 0;
    for (const ch of String(text).toUpperCase()) w += (ch === ' ' ? 4 : 6) * scale;
    return Math.max(0, w - scale);
  };

  NES.drawText = (c, text, x, y, color, scale = 1, align = 'left') => {
    text = String(text).toUpperCase();
    let px = Math.round(align === 'center' ? x - NES.textWidth(text, scale) / 2 : x);
    const py = Math.round(y);
    c.fillStyle = color;
    for (const ch of text) {
      const g = GLYPHS[ch] || GLYPHS['?'];
      for (let r = 0; r < 7; r++) {
        for (let col = 0; col < 5; col++) {
          if (g[r][col] === '1') {
            c.fillRect(px + col * scale, py + r * scale, scale, scale);
          }
        }
      }
      px += (ch === ' ' ? 4 : 6) * scale;
    }
    return px;
  };

  NES.label = (c, text, x, y, color = '#ffffff', scale = 1, align = 'left', shadow = '#10142a') => {
    if (shadow) {
      const off = scale;
      NES.drawText(c, text, x + off, y + off, shadow, scale, align);
    }
    NES.drawText(c, text, x, y, color, scale, align);
  };

  NES.outlineText = (c, text, x, y, fill, outline, scale = 1, align = 'center', thickness = 1) => {
    for (let ox = -thickness; ox <= thickness; ox++) {
      for (let oy = -thickness; oy <= thickness; oy++) {
        if (ox || oy) NES.drawText(c, text, x + ox, y + oy, outline, scale, align);
      }
    }
    NES.drawText(c, text, x, y, fill, scale, align);
  };

  // ── Theme palettes ───────────────────────────────────────────
  NES.THEMES = {
    overworld: {
      sky: '#5c94fc',
      sky2: '#87b6ff',
      cloud: '#ffffff',
      cloudShade: '#c8e0ff',
      hill: '#3fa93f',
      hillDark: '#1d7a28',
      bush: '#58c44a',
      bushDark: '#2a8a2f',
      ground: '#d06a18',
      groundDark: '#7c3208',
      groundLight: '#ffb468',
      grass: '#45b43a',
      grassDark: '#237a28',
      brick: '#d26518',
      brickDark: '#7a3006',
      brickLight: '#ffb468',
      block: '#efa41c',
      blockDark: '#8e4c06',
      blockLight: '#ffe270',
      stone: '#c8c8d8',
      stoneDark: '#64647c',
      stoneLight: '#f4f4ff',
      pipe: '#2cae32',
      pipeDark: '#0d6418',
      pipeLight: '#8af08a',
      pole: '#d8f8e8',
      flag: '#ef4433',
      castle: '#c8c8d8',
      castleDark: '#64647c',
      castleLight: '#f4f4ff',
    },
    underground: {
      sky: '#050716',
      sky2: '#0a1028',
      cloud: '#26345e',
      cloudShade: '#141d3a',
      hill: '#15213e',
      hillDark: '#0a1028',
      bush: '#1d4338',
      bushDark: '#0d2925',
      ground: '#4e7fa8',
      groundDark: '#1c3a58',
      groundLight: '#8ec8ea',
      grass: '#4e7fa8',
      grassDark: '#1c3a58',
      brick: '#3e6c99',
      brickDark: '#142c46',
      brickLight: '#8ec8ea',
      block: '#2a8fac',
      blockDark: '#114a64',
      blockLight: '#9ff0ff',
      stone: '#8a9ab4',
      stoneDark: '#43506c',
      stoneLight: '#d8e8ff',
      pipe: '#2a9a6c',
      pipeDark: '#0a543c',
      pipeLight: '#8af0c0',
      pole: '#c8f8ff',
      flag: '#ffd24a',
      castle: '#7c8ca8',
      castleDark: '#394864',
      castleLight: '#c8d8f0',
    },
    night: {
      sky: '#0b0d2e',
      sky2: '#171a4c',
      cloud: '#2d3468',
      cloudShade: '#1b204a',
      hill: '#232856',
      hillDark: '#13163a',
      bush: '#2b4a64',
      bushDark: '#182f44',
      ground: '#6c529c',
      groundDark: '#33245e',
      groundLight: '#b894e8',
      grass: '#4a8a6c',
      grassDark: '#245844',
      brick: '#5e4288',
      brickDark: '#2b1c52',
      brickLight: '#b894e8',
      block: '#b8862a',
      blockDark: '#5e3c0a',
      blockLight: '#ffe070',
      stone: '#9c9cc8',
      stoneDark: '#4c4c74',
      stoneLight: '#e4e4ff',
      pipe: '#3a9a6c',
      pipeDark: '#17543c',
      pipeLight: '#9af0b8',
      pole: '#e8f8ff',
      flag: '#ff9ad8',
      castle: '#9c9cc8',
      castleDark: '#4c4c74',
      castleLight: '#e4e4ff',
    },
  };

  // ── Chiptune audio ───────────────────────────────────────────
  const MELODY = [
    'E5','G5','A5','G5','E5','D5','C5','D5',
    'E5','A5','C6','B5','A5','G5','E5','D5',
    'C5','E5','F5','A5','G5','F5','E5','D5',
    'D5','G5','A5','B5','A5','G5','D5','B4',
    'E5','G5','C6','B5','A5','G5','E5','D5',
    'E5','G5','B5','A5','G5','E5','D5','B4',
    'C5','D5','F5','A5','G5','F5','E5','C5',
    'D5','E5','G5','A5','B5','G5','D5','G4',
  ];
  const BASS = ['C3','G2','A2','E2','F2','C3','G2','D3','C3','G2','A2','E2','F2','C3','G2','G2'];
  const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const noteFreq = (name) => {
    if (!name) return 0;
    const letter = name[0];
    const sharp = name[1] === '#';
    const octave = Number(name[sharp ? 2 : 1]);
    const midi = 12 * (octave + 1) + NOTE_INDEX[letter] + (sharp ? 1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  class Chiptune {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.musicGain = null;
      this.sfxGain = null;
      this.muted = false;
      this.playing = false;
      this.suspended = false;
      this.timer = null;
      this.nextTime = 0;
      this.step = 0;
      this.noiseBuffer = null;
    }

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.72;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.17;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.36;
      this.sfxGain.connect(this.master);
      this.makeNoise();
    }

    makeNoise() {
      if (!this.ctx) return;
      const len = Math.floor(this.ctx.sampleRate * 0.25);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      let v = 0;
      for (let i = 0; i < len; i++) {
        v = v * 0.55 + (Math.random() * 2 - 1) * 0.45;
        data[i] = v * (1 - i / len);
      }
      this.noiseBuffer = buf;
    }

    setMuted(muted) {
      this.muted = muted;
      if (this.master && this.ctx) {
        this.master.gain.setTargetAtTime(muted ? 0 : 0.72, this.ctx.currentTime, 0.02);
      }
    }

    tone(freq, dur, opts = {}) {
      if (!this.ctx || this.muted) return;
      const {
        type = 'square', vol = 0.16, to = 0, delay = 0, music = false, attack = 0.006
      } = opts;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), t);
      if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(music ? this.musicGain : this.sfxGain);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    noise(dur = 0.1, vol = 0.12, delay = 0, music = false) {
      if (!this.ctx || this.muted || !this.noiseBuffer) return;
      const t = this.ctx.currentTime + delay;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = music ? 'highpass' : 'lowpass';
      filter.frequency.value = music ? 5200 : 1000;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(music ? this.musicGain : this.sfxGain);
      src.start(t);
      src.stop(t + dur + 0.02);
    }

    jump(big) {
      this.tone(big ? 210 : 300, 0.14, { type: 'square', vol: 0.15, to: big ? 560 : 690 });
      this.noise(0.05, 0.025);
    }

    coin() {
      this.tone(988, 0.06, { type: 'square', vol: 0.12 });
      this.tone(1319, 0.16, { type: 'square', vol: 0.12, delay: 0.055 });
    }

    bump() {
      this.tone(140, 0.07, { type: 'square', vol: 0.12, to: 90 });
    }

    brick() {
      this.noise(0.16, 0.16);
      this.tone(160, 0.1, { type: 'square', vol: 0.08, to: 70 });
    }

    stomp() {
      this.tone(240, 0.11, { type: 'square', vol: 0.13, to: 70 });
      this.noise(0.06, 0.06);
    }

    kick() {
      this.tone(280, 0.08, { type: 'square', vol: 0.12, to: 520 });
    }

    fire() {
      this.tone(760, 0.12, { type: 'sawtooth', vol: 0.08, to: 180 });
    }

    power() {
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        this.tone(f, 0.1, { type: 'square', vol: 0.11, delay: i * 0.065 }));
    }

    oneup() {
      [1047, 1319, 1568, 2093].forEach((f, i) =>
        this.tone(f, 0.11, { type: 'square', vol: 0.1, delay: i * 0.08 }));
    }

    shrink() {
      [420, 330, 240, 180].forEach((f, i) =>
        this.tone(f, 0.09, { type: 'square', vol: 0.1, delay: i * 0.055 }));
    }

    die() {
      [660, 620, 580, 540, 420, 300, 200].forEach((f, i) =>
        this.tone(f, 0.16, { type: 'square', vol: 0.12, delay: i * 0.09, to: f * 0.86 }));
      this.stopMusic();
    }

    clear() {
      this.stopMusic();
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
        this.tone(f, 0.17, { type: 'square', vol: 0.12, delay: i * 0.11 }));
    }

    gameover() {
      this.stopMusic();
      [392, 330, 262, 196].forEach((f, i) =>
        this.tone(f, 0.28, { type: 'square', vol: 0.12, delay: i * 0.2 }));
    }

    victory() {
      this.stopMusic();
      const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
      notes.forEach((f, i) =>
        this.tone(f, i === notes.length - 1 ? 0.7 : 0.16, {
          type: 'square', vol: 0.13, delay: i * 0.15,
        }));
      [262, 330, 392, 523].forEach((f, i) =>
        this.tone(f, 0.5, { type: 'triangle', vol: 0.1, delay: i * 0.3 }));
    }

    startMusic() {
      if (!this.ctx || this.playing) return;
      this.playing = true;
      this.suspended = false;
      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.06;
      this.timer = setInterval(() => this.schedule(), 25);
      this.schedule();
    }

    stopMusic() {
      this.playing = false;
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }

    pauseMusic() {
      this.suspended = true;
    }

    resumeMusic() {
      if (!this.playing) {
        this.startMusic();
        return;
      }
      this.suspended = false;
      this.nextTime = this.ctx.currentTime + 0.05;
    }

    schedule() {
      if (!this.ctx || !this.playing || this.suspended) return;
      if (this.nextTime < this.ctx.currentTime - 0.25) {
        this.nextTime = this.ctx.currentTime + 0.03;
      }
      const stepDur = 60 / 142 / 2;
      while (this.nextTime < this.ctx.currentTime + 0.14) {
        const i = this.step % MELODY.length;
        if (MELODY[i]) {
          this.tone(noteFreq(MELODY[i]), 0.14, {
            type: 'square', vol: 0.09, music: true,
            delay: Math.max(0, this.nextTime - this.ctx.currentTime),
          });
        }
        if (i % 4 === 0) {
          const b = BASS[Math.floor(i / 4) % BASS.length];
          this.tone(noteFreq(b), stepDur * 3.4, {
            type: 'triangle', vol: 0.13, music: true,
            delay: Math.max(0, this.nextTime - this.ctx.currentTime),
          });
        }
        if (i % 2 === 0) {
          this.noise(0.035, 0.018, Math.max(0, this.nextTime - this.ctx.currentTime), true);
        }
        this.step++;
        this.nextTime += stepDur;
      }
    }
  }

  NES.sound = new Chiptune();
})();
