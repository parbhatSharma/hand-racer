import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "loading" | "ready" | "denied" | "error";

export interface HandTrackingOptions {
  deadZone: number; // 0..0.4 fraction of half-width ignored around center
  sensitivity: number; // multiplier
  smoothing: number; // 0..0.95 (higher = smoother/slower)
}

export interface HandTrackingState {
  status: CameraStatus;
  errorMessage: string | null;
  handVisible: boolean;
  /** -1 (full left) .. 1 (full right), smoothed & dead-zoned */
  steer: number;
  /** raw normalized horizontal position of palm, 0..1 (mirrored) */
  rawX: number;
}

export function useHandTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: HandTrackingOptions,
) {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [handVisible, setHandVisible] = useState(false);
  const [rawX, setRawX] = useState(0.5);

  // steer is mutated every frame; expose via ref for the game loop + state for UI
  const steerRef = useRef(0);
  const [steerUi, setSteerUi] = useState(0);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<{ detectForVideo: (v: HTMLVideoElement, t: number) => unknown; close: () => void } | null>(null);
  const lastSeenRef = useRef(0);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (status === "requesting" || status === "loading" || status === "ready") return;
    setErrorMessage(null);
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Video element unavailable");
      video.srcObject = stream;
      await video.play();

      setStatus("loading");
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
      );
      const landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });
      landmarkerRef.current = landmarker as unknown as typeof landmarkerRef.current;
      setStatus("ready");

      let lastTs = -1;
      let uiTick = 0;

      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        const v = videoRef.current;
        const lm = landmarkerRef.current;
        if (!v || !lm || v.readyState < 2) return;
        const ts = performance.now();
        if (v.currentTime === lastTs) return;
        lastTs = v.currentTime;

        let result: { landmarks?: Array<Array<{ x: number; y: number }>> } | undefined;
        try {
          result = lm.detectForVideo(v, ts) as never;
        } catch {
          return;
        }

        const hand = result?.landmarks?.[0];
        const { deadZone, sensitivity, smoothing } = optionsRef.current;

        if (hand && hand.length > 8) {
          lastSeenRef.current = ts;
          // average of wrist + middle-finger MCP for a stable palm center
          const px = (hand[0].x + hand[9].x) / 2;
          const mirrored = 1 - px; // video is mirrored for the user
          setRawX(mirrored);

          let offset = (mirrored - 0.5) * 2; // -1..1
          const sign = Math.sign(offset);
          const mag = Math.abs(offset);
          offset = mag < deadZone ? 0 : sign * ((mag - deadZone) / (1 - deadZone));
          const target = Math.max(-1, Math.min(1, offset * sensitivity));
          steerRef.current = steerRef.current * smoothing + target * (1 - smoothing);
        } else if (ts - lastSeenRef.current > 400) {
          steerRef.current *= 0.85;
        }

        const visible = ts - lastSeenRef.current < 400;
        if (uiTick++ % 4 === 0) {
          setHandVisible((prev) => (prev === visible ? prev : visible));
          setSteerUi(steerRef.current);
        }
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      const e = err as Error & { name?: string };
      stop();
      if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
        setStatus("denied");
        setErrorMessage("Camera access was blocked. Allow the camera and try again.");
      } else {
        setStatus("error");
        setErrorMessage(e?.message ?? "Could not start the camera.");
      }
    }
  }, [status, stop, videoRef]);

  useEffect(() => () => stop(), [stop]);

  return { status, errorMessage, handVisible, steer: steerUi, steerRef, rawX, start, retry: start };
}
