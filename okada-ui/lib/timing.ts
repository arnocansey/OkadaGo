export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number
): (...args: TArgs) => void {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return (...args: TArgs) => {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      fn(...args);
    }, delayMs);
  };
}

export function throttle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  intervalMs: number
): (...args: TArgs) => void {
  let lastCall = 0;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return (...args: TArgs) => {
    const now = Date.now();
    const elapsed = now - lastCall;

    if (elapsed >= intervalMs) {
      lastCall = now;
      fn(...args);
    } else if (timerId === null) {
      timerId = setTimeout(() => {
        lastCall = Date.now();
        timerId = null;
        fn(...args);
      }, intervalMs - elapsed);
    }
  };
}
