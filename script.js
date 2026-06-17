  // ---- 1. GAME CONFIGURATION ----
  const GRID_SIZE = 20;  // Board 20x20 ka hai
  const SPEED = 140;     // Har move ke beech ka milliseconds (chhota = fast)

  // ---- 2. DOM ELEMENTS LENA ----
  // HTML se elements le rahe hain taaki unhe JS me control kar sakein
  const boardEl = document.getElementById('board');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');
  const timeEl = document.getElementById('time');
  const startModal = document.getElementById('startModal');
  const gameOverModal = document.getElementById('gameOverModal');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const finalScoreEl = document.getElementById('finalScore');
  const finalHighEl = document.getElementById('finalHigh');
  const finalTimeEl = document.getElementById('finalTime');

  // ---- 3. GRID BANANA (20x20 = 400 cells) ----
  // Hum 400 chhote divs banayenge jo board me dikhenge
  const cells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      boardEl.appendChild(cell);
      cells.push(cell);
    }
  }

  // Helper function: (x, y) coordinate se us cell ka index nikalna
  function getIndex(x, y) {
    return y * GRID_SIZE + x;
  }

  // ---- 4. GAME STATE VARIABLES ----
  // Ye variables game ki current situation store karte hain
  let snake = [];                // Snake ke body parts ke coordinates
  let direction = { x: 1, y: 0 }; // Current moving direction (right)
  let nextDirection = { x: 1, y: 0 }; // Next move direction
  let food = { x: 15, y: 10 };   // Food ka position
  let score = 0;
  let highScore = parseInt(localStorage.getItem('snakeHigh') || '0');
  let startTime = 0;
  let elapsedTime = 0;
  let gameInterval = null;       // Game loop ka reference
  let timerInterval = null;      // Timer ka reference
  let isPlaying = false;

  // High score display karna
  highScoreEl.textContent = highScore;

  // ---- 5. RENDER FUNCTION ----
  // Ye function board ko visually update karta hai
  function render() {
    // Sabse pehle sab cells ko clear karo
    cells.forEach(cell => {
      cell.className = 'cell';
      cell.style.opacity = '';
    });

    // Snake ke har segment ko draw karo
    snake.forEach((segment, i) => {
      const idx = getIndex(segment.x, segment.y);
      const cell = cells[idx];
      if (cell) {
        if (i === 0) {
          // Head
          cell.classList.add('snake-head');
        } else {
          // Body — tail ki taraf fade effect
          cell.classList.add('snake-body');
          const opacity = Math.max(0.4, 1 - (i / snake.length) * 0.6);
          cell.style.opacity = opacity;
        }
      }
    });

    // Food draw karo
    const foodIdx = getIndex(food.x, food.y);
    if (cells[foodIdx]) {
      cells[foodIdx].classList.add('food');
    }
  }

  // ---- 6. FOOD PLACE KARNA ----
  // Random position pe food rakho, but snake ke body par nahi
  function placeFood() {
    let valid = false;
    while (!valid) {
      food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // Check karo food snake ke body par to nahi hai
      valid = !snake.some(s => s.x === food.x && s.y === food.y);
    }
  }

  // ---- 7. MOVE FUNCTION (Game ka dil) ----
  // Ye function har tick pe snake ko aage move karta hai
  function move() {
    direction = nextDirection;

    // Naya head position calculate karo
    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };

    // CHECK 1: Diwaar se takraya? (out of bounds)
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      gameOver();
      return;
    }

    // CHECK 2: Khud ke body se takraya?
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }

    // Naya head add karo
    snake.unshift(head);

    // CHECK 3: Food kha gaya?
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = score;
      placeFood();
      // Tail remove nahi karenge — snake lamba hoga
    } else {
      // Food nahi khaya — tail hatao (snake same length rahega)
      snake.pop();
    }

    render();
  }

  // ---- 8. TIMER UPDATE ----
  function updateTimer() {
    elapsedTime = Date.now() - startTime;
    timeEl.textContent = formatTime(elapsedTime);
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  // ---- 9. GAME START KARNA ----
  function startGame() {
    // Snake ko initial position par set karo (beech me)
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreEl.textContent = '0';
    timeEl.textContent = '00:00';
    startTime = Date.now();
    placeFood();
    render();
    isPlaying = true;

    // Game loop — har SPEED ms ke baad move() call hoga
    gameInterval = setInterval(move, SPEED);
    timerInterval = setInterval(updateTimer, 100);
  }

  // ---- 10. GAME OVER ----
  function gameOver() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    isPlaying = false;

    // High score update karo agar score zyada hai
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('snakeHigh', highScore);
      highScoreEl.textContent = highScore;
    }

    // Game over modal me values dalo
    finalScoreEl.textContent = score;
    finalHighEl.textContent = highScore;
    finalTimeEl.textContent = formatTime(elapsedTime);

    // Modal dikhao
    gameOverModal.classList.add('active');
  }

  // ---- 11. KEYBOARD CONTROLS ----
  // Arrow keys dabane par direction change karo
  document.addEventListener('keydown', (e) => {
    if (!isPlaying) return;

    // Important: Snake ulta direction me nahi ja sakta
    // (e.g. right jaate hue left nahi ja sakta)
    switch (e.key) {
      case 'ArrowUp':
        if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
        if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
        if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
        if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
        break;
    }
  });

  // ---- 12. TOUCH / SWIPE CONTROLS (mobile ke liye) ----
  let touchStartX = 0, touchStartY = 0;
  boardEl.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  boardEl.addEventListener('touchend', (e) => {
    if (!isPlaying) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    // Swipe direction decide karo
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0 && direction.x !== -1) nextDirection = { x: 1, y: 0 };
      else if (dx < 0 && direction.x !== 1) nextDirection = { x: -1, y: 0 };
    } else {
      // Vertical swipe
      if (dy > 0 && direction.y !== -1) nextDirection = { x: 0, y: 1 };
      else if (dy < 0 && direction.y !== 1) nextDirection = { x: 0, y: -1 };
    }
  }, { passive: true });

  // ---- 13. BUTTON LISTENERS ----
  startBtn.addEventListener('click', () => {
    startModal.classList.remove('active');
    startGame();
  });

  restartBtn.addEventListener('click', () => {
    gameOverModal.classList.remove('active');
    startGame();
  });
