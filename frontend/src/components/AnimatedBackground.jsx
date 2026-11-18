import React, { useEffect, useMemo, useRef } from 'react';
import './AnimatedBackground.css';

// Fixed, decorative layer behind the whole app: drifting glow blobs, a moving
// grid, floating particles, a cursor spotlight and a scroll progress bar.
function AnimatedBackground() {
  const rootRef = useRef(null);
  const barRef = useRef(null);

  const particles = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: -Math.random() * 24,
      duration: 14 + Math.random() * 18,
      drift: (Math.random() - 0.5) * 120,
    })),
    []
  );

  useEffect(() => {
    const onMove = (e) => {
      const el = rootRef.current;
      if (!el) return;
      el.style.setProperty('--mx', `${e.clientX}px`);
      el.style.setProperty('--my', `${e.clientY}px`);
    };
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (barRef.current) barRef.current.style.width = `${pct}%`;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress"><div ref={barRef} className="scroll-progress-bar" /></div>
      <div className="bg-layer" ref={rootRef} aria-hidden="true">
        <div className="bg-blob blob-a" />
        <div className="bg-blob blob-b" />
        <div className="bg-blob blob-c" />
        <div className="bg-grid" />
        <div className="bg-spotlight" />
        {particles.map(p => (
          <span
            key={p.id}
            className="bg-particle"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
            }}
          />
        ))}
      </div>
    </>
  );
}

export default AnimatedBackground;
