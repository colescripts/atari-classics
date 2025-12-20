import { useEffect, useRef } from "react";

const WIDTH = 800;
const HEIGHT = 500;

export default function SpaceInvaders() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;

    // ===== LOAD IMAGES =====
    const bgImg = new Image();
    bgImg.src = "/src/assets/invaders_background.jpg";

    const playerImg = new Image();
    playerImg.src = "/src/assets/spaceinvader_ship.png";

    const redInvaderImg = new Image();
    redInvaderImg.src = "/src/assets/redalien.png";

    const greenInvaderImg = new Image();
    greenInvaderImg.src = "/src/assets/greenalien.png";

    const blueInvaderImg = new Image();
    blueInvaderImg.src = "/src/assets/bluealien.png";

    // ===== GAME STATE =====
    let win = false;

    // ===== PLAYER =====
    let playerX = WIDTH / 2 - 20;
    const playerY = HEIGHT - 50;
    const playerSpeed = 2;

    // ===== PLAYER BULLET =====
    let bulletX = 0;
    let bulletY = -1;
    const bulletSpeed = 6;
    const fireCooldown = 300;
    let lastShot = 0;

    // ===== INVADERS =====
    const INVADER_COLS = 11;
    const INVADER_ROWS = 5;
    const INVADER_SPACING_X = 60;
    const INVADER_SPACING_Y = 45;

    const invaders: {
      x: number;
      y: number;
      row: number;
      alive: boolean;
    }[] = [];

    for (let row = 0; row < INVADER_ROWS; row++) {
      for (let col = 0; col < INVADER_COLS; col++) {
        invaders.push({
          x: 80 + col * INVADER_SPACING_X,
          y: 60 + row * INVADER_SPACING_Y,
          row,
          alive: true,
        });
      }
    }

    let invaderDirection = 1;
    const invaderSpeed = 0.5;

    // ===== INVADER BULLETS =====
    const invaderBullets: {
      x: number;
      y: number;
      active: boolean;
    }[] = [];

    const invaderBulletSpeed = 4;

    // ===== SHIELDS =====
    type Shield = {
      x: number;
      y: number;
      hp: number;
    };

    const shields: Shield[] = [];
    const SHIELD_COUNT = 4;
    const SHIELD_HP = 30;

    for (let i = 0; i < SHIELD_COUNT; i++) {
      shields.push({
        x: 120 + i * 160,
        y: HEIGHT - 140,
        hp: SHIELD_HP,
      });
    }

    // ===== INPUT =====
    const keys: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      if ([" ", "a", "d"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      keys[e.key.toLowerCase()] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ===== UPDATE =====
    function update() {
      if (win) return;

      if (keys["a"] && playerX > 0) playerX -= playerSpeed;
      if (keys["d"] && playerX < WIDTH - 40) playerX += playerSpeed;

      if (keys[" "] && bulletY < 0 && Date.now() - lastShot > fireCooldown) {
        bulletX = playerX + 18;
        bulletY = playerY;
        lastShot = Date.now();
      }

      if (bulletY >= 0) bulletY -= bulletSpeed;

      shields.forEach((shield) => {
        if (shield.hp <= 0 || bulletY < 0) return;

        if (
          bulletX > shield.x &&
          bulletX < shield.x + 60 &&
          bulletY > shield.y &&
          bulletY < shield.y + 40
        ) {
          shield.hp -= 1;
          bulletY = -1;
        }
      });

      let hitEdge = false;
      invaders.forEach((invader) => {
        if (!invader.alive) return;

        invader.x += invaderSpeed * invaderDirection;
        if (invader.x <= 10 || invader.x >= WIDTH - 42) hitEdge = true;
      });
      if (hitEdge) invaderDirection *= -1;

      invaders.forEach((invader) => {
        if (
          invader.alive &&
          bulletX > invader.x &&
          bulletX < invader.x + 32 &&
          bulletY > invader.y &&
          bulletY < invader.y + 24
        ) {
          invader.alive = false;
          bulletY = -1;
        }
      });

      if (Math.random() < 0.01) {
        const shooters = invaders.filter((i) => i.alive);
        if (shooters.length > 0) {
          const shooter =
            shooters[Math.floor(Math.random() * shooters.length)];

          invaderBullets.push({
            x: shooter.x + 16,
            y: shooter.y + 24,
            active: true,
          });
        }
      }

      invaderBullets.forEach((b) => {
        if (!b.active) return;

        b.y += invaderBulletSpeed;

        shields.forEach((shield) => {
          if (shield.hp <= 0) return;

          if (
            b.x > shield.x &&
            b.x < shield.x + 60 &&
            b.y > shield.y &&
            b.y < shield.y + 40
          ) {
            shield.hp -= 1;
            b.active = false;
          }
        });

        if (b.y > HEIGHT) b.active = false;
      });

      for (let i = invaderBullets.length - 1; i >= 0; i--) {
        if (!invaderBullets[i].active) invaderBullets.splice(i, 1);
      }

      if (invaders.every((i) => !i.alive)) win = true;
    }

    // ===== DRAW =====
    function draw() {
      // 🌌 BACKGROUND (SAFE)
      if (bgImg.complete) {
        ctx.drawImage(bgImg, 0, 0, WIDTH, HEIGHT);
      } else {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      // Shields
      shields.forEach((shield) => {
        if (shield.hp <= 0) return;

        let color = "#88f";
        if (shield.hp < 20) color = "#66c";
        if (shield.hp < 10) color = "#446";

        ctx.fillStyle = color;
        ctx.fillRect(shield.x, shield.y, 60, 40);
      });

      ctx.drawImage(playerImg, playerX, playerY, 40, 40);

      if (bulletY >= 0) {
        ctx.fillStyle = "white";
        ctx.fillRect(bulletX, bulletY, 4, 10);
      }

      ctx.fillStyle = "yellow";
      invaderBullets.forEach((b) => {
        if (b.active) ctx.fillRect(b.x, b.y, 4, 10);
      });

      invaders.forEach((invader) => {
        if (!invader.alive) return;

        const sprite =
          invader.row === 0
            ? redInvaderImg
            : invader.row <= 2
            ? greenInvaderImg
            : blueInvaderImg;

        ctx.drawImage(sprite, invader.x, invader.y, 32, 24);
      });

      if (win) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "lime";
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.fillText("YOU WIN", WIDTH / 2, HEIGHT / 2);
      }
    }

    let animationId: number;
    function loop() {
      update();
      draw();
      animationId = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      style={{
        display: "block",
        margin: "2rem auto",
        border: "2px solid white",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    />
  );
}
