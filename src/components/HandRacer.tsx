import { useRef, useState } from "react";
import { useHandTracking } from "@/lib/useHandTracking";
import { HandCam } from "@/components/HandCam";
import { RaceGame } from "@/components/RaceGame";

export default function HandRacer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [deadZone, setDeadZone] = useState(0.12);
  const [sensitivity, setSensitivity] = useState(1.6);
  const [smoothing, setSmoothing] = useState(0.75);

  const { status, errorMessage, handVisible, steer, steerRef, rawX, start } = useHandTracking(
    videoRef,
    { deadZone, sensitivity, smoothing },
  );

  const statusLabel =
    status === "ready"
      ? handVisible
        ? "Hand Detected — Ready"
        : "Show your hand to start"
      : status === "requesting"
        ? "Requesting camera access…"
        : status === "loading"
          ? "Loading hand tracking…"
          : status === "denied" || status === "error"
            ? (errorMessage ?? "Camera unavailable")
            : "Camera off";

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 text-center">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-accent">
          webcam controlled
        </p>
        <h1 className="mt-2 font-display text-4xl text-foreground sm:text-5xl">Neon Hand Racer</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Move your hand left and right in front of the camera to steer. No keyboard needed.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <RaceGame steerRef={steerRef} handVisible={handVisible} canStart={status === "ready" && handVisible} />

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 font-display text-sm text-foreground">{statusLabel}</p>
            {status === "ready" ? (
              <HandCam
                videoRef={videoRef}
                handVisible={handVisible}
                rawX={rawX}
                deadZone={deadZone}
              />
            ) : (
              <>
                <video ref={videoRef} playsInline muted className="hidden" />
                <button
                  onClick={() => void start()}
                  disabled={status === "requesting" || status === "loading"}
                  className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
                >
                  {status === "denied" || status === "error" ? "Try camera again" : "Enable camera"}
                </button>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Steering</span>
                <span>{steer.toFixed(2)}</span>
              </div>
              <div className="relative h-2 rounded-full bg-muted">
                <div
                  className="absolute top-0 h-2 w-1.5 rounded-full bg-accent transition-[left] duration-75"
                  style={{ left: `calc(${(steer / 2 + 0.5) * 100}% - 3px)` }}
                />
              </div>
            </div>

            <Slider label="Sensitivity" value={sensitivity} min={0.6} max={3} step={0.1} onChange={setSensitivity} />
            <Slider label="Dead zone" value={deadZone} min={0} max={0.35} step={0.01} onChange={setDeadZone} />
            <Slider label="Smoothing" value={smoothing} min={0} max={0.92} step={0.02} onChange={setSmoothing} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-accent"
      />
    </label>
  );
}
