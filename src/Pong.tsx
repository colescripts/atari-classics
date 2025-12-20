import { useEffect, useRef } from "react";

const WIDTH = 800;
const HEIGHT = 500;

export default function Pong() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

   const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    // Game state
    let playerY = HEIGHT / 2 - 40;
    let aiY = HEIGHT / 2 - 40;
    const paddleHeight = 80;

    let ballX = WIDTH / 2;
    let ballY = HEIGHT / 2;
    let ballDX = 4;
    let ballDY = 4;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    function update() {
      // Player controls
      if (keys["w"] && playerY > 0) playerY -= 6;
      if (keys["s"] && playerY < HEIGHT - paddleHeight)
        playerY += 6;

      // AI movement
      if (ballY > aiY + paddleHeight / 2) aiY += 4;
      if (ballY < aiY + paddleHeight / 2) aiY -= 4;

      // Ball movement
      ballX += ballDX;
      ballY += ballDY;

      // Wall collision
      if (ballY <= 0 || ballY >= HEIGHT) ballDY *= -1;

      // Paddle collision (player)
      if (
        ballX <= 20 &&
        ballY >= playerY &&
        ballY <= playerY + paddleHeight
      ) {
        ballDX *= -1;
      }

      // Paddle collision (AI)
      if (
        ballX >= WIDTH - 20 &&
        ballY >= aiY &&
        ballY <= aiY + paddleHeight
      ) {
        ballDX *= -1;
      }
    }

    function draw() {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = "white";

      // Player paddle
      ctx.fillRect(10, playerY, 10, paddleHeight);

      // AI paddle
      ctx.fillRect(WIDTH - 20, aiY, 10, paddleHeight);

      // Ball
      ctx.beginPath();
      ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
      ctx.fill();
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
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
        borderRadius: "8px",
        border: "2px solid white",
      }}
    />
  );
}
