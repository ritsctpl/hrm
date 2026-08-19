'use client';

// A fixed-position widget the user can move out of the way.
//
// The capture launcher lived at a hard-coded bottom-right, which is exactly where IMES form
// footers put Save and Cancel — so on those screens it sat on top of the buttons you needed
// (user, 2026-08-08). Rather than guess a corner that is free on every screen, let people drag
// it and remember where they put it.
//
// Deliberate choices:
//  - Position is clamped into the viewport on drop AND on resize, so a spot saved on a wide
//    monitor cannot strand the button off-screen on a laptop.
//  - A drag under the threshold counts as a click, so the button still works as a button.
//  - Double-click returns it to the default corner, which is the escape hatch when someone
//    parks it somewhere useless.
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface Anchor { left: number; top: number; }

const MARGIN = 8;
/** Below this many pixels of movement it was a click, not a drag. */
const DRAG_THRESHOLD = 4;

const clamp = (a: Anchor, el: HTMLElement | null): Anchor => {
  const w = el?.offsetWidth ?? 160;
  const h = el?.offsetHeight ?? 40;
  const maxLeft = Math.max(MARGIN, window.innerWidth - w - MARGIN);
  const maxTop = Math.max(MARGIN, window.innerHeight - h - MARGIN);
  return {
    left: Math.min(Math.max(a.left, MARGIN), maxLeft),
    top: Math.min(Math.max(a.top, MARGIN), maxTop),
  };
};

export function useDraggableAnchor(storageKey: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const drag = useRef<{ dx: number; dy: number; moved: number; captured: boolean } | null>(null);
  const suppressClick = useRef(false);

  // Restore a saved spot, once mounted so we can measure the element.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setAnchor(clamp(JSON.parse(raw), ref.current));
    } catch { /* a corrupt value must not cost you the button */ }
  }, [storageKey]);

  // A saved spot must survive a window resize without escaping the viewport.
  useEffect(() => {
    if (!anchor) return;
    const onResize = () => setAnchor((a) => (a ? clamp(a, ref.current) : a));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [anchor]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    drag.current = { dx: e.clientX - box.left, dy: e.clientY - box.top, moved: 0, captured: false };
    // NO setPointerCapture here. Capturing on pointer-down retargets the subsequent click to
    // this wrapper, so the Button inside never receives it — the launcher stopped starting a
    // recording at all (2026-08-08, caught by comparing against the un-patched component).
    // Capture is taken lazily below, only once the gesture is genuinely a drag.
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    d.moved += Math.abs(e.movementX) + Math.abs(e.movementY);
    if (d.moved < DRAG_THRESHOLD) return;          // still a click so far
    if (!d.captured) {                             // it is a drag now — keep the pointer
      ref.current?.setPointerCapture?.(e.pointerId);
      d.captured = true;
    }
    setAnchor(clamp({ left: e.clientX - d.dx, top: e.clientY - d.dy }, ref.current));
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (d?.captured) ref.current?.releasePointerCapture?.(e.pointerId);
    if (!d || d.moved < DRAG_THRESHOLD) return;    // it was a click; leave it to the button
    suppressClick.current = true;                  // it was a drag; the button must not fire
    setAnchor((a) => {
      if (a) {
        try { window.localStorage.setItem(storageKey, JSON.stringify(a)); } catch { /* private mode */ }
      }
      return a;
    });
  }, [storageKey]);

  /** Put it back where it started. */
  const reset = useCallback(() => {
    try { window.localStorage.removeItem(storageKey); } catch { /* ignore */ }
    setAnchor(null);
  }, [storageKey]);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  // ONE style object. Returning a second `style` inside `handlers` meant a JSX spread
  // silently overwrote the position — the drag saved a spot and the element never moved
  // (2026-08-08). Anything spread onto an element must not carry a competing `style`.
  const style: React.CSSProperties = {
    touchAction: 'none',
    cursor: 'grab',
    ...(anchor ? { left: anchor.left, top: anchor.top, right: 'auto', bottom: 'auto' } : {}),
  };

  return {
    ref,
    style,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onClickCapture,
      onDoubleClick: reset,
    },
    moved: !!anchor,
    reset,
  };
}
