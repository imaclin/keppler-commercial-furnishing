'use client';

import { useEffect, useRef, useState } from 'react';
import { frameAfterDrag, wrapFrame } from '@/lib/spin';

// A 360-degree product view: a set of photos taken at evenly spaced angles,
// shown one at a time as the customer drags. This component is only mounted
// when the customer opens the 360 view, so the frames are not downloaded as
// part of the normal page load.
//
// Every frame is rendered once, stacked, and only the current one is visible.
// Swapping visibility between already-decoded images is instant; swapping a
// single <img>'s src can flash blank while the next frame decodes.

export function SpinViewer({ frames, alt }: { frames: string[]; alt: string }) {
  const count = frames.length;
  const [frame, setFrame] = useState(0);
  const [settled, setSettled] = useState(0); // frames that have finished loading (or failed)
  const [touched, setTouched] = useState(false);
  const drag = useRef<{ x: number; frame: number; width: number } | null>(null);
  const ready = settled >= count;

  // Load every frame up front so rotation never stalls on the network mid-drag.
  useEffect(() => {
    let live = true;
    for (const src of frames) {
      const img = new Image();
      const done = () => live && setSettled((n) => n + 1);
      img.onload = done;
      img.onerror = done;
      img.src = src;
    }
    return () => { live = false; };
  }, [frames]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, frame, width: e.currentTarget.clientWidth };
    setTouched(true);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    setFrame(frameAfterDrag(d.frame, e.clientX - d.x, d.width, count));
  }
  function endDrag() {
    drag.current = null;
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      setTouched(true);
      setFrame((f) => wrapFrame(f + (e.key === 'ArrowRight' ? 1 : -1), count));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFrame(0);
    }
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={`360 degree view of ${alt}. Use the left and right arrow keys to rotate.`}
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={frame + 1}
      aria-valuetext={`Angle ${frame + 1} of ${count}`}
      aria-busy={!ready}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      className={`relative h-full w-full select-none bg-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--walnut)] ${ready ? 'cursor-grab active:cursor-grabbing' : 'cursor-progress'}`}
      // Horizontal drags rotate; vertical swipes still scroll the page on phones.
      style={{ touchAction: 'pan-y' }}
    >
      {frames.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={i === frame ? alt : ''}
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ visibility: i === frame ? 'visible' : 'hidden' }}
        />
      ))}

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        {!ready ? (
          <span className="rounded-full bg-[var(--espresso)]/80 px-3 py-1 text-xs tracking-[0.08em] text-white">
            Loading 360 view, {settled} of {count}
          </span>
        ) : !touched ? (
          <span className="rounded-full bg-[var(--espresso)]/80 px-3 py-1 text-xs tracking-[0.08em] text-white">
            Drag to rotate
          </span>
        ) : null}
      </div>
    </div>
  );
}
