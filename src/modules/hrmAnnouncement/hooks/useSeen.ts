"use client";

import { useEffect, useRef, useState } from "react";

interface Seen {
  /** True from the moment any part of the element scrolls into view. */
  entered: boolean;
  /** True once it has stayed in view for `dwellMs` — "actually looked at". */
  dwelled: boolean;
}

/**
 * Tracks whether an element has been seen, and for how long.
 *
 * A feed that prints the whole message has no click to hang "read" on, so
 * reading is what the reader's screen says it is. `entered` is the cue to
 * fetch what the card needs; `dwelled` is the stricter one — it survives a
 * fast scroll past, so flicking to the bottom of the page does not silently
 * mark everything read.
 *
 * Both latch: once true they stay true, and the observer disconnects.
 */
export function useSeen(dwellMs = 1500) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ entered, dwelled }, setSeen] = useState<Seen>({ entered: false, dwelled: false });

  useEffect(() => {
    const node = ref.current;
    if (!node || dwelled) return;

    // Server render, jsdom, or a browser without the API: fall back to
    // "visible", because never loading the body is the worse failure.
    if (typeof IntersectionObserver === "undefined") {
      setSeen({ entered: true, dwelled: true });
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible) {
          setSeen((s) => (s.entered ? s : { ...s, entered: true }));
          timer ??= setTimeout(() => setSeen({ entered: true, dwelled: true }), dwellMs);
        } else if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }
      },
      // A quarter of the card on screen is enough to count as looking at it.
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [dwellMs, dwelled]);

  return { ref, entered, dwelled };
}
