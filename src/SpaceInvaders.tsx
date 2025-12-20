import { useEffect, useRef } from "react";

const WIDTH = 800;
const HEIGHT = 500;

// ===== INVADER GRID =====
const INVADER_COLS = 9;
const INVADER_ROWS = 4;

const ALIEN_WIDTH = 46;
const ALIEN_HEIGHT = 40;

const INVADER_SPACING_X = 48;
const INVADER_SPACING_Y = 36;

const START_X =
  (WIDTH - (INVADER_COLS - 1) * INVADER_SPACING_X) / 2;
const START_Y = 60;

// ===== OG MOVEMENT =====
const STEP_X = 14;
const STEP_DOWN = 20;
const MOVE_INTERVAL = 700;

// ===== SHIELDS =====
const SHIELD_WIDTH = 140;
const SHIELD_HEIGHT = 120;
const SHIELD_HP = 30;

// HITBOX PADDING
const SHIELD_HITBOX_PADDING_X = 20;
const SHIELD_HITBOX_PADDING_Y = 30;

// PLAYER 
const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 80;
const PLAYER_LIVES = 3;
const INVULN_TIME = 1000;

// SCORING 
const SCORE_RED = 30;
const SCORE_GREEN = 20;
const SCORE_BLUE = 10;

export default function SpaceInvaders() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    // IMAGES 
    const bgImg = new Image();
    bgImg.src = "/src/assets/invaders_background.jpg";

    const playerImg = new Image();
    playerImg.src = "/src/assets/spaceinvader_ship.png";

    const redInvaderImgs = [new Image(), new Image()];
    redInvaderImgs[0].src = "/src/assets/handsupredalien.png";
    redInvaderImgs[1].src = "/src/assets/handsdownredalien.png";

    const greenInvaderImgs = [new Image(), new Image()];
    greenInvaderImgs[0].src = "/src/assets/handsupgreenalien.png";
    greenInvaderImgs[1].src = "/src/assets/handsdowngreenalien.png";

    const blueInvaderImgs = [new Image(), new Image()];
    blueInvaderImgs[0].src = "/src/assets/handsupbluealien.png";
    blueInvaderImgs[1].src = "/src/assets/handsdownbluealien.png";

    const shieldImg = new Image();
    shieldImg.src = "/src/assets/shield.png";

    // GAME STATE 
    let score = 0;
    let lives = PLAYER_LIVES;
    let win = false;
    let gameOver = false;

    let alienAnimFrame = 0;
    let lastMoveTime = 0;
    let invaderDirection = 1;

    // PLAYER 
    let playerX = WIDTH / 2 - PLAYER_WIDTH / 2;
    const playerY = HEIGHT - 80;
    let lastHitTime = 0;

    // PLAYER BULLET 
    let bulletX = 0;
    let bulletY = -1;
    const bulletSpeed = 6;
    let lastShot = 0;
    const fireCooldown = 300;

    // INVADERS 
    const invaders: {
      x: number;
      y: number;
      row: number;
      alive: boolean;
    }[] = [];

    for (let r = 0; r < INVADER_ROWS; r++) {
      for (let c = 0; c < INVADER_COLS; c++) {
        invaders.push({
          x: START_X + c * INVADER_SPACING_X,
          y: START_Y + r * INVADER_SPACING_Y,
          row: r,
          alive: true,
        });
      }
    }

    // INVADER BULLETS 
    const invaderBullets: { x: number; y: number; active: boolean }[] = [];
    const invaderBulletSpeed = 4;

    // SHIELDS 
    const shields: { x: number; y: number; hp: number }[] = [];
    for (let i = 0; i < 4; i++) {
      shields.push({
        x: 90 + i * 170,
        y: HEIGHT - 200,
        hp: SHIELD_HP,
      });
    }

    // INPUT 
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      if ([" ", "a", "d"].includes(e.key.toLowerCase())) e.preventDefault();
      keys[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // UPDATE
    function update(time: number) {
      if (win || gameOver) return;

      if (keys["a"] && playerX > 0) playerX -= 2;
      if (keys["d"] && playerX < WIDTH - PLAYER_WIDTH) playerX += 2;

      if (keys[" "] && bulletY < 0 && Date.now() - lastShot > fireCooldown) {
        bulletX = playerX + PLAYER_WIDTH / 2 - 2;
        bulletY = playerY;
        lastShot = Date.now();
      }

      if (bulletY >= 0) bulletY -= bulletSpeed;

      //  Player bullet vs shields 
      shields.forEach((s) => {
        if (s.hp <= 0 || bulletY < 0) return;
        if (
          bulletX > s.x + SHIELD_HITBOX_PADDING_X &&
          bulletX < s.x + SHIELD_WIDTH - SHIELD_HITBOX_PADDING_X &&
          bulletY > s.y + SHIELD_HITBOX_PADDING_Y &&
          bulletY < s.y + SHIELD_HEIGHT - SHIELD_HITBOX_PADDING_Y
        ) {
          s.hp--;
          bulletY = -1;
        }
      });

      // Alien movement
      if (time - lastMoveTime > MOVE_INTERVAL) {
        lastMoveTime = time;
        alienAnimFrame = 1 - alienAnimFrame;

        let hitWall = false;
        invaders.forEach((i) => {
          if (!i.alive) return;
          const nx = i.x + STEP_X * invaderDirection;
          if (nx <= 10 || nx >= WIDTH - ALIEN_WIDTH - 10) hitWall = true;
        });

        if (hitWall) {
          invaderDirection *= -1;
          invaders.forEach((i) => (i.y += STEP_DOWN));
        } else {
          invaders.forEach((i) => (i.x += STEP_X * invaderDirection));
        }
      }

      // Bullet vs invaders
      invaders.forEach((i) => {
        if (
          i.alive &&
          bulletX > i.x &&
          bulletX < i.x + ALIEN_WIDTH &&
          bulletY > i.y &&
          bulletY < i.y + ALIEN_HEIGHT
        ) {
          i.alive = false;
          bulletY = -1;
          score +=
            i.row === 0
              ? SCORE_RED
              : i.row <= 2
              ? SCORE_GREEN
              : SCORE_BLUE;
        }
      });

      // Invader fire
      if (Math.random() < 0.01) {
        const shooters = invaders.filter((i) => i.alive);
        if (shooters.length) {
          const s = shooters[Math.floor(Math.random() * shooters.length)];
          invaderBullets.push({
            x: s.x + ALIEN_WIDTH / 2,
            y: s.y + ALIEN_HEIGHT,
            active: true,
          });
        }
      }

      // Invader bullets
      invaderBullets.forEach((b) => {
        if (!b.active) return;
        b.y += invaderBulletSpeed;

        // Invader bullet vs shields 
        shields.forEach((s) => {
          if (s.hp <= 0 || !b.active) return;
          if (
            b.x > s.x + SHIELD_HITBOX_PADDING_X &&
            b.x < s.x + SHIELD_WIDTH - SHIELD_HITBOX_PADDING_X &&
            b.y > s.y + SHIELD_HITBOX_PADDING_Y &&
            b.y < s.y + SHIELD_HEIGHT - SHIELD_HITBOX_PADDING_Y
          ) {
            s.hp--;
            b.active = false;
          }
        });

        if (
          Date.now() - lastHitTime > INVULN_TIME &&
          b.x > playerX &&
          b.x < playerX + PLAYER_WIDTH &&
          b.y > playerY &&
          b.y < playerY + PLAYER_HEIGHT
        ) {
          lives--;
          lastHitTime = Date.now();
          b.active = false;
          if (lives <= 0) gameOver = true;
        }

        if (b.y > HEIGHT) b.active = false;
      });

      if (invaders.every((i) => !i.alive)) win = true;
    }

    // DRAW 
    function draw() {
      ctx.drawImage(bgImg, 0, 0, WIDTH, HEIGHT);

      shields.forEach((s) => {
        if (s.hp > 0)
          ctx.drawImage(shieldImg, s.x, s.y, SHIELD_WIDTH, SHIELD_HEIGHT);
      });

      if (Date.now() - lastHitTime > INVULN_TIME || Date.now() % 200 < 100) {
        ctx.drawImage(playerImg, playerX, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
      }

      if (bulletY >= 0) {
        ctx.fillStyle = "white";
        ctx.fillRect(bulletX, bulletY, 4, 10);
      }

      invaderBullets.forEach((b) => {
        if (b.active) ctx.fillRect(b.x, b.y, 4, 10);
      });

      invaders.forEach((i) => {
        if (!i.alive) return;
        const sprite =
          i.row === 0
            ? redInvaderImgs[alienAnimFrame]
            : i.row <= 2
            ? greenInvaderImgs[alienAnimFrame]
            : blueInvaderImgs[alienAnimFrame];
        ctx.drawImage(sprite, i.x, i.y, ALIEN_WIDTH, ALIEN_HEIGHT);
      });

      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.fillText(`Score: ${score}`, 10, 20);
      ctx.fillText(`Lives: ${lives}`, 10, 40);

      if (win || gameOver) {
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.fillText(win ? "YOU WIN" : "GAME OVER", WIDTH / 2, HEIGHT / 2);
      }
    }

    function loop(t: number) {
      update(t);
      draw();
      requestAnimationFrame(loop);
    }
    loop(0);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      style={{ display: "block", margin: "2rem auto", border: "2px solid white" }}
    />
  );
}
