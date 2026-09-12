import type { ReactNode, RefObject } from "react";

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  handVisible: boolean;
  rawX: number;
  deadZone: number;
  active: boolean;
  children?: ReactNode;
}

export function HandCam({ videoRef, handVisible, rawX, deadZone, active, children }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-glow">
      {/* This video element must never unmount: the camera stream is attached to it. */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="block aspect-[4/3] w-full scale-x-[-1] object-cover opacity-90"
      />
      {active && (
        <>
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-y-0 bg-primary/10"
              style={{ left: `${50 - deadZone * 50}%`, right: `${50 - deadZone * 50}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-accent transition-[left] duration-75"
              style={{ left: `${rawX * 100}%`, opacity: handVisible ? 1 : 0.2 }}
            />
          </div>
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur">
            <span className={`size-2 rounded-full ${handVisible ? "bg-accent" : "bg-destructive"}`} />
            {handVisible ? "Hand detected" : "Hand not detected"}
          </div>
        </>
      )}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          {children}
        </div>
      )}
    </div>
  );
}
