import { useCallback, useEffect, useRef } from 'react';

export default function useSerializedRefresh(task, { minGapMs = 450 } = {}) {
  const taskRef = useRef(task);
  const inFlightRef = useRef(null);
  const queuedRef = useRef(false);
  const timerRef = useRef(0);
  const lastRunAtRef = useRef(0);

  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  const schedule = useCallback(
    ({ force = false } = {}) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = 0;
      }

      if (inFlightRef.current) {
        queuedRef.current = true;
        return inFlightRef.current;
      }

      const elapsedMs = Date.now() - lastRunAtRef.current;
      if (!force && minGapMs > 0 && elapsedMs < minGapMs) {
        timerRef.current = window.setTimeout(() => {
          timerRef.current = 0;
          schedule({ force: true });
        }, Math.max(40, minGapMs - elapsedMs));
        return null;
      }

      lastRunAtRef.current = Date.now();

      let request = null;
      request = Promise.resolve()
        .then(() => taskRef.current?.())
        .finally(() => {
          if (inFlightRef.current === request) {
            inFlightRef.current = null;
          }

          if (queuedRef.current) {
            queuedRef.current = false;
            schedule();
          }
        });

      inFlightRef.current = request;
      return request;
    },
    [minGapMs]
  );

  useEffect(
    () => () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      queuedRef.current = false;
      inFlightRef.current = null;
    },
    []
  );

  return schedule;
}
