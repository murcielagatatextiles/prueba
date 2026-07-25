// =================== DATA ===================
const ZONES = [
  {
    id: 1,
    icon: "👤",
    title: "Zona 1: Identidad",
    subtitle: "¿Quién eres en internet?",
    type: "memory",
    color: "#6c43b0",
  },
  {
    id: 2,
    icon: "🚦",
    title: "Zona 2: Relaciones",
    subtitle: "¿Cómo te relacionas digitalmente?",
    type: "semaforo",
    color: "#27ae60",
  },
  {
    id: 3,
    icon: "🔍",
    title: "Zona 3: Información",
    subtitle: "¿Cómo navegas la información?",
    type: "verdaderofalso",
    color: "#1a6ea8",
  },
  {
    id: 4,
    icon: "⚖️",
    title: "Zona 4: Derechos",
    subtitle: "Tus derechos digitales",
    type: "draganddrop",
    color: "#e05a2b",
  },
  {
    id: 5,
    icon: "🏆",
    title: "Zona 5: Desafío Final",
    subtitle: "Toma de decisiones",
    type: "final",
    color: "#c0392b",
  }
];

// =================== GAME STATE ===================
let state = {
  completed: [],
  scores: {},
  currentZone: null,
  gameScore: 0,
  totalScore: 0,
  feedbackQueue: [],
};

function saveState() {
  try { localStorage.setItem('cdState', JSON.stringify(state)); } catch(e){}
}
function loadState() {
  try {
    const s = localStorage.getItem('cdState');
    if (s) {
      const p = JSON.parse(s);
      // Reconstruimos el estado validando cada campo, así nunca se rompe
      // si quedó guardada una versión anterior o incompleta en este navegador.
      state = {
        completed: Array.isArray(p.completed) ? p.completed : [],
        scores: (p.scores && typeof p.scores === 'object') ? p.scores : {},
        currentZone: p.currentZone || null,
        gameScore: typeof p.gameScore === 'number' ? p.gameScore : 0,
        totalScore: typeof p.totalScore === 'number' ? p.totalScore : 0,
        feedbackQueue: Array.isArray(p.feedbackQueue) ? p.feedbackQueue : [],
      };
    }
  } catch(e){}
}
loadState();

// =================== NAVIGATION ===================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
}

function showMap() {
  renderMap();
  showScreen('screen-map');

}

function showFinal() {
  const totalPossible = Object.keys(state.scores).reduce((acc, k) => acc + (state.scores[k].max || 0), 0);
  const totalEarned = Object.keys(state.scores).reduce((acc, k) => acc + (state.scores[k].earned || 0), 0);
  document.getElementById('final-score-display').textContent = totalEarned + ' / ' + totalPossible + ' puntos';
  const pct = totalPossible > 0 ? totalEarned / totalPossible : 0;
  const starCount = pct >= 0.9 ? 5 : pct >= 0.7 ? 4 : pct >= 0.5 ? 3 : 2;

  // Limpia cualquier resto de una animación anterior y deja el cofre cerrado
  document.querySelectorAll('.flying-star').forEach(el => el.remove());
  const chestWrap = document.getElementById('chest-wrap');
  chestWrap.classList.remove('opened');
  const starsRow = document.getElementById('final-stars');
  starsRow.classList.remove('revealed');
  starsRow.innerHTML = '';
  for (let i = 0; i < starCount; i++) {
    const slot = document.createElement('span');
    slot.className = 'star-slot';
    slot.textContent = '⭐';
    starsRow.appendChild(slot);
  }

  showScreen('screen-final');

  // Espera a que la pantalla esté visible y medida antes de animar
  requestAnimationFrame(() => {
    setTimeout(() => {
      chestWrap.classList.add('opened'); // el cofre se abre

      setTimeout(() => {
        const mouthRect = document.getElementById('chest-mouth').getBoundingClientRect();
        const slots = starsRow.querySelectorAll('.star-slot');
        const clones = [];

        slots.forEach((slot, i) => {
          const targetRect = slot.getBoundingClientRect();
          const star = document.createElement('span');
          star.className = 'flying-star';
          star.textContent = '⭐';
          star.style.left = mouthRect.left + 'px';
          star.style.top = mouthRect.top + 'px';
          document.body.appendChild(star);
          clones.push(star);

          // Salen del cofre con un pequeño desfase entre cada una
          setTimeout(() => {
            star.classList.add('launched');
            star.style.left = (mouthRect.left + (i - (slots.length - 1) / 2) * 14) + 'px';
            star.style.top = (mouthRect.top - 40) + 'px';
          }, i * 120);

          // Luego vuelan hasta su posición final en la fila de estrellas
          setTimeout(() => {
            star.classList.add('landed');
            star.style.left = (targetRect.left + targetRect.width / 2) + 'px';
            star.style.top = (targetRect.top + targetRect.height / 2) + 'px';
          }, i * 120 + 380);
        });

        // Al aterrizar la última estrella, se revela la fila real y se quitan los clones
        const totalDelay = (slots.length - 1) * 120 + 380 + 700;
        setTimeout(() => {
          starsRow.classList.add('revealed');
          clones.forEach(c => c.remove());
        }, totalDelay);
      }, 550);
    }, 300);
  });
}

function restartGame() {
  state = { completed: [], scores: {}, currentZone: null, gameScore: 0, totalScore: 0, feedbackQueue: [] };
  try { localStorage.removeItem('cdState'); } catch(e){}
  showScreen('screen-intro');
}

function confirmResetProgress() {
  const ok = confirm('¿Seguro que quieres borrar tu progreso guardado y empezar de cero? Esta acción no se puede deshacer.');
  if (ok) {
    restartGame();
  }
}

function getShareData(context) {
  const scoreText = document.getElementById('final-score-display')?.textContent || '';
  const text = context === 'intro'
    ? '¡Te invito a jugar Ciudadano/a Digital — Isla del Tesoro! 🏝️ Aprende a navegar el mundo digital con seguridad y respeto.'
    : `¡Completé la aventura de Ciudadano/a Digital y obtuve ${scoreText}! 🏝️ Aprende a navegar el mundo digital con seguridad y respeto.`;
  return {
    title: 'Ciudadano/a Digital — Isla del Tesoro',
    text,
    url: window.location.href,
    image: 'portada.png'
  };
}

// Convierte portada.png en un File para poder adjuntarlo con la Web Share API
// (funciona en navegadores móviles compatibles: Chrome/Safari en Android e iOS).
async function getCoverImageFile() {
  try {
    const response = await fetch('portada.png');
    const blob = await response.blob();
    return new File([blob], 'portada.png', { type: blob.type || 'image/png' });
  } catch (e) {
    return null;
  }
}

// Botón genérico: usa el share nativo del dispositivo si existe (móviles),
// adjuntando la imagen de portada cuando el navegador lo permite.
// Si no hay soporte, cae en el flujo de copiar enlace.
async function shareAchievement(context) {
  const shareData = getShareData(context);
  const file = await getCoverImageFile();

  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    // Comparte texto + enlace + imagen adjunta (ideal en móviles)
    navigator.share({ title: shareData.title, text: shareData.text, url: shareData.url, files: [file] }).catch(() => {});
  } else if (navigator.share) {
    // El dispositivo soporta compartir pero no archivos: comparte texto + enlace,
    // y la imagen igual aparecerá como preview gracias a las etiquetas Open Graph.
    navigator.share({ title: shareData.title, text: shareData.text, url: shareData.url }).catch(() => {});
  } else {
    shareCopyLink(context);
  }
}

function shareToWhatsapp(context) {
  const { text, url } = getShareData(context);
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}

function shareToFacebook(context) {
  const { text, url } = getShareData(context);
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
  window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
}

function shareCopyLink(context) {
  const { text, url } = getShareData(context);
  const fullText = `${text} ${url}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(fullText)
      .then(() => alert('¡Copiado! Ya puedes pegarlo donde quieras compartirlo.'))
      .catch(() => alert('No se pudo copiar automáticamente. Copia el enlace desde la barra de tu navegador.'));
  } else {
    alert('No se pudo copiar automáticamente. Copia el enlace desde la barra de tu navegador.');
  }
}

// =================== MAP RENDERING ===================
// ViewBox SVG superpuesto: 1000 x 707
// Coordenadas calibradas por el usuario

const START_POS       = { x: 175, y: 105 };
const CHEST_POS       = { x: 861, y: 583 };

const ZONE_NODES = [
  { x: 128, y: 347, color: '#e91e8c', label: 'Z1' },
  { x: 553, y: 163, color: '#2e7d32', label: 'Z2' },
  { x: 895, y: 342, color: '#f9a825', label: 'Z3' },
  { x: 578, y: 431, color: '#7b1fa2', label: 'Z4' },
  { x: 561, y: 635, color: '#1565c0', label: 'Z5' },
];

const PATH_CELLS = [
  { x: 175, y: 105 }, // 0  INICIO
  { x: 128, y: 195 }, // 1
  { x: 100, y: 270 }, // 2
  { x: 128, y: 347 }, // 3  ZONA 1
  { x: 200, y: 375 }, // 4
  { x: 278, y: 340 }, // 5
  { x: 355, y: 285 }, // 6
  { x: 445, y: 220 }, // 7
  { x: 553, y: 163 }, // 8  ZONA 2
  { x: 638, y: 163 }, // 9
  { x: 718, y: 175 }, // 10
  { x: 800, y: 205 }, // 11
  { x: 860, y: 268 }, // 12
  { x: 895, y: 342 }, // 13 ZONA 3
  { x: 870, y: 415 }, // 14
  { x: 810, y: 450 }, // 15
  { x: 740, y: 460 }, // 16
  { x: 670, y: 455 }, // 17
  { x: 578, y: 431 }, // 18 ZONA 4
  { x: 510, y: 460 }, // 19
  { x: 445, y: 490 }, // 20
  { x: 480, y: 555 }, // 21
  { x: 561, y: 635 }, // 22 ZONA 5
  { x: 650, y: 620 }, // 23
  { x: 750, y: 600 }, // 24
  { x: 861, y: 583 }, // 25 COFRE
];

const ZONE_CELL_INDICES = [3, 8, 13, 18, 22];
const CHEST_CELL_IDX    = 25;

// Posición actual del personaje — SIEMPRE empieza en 0 (INICIO)
// Se restaura desde estado guardado en renderMap()
let charCellIdx = 0;

function getCellPos(idx) {
  return PATH_CELLS[Math.max(0, Math.min(idx, PATH_CELLS.length - 1))];
}

function getCharCellIdxForState() {
  // El personaje queda en la celda de la última zona completada.
  // Si no hay ninguna, queda en INICIO (índice 0).
  let best = 0;
  for (let zi = 0; zi < ZONES.length; zi++) {
    if (state.completed.includes(ZONES[zi].id)) {
      best = ZONE_CELL_INDICES[zi];
    }
  }
  return best;
}

function renderMap() {
  const pct = (state.completed.length / ZONES.length) * 100;
  document.getElementById('main-progress').style.width = pct + '%';

  // Restaurar posición desde estado (sin animación)
  charCellIdx = getCharCellIdxForState();

  const VW = 1000, VH = 707;

  // Casillas blancas decorativas
  const decorCells = PATH_CELLS.map((cell, idx) => {
    if (ZONE_CELL_INDICES.includes(idx) || idx === 0 || idx === CHEST_CELL_IDX) return '';
    return `<ellipse cx="${cell.x}" cy="${cell.y}" rx="28" ry="24"
      fill="white" fill-opacity="0.12" stroke="white" stroke-opacity="0.25" stroke-width="1"/>`;
  }).join('');

  // Zonas jugables
  const zonesSvg = ZONES.map((zone, zi) => {
    const node        = ZONE_NODES[zi];
    const isDone      = state.completed.includes(zone.id);
    const isAvailable = zi === 0 || state.completed.includes(ZONES[zi - 1].id);
    const isLocked    = !isAvailable && !isDone;

    let badge = '';
    if (isDone) {
      badge = `
        <circle cx="${node.x + 28}" cy="${node.y - 28}" r="15"
          fill="#27ae60" stroke="white" stroke-width="2.5"/>
        <text x="${node.x + 28}" y="${node.y - 23}" text-anchor="middle"
          font-size="16" fill="white" font-weight="bold">✓</text>`;
    } else if (isLocked) {
      badge = `
        <circle cx="${node.x + 28}" cy="${node.y - 28}" r="15"
          fill="rgba(0,0,0,0.5)" stroke="white" stroke-width="2.5"/>
        <text x="${node.x + 28}" y="${node.y - 23}" text-anchor="middle"
          font-size="14" fill="white">🔒</text>`;
    }

    const pulseClass = (!isLocked && !isDone) ? 'zone-pulse' : '';
    const opacity    = isLocked ? '0.4' : '0.92';
    const clickAttr  = !isLocked
      ? `onclick="handleZoneClick(${zi})" style="cursor:pointer"`
      : `style="cursor:not-allowed"`;

    return `
      <g class="zone-cell-group" onmouseenter="showZoneDetail(${zi})" ${clickAttr}>
        <ellipse cx="${node.x}" cy="${node.y}" rx="48" ry="42"
          fill="${node.color}" opacity="${opacity}"
          stroke="white" stroke-width="${isDone ? 4 : 2.5}"
          class="${pulseClass}"/>
        <text x="${node.x}" y="${node.y - 5}" text-anchor="middle"
          dominant-baseline="central" font-size="26"
          style="pointer-events:none">${zone.icon}</text>
        ${badge}
      </g>`;
  }).join('');

  // Personaje 📱
  const cPos    = getCellPos(charCellIdx);
  const charSvg = buildCharSvg(cPos.x, cPos.y);

  document.getElementById('island-map').innerHTML = `
    <div class="map-img-wrap">
      <img src="SPRITES.png" alt="Mapa del Tesoro"
        style="display:block;width:100%;height:auto;border-radius:18px 18px 0 0;"/>
      <svg id="map-svg-overlay" viewBox="0 0 ${VW} ${VH}"
        xmlns="http://www.w3.org/2000/svg"
        style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;">
        <defs>
          <style>
            .zone-cell-group { pointer-events:all; }
            .zone-pulse {
              animation: zonePulse 2.2s ease-in-out infinite;
            }
            @keyframes zonePulse {
              0%,100% { filter: drop-shadow(0 0 5px rgba(255,255,255,0.6)); }
              50%      { filter: drop-shadow(0 0 16px rgba(255,255,255,1)); }
            }
          </style>
        </defs>
        ${decorCells}
        ${zonesSvg}
        ${charSvg}
      </svg>
    </div>
    <div class="board-legend" id="zone-detail">
      <p>Avanza zona por zona: completa una para desbloquear la siguiente 🔓</p>
    </div>`;

  showZoneDetail(firstActionableZoneIdx());
}

function buildCharSvg(cx, cy) {
  return `
    <g id="map-character" transform="translate(${cx},${cy - 52})">
      <ellipse cx="0" cy="52" rx="20" ry="7" fill="rgba(0,0,0,0.3)"/>
      <rect x="-15" y="0" width="30" height="44" rx="6"
        fill="#1a1a2e" stroke="#4fc3f7" stroke-width="2.5"/>
      <rect x="-10" y="5" width="20" height="30" rx="3" fill="#e3f2fd"/>
      <circle cx="-4" cy="14" r="3"   fill="#1a1a2e"/>
      <circle cx="4"  cy="14" r="3"   fill="#1a1a2e"/>
      <circle cx="-3" cy="13" r="1.1" fill="white"/>
      <circle cx="5"  cy="13" r="1.1" fill="white"/>
      <path d="M -5,22 Q 0,27 5,22" stroke="#1a1a2e" stroke-width="2.2"
        fill="none" stroke-linecap="round"/>
      <circle cx="0" cy="40" r="3"   fill="#37474f" stroke="#546e7a" stroke-width="1"/>
      <circle cx="0" cy="2"  r="1.5" fill="#37474f"/>
      <animateTransform attributeName="transform" type="translate"
        values="0,0; 0,-5; 0,0" dur="2s" repeatCount="indefinite" additive="sum"/>
    </g>`;
}

// ── Clic en zona: camina hasta allí, muestra botón "¡Jugar!" ──────────────
function handleZoneClick(zoneIdx) {
  const zone          = ZONES[zoneIdx];
  const targetCellIdx = ZONE_CELL_INDICES[zoneIdx];

  // Si ya está ahí (zona completada o vuelta al mapa), jugar directo
  if (charCellIdx === targetCellIdx) {
    startZone(zone);
    return;
  }

  // Bloquear interacción durante la animación
  const svg = document.getElementById('map-svg-overlay');
  if (svg) svg.style.pointerEvents = 'none';
  // Ocultar leyenda durante el viaje
  document.getElementById('zone-detail').innerHTML =
    '<p>🚶 ¡Caminando hacia la zona…</p>';

  animateCellByCell(charCellIdx, targetCellIdx, () => {
    charCellIdx = targetCellIdx;
    if (svg) svg.style.pointerEvents = '';
    // Llegó — jugar directamente
    startZone(zone);
  });
}

// Muestra en la leyenda el botón para arrancar el juego
function showZonePlayPrompt(zone) {
  document.getElementById('zone-detail').innerHTML = `
    <p><strong>${zone.icon} ${zone.title}</strong> — ${zone.subtitle}</p>
    <button class="btn-main" style="margin-top:8px;font-size:1rem;padding:10px 28px"
      onclick="startZone(ZONES[${ZONES.indexOf(zone)}])">
      ¡Jugar esta zona! 🎮
    </button>`;
}

// ── Al completar la última zona: camina al cofre y muestra pantalla final ──
function walkToChestThenFinish() {
  showScreen('screen-map');
  renderMap();

  setTimeout(() => {
    const svg = document.getElementById('map-svg-overlay');
    if (svg) svg.style.pointerEvents = 'none';
    document.getElementById('zone-detail').innerHTML =
      '<p>🎉 ¡Todas las zonas completadas! Corriendo al cofre…</p>';

    animateCellByCell(charCellIdx, CHEST_CELL_IDX, () => {
      charCellIdx = CHEST_CELL_IDX;
      setTimeout(() => showFinal(), 700);
    });
  }, 400);
}

// ── Animación celda a celda ────────────────────────────────────────────────
function animateCellByCell(fromIdx, toIdx, callback) {
  if (fromIdx >= toIdx) { callback(); return; }

  let current = fromIdx;

  function step() {
    current++;
    const pos  = getCellPos(current);
    const char = document.getElementById('map-character');
    if (!char) { callback(); return; }

    // Mover el grupo SVG actualizando el atributo transform
    char.setAttribute('transform', `translate(${pos.x},${pos.y - 52})`);

    if (current >= toIdx) {
      setTimeout(callback, 400);
    } else {
      setTimeout(step, 340);
    }
  }
  step();
}

function firstActionableZoneIdx() {
  for (let idx = 0; idx < ZONES.length; idx++) {
    if (!state.completed.includes(ZONES[idx].id)) return idx;
  }
  return ZONES.length - 1;
}

function showZoneDetail(idx) {
  const zone        = ZONES[idx];
  const isDone      = state.completed.includes(zone.id);
  const isAvailable = idx === 0 || state.completed.includes(ZONES[idx - 1].id);
  const isLocked    = !isAvailable && !isDone;
  const detail      = document.getElementById('zone-detail');

  let statusLine = isDone
    ? `✅ ¡Completada! ${state.scores[zone.id] ? state.scores[zone.id].earned + '/' + state.scores[zone.id].max + ' pts' : ''}`
    : isLocked
      ? '🔒 Completa la zona anterior para desbloquear'
      : '👉 Toca la zona para jugar';

  detail.innerHTML =
    `<p><strong>${zone.icon} ${zone.title}</strong> — ${zone.subtitle}<br>${statusLine}</p>`;
}

// =================== FEEDBACK ===================
let feedbackCallback = null;
function showFeedback(isCorrect, article, explanation, cb, label) {
  const overlay = document.getElementById('feedback-overlay');
  document.getElementById('fb-icon').textContent = isCorrect ? '🎉' : '💡';
  const title = document.getElementById('fb-title');
  title.textContent = isCorrect ? '¡Correcto!' : 'Aprendamos de esto';
  title.className = 'feedback-title ' + (isCorrect ? 'correct' : 'wrong');
  document.getElementById('fb-article').innerHTML = `<strong>${label || '📋 Marco Legal'}</strong>${article}`;
  document.getElementById('fb-explanation').textContent = explanation;
  feedbackCallback = cb;
  overlay.classList.add('show');
}
function closeFeedback() {
  document.getElementById('feedback-overlay').classList.remove('show');
  if (feedbackCallback) feedbackCallback();
}

// =================== ZONE STARTER ===================
function startZone(zone) {
  state.currentZone = zone;
  state.gameScore = 0;
  document.getElementById('game-zone-icon').textContent = zone.icon;
  document.getElementById('game-zone-title').textContent = zone.title;
  document.getElementById('live-score').textContent = '0';
  showScreen('screen-game');

  switch(zone.type) {
    case 'memory': startMemory(); break;
    case 'semaforo': startSemaforo(); break;
    case 'verdaderofalso': startVF(); break;
    case 'draganddrop': startDnD(); break;
    case 'final': startFinalChallenge(); break;
  }
}

function addScore(pts) {
  state.gameScore += pts;
  document.getElementById('live-score').textContent = state.gameScore;
}

function completeZone(maxScore) {
  const zone = state.currentZone;
  const pct = state.gameScore / maxScore;

  if (pct < 0.6) {
    renderRetry(zone, maxScore);
    return;
  }

  if (!state.completed.includes(zone.id)) state.completed.push(zone.id);
  state.scores[zone.id] = { earned: state.gameScore, max: maxScore };
  saveState();

  renderProtocol(zone);
}

function renderRetry(zone, maxScore) {
  const earned = state.gameScore;
  const needed = Math.ceil(maxScore * 0.6);
  const body = document.getElementById('game-body');
  body.innerHTML = `
    <div style="background:linear-gradient(135deg,#e05a2b,#c0392b);border-radius:16px;padding:24px;text-align:center;color:white;margin-bottom:16px">
      <div style="font-size:3rem;margin-bottom:8px">😅</div>
      <h2 style="font-family:'Fredoka One',cursive;font-size:1.6rem;margin-bottom:6px">¡Casi!</h2>
      <p style="opacity:0.9;font-size:0.95rem">Necesitas al menos el 60% para avanzar.</p>
      <div style="background:rgba(255,255,255,0.2);border-radius:12px;padding:12px;margin:14px 0">
        <div style="font-family:'Fredoka One',cursive;font-size:2rem">${earned} / ${maxScore} pts</div>
        <div style="font-size:0.85rem;opacity:0.85">Mínimo requerido: ${needed} pts</div>
      </div>
      <p style="font-size:0.88rem;opacity:0.85">Revisa el feedback de cada pregunta e inténtalo de nuevo. ¡Tú puedes!</p>
    </div>
    <div style="text-align:center">
      <button class="btn-main" onclick="startZone(state.currentZone)">🔄 Intentar de nuevo</button>
      <br>
      <button class="btn-secondary" onclick="showMap()" style="margin-top:10px">Volver al mapa</button>
    </div>
  `;
}

// =================== PROTOCOL RENDERER ===================
const PROTOCOLS = {
  1: {
    title: "¿Vulneraron tu identidad digital?",
    body: "Si alguien suplantó tu identidad, creó perfiles falsos con tus datos o usó tu información sin permiso, esto es un delito en Ecuador.",
    steps: [
      "Documenta la evidencia: toma capturas de pantalla del perfil o contenido falso.",
      "Reporta el perfil o contenido directamente a la red social o plataforma.",
      "Denuncia ante la Fiscalía General del Estado o la Policía Nacional.",
      "Informa a un adulto de confianza (madre, padre, tutor/a, docente).",
      "Si tienes menos de 18 años, el MIES o DINAPEN puede orientarte.",
    ],
    contacts: ["ECU911: 911 (pide la unidad DINAPEN)", "Denuncia: portal de Fiscalía o acude en persona", "MIES: 1800-002-002"]
  },
  2: {
    title: "Protección de datos y relaciones digitales",
    body: "Si alguien usó tu información sin permiso, publicó contenido tuyo, o te acosó digitalmente, puedes actuar. No estás solo/a.",
    steps: [
      "No borres la evidencia: guarda capturas, enlaces, chats y registra fechas. Es clave para cualquier denuncia.",
      "Bloquea y protégete: bloquea a la persona agresora, ajusta tu privacidad y cambia contraseñas si hay riesgo.",
      "No respondas con agresión: evita insultar de vuelta o difundir más contenido. Puede empeorar tu situación.",
      "Busca apoyo: habla con familia, docentes, el DECE o un/a psicólogo/a. No debes manejarlo solo/a.",
      "Denuncia: acude a la Fiscalía, la Unidad de Ciberdelitos de la Policía Nacional o usa la plataforma en línea de la Fiscalía.",
      "Si fue en redes sociales: reporta la cuenta en la plataforma, solicita eliminación del contenido y guarda confirmación del reporte.",
    ],
    contacts: ["ECU911: 911", "Denuncia: portal de Fiscalía o Unidad de Flagrancia", "1800-DELITO: solo para dar información anónima, no para denunciar"]
  },
  3: {
    title: "¿Fuiste víctima de desinformación o fraude digital?",
    body: "Si te engañaron con información falsa que te causó daño, o si fuiste víctima de un fraude o estafa en línea, puedes denunciarlo.",
    steps: [
      "Guarda evidencia del contenido falso o del fraude (capturas, correos, links).",
      "Reporta el contenido a la plataforma como desinformación o fraude.",
      "Si perdiste dinero o datos, denuncia en la Fiscalía por delito informático.",
      "Reporta fraudes bancarios a la Superintendencia de Bancos.",
      "Informa a tu familia y advierte a otros usuarios para evitar que sean víctimas.",
    ],
    contacts: ["Denuncia: portal de Fiscalía o en persona", "Superintendencia de Bancos: 1800-325826", "ARCOTEL: 1800-567-567", "ECU911: 911"]
  },
  4: {
    title: "¿Vulneraron tus derechos digitales?",
    body: "En Ecuador, la Ley Orgánica de Protección de Datos Personales (LOPDP) y el Código Orgánico Integral Penal (COIP) protegen tus datos y tu vida privada en línea.",
    steps: [
      "Identifica qué derecho fue vulnerado: privacidad, datos personales, imagen, etc.",
      "Documenta con capturas de pantalla, correos o cualquier evidencia digital.",
      "Envía una solicitud de supresión o rectificación de tus datos a la empresa o persona responsable.",
      "Presenta una denuncia ante la Autoridad de Protección de Datos Personales del Ecuador.",
      "Si hay delito penal, acude a la Fiscalía General del Estado.",
    ],
    contacts: ["Denuncia: portal de Fiscalía o en persona", "Defensoría del Pueblo: acude a una oficina o defensoria.gob.ec", "SNAP (datos): protecciondatos.gob.ec", "ECU911: 911"]
  },
  5: {
    title: "Protocolo General de Ciudadanía Digital",
    body: "Como ciudadano/a digital completo/a, ahora conoces los protocolos de todas las áreas. Recuerda que nunca estás solo/a.",
    steps: [
      "Ante cualquier situación digital que te incomode: detente, reflexiona, no respondas impulsivamente.",
      "Guarda evidencia siempre antes de eliminar cualquier contenido.",
      "Cuenta a un adulto de confianza: docente, padre, madre o tutor/a.",
      "Usa los canales oficiales de denuncia según el tipo de vulneración.",
      "Comparte lo aprendido con tus compañeros/as para crear una comunidad digital más segura.",
    ],
    contacts: ["ECU911: 911 (pide la unidad DINAPEN)", "Denuncia: portal de Fiscalía o en persona", "MIES: 1800-002-002"]
  }
};

function renderProtocol(zone) {
  const proto = PROTOCOLS[zone.id];
  const body = document.getElementById('game-body');
  const allDone = ZONES.every(z => state.completed.includes(z.id));

  body.innerHTML = `
    <div class="zone-complete-banner">
      <div style="font-size:2.5rem">${zone.icon}</div>
      <h2>¡Zona completada!</h2>
      <p>${zone.subtitle}</p>
      <div class="score-display">⭐ ${state.gameScore} pts</div>
    </div>

    <div class="protocol-card">
      <h3>📋 ${proto.title}</h3>
      <p>${proto.body}</p>
      <strong style="display:block;font-size:0.82rem;text-transform:uppercase;color:#666;margin-bottom:8px">Pasos a seguir:</strong>
      <ol class="protocol-steps">
        ${proto.steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
      <strong style="display:block;font-size:0.82rem;text-transform:uppercase;color:#666;margin:12px 0 6px">Contactos de ayuda en Ecuador:</strong>
      <div class="contact-chips">
        ${proto.contacts.map(c => `<span class="chip">${c}</span>`).join('')}
      </div>
    </div>

    <div style="text-align:center; margin-top:10px">
      ${allDone
        ? `<button class="btn-main" onclick="walkToChestThenFinish()">🏆 ¡Ir al cofre! 🎉</button>`
        : `<button class="btn-main" onclick="showMap()">Continuar en el mapa →</button>`
      }
      <br><button class="btn-secondary" onclick="startZone(state.currentZone)" style="margin-top:10px">Repetir zona</button>
    </div>
  `;
}

// =================== UTILIDADES DE ALEATORIEDAD ===================
// Devuelve una copia del arreglo con sus elementos en orden aleatorio (Fisher-Yates)
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
// Devuelve n elementos aleatorios (sin repetir) de un arreglo "pool"
function pickRandom(pool, n) {
  return shuffleArray(pool).slice(0, Math.min(n, pool.length));
}

// =============================================
// ===== ZONA 1: MEMORIA ======================
// =============================================
const MEMORY_PAIRS = [
  { icon1: "🔑", term: "Compartir contraseña", icon2: "🕵️", def: "Cuenta hackeada",
    article: "Constitución, Art. 66 num. 19: tus datos están protegidos. Compartir tu contraseña, incluso con alguien de confianza, abre la puerta a que otros entren a tu cuenta sin control." },
  { icon1: "🔐", term: "Usar la misma contraseña en todo", icon2: "🔓", def: "Acceso a múltiples cuentas",
    article: "Art. 212 COIP – Suplantación de identidad: si hackean una cuenta y usas la misma clave en todas, el atacante puede entrar a todas tus cuentas con un solo dato." },
  { icon1: "🌐", term: "Aceptar solicitudes de desconocidos", icon2: "🐺", def: "Acoso o grooming",
    article: "LOPDP, Art. 7 – Autodeterminación informativa: decidir quién ve tu información es un derecho. Aceptar desconocidos te expone a manipulación o acoso (grooming)." },
  { icon1: "📍", term: "Publicar ubicación en tiempo real", icon2: "👁️", def: "Riesgo de seguimiento",
    article: "LOPDP, Art. 10 – Principio de seguridad: tu ubicación es un dato sensible. Compartirla en tiempo real permite que alguien sepa exactamente dónde estás." },
  { icon1: "🎣", term: "Hacer clic en enlaces sospechosos", icon2: "🗃️", def: "Robo de datos personales",
    article: "Art. 190 COIP – Apropiación fraudulenta por medios electrónicos: los enlaces de phishing imitan sitios reales para engañarte y robar tus datos personales o financieros." },
  { icon1: "📲", term: "Descargar apps de sitios no oficiales", icon2: "🦠", def: "Instalación de malware",
    article: "Art. 232 COIP – Ataque a la integridad de sistemas informáticos: las apps fuera de tiendas oficiales pueden traer virus que dañan o roban tu información sin que lo notes." },
  { icon1: "🤳", term: "Participar en retos virales peligrosos", icon2: "🚑", def: "Daño físico o exposición riesgosa",
    label: "💡 Dato clave",
    article: "Muchos retos virales priorizan las vistas y los 'likes' sobre tu seguridad real. Antes de participar, pregúntate si vale la pena el riesgo." },
  { icon1: "🔥", term: "Enviar fotos íntimas", icon2: "📤", def: "Difusión sin consentimiento",
    article: "Art. 178 COIP – Violación a la intimidad: una vez enviada una imagen, pierdes el control sobre ella. Compartirla sin tu permiso es un delito." },
  { icon1: "🔓", term: "No configurar privacidad en redes", icon2: "📢", def: "Exposición de información personal",
    label: "⚖️ Marco legal",
    article: "Ley Orgánica de Protección de Datos Personales (LOPDP): Protege tus datos personales y regula cómo pueden ser recopilados, utilizados y compartidos. Configurar la privacidad en redes sociales ayuda a proteger tu información." },
  { icon1: "📰", term: "Creer en noticias falsas sin verificar", icon2: "❌", def: "Desinformación y malas decisiones",
    label: "💡 Dato clave",
    article: "Verificar la fuente antes de compartir o creer una noticia evita que tomes decisiones basadas en información falsa, y previene que ayudes a difundirla." },
];

let memFlipped = [];
let memMatched = [];
let memLocked = false;
let memCards = [];
let memPlayCount = 0;

function startMemory() {
  memFlipped = []; memMatched = []; memLocked = false; memCards = [];
  const pairs = pickRandom(MEMORY_PAIRS, 6);
  memPlayCount = pairs.length;
  const items = [];
  pairs.forEach((p, i) => {
    items.push({ id: i, side: 'term', icon: p.icon1, text: p.term, match: i, article: p.article, defText: p.def });
    items.push({ id: i + pairs.length, side: 'def', icon: p.icon2, text: p.def, match: i, article: p.article, termText: p.term });
  });
  // Shuffle
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  memCards = items;

  const body = document.getElementById('game-body');
  body.innerHTML = `
    <div class="mem-instructions">
      Cada dato tuyo cuenta algo de quién eres. Encuentra las parejas entre <strong>tus datos personales</strong> y el <strong>riesgo o consecuencia</strong> que pueden traer si los compartes sin cuidado. ¡Piensa antes de elegir!
    </div>
    <div class="mem-board-bg">
      <div class="memory-grid" id="mem-grid"></div>
    </div>
    <div id="mem-match-info"></div>
  `;
  renderMemGrid();
}

function renderMemGrid() {
  const grid = document.getElementById('mem-grid');
  grid.innerHTML = '';
  memCards.forEach((card, idx) => {
    const isMatched = memMatched.includes(card.match);
    const isFlipped = memFlipped.includes(idx) || isMatched;
    const el = document.createElement('div');
    el.className = 'mem-card' + (isFlipped ? ' flipped' : '') + (isMatched ? ' matched' : '');
    el.style.position = 'relative';
    el.innerHTML = `
      <div class="mem-card-front">❓</div>
      <div class="mem-card-back">
        <span class="mem-card-icon">${card.icon}</span>
        <span class="mem-card-text">${card.text}</span>
      </div>
    `;
    if (!isMatched) el.onclick = () => flipMemCard(idx);
    grid.appendChild(el);
  });
}

function flipMemCard(idx) {
  if (memLocked) return;
  if (memFlipped.includes(idx)) return;
  if (memMatched.includes(memCards[idx].match)) return;
  memFlipped.push(idx);
  renderMemGrid();

  if (memFlipped.length === 2) {
    memLocked = true;
    const [a, b] = memFlipped;
    if (memCards[a].match === memCards[b].match && memCards[a].side !== memCards[b].side) {
      memMatched.push(memCards[a].match);
      memFlipped = [];
      memLocked = false;
      addScore(10);
      const termCard = memCards[a].side === 'term' ? memCards[a] : memCards[b];
      const defCard = memCards[a].side === 'def' ? memCards[a] : memCards[b];
      document.getElementById('mem-match-info').innerHTML = `
        <div class="mem-pair-label">
          <strong>✅ ¡Pareja encontrada!</strong><br>
          ${termCard.icon} ${termCard.text} = ${defCard.icon} ${defCard.text}
        </div>`;
      showFeedback(true, termCard.article,
        `${termCard.icon} ${termCard.text} → ${defCard.icon} ${defCard.text}`,
        () => {
          renderMemGrid();
          if (memMatched.length === memPlayCount) {
            setTimeout(() => completeZone(memPlayCount * 10), 400);
          }
        }, termCard.label);
    } else {
      setTimeout(() => {
        memFlipped = [];
        memLocked = false;
        renderMemGrid();
        document.getElementById('mem-match-info').innerHTML = `
          <div class="mem-pair-label" style="border-color:#e05a2b;color:#c0392b">
            No son pareja. ¡Sigue intentando!
          </div>`;
      }, 900);
    }
  }
}

// =============================================
// ===== ZONA 2: SEMÁFORO =====================
// =============================================
const SEMAFORO_SCENARIOS_POOL = [
  {
    text: "Pido permiso antes de publicar una foto donde aparece otra persona.",
    correct: 'verde',
    article: "Constitución del Ecuador, Art. 66 num. 19 y LOPDP Art. 4: la imagen de una persona es un dato personal. Publicarla sin consentimiento viola sus derechos.",
    explanations: {
      verde: "¡Correcto! Es legal y respetuoso. La imagen de cada persona le pertenece y necesita dar su permiso para que la publiques.",
      amarillo: "Pedir permiso no tiene ningún riesgo — es lo correcto y lo legal. No hay zona gris aquí.",
      rojo: "Pedir permiso es exactamente lo que la ley exige. Es una conducta sana, no peligrosa."
    }
  },
  {
    text: "Me retiro de una conversación digital cuando se vuelve agresiva.",
    correct: 'verde',
    article: "Constitución del Ecuador, Art. 66 num. 20: tienes derecho a tu bienestar e intimidad personal, incluyendo protegerte de entornos digitales hostiles.",
    explanations: {
      verde: "¡Correcto! Retirarte es una decisión sana y valiente. Proteger tu bienestar en línea también es un derecho.",
      amarillo: "No hay riesgo en retirarte. Es la respuesta más inteligente ante una conversación tóxica.",
      rojo: "Alejarte de una situación agresiva no es huir — es cuidarte. Es lo más recomendado."
    }
  },
  {
    text: "Denuncio una cuenta que difunde acoso u odio hacia una persona.",
    correct: 'verde',
    article: "El acoso digital y los actos de odio (Art. 177 COIP, cuando hay motivación discriminatoria) pueden ser delitos. Denunciarlo en la plataforma y ante la Fiscalía es un acto de ciudadanía digital responsable.",
    explanations: {
      verde: "¡Correcto! Denunciar el acoso protege a la víctima y activa los mecanismos legales. Es una conducta cívica y necesaria.",
      amarillo: "Denunciar no tiene riesgos. Si ves acoso, tienes la responsabilidad de reportarlo.",
      rojo: "Denunciar el acoso es exactamente lo correcto. No hacerlo puede permitir que el daño continúe."
    }
  },
  {
    text: "Publico fotos o videos privados de alguien sin pedirle permiso.",
    correct: 'rojo',
    article: "COIP, Art. 178 – Violación a la intimidad: difundir imágenes o videos de otra persona sin consentimiento está sancionado con prisión. No importa si la foto parece inocente.",
    explanations: {
      verde: "Esto es un delito. Publicar contenido de alguien sin su permiso viola su intimidad, aunque no parezca comprometedor.",
      amarillo: "No hay zona gris: publicar sin permiso es ilegal. El consentimiento no es opcional.",
      rojo: "¡Correcto! El Art. 178 del COIP lo sanciona. Siempre necesitas el permiso de la persona antes de publicar."
    }
  },
  {
    text: "Reviso el celular o las redes de otra persona sin que me lo autorice.",
    correct: 'rojo',
    article: "Constitución del Ecuador, Art. 66 num. 21: el secreto de las comunicaciones es un derecho fundamental. Acceder sin permiso — aunque sea tu pareja o amigo/a — es ilegal.",
    explanations: {
      verde: "Revisar el celular de alguien sin permiso viola su privacidad. No importa la razón o la relación que tengas.",
      amarillo: "No existe justificación para acceder a cuentas o mensajes ajenos sin autorización. Es ilegal.",
      rojo: "¡Correcto! La Constitución protege las comunicaciones privadas. Ninguna razón lo justifica."
    }
  },
  {
    text: "Difundo conversaciones privadas de alguien para exponerlo o humillarlo.",
    correct: 'rojo',
    article: "COIP, Art. 178 – Violación a la intimidad: difundir conversaciones privadas sin consentimiento es delito. Si además busca humillar, puede sumarse la contravención de descrédito o deshonra (Art. 396 núm. 1 COIP).",
    explanations: {
      verde: "Exponer conversaciones privadas para humillar es violencia digital. Es un delito con consecuencias penales.",
      amarillo: "Esto va más allá de un riesgo ético: es una conducta ilegal que puede derivar en denuncia formal.",
      rojo: "¡Correcto! Es una de las formas más comunes de acoso digital. Está sancionado por el COIP."
    }
  },
  {
    text: "Suplanto la identidad de alguien creando un perfil falso con su nombre y fotos.",
    correct: 'rojo',
    article: "COIP, Art. 212 – Suplantación de identidad: crear perfiles falsos usando datos de otra persona es un delito sancionado con hasta 3 años de prisión en Ecuador.",
    explanations: {
      verde: "Crear un perfil falso con datos reales de otra persona es un delito grave, sin importar la intención.",
      amarillo: "No existe zona gris. La suplantación de identidad digital es un delito tipificado en el COIP.",
      rojo: "¡Correcto! El Art. 212 del COIP lo sanciona. Es un delito aunque sea 'de broma'."
    }
  },
  {
    text: "Reenvío mensajes virales o cadenas sin verificar si son verdaderos.",
    correct: 'amarillo',
    article: "LOPDP, Art. 10 – Principio de consentimiento: difundir información sin verificar puede dañar la reputación de personas reales y contribuir a la desinformación.",
    explanations: {
      verde: "Reenviar sin verificar puede causar daño real: desinformación, pánico o difamación de personas inocentes.",
      amarillo: "¡Correcto! Es un riesgo ético. Antes de reenviar, pregúntate: ¿es verdad? ¿puede dañar a alguien?",
      rojo: "No es un delito automático, pero sí una conducta irresponsable. El amarillo es lo más preciso."
    }
  },
  {
    text: "Comento en redes sin pensar cómo mis palabras pueden afectar a otra persona.",
    correct: 'amarillo',
    article: "La difamación e injuria ya no son delitos penales en Ecuador desde 2014. Pero comentarios que dañen la reputación de alguien pueden derivar en una contravención por descrédito o deshonra (Art. 396 núm. 1 COIP) o en una demanda civil por daño moral.",
    explanations: {
      verde: "Las palabras en internet tienen peso real. Comentar sin pensar puede causar daño emocional serio.",
      amarillo: "¡Correcto! Riesgo ético. Antes de publicar un comentario, pregúntate: ¿aporta o daña? ¿lo diría en persona?",
      rojo: "No todo comentario irreflexivo es delito, pero sí puede escalar a una situación legal. El amarillo es lo más preciso."
    }
  },
  {
    text: "Amenazo o extorsiono a alguien usando información o imágenes digitales.",
    correct: 'rojo',
    article: "COIP, Art. 185 – Extorsión: usar información o imágenes para amenazar o chantajear a alguien, incluso por medios digitales, es uno de los delitos más graves en Ecuador (3 a 5 años de prisión, más si hay agravantes).",
    explanations: {
      verde: "Amenazar o chantajear con información digital es un delito grave con penas de varios años de prisión.",
      amarillo: "Esto no tiene zona gris. La extorsión digital es ilegal y tiene consecuencias penales severas.",
      rojo: "¡Correcto! Es uno de los delitos digitales más graves. Si lo vives o lo conoces, denuncia de inmediato en la Fiscalía."
    }
  },
  {
    text: "Comparto la contraseña de mis redes sociales con mi pareja para 'demostrar confianza'.",
    correct: 'amarillo',
    article: "LOPDP, Art. 10 – Principio de seguridad: tu contraseña es un dato de seguridad personal. Compartirla expone tu cuenta a un uso que no controlas, aunque no sea delito.",
    explanations: {
      verde: "Compartir tu contraseña, aunque sea con alguien de confianza, no está libre de riesgo: cualquier persona puede usarla sin tu control.",
      amarillo: "¡Correcto! No es un delito, pero es un riesgo serio para tu seguridad digital. Tu contraseña debe ser solo tuya.",
      rojo: "No es ilegal compartir tu propia contraseña, aunque no es recomendable. El amarillo es la clasificación correcta."
    }
  },
  {
    text: "Instalo una app pirateada que promete funciones premium gratis.",
    correct: 'amarillo',
    article: "Art. 232 COIP – Ataque a la integridad de sistemas informáticos: estas apps suelen contener programas maliciosos que dañan o comprometen tus datos.",
    explanations: {
      verde: "Estas apps suelen contener malware oculto que puede robar tus datos o dañar tu dispositivo.",
      amarillo: "¡Correcto! No siempre es delito instalarla, pero el riesgo de virus y robo de datos es alto.",
      rojo: "El riesgo principal aquí es de seguridad informática, no necesariamente penal para quien la instala. El amarillo es más preciso."
    }
  },
  {
    text: "Publico el número de teléfono de un compañero en un grupo sin pedirle permiso, 'para ayudarlo a conseguir trabajo'.",
    correct: 'rojo',
    article: "LOPDP, Art. 7 y 9: divulgar datos personales de terceros sin su consentimiento, incluso con buena intención, vulnera la ley.",
    explanations: {
      verde: "Aunque la intención sea buena, compartir el número de otra persona sin su consentimiento vulnera la LOPDP.",
      amarillo: "Esto va más allá de un riesgo ético: divulgar datos personales de alguien sin permiso está regulado por la ley.",
      rojo: "¡Correcto! La LOPDP exige consentimiento para compartir datos personales de terceros, incluso con buenas intenciones."
    }
  },
  {
    text: "Verifico la fuente de una noticia antes de compartirla en mis redes.",
    correct: 'verde',
    article: "UNESCO – Alfabetización mediática: verificar fuentes antes de compartir previene la desinformación y protege a terceros de daños reputacionales.",
    explanations: {
      verde: "¡Correcto! Verificar antes de compartir es una práctica responsable que frena la desinformación.",
      amarillo: "No hay riesgo en verificar información: es la conducta más recomendable antes de compartir cualquier noticia.",
      rojo: "Verificar fuentes no tiene ninguna consecuencia legal negativa. Es lo contrario: previene problemas."
    }
  },
  {
    text: "Configuro mi perfil de redes sociales como privado y reviso quién puede ver mi contenido.",
    correct: 'verde',
    article: "LOPDP, Art. 7 – Autodeterminación informativa: decidir quién accede a tu información es un derecho que la ley protege.",
    explanations: {
      verde: "¡Correcto! Controlar la privacidad de tu perfil es ejercer tu derecho a decidir quién ve tu información.",
      amarillo: "No existe riesgo en proteger tu privacidad; es una práctica recomendada por la propia ley.",
      rojo: "Configurar tu privacidad no tiene ninguna consecuencia negativa. Es una conducta protegida por la ley."
    }
  },
];

let semIdx = 0;
let semScenarios = [];

function startSemaforo() {
  semIdx = 0;
  semScenarios = pickRandom(SEMAFORO_SCENARIOS_POOL, 10);
  renderSemaforo();
}

function renderSemaforo() {
  if (semIdx >= semScenarios.length) {
    completeZone(semScenarios.length * 10);
    return;
  }
  const s = semScenarios[semIdx];
  const body = document.getElementById('game-body');

  // imagenb.png tiene 3 paneles lado a lado: verde (izq), amarillo (centro), rojo (der)
  // Usamos object-position para mostrar solo el panel correspondiente en cada tarjeta
  const cards = [
    {
      color: 'verde',
      bg: '#2ecc71',
      border: '#27ae60',
      lightBg: '#d4edda',
      dot: '#27ae60',
      label: 'LEGAL',
      sub: 'Seguro ✓',
      imgPos: '0% center',
    },
    {
      color: 'amarillo',
      bg: '#f0b429',
      border: '#d4a017',
      lightBg: '#fef6dc',
      dot: '#f0b429',
      label: 'RIESGO ÉTICO',
      sub: 'Con cuidado ⚠️',
      imgPos: '50% center',
    },
    {
      color: 'rojo',
      bg: '#e74c3c',
      border: '#c0392b',
      lightBg: '#fde8e6',
      dot: '#e74c3c',
      label: 'ILEGAL',
      sub: 'Peligroso ✗',
      imgPos: '100% center',
    },
  ];

  body.innerHTML = `
    <style>
      .sem2-wrap { font-family: 'Nunito', sans-serif; }
      .sem2-header {
        background: linear-gradient(135deg, #1a2e4a, #0d3d6e);
        border-radius: 14px 14px 0 0;
        padding: 12px 16px 10px;
        text-align: center;
        margin-bottom: 0;
      }
      .sem2-header h2 {
        font-family: 'Fredoka One', cursive;
        color: #fff;
        font-size: 1.4rem;
        margin: 0 0 2px;
        letter-spacing: 0.5px;
      }
      .sem2-header h2 span { color: #f0b429; }
      .sem2-header p { color: rgba(255,255,255,0.7); font-size: 0.78rem; margin: 0; }
      .sem2-cards {
        display: flex;
        gap: 8px;
        background: linear-gradient(135deg, #1a2e4a, #0d3d6e);
        padding: 10px 10px 14px;
        border-radius: 0 0 14px 14px;
        margin-bottom: 14px;
      }
      .sem2-card {
        flex: 1;
        border-radius: 14px;
        border: 3px solid #ccc;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s;
        position: relative;
        background: white;
      }
      .sem2-card:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
      .sem2-card:active { transform: translateY(0); }
      .sem2-dot {
        width: 28px; height: 28px;
        border-radius: 50%;
        margin: -14px auto 6px;
        position: relative;
        z-index: 2;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      .sem2-img-wrap {
        width: 100%;
        aspect-ratio: 512.667 / 1023;
        overflow: hidden;
        position: relative;
      }
      .sem2-img-wrap img {
        position: absolute;
        height: 100%;
        width: 300%;
        object-fit: cover;
        top: 0;
      }
      .sem2-img-wrap img.pos-verde  { left: 0; }
      .sem2-img-wrap img.pos-amarillo { left: -100%; }
      .sem2-img-wrap img.pos-rojo   { left: -200%; }
      .sem2-label {
        font-family: 'Fredoka One', cursive;
        font-size: 0.85rem;
        text-align: center;
        padding: 6px 4px 8px;
        line-height: 1.2;
      }
      .sem2-sublabel {
        font-size: 0.68rem;
        font-weight: 700;
        display: block;
        opacity: 0.75;
      }
      .sem2-situation {
        background: white;
        border-radius: 14px;
        padding: 16px 18px;
        box-shadow: 0 4px 18px rgba(0,0,0,0.10);
        margin-bottom: 10px;
      }
      .sem2-situation-label {
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #888;
        margin-bottom: 6px;
      }
      .sem2-situation-text {
        font-size: 1rem;
        font-weight: 700;
        color: #1a2e4a;
        line-height: 1.5;
      }
      .sem2-counter {
        text-align: center;
        font-size: 0.78rem;
        color: #fff;
        margin-bottom: 4px;
      }
    </style>

    <div class="sem2-wrap">
      <div class="sem2-header">
        <h2>🚦 Semáforo <span>Digital</span></h2>
        <p>Lee la situación y elige el color que corresponde</p>
      </div>

      <div class="sem2-cards">
        ${cards.map(c => `
          <div class="sem2-card" style="border-color:${c.border}" onclick="answerSemaforo('${c.color}')">
            <div class="sem2-img-wrap" style="background:${c.lightBg}">
              <img src="imagenb.png" class="pos-${c.color}" alt="${c.label}"/>
            </div>
            <div class="sem2-dot" style="background:${c.dot}"></div>
            <div class="sem2-label" style="color:${c.border}">
              ${c.label}
              <span class="sem2-sublabel">${c.sub}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="sem2-counter">Situación ${semIdx + 1} de ${semScenarios.length}</div>

      <div class="sem2-situation">
        <div class="sem2-situation-label">🚦 ¿Cómo clasificas esta conducta?</div>
        <div class="sem2-situation-text">${s.text}</div>
      </div>
    </div>
  `;
}

function answerSemaforo(color) {
  const s = semScenarios[semIdx];
  const isCorrect = color === s.correct;
  if (isCorrect) addScore(10);
  semIdx++;
  showFeedback(isCorrect, s.article, s.explanations[color], renderSemaforo);
}

// =============================================
// ===== ZONA 3: VERDADERO / FALSO ============
// =============================================
const VF_QUESTIONS_POOL = [
  {
    image: "zona3_situacion1.png",
    claim: "Si algo está publicado en internet es información verdadera porque 'alguien la subió'.",
    answer: false,
    article: "UNESCO – Alfabetización Mediática e Informacional: la fuente importa. Cualquier persona puede publicar información falsa en internet. Es fundamental verificar la fuente y contrastar datos.",
    explanation: "FALSO. Cualquier persona puede publicar contenido en internet, incluyendo información falsa o engañosa. Siempre debes verificar la fuente y contrastar con medios o entidades confiables."
  },
  {
    image: "zona3_situacion2.png",
    claim: "Tus datos personales en internet (nombre, foto, ubicación) son un tipo de propiedad que te pertenece.",
    answer: true,
    article: "Art. 66, num. 19 Constitución del Ecuador y LOPDP: tus datos personales son tu propiedad y tienes derecho a controlar quién los usa, cómo y para qué.",
    explanation: "VERDADERO. La Constitución del Ecuador y la Ley de Protección de Datos reconocen tus datos personales como un activo que te pertenece. Puedes solicitar que sean eliminados o corregidos."
  },
  {
    image: "zona3_situacion3.png",
    claim: "Un meme con información falsa sobre una persona famosa es inofensivo porque es 'solo humor'.",
    answer: false,
    article: "La difamación e injuria no son delitos penales en Ecuador desde 2014, pero un meme con información falsa que daña la reputación de alguien puede derivar en una contravención por descrédito o deshonra (Art. 396 núm. 1 COIP) o en una demanda civil por daño moral. Si además le atribuye falsamente un delito, puede ser Calumnia (Art. 182 COIP).",
    explanation: "FALSO. Un meme con información falsa puede dañar la reputación de una persona y tener consecuencias legales. El humor no justifica difundir mentiras sobre otras personas."
  },
  {
    image: "zona3_situacion4.png",
    claim: "En Ecuador, hacer clic en 'aceptar' en los términos y condiciones de una app significa que leíste y aprobaste cómo usarán tus datos.",
    answer: false,
    article: "LOPDP, Art. 20 – Consentimiento informado: para que el consentimiento sea válido, debes haber recibido información clara y comprensible sobre el tratamiento de tus datos.",
    explanation: "FALSO. En la práctica, casi nadie lee los términos y condiciones. La ley exige que el consentimiento sea informado, pero muchas apps no cumplen con esto. Siempre intenta revisar qué permisos concedes."
  },
  {
    image: "zona3_situacion5.png",
    claim: "Si recibes un mensaje que dice 'Comparte esto o le pasará algo malo a tu familia', puedes ignorarlo sin problema.",
    answer: true,
    article: "Desinformación y cadenas: los mensajes de cadena son una forma común de desinformación y manipulación emocional en redes sociales. No tienen efecto real al ignorarlos.",
    explanation: "VERDADERO. Los mensajes de cadena son una táctica de desinformación y manipulación. No tienen ningún efecto si los ignoras. Lo correcto es no reenviarlos y reportarlos como spam."
  },
  {
    image: "zona3_situacion6.png",
    claim: "Una imagen puede ser editada para cambiar su contexto y crear desinformación, incluso con fotos reales.",
    answer: true,
    article: "Fact-checking y alfabetización mediática: la manipulación de imágenes reales fuera de su contexto original es una técnica muy usada para crear noticias falsas (fake news).",
    explanation: "VERDADERO. Una foto real puede ser usada fuera de contexto para crear una noticia falsa. Siempre verifica la fuente original de las imágenes antes de compartirlas."
  },
  {
    image: "zona3_situacion7.png",
    claim: "Borrar una publicación significa que esa información desaparece de internet por completo.",
    answer: false,
    article: "Principio de permanencia digital: una vez publicado, el contenido puede haber sido guardado o capturado por otras personas antes de borrarlo. El borrado no garantiza su eliminación total.",
    explanation: "FALSO. Aunque borres una publicación, otras personas pudieron haberla guardado, compartido o capturado antes. Piensa bien antes de publicar."
  },
  {
    image: "zona3_situacion8.png",
    claim: "En Ecuador, puedes pedirle a una empresa que elimine tus datos personales de su sistema.",
    answer: true,
    article: "LOPDP, Art. 9 – Derecho de supresión: toda persona puede solicitar la eliminación de sus datos personales cuando ya no sean necesarios o se haya retirado el consentimiento.",
    explanation: "VERDADERO. La LOPDP te da el derecho de solicitar que tus datos sean eliminados de las bases de datos de empresas o plataformas."
  },
  {
    image: "zona3_situacion9.png",
    claim: "Un 'me gusta' o comentario en redes sociales nunca puede usarse como evidencia legal.",
    answer: false,
    article: "Pruebas digitales: capturas de pantalla, comentarios y mensajes pueden usarse como evidencia en una denuncia ante la Fiscalía si están relacionados con un delito.",
    explanation: "FALSO. Comentarios, mensajes y capturas de pantalla sí pueden usarse como evidencia digital en procesos legales. Por eso es importante guardarlos."
  },
  {
    image: "zona3_situacion10.png",
    claim: "Si una persona menor de edad comete un delito digital (como crear un perfil falso de otra persona), no tiene ninguna responsabilidad porque es menor de edad.",
    answer: false,
    article: "Código de la Niñez y Adolescencia y COIP: los y las adolescentes pueden tener responsabilidad penal juvenil según su edad, aplicada de forma diferenciada a la de los adultos, pero no quedan exentos.",
    explanation: "FALSO. Los y las adolescentes también pueden enfrentar consecuencias legales (responsabilidad penal juvenil) por delitos digitales, aunque el proceso es diferente al de un adulto."
  },
  {
    image: "zona3_situacion11.png",
    claim: "Las cuentas verificadas (con la insignia azul) siempre publican información 100% verdadera.",
    answer: false,
    article: "Alfabetización mediática: la verificación de cuenta certifica identidad, no la veracidad de cada contenido publicado. Cualquier cuenta puede compartir información incorrecta.",
    explanation: "FALSO. Estar verificada solo confirma quién es el dueño de la cuenta, no garantiza que todo lo que publique sea cierto. Siempre debes contrastar la información."
  }
];

let vfIdx = 0;
let vfQuestions = [];

function startVF() {
  vfIdx = 0;
  vfQuestions = pickRandom(VF_QUESTIONS_POOL, 6);
  renderVF();
}

function renderVF() {
  if (vfIdx >= vfQuestions.length) {
    completeZone(vfQuestions.length * 10);
    return;
  }
  const q = vfQuestions[vfIdx];
  const body = document.getElementById('game-body');
  body.innerHTML = `
    <div style="font-size:0.82rem;color:#fff;margin-bottom:6px;text-align:center">Pregunta ${vfIdx+1} de ${vfQuestions.length}</div>
    <div class="tf-card">
      <img src="${q.image || 'imagenc.png'}" alt="Verdadero o Falso" style="width:100%;max-width:420px;display:block;margin:0 auto 16px;border-radius:10px" onerror="this.onerror=null;this.src='imagenc.png';"/>
      <div class="tf-claim">${q.claim}</div>
      <div class="tf-btns">
        <button class="tf-btn tf-true" onclick="answerVF(true)">✅ Verdadero</button>
        <button class="tf-btn tf-false" onclick="answerVF(false)">❌ Falso</button>
      </div>
    </div>
    <div style="font-size:0.82rem;color:#fff;text-align:center">Analiza bien la afirmación antes de responder.</div>
  `;
}

function answerVF(answer) {
  const q = vfQuestions[vfIdx];
  const isCorrect = answer === q.answer;
  if (isCorrect) addScore(10);
  vfIdx++;
  showFeedback(isCorrect, q.article, q.explanation, renderVF);
}

// =============================================
// ===== ZONA 4: DRAG AND DROP ================
// =============================================
const DND_ITEMS_POOL = [
  { id: 'i1', text: 'Acceder a mis datos que tienen las empresas', category: 'derecho' },
  { id: 'i2', text: 'Publicar fotos mías sin mi permiso', category: 'vulneracion' },
  { id: 'i3', text: 'Denunciar ante la Fiscalía', category: 'proteccion' },
  { id: 'i4', text: 'Usar mis datos para publicidad sin avisar', category: 'vulneracion' },
  { id: 'i5', text: 'Pedir que eliminen mis datos de un sitio', category: 'derecho' },
  { id: 'i6', text: 'Guardar evidencia (capturas de pantalla)', category: 'proteccion' },
  { id: 'i7', text: 'Hackear mi cuenta de redes sociales', category: 'vulneracion' },
  { id: 'i8', text: 'Bloquear y reportar al agresor', category: 'proteccion' },
  { id: 'i9', text: 'Saber cómo usan mis datos personales', category: 'derecho' },
  { id: 'i10', text: 'Acudir al DECE o a un adulto de confianza', category: 'proteccion' },
  { id: 'i11', text: 'Activar la verificación en dos pasos en mis cuentas', category: 'proteccion' },
  { id: 'i12', text: 'Conocer qué empresas tienen acceso a mis datos personales', category: 'derecho' },
  { id: 'i13', text: 'Decidir si quiero o no que usen mis datos para publicidad', category: 'derecho' },
  { id: 'i14', text: 'Crear un perfil falso usando el nombre y fotos de otra persona', category: 'vulneracion' },
  { id: 'i15', text: 'Espiar los mensajes privados de otra persona sin su consentimiento', category: 'vulneracion' },
];

const DND_CATEGORIES = [
  { id: 'derecho', label: '🛡️ Mis derechos digitales', css: 'cat-derecho', image: 'zona4_derecho.png' },
  { id: 'vulneracion', label: '⚠️ Vulneraciones (delitos)', css: 'cat-vulneracion', image: 'zona4_vulneracion.png' },
  { id: 'proteccion', label: '✅ Acciones de protección', css: 'cat-proteccion', image: 'zona4_proteccion.png' },
];

const DND_ARTICLES = {
  derecho: "LOPDP, Art. 7 y 9: tienes derecho a acceder, rectificar, suprimir y conocer el uso de tus datos personales.",
  vulneracion: "Arts. 178, 229, 230 COIP: acceso no autorizado, violación de privacidad y uso indebido de datos son delitos en Ecuador.",
  proteccion: "Art. 195 Código de la Niñez y Adolescencia: los NNA tienen derecho a protección contra toda forma de abuso, incluyendo el digital."
};

let dndPlaced = {};
let dragId = null;
let dndItems = [];

// Elige al azar del banco manteniendo la misma proporción por categoría (3 derecho, 3 vulneración, 4 protección)
function buildDndSelection() {
  const counts = { derecho: 3, vulneracion: 3, proteccion: 4 };
  let chosen = [];
  Object.keys(counts).forEach(cat => {
    const ofCategory = DND_ITEMS_POOL.filter(i => i.category === cat);
    chosen = chosen.concat(pickRandom(ofCategory, counts[cat]));
  });
  return shuffleArray(chosen);
}

function startDnD() {
  dndPlaced = {};
  dndItems = buildDndSelection();
  dndItems.forEach(i => dndPlaced[i.id] = 'pool');
  renderDnD();
}

function renderDnD() {
  const body = document.getElementById('game-body');
  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:10px;background:#cce7f9;border-radius:10px;padding:10px 12px">
        <img src="zona4_derecho.png" alt="Derecho digital" style="width:48px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0" onerror="this.style.display='none'"/>
        <div>
          <strong style="font-size:0.82rem;color:#0d4d7a;display:block">🛡️ Derecho digital</strong>
          <span style="font-size:0.78rem;color:#1a5080;line-height:1.4">Lo que la ley te garantiza en internet: acceder a tus datos, proteger tu privacidad, decidir qué compartes.</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;background:#fde8e6;border-radius:10px;padding:10px 12px">
        <img src="zona4_vulneracion.png" alt="Vulneración" style="width:48px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0" onerror="this.style.display='none'"/>
        <div>
          <strong style="font-size:0.82rem;color:#c0392b;display:block">⚠️ Vulneración</strong>
          <span style="font-size:0.78rem;color:#922b21;line-height:1.4">Una acción que viola tus derechos o los de otra persona. Puede ser un delito.</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;background:#d4edda;border-radius:10px;padding:10px 12px">
        <img src="zona4_proteccion.png" alt="Acción de protección" style="width:48px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0" onerror="this.style.display='none'"/>
        <div>
          <strong style="font-size:0.82rem;color:#1a5c2e;display:block">✅ Acción de protección</strong>
          <span style="font-size:0.78rem;color:#1a5c2e;line-height:1.4">Lo que puedes hacer para defender tus derechos o los de alguien más cuando están en riesgo.</span>
        </div>
      </div>
    </div>
    <div class="dnd-container">
      <div class="dnd-items-pool">
        <h3>Tarjetas para clasificar</h3>
        <div class="dnd-items" id="pool-items" ondragover="allowDrop(event)" ondrop="dropTo('pool',event)">
          ${dndItems.filter(i => dndPlaced[i.id]==='pool').map(i => `
            <div class="dnd-item" id="dnd-${i.id}" draggable="true"
              ondragstart="startDrag('${i.id}')" ontouchstart="touchStart(event,'${i.id}')">${i.text}</div>`).join('')}
        </div>
      </div>
      <div class="dnd-categories">
        ${DND_CATEGORIES.map(cat => `
          <div class="dnd-category" id="cat-${cat.id}" ondragover="allowDrop(event)" ondrop="dropTo('${cat.id}',event)">
            <span class="dnd-category-label ${cat.css}">${cat.label}</span>
            <div class="dnd-items">
              ${dndItems.filter(i => dndPlaced[i.id]===cat.id).map(i => `
                <div class="dnd-item" id="dnd-${i.id}" draggable="true"
                  ondragstart="startDrag('${i.id}')" ontouchstart="touchStart(event,'${i.id}')">${i.text}</div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <button class="dnd-check-btn" onclick="checkDnD()">Verificar clasificación ✓</button>
    </div>
  `;
}

function startDrag(id) { dragId = id; }
function allowDrop(e) { e.preventDefault(); e.currentTarget.closest('.dnd-category,.dnd-items-pool')?.classList.add('drag-over'); }
function dropTo(catId, e) {
  e.preventDefault();
  document.querySelectorAll('.dnd-category,.dnd-items-pool').forEach(el => el.classList.remove('drag-over'));
  if (dragId) { dndPlaced[dragId] = catId; dragId = null; renderDnD(); }
}

// Touch support
let touchItem = null;
function touchStart(e, id) {
  touchItem = id;
  const el = document.getElementById('dnd-'+id);
  el.style.opacity = '0.5';
}
document.addEventListener('touchend', function(e) {
  if (!touchItem) return;
  const touch = e.changedTouches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  const catEl = target?.closest('[id^="cat-"]');
  const poolEl = target?.closest('#pool-items');
  if (catEl) {
    const catId = catEl.id.replace('cat-','');
    dndPlaced[touchItem] = catId;
    renderDnD();
  } else if (poolEl) {
    dndPlaced[touchItem] = 'pool';
    renderDnD();
  } else {
    const el = document.getElementById('dnd-'+touchItem);
    if (el) el.style.opacity = '1';
  }
  touchItem = null;
});

function checkDnD() {
  const inPool = dndItems.filter(i => dndPlaced[i.id]==='pool');
  if (inPool.length > 0) {
    alert('Aún hay tarjetas sin clasificar. ¡Arrástralas todas!');
    return;
  }
  let correct = 0;
  dndItems.forEach(i => { if (dndPlaced[i.id] === i.category) correct++; });
  const score = Math.round((correct / dndItems.length) * 40);
  state.gameScore = score;
  document.getElementById('live-score').textContent = score;

  const body = document.getElementById('game-body');
  const lines = dndItems.map(i => {
    const ok = dndPlaced[i.id] === i.category;
    const catLabel = DND_CATEGORIES.find(c=>c.id===i.category)?.label || '';
    return `<li style="margin-bottom:6px;font-size:0.88rem">${ok?'✅':'❌'} <strong>${i.text}</strong> → ${catLabel}</li>`;
  }).join('');

  body.innerHTML = `
    <div class="zone-complete-banner" style="background: linear-gradient(135deg, #1a6ea8, #0d4d7a)">
      <div style="font-size:2rem">⚖️</div>
      <h2>Resultado</h2>
      <div class="score-display">${correct} / ${dndItems.length} correctas</div>
      <p>Puntos: ${score} / 40</p>
    </div>
    <div style="background:white;border-radius:14px;padding:18px;box-shadow:var(--shadow);margin-bottom:16px">
      <h3 style="font-family:'Fredoka One',cursive;margin-bottom:12px">Revisión</h3>
      <ul style="list-style:none">${lines}</ul>
    </div>
    <div class="question-card">
      <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:#666;margin-bottom:6px">📋 Marco Legal</div>
      <p style="font-size:0.88rem;line-height:1.6;color:#555">${DND_ARTICLES.derecho}</p>
      <p style="font-size:0.88rem;line-height:1.6;color:#555;margin-top:6px">${DND_ARTICLES.vulneracion}</p>
    </div>
    <div style="text-align:center">
      <button class="btn-main" onclick="completeZone(40)">Ver protocolo →</button>
    </div>
  `;
}

// =============================================
// ===== ZONA 5: DESAFÍO FINAL ================
// =============================================
const DILEMMAS_POOL = [
  {
    icon: "😰",
    image: "zona5_situacion1.png",
    title: "El mensaje que no pediste",
    situation: "Valentina (15 años) recibe mensajes de un desconocido en Instagram que dice tener 16 años. Poco a poco los mensajes se vuelven más personales y le pide fotos. Valentina se siente incómoda pero no quiere ser 'grosera'.",
    question: "¿Qué debe hacer Valentina?",
    options: [
      { text: "Bloquear al desconocido, no responder más y contárselo a un adulto de confianza de inmediato.", type: 'best', score: 15 },
      { text: "Ignorar los mensajes pero no bloquear, esperando que el desconocido se aburra.", type: 'ok', score: 5 },
      { text: "Responder amablemente pero explicar que no se siente cómoda.", type: 'ok', score: 7 },
      { text: "Mandar las fotos para no parecer grosera con alguien que dice ser de su edad.", type: 'risky', score: 0 },
    ],
    article: "Art. 173 COIP – Contacto con finalidad sexual con menores de 18 años a través de medios digitales: es un delito que puede sancionarse con prisión de 1 a 3 años.",
    explanation: "La mejor opción es bloquear, no responder y contárselo a un adulto. Nunca se deben enviar fotos a desconocidos. La persona que pide esas fotos puede estar cometiendo un delito."
  },
  {
    icon: "🤳",
    image: "zona5_situacion2.png",
    title: "La foto del grupo",
    situation: "En un grupo de WhatsApp del colegio, alguien publica una foto de Marcos (14 años) en una situación vergonzosa tomada sin su conocimiento. Todos están comentando y riéndose.",
    question: "Tú eres parte de ese grupo. ¿Qué haces?",
    options: [
      { text: "Pedir al administrador que elimine la foto, avisar a Marcos y reportar el hecho al DECE.", type: 'best', score: 15 },
      { text: "Silenciar el grupo y no participar, pero tampoco hacer nada más.", type: 'ok', score: 5 },
      { text: "Reírte y comentar, total, todos lo están haciendo.", type: 'risky', score: 0 },
      { text: "Reenviar la foto a otro grupo porque es 'graciosa'.", type: 'risky', score: 0 },
    ],
    article: "Art. 178 COIP – Violación a la intimidad: quien difunda, venda o entregue imágenes de otra persona sin su consentimiento será sancionado con pena de 1 a 3 años.",
    explanation: "Silenciarte también es una forma de permitir el daño. Lo correcto es pedir que se elimine la foto y avisar a Marcos. El ciberbullying es un delito escolar y penal."
  },
  {
    icon: "🔗",
    image: "zona5_situacion3.png",
    title: "El link sospechoso",
    situation: "Sebastián (16 años) recibe un mensaje de un número desconocido que dice: 'Ganaste un iPhone 15 Pro. Haz clic aquí y llena el formulario con tus datos para reclamarlo.' El link parece oficial.",
    question: "¿Qué debería hacer Sebastián?",
    options: [
      { text: "No hacer clic, eliminar el mensaje y advertir a sus contactos para que no caigan en la trampa.", type: 'best', score: 15 },
      { text: "Hacer clic para ver de qué se trata, pero no llenar el formulario.", type: 'ok', score: 5 },
      { text: "Llenar solo su nombre, no sus datos bancarios.", type: 'risky', score: 2 },
      { text: "Llenar todos los datos porque parece oficial y quiere ganar el premio.", type: 'risky', score: 0 },
    ],
    article: "Art. 229 COIP – Revelación ilegal de base de datos. Art. 190 COIP – Apropiación fraudulenta por medios electrónicos (phishing): es un delito sancionado con hasta 5 años.",
    explanation: "Este es un caso clásico de phishing. Los premios falsos son una trampa para robar tus datos. Nunca se deben llenar formularios de mensajes no solicitados."
  },
  {
    icon: "😡",
    image: "zona5_situacion4.png",
    title: "El comentario que escuece",
    situation: "Camila (15 años) publica una foto y recibe comentarios hirientes de cuentas desconocidas que critican su apariencia física. Los comentarios son cada vez más agresivos y algunos amigos los respaldan con 'me gusta'.",
    question: "¿Cómo debe responder Camila?",
    options: [
      { text: "Bloquear y reportar las cuentas agresoras, guardar capturas como evidencia y contárselo a un adulto o al DECE.", type: 'best', score: 15 },
      { text: "Responder con los mismos insultos para defenderse.", type: 'risky', score: 0 },
      { text: "Eliminar la foto para que no sigan comentando y no decirle nada a nadie.", type: 'ok', score: 4 },
      { text: "Ignorarlo, porque si no reacciona, los comentarios pararán solos.", type: 'ok', score: 6 },
    ],
    article: "El ciberacoso escolar debe ser reportado al DECE de tu institución. Según la gravedad, comentarios hirientes reiterados pueden derivar en una contravención por descrédito o deshonra (Art. 396 núm. 1 COIP) y, en estos casos, también es clave la mediación educativa.",
    explanation: "El ciberacoso no desaparece ignorándolo. Lo correcto es reportar, guardar evidencia y buscar apoyo. Responder con insultos puede agravar la situación."
  },
  {
    icon: "📍",
    image: "zona5_situacion5.png",
    title: "La ubicación en tiempo real",
    situation: "Daniela (15 años) comparte su ubicación en tiempo real en una historia de Instagram mientras está sola en un centro comercial. Un seguidor que no conoce en persona le escribe diciendo exactamente dónde está parada.",
    question: "¿Qué debería hacer Daniela?",
    options: [
      { text: "Desactivar la ubicación de inmediato, ir hacia donde haya más gente conocida y contarle a un adulto de confianza.", type: 'best', score: 15 },
      { text: "Borrar la historia pero quedarse en el mismo lugar.", type: 'ok', score: 6 },
      { text: "Responder preguntando quién es antes de hacer algo más.", type: 'ok', score: 4 },
      { text: "No darle importancia porque 'seguro es casualidad'.", type: 'risky', score: 0 },
    ],
    article: "Art. 173 COIP y LOPDP Art. 10: compartir ubicación en tiempo real puede facilitar que un desconocido te localice físicamente; es uno de los riesgos más serios de los datos de geolocalización.",
    explanation: "Compartir tu ubicación exacta, incluso en una historia que 'se borra', puede exponerte a un peligro real. Lo correcto es desactivarla, alejarte y avisar a un adulto de confianza."
  },
  {
    icon: "🤖",
    image: "zona5_situacion6.png",
    title: "La imagen que no es real",
    situation: "Iván (16 años) descubre que alguien usó una app de inteligencia artificial para crear una imagen falsa (deepfake) de una compañera del curso en una situación comprometedora y la está compartiendo en un grupo de clase.",
    question: "¿Qué debe hacer Iván?",
    options: [
      { text: "No reenviar la imagen, reportarla a la plataforma y a las autoridades del colegio, y avisar a la compañera o a un adulto de confianza.", type: 'best', score: 15 },
      { text: "Eliminar el chat para no involucrarse.", type: 'ok', score: 5 },
      { text: "Avisar solo a la compañera, sin reportarlo al colegio.", type: 'ok', score: 8 },
      { text: "Guardar la imagen 'por si la piden de evidencia' y compartirla con más amigos.", type: 'risky', score: 0 },
    ],
    article: "COIP, Art. 178 – Violación a la intimidad: crear o difundir imágenes falsas (deepfakes) de otra persona en situaciones íntimas o comprometedoras, aunque sean generadas por IA, es un delito grave en Ecuador, sin importar que el contenido no sea 'real'.",
    explanation: "Una imagen falsa generada con IA sigue dañando la reputación y dignidad de la persona real. No reenviar, reportar y dar apoyo a la víctima es lo correcto; guardarla o compartirla agrava el daño."
  },
  {
    icon: "🎮",
    image: "zona5_situacion7.png",
    title: "El amigo del videojuego",
    situation: "Mateo (13 años) conoce a alguien en un videojuego en línea que dice tener 14 años, se hacen 'muy amigos' y esa persona le pide que mantengan en secreto su amistad porque 'sus papás no entenderían', y además le pide fotos suyas.",
    question: "¿Qué debe hacer Mateo?",
    options: [
      { text: "Contarle a sus padres o a un adulto de confianza sobre esta persona y no enviar ninguna foto.", type: 'best', score: 15 },
      { text: "Dejar de hablarle pero no contarle a nadie.", type: 'ok', score: 6 },
      { text: "Mantener el secreto porque 'no quiere meterse en problemas'.", type: 'risky', score: 0 },
      { text: "Enviar una foto para no perder esa amistad.", type: 'risky', score: 0 },
    ],
    article: "Art. 173 COIP – Contacto con finalidad sexual con menores de edad a través de medios digitales: pedir secretismo y fotos a un menor es una señal de alerta (grooming) sancionada por la ley.",
    explanation: "Pedir secreto frente a los padres y solicitar fotos son señales claras de grooming. Lo correcto es romper el secreto y contarle a un adulto de confianza de inmediato."
  },
  {
    icon: "💼",
    image: "zona5_situacion8.png",
    title: "La oferta de trabajo perfecta",
    situation: "Camila (17 años) recibe un mensaje en redes que le ofrece un trabajo de medio tiempo 'sin experiencia' y muy bien pagado, pero le piden que primero envíe una copia de su cédula y los datos de una cuenta bancaria 'para procesos de nómina'.",
    question: "¿Qué debería hacer Camila?",
    options: [
      { text: "No enviar ningún documento, investigar si la empresa es real y verificar la oferta por canales oficiales antes de responder.", type: 'best', score: 15 },
      { text: "Preguntar más detalles sobre la empresa antes de decidir.", type: 'ok', score: 7 },
      { text: "Enviar solo la cédula pero no los datos bancarios.", type: 'ok', score: 5 },
      { text: "Enviar todos los documentos porque 'la oferta es muy buena para dejarla pasar'.", type: 'risky', score: 0 },
    ],
    article: "COIP Art. 190 – Apropiación fraudulenta por medios electrónicos y Art. 229 – Revelación ilegal de bases de datos: pedir documentos de identidad y datos bancarios antes de una contratación real es un patrón típico de fraude (phishing laboral).",
    explanation: "Las ofertas de trabajo que piden datos personales o bancarios antes de cualquier proceso formal suelen ser fraudes. Siempre verifica la legitimidad de la empresa antes de compartir información sensible."
  },
  {
    icon: "📢",
    image: "zona5_situacion9.png",
    title: "El secreto que no era mío",
    situation: "Andrés (15 años) se entera de un problema personal y privado de un amigo (una situación familiar difícil) y, sin pensarlo, lo comenta en el grupo del curso 'porque le pareció interesante'.",
    question: "¿Qué debió hacer Andrés en cambio?",
    options: [
      { text: "No compartir información personal de su amigo sin su consentimiento, sin importar el contexto.", type: 'best', score: 15 },
      { text: "Compartirlo solo con su mejor amigo, en privado.", type: 'ok', score: 4 },
      { text: "Compartirlo en el grupo pero pedir que 'no se lo cuenten a nadie más'.", type: 'risky', score: 0 },
      { text: "Borrar el mensaje del grupo apenas se da cuenta del error.", type: 'ok', score: 7 },
    ],
    article: "LOPDP, Art. 7 y 9: la información personal y sensible de otra persona (incluida su vida familiar) no puede divulgarse sin su consentimiento, sin importar la intención o el medio.",
    explanation: "La información privada de otra persona —aunque parezca un simple comentario— no debe compartirse sin su permiso. El daño a la confianza y reputación puede ser real, incluso sin mala intención."
  },
  {
    icon: "🌎",
    image: "zona5_situacion10.png",
    title: "Los comentarios sobre su acento",
    situation: "Un compañero nuevo, de la costa ecuatoriana, se integra al curso después de que su familia se mudó a la sierra. En el chat del curso, algunos compañeros empiezan a burlarse de su acento y su forma de hablar, e incluso lo excluyen de planes diciendo 'es que no es de aquí'.",
    question: "Tú ves los comentarios en el chat. ¿Qué deberías hacer?",
    options: [
      { text: "Decir claramente que burlarse de su acento y excluirlo por su región de origen es discriminación, y avisar a un profesor o al DECE.", type: 'best', score: 15 },
      { text: "Escribirle en privado a tu compañero para decirle que no está solo, pero no decir nada en el grupo.", type: 'ok', score: 6 },
      { text: "Salir del chat para no ser parte de la conversación, sin decir nada más.", type: 'ok', score: 3 },
      { text: "Reírte del comentario 'porque el grupo lo está haciendo' aunque no estés de acuerdo.", type: 'risky', score: 0 },
    ],
    article: "Constitución del Ecuador, Art. 11 numeral 2 (igualdad y no discriminación): prohíbe la discriminación por lugar de nacimiento o identidad cultural.",
    explanation: "Burlarse del acento o excluir a alguien por su región de origen también es discriminación, aunque a veces se minimice como 'solo son bromas regionales'. Nombrar el problema y buscar apoyo de un adulto ayuda a frenarlo, en vez de normalizarlo con silencio o risa."
  },
];

let dilemmaIdx = 0;
let finalDilemmas = [];

function startFinalChallenge() {
  dilemmaIdx = 0;
  // Elige 4 dilemas al azar del banco y mezcla el orden de las opciones de cada uno
  finalDilemmas = pickRandom(DILEMMAS_POOL, 5).map(d => ({ ...d, options: shuffleArray(d.options) }));
  renderDilemma();
}

function renderDilemma() {
  if (dilemmaIdx >= finalDilemmas.length) {
    completeZone(finalDilemmas.length * 15);
    return;
  }
  const d = finalDilemmas[dilemmaIdx];
  const body = document.getElementById('game-body');
  body.innerHTML = `
    <div style="font-size:0.82rem;color:#666;margin-bottom:8px">Dilema ${dilemmaIdx+1} de ${finalDilemmas.length}</div>
    <div class="dilemma-card">
      <img src="${d.image}" alt="${d.title}" style="width:100%;max-width:420px;display:block;margin:0 auto 14px;border-radius:10px" onerror="this.style.display='none'"/>
      <div class="dilemma-situation">${d.situation}</div>
      <div class="dilemma-question">${d.question}</div>
      <div class="dilemma-options">
        ${d.options.map((opt, idx) => `
          <button class="dilemma-opt" onclick="answerDilemma(${idx})">${opt.text}</button>
        `).join('')}
      </div>
    </div>
  `;
}

function answerDilemma(idx) {
  const d = finalDilemmas[dilemmaIdx];
  const opt = d.options[idx];
  addScore(opt.score);
  const isCorrect = opt.type === 'best';
  const typeLabels = { best: '¡Es la mejor decisión!', ok: 'Bien, pero existe una mejor opción.', risky: 'Esto puede empeorar la situación.' };
  dilemmaIdx++;
  showFeedback(isCorrect, d.article, typeLabels[opt.type] + ' ' + d.explanation, renderDilemma);
}

// =================== RESPONSIVE VIEWPORT FIX ===================
// Corrige el problema del 100vh en navegadores móviles (la barra de
// direcciones aparece/desaparece y "salta" el contenido). Guardamos la
// altura real de la ventana en una variable CSS y la usamos como respaldo
// de 100dvh en styles.css.
function setRealViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setRealViewportHeight();
window.addEventListener('resize', setRealViewportHeight);
window.addEventListener('orientationchange', setRealViewportHeight);

// =================== INIT ===================
document.addEventListener('DOMContentLoaded', () => {
  setRealViewportHeight();
  loadState();
  showScreen('screen-intro');
});
