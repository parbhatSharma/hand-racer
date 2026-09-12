import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "running" | "paused" | "over";

interface Props {
  steerRef: { current: number };
  handVisible: boolean;
  canStart: boolean;
}

interface Obstacle {
  lane: number;
  y: number;
  w: number;
  h: number;
  hue: number;
}

const W = 420;
const H = 640;
const ROAD_MARGIN = 46;
const LANES = 3;

export function RaceGame({ steerRef, handVisible, canStart }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;
  const handRef = useRef(handVisible);
  handRef.current = handVisible;

  const stateRef = useRef({
    carX: W / 2,
    scroll: 0,
    speed: 260,
    obstacles: [] as Obstacle[],
    spawnTimer: 0,
    score: 0,
  });

  // auto-pause / resume on hand visibility
  useEffect(() => {
    if (!handVisible && phase === "running") setPhase("paused");
    if (handVisible && phase === "paused") setPhase("running");
  }, [handVisible, phase]);

  const reset = () => {
    stateRef.current = {
      carX: W / 2,
      scroll: 0,
      speed: 260,
      obstacles: [],
      spawnTimer: 0.4,
      score: 0,
    };
    setScore(0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    let last = performance.now();
    const laneX = (i: number) =>
      ROAD_MARGIN + ((W - ROAD_MARGIN * 2) / LANES) * (i + 0.5);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = stateRef.current;
      const running = phaseRef.current === "running";

      if (running) {
        s.speed = Math.min(680, s.speed + dt * 14);
        s.scroll = (s.scroll + s.speed * dt) % 80;
        s.carX += steerRef.current * 340 * dt;
        s.carX = Math.max(ROAD_MARGIN + 24, Math.min(W - ROAD_MARGIN - 24, s.carX));

        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0) {
          s.spawnTimer = Math.max(0.42, 1.05 - s.speed / 1100);
          const lane = Math.floor(Math.random() * LANES);
          s.obstacles.push({ lane, y: -90, w: 52, h: 84, hue: Math.random() * 60 + 340 });
        }

        for (const o of s.obstacles) o.y += s.speed * dt;
        s.obstacles = s.obstacles.filter((o) => {
          if (o.y > H + 100) {
            s.score += 1;
            return false;
          }
          return true;
        });
        setScore(s.score);

        const carY = H - 110;
        for (const o of s.obstacles) {
          const ox = laneX(o.lane);
          if (
            Math.abs(ox - s.carX) < (o.w + 44) / 2 &&
            Math.abs(o.y + o.h / 2 - (carY + 40)) < (o.h + 80) / 2
          ) {
            setPhase("over");
            setBest((b) => Math.max(b, s.score));
            break;
          }
        }
      }

      // ---- draw ----
      ctx.fillStyle = "#0a0f1c";
      ctx.fillRect(0, 0, W, H);

      // grass glow
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "#0f1b33");
      g.addColorStop(0.5, "#14213d");
      g.addColorStop(1, "#0f1b33");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // road
      ctx.fillStyle = "#1b2338";
      ctx.fillRect(ROAD_MARGIN, 0, W - ROAD_MARGIN * 2, H);
      ctx.strokeStyle = "rgba(120,220,255,0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ROAD_MARGIN, 0);
      ctx.lineTo(ROAD_MARGIN, H);
      ctx.moveTo(W - ROAD_MARGIN, 0);
      ctx.lineTo(W - ROAD_MARGIN, H);
      ctx.stroke();

      // dashes
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 4;
      for (let l = 1; l < LANES; l++) {
        const x = ROAD_MARGIN + ((W - ROAD_MARGIN * 2) / LANES) * l;
        for (let y = -80 + stateRef.current.scroll; y < H; y += 80) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 42);
          ctx.stroke();
        }
      }

      // obstacles
      for (const o of stateRef.current.obstacles) {
        const x = laneX(o.lane) - o.w / 2;
        ctx.save();
        ctx.shadowColor = `hsl(${o.hue} 90% 60%)`;
        ctx.shadowBlur = 18;
        ctx.fillStyle = `hsl(${o.hue} 80% 55%)`;
        roundRect(ctx, x, o.y, o.w, o.h, 10);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        roundRect(ctx, x + 8, o.y + 12, o.w - 16, 22, 6);
        ctx.fill();
      }

      // player car
      const cx = stateRef.current.carX;
      const cy = H - 110;
      ctx.save();
      ctx.translate(cx, cy + 40);
      ctx.rotate(Math.max(-0.25, Math.min(0.25, steerRef.current * 0.22)));
      ctx.shadowColor = "#5ce1ff";
      ctx.shadowBlur = 26;
      ctx.fillStyle = "#5ce1ff";
      roundRect(ctx, -22, -42, 44, 84, 12);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(10,15,28,0.75)";
      roundRect(ctx, -14, -26, 28, 24, 6);
      ctx.fill();
      ctx.fillStyle = "rgba(10,15,28,0.5)";
      roundRect(ctx, -14, 8, 28, 18, 6);
      ctx.fill();
      ctx.restore();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [steerRef]);

  const overlay = (() => {
    if (phase === "idle")
      return canStart
        ? { title: "Hand Detected — Ready", sub: "Move your hand left and right to steer.", cta: "Start race" }
        : { title: "Show your hand to start", sub: "Hold your open palm in front of the camera.", cta: null };
    if (phase === "paused") return { title: "Hand not detected", sub: "Game paused — show your hand again.", cta: null };
    if (phase === "over")
      return { title: "Crashed!", sub: `Score ${score} · Best ${best}`, cta: canStart ? "Restart" : null };
    return null;
  })();

  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H }}
        className="block w-full rounded-2xl border border-border shadow-glow"
      />
      <div className="absolute left-4 top-4 rounded-xl bg-background/70 px-3 py-1.5 font-display text-lg backdrop-blur">
        {score}
      </div>
      <div className="absolute right-4 top-4 rounded-xl bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
        Best {best}
      </div>

      {overlay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-background/80 px-6 text-center backdrop-blur-sm">
          <h2 className="font-display text-2xl text-foreground">{overlay.title}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">{overlay.sub}</p>
          {overlay.cta && (
            <button
              onClick={() => {
                reset();
                setPhase("running");
              }}
              className="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              {overlay.cta}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
