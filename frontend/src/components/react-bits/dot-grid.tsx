import React, { useEffect, useRef } from "react";

type Props = {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  dotColor?: string;
  proximity?: number;
  shockStrength?: number;
};

export default function DotGrid({
  dotSize = 4,
  gap = 18,
  baseColor = "#0f1720", // dark base
  dotColor = "rgba(140, 80, 200, 0.14)", // translucent purple dots
  proximity = 100,
  shockStrength = 6,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let w = 0;
    let h = 0;
    const DPR = Math.max(1, window.devicePixelRatio || 1);

    function resize() {
      w = Math.max(window.innerWidth, 300);
      h = Math.max(window.innerHeight, 300);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // create grid of points
    const points: { x: number; y: number; ox: number; oy: number; vx: number; vy: number }[] = [];
    function populate() {
      points.length = 0;
      for (let x = 0; x <= w + gap; x += gap) {
        for (let y = 0; y <= h + gap; y += gap) {
          points.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 });
        }
      }
    }
    populate();

    // draw large subtle blobs (faded circles) once per frame (they are static-ish)
    const blobs = [
      { x: w * 0.15, y: h * 0.25, r: Math.min(w, h) * 0.22, color: "rgba(120,70,180,0.06)" },
      { x: w * 0.78, y: h * 0.67, r: Math.min(w, h) * 0.28, color: "rgba(80,50,130,0.05)" },
      { x: w * 0.45, y: h * 0.8, r: Math.min(w, h) * 0.18, color: "rgba(100,40,160,0.04)" },
    ];

    function drawBlobs() {
      for (const b of blobs) {
        const grad = ctx.createRadialGradient(b.x, b.y, b.r * 0.2, b.x, b.y, b.r);
        grad.addColorStop(0, b.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // animation loop
    function loop() {
      ctx.clearRect(0, 0, w, h);

      // dark base background
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, w, h);

      // draw subtle blobs behind dots
      ctx.globalCompositeOperation = "lighter";
      drawBlobs();
      ctx.globalCompositeOperation = "source-over";

      // render dots
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        // distance to mouse
        const dx = p.x - mouse.current.x;
        const dy = p.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // interactive scale
        let size = dotSize;
        let alpha = 1;
        if (dist < proximity) {
          const t = 1 - dist / proximity;
          size = dotSize + shockStrength * t;
          alpha = 0.9;
        } else {
          alpha = 0.55;
        }

        // color
        ctx.fillStyle = dotColor;
        // slightly darken center areas
        ctx.beginPath();
        ctx.globalAlpha = alpha;
        ctx.arc(p.x, p.y, Math.max(0.6, size / 2), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // subtle overlay to tone down bright dots and add depth
      ctx.fillStyle = "rgba(5,8,12,0.06)";
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(loop);
    }

    // mouse handlers
    function onMove(e: MouseEvent) {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    }
    function onLeave() {
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    // re-populate blobs and points when resizing
    function rebuild() {
      resize();
      populate();
    }
    window.addEventListener("resize", rebuild);

    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", rebuild);
    };
  }, [dotSize, gap, baseColor, dotColor, proximity, shockStrength]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        // ensure canvas is behind UI
        pointerEvents: "none",
      }}
    />
  );
}
