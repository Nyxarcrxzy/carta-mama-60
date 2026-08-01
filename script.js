// ---------- Lock screen gate ----------
(function lockGate() {
  const CODE = '1966';
  const lockKeypad = document.getElementById('lockKeypad');
  const delBtn = document.getElementById('lockDel');
  const dots = [...document.querySelectorAll('#lockDots .lock-dot')];
  const errorEl = document.getElementById('lockError');
  const statusEl = document.getElementById('lockStatus');
  const cardEl = document.querySelector('.lock-card');
  const bloomEl = document.getElementById('unlockBloom');
  let entered = '';
  let locked = true;
  let busy = false;

  function renderDots(state) {
    dots.forEach((dot, i) => {
      const filled = i < entered.length;
      dot.classList.toggle('filled', filled && state !== 'wrong' && state !== 'correct');
      dot.classList.toggle('wrong', filled && state === 'wrong');
      dot.classList.toggle('correct', filled && state === 'correct');
    });
  }

  function reset() {
    entered = '';
    busy = false;
    renderDots();
  }

  // hand-painted flower cutouts, used for the unlock celebration.
  const BLOOM_SPRITES = [
    'assets/img/flor-rosa-acuarela.png',
    'assets/img/ave-paraiso-acuarela.png',
    'assets/img/ramo-paraiso-acuarela.png'
  ];

  function spawnUnlockBloom() {
    const count = 120;
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'bloom-flower';
      const size = 140 + Math.random() * 150;
      const leftPct = Math.random() * 100;
      const img = document.createElement('img');
      img.src = BLOOM_SPRITES[Math.floor(Math.random() * BLOOM_SPRITES.length)];
      img.alt = '';
      span.appendChild(img);
      span.style.left = leftPct + '%';
      // spread evenly from the very top to the very bottom so the whole screen fills
      span.style.top = (-6 + Math.random() * 112) + '%';
      span.style.width = size + 'px';
      // side: -1 for the left half (enters/exits like a door swinging from the left), 1 for the right half
      span.style.setProperty('--side', leftPct < 50 ? '-1' : '1');
      span.style.setProperty('--rot', (Math.random() * 50 - 25).toFixed(0) + 'deg');
      span.style.setProperty('--delay', (Math.random() * .6).toFixed(2) + 's');
      bloomEl.appendChild(span);
    }
    bloomEl.classList.add('show');
    // reveal the envelope screen (on its pink background) behind the black+flower
    // celebration overlay
    setTimeout(() => {
      setActiveScreen('screen-envelope');
      document.getElementById('screen-envelope').classList.add('revealed');
    }, 300);
    // the black + flowers last only a few seconds, then fade away completely so
    // the pink card is left clean on screen
    setTimeout(() => bloomEl.classList.add('fade-out'), 3400);
    setTimeout(() => { bloomEl.classList.remove('show'); bloomEl.innerHTML = ''; }, 5100);
  }

  function submit() {
    busy = true;
    if (entered === CODE) {
      locked = false;
      renderDots('correct');
      statusEl.textContent = 'correcto ♡';
      statusEl.classList.add('show');
      setTimeout(() => { statusEl.textContent = 'abriendo...'; }, 1300);
      setTimeout(() => {
        cardEl.classList.add('unlocking');
        spawnUnlockBloom();
      }, 3000);
    } else {
      renderDots('wrong');
      errorEl.classList.add('show');
      cardEl.classList.add('shake');
      setTimeout(() => {
        cardEl.classList.remove('shake');
        errorEl.classList.remove('show');
        reset();
      }, 650);
    }
  }

  function pressDigit(d) {
    if (!locked || busy || entered.length >= 4) return;
    entered += d;
    renderDots();
    if (entered.length === 4) submit();
  }

  lockKeypad.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-key]');
    if (btn) pressDigit(btn.dataset.key);
  });
  delBtn.addEventListener('click', () => {
    if (!locked || busy) return;
    entered = entered.slice(0, -1);
    renderDots();
  });
  window.addEventListener('keydown', (e) => {
    if (!locked) return;
    if (/^[0-9]$/.test(e.key)) pressDigit(e.key);
    else if (e.key === 'Backspace') { entered = entered.slice(0, -1); renderDots(); }
  });
})();

// ---------- Navigation between screens (one page at a time, like a book) ----------
// Only the active screen is visible; the rest are hidden. You advance only by
// tapping the button on the current screen, so scrolling can never reveal what
// comes next.
function setActiveScreen(id) {
  const target = document.getElementById(id);
  if (!target) return;
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s === target));
  target.scrollTop = 0;
  if (id === 'screen-milestone') animateMilestone();
}

// Count 0 -> 60 with an ease-out every time the milestone page opens.
function animateMilestone() {
  const el = document.getElementById('milestoneCount');
  if (!el) return;
  const target = 60;
  const duration = 1700;
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(eased * target);
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

document.querySelectorAll('[data-next]').forEach(btn => {
  btn.addEventListener('click', () => setActiveScreen(btn.dataset.next));
});

// ---------- Scroll-reveal entrance for cards ----------
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.05 });
document.querySelectorAll('.card-surface').forEach(card => revealObserver.observe(card));

// ---------- Ambient falling petals ----------
const PETAL_COLORS = ['#ff9fb0', '#ffc4b0', '#ffcbd6', '#fff2f3', '#ffdca4', '#ffc3ab'];
const WATERCOLOUR_FLOWERS = [
  'assets/img/flor-rosa-acuarela.png',
  'assets/img/ave-paraiso-acuarela.png',
  'assets/img/ramo-paraiso-acuarela.png'
];

function petalSVG() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="petal-shape-single" d="M12 2C12 2 5.5 8.5 5.5 13.5a6.5 6.5 0 0 0 13 0C18.5 8.5 12 2 12 2Z"/></svg>`;
}
function flowerPetalSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="12" cy="6" rx="3.4" ry="5.4" transform="rotate(0 12 12)"/>
    <ellipse cx="12" cy="6" rx="3.4" ry="5.4" transform="rotate(72 12 12)"/>
    <ellipse cx="12" cy="6" rx="3.4" ry="5.4" transform="rotate(144 12 12)"/>
    <ellipse cx="12" cy="6" rx="3.4" ry="5.4" transform="rotate(216 12 12)"/>
    <ellipse cx="12" cy="6" rx="3.4" ry="5.4" transform="rotate(288 12 12)"/>
    <circle cx="12" cy="12" r="2.6" fill="#fff6d8"/>
  </svg>`;
}

function seedPetalField(field, count) {
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span');
    span.className = 'petal';
    const size = 12 + Math.random() * 12;
    const left = Math.random() * 100;
    const duration = 15 + Math.random() * 10;
    const delay = Math.random() * duration;
    const drift = (Math.random() * 60 - 30).toFixed(1) + 'px';
    const rot = (300 + Math.random() * 160).toFixed(0) + 'deg';
    const useFlower = Math.random() < 0.3;
    span.innerHTML = useFlower ? flowerPetalSVG() : petalSVG();
    if (!useFlower) span.style.color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    span.style.left = left + '%';
    span.style.width = size + 'px';
    span.style.height = size + 'px';
    span.style.animationDuration = duration + 's';
    span.style.animationDelay = '-' + delay + 's';
    span.style.setProperty('--drift', drift);
    span.style.setProperty('--rot', rot);
    field.appendChild(span);
  }
}

document.querySelectorAll('.petal-field').forEach(field => seedPetalField(field, 16));

// ---------- Envelope open ----------
const envelopeWrap = document.getElementById('envelopeWrap');
const tapHint = document.getElementById('tapHint');
const burst = document.getElementById('burst');
let envelopeOpened = false;

function spawnBurst() {
  const bits = 12;
  for (let i = 0; i < bits; i++) {
    const bit = document.createElement('span');
    bit.className = 'burst-bit';
    const angle = (Math.PI * 2 * i) / bits + Math.random() * 0.4;
    const dist = 70 + Math.random() * 50;
    bit.style.setProperty('--bx', (Math.cos(angle) * dist).toFixed(1) + 'px');
    bit.style.setProperty('--by', (Math.sin(angle) * dist - 20).toFixed(1) + 'px');
    bit.style.setProperty('--br', (Math.random() * 180 - 90).toFixed(0) + 'deg');
    bit.style.animationDelay = (Math.random() * 0.15) + 's';
    bit.innerHTML = Math.random() < 0.5 ? flowerPetalSVG() : petalSVG();
    if (Math.random() < 0.5) bit.style.color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    burst.appendChild(bit);
    bit.addEventListener('animationend', () => bit.remove());
  }
}

function openEnvelope() {
  if (envelopeOpened) return;
  envelopeOpened = true;
  envelopeWrap.classList.add('open');
  tapHint.style.opacity = '0';
  spawnBurst();
  spawnCelebration();
  setTimeout(() => setActiveScreen('screen-song'), 1500);
}

document.getElementById('screen-envelope').addEventListener('click', openEnvelope);

// ---------- Click-burst on every pink button ----------
const globalBurst = document.getElementById('globalBurst');

function spawnBurstAt(x, y) {
  const bits = 10;
  for (let i = 0; i < bits; i++) {
    const bit = document.createElement('span');
    bit.className = 'burst-bit';
    const angle = (Math.PI * 2 * i) / bits + Math.random() * 0.4;
    const dist = 50 + Math.random() * 46;
    bit.style.left = x + 'px';
    bit.style.top = y + 'px';
    bit.style.setProperty('--bx', (Math.cos(angle) * dist).toFixed(1) + 'px');
    bit.style.setProperty('--by', (Math.sin(angle) * dist - 16).toFixed(1) + 'px');
    bit.style.setProperty('--br', (Math.random() * 180 - 90).toFixed(0) + 'deg');
    bit.style.animationDelay = (Math.random() * 0.12) + 's';
    bit.innerHTML = Math.random() < 0.5 ? flowerPetalSVG() : petalSVG();
    if (Math.random() < 0.5) bit.style.color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    globalBurst.appendChild(bit);
    bit.addEventListener('animationend', () => bit.remove());
  }
}

document.querySelectorAll('.btn-next, .carousel-arrow, .carousel-dots button').forEach(btn => {
  btn.addEventListener('click', (e) => spawnBurstAt(e.clientX, e.clientY));
});

// ---------- Restart ----------
document.getElementById('restartBtn').addEventListener('click', () => {
  envelopeWrap.classList.remove('open');
  tapHint.style.opacity = '1';
  envelopeOpened = false;
  resetCake();
  setActiveScreen('screen-envelope');
});

// ---------- Balloons + confetti celebration ----------
const celebrate = document.getElementById('celebrate');
const BALLOON_COLORS = ['#ff9fb0', '#ffc4b0', '#ffcbd6', '#e0637f', '#ffd6a5', '#c2415f', '#ffe0e6', '#ff8fb4'];

function spawnCelebration() {
  if (!celebrate) return;
  for (let i = 0; i < 14; i++) {
    const b = document.createElement('span');
    b.className = 'balloon';
    b.style.setProperty('--c', BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)]);
    b.style.left = (Math.random() * 92 + 2) + '%';
    b.style.setProperty('--dur', (4.5 + Math.random() * 3).toFixed(2) + 's');
    b.style.setProperty('--delay', (Math.random() * 1.2).toFixed(2) + 's');
    b.style.setProperty('--sway', (Math.random() * 60 - 30).toFixed(0) + 'px');
    b.style.setProperty('--scale', (0.7 + Math.random() * 0.6).toFixed(2));
    celebrate.appendChild(b);
    b.addEventListener('animationend', () => b.remove());
  }
  for (let i = 0; i < 70; i++) {
    const f = document.createElement('span');
    f.className = 'confetti';
    f.style.left = (Math.random() * 100) + '%';
    f.style.background = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    f.style.setProperty('--dur', (2.5 + Math.random() * 2.5).toFixed(2) + 's');
    f.style.setProperty('--delay', (Math.random() * 0.8).toFixed(2) + 's');
    f.style.setProperty('--x', (Math.random() * 220 - 110).toFixed(0) + 'px');
    f.style.setProperty('--r', (Math.random() * 720 - 360).toFixed(0) + 'deg');
    if (Math.random() < 0.5) f.style.borderRadius = '50%';
    celebrate.appendChild(f);
    f.addEventListener('animationend', () => f.remove());
  }
}

// ---------- Birthday cake: tap each candle to blow it out ----------
const cakeEl = document.getElementById('cake');
const cakeHint = document.getElementById('cakeHint');
const wishMessage = document.getElementById('wishMessage');
const candles = cakeEl ? [...cakeEl.querySelectorAll('.candle')] : [];
let wishMade = false;

function resetCake() {
  wishMade = false;
  candles.forEach(c => c.classList.remove('out'));
  if (wishMessage) wishMessage.classList.remove('show');
  if (cakeHint) cakeHint.textContent = 'toca las velas para apagarlas ♡';
}

candles.forEach(candle => {
  candle.addEventListener('click', () => {
    if (candle.classList.contains('out')) return;
    candle.classList.add('out');
    if (!wishMade && candles.every(c => c.classList.contains('out'))) {
      wishMade = true;
      if (cakeHint) cakeHint.textContent = 'pediste un deseo... y se hará realidad ♡';
      if (wishMessage) wishMessage.classList.add('show');
      spawnCelebration();
    }
  });
});

// ---------- 60 things I love about you ----------
const REASONS = [
  'Tu manera de querer sin pedir nada a cambio',
  'Tus abrazos que lo arreglan todo',
  'La paciencia infinita que me tienes',
  'Tu comida, que sabe a hogar',
  'Tu risa cuando algo te da mucha gracia',
  'La forma en que te preocupas por todos',
  'Tu fortaleza en los días difíciles',
  'Lo bonito que cantas aunque digas que no',
  'Tus consejos que siempre llegan a tiempo',
  'La forma en que dices mi nombre',
  'Tu fe que nunca se apaga',
  'Lo mucho que cuidas cada detalle',
  'Tu sonrisa por las mañanas',
  'La ternura con la que tratas a todos',
  'Tu valentía para seguir siempre adelante',
  'Lo generosa que eres con lo que tienes',
  'Tu forma de escuchar de verdad',
  'Los sacrificios que hiciste por mí',
  'Tu elegancia natural en todo lo que haces',
  'Cómo conviertes una casa en un hogar',
  'Tu manera de perdonar sin rencores',
  'Lo trabajadora que has sido toda tu vida',
  'Tus manos que tanto han dado',
  'Tu forma de creer en mí cuando nadie más lo hacía',
  'La calma que transmites cuando todo se complica',
  'Tu honestidad, siempre de frente',
  'Lo mucho que amas a tu familia',
  'Tus historias que nunca me canso de oír',
  'Tu forma de celebrar hasta lo más pequeño',
  'La paz que siento cuando estás cerca',
  'Tu cariño que no conoce límites',
  'Cómo me enseñaste a ser buena persona',
  'Tu manera de hacer sentir especial a cualquiera',
  'Tu sonrisa incluso cuando estás cansada',
  'Lo mucho que te esfuerzas cada día',
  'Tu corazón noble',
  'La forma en que cuidas a quienes amas',
  'Tus ganas de aprender siempre algo nuevo',
  'Tu forma de ver lo bueno en todo',
  'Lo orgullosa que te sientes de los tuyos',
  'Tus oraciones por mí',
  'Tu manera de decir “todo va a estar bien”',
  'La fuerza con la que enfrentas la vida',
  'Tu dulzura detrás de tu carácter',
  'Cómo me abrazas cuando más lo necesito',
  'Tu forma de reír de tus propias ocurrencias',
  'Lo bien que me conoces',
  'Tu amor que nunca me ha fallado',
  'Tu ejemplo de nunca rendirte',
  'La forma en que iluminas cada lugar',
  'Tu bondad con los desconocidos',
  'Lo mucho que te importa mi felicidad',
  'Tu manera de hacerme sentir en casa donde sea',
  'Tus detalles que dicen “te quiero” sin palabras',
  'Tu forma de guardar cada recuerdo con cariño',
  'Lo valiente que fuiste conmigo siempre',
  'Tu amor incondicional, pase lo que pase',
  'Todo lo que eres, tal como eres',
  'Ser exactamente la mamá que necesitaba',
  'Simplemente por existir y ser mía, Mami ♡'
];

const reasonsListEl = document.getElementById('reasonsList');
if (reasonsListEl) {
  REASONS.forEach(reason => {
    const li = document.createElement('li');
    li.textContent = reason;
    reasonsListEl.appendChild(li);
  });
}

// ---------- Audio player ----------
const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const curTime = document.getElementById('curTime');
const durTime = document.getElementById('durTime');

function formatTime(sec) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

playBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play().catch((err) => {
      console.error('No se pudo reproducir el audio:', err);
    });
  } else {
    audio.pause();
  }
});

audio.addEventListener('play', () => { playBtn.textContent = '❚❚'; });
audio.addEventListener('pause', () => { playBtn.textContent = '▶'; });
audio.addEventListener('error', () => { playBtn.textContent = '▶'; });

audio.addEventListener('loadedmetadata', () => {
  if (isFinite(audio.duration)) {
    durTime.textContent = formatTime(audio.duration);
  } else {
    // Some mp3 encodes report Infinity until Chrome scans the file; force it to calculate.
    audio.currentTime = 1e101;
    audio.addEventListener('timeupdate', function fixDuration() {
      audio.removeEventListener('timeupdate', fixDuration);
      audio.currentTime = 0;
      durTime.textContent = formatTime(audio.duration);
    });
  }
});

audio.addEventListener('durationchange', () => {
  if (isFinite(audio.duration)) {
    durTime.textContent = formatTime(audio.duration);
  }
});

audio.addEventListener('timeupdate', () => {
  curTime.textContent = formatTime(audio.currentTime);
  const pct = (audio.currentTime / audio.duration) * 100 || 0;
  progressFill.style.width = pct + '%';
});

audio.addEventListener('ended', () => {
  playBtn.textContent = '▶';
});

progressBar.addEventListener('click', (e) => {
  const rect = progressBar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  if (isFinite(audio.duration)) {
    audio.currentTime = pct * audio.duration;
  }
});

// ---------- Photo carousel ----------
const photos = [
  { src: 'assets/img/flor-8.jpg', caption: 'un beso que lo dice todo ♡' },
  { src: 'assets/img/flor-2.png', caption: 'siempre elegante, siempre mi mamá ♡' },
  { src: 'assets/img/flor-9.jpg', caption: 'atardeceres que se quedan en el corazón ♡' },
  { src: 'assets/img/flor-10.jpg', caption: 'juntos, como siempre ♡' },
];

let photoIndex = 0;
const polaroidEl = document.getElementById('polaroid');
const carouselImg = document.getElementById('carouselImg');
const carouselCaption = document.getElementById('carouselCaption');
const carouselCount = document.getElementById('carouselCount');
const carouselDots = document.getElementById('carouselDots');
const photoSheen = document.getElementById('photoSheen');

// The back frame (.polaroid-back) is plain decoration and is never touched here —
// only this one front card swaps its photo/caption and plays the pan animation.
function renderPhoto(direction) {
  const p = photos[photoIndex];
  carouselImg.src = p.src;
  carouselImg.alt = p.caption;
  carouselCaption.textContent = p.caption;
  carouselCount.textContent = `${String(photoIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
  [...carouselDots.children].forEach((dot, i) => dot.classList.toggle('active', i === photoIndex));

  polaroidEl.classList.remove('pan-next', 'pan-prev');
  void polaroidEl.offsetWidth;
  polaroidEl.classList.add(direction === 'prev' ? 'pan-prev' : 'pan-next');

  photoSheen.classList.remove('play');
  void photoSheen.offsetWidth;
  photoSheen.classList.add('play');
}

photos.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.setAttribute('aria-label', `Go to photo ${i + 1}`);
  dot.addEventListener('click', () => {
    const direction = i < photoIndex ? 'prev' : 'next';
    photoIndex = i;
    renderPhoto(direction);
  });
  carouselDots.appendChild(dot);
});

document.getElementById('prevPhoto').addEventListener('click', () => {
  photoIndex = (photoIndex - 1 + photos.length) % photos.length;
  renderPhoto('prev');
});
document.getElementById('nextPhoto').addEventListener('click', () => {
  photoIndex = (photoIndex + 1) % photos.length;
  renderPhoto('next');
});

renderPhoto('next');

// ---------- Letter body ----------
const letterText = `Un primero de agosto, hace ya sesenta años, el mundo amaneció con una mujer que todavía no sabía todo el bien que iba a sembrar a su paso. Nadie imaginó ese día que esa niña recién llegada terminaría siendo, con el tiempo, refugio de tantas personas, sostén de una familia entera y ejemplo de una fuerza que no se aprende, se vive.

Mucho antes de convertirse en mamá ya era una mujer digna de admirar. Fue hija entregada, hermana presente, amiga fiel, esa persona a la que todos terminan buscando cuando algo se derrumba. Creció aprendiendo a cargar responsabilidades que no le tocaban todavía, y aun así nunca perdió esa ternura que la sigue caracterizando hasta hoy. Sesenta años después, sigue siendo esa misma mujer, solo que más sabia, más fuerte y con una historia mucho más grande que contar.

Ha vivido de todo. Días difíciles que hubieran doblado a cualquiera, noches donde el cansancio parecía ganarle a todo, y aun así, cada mañana, decidía volver a levantarse con la misma fe de siempre. Nunca vivió pensando solo en ella. Su alegría siempre estuvo en ver bien a los demás, en asegurarse de que a su familia no le faltara nada, aunque para lograrlo tuviera que sacrificar su propio descanso una y otra vez.

Hay mujeres que simplemente atraviesan los años, y hay otras que los transforman en algo hermoso para quienes las rodean. Ella pertenece a las segundas. Sesenta años no son solo un número en su vida, son sesenta años de entrega, sesenta años enseñando con el ejemplo, sesenta años siendo la persona que todos en la familia buscan cuando necesitan un abrazo real.

Y en medio de esa historia tan suya, llegó otra historia que cambió todo. Se convirtió en mamá, y ese día algo en ella, que ya era fuerte, se volvió invencible. Aprendió a querer de una forma distinta, una que no se mide en palabras sino en desvelos, en paciencia infinita y en una entrega que no conoce límite.

Conmigo aprendió a ser mamá de una manera que pocos entienden. Cuando el mundo dudó de lo que yo podría lograr, ella jamás dudó. Convirtió cada obstáculo en una lección, cada intento y cada tropiezo en una oportunidad más para demostrarme que el amor, cuando es de verdad, siempre encuentra la manera de llegar, aunque el camino sea distinto al de los demás.

Hubo noches donde el cansancio y el miedo se mezclaban en silencio, y aun así, al día siguiente, aparecía con una sonrisa que me hacía creer que todo iba a estar bien. Nunca dejó que mis diferencias definieran quién iba a ser yo. Me enseñó, sin decirlo con palabras, que la perseverancia siempre le termina ganando al miedo, y que el amor de una madre puede convertirse en la fuerza más grande que alguien pueda tener.

Hoy entiendo que ser mamá no se trata de la perfección, sino de la entrega constante, de elegir todos los días seguir cuidando, seguir enseñando, seguir queriendo, aunque nadie lo note. Eso es exactamente lo que ella ha hecho durante todos estos años, conmigo y con cada persona que ha tenido la fortuna de cruzarse en su camino.

No necesito escribir su nombre para que el mundo entero sepa quién es. Basta con mirar todo lo que ha construido, todas las vidas que ha tocado y todo el amor que sigue regalando incluso en los días donde el suyo propio ha sido el más difícil.

Hoy no solo celebramos que cumple sesenta años. Celebramos sesenta años de una mujer que decidió, una y otra vez, convertir su vida en un refugio para los demás. Celebramos a la mamá que me enseñó que el amor verdadero no necesita condiciones, solo constancia.

Feliz cumpleaños, Mami. Gracias por cada año de tu vida que decidiste compartir con la mía. Te amo con todo lo que soy, hoy y siempre.`;

const letterBodyEl = document.getElementById('letterBody');
letterText.split('\n\n').forEach(paragraph => {
  const p = document.createElement('p');
  p.textContent = paragraph.trim();
  letterBodyEl.appendChild(p);
});
