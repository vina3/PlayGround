/* levels.js: hand-authored tile maps and spawn tables. */
(() => {
  'use strict';
  const NES = window.NES;

  NES.SOLID = new Set(['#', 'B', '?', 'M', 'S', 'U', '[', ']', '{', '}']);
  NES.isSolidChar = (ch) => NES.SOLID.has(ch);

  function blank(width, theme, name) {
    return {
      width,
      name,
      theme,
      grid: Array.from({ length: NES.ROWS }, () => new Array(width).fill(' ')),
      spawns: [],
      flagTile: width - 14,
      castleTile: width - 9,
      start: { x: 3 * NES.TILE, y: NES.GROUND_Y - 16 },
    };
  }

  const set = (l, x, y, ch) => {
    if (x >= 0 && x < l.width && y >= 0 && y < NES.ROWS) l.grid[y][x] = ch;
  };

  function ground(l, segments) {
    for (const [a, b] of segments) {
      for (let x = a; x <= b; x++) {
        set(l, x, 13, '#');
        set(l, x, 14, '#');
      }
    }
  }

  function pipe(l, x, height) {
    const top = 13 - height;
    set(l, x, top, '[');
    set(l, x + 1, top, ']');
    for (let y = top + 1; y <= 12; y++) {
      set(l, x, y, '{');
      set(l, x + 1, y, '}');
    }
  }

  function row(l, x0, x1, y, ch) {
    for (let x = x0; x <= x1; x++) set(l, x, y, ch);
  }

  function stairUp(l, x, n) {
    for (let i = 0; i < n; i++) {
      for (let y = 12 - i; y <= 12; y++) set(l, x + i, y, 'S');
    }
  }

  function stairDown(l, x, n) {
    for (let i = 0; i < n; i++) {
      for (let y = 12 - (n - 1 - i); y <= 12; y++) set(l, x + i, y, 'S');
    }
  }

  function coins(l, points) {
    for (const [x, y] of points) set(l, x, y, 'o');
  }

  function spawn(l, type, tx, rowY) {
    l.spawns.push({ type, tx, row: rowY == null ? 12 : rowY });
  }

  // ── WORLD 1-1: sunny opening course ─────────────────────────
  function worldOne() {
    const l = blank(212, 'overworld', 'OVERWORLD');
    ground(l, [[0, 68], [71, 85], [88, 152], [155, 183], [186, 211]]);

    set(l, 12, 9, '?');
    coins(l, [[9, 8], [10, 7], [11, 8]]);
    set(l, 16, 9, '?');
    set(l, 20, 9, 'B');
    set(l, 21, 9, '?');
    set(l, 22, 9, 'B');
    set(l, 23, 9, 'M');
    set(l, 24, 9, 'B');
    set(l, 22, 5, '?');
    coins(l, [[33, 8], [34, 7], [35, 8], [36, 7]]);

    pipe(l, 28, 2);
    pipe(l, 38, 3);
    pipe(l, 46, 4);
    pipe(l, 57, 4);

    set(l, 64, 9, 'B');
    set(l, 65, 9, '?');
    set(l, 66, 9, 'B');

    set(l, 77, 9, 'B');
    set(l, 78, 9, '?');
    set(l, 79, 9, 'B');
    set(l, 80, 9, 'M');
    set(l, 81, 5, '?');
    coins(l, [[92, 8], [93, 7], [94, 8]]);

    set(l, 96, 9, 'B');
    set(l, 97, 9, '?');
    set(l, 98, 9, 'B');
    set(l, 99, 9, 'B');
    set(l, 100, 9, '?');
    set(l, 101, 9, 'B');
    coins(l, [[104, 7], [105, 6], [106, 7]]);

    pipe(l, 112, 3);
    row(l, 118, 121, 8, 'B');
    set(l, 119, 8, '?');
    coins(l, [[124, 6], [125, 5], [126, 6]]);

    stairUp(l, 134, 4);
    stairDown(l, 140, 4);
    coins(l, [[146, 8], [147, 7], [148, 8]]);

    row(l, 158, 160, 6, 'B');
    set(l, 159, 6, '?');
    coins(l, [[163, 7], [164, 6], [165, 7]]);

    set(l, 168, 9, '?');
    set(l, 169, 9, 'B');
    stairUp(l, 176, 8);

    l.flagTile = 198;
    l.castleTile = 202;
    l.start = { x: 3 * NES.TILE, y: NES.GROUND_Y - 16 };

    const g = [
      ['goomba', 24], ['goomba', 35], ['goomba', 43], ['goomba', 52],
      ['goomba', 62], ['goomba', 74], ['goomba', 82], ['koopa', 90],
      ['goomba', 95], ['goomba', 105], ['goomba', 118], ['goomba', 124],
      ['koopa', 130], ['goomba', 145], ['goomba', 160], ['koopa', 166],
      ['goomba', 169],
    ];
    for (const [type, tx] of g) spawn(l, type, tx);
    return l;
  }

  // ── WORLD 1-2: underground coin cavern ───────────────────────
  function worldTwo() {
    const l = blank(186, 'underground', 'UNDERGROUND');
    ground(l, [[0, 54], [57, 92], [95, 126], [129, 185]]);
    row(l, 0, 185, 0, '#');
    row(l, 0, 185, 1, '#');

    row(l, 8, 10, 8, 'B');
    set(l, 9, 8, '?');
    set(l, 13, 6, '?');
    coins(l, [[14, 5], [15, 4], [16, 5]]);

    row(l, 18, 21, 9, 'B');
    set(l, 19, 9, '?');
    set(l, 24, 8, 'M');
    coins(l, [[26, 5], [27, 4], [28, 5]]);

    pipe(l, 34, 3);
    row(l, 42, 45, 7, 'B');
    set(l, 43, 7, '?');
    coins(l, [[55, 7], [56, 6], [57, 7]]);

    row(l, 62, 66, 10, 'S');
    coins(l, [[63, 7], [64, 6], [65, 7]]);
    stairUp(l, 72, 4);
    stairDown(l, 78, 4);
    coins(l, [[84, 7], [85, 6], [86, 7]]);

    pipe(l, 92, 2);
    coins(l, [[95, 7], [96, 6], [97, 7]]);
    row(l, 102, 106, 8, 'B');
    set(l, 104, 8, '?');
    set(l, 105, 8, 'M');
    coins(l, [[108, 6], [109, 5], [110, 6]]);

    stairUp(l, 116, 3);
    row(l, 120, 123, 7, 'B');
    set(l, 121, 7, '?');
    coins(l, [[127, 7], [128, 6], [129, 7]]);

    row(l, 134, 138, 9, 'B');
    set(l, 136, 9, '?');
    coins(l, [[141, 6], [142, 5], [143, 6]]);
    stairUp(l, 148, 5);
    stairDown(l, 153, 5);

    l.flagTile = 174;
    l.castleTile = 179;
    l.start = { x: 3 * NES.TILE, y: NES.GROUND_Y - 16 };

    const g = [
      ['goomba', 18], ['goomba', 30], ['goomba', 42], ['goomba', 50],
      ['goomba', 62], ['koopa', 66], ['goomba', 70], ['goomba', 88],
      ['goomba', 101], ['goomba', 110], ['goomba', 120], ['goomba', 140],
      ['koopa', 108], ['goomba', 160], ['koopa', 148],
    ];
    for (const [type, tx] of g) spawn(l, type, tx);
    return l;
  }

  // ── WORLD 1-3: moonlit gap run ───────────────────────────────
  function worldThree() {
    const l = blank(196, 'night', 'NIGHT RUN');
    ground(l, [[0, 28], [32, 61], [66, 94], [99, 127], [132, 161], [166, 195]]);

    row(l, 10, 13, 9, 'B');
    set(l, 11, 9, '?');
    set(l, 12, 9, 'M');
    set(l, 20, 5, '?');
    coins(l, [[24, 7], [25, 6], [26, 7]]);

    coins(l, [[29, 7], [30, 6], [31, 7]]);
    row(l, 36, 38, 8, 'B');
    set(l, 37, 8, '?');
    row(l, 44, 48, 10, 'S');
    coins(l, [[45, 7], [46, 6], [47, 7]]);
    set(l, 52, 6, 'M');
    coins(l, [[58, 7], [59, 6], [60, 7]]);

    row(l, 63, 64, 10, 'S');
    coins(l, [[63, 7], [64, 6], [65, 7]]);
    row(l, 70, 73, 9, 'B');
    set(l, 71, 9, '?');
    row(l, 78, 81, 6, 'B');
    set(l, 80, 6, '?');
    row(l, 85, 88, 9, 'S');
    coins(l, [[85, 6], [86, 5], [87, 6]]);

    row(l, 96, 97, 10, 'S');
    coins(l, [[95, 7], [96, 6], [97, 7], [98, 7]]);
    row(l, 104, 108, 8, 'B');
    set(l, 106, 8, '?');
    row(l, 112, 116, 10, 'S');
    coins(l, [[113, 7], [114, 6], [115, 7]]);

    row(l, 129, 130, 10, 'S');
    coins(l, [[128, 7], [129, 6], [130, 6], [131, 7]]);
    row(l, 136, 139, 6, 'B');
    set(l, 137, 6, '?');
    row(l, 144, 147, 9, 'B');
    set(l, 145, 9, 'M');
    set(l, 152, 5, '?');
    coins(l, [[158, 7], [159, 6], [160, 7]]);

    coins(l, [[162, 7], [163, 6], [164, 7]]);
    stairUp(l, 168, 6);
    stairDown(l, 175, 3);

    l.flagTile = 184;
    l.castleTile = 189;
    l.start = { x: 3 * NES.TILE, y: NES.GROUND_Y - 16 };

    const g = [
      ['goomba', 16], ['goomba', 24], ['goomba', 40], ['koopa', 46],
      ['goomba', 50], ['goomba', 58], ['goomba', 72], ['koopa', 80],
      ['goomba', 84], ['goomba', 90], ['goomba', 105], ['koopa', 110],
      ['goomba', 118], ['goomba', 140], ['koopa', 145], ['goomba', 150],
      ['goomba', 180], ['koopa', 182],
    ];
    for (const [type, tx] of g) spawn(l, type, tx);
    return l;
  }

  NES.BUILDERS = [worldOne, worldTwo, worldThree];
  NES.buildLevel = (index) => NES.BUILDERS[index % NES.BUILDERS.length]();
})();
