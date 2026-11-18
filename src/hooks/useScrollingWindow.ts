import { useEffect, useRef, useState } from 'react';

/**
 * Render slightly in the past so the newest line segment is already drawn
 * by the time it scrolls into view. Should be >= the device sample interval.
 */
const DISPLAY_DELAY_SECONDS = 0.25;
/** Stop scrolling if no new sample arrives for this long (stream stalled). */
const MAX_EXTRAPOLATION_SECONDS = 0.5;
/** How quickly the estimated device clock follows new samples (0..1). */
const CLOCK_SMOOTHING = 0.1;
/** Larger clock jumps (device reboot, new session) snap instead of easing. */
const CLOCK_RESYNC_THRESHOLD_SECONDS = 1;

const wallSeconds = () => performance.now() / 1000;

/**
 * Returns an x-axis domain that scrolls every animation frame instead of
 * jumping once per sample. The device clock is estimated between samples
 * from a smoothed offset to the browser clock.
 */
export const useScrollingWindow = (
  latestTime: number | undefined,
  windowSeconds: number,
  isRunning: boolean
): [number, number] => {
  const [domain, setDomain] = useState<[number, number]>([0, windowSeconds]);

  const clockOffsetRef = useRef<number | null>(null); // device - wall (s)
  const latestTimeRef = useRef<number | null>(null);
  const windowEndRef = useRef(windowSeconds);

  useEffect(() => {
    if (latestTime === undefined) return;

    const target = latestTime - wallSeconds();
    const offset = clockOffsetRef.current;

    if (
      offset === null ||
      Math.abs(target - offset) > CLOCK_RESYNC_THRESHOLD_SECONDS
    ) {
      clockOffsetRef.current = target;
      // Allow the window to jump backwards after a resync.
      windowEndRef.current = windowSeconds;
    } else {
      clockOffsetRef.current = offset + (target - offset) * CLOCK_SMOOTHING;
    }
    latestTimeRef.current = latestTime;
  }, [latestTime, windowSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    let frameId: number;

    const tick = () => {
      const offset = clockOffsetRef.current;
      const latest = latestTimeRef.current;

      if (offset !== null && latest !== null) {
        const estimatedNow = Math.min(
          wallSeconds() + offset,
          latest + MAX_EXTRAPOLATION_SECONDS
        );
        // Never scroll backwards because of clock jitter.
        const end = Math.max(
          windowSeconds,
          windowEndRef.current,
          estimatedNow - DISPLAY_DELAY_SECONDS
        );

        windowEndRef.current = end;
        // Returning prev bails out of the re-render when nothing moved.
        setDomain((prev) =>
          prev[1] === end ? prev : [end - windowSeconds, end]
        );
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, windowSeconds]);

  return domain;
};
