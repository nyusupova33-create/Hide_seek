// Lobby and profile elements
const playButton = document.getElementById('playButton');
const matchmaking = document.getElementById('matchmaking');
const matchTimer = document.getElementById('matchTimer');
const playersFound = document.getElementById('playersFound');
const playerSlots = [...document.querySelectorAll('#playerSlots i')];
const matchTitle = document.getElementById('matchTitle');
const matchStatus = document.getElementById('matchStatus');
const countdownLabel = document.getElementById('countdownLabel');
const mapCards = [...document.querySelectorAll('.map-card')];
const previewMapName = document.getElementById('previewMapName');
const previewScene = document.getElementById('previewScene');
const coinCount = document.getElementById('coinCount');
const toast = document.getElementById('toast');
const soundToggle = document.getElementById('soundToggle');

let coins = 2480;
try { const storedCoins=localStorage.getItem('hideSeekCoins');if(storedCoins!==null&&Number.isFinite(Number(storedCoins)))coins=Math.max(0,Number(storedCoins)); } catch (_) { /* Storage may be unavailable. */ }
let xp = 7250;
let matchmakingInterval = null;
let gameLaunchTimeout = null;
let players = 1;
let elapsed = 0;
let soundOn = true;
let audioContext = null;
let toastTimer = null;
coinCount.textContent = coins.toLocaleString();

function playTone(frequency = 440, duration = 0.08) {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (_) { /* Audio is optional. */ }
}

function showToast(message, icon = '✓') {
  clearTimeout(toastTimer);
  toast.querySelector('span').textContent = icon;
  toast.querySelector('p').textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function updateCoins(amount) {
  coins += amount;
  coinCount.textContent = coins.toLocaleString();
  const shopBalance = document.getElementById('shopCoinCount');
  if (shopBalance) shopBalance.textContent = coins.toLocaleString();
  try { localStorage.setItem('hideSeekCoins', String(coins)); } catch (_) { /* Storage may be unavailable. */ }
  coinCount.animate([
    { transform: 'scale(1)', color: '#fff' },
    { transform: 'scale(1.25)', color: '#2ee6c5' },
    { transform: 'scale(1)', color: '#fff' }
  ], { duration: 500, easing: 'ease-out' });
}

function updateXp(amount) {
  xp = Math.min(10000, xp + amount);
  document.getElementById('xpLabel').textContent = `${xp.toLocaleString()} / 10,000`;
  document.getElementById('xpProgress').style.width = `${xp / 100}%`;
  document.querySelector('.xp-note').innerHTML = `<span>⚡</span> ${(10000 - xp).toLocaleString()} XP until level 25`;
}

function fillNextPlayer() {
  if (players >= 6) return;
  players += 1;
  const initials = ['NP', 'PM', 'EF', 'MV', 'AB', 'KJ'];
  playerSlots[players - 1].textContent = initials[players - 1];
  playerSlots[players - 1].classList.add('filled');
  playersFound.textContent = `${players} / 6 players`;
  playTone(390 + players * 55);
  if (players === 6) startGameCountdown();
}

function startGameCountdown() {
  clearInterval(matchmakingInterval);
  let countdown = 3;
  matchTitle.textContent = 'Match found!';
  matchStatus.textContent = 'You are the seeker';
  countdownLabel.textContent = 'Starting in';
  matchTimer.textContent = '00:03';
  playTone(740, .12);
  matchmakingInterval = setInterval(() => {
    countdown -= 1;
    matchTimer.textContent = `00:0${Math.max(0, countdown)}`;
    playTone(countdown ? 620 : 900, .11);
    if (countdown <= 0) {
      clearInterval(matchmakingInterval);
      matchTitle.textContent = 'Loading world…';
      matchStatus.textContent = previewMapName.textContent;
      clearTimeout(gameLaunchTimeout);
      gameLaunchTimeout = setTimeout(launchGame, 800);
    }
  }, 1000);
}

function openMatchmaking() {
  clearInterval(matchmakingInterval);
  clearTimeout(gameLaunchTimeout);
  players = 1;
  elapsed = 0;
  matchTitle.innerHTML = 'Finding players<span class="loading-dots">...</span>';
  matchStatus.textContent = 'Searching the nearest servers';
  countdownLabel.textContent = 'Estimated wait';
  matchTimer.textContent = '00:12';
  playersFound.textContent = '1 / 6 players';
  playerSlots.forEach((slot, index) => {
    slot.classList.toggle('filled', index === 0);
    slot.textContent = index === 0 ? 'NP' : '';
  });
  matchmaking.classList.add('open');
  matchmaking.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  playTone(520, .1);
  matchmakingInterval = setInterval(() => {
    elapsed += 1;
    matchTimer.textContent = `00:${String(Math.max(0, 12 - elapsed)).padStart(2, '0')}`;
    if ([1, 3, 5, 7, 9].includes(elapsed)) fillNextPlayer();
  }, 1000);
}

function closeMatchmaking() {
  clearInterval(matchmakingInterval);
  clearTimeout(gameLaunchTimeout);
  matchmaking.classList.remove('open');
  matchmaking.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  playButton.focus();
}

function chooseMap(card) {
  mapCards.forEach(item => {
    const selected = item === card;
    item.classList.toggle('selected', selected);
    item.querySelector('.map-info > i').textContent = selected ? '✓' : '→';
    const oldTag = item.querySelector('.selected-tag');
    if (oldTag && !selected) oldTag.remove();
    if (selected && !oldTag) {
      const tag = document.createElement('span');
      tag.className = 'selected-tag';
      tag.textContent = 'SELECTED';
      item.prepend(tag);
    }
  });
  previewMapName.textContent = card.dataset.map;
  previewScene.classList.remove('school-scene', 'forest-scene', 'mall-scene', 'tropical-scene', 'themepark-scene', 'space-scene', 'volcano-scene');
  previewScene.classList.add(card.dataset.scene);
  previewScene.animate([{ opacity: .45 }, { opacity: 1 }], { duration: 500 });
  playTone(470, .08);
  showToast(`${card.dataset.map} selected`, '◇');
}

// Playable 2.5D world
const gameScreen = document.getElementById('gameScreen');
const playArena = document.getElementById('playArena');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const miniMap = document.getElementById('miniMap');
const miniCtx = miniMap.getContext('2d');
const hideOverlay = document.getElementById('hideOverlay');
const gameResult = document.getElementById('gameResult');
const gameClock = document.getElementById('gameClock');
const hideCountdown = document.getElementById('hideCountdown');
const foundTracker = [...document.querySelectorAll('#foundTracker i')];
const gameEvent = document.getElementById('gameEvent');
const pulseButton = document.getElementById('pulseButton');
const sprintButton = document.getElementById('sprintButton');
const staminaFill = document.getElementById('staminaFill');
const interactionPrompt = document.getElementById('interactionPrompt');
const objectiveText = document.getElementById('objectiveText');
const areaName = document.getElementById('areaName');
const matchCoinCount = document.getElementById('matchCoinCount');

const WORLD = { width: 2500, height: 1700 };
const player = { x: 1250, y: 850, radius: 19, speed: 255, direction: 1, moving: false, walk: 0,
  stamina: 100, sprinting: false, design: { species:'human', skin:'#9d6246', hair:'#162b3b', outfit:'#2ee6c5', accent:'#087b91', pattern:'bolt', accessory:'cap' } };
const camera = { x: 0, y: 0, width: 0, height: 0 };
const keys = Object.create(null);
let worldProps = [];
let worldDetails = [];
let worldCoins = [];
let hiders = [];
let gameInterval = null;
let animationFrame = null;
let gamePhase = 'idle';
let gameSeconds = 300;
let hidingSeconds = 30;
let captures = 0;
let matchCoins = 0;
let matchXp = 0;
let pulseCooldown = 0;
let eventTimer = null;
let lastFrame = 0;
let nearbyProp = null;
let currentMap = 'forest';

const mapThemes = {
  forest: { ground: '#0b2730', grid: '#17444d', path: '#245565', accent: '#2ee6c5', water: '#0a5d78', mini: '#16434c' },
  school: { ground: '#102635', grid: '#1d3c4b', path: '#2b5363', accent: '#54bff4', water: '#17627c', mini: '#173846' },
  mall: { ground: '#101c32', grid: '#193a50', path: '#15566b', accent: '#36d8d1', water: '#087b91', mini: '#18374b' },
  tropical: { ground: '#d9bd70', grid: '#e5ca7d', path: '#9d7048', accent: '#ffcc4d', water: '#138ca8', mini: '#3b9a9a' },
  themepark: { ground: '#29385d', grid: '#354b72', path: '#5a4a78', accent: '#ff73b8', water: '#287faf', mini: '#374f79' },
  space: { ground: '#050b2b', grid: '#113c65', path: '#3d6a9b', accent: '#7de7ff', water: '#0d6f9c', mini: '#17354f' },
  volcano: { ground: '#23110c', grid: '#5d2418', path: '#86402e', accent: '#ffb04d', water: '#9b1522', mini: '#3d1715' }
};

const propLayouts = [
  [170,180],[430,170],[735,215],[1040,160],[1410,190],[1740,170],[2080,210],[2330,340],
  [250,480],[570,445],[910,510],[1260,420],[1580,500],[1910,460],[2220,570],
  [120,820],[390,770],[720,860],[1040,735],[1450,790],[1780,850],[2140,810],[2380,920],
  [230,1160],[540,1080],[870,1220],[1200,1080],[1540,1200],[1880,1100],[2220,1240],
  [390,1470],[780,1450],[1140,1510],[1510,1440],[1930,1490],[2300,1450]
];

const mapPropTypes = {
  forest: ['tree','bush','rock','tree','tent','log','tree','bush','crate','barrel','rock','bench'],
  school: ['tree','locker','bench','dumpster','crate','vending','locker','bush','sign','barrel','bench','rock'],
  mall: ['vending','bench','sign','bush','crate','dumpster','vending','bench','barrel','rock','sign','locker'],
  tropical: ['palm','umbrella','rock','palm','kiosk','log','palm','bush','crate','barrel','umbrella','bench'],
  themepark: ['kiosk','bench','sign','ride','crate','vending','kiosk','bush','umbrella','barrel','bench','ride'],
  space: ['locker','crate','bench','vending','sign','barrel','bush','rock','locker','crate','bench','sign'],
  volcano: ['rock','barrel','crate','bench','bush','tree','log','tent','rock','barrel','crate','bench']
};

const propNames = {
  tree: 'tall tree', bush: 'thick bush', rock: 'rock pile', tent: 'camping tent', log: 'fallen log',
  crate: 'wooden crates', barrel: 'old barrel', bench: 'bench', locker: 'lockers', dumpster: 'dumpster',
  vending: 'vending machine', sign: 'large sign', palm: 'palm tree', umbrella: 'beach umbrella',
  kiosk: 'ticket kiosk', ride: 'park ride car'
};

const characterDesigns = [
  { species:'monster', skin:'#55cfba', hair:'#173c4b', outfit:'#287fd6', accent:'#81d8ff', pattern:'stars', accessory:'headphones' },
  { species:'robot', skin:'#83aeba', hair:'#263a48', outfit:'#20a8c8', accent:'#9af4f2', pattern:'stripes', accessory:'none' },
  { species:'alien', skin:'#75d69f', hair:'#214356', outfit:'#53c8e8', accent:'#d2fbff', pattern:'waves', accessory:'bow' },
  { species:'cat', skin:'#d7a36e', hair:'#8c6546', outfit:'#22cba7', accent:'#b7fff2', pattern:'checks', accessory:'crown' },
  { species:'slime', skin:'#64c8eb', hair:'#183c51', outfit:'#397fe7', accent:'#83ecdf', pattern:'dots', accessory:'cap' }
];

const skinCatalog = [
  { id:'classic', name:'Nova Classic', type:'Explorer', price:0, bg:'#1b7698', glow:'rgba(46,230,197,.35)', design:{ species:'human',skin:'#9d6246',hair:'#162b3b',outfit:'#2ee6c5',accent:'#087b91',pattern:'bolt',accessory:'cap' } },
  { id:'monster', name:'Bloop Monster', type:'Friendly monster', price:600, bg:'#197f78', glow:'rgba(72,242,191,.38)', design:{ species:'monster',skin:'#50d5ad',hair:'#14606c',outfit:'#1f9ebc',accent:'#a4fff0',pattern:'dots',accessory:'none' } },
  { id:'robot', name:'Bolt Buddy', type:'Happy robot', price:850, bg:'#315c8b', glow:'rgba(92,187,255,.38)', design:{ species:'robot',skin:'#9cbac5',hair:'#26475a',outfit:'#397fe7',accent:'#78f0e2',pattern:'checks',accessory:'none' } },
  { id:'alien', name:'Cosmo Pop', type:'Space alien', price:1000, bg:'#56419b', glow:'rgba(154,120,255,.4)', design:{ species:'alien',skin:'#7ee89d',hair:'#284c4a',outfit:'#6b63e8',accent:'#a7ffe0',pattern:'stars',accessory:'none' } },
  { id:'shark', name:'Finn Splash', type:'Shark kid', price:1250, bg:'#176b91', glow:'rgba(74,205,255,.42)', design:{ species:'shark',skin:'#62bfe1',hair:'#18445e',outfit:'#167fba',accent:'#e1faff',pattern:'waves',accessory:'none' } },
  { id:'cat', name:'Captain Whisker', type:'Adventure cat', price:1500, bg:'#a96742', glow:'rgba(255,185,105,.38)', design:{ species:'cat',skin:'#dda06a',hair:'#875334',outfit:'#18aa9f',accent:'#ffdf71',pattern:'stripes',accessory:'crown' } },
  { id:'slime', name:'Glub Glider', type:'Bubble monster', price:1450, bg:'#1f6d73', glow:'rgba(106,232,205,.38)', design:{ species:'slime',skin:'#68d8cf',hair:'#12424a',outfit:'#2d89c8',accent:'#dffefe',pattern:'dots',accessory:'beanie' } },
  { id:'ember', name:'Ember Wisp', type:'Fire monster', price:1700, bg:'#8d3f2e', glow:'rgba(255,164,101,.38)', design:{ species:'monster',skin:'#f2ad6c',hair:'#44221c',outfit:'#ff5d3c',accent:'#ffd97d',pattern:'stars',accessory:'none' } }
];
let ownedSkins=['classic'];
let selectedSkin='classic';
try { ownedSkins=JSON.parse(localStorage.getItem('hideSeekOwnedSkins'))||['classic'];selectedSkin=localStorage.getItem('hideSeekSelectedSkin')||'classic'; } catch (_) { /* Use defaults. */ }
const savedSkin=skinCatalog.find(skin=>skin.id===selectedSkin)||skinCatalog[0];
player.design={...savedSkin.design};

function buildWorld() {
  const types = mapPropTypes[currentMap];
  worldProps = propLayouts.map(([x, y], index) => {
    const type = types[index % types.length];
    const size = ['tree','palm','locker','vending'].includes(type) ? 43 : ['bush','tent','dumpster','kiosk','umbrella'].includes(type) ? 38 : 32;
    return { x, y, type, name: propNames[type], radius: size, searched: false, hider: null, hintUntil: 0 };
  });
  worldDetails = Array.from({ length: 115 }, (_, index) => ({
    x: 35 + ((index * 193 + 71) % (WORLD.width - 70)),
    y: 35 + ((index * 317 + 43) % (WORLD.height - 70)),
    size: 3 + (index % 5),
    variant: index % 4
  }));
  worldCoins = Array.from({ length: 24 }, (_, index) => ({
    x: 90 + ((index * 367 + 151) % (WORLD.width - 180)),
    y: 110 + ((index * 229 + 97) % (WORLD.height - 220)),
    collected: false,
    phase: index * .7
  })).map(coin => {
    if(worldProps.some(prop=>distance(coin,prop)<prop.radius+65)){
      coin.x=80+((coin.x+137)%(WORLD.width-160));
      coin.y=90+((coin.y+181)%(WORLD.height-180));
    }
    return coin;
  });
  const available = worldProps.map((_, index) => index).sort(() => Math.random() - .5).slice(0, 5);
  const names = ['PixelMoth', 'EchoFox', 'MistyVibe', 'ArcticByte', 'KiteJam'];
  const colors = ['#287fd6','#20a8c8','#53c8e8','#22cba7','#397fe7'];
  hiders = available.map((propIndex, index) => {
    const target = worldProps[propIndex];
    const hider = { name: names[index], color: colors[index], design: characterDesigns[index], x: 1190 + index * 30, y: 830 + index * 18, target, found: false, bob: index, direction: 1 };
    target.hider = hider;
    return hider;
  });
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  camera.width = rect.width;
  camera.height = rect.height;
}

function formatTime(totalSeconds) {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function showGameEvent(message, success = false) {
  clearTimeout(eventTimer);
  gameEvent.textContent = message;
  gameEvent.style.borderColor = success ? 'rgba(46,230,197,.48)' : '';
  gameEvent.classList.add('show');
  eventTimer = setTimeout(() => gameEvent.classList.remove('show'), 1800);
}

function resetMatchState() {
  clearInterval(gameInterval);
  gamePhase = 'hiding';
  hidingSeconds = 30;
  gameSeconds = 300;
  captures = 0;
  matchCoins = 0;
  matchCoinCount.textContent = '0';
  matchXp = 0;
  pulseCooldown = 0;
  player.x = 1250;
  player.y = 850;
  player.walk = 0;
  player.direction = 1;
  player.stamina = 100;
  player.sprinting = false;
  staminaFill.style.width = '100%';
  document.getElementById('sprintStatus').textContent = '100%';
  sprintButton.disabled = false;
  buildWorld();
  hideCountdown.textContent = hidingSeconds;
  gameClock.textContent = '00:30';
  document.getElementById('clockLabel').textContent = 'HIDING PHASE';
  document.getElementById('gamePhaseLabel').textContent = 'HIDERS ARE MOVING';
  document.getElementById('foundCount').textContent = '0 / 5';
  document.querySelector('.game-clock').classList.remove('danger');
  foundTracker.forEach(icon => { icon.textContent = '?'; icon.classList.remove('caught'); });
  hideOverlay.classList.remove('hidden');
  gameResult.classList.remove('open');
  gameResult.setAttribute('aria-hidden', 'true');
  pulseButton.disabled = true;
  document.getElementById('pulseStatus').textContent = 'Wait';
  objectiveText.textContent = 'No peeking — hiders are choosing spots';
  nearbyProp = null;
  interactionPrompt.classList.remove('show');
}

function launchGame() {
  clearTimeout(gameLaunchTimeout);
  clearInterval(matchmakingInterval);
  matchmaking.classList.remove('open');
  matchmaking.setAttribute('aria-hidden', 'true');
  gameScreen.classList.add('open');
  gameScreen.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  document.getElementById('gameMapLabel').textContent = previewMapName.textContent.toUpperCase();
  const scene = document.querySelector('.map-card.selected')?.dataset.scene || 'forest-scene';
  currentMap = scene.startsWith('school') ? 'school' : scene.startsWith('mall') ? 'mall' : scene.startsWith('tropical') ? 'tropical' : scene.startsWith('themepark') ? 'themepark' : scene.startsWith('space') ? 'space' : scene.startsWith('volcano') ? 'volcano' : 'forest';
  playArena.classList.remove('forest-game','school-game','mall-game','tropical-game','themepark-game','space-game','volcano-game');
  playArena.classList.add(`${currentMap}-game`);
  resizeCanvas();
  resetMatchState();
  gameInterval = setInterval(tickGame, 1000);
  lastFrame = performance.now();
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(gameLoop);
}

function tickGame() {
  if (gamePhase === 'hiding') {
    hidingSeconds -= 1;
    hideCountdown.textContent = hidingSeconds;
    gameClock.textContent = formatTime(hidingSeconds);
    if (hidingSeconds <= 0) beginSeeking();
    return;
  }
  if (gamePhase !== 'seeking') return;
  gameSeconds -= 1;
  gameClock.textContent = formatTime(gameSeconds);
  if (gameSeconds <= 30) document.querySelector('.game-clock').classList.add('danger');
  if (pulseCooldown > 0) {
    pulseCooldown -= 1;
    document.getElementById('pulseStatus').textContent = `${pulseCooldown}s`;
    if (!pulseCooldown) {
      pulseButton.disabled = false;
      document.getElementById('pulseStatus').textContent = 'Ready';
    }
  }
  if (gameSeconds <= 0) finishGame(false);
}

function beginSeeking() {
  if (gamePhase !== 'hiding') return;
  gamePhase = 'seeking';
  hiders.forEach(hider => { hider.x = hider.target.x; hider.y = hider.target.y; });
  hideOverlay.classList.add('hidden');
  gameClock.textContent = '05:00';
  document.getElementById('clockLabel').textContent = 'TIME REMAINING';
  document.getElementById('gamePhaseLabel').textContent = 'EXPLORE THE MAP';
  objectiveText.textContent = 'Find all five hiders';
  pulseButton.disabled = false;
  document.getElementById('pulseStatus').textContent = 'Ready';
  playTone(760, .15);
  showGameEvent('Search started — move close to objects and press E');
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function updateHiders(dt) {
  if (gamePhase !== 'hiding') return;
  hiders.forEach(hider => {
    const dx = hider.target.x - hider.x;
    const dy = hider.target.y - hider.y;
    const length = Math.hypot(dx, dy);
    if (length > 20) {
      hider.x += dx / length * 145 * dt;
      hider.y += dy / length * 145 * dt;
      hider.direction = dx < 0 ? -1 : 1;
      hider.bob += dt * 10;
    }
  });
}

function updatePlayer(dt) {
  if (gamePhase !== 'seeking') { player.moving = false; return; }
  let dx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
  let dy = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
  const length = Math.hypot(dx, dy);
  player.moving = length > 0;
  const wantsSprint = Boolean(keys.Shift || keys.sprint);
  player.sprinting = player.moving && wantsSprint && player.stamina > 1;
  if (player.sprinting) player.stamina = Math.max(0, player.stamina - 27 * dt);
  else player.stamina = Math.min(100, player.stamina + 18 * dt);
  const speedMultiplier = player.sprinting ? 1.72 : 1;
  staminaFill.style.width = `${player.stamina}%`;
  document.getElementById('sprintStatus').textContent = player.stamina < 1 ? 'Tired' : `${Math.round(player.stamina)}%`;
  sprintButton.classList.toggle('active', player.sprinting);
  sprintButton.classList.toggle('exhausted', player.stamina < 1);
  if (length) {
    dx /= length;
    dy /= length;
    player.direction = dx < 0 ? -1 : dx > 0 ? 1 : player.direction;
    player.walk += dt * 11;
    const next = {
      x: Math.max(35, Math.min(WORLD.width - 35, player.x + dx * player.speed * speedMultiplier * dt)),
      y: Math.max(55, Math.min(WORLD.height - 35, player.y + dy * player.speed * speedMultiplier * dt))
    };
    const blocked = worldProps.some(prop => !prop.searched && distance(next, prop) < prop.radius + player.radius - 5);
    if (!blocked) { player.x = next.x; player.y = next.y; }
    else {
      const xOnly = { x: next.x, y: player.y };
      const yOnly = { x: player.x, y: next.y };
      if (!worldProps.some(prop => distance(xOnly, prop) < prop.radius + player.radius - 5)) player.x = next.x;
      else if (!worldProps.some(prop => distance(yOnly, prop) < prop.radius + player.radius - 5)) player.y = next.y;
    }
  }
  nearbyProp = worldProps.filter(prop => !prop.searched).sort((a, b) => distance(player, a) - distance(player, b))[0];
  const closeEnough = nearbyProp && distance(player, nearbyProp) < nearbyProp.radius + 95;
  interactionPrompt.classList.toggle('show', Boolean(closeEnough));
  if (closeEnough) interactionPrompt.querySelector('strong').textContent = nearbyProp.name;
  else nearbyProp = null;
  updateAreaName();
  collectNearbyCoins();
}

function collectNearbyCoins() {
  worldCoins.forEach(coin => {
    if (coin.collected || distance(player, coin) > 38) return;
    coin.collected = true;
    matchCoins += 10;
    matchCoinCount.textContent = matchCoins;
    updateCoins(10);
    playTone(720 + (worldCoins.filter(item=>item.collected).length%4)*80,.08);
    showGameEvent('Coin collected! +10',true);
  });
}

function updateAreaName() {
  const horizontal = player.x < 830 ? 'West' : player.x > 1670 ? 'East' : 'Central';
  const vertical = player.y < 560 ? ' entrance' : player.y > 1140 ? ' outskirts' : ' grounds';
  areaName.textContent = horizontal + vertical;
}

function searchNearby() {
  if (gamePhase !== 'seeking') return;
  if (!nearbyProp) {
    showGameEvent('Move closer to an object first');
    return;
  }
  const prop = nearbyProp;
  prop.searched = true;
  nearbyProp = null;
  interactionPrompt.classList.remove('show');
  if (prop.hider && !prop.hider.found) {
    prop.hider.found = true;
    prop.hider.x = prop.x + 20;
    prop.hider.y = prop.y - 8;
    captures += 1;
    matchCoins += 50;
    matchCoinCount.textContent = matchCoins;
    matchXp += 60;
    updateCoins(50);
    updateXp(60);
    const tracker = foundTracker[captures - 1];
    tracker.textContent = prop.hider.name[0];
    tracker.classList.add('caught');
    document.getElementById('foundCount').textContent = `${captures} / 5`;
    objectiveText.textContent = captures === 5 ? 'Map cleared!' : `${5 - captures} hiders remaining`;
    showGameEvent(`${prop.hider.name} found! +50 coins`, true);
    playTone(620 + captures * 55, .14);
    if (captures === 5) setTimeout(() => finishGame(true), 800);
  } else {
    gameSeconds = Math.max(0, gameSeconds - 3);
    showGameEvent(`${prop.name} is empty —3 seconds`);
    playTone(170, .1);
  }
}

function usePulse() {
  if (gamePhase !== 'seeking' || pulseCooldown || captures === 5) return;
  const possible = worldProps.filter(prop => prop.hider && !prop.hider.found);
  if (!possible.length) return;
  const target = possible[Math.floor(Math.random() * possible.length)];
  target.hintUntil = performance.now() + 4000;
  pulseCooldown = 60;
  pulseButton.disabled = true;
  document.getElementById('pulseStatus').textContent = '60s';
  showGameEvent('Movement detected — follow the purple signal!', true);
  playTone(430, .5);
}

function finishGame(won) {
  if (gamePhase === 'finished') return;
  gamePhase = 'finished';
  clearInterval(gameInterval);
  interactionPrompt.classList.remove('show');
  pulseButton.disabled = true;
  if (won) {
    matchCoins += 150;
    matchCoinCount.textContent = matchCoins;
    matchXp += 200;
    updateCoins(150);
    updateXp(200);
  }
  document.getElementById('resultIcon').textContent = won ? '★' : '⌛';
  document.getElementById('resultKicker').textContent = won ? 'SEEKER VICTORY' : 'TIME EXPIRED';
  document.getElementById('gameResultTitle').textContent = won ? 'All hiders found!' : 'The hiders escaped!';
  document.getElementById('gameResultText').textContent = won ? `You explored ${previewMapName.textContent} with ${formatTime(gameSeconds)} left.` : `You found ${captures} of 5 hiders. Explore farther and use pulse scan.`;
  document.getElementById('resultCaptures').textContent = `${captures} / 5`;
  document.getElementById('resultCoins').textContent = `+${matchCoins}`;
  document.getElementById('resultXp').textContent = `+${matchXp}`;
  gameResult.classList.add('open');
  gameResult.setAttribute('aria-hidden', 'false');
  playTone(won ? 880 : 160, .4);
}

function leaveGame() {
  clearInterval(gameInterval);
  cancelAnimationFrame(animationFrame);
  gamePhase = 'idle';
  gameScreen.classList.remove('open');
  gameScreen.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  Object.keys(keys).forEach(key => { keys[key] = false; });
  playButton.focus();
}

// Canvas rendering helpers
function roundedRect(context, x, y, w, h, r) {
  context.beginPath();
  context.roundRect(x, y, w, h, r);
  context.fill();
}

function drawGround() {
  const theme = mapThemes[currentMap];
  const groundGradient = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height);
  groundGradient.addColorStop(0, theme.ground);
  groundGradient.addColorStop(.5, currentMap === 'forest' ? '#123c43' : currentMap === 'school' ? '#163848' : currentMap === 'tropical' ? '#efd88c' : currentMap === 'themepark' ? '#34496c' : '#15334b');
  groundGradient.addColorStop(1, theme.ground);
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD.width; x += 100) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,WORLD.height); ctx.stroke(); }
  for (let y = 0; y <= WORLD.height; y += 100) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(WORLD.width,y); ctx.stroke(); }

  if (currentMap === 'forest') {
    ctx.strokeStyle = theme.path; ctx.lineWidth = 145; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-80,900); ctx.bezierCurveTo(500,650,850,1050,1280,820); ctx.bezierCurveTo(1710,590,2020,980,2580,690); ctx.stroke();
    ctx.fillStyle = theme.water; ctx.beginPath(); ctx.ellipse(1880,1320,220,125,-.15,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#4e766d'; ctx.lineWidth = 8; ctx.stroke();
    drawBuilding(1030,90,430,220,'RANGER CABIN','#493b32');
    ctx.fillStyle='#d99951';
    for(let i=0;i<5;i++){const x=1080+i*78;ctx.beginPath();ctx.arc(x,345,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(217,153,81,.14)';ctx.beginPath();ctx.arc(x,345,30,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d99951'}
  } else if (currentMap === 'school') {
    drawBuilding(740,40,1020,300,'NORTH HALL','#424856');
    ctx.fillStyle = '#5b4c51'; ctx.fillRect(800,1040,900,500);
    ctx.strokeStyle = '#d7c48d'; ctx.lineWidth = 5; ctx.strokeRect(840,1080,820,420);
    ctx.beginPath(); ctx.arc(1250,1290,90,0,Math.PI*2); ctx.stroke();
    ctx.setLineDash([40,25]); ctx.beginPath(); ctx.moveTo(1250,1080); ctx.lineTo(1250,1500); ctx.stroke(); ctx.setLineDash([]);
    for(let i=0;i<7;i++){ctx.fillStyle='#d79745';ctx.beginPath();ctx.moveTo(350+i*280,650);ctx.lineTo(365+i*280,610);ctx.lineTo(380+i*280,650);ctx.fill();ctx.fillStyle='#f2e0b5';ctx.fillRect(360+i*280,626,10,5)}
  } else if (currentMap === 'mall') {
    ctx.fillStyle = '#171824'; ctx.fillRect(0,0,WORLD.width,250); ctx.fillRect(0,1450,WORLD.width,250); ctx.fillRect(0,0,260,WORLD.height); ctx.fillRect(2240,0,260,WORLD.height);
    const shopColors = ['#873c79','#315e74','#76513c','#4b477e','#346451'];
    for (let i=0;i<7;i++) { drawShop(310+i*285,60,230,145,shopColors[i%shopColors.length],`SHOP ${i+1}`); drawShop(310+i*285,1490,230,145,shopColors[(i+2)%shopColors.length],`UNIT ${i+8}`); }
    ctx.fillStyle = theme.water; ctx.beginPath(); ctx.arc(1250,850,170,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#63ced8'; ctx.lineWidth = 10; ctx.stroke();
    ctx.fillStyle = '#87e2e6'; ctx.beginPath(); ctx.arc(1250,850,38,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(46,230,197,.35)';ctx.lineWidth=3;for(let x=350;x<2200;x+=280){ctx.beginPath();ctx.moveTo(x,270);ctx.lineTo(x,1430);ctx.stroke()}
  } else if (currentMap === 'tropical') {
    ctx.fillStyle=theme.water;ctx.fillRect(0,0,WORLD.width,390);
    for(let y=65;y<370;y+=55){ctx.strokeStyle='rgba(174,244,247,.32)';ctx.lineWidth=5;ctx.beginPath();for(let x=0;x<WORLD.width;x+=55){ctx.quadraticCurveTo(x+14,y-8,x+28,y);ctx.quadraticCurveTo(x+42,y+8,x+55,y)}ctx.stroke()}
    ctx.fillStyle='#f1d786';ctx.beginPath();ctx.moveTo(0,325);for(let x=0;x<=WORLD.width;x+=90)ctx.lineTo(x,350+Math.sin(x*.012)*35);ctx.lineTo(WORLD.width,720);ctx.lineTo(0,720);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#9a6b43';ctx.lineWidth=85;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(160,880);ctx.bezierCurveTo(580,690,980,1080,1360,850);ctx.bezierCurveTo(1750,620,2080,1040,2420,840);ctx.stroke();
    ctx.fillStyle='#0d7890';ctx.beginPath();ctx.ellipse(1880,1320,260,145,-.12,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#63d9dd';ctx.lineWidth=8;ctx.stroke();
    drawBuilding(1040,430,360,185,'SURF SHACK','#e86f56');
    for(let i=0;i<6;i++){ctx.fillStyle=['#ff6ea8','#53d9d1','#ffcf4b'][i%3];ctx.beginPath();ctx.arc(490+i*310,575,33,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#805b3b';ctx.fillRect(487+i*310,575,6,55)}
  } else {
    ctx.strokeStyle='#70558d';ctx.lineWidth=190;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(170,810);ctx.bezierCurveTo(600,430,900,1180,1300,820);ctx.bezierCurveTo(1700,470,2030,1110,2380,740);ctx.stroke();
    ctx.strokeStyle='#d19bd5';ctx.lineWidth=5;ctx.stroke();
    drawFerrisWheel(420,470,170);
    drawBuilding(1010,110,470,210,'FUN HOUSE','#e34f8f');
    for(let i=0;i<5;i++)drawShop(1550+i*155,180+(i%2)*35,125,105,['#f06492','#1bb9c4','#f0b841'][i%3],['POP!','GAMES','TREATS'][i%3]);
    ctx.fillStyle='#2381a8';ctx.beginPath();ctx.arc(1780,1260,185,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#65d9e7';ctx.lineWidth=9;ctx.stroke();
    ctx.strokeStyle='#ffcf4b';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(90,275);ctx.bezierCurveTo(560,80,700,450,1030,270);ctx.bezierCurveTo(1510,10,1760,420,2410,170);ctx.stroke();
    ctx.strokeStyle='#253149';ctx.lineWidth=7;for(let x=160;x<2380;x+=130){ctx.beginPath();ctx.moveTo(x,230);ctx.lineTo(x,390);ctx.stroke()}
  }
  drawGroundDetails();
  ctx.strokeStyle = 'rgba(46,230,197,.28)'; ctx.lineWidth = 8; ctx.strokeRect(4,4,WORLD.width-8,WORLD.height-8);
}

function drawFerrisWheel(x,y,r){ctx.save();ctx.translate(x,y);ctx.strokeStyle='#55e1dc';ctx.lineWidth=9;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.lineWidth=4;for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();ctx.fillStyle=['#ff6fae','#ffce4d','#57d8e6'][i%3];ctx.beginPath();ctx.roundRect(Math.cos(a)*r-15,Math.sin(a)*r-9,30,22,6);ctx.fill()}ctx.fillStyle='#ffd45b';ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#1c2a40';ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(-15,15);ctx.lineTo(-105,r+130);ctx.moveTo(15,15);ctx.lineTo(105,r+130);ctx.stroke();ctx.restore()}

function drawGroundDetails() {
  worldDetails.forEach(detail => {
    const {x,y,size,variant}=detail;
    if(currentMap==='forest'){
      if(variant===0){ctx.strokeStyle='#41694e';ctx.lineWidth=2;for(let j=-1;j<=1;j++){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+j*5,y-size*3);ctx.stroke()}}
      else if(variant===1){ctx.fillStyle='#d9d16a';for(let a=0;a<5;a++){ctx.beginPath();ctx.arc(x+Math.cos(a*1.256)*4,y+Math.sin(a*1.256)*4,2.5,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#7c552d';ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill()}
      else if(variant===2){ctx.fillStyle='#b76853';ctx.beginPath();ctx.arc(x,y,size,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#f3e7cf';ctx.fillRect(x-1,y,2,size+3)}
      else{ctx.fillStyle='rgba(210,230,179,.12)';ctx.beginPath();ctx.ellipse(x,y,size*2,size,0,0,Math.PI*2);ctx.fill()}
    }else if(currentMap==='school'){
      if(variant===0){ctx.strokeStyle='rgba(220,224,230,.16)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,size*2,0,Math.PI*1.6);ctx.stroke()}
      else if(variant===1){ctx.fillStyle='rgba(20,22,29,.28)';ctx.beginPath();ctx.ellipse(x,y,size*3,size,0,0,Math.PI*2);ctx.fill()}
      else{ctx.fillStyle=variant===2?'#bf9a55':'#58616d';ctx.fillRect(x-size,y-size/2,size*2,size)}
    }else if(currentMap==='mall'){
      ctx.fillStyle=variant%2?'rgba(46,230,197,.13)':'rgba(81,184,244,.12)';ctx.beginPath();ctx.arc(x,y,size*2,0,Math.PI*2);ctx.fill();ctx.strokeStyle=variant%2?'#2ee6c5':'#58b8f4';ctx.lineWidth=1;ctx.stroke()
    }else if(currentMap==='tropical'){
      if(variant===0){ctx.fillStyle='#fff3ba';ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d49d68';ctx.lineWidth=2;ctx.stroke()}
      else if(variant===1){ctx.fillStyle='#34a876';for(let a=0;a<6;a++){ctx.beginPath();ctx.ellipse(x+Math.cos(a)*5,y+Math.sin(a)*5,3,8,a,0,Math.PI*2);ctx.fill()}}
      else{ctx.fillStyle=variant===2?'#ef7167':'rgba(255,255,255,.32)';ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill()}
    }else{
      ctx.fillStyle=['#ff73b8','#5ee5dc','#ffca4b','#8c78ed'][variant];ctx.globalAlpha=.2;ctx.beginPath();ctx.arc(x,y,size*2,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1
    }
  });
}

function drawBuilding(x,y,w,h,label,color) {
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x+28,y+32,w,h);
  ctx.fillStyle='#29252a';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+45,y-38);ctx.lineTo(x+w+45,y-38);ctx.lineTo(x+w,y);ctx.closePath();ctx.fill();
  ctx.fillStyle = color; ctx.fillRect(x,y,w,h);
  ctx.fillStyle='rgba(255,255,255,.09)';ctx.fillRect(x,y,13,h);
  ctx.fillStyle = '#242731'; ctx.fillRect(x,y,w,35);
  ctx.fillStyle = '#d6a85b';
  for(let wx=x+45;wx<x+w-30;wx+=90) ctx.fillRect(wx,y+70,45,54);
  ctx.fillStyle = '#171a20'; ctx.fillRect(x+w/2-35,y+h-85,70,85);
  ctx.fillStyle = '#c6cbd2'; ctx.font = '700 18px Space Grotesk'; ctx.textAlign='center'; ctx.fillText(label,x+w/2,y+29);
}

function drawShop(x,y,w,h,color,label) {
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x+15,y+16,w,h);ctx.fillStyle='#1d1a24';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+18,y-18);ctx.lineTo(x+w+18,y-18);ctx.lineTo(x+w,y);ctx.closePath();ctx.fill();ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
  ctx.fillStyle='#151722';ctx.fillRect(x+15,y+55,w-30,h-55);ctx.fillStyle='#e8dffa';ctx.font='700 13px Space Grotesk';ctx.textAlign='center';ctx.fillText(label,x+w/2,y+34);
}

function drawProp(prop) {
  const { x, y, type } = prop;
  const searchedAlpha = prop.searched && !(prop.hider?.found) ? .45 : 1;
  ctx.save(); ctx.globalAlpha = searchedAlpha;
  ctx.fillStyle='rgba(0,0,0,.33)';ctx.beginPath();ctx.ellipse(x,y+12,prop.radius*1.25,prop.radius*.43,0,0,Math.PI*2);ctx.fill();
  if (prop.hintUntil > performance.now()) { ctx.strokeStyle='#58b8f4';ctx.lineWidth=6;ctx.beginPath();ctx.arc(x,y,prop.radius+18+Math.sin(performance.now()/120)*8,0,Math.PI*2);ctx.stroke(); }
  switch(type) {
    case 'tree':
      ctx.fillStyle='#49382c';ctx.fillRect(x-12,y-95,24,105);ctx.fillStyle='#1f523d';ctx.beginPath();ctx.arc(x-22,y-100,48,0,Math.PI*2);ctx.arc(x+25,y-112,55,0,Math.PI*2);ctx.arc(x,y-150,48,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.arc(x-12,y-130,25,0,Math.PI*2);ctx.fill();break;
    case 'palm':
      ctx.strokeStyle='#885a37';ctx.lineWidth=25;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y+5);ctx.quadraticCurveTo(x-22,y-70,x+4,y-135);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.15)';ctx.lineWidth=5;ctx.stroke();ctx.fillStyle='#159a69';for(let a=0;a<7;a++){ctx.save();ctx.translate(x+4,y-140);ctx.rotate(a*Math.PI*2/7);ctx.beginPath();ctx.ellipse(35,0,42,10,0,0,Math.PI*2);ctx.fill();ctx.restore()}ctx.fillStyle='#9c6339';for(let a=0;a<3;a++){ctx.beginPath();ctx.arc(x-6+a*10,y-132+a%2*5,7,0,Math.PI*2);ctx.fill()}break;
    case 'bush':
      ctx.fillStyle='#286044';ctx.beginPath();ctx.arc(x-30,y-24,35,0,Math.PI*2);ctx.arc(x,y-38,43,0,Math.PI*2);ctx.arc(x+34,y-22,34,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3b7958';ctx.beginPath();ctx.arc(x-8,y-50,19,0,Math.PI*2);ctx.fill();break;
    case 'rock':
      ctx.fillStyle='#626c73';ctx.beginPath();ctx.moveTo(x-43,y);ctx.lineTo(x-32,y-43);ctx.lineTo(x+8,y-58);ctx.lineTo(x+45,y-18);ctx.lineTo(x+37,y+5);ctx.closePath();ctx.fill();ctx.fillStyle='#7e878c';ctx.beginPath();ctx.moveTo(x-27,y-40);ctx.lineTo(x+7,y-54);ctx.lineTo(x+20,y-29);ctx.lineTo(x-12,y-18);ctx.closePath();ctx.fill();break;
    case 'tent':
      ctx.fillStyle='#715aa0';ctx.beginPath();ctx.moveTo(x,y-90);ctx.lineTo(x+73,y+8);ctx.lineTo(x-73,y+8);ctx.closePath();ctx.fill();ctx.strokeStyle='#b6a5db';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-90);ctx.lineTo(x,y+8);ctx.stroke();ctx.fillStyle='#29223c';ctx.beginPath();ctx.moveTo(x,y-47);ctx.lineTo(x+32,y+8);ctx.lineTo(x,y+8);ctx.closePath();ctx.fill();break;
    case 'umbrella':
      ctx.fillStyle='#7d573b';ctx.fillRect(x-4,y-55,8,62);ctx.fillStyle='#ff6fae';ctx.beginPath();ctx.arc(x,y-58,58,Math.PI,Math.PI*2);ctx.lineTo(x+58,y-58);ctx.closePath();ctx.fill();ctx.fillStyle='#ffcf4b';ctx.beginPath();ctx.moveTo(x,y-116);ctx.arc(x,y-58,58,Math.PI,Math.PI*1.34);ctx.closePath();ctx.fill();ctx.fillStyle='#56dcd3';ctx.beginPath();ctx.moveTo(x,y-116);ctx.arc(x,y-58,58,Math.PI*1.66,Math.PI*2);ctx.closePath();ctx.fill();break;
    case 'crate':
      ctx.fillStyle='#84623e';ctx.fillRect(x-38,y-58,76,64);ctx.strokeStyle='#b48a59';ctx.lineWidth=6;ctx.strokeRect(x-36,y-56,72,60);ctx.beginPath();ctx.moveTo(x-32,y-52);ctx.lineTo(x+32,y+1);ctx.moveTo(x+32,y-52);ctx.lineTo(x-32,y+1);ctx.stroke();break;
    case 'barrel':
      ctx.fillStyle='#77563d';ctx.beginPath();ctx.roundRect(x-30,y-70,60,77,16);ctx.fill();ctx.fillStyle='#302d2c';ctx.fillRect(x-31,y-52,62,8);ctx.fillRect(x-31,y-15,62,8);ctx.fillStyle='#9b7452';ctx.beginPath();ctx.ellipse(x,y-68,29,9,0,0,Math.PI*2);ctx.fill();break;
    case 'bench':
      ctx.fillStyle='#775b43';ctx.fillRect(x-58,y-45,116,18);ctx.fillRect(x-58,y-18,116,16);ctx.fillStyle='#2b2d2e';ctx.fillRect(x-45,y-3,8,25);ctx.fillRect(x+37,y-3,8,25);break;
    case 'locker':
      ctx.fillStyle='#3c525b';ctx.fillRect(x-38,y-115,76,122);ctx.strokeStyle='#273940';ctx.lineWidth=4;ctx.strokeRect(x-38,y-115,38,122);ctx.strokeRect(x,y-115,38,122);ctx.fillStyle='#1e2e35';for(let ly=-96;ly<-72;ly+=8){ctx.fillRect(x-25,y+ly,13,2);ctx.fillRect(x+12,y+ly,13,2)}break;
    case 'dumpster':
      ctx.fillStyle='#3d6255';ctx.fillRect(x-55,y-63,110,69);ctx.fillStyle='#2b493f';ctx.beginPath();ctx.moveTo(x-62,y-68);ctx.lineTo(x+48,y-78);ctx.lineTo(x+60,y-62);ctx.lineTo(x-52,y-52);ctx.closePath();ctx.fill();ctx.fillStyle='#161c1b';ctx.beginPath();ctx.arc(x-37,y+8,9,0,Math.PI*2);ctx.arc(x+37,y+8,9,0,Math.PI*2);ctx.fill();break;
    case 'vending':
      ctx.fillStyle='#126b88';ctx.fillRect(x-38,y-118,76,125);ctx.fillStyle='#142b3a';ctx.fillRect(x-26,y-91,42,60);ctx.fillStyle='#49d9d0';ctx.font='700 9px Manrope';ctx.textAlign='center';ctx.fillText('DRINKS',x-5,y-101);ctx.fillStyle='#8be3ef';for(let vy=-83;vy<-40;vy+=18)for(let vx=-20;vx<10;vx+=15)ctx.fillRect(x+vx,y+vy,8,13);break;
    case 'sign':
      ctx.fillStyle='#24404a';ctx.fillRect(x-6,y-57,12,64);ctx.fillStyle=currentMap==='mall'?'#087b91':currentMap==='themepark'?'#e24f91':'#2577d8';ctx.fillRect(x-44,y-112,88,61);ctx.fillStyle='white';ctx.font='700 10px Space Grotesk';ctx.textAlign='center';ctx.fillText(currentMap==='school'?'HALL B':currentMap==='mall'?'LEVEL 1':currentMap==='themepark'?'FUN ZONE':currentMap==='tropical'?'BEACH':'CAMP',x,y-78);break;
    case 'kiosk':
      ctx.fillStyle='#174e68';ctx.beginPath();ctx.roundRect(x-48,y-88,96,95,8);ctx.fill();ctx.fillStyle='#ff6fae';ctx.beginPath();ctx.moveTo(x-58,y-88);ctx.lineTo(x-43,y-112);ctx.lineTo(x+43,y-112);ctx.lineTo(x+58,y-88);ctx.closePath();ctx.fill();ctx.fillStyle='#9df7ef';ctx.fillRect(x-28,y-62,56,38);ctx.fillStyle='#123342';ctx.font='800 9px Manrope';ctx.textAlign='center';ctx.fillText(currentMap==='tropical'?'JUICE':'TICKETS',x,y-40);break;
    case 'ride':
      ctx.fillStyle='#151f32';ctx.beginPath();ctx.ellipse(x,y+3,53,18,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff5e9c';ctx.beginPath();ctx.roundRect(x-48,y-42,96,46,20);ctx.fill();ctx.fillStyle='#4be1df';ctx.beginPath();ctx.roundRect(x-27,y-55,54,34,13);ctx.fill();ctx.fillStyle='#16334d';ctx.beginPath();ctx.arc(x-30,y+6,12,0,Math.PI*2);ctx.arc(x+30,y+6,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe15d';ctx.beginPath();ctx.arc(x+35,y-24,6,0,Math.PI*2);ctx.fill();break;
    case 'log':
      ctx.fillStyle='#76513a';ctx.beginPath();ctx.roundRect(x-65,y-35,130,42,20);ctx.fill();ctx.fillStyle='#aa7a52';ctx.beginPath();ctx.ellipse(x+62,y-14,18,21,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#5a3f30';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x+62,y-14,10,0,Math.PI*2);ctx.stroke();break;
  }
  if (prop.searched) { ctx.fillStyle=prop.hider?.found?'#2ee6c5':'#e46b68';ctx.beginPath();ctx.arc(x,y-prop.radius-65,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#06251f';ctx.font='900 11px Manrope';ctx.textAlign='center';ctx.fillText(prop.hider?.found?'✓':'×',x,y-prop.radius-61); }
  ctx.restore();
}

function drawWorldCoin(coin) {
  const now=performance.now()/1000+coin.phase;
  const bob=Math.sin(now*2.7)*7;
  const turn=.3+Math.abs(Math.cos(now*2.2))*.7;
  ctx.save();ctx.translate(coin.x,coin.y-28+bob);
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,37-bob,20,7,0,0,Math.PI*2);ctx.fill();
  ctx.scale(turn,1);const gold=ctx.createLinearGradient(-14,-20,14,20);gold.addColorStop(0,'#fff19a');gold.addColorStop(.35,'#ffd43f');gold.addColorStop(1,'#e98a22');ctx.fillStyle=gold;ctx.beginPath();ctx.arc(0,0,19,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff2a0';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#8a5513';ctx.font='900 15px Space Grotesk';ctx.textAlign='center';ctx.fillText('C',0,5);ctx.restore();
  ctx.save();ctx.globalAlpha=.35+.2*Math.sin(now*3);ctx.strokeStyle='#ffda4f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(coin.x,coin.y-28+bob,27,0,Math.PI*2);ctx.stroke();ctx.restore();
}

function drawCharacter(character, isPlayer = false) {
  const design=character.design||player.design;
  const activeMovement=character.moving||gamePhase==='hiding';
  const cycle=character.walk??character.bob;
  const movingBob=Math.sin(cycle*2)*(activeMovement?3:1);
  const x=character.x,y=character.y+movingBob,direction=character.direction||1;
  const legSwing=activeMovement?Math.sin(cycle)*7:0;
  const shadow=ctx.createRadialGradient(x,y+17,2,x,y+17,30);shadow.addColorStop(0,'rgba(0,0,0,.48)');shadow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=shadow;ctx.beginPath();ctx.ellipse(x,y+17,31,12,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#171c23';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-8,y+2);ctx.lineTo(x-10-legSwing,y+23);ctx.moveTo(x+8,y+2);ctx.lineTo(x+10+legSwing,y+23);ctx.stroke();
  ctx.strokeStyle='#f1f2f4';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x-11-legSwing,y+23);ctx.lineTo(x-17-legSwing,y+23);ctx.moveTo(x+11+legSwing,y+23);ctx.lineTo(x+17+legSwing,y+23);ctx.stroke();
  ctx.strokeStyle=design.skin;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x-17,y-35);ctx.lineTo(x-27-legSwing*.35,y-9);ctx.moveTo(x+17,y-35);ctx.lineTo(x+27+legSwing*.35,y-9);ctx.stroke();
  const bodyGradient=ctx.createLinearGradient(x-21,y-48,x+22,y+8);bodyGradient.addColorStop(0,design.outfit);bodyGradient.addColorStop(.7,design.outfit);bodyGradient.addColorStop(1,design.accent);ctx.fillStyle=bodyGradient;ctx.beginPath();ctx.roundRect(x-22,y-50,44,58,14);ctx.fill();
  ctx.save();ctx.beginPath();ctx.roundRect(x-22,y-50,44,58,14);ctx.clip();ctx.fillStyle=design.accent;
  if(design.pattern==='stripes'){for(let py=y-45;py<y+10;py+=13)ctx.fillRect(x-24,py,48,5)}
  else if(design.pattern==='checks'){for(let py=0;py<4;py++)for(let px=0;px<3;px++)if((px+py)%2===0)ctx.fillRect(x-22+px*15,y-49+py*15,14,14)}
  else if(design.pattern==='dots'){for(let py=0;py<3;py++)for(let px=0;px<3;px++){ctx.beginPath();ctx.arc(x-13+px*13,y-38+py*17,3,0,Math.PI*2);ctx.fill()}}
  else if(design.pattern==='waves'){ctx.strokeStyle=design.accent;ctx.lineWidth=4;for(let py=y-36;py<y+5;py+=15){ctx.beginPath();for(let px=x-24;px<=x+24;px+=4)ctx.lineTo(px,py+Math.sin(px*.25)*3);ctx.stroke()}}
  else if(design.pattern==='stars'){drawStar(x,y-24,5,10,4);drawStar(x-13,y-40,5,5,2)}
  else{ctx.beginPath();ctx.moveTo(x-5,y-47);ctx.lineTo(x+12,y-47);ctx.lineTo(x+2,y-26);ctx.lineTo(x+14,y-26);ctx.lineTo(x-9,y+2);ctx.lineTo(x-2,y-18);ctx.lineTo(x-14,y-18);ctx.closePath();ctx.fill()}
  ctx.restore();
  ctx.fillStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.roundRect(x-16,y-44,7,37,4);ctx.fill();
  ctx.fillStyle=design.skin;ctx.fillRect(x-6,y-57,12,12);
  const faceGradient=ctx.createRadialGradient(x-6,y-72,2,x,y-66,23);faceGradient.addColorStop(0,lighten(design.skin,28));faceGradient.addColorStop(1,design.skin);ctx.fillStyle=faceGradient;ctx.beginPath();ctx.arc(x,y-68,20,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=design.hair;ctx.beginPath();ctx.arc(x,y-74,20,Math.PI,Math.PI*2);ctx.lineTo(x+19,y-66);ctx.quadraticCurveTo(x+10,y-75,x+5,y-84);ctx.quadraticCurveTo(x-2,y-74,x-10,y-85);ctx.quadraticCurveTo(x-13,y-73,x-19,y-67);ctx.fill();
  const faceShift=direction*1.5;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x-7+faceShift,y-69,4.6,5.5,0,0,Math.PI*2);ctx.ellipse(x+7+faceShift,y-69,4.6,5.5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#171b21';ctx.beginPath();ctx.arc(x-6+faceShift,y-68,2.2,0,Math.PI*2);ctx.arc(x+8+faceShift,y-68,2.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(236,106,112,.45)';ctx.beginPath();ctx.ellipse(x-13,y-60,4,2,0,0,Math.PI*2);ctx.ellipse(x+13,y-60,4,2,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#542d2e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+faceShift,y-63,8,.12*Math.PI,.88*Math.PI);ctx.stroke();
  drawAccessory(design.accessory,x,y,design);
  drawSpeciesFeatures(design.species||'human',x,y,design);
  if(isPlayer&&player.sprinting){ctx.strokeStyle='rgba(255,218,83,.58)';ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-direction*(30+i*10),y-30+i*13);ctx.lineTo(x-direction*(55+i*15),y-30+i*13);ctx.stroke()}}
  ctx.font='800 9px Manrope';ctx.textAlign='center';ctx.fillStyle=isPlayer?'#2ee6c5':'#fff';ctx.fillText(isPlayer?'YOU':character.name,x,y-103);
  if(!isPlayer&&character.found){ctx.fillStyle='#2ee6c5';ctx.beginPath();ctx.arc(x+25,y-80,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#06251f';ctx.font='900 8px Manrope';ctx.fillText('✓',x+25,y-77)}
}

function drawStar(cx,cy,points,outer,inner){ctx.beginPath();for(let i=0;i<points*2;i++){const radius=i%2?inner:outer,angle=-Math.PI/2+i*Math.PI/points;ctx.lineTo(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius)}ctx.closePath();ctx.fill()}
function lighten(hex,amount){const value=parseInt(hex.replace('#',''),16);const r=Math.min(255,(value>>16)+amount),g=Math.min(255,((value>>8)&255)+amount),b=Math.min(255,(value&255)+amount);return `rgb(${r},${g},${b})`}
function drawAccessory(type,x,y,design){
  if(type==='cap'){ctx.fillStyle=design.accent;ctx.beginPath();ctx.arc(x,y-85,18,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(x-2,y-86,22,5);ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(x-11,y-91,6,2)}
  else if(type==='beanie'){ctx.fillStyle=design.accent;ctx.beginPath();ctx.arc(x,y-84,17,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(x-18,y-85,36,6);ctx.beginPath();ctx.arc(x,y-103,5,0,Math.PI*2);ctx.fill()}
  else if(type==='bow'){ctx.fillStyle=design.accent;ctx.beginPath();ctx.ellipse(x-12,y-87,10,6,-.3,0,Math.PI*2);ctx.ellipse(x+4,y-87,10,6,.3,0,Math.PI*2);ctx.fill();ctx.fillStyle=design.outfit;ctx.beginPath();ctx.arc(x-4,y-87,4,0,Math.PI*2);ctx.fill()}
  else if(type==='headphones'){ctx.strokeStyle=design.accent;ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y-76,23,Math.PI,Math.PI*2);ctx.stroke();ctx.fillStyle=design.accent;ctx.fillRect(x-24,y-77,8,17);ctx.fillRect(x+16,y-77,8,17)}
  else if(type==='crown'){ctx.fillStyle='#f4d55e';ctx.beginPath();ctx.moveTo(x-17,y-84);ctx.lineTo(x-14,y-104);ctx.lineTo(x-5,y-94);ctx.lineTo(x,y-107);ctx.lineTo(x+6,y-94);ctx.lineTo(x+16,y-104);ctx.lineTo(x+17,y-84);ctx.closePath();ctx.fill();ctx.fillStyle='#e66b70';ctx.beginPath();ctx.arc(x,y-94,2.5,0,Math.PI*2);ctx.fill()}
}

function drawSpeciesFeatures(species,x,y,design){
  if(species==='monster'){ctx.fillStyle=design.accent;ctx.beginPath();ctx.moveTo(x-17,y-83);ctx.lineTo(x-25,y-106);ctx.lineTo(x-5,y-86);ctx.moveTo(x+17,y-83);ctx.lineTo(x+25,y-106);ctx.lineTo(x+5,y-86);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x-6,y-57);ctx.lineTo(x-2,y-51);ctx.lineTo(x+1,y-58);ctx.moveTo(x+5,y-58);ctx.lineTo(x+9,y-51);ctx.lineTo(x+12,y-58);ctx.fill()}
  else if(species==='robot'){ctx.strokeStyle='#bde6ee';ctx.lineWidth=4;ctx.strokeRect(x-20,y-88,40,40);ctx.strokeStyle='#bde6ee';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-88);ctx.lineTo(x,y-101);ctx.stroke();ctx.fillStyle='#55f2df';ctx.beginPath();ctx.arc(x,y-104,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6a8994';ctx.fillRect(x-25,y-73,6,15);ctx.fillRect(x+19,y-73,6,15)}
  else if(species==='alien'){ctx.strokeStyle=design.skin;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-10,y-84);ctx.quadraticCurveTo(x-20,y-102,x-25,y-105);ctx.moveTo(x+10,y-84);ctx.quadraticCurveTo(x+20,y-102,x+25,y-105);ctx.stroke();ctx.fillStyle='#c4fff0';ctx.beginPath();ctx.arc(x-25,y-106,5,0,Math.PI*2);ctx.arc(x+25,y-106,5,0,Math.PI*2);ctx.fill()}
  else if(species==='cat'){ctx.fillStyle=design.skin;ctx.beginPath();ctx.moveTo(x-18,y-82);ctx.lineTo(x-17,y-104);ctx.lineTo(x-3,y-87);ctx.moveTo(x+18,y-82);ctx.lineTo(x+17,y-104);ctx.lineTo(x+3,y-87);ctx.fill();ctx.strokeStyle='#583c32';ctx.lineWidth=1;for(let i=-1;i<=1;i+=2){ctx.beginPath();ctx.moveTo(x+i*10,y-60);ctx.lineTo(x+i*27,y-64);ctx.moveTo(x+i*10,y-57);ctx.lineTo(x+i*27,y-54);ctx.stroke()}}
  else if(species==='slime'){ctx.fillStyle=design.skin;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.arc(x+i*12,y-84-Math.abs(i)*4,10,0,Math.PI*2);ctx.fill()}ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(x-11,y-77,5,0,Math.PI*2);ctx.fill()}
  else if(species==='shark'){ctx.fillStyle=design.accent;ctx.beginPath();ctx.moveTo(x,y-88);ctx.lineTo(x+4,y-114);ctx.lineTo(x+17,y-87);ctx.fill();ctx.beginPath();ctx.moveTo(x-21,y-24);ctx.lineTo(x-38,y-10);ctx.lineTo(x-20,y-5);ctx.fill();ctx.fillStyle='#fff';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x+i*5,y-58);ctx.lineTo(x+i*5+3,y-52);ctx.lineTo(x+i*5+6,y-58);ctx.fill()}}
}

function updateCamera() {
  const targetX = Math.max(0,Math.min(WORLD.width-camera.width,player.x-camera.width/2));
  const targetY = Math.max(0,Math.min(WORLD.height-camera.height,player.y-camera.height/2));
  camera.x += (targetX-camera.x)*.1;
  camera.y += (targetY-camera.y)*.1;
}

function renderWorld() {
  const dpr=Math.min(window.devicePixelRatio||1,2);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,camera.width,camera.height);ctx.save();ctx.translate(-camera.x,-camera.y);
  drawGround();
  const renderables = worldProps.map(prop=>({y:prop.y,draw:()=>drawProp(prop)}));
  worldCoins.filter(coin=>!coin.collected).forEach(coin=>renderables.push({y:coin.y,draw:()=>drawWorldCoin(coin)}));
  hiders.forEach(hider=>{if(hider.found)renderables.push({y:hider.y+10,draw:()=>drawCharacter(hider)});});
  if(gamePhase!=='hiding')renderables.push({y:player.y+10,draw:()=>drawCharacter(player,true)});
  renderables.sort((a,b)=>a.y-b.y).forEach(item=>item.draw());
  ctx.restore();drawAtmosphere();drawMiniMap();
}

function drawAtmosphere(){
  const now=performance.now()/1000;ctx.save();
  for(let i=0;i<22;i++){const x=(i*137+now*(currentMap==='mall'||currentMap==='themepark'?13:5))%(camera.width+40)-20;const y=(i*83+Math.sin(now+i)*18)%(camera.height+30)-15;ctx.fillStyle=currentMap==='forest'?'rgba(46,230,197,.28)':currentMap==='mall'?'rgba(88,184,244,.24)':currentMap==='tropical'?'rgba(255,238,157,.3)':currentMap==='themepark'?'rgba(255,115,184,.26)':'rgba(103,232,241,.16)';ctx.beginPath();ctx.arc(x,y,1.2+(i%3),0,Math.PI*2);ctx.fill()}
  const vignette=ctx.createRadialGradient(camera.width/2,camera.height/2,Math.min(camera.width,camera.height)*.22,camera.width/2,camera.height/2,Math.max(camera.width,camera.height)*.72);vignette.addColorStop(0,'rgba(3,6,10,0)');vignette.addColorStop(1,'rgba(3,6,10,.52)');ctx.fillStyle=vignette;ctx.fillRect(0,0,camera.width,camera.height);ctx.fillStyle='rgba(125,145,190,.035)';ctx.fillRect(0,0,camera.width,camera.height);ctx.restore();
}

function drawMiniMap() {
  const theme=mapThemes[currentMap],sx=miniMap.width/WORLD.width,sy=miniMap.height/WORLD.height;
  miniCtx.clearRect(0,0,miniMap.width,miniMap.height);miniCtx.fillStyle=theme.mini;miniCtx.fillRect(0,0,miniMap.width,miniMap.height);
  miniCtx.fillStyle='rgba(255,255,255,.28)';worldProps.forEach(prop=>miniCtx.fillRect(prop.x*sx-1,prop.y*sy-1,2,2));
  miniCtx.fillStyle='#ffd84f';worldCoins.filter(coin=>!coin.collected).forEach(coin=>miniCtx.fillRect(coin.x*sx-1,coin.y*sy-1,2,2));
  hiders.filter(h=>h.found).forEach(h=>{miniCtx.fillStyle='#58b8f4';miniCtx.beginPath();miniCtx.arc(h.x*sx,h.y*sy,2,0,Math.PI*2);miniCtx.fill();});
  miniCtx.strokeStyle='rgba(255,255,255,.35)';miniCtx.strokeRect(camera.x*sx,camera.y*sy,camera.width*sx,camera.height*sy);
  miniCtx.fillStyle='#2ee6c5';miniCtx.beginPath();miniCtx.arc(player.x*sx,player.y*sy,3.5,0,Math.PI*2);miniCtx.fill();
}

function gameLoop(now) {
  if (!gameScreen.classList.contains('open')) return;
  const dt=Math.min((now-lastFrame)/1000,.035);lastFrame=now;
  updateHiders(dt);updatePlayer(dt);updateCamera();renderWorld();
  animationFrame=requestAnimationFrame(gameLoop);
}

// Lobby controls
playButton.addEventListener('click', openMatchmaking);
document.getElementById('cancelMatch').addEventListener('click', closeMatchmaking);
document.getElementById('cancelMatchBottom').addEventListener('click', closeMatchmaking);
matchmaking.addEventListener('click', event => { if (event.target === matchmaking) closeMatchmaking(); });
mapCards.forEach(card => card.addEventListener('click', () => chooseMap(card)));

document.querySelectorAll('.friend button').forEach(button => {
  button.addEventListener('click', () => {
    const friend = button.closest('.friend');
    const invited = button.classList.toggle('invited');
    button.textContent = invited ? '✓' : '＋';
    showToast(invited ? `Invite sent to ${friend.dataset.name}` : 'Invite cancelled', invited ? '✓' : '×');
    playTone(invited ? 650 : 300, .07);
  });
});

document.getElementById('addCoins').addEventListener('click', () => {
  const button = document.getElementById('addCoins');
  if (button.disabled) return;
  updateCoins(50); showToast('Daily bonus: +50 coins', 'C'); playTone(780, .12);
  button.disabled = true; button.textContent = '✓';
});
document.getElementById('privateButton').addEventListener('click', () => { showToast('Private room code copied: HIDE24', '#'); navigator.clipboard?.writeText('HIDE24').catch(()=>{}); });
document.getElementById('addFriend').addEventListener('click', () => showToast('Friend search opened', '+'));
document.getElementById('profileButton').addEventListener('click', () => showToast(`${(xp/100).toFixed(1)}% to level 25`, '⚡'));
const dailyRewardButton = document.getElementById('dailyReward');
const dailyKey = new Date().toISOString().slice(0, 10);
function setDailyClaimed() {
  dailyRewardButton.disabled = true;
  dailyRewardButton.classList.add('claimed');
  document.getElementById('dailyRewardText').textContent = 'Come back tomorrow!';
  dailyRewardButton.querySelector('i').textContent = 'CLAIMED';
}
try { if (localStorage.getItem('hideSeekDailyReward') === dailyKey) setDailyClaimed(); } catch (_) { /* Storage may be unavailable. */ }
dailyRewardButton.addEventListener('click', () => {
  if (dailyRewardButton.disabled) return;
  updateCoins(250);
  updateXp(75);
  showToast('Daily reward: +250 coins and +75 XP!', '🎁');
  playTone(620,.1);setTimeout(()=>playTone(790,.1),110);setTimeout(()=>playTone(980,.18),220);
  try { localStorage.setItem('hideSeekDailyReward', dailyKey); } catch (_) { /* Reward still works this session. */ }
  setDailyClaimed();
});

const skinShop = document.getElementById('skinShop');
function renderSkinShop() {
  document.getElementById('shopCoinCount').textContent = coins.toLocaleString();
  document.getElementById('skinGrid').innerHTML = skinCatalog.map(skin => {
    const owned=ownedSkins.includes(skin.id),selected=skin.id===selectedSkin;
    return `<button class="skin-card ${owned?'owned':'locked'} ${selected?'selected':''}" data-skin="${skin.id}" style="--skin-bg:${skin.bg};--skin-glow:${skin.glow};--skin-main:${skin.design.skin};--skin-accent:${skin.design.outfit}">
      ${selected?'<span class="skin-selected-badge">EQUIPPED</span>':''}
      <span class="skin-preview"><span class="skin-avatar-art ${skin.design.species}"><span class="skin-head"><i></i><i></i></span><span class="skin-body"></span></span></span>
      <span class="skin-info"><span><strong>${skin.name}</strong><small>${skin.type}</small></span><i class="skin-price ${owned?'owned':''}">${selected?'USING':owned?'OWNED':`${skin.price} C`}</i></span>
    </button>`;
  }).join('');
  document.querySelectorAll('.skin-card').forEach(card=>card.addEventListener('click',()=>buyOrEquipSkin(card.dataset.skin)));
}

function buyOrEquipSkin(id) {
  const skin=skinCatalog.find(item=>item.id===id);
  if(!skin)return;
  if(!ownedSkins.includes(id)){
    if(coins<skin.price){showToast(`You need ${(skin.price-coins).toLocaleString()} more coins`,'🔒');playTone(150,.15);return}
    updateCoins(-skin.price);ownedSkins.push(id);showToast(`${skin.name} unlocked!`,'🎉');playTone(660,.1);setTimeout(()=>playTone(920,.18),120);
    try{localStorage.setItem('hideSeekOwnedSkins',JSON.stringify(ownedSkins))}catch(_){/* Continue without persistence. */}
  }
  selectedSkin=id;player.design={...skin.design};
  try{localStorage.setItem('hideSeekSelectedSkin',id)}catch(_){/* Continue without persistence. */}
  showToast(`${skin.name} equipped`,'✓');renderSkinShop();
}

function openSkinShop(){renderSkinShop();skinShop.classList.add('open');skinShop.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closeSkinShop(){skinShop.classList.remove('open');skinShop.setAttribute('aria-hidden','true');if(!gameScreen.classList.contains('open'))document.body.style.overflow=''}
document.getElementById('skinShopButton').addEventListener('click',openSkinShop);
document.getElementById('openShopResult').addEventListener('click',openSkinShop);
document.getElementById('closeSkinShop').addEventListener('click',closeSkinShop);
skinShop.addEventListener('click',event=>{if(event.target===skinShop)closeSkinShop()});
soundToggle.addEventListener('click', () => { soundOn=!soundOn;soundToggle.classList.toggle('muted',!soundOn);soundToggle.setAttribute('aria-pressed',String(!soundOn));if(soundOn)playTone(500,.08); });

// Game controls
document.getElementById('skipHiding').addEventListener('click', beginSeeking);
document.getElementById('leaveGame').addEventListener('click', leaveGame);
document.getElementById('returnLobby').addEventListener('click', leaveGame);
document.getElementById('playAgainGame').addEventListener('click', () => { resetMatchState();gameInterval=setInterval(tickGame,1000); });
pulseButton.addEventListener('click', usePulse);
document.getElementById('touchSearch').addEventListener('click', searchNearby);
const touchSprint=document.getElementById('touchSprint');
function startSprint(event){event?.preventDefault();keys.sprint=true}
function stopSprint(event){event?.preventDefault();keys.sprint=false}
[sprintButton,touchSprint].forEach(button=>{button.addEventListener('pointerdown',startSprint);button.addEventListener('pointerup',stopSprint);button.addEventListener('pointercancel',stopSprint);button.addEventListener('pointerleave',stopSprint)});
window.addEventListener('pointerup',()=>{keys.sprint=false});

document.querySelectorAll('[data-move]').forEach(button => {
  const directionMap={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
  const key=directionMap[button.dataset.move];
  const press=event=>{event.preventDefault();keys[key]=true};
  const release=event=>{event.preventDefault();keys[key]=false};
  button.addEventListener('pointerdown',press);button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('pointerleave',release);
});

document.addEventListener('keydown', event => {
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  if(gameScreen.classList.contains('open')&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d',' ','e','q'].includes(key))event.preventDefault();
  keys[key]=true;
  if(event.repeat)return;
  if(key==='Escape'&&skinShop.classList.contains('open'))closeSkinShop();
  else if(key==='Escape'&&gameScreen.classList.contains('open'))leaveGame();
  else if(key==='Escape'&&matchmaking.classList.contains('open'))closeMatchmaking();
  else if((key==='e'||key===' ')&&gameScreen.classList.contains('open'))searchNearby();
  else if(key==='q'&&gameScreen.classList.contains('open'))usePulse();
  else if(key==='Enter'&&!matchmaking.classList.contains('open')&&!gameScreen.classList.contains('open')&&document.activeElement.tagName!=='BUTTON')openMatchmaking();
});
document.addEventListener('keyup',event=>{const key=event.key.length===1?event.key.toLowerCase():event.key;keys[key]=false});
window.addEventListener('blur',()=>Object.keys(keys).forEach(key=>{keys[key]=false}));
window.addEventListener('resize',()=>{if(gameScreen.classList.contains('open'))resizeCanvas()});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});
    observer.unobserve(entry.target);
  });
},{threshold:.12});
document.querySelectorAll('.map-card,.role-card,.rules-grid article').forEach(element=>observer.observe(element));
