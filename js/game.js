const KEY_CODE_UP = 38; // конст для стрелки вверх
const KEY_CODE_DOWN = 40; // конст для стрелки вниз
const KEY_CODE_LEFT = 37; // конст для стрелки влево
const KEY_CODE_RIGHT = 39; // конст для стрелки вправо
const KEY_CODE_SPACE = 32; // конст для пробела

const GAME_WIDTH = 800; // ширина игры
const GAME_HEIGHT = 600; // высота игры

const PLAYER_WIDTH = 20; // ширина игрока
const PLAYER_HEIGHT = 5; // высота игрока
const PLAYER_MAX_SPEED = 600.0; // максимальная скорость игрока
const LASER_MAX_SPEED = 300.0; // максимальная скорость лазера
const LASER_COOLDOWN = 0.5; // задержка перед выстрелом

const ENEMIES_PER_ROW = 10; // 10 врагов в ряду
const ENEMY_HORIZONTAL_PADDING = 80; //отступы
const ENEMY_VERTICAL_PADDING = 70; // отступы
const ENEMY_VERTICAL_SPACING = 80; // отступы

const GAME_STATE = {
  lastTime: Date.now(),
  upPressed: false,
  downPressed: false,
  leftPressed: false,
  rightPressed: false,
  spacePressed: false,
  playerX: 0,
  playerY: 0,
  playerCooldown: 0,
  lasers: [],
  enemies: [],
};
function rectsIntersect(r1, r2) { 
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function setPosition($el, x, y) {
  $el.style.transform = `translate(${x}px, ${y}px)`;
}

function clamp(v, min, max) { // фиксирование попаданий по врагу
  if (v < min) {
    return min;
  } else if (v > max) {
    return max;
  } else {
    return v;
  }
}

function createPlayer($container, x, y) { // создание корабля
  GAME_STATE.playerX = GAME_WIDTH / 2; // расположение по x
  GAME_STATE.playerY = GAME_HEIGHT - 50; // расположение по y
  const $player = document.createElement("img"); 
  $player.src = "img/player-red-1.png";
  $player.className = "player";
  $container.appendChild($player);
  setPosition($player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function updatePlayer(dt, $container) { // создаем движение корабля
  if (GAME_STATE.upPressed) {
    GAME_STATE.playerY -= dt * PLAYER_MAX_SPEED; // движение вверх
  }
  if (GAME_STATE.downPressed) {
    GAME_STATE.playerY += dt * PLAYER_MAX_SPEED; // движение вниз
  }
  if (GAME_STATE.leftPressed) {
    GAME_STATE.playerX -= dt * PLAYER_MAX_SPEED; // движение влево
  }
  if (GAME_STATE.rightPressed) {
    GAME_STATE.playerX += dt * PLAYER_MAX_SPEED; // движение вправо
  }

  GAME_STATE.playerX = clamp( // // Граница перемещения по X
    GAME_STATE.playerX,
    PLAYER_WIDTH,
    GAME_WIDTH - PLAYER_WIDTH,
  );

  GAME_STATE.playerY = clamp( // Граница перемещения по Y
    GAME_STATE.playerY,
    PLAYER_HEIGHT,
    GAME_HEIGHT - PLAYER_WIDTH,
  );

  if (GAME_STATE.spacePressed && GAME_STATE.playerCooldown <= 0) { // условие для выстрела
    createLaser($container, GAME_STATE.playerX, GAME_STATE.playerY);
    GAME_STATE.playerCooldown = LASER_COOLDOWN;
  }
  if (GAME_STATE.playerCooldown > 0){ 
    GAME_STATE.playerCooldown -= dt;
  }

  const $player = document.querySelector(".player"); 
  setPosition($player, GAME_STATE.playerX, GAME_STATE.playerY);
}


function createLaser($container, x, y) { // создаем обьект лазер
  const $element = document.createElement('img');
  $element.src = 'img/laser-red-1.png';
  $element.className = 'laser';
  $container.appendChild($element);
  const laser = { x, y, $element};
  GAME_STATE.lasers.push(laser);
  setPosition($element, x, y);
  const audio = new Audio('sound/sfx-laser1.ogg'); // звук выстрела
  audio.play();
}
function init() {
  const $container = document.querySelector(".game");
  createPlayer($container);
  const enemySpacing = (GAME_WIDTH - ENEMY_HORIZONTAL_PADDING * 2) / (ENEMIES_PER_ROW - 1); // создаем врагов в виде рядов
  for (let j = 0; j < 1; j++){
    const y = ENEMY_VERTICAL_PADDING + j * ENEMY_VERTICAL_SPACING;
    for (let i = 0; i < ENEMIES_PER_ROW; i++){
      const x = i * enemySpacing + ENEMY_HORIZONTAL_PADDING;
      createEnemy($container, x, y); 
    }
  }
}

function updateLasers(dt, $container) { // update для лазера
  const lasers = GAME_STATE.lasers;
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    laser.y -= dt * LASER_MAX_SPEED;
    if (laser.y < 0) {
      destroyLaser($container, laser);
    }
    setPosition(laser.$element, laser.x, laser.y);
    const r1 = laser.$element.getBoundingClientRect();
    const enemies = GAME_STATE.enemies;
    for (let j = 0; j < enemies.length; j++) { // создаем прикосновение лазера с обьектом
      const enemy = enemies[j];
      if (enemy.isDead) continue;
      const r2 = enemy.$element.getBoundingClientRect();
      if (rectsIntersect(r1, r2)) {
        // Enemy was hit
        destroyEnemy($container, enemy);
        destroyLaser($container, laser);
        break;
      }
    }
  }
  GAME_STATE.lasers = GAME_STATE.lasers.filter(e => !e.isDead);
}


function destroyLaser($container, laser){ // лазер исчезает после попадания
  $container.removeChild(laser.$element);
  laser.isDead = true;
}

function createEnemy($container, x, y){ // создаем врагов
  const $element = document.createElement('img');
  $element.src = 'img/asteroid.png';
  $element.className = 'enemy';
  $container.appendChild($element);
  const enemy = {
    x,
    y,
    $element
  };
  GAME_STATE.enemies.push(enemy);
  setPosition($element, x, y);
}

function updateEnemies(dt, $container) { // создаём движения для врагов
  const dx = Math.sin(GAME_STATE.lastTime / 1000.0) * 50;
  const dy = Math.cos(GAME_STATE.lastTime / 1000.0) * 30;

  const enemies = GAME_STATE.enemies;
  for (let i = 0; i < enemies.length; i++){
    const enemy = enemies[i];
    const x = enemy.x + dy ;
    const y = enemy.y + dx;
    setPosition(enemy.$element,x,y);
  }
  GAME_STATE.enemies = GAME_STATE.enemies.filter(e => !e.isDead); // удаляем мертвых врагов
}

function destroyEnemy($container, enemy) { // враг исчезает после попадания
  $container.removeChild(enemy.$element);
  enemy.isDead = true;
}

function update(e) {
  const currentTime = Date.now();
  const dt = (currentTime - GAME_STATE.lastTime) / 1000.0;

  if (playerHasWon()) {
    document.querySelector(".congratulations").style.display = "block"; // при выигрыше выскакивает окно с поздравлениями
    return;
  }  

  const $container = document.querySelector('.game');
  updatePlayer(dt, $container);
  updateLasers(dt, $container);
  updateEnemies(dt, $container)


  GAME_STATE.lastTime = currentTime;
  window.requestAnimationFrame(update);
}

function onKeyDown(e) { // при зажатии клавиш корабль движется
  if (e.keyCode === KEY_CODE_LEFT) {
    GAME_STATE.leftPressed = true;
  } else if (e.keyCode === KEY_CODE_UP) {
    GAME_STATE.upPressed = true;
  } else if (e.keyCode === KEY_CODE_DOWN) {
    GAME_STATE.downPressed = true;
  } else if (e.keyCode === KEY_CODE_RIGHT) {
    GAME_STATE.rightPressed = true;
  } else if (e.keyCode === KEY_CODE_SPACE) {
    GAME_STATE.spacePressed = true;
  }
}

function onKeyUp(e) { // при отпускании клавиш корабль останавливается
  if (e.keyCode === KEY_CODE_LEFT) {
    GAME_STATE.leftPressed = false;
  } else if (e.keyCode === KEY_CODE_UP) {
    GAME_STATE.upPressed = false;
  } else if (e.keyCode === KEY_CODE_DOWN) {
    GAME_STATE.downPressed = false;
  } else if (e.keyCode === KEY_CODE_RIGHT) {
    GAME_STATE.rightPressed = false;
  } else if (e.keyCode === KEY_CODE_SPACE) {
    GAME_STATE.spacePressed = false;
  }
}

function playerHasWon() { // игра закончится как число врагов станет 0
  return GAME_STATE.enemies.length === 0;
}
init();
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.requestAnimationFrame(update);
