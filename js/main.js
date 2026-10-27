(function(){
'use strict';
const $ = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ TOAST ============ */
const toasts = $('#toasts');
function toast(msg, type){
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'err' ? ' err' : '');
  const ic = document.createElementNS('http://www.w3.org/2000/svg','svg');
  ic.innerHTML = '<use href="assets/icons.svg#' + (type === 'err' ? 'i-x' : 'i-check') + '"/>';
  const sp = document.createElement('span');
  sp.textContent = msg;
  t.append(ic, sp);
  toasts.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => {
    t.classList.remove('in'); t.classList.add('out');
    setTimeout(() => t.remove(), 450);
  }, 2600);
}

/* ============ MUSIK KOTAK MUSIK (Web Audio, tanpa berkas) ============ */
const Music = (() => {
  let ctx = null, master, delay, fb, wet, timer = null, nextT = 0, step = 0, playing = false;
  const STEP_T = 0.3;
  // progresi D — A — Bm — G, arpeggio lembut ala kotak musik
  const prog = [
    { b: 146.83, a: [293.66, 440.00, 587.33, 739.99] },
    { b: 110.00, a: [220.00, 329.63, 440.00, 554.37] },
    { b: 123.47, a: [246.94, 369.99, 493.88, 622.25] },
    { b:  98.00, a: [196.00, 293.66, 392.00, 493.88] }
  ];
  const patt = [0, 1, 2, 3, 2, 1, 0, 2];

  function ensure(){
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    delay = ctx.createDelay(1); delay.delayTime.value = 0.42;
    fb = ctx.createGain(); fb.gain.value = 0.33;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    delay.connect(lp); lp.connect(fb); fb.connect(delay);
    wet = ctx.createGain(); wet.gain.value = 0.2;
    delay.connect(wet); wet.connect(master);
  }
  function bell(freq, t, dur, vol){
    const o = ctx.createOscillator(), g = ctx.createGain();
    const o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    o2.type = 'sine'; o2.frequency.value = freq * 2; g2.gain.value = 0.35; // harmonik lembut
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o2.connect(g2); g2.connect(g);
    g.connect(master); g.connect(delay);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function schedule(){
    const now = ctx.currentTime;
    while (nextT < now + 0.4){
      const bar = Math.floor(step / 8) % prog.length;
      const s = step % 8;
      const ch = prog[bar];
      if (s === 0){ // nada bass hangat tiap birama
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = ch.b;
        g.gain.setValueAtTime(0, nextT);
        g.gain.linearRampToValueAtTime(0.05, nextT + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, nextT + 2.2);
        o.connect(g); g.connect(master);
        o.start(nextT); o.stop(nextT + 2.3);
      }
      if (!(s === 7 && Math.random() < 0.5)){ // sedikit "humanize": kadang jeda
        bell(ch.a[patt[s]], nextT + Math.random() * 0.012, 1.9, 0.055 + Math.random() * 0.02);
      }
      nextT += STEP_T; step++;
    }
  }
  function start(){
    ensure();
    if (ctx.state === 'suspended') ctx.resume();
    playing = true;
    nextT = ctx.currentTime + 0.1;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.5);
    if (timer) clearInterval(timer);
    timer = setInterval(schedule, 150);
    schedule();
  }
  function stop(){
    playing = false;
    if (!ctx) return;
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    setTimeout(() => { if (!playing && timer){ clearInterval(timer); timer = null; } }, 900);
  }
  return { start, stop, get playing(){ return playing; } };
})();

const musicBtn = $('#musicBtn');
function setMusicUI(on){
  musicBtn.classList.toggle('playing', on);
  musicBtn.setAttribute('aria-pressed', String(on));
}
musicBtn.addEventListener('click', () => {
  if (Music.playing){ Music.stop(); setMusicUI(false); }
  else { Music.start(); setMusicUI(true); }
});

/* ============ KELOPAK JATUH (canvas) ============ */
const Petals = (() => {
  const cv = $('#petals'), cx = cv.getContext('2d');
  let W, H, items = [], raf = null, running = false;
  const mouse = { x: -9999, y: -9999 };
  const COLORS = ['rgba(165,130,79,', 'rgba(140,105,60,', 'rgba(190,160,110,'];

  function resize(){
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function make(init){
    const bvy = 0.35 + Math.random() * 0.55;
    return {
      x: Math.random() * W, y: init ? Math.random() * H : -30,
      s: 7 + Math.random() * 9, bvy, vy: bvy, vx: 0,
      ph: Math.random() * Math.PI * 2, amp: 0.4 + Math.random() * 0.8,
      r: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.02,
      a: 0.2 + Math.random() * 0.26, c: COLORS[(Math.random() * 3) | 0]
    };
  }
  function draw(p){
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
    cx.beginPath();
    cx.moveTo(0, -p.s);
    cx.bezierCurveTo(p.s * 0.85, -p.s * 0.55, p.s * 0.7, p.s * 0.55, 0, p.s);
    cx.bezierCurveTo(-p.s * 0.7, p.s * 0.55, -p.s * 0.85, -p.s * 0.55, 0, -p.s);
    cx.fillStyle = p.c + p.a + ')'; cx.fill();
    cx.strokeStyle = p.c + (p.a + 0.14) + ')'; cx.lineWidth = 1; cx.stroke();
    cx.beginPath(); cx.moveTo(0, -p.s * 0.55); cx.lineTo(0, p.s * 0.55);
    cx.strokeStyle = p.c + (p.a * 0.7) + ')'; cx.stroke();
    cx.restore();
  }
  function tick(){
    cx.clearRect(0, 0, W, H);
    for (const p of items){
      p.ph += 0.008;
      p.r += Math.sin(p.ph) * 0.01 + p.vr;
      p.y += p.vy;
      p.x += Math.sin(p.ph) * p.amp + p.vx;
      // kelopak tersingkir lembut oleh kursor
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 16900){
        const d = Math.sqrt(d2) || 1, f = (130 - d) / 130 * 0.6;
        p.vx += dx / d * f; p.vy += dy / d * f * 0.25;
      }
      p.vx *= 0.92;
      p.vy += (p.bvy - p.vy) * 0.03;
      if (p.y > H + 40 || p.x < -70 || p.x > W + 70) Object.assign(p, make(false));
      draw(p);
    }
    raf = requestAnimationFrame(tick);
  }
  function start(){
    if (running || RM) return;
    running = true;
    resize();
    const n = Math.min(20, Math.max(10, Math.round(W / 65)));
    items = Array.from({ length: n }, () => make(true));
    addEventListener('resize', resize);
    raf = requestAnimationFrame(tick);
  }
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  return { start };
})();

/* ============ GERBANG AMPLOP ============ */
const gate = $('#gate');
let opened = false;
 $('#sealBtn').addEventListener('click', () => {
  if (opened) return;
  opened = true;
  gate.classList.add('breaking');
  if (!RM){ Music.start(); setMusicUI(true); } // mulai dari gestur pengguna
  setTimeout(() => gate.classList.add('open'),   420);
  setTimeout(() => gate.classList.add('risen'), 1250);
  setTimeout(() => {
    gate.classList.add('gone');
    document.body.classList.add('ready');
    document.body.classList.remove('locked');
    Petals.start();
  }, 2500);
  setTimeout(() => gate.remove(), 3600);
});

/* ============ KURSOR KUSTOM ============ */
if (matchMedia('(hover: hover) and (pointer: fine)').matches){
  document.documentElement.classList.add('fine');
  const dot = $('.cursor-dot'), ring = $('.cursor-ring');
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
  addEventListener('mousemove', e => {
    x = e.clientX; y = e.clientY;
    dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  }, { passive: true });
  (function loop(){
    rx += (x - rx) * 0.14; ry += (y - ry) * 0.14;
    ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
    requestAnimationFrame(loop);
  })();
  const HOV = 'a, button, .g-item, label.radio, input, textarea, .wax-seal';
  document.addEventListener('mouseover', e => { if (e.target.closest(HOV)) ring.classList.add('on'); });
  document.addEventListener('mouseout',  e => { if (e.target.closest(HOV)) ring.classList.remove('on'); });
}

/* ============ NAVIGASI ============ */
const nav = $('#nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40), { passive: true });

const menuOverlay = $('#menuOverlay');
function setMenu(open){
  menuOverlay.classList.toggle('open', open);
  menuOverlay.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('no-scroll', open);
}
 $('#menuBtn').addEventListener('click', () => setMenu(true));
 $('#menuClose').addEventListener('click', () => setMenu(false));
 $$('[data-menus]').forEach(a => a.addEventListener('click', () => setMenu(false)));

/* ============ HITUNG MUNDUR ============ */
const target = new Date('2026-02-14T08:00:00+07:00').getTime();
const cd = { d: $('#cdD'), h: $('#cdH'), m: $('#cdM'), s: $('#cdS') };
function pad(n){ return String(n).padStart(2, '0'); }
function tickCd(){
  let diff = target - Date.now();
  if (diff <= 0){
    cd.d.textContent = '000'; cd.h.textContent = '00'; cd.m.textContent = '00'; cd.s.textContent = '00';
    $('#cdEyebrow').textContent = 'Hari Bahagia Telah Tiba';
    clearInterval(cdTimer);
    return;
  }
  cd.d.textContent = String(Math.floor(diff / 864e5));
  cd.h.textContent = pad(Math.floor(diff / 36e5) % 24);
  cd.m.textContent = pad(Math.floor(diff / 6e4) % 60);
  cd.s.textContent = pad(Math.floor(diff / 1e3) % 60);
}
const cdTimer = setInterval(tickCd, 1000);
tickCd();

/* ============ REVEAL SAAT SCROLL ============ */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
 $$('.reveal').forEach(el => io.observe(el));

/* ============ PARALLAKS ORNAMEN HERO ============ */
if (!RM){
  const hero = $('.hero'), orn = $('#heroOrn');
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    orn.style.transform = 'translate(' + (x * 24) + 'px,' + (y * 18) + 'px)';
  });
}

/* ============ DUPLIKASI MARQUEE (loop mulus) ============ */
const mtrack = $('.marquee-track');
mtrack.appendChild(mtrack.children[0].cloneNode(true));

/* ============ LIGHTBOX GALERI ============ */
const gal = $$('.g-item');
const lb = { box: $('#lightbox'), img: $('#lbImg'), cap: $('#lbCap') };
let li = 0;
function lbOpen(i){
  li = ((i % gal.length) + gal.length) % gal.length;
  const g = gal[li];
  lb.img.src = g.dataset.full;
  lb.img.alt = g.dataset.cap;
  lb.cap.textContent = g.dataset.cap;
  lb.box.classList.add('on');
  document.body.classList.add('no-scroll');
}
function lbCloseFn(){
  lb.box.classList.remove('on');
  document.body.classList.remove('no-scroll');
}
gal.forEach((g, i) => g.addEventListener('click', () => lbOpen(i)));
 $('#lbPrev').addEventListener('click', () => lbOpen(li - 1));
 $('#lbNext').addEventListener('click', () => lbOpen(li + 1));
 $('#lbClose').addEventListener('click', lbCloseFn);
lb.box.addEventListener('click', e => { if (e.target === lb.box) lbCloseFn(); });
addEventListener('keydown', e => {
  if (!lb.box.classList.contains('on')) return;
  if (e.key === 'Escape') lbCloseFn();
  if (e.key === 'ArrowLeft') lbOpen(li - 1);
  if (e.key === 'ArrowRight') lbOpen(li + 1);
});

/* ============ RSVP & DAFTAR UCAPAN ============ */
const form = $('#rsvpForm');
const fName = $('#fName'), inpName = $('#inpName');
const gVal = $('#gVal'), gMinus = $('#gMinus'), gPlus = $('#gPlus');
const inpMsg = $('#inpMsg');
const btnSubmit = $('#btnSubmit'), btnLabel = $('#btnLabel');
const wishList = $('#wishList'), wishCount = $('#wishCount');
let guests = 1;

function updateStepper(){
  gVal.textContent = guests;
  gMinus.disabled = guests <= 1;
  gPlus.disabled = guests >= 8;
}
gMinus.addEventListener('click', () => { guests = Math.max(1, guests - 1); updateStepper(); });
gPlus.addEventListener('click',  () => { guests = Math.min(8, guests + 1); updateStepper(); });
updateStepper();

inpName.addEventListener('input', () => fName.classList.remove('err'));

const SEED = [
  { n: 'Keluarga Wijaya', h: true,  t: 'Selamat ya Amara & Ditya! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.', ts: Date.now() - 36e5 * 5 },
  { n: 'Salsa & Bimo',    h: true,  t: 'Akhirnya! Selamat menempuh hidup baru — semoga langgeng sampai kakek-nenek.',        ts: Date.now() - 36e5 * 26 },
  { n: 'Rani Puspita',    h: false, t: 'Barakallahu lakuma wa baraka alaikuma. Bahagia selalu untuk kalian berdua.',         ts: Date.now() - 36e5 * 49 }
];
let wishes;
try { wishes = JSON.parse(localStorage.getItem('ar-wishes') || 'null') || []; } catch(e){ wishes = []; }
if (!wishes.length) wishes = SEED.slice();

function timeAgo(ts){
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
  return Math.floor(s / 86400) + ' hari lalu';
}
function renderWish(w){
  const el = document.createElement('article');
  el.className = 'wish';
  const head = document.createElement('header');
  const nm = document.createElement('span'); nm.className = 'w-name'; nm.textContent = w.n;
  const bd = document.createElement('span'); bd.className = 'w-badge' + (w.h ? '' : ' no'); bd.textContent = w.h ? 'Hadir' : 'Berhalangan';
  const tm = document.createElement('span'); tm.className = 'w-time'; tm.textContent = timeAgo(w.ts);
  const tx = document.createElement('p'); tx.className = 'w-text'; tx.textContent = '\u201C' + w.t + '\u201D';
  head.append(nm, bd, tm);
  el.append(head, tx);
  return el;
}
function updateCount(){ wishCount.textContent = '· ' + wishes.length + ' ucapan'; }
wishes.forEach(w => wishList.appendChild(renderWish(w)));
updateCount();

form.addEventListener('submit', e => {
  e.preventDefault();
  const name = inpName.value.trim();
  let ok = true;
  if (name.length < 2){ fName.classList.add('err'); ok = false; }
  if (!ok){ toast('Mohon lengkapi data yang belum terisi.', 'err'); return; }
  btnSubmit.disabled = true;
  btnLabel.textContent = 'Mengirim…';
  setTimeout(() => {
    const w = {
      n: name,
      h: form.hadir.value === 'ya',
      t: inpMsg.value.trim() || 'Selamat menempuh hidup baru!',
      ts: Date.now()
    };
    wishes.unshift(w);
    try { localStorage.setItem('ar-wishes', JSON.stringify(wishes)); } catch(err){}
    wishList.prepend(renderWish(w));
    updateCount();
    form.reset();
    form.hadir.value = 'ya';
    guests = 1; updateStepper();
    btnSubmit.disabled = false;
    btnLabel.textContent = 'Kirim Konfirmasi';
    toast('Terima kasih! Konfirmasi Anda telah terkirim.');
    wishList.scrollTop = 0;
  }, 900);
});

/* ============ SALIN KE PAPAN KLIP ============ */
async function copyText(t){
  try { await navigator.clipboard.writeText(t); return true; }
  catch(err){
    const ta = document.createElement('textarea');
    ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); return true; }
    catch(e2){ return false; }
    finally { ta.remove(); }
  }
}
 $$('[data-copy]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const ok = await copyText(btn.dataset.copy);
    toast(ok ? 'Berhasil disalin ke papan klip.' : 'Gagal menyalin — mungkin salin manual.', ok ? 'ok' : 'err');
  });
});

})();
