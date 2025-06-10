"use client";

import { useEffect, useRef } from "react";

const MatrixCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Making the canvas full screen
    const resizeCanvas = () => {
      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;
    };

    // Handle window resize
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Matrix characters
    const matrix =
      "0123456789abcdefABCDEF₿ΞΨ♦️₮Ł∞☰⧉Ω◈⬢⌘฿◊{}[]()<>_|:;,.+-*/=~!@#$%^&*0x1x2x3xf9b4b2f1c9d8a7e6c5b4a30x1234567890xdefi0xenable0xswap0xabcdef";

    const matrixChars = matrix.split("");

    const font_size = 10;
    const columns = canvas.width / font_size; // Number of columns for the rain

    // An array of drops - one per column
    const drops: number[] = [];
    for (let x = 0; x < columns; x++) {
      drops[x] = Math.floor(Math.random() * canvas.height);
    }

    const isDarkMode = document.documentElement.classList.contains("dark");
    console.log("isDarkMode", isDarkMode);
    ctx.fillStyle = isDarkMode ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Drawing the characters
    const draw = () => {
      // Black BG for the canvas with opacity to create trail effect
      const isDarkMode = document.documentElement.classList.contains("dark");

      // Theme-aware background - dark in dark mode, white in light mode
      if (isDarkMode) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.06)"; // Dark mode: black with opacity
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.06)"; // Light mode: white with opacity
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Theme-aware text color - using RainbowKit color scheme

      // Reduced opacity for characters
      ctx.globalAlpha = 0.6;
      if (isDarkMode) {
        ctx.fillStyle = "#47D8A3"; // Dark mode: same brand green as original
      } else {
        ctx.fillStyle = "#108A61"; // Light mode: darker shade of the brand green
      }
      ctx.font = font_size + "px arial";

      // Looping over drops
      for (let i = 0; i < drops.length; i++) {
        // Random character to print
        const text =
          matrixChars[Math.floor(Math.random() * matrixChars.length)];
        ctx.fillText(text, i * font_size, drops[i] * font_size);

        // Sending the drop back to the top randomly after it has crossed the screen
        if (drops[i] * font_size > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // Incrementing Y coordinate
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 55);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0"
        style={{ display: "block" }}
      />
      <div
        className="fixed inset-0 z-0 backdrop-blur-[2px]"
        style={{ backgroundColor: "transparent" }}
      ></div>
    </>
  );
};

export default MatrixCanvas;
