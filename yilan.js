/*!
 * KA Yılan — KA.OS tarzı küçük bir yılan oyunu.
 * Bağımlılık yok. Kullanım: KAYilan.mount(element, { grid: 20 })
 * MIT Lisansı © 2026 Koray Akdoğan — https://github.com/Omrndr/yilan
 */
(function (global) {
  'use strict';

  var CSS = [
    '.ky{--ky-k:#111;--ky-pink:#f386a1;--ky-yellow:#ffd23f;--ky-green:#06d6a0;color:var(--ky-k);font-family:"DM Mono",ui-monospace,monospace;user-select:none;-webkit-user-select:none}',
    '.ky-hud{display:flex;justify-content:space-between;align-items:center;gap:8px;font-family:"VT323",ui-monospace,monospace;font-size:20px;line-height:1;margin-bottom:8px}',
    '.ky-hud b{font-weight:400;background:var(--ky-k);color:#fff;padding:1px 7px;margin-left:5px}',
    '.ky-stage{position:relative}',
    '.ky-cv{display:block;width:100%;aspect-ratio:1/1;border:3px solid var(--ky-k);background:#fff;touch-action:none;outline:none;cursor:pointer;box-sizing:border-box}',
    '.ky-cv:focus-visible{box-shadow:0 0 0 3px var(--ky-yellow)}',
    '.ky-msg{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}',
    '.ky-msg[hidden]{display:none}',
    '.ky-msg span{font-family:"VT323",ui-monospace,monospace;font-size:24px;line-height:1.1;text-align:center;white-space:pre-line;background:#fff;border:3px solid var(--ky-k);box-shadow:4px 4px 0 var(--ky-k);padding:10px 16px}',
    '.ky-pad{display:none;grid-template-columns:repeat(3,56px);grid-template-rows:repeat(2,46px);gap:8px;justify-content:center;margin-top:14px}',
    '.ky-pad button{font:22px "VT323",ui-monospace,monospace;border:3px solid var(--ky-k);border-radius:6px;background:#fff;box-shadow:3px 3px 0 var(--ky-k);color:var(--ky-k);cursor:pointer;padding:0}',
    '.ky-pad button:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ky-k)}',
    '.ky-pad .u{grid-column:2;grid-row:1}.ky-pad .p{grid-column:3;grid-row:1;background:var(--ky-yellow)}',
    '.ky-pad .l{grid-column:1;grid-row:2}.ky-pad .d{grid-column:2;grid-row:2}.ky-pad .r{grid-column:3;grid-row:2}',
    '.ky-help{font-size:12px;opacity:.7;margin-top:8px;text-align:center}',
    '.ky.touch .ky-pad{display:grid}.ky.touch .ky-help{display:none}',
    '@media (pointer:coarse){.ky .ky-pad{display:grid}.ky .ky-help{display:none}}'
  ].join('\n');

  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var KEYS = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right'
  };
  var START_MS = 140, MIN_MS = 65, STEP_MS = 4;

  function injectCSS() {
    if (document.getElementById('ky-css')) return;
    var s = document.createElement('style');
    s.id = 'ky-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  function load(k) { try { return global.localStorage.getItem(k); } catch (e) { return null; } }
  function save(k, v) { try { global.localStorage.setItem(k, v); } catch (e) {} }

  function mount(root, opts) {
    opts = opts || {};
    var N = opts.grid || 20;
    var BEST_KEY = opts.storageKey || 'ka-yilan-en-iyi';
    injectCSS();

    root.classList.add('ky');
    if (opts.touch) root.classList.add('touch');
    root.innerHTML =
      '<div class="ky-hud"><span>SKOR<b class="ky-score">0</b></span><span>EN İYİ<b class="ky-best">0</b></span></div>' +
      '<div class="ky-stage"><canvas class="ky-cv" tabindex="0" aria-label="Yılan oyunu. Ok tuşları ile yönet, boşluk ile başlat veya duraklat."></canvas>' +
      '<div class="ky-msg" role="status" aria-live="polite"><span></span></div></div>' +
      '<div class="ky-pad">' +
        '<button class="u" data-dir="up" aria-label="Yukarı">▲</button>' +
        '<button class="p" data-act="toggle" aria-label="Başlat veya duraklat">❚❚</button>' +
        '<button class="l" data-dir="left" aria-label="Sola">◀</button>' +
        '<button class="d" data-dir="down" aria-label="Aşağı">▼</button>' +
        '<button class="r" data-dir="right" aria-label="Sağa">▶</button>' +
      '</div>' +
      '<p class="ky-help">ok tuşları / WASD · boşluk: başlat / duraklat</p>';

    var cv = root.querySelector('.ky-cv');
    var ctx = cv.getContext('2d');
    var msg = root.querySelector('.ky-msg');
    var msgText = msg.querySelector('span');
    var scoreEl = root.querySelector('.ky-score');
    var bestEl = root.querySelector('.ky-best');

    var snake, dir, queue, food, score, speed, timer = null;
    var state = 'ready';
    var best = parseInt(load(BEST_KEY), 10) || 0;
    bestEl.textContent = best;

    function reset() {
      var y = Math.floor(N / 2);
      snake = [[5, y], [4, y], [3, y]];
      dir = 'right';
      queue = [];
      score = 0;
      speed = START_MS;
      scoreEl.textContent = '0';
      placeFood();
    }

    function placeFood() {
      var free = [];
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) {
          if (!snake.some(function (s) { return s[0] === x && s[1] === y; })) free.push([x, y]);
        }
      }
      food = free.length ? free[Math.floor(Math.random() * free.length)] : null;
    }

    function opposite(a, b) {
      return DIRS[a][0] === -DIRS[b][0] && DIRS[a][1] === -DIRS[b][1];
    }

    function turn(d) {
      var last = queue.length ? queue[queue.length - 1] : dir;
      if (d === last || opposite(d, last) || queue.length > 2) return;
      queue.push(d);
    }

    function show(text) {
      if (text) { msgText.textContent = text; msg.hidden = false; }
      else msg.hidden = true;
    }

    function step() {
      if (queue.length) dir = queue.shift();
      var head = snake[0];
      var nx = head[0] + DIRS[dir][0], ny = head[1] + DIRS[dir][1];
      var eats = food && nx === food[0] && ny === food[1];
      var body = eats ? snake : snake.slice(0, -1);
      var hit = nx < 0 || ny < 0 || nx >= N || ny >= N ||
        body.some(function (s) { return s[0] === nx && s[1] === ny; });
      if (hit) return over();

      snake.unshift([nx, ny]);
      if (eats) {
        score++;
        scoreEl.textContent = score;
        speed = Math.max(MIN_MS, speed - STEP_MS);
        placeFood();
        if (!food) { draw(); return over(true); }
      } else {
        snake.pop();
      }
      draw();
      timer = setTimeout(step, speed);
    }

    function over(won) {
      clearTimeout(timer); timer = null;
      state = 'over';
      if (score > best) { best = score; bestEl.textContent = best; save(BEST_KEY, String(best)); }
      draw(true);
      show((won ? 'KAZANDIN!' : 'OYUN BİTTİ') + '\nskor ' + score + '\n\nboşluk / dokun: tekrar');
    }

    function start() {
      if (state === 'play') return;
      if (state === 'ready' || state === 'over') reset();
      state = 'play';
      show('');
      draw();
      clearTimeout(timer);
      timer = setTimeout(step, speed);
    }

    function pause() {
      if (state !== 'play') return;
      clearTimeout(timer); timer = null;
      state = 'pause';
      show('DURAKLATILDI\n\nboşluk / dokun: devam');
    }

    function toggle() { if (state === 'play') pause(); else start(); }

    // ---- Çizim ----
    function resize() {
      var dpr = global.devicePixelRatio || 1;
      var w = cv.clientWidth; // çerçeve hariç iç genişlik
      if (w <= 0) return;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(w * dpr);
      ctx.setTransform(cv.width / N, 0, 0, cv.height / N, 0, 0); // 1 birim = 1 hücre
      draw(state === 'over');
    }

    function draw(dead) {
      ctx.clearRect(0, 0, N, N);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, N, N);
      // nokta ızgara
      ctx.fillStyle = 'rgba(17,17,17,.14)';
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) ctx.fillRect(x + 0.45, y + 0.45, 0.1, 0.1);
      // yem: pembe çip
      if (food) {
        ctx.fillStyle = '#111';
        ctx.fillRect(food[0] + 0.12, food[1] + 0.12, 0.76, 0.76);
        ctx.fillStyle = '#f386a1';
        ctx.fillRect(food[0] + 0.22, food[1] + 0.22, 0.56, 0.56);
      }
      // yılan
      for (var i = snake.length - 1; i >= 0; i--) {
        var s = snake[i];
        ctx.fillStyle = dead ? '#555' : '#111';
        ctx.fillRect(s[0] + 0.06, s[1] + 0.06, 0.88, 0.88);
      }
      // baş: gözler
      var h = snake[0], d = DIRS[dir];
      ctx.fillStyle = dead ? '#f386a1' : '#ffd23f';
      var ex = d[0] !== 0 ? [0.62, 0.62] : [0.25, 0.6];
      var ey = d[1] !== 0 ? [0.62, 0.62] : [0.25, 0.6];
      if (d[0] < 0) ex = [0.22, 0.22];
      if (d[1] < 0) ey = [0.22, 0.22];
      ctx.fillRect(h[0] + ex[0], h[1] + ey[0], 0.16, 0.16);
      ctx.fillRect(h[0] + ex[1], h[1] + ey[1], 0.16, 0.16);
    }

    // ---- Girdi ----
    function onKey(e) {
      var d = KEYS[e.code];
      if (d) {
        e.preventDefault();
        if (state === 'ready' || state === 'over') start();
        if (state === 'pause') start();
        turn(d);
      } else if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        pause();
      }
    }
    root.addEventListener('keydown', onKey);

    var sx = null, sy = null;
    cv.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; cv.focus({ preventScroll: true }); });
    cv.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      sx = sy = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) {
        if (state !== 'play') start();
        return;
      }
      if (state !== 'play') start();
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    });

    root.querySelectorAll('.ky-pad button').forEach(function (b) {
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (b.dataset.act === 'toggle') { toggle(); return; }
        if (state !== 'play') start();
        turn(b.dataset.dir);
      });
    });

    function onVis() { if (document.hidden) pause(); }
    document.addEventListener('visibilitychange', onVis);

    var ro = global.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(cv); else global.addEventListener('resize', resize);

    reset();
    resize();
    show('YILAN\n\nbaşlamak için\nboşluk / dokun');

    return {
      start: start,
      pause: pause,
      toggle: toggle,
      focus: function () { cv.focus({ preventScroll: true }); },
      get state() { return state; },
      destroy: function () {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', onVis);
        root.removeEventListener('keydown', onKey);
        if (ro) ro.disconnect(); else global.removeEventListener('resize', resize);
        root.innerHTML = '';
        root.classList.remove('ky', 'touch');
      }
    };
  }

  global.KAYilan = { mount: mount, version: '1.0.0' };
})(window);
