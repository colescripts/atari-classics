import { useEffect, useRef } from "react";

const WIDTH = 800;
const HEIGHT = 500;

// INVADERS
const INVADER_COLS = 9;
const INVADER_ROWS = 4;

const ALIEN_WIDTH = 46;
const ALIEN_HEIGHT = 40;

const INVADER_SPACING_X = 48;
const INVADER_SPACING_Y = 36;

const START_X = (WIDTH - (INVADER_COLS - 1) * INVADER_SPACING_X) / 2;
const START_Y = 60;

// MOVEMENT
const STEP_X = 14;
const STEP_DOWN = 20;
const MOVE_INTERVAL = 700;

// SHIELDS
const SHIELD_WIDTH = 140;
const SHIELD_HEIGHT = 120;
const SHIELD_HP = 30;

const SHIELD_HITBOX_PADDING_X = 20;
const SHIELD_HITBOX_PADDING_Y = 30;

// PLAYER
const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 80;
const PLAYER_LIVES = 3;
const INVULN_TIME = 1000;

// HEART HUD
const HEART_WIDTH = 24;
const HEART_HEIGHT = 24;
const HEART_SPACING = 6;

// SCORING
const SCORE_RED = 30;
const SCORE_GREEN = 20;
const SCORE_BLUE = 10;

// GAME OVER BUTTONS
const MENU_BTN_W = 300;
const MENU_BTN_H = 74;

type Screen = "PLAYING" | "GAME_OVER";

export default function SpaceInvaders() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvasMaybe = canvasRef.current;
    if (!canvasMaybe) return;
    const canvas = canvasMaybe; // ✅ stable non-null reference for TS
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    // BUTTON RECTS (used only on GAME OVER screen)
    const menuBtn = {
      x: WIDTH / 2 - MENU_BTN_W / 2,
      y: 300,
      w: MENU_BTN_W,
      h: MENU_BTN_H,
    };

    const restartBtn = {
      x: WIDTH / 2 - MENU_BTN_W / 2,
      y: menuBtn.y + MENU_BTN_H + 16,
      w: MENU_BTN_W,
      h: MENU_BTN_H,
    };

    // IMAGES
    const bgImg = new Image();
    bgImg.src = "/src/assets/invaders_background.jpg";

    const playerImg = new Image();
    playerImg.src = "/src/assets/spaceinvader_ship.png";

    const heartImg = new Image();
    heartImg.src = "/src/assets/heart.png";

    const shieldImg = new Image();
    shieldImg.src = "/src/assets/shield.png";

    const redInvaderImgs = [new Image(), new Image()];
    redInvaderImgs[0].src = "/src/assets/handsupredalien.png";
    redInvaderImgs[1].src = "/src/assets/handsdownredalien.png";

    const greenInvaderImgs = [new Image(), new Image()];
    greenInvaderImgs[0].src = "/src/assets/handsupgreenalien.png";
    greenInvaderImgs[1].src = "/src/assets/handsdowngreenalien.png";

    const blueInvaderImgs = [new Image(), new Image()];
    blueInvaderImgs[0].src = "/src/assets/handsupbluealien.png";
    blueInvaderImgs[1].src = "/src/assets/handsdownbluealien.png";

    const invaderBulletImg = new Image();
    invaderBulletImg.src = "/src/assets/invaders_bullet.png";

    const INVADER_BULLET_WIDTH = 12;
    const INVADER_BULLET_HEIGHT = 28;


    // GAME STATE
    let score = 0;
    let highScore = Number(localStorage.getItem("si_high_score") || "0");
    let lives = PLAYER_LIVES;
    let screen: Screen = "PLAYING";
   
    let deathTime = -1;


    // Hover tracking (for GAME OVER buttons)
    let mouseX = -1;
    let mouseY = -1;

    // Invader animation/movement
    let alienAnimFrame = 0;
    let lastMoveTime = 0;
    let invaderDirection = 1;

    // Player
    let playerX = WIDTH / 2 - PLAYER_WIDTH / 2;
    const playerY = HEIGHT - 80;

    // Damage animation timing (blink + tiny jitter)
    let lastHitTime = -999999;

    // Player bullet
    let bulletX = 0;
    let bulletY = -1;
    const bulletSpeed = 4;
    let lastShot = 0;
    const fireCooldown = 300;

    // Invaders
    const invaders: { x: number; y: number; row: number; alive: boolean }[] =
      [];

    function spawnInvadersWave() {
      invaders.length = 0;
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
      // reset movement feel
      invaderDirection = 1;
      alienAnimFrame = 0;
      lastMoveTime = 0;
    }

    spawnInvadersWave();

    // Invader bullets
    const invaderBullets: { x: number; y: number; active: boolean }[] = [];
    const invaderBulletSpeed = 2;

    // Shields
    const shields: { x: number; y: number; hp: number }[] = [];
    for (let i = 0; i < 4; i++) {
      shields.push({
        x: 90 + i * 170,
        y: HEIGHT - 200,
        hp: SHIELD_HP,
      });
    }

    function resetGame() {
      score = 0;
      lives = PLAYER_LIVES;
      screen = "PLAYING";

      playerX = WIDTH / 2 - PLAYER_WIDTH / 2;
      lastHitTime = -999999;

      bulletY = -1;
      invaderBullets.length = 0;

      shields.forEach((s) => (s.hp = SHIELD_HP));
      spawnInvadersWave();

      canvas.style.cursor = "default";
    }

    // INPUT
    const keys: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ([" ", "a", "d"].includes(key)) e.preventDefault();
      keys[key] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mouseX = (e.clientX - rect.left) * scaleX;
      mouseY = (e.clientY - rect.top) * scaleY;
    };

    const onCanvasClick = (e: MouseEvent) => {
      if (screen !== "GAME_OVER") return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // HOME -> back to main menu (your existing approach)
      if (
        x >= menuBtn.x &&
        x <= menuBtn.x + menuBtn.w &&
        y >= menuBtn.y &&
        y <= menuBtn.y + menuBtn.h
      ) {
        window.location.reload();
        return;
      }

      // RESTART
      if (
        x >= restartBtn.x &&
        x <= restartBtn.x + restartBtn.w &&
        y >= restartBtn.y &&
        y <= restartBtn.y + restartBtn.h
      ) {
        resetGame();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onCanvasClick);

    function isHovering(btn: { x: number; y: number; w: number; h: number }) {
      return (
        mouseX >= btn.x &&
        mouseX <= btn.x + btn.w &&
        mouseY >= btn.y &&
        mouseY <= btn.y + btn.h
      );
    }

    function update(time: number) {
      if (screen !== "PLAYING") return;

      // Movement
      if (keys["a"] && playerX > 0) playerX -= 2;
      if (keys["d"] && playerX < WIDTH - PLAYER_WIDTH) playerX += 2;

      // Shoot
      if (keys[" "] && bulletY < 0 && Date.now() - lastShot > fireCooldown) {
        bulletX = playerX + PLAYER_WIDTH / 2 - 2;
        bulletY = playerY;
        lastShot = Date.now();
      }

      // Move player bullet
      if (bulletY >= 0) bulletY -= bulletSpeed;

      // Player bullet vs shields
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

      // Alien movement cadence
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
          invaders.forEach((i) => {
            if (i.alive) i.y += STEP_DOWN;
          });
        } else {
          invaders.forEach((i) => {
            if (i.alive) i.x += STEP_X * invaderDirection;
          });
        }
      }

      // Player bullet vs invaders
      invaders.forEach((i) => {
        if (
          i.alive &&
          bulletY >= 0 &&
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
 x: s.x + ALIEN_WIDTH / 2 - INVADER_BULLET_WIDTH / 2,
  y: s.y + ALIEN_HEIGHT,
  active: true,
});

        }
      }

      // Invader bullets movement + collisions
      invaderBullets.forEach((b) => {
        if (!b.active) return;
        b.y += invaderBulletSpeed;

        // vs shields
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

        // vs player (invuln)
        if (
  b.active &&
  Date.now() - lastHitTime > INVULN_TIME &&
  b.x > playerX &&
  b.x < playerX + PLAYER_WIDTH &&
  b.y > playerY &&
  b.y < playerY + PLAYER_HEIGHT
) {
  lives--;
  lastHitTime = Date.now();   // ✅ THIS TRIGGERS BLINK + SHAKE
  b.active = false;

  playerX = Math.max(
    0,
    Math.min(WIDTH - PLAYER_WIDTH, playerX + (Math.random() < 0.5 ? -8 : 8))
  );


          // tiny knock feeling (clamp)
          playerX = Math.max(
            0,
            Math.min(WIDTH - PLAYER_WIDTH, playerX + (Math.random() < 0.5 ? -8 : 8))
          );

          if (lives <= 0) {
            // update high score
            if (score > highScore) {
              highScore = score;
              localStorage.setItem("si_high_score", String(highScore));
            }
            screen = "GAME_OVER";
          }
        }

        if (b.y > HEIGHT) b.active = false;
      });

      // cleanup old bullets
      for (let k = invaderBullets.length - 1; k >= 0; k--) {
        if (!invaderBullets[k].active) invaderBullets.splice(k, 1);
      }

      // Auto next wave
      if (invaders.every((i) => !i.alive)) {
        // small cleanup so it feels snappy
        bulletY = -1;
        invaderBullets.length = 0;
        spawnInvadersWave();
      }
    }

    function drawPlaying() {
      ctx.drawImage(bgImg, 0, 0, WIDTH, HEIGHT);

      // shields
      shields.forEach((s) => {
        if (s.hp > 0) {
          ctx.drawImage(shieldImg, s.x, s.y, SHIELD_WIDTH, SHIELD_HEIGHT);
        }
      });

      // player (blink + tiny jitter when hit)
      const invuln = Date.now() - lastHitTime <= INVULN_TIME;
      const blinkOn = !invuln || Date.now() % 200 < 100;

      let drawPlayerX = playerX;
      if (Date.now() - lastHitTime < 180) {
        // tiny shake right after damage
        drawPlayerX = playerX + (Date.now() % 80 < 40 ? -1 : 1);
      }

      if (blinkOn) {
        ctx.drawImage(playerImg, drawPlayerX, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
      }

      // player bullet
      if (bulletY >= 0) {
        ctx.fillStyle = "white";
        ctx.fillRect(bulletX, bulletY, 4, 10);
      }

      // invader bullets (sprite)
invaderBullets.forEach((b) => {
  if (!b.active) return;

  ctx.drawImage(
    invaderBulletImg,
    b.x,
    b.y,
    INVADER_BULLET_WIDTH,
    INVADER_BULLET_HEIGHT
  );
});

      // invaders
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

      // HUD
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`Score: ${score}`, 10, 20);

      // hearts
      for (let i = 0; i < lives; i++) {
        ctx.drawImage(
          heartImg,
          10 + i * (HEART_WIDTH + HEART_SPACING),
          30,
          HEART_WIDTH,
          HEART_HEIGHT
        );
      }
    }

    function drawButton(btn: { x: number; y: number; w: number; h: number }, label: string, hovering: boolean) {
      ctx.strokeStyle = hovering ? "#66ff66" : "#44aa44";
      ctx.lineWidth = hovering ? 4 : 3;

      if (hovering) {
        ctx.fillStyle = "rgba(102,255,102,0.12)";
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
      }

      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

      ctx.fillStyle = "#66ff66";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, WIDTH / 2, btn.y + btn.h / 2);
    }

    function drawGameOver() {
      // Background only, no gameplay objects drawn
      ctx.drawImage(bgImg, 0, 0, WIDTH, HEIGHT);

      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";

      ctx.fillStyle = "#66ff66";
      ctx.font = "bold 64px Arial";
      ctx.fillText("GAME OVER", WIDTH / 2, 120);

      ctx.fillStyle = "white";
      ctx.font = "24px Arial";
      ctx.fillText(`Score: ${score}`, WIDTH / 2, 190);
      ctx.fillText(`High Score: ${highScore}`, WIDTH / 2, 225);

      const menuHover = isHovering(menuBtn);
      const restartHover = isHovering(restartBtn);

      drawButton(menuBtn, "HOME", menuHover);
      drawButton(restartBtn, "RESTART", restartHover);

      canvas.style.cursor = menuHover || restartHover ? "pointer" : "default";
    }

    function draw() {
      if (screen === "PLAYING") drawPlaying();
      else drawGameOver();
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
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onCanvasClick);
      canvas.style.cursor = "default";
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
