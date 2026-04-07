// ============================================================
//  SNAKE — Google Snake style
// ============================================================

const COLS = 17, ROWS = 15;
let cell, W, H;
let canvas, ctx;

// Board colors (green checkerboard like Google)
const BG_A = '#aad751';
const BG_B = '#a2d149';

// Snake colors (blue like original Google Snake)
const SNAKE_HEAD = '#4674e9';
const SNAKE_BODY = '#5a87f0';
const SNAKE_TAIL = '#7ba2f5';
const SNAKE_EYE_W = '#ffffff';
const SNAKE_EYE_P = '#1a237e';

// Food
const FOOD_COL = '#e53935';
const FOOD_SHINE = '#ff8a80';

// State
let snake, dir, nextDir, moveQ;
let food, score, highScore;
let state = 'idle'; // idle | run | pause | dead
let raf = null, lastTick = 0;

const SPEED = { slow: 155, normal: 105, fast: 60 };
let spd = 'normal';

// ============ INIT ============
document.addEventListener('DOMContentLoaded', async () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    await loadTranslations();

    highScore = +(localStorage.getItem('snake_hs2') || 0);
    document.getElementById('hs-val').textContent = highScore;

    fitCanvas();
    window.addEventListener('resize', fitCanvas);
    document.addEventListener('keydown', onKey);

    // Swipe
    let sx, sy;
    canvas.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    canvas.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) < 15 && Math.abs(dy) < 15) { tap(); return; }
        if (Math.abs(dx) > Math.abs(dy)) pushDir(dx > 0 ? 'r' : 'l');
        else pushDir(dy > 0 ? 'd' : 'u');
    }, { passive: true });

    showOv('idle');
    drawBoard();
    drawDemoSnake();
});

function fitCanvas() {
    const max = Math.min(window.innerWidth - 24, 560);
    cell = Math.floor(max / COLS);
    W = cell * COLS;
    H = cell * ROWS;
    canvas.width = W;
    canvas.height = H;
    if (state === 'idle') { drawBoard(); drawDemoSnake(); }
    else if (state !== 'run') { drawBoard(); drawFood(); drawSnake(); }
}

// ============ CONTROLS ============
function onKey(e) {
    const k = e.key;
    if ((k === 'Enter' || k === ' ') && (state === 'idle' || state === 'dead')) { e.preventDefault(); go(); return; }
    if ((k === 'p' || k === 'P') && (state === 'run' || state === 'pause')) { e.preventDefault(); toggleP(); return; }
    if (state !== 'run') return;
    const m = { ArrowUp:'u', ArrowDown:'d', ArrowLeft:'l', ArrowRight:'r', w:'u', W:'u', s:'d', S:'d', a:'l', A:'l', d:'r', D:'r' };
    if (m[k]) { e.preventDefault(); pushDir(m[k]); }
}

function pushDir(d) {
    if (state !== 'run') return;
    const opp = { u:'d', d:'u', l:'r', r:'l' };
    const last = moveQ.length ? moveQ[moveQ.length - 1] : dir;
    if (d !== opp[last] && d !== last && moveQ.length < 3) moveQ.push(d);
}

function tap() { if (state === 'idle' || state === 'dead') go(); else if (state === 'pause') toggleP(); }
function dpad(d) { if (state === 'idle' || state === 'dead') { go(); return; } pushDir(d); }

// ============ SPEED ============
function setSpd(s, el) {
    spd = s;
    document.querySelectorAll('.speed-pill').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
}

// ============ LIFECYCLE ============
function go() {
    const mx = Math.floor(COLS / 2), my = Math.floor(ROWS / 2);
    snake = [];
    for (let i = 0; i < 3; i++) snake.push({ x: mx - i, y: my });
    dir = 'r'; nextDir = 'r'; moveQ = [];
    score = 0;
    updScore();
    spawn();
    state = 'run';
    hideOv();
    lastTick = performance.now();
    raf = requestAnimationFrame(tick);
}

function tick(now) {
    if (state !== 'run') return;
    if (now - lastTick >= SPEED[spd]) {
        lastTick = now;
        step();
    }
    drawBoard();
    drawFood();
    drawSnake();
    raf = requestAnimationFrame(tick);
}

function step() {
    if (moveQ.length) dir = moveQ.shift();
    const h = { ...snake[0] };
    if (dir === 'u') h.y--; if (dir === 'd') h.y++;
    if (dir === 'l') h.x--; if (dir === 'r') h.x++;

    if (h.x < 0 || h.x >= COLS || h.y < 0 || h.y >= ROWS || snake.some(s => s.x === h.x && s.y === h.y)) { die(); return; }
    snake.unshift(h);
    if (h.x === food.x && h.y === food.y) { score++; updScore(); spawn(); }
    else snake.pop();
}

function die() {
    state = 'dead';
    cancelAnimationFrame(raf);
    const rec = score > highScore;
    if (rec) { highScore = score; localStorage.setItem('snake_hs2', '' + highScore); document.getElementById('hs-val').textContent = highScore; }
    drawBoard(); drawFood(); drawSnake();
    ctx.fillStyle = 'rgba(229,57,53,0.2)';
    ctx.fillRect(0, 0, W, H);
    setTimeout(() => showOv('dead', rec), 300);
}

function toggleP() {
    if (state === 'run') { state = 'pause'; cancelAnimationFrame(raf); showOv('pause'); }
    else if (state === 'pause') { state = 'run'; hideOv(); lastTick = performance.now(); raf = requestAnimationFrame(tick); }
}

function spawn() {
    let f;
    do { f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
    while (snake.some(s => s.x === f.x && s.y === f.y));
    food = f;
}

function updScore() { document.getElementById('sc-val').textContent = score; }

// ============ DRAW ============
function drawBoard() {
    for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? BG_A : BG_B;
            ctx.fillRect(c * cell, r * cell, cell, cell);
        }
}

function drawFood() {
    if (!food) return;
    const cx = food.x * cell + cell / 2, cy = food.y * cell + cell / 2;
    const rad = cell * 0.4;

    // Apple
    ctx.fillStyle = FOOD_COL;
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();

    // Shine
    ctx.fillStyle = FOOD_SHINE;
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(cx - rad * 0.25, cy - rad * 0.3, rad * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Stem
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = Math.max(1.5, cell * 0.06);
    ctx.beginPath(); ctx.moveTo(cx, cy - rad + 2); ctx.lineTo(cx + 1, cy - rad - cell * 0.12); ctx.stroke();

    // Leaf
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.ellipse(cx + cell * 0.07, cy - rad - cell * 0.05, cell * 0.1, cell * 0.17, 0.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawSnake() {
    if (!snake || !snake.length) return;
    const p = cell * 0.06;

    // Draw back to front (tail first, head last on top)
    for (let i = snake.length - 1; i >= 0; i--) {
        const s = snake[i];
        const prev = i > 0 ? snake[i - 1] : null;
        const next = i < snake.length - 1 ? snake[i + 1] : null;

        // Colors
        const frac = snake.length > 1 ? i / (snake.length - 1) : 0;
        if (i === 0) ctx.fillStyle = SNAKE_HEAD;
        else {
            const r = lerp(90, 123, frac), g = lerp(135, 162, frac), b = lerp(240, 245, frac);
            ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
        }

        let x = s.x * cell + p, y = s.y * cell + p, w = cell - p * 2, h = cell - p * 2;
        let tl = cell * 0.3, tr = cell * 0.3, bl = cell * 0.3, br = cell * 0.3;

        // Connect to neighbors (expand towards them, flatten corners)
        if (prev) { adj(prev, s); }
        if (next) { adj(next, s); }

        function adj(nb, me) {
            if (nb.x < me.x) { x = me.x * cell; w = cell - p; tl = 0; bl = 0; }
            if (nb.x > me.x) { w = cell - p; tr = 0; br = 0; }
            if (nb.y < me.y) { y = me.y * cell; h = cell - p; tl = 0; tr = 0; }
            if (nb.y > me.y) { h = cell - p; bl = 0; br = 0; }
        }

        rr(x, y, w, h, tl, tr, br, bl);
        ctx.fill();

        // Eyes on head
        if (i === 0) drawEyes(s);
    }
}

function drawEyes(head) {
    const cx = head.x * cell + cell / 2, cy = head.y * cell + cell / 2;
    const ew = cell * 0.14, ep = cell * 0.075;
    const off = cell * 0.2;
    let e1x, e1y, e2x, e2y;

    switch (dir) {
        case 'r': e1x=cx+off*0.7; e1y=cy-off; e2x=cx+off*0.7; e2y=cy+off; break;
        case 'l': e1x=cx-off*0.7; e1y=cy-off; e2x=cx-off*0.7; e2y=cy+off; break;
        case 'u': e1x=cx-off; e1y=cy-off*0.7; e2x=cx+off; e2y=cy-off*0.7; break;
        case 'd': e1x=cx-off; e1y=cy+off*0.7; e2x=cx+off; e2y=cy+off*0.7; break;
    }

    [{ x: e1x, y: e1y }, { x: e2x, y: e2y }].forEach(e => {
        ctx.fillStyle = SNAKE_EYE_W;
        ctx.beginPath(); ctx.arc(e.x, e.y, ew, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = SNAKE_EYE_P;
        ctx.beginPath(); ctx.arc(e.x, e.y, ep, 0, Math.PI * 2); ctx.fill();
    });
}

function drawDemoSnake() {
    const mx = Math.floor(COLS / 2), my = Math.floor(ROWS / 2);
    snake = []; dir = 'r';
    for (let i = 0; i < 4; i++) snake.push({ x: mx - i, y: my });
    food = { x: mx + 3, y: my };
    drawFood();
    drawSnake();
}

function lerp(a, b, t) { return a + (b - a) * t; }

function rr(x, y, w, h, tl, tr, br, bl) {
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    ctx.lineTo(x + bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
    ctx.lineTo(x, y + tl);
    ctx.quadraticCurveTo(x, y, x + tl, y);
    ctx.closePath();
}

// ============ OVERLAY ============
function showOv(type, isRec) {
    const ov = document.getElementById('ov');
    const ic = document.getElementById('ov-ic');
    const ti = document.getElementById('ov-ti');
    const su = document.getElementById('ov-su');
    const sc = document.getElementById('ov-sc');
    const re = document.getElementById('ov-re');
    const bt = document.getElementById('ov-bt');
    sc.style.display = 'none'; re.style.display = 'none';

    if (type === 'idle') {
        ic.textContent = '🐍'; ti.textContent = t('snake_title');
        su.textContent = t('controls_arrows'); bt.textContent = t('press_to_start');
        bt.onclick = go;
    } else if (type === 'pause') {
        ic.textContent = '⏸️'; ti.textContent = t('paused');
        su.textContent = t('press_p_pause'); bt.textContent = '▶ Play';
        bt.onclick = toggleP;
    } else if (type === 'dead') {
        ic.textContent = '💀'; ti.textContent = t('game_over');
        su.textContent = t('final_score');
        sc.textContent = score; sc.style.display = '';
        if (isRec) { re.textContent = '🌟 ' + t('new_record'); re.style.display = ''; }
        bt.textContent = t('play_again'); bt.onclick = go;
    }
    ov.classList.remove('hidden');
}

function hideOv() { document.getElementById('ov').classList.add('hidden'); }
