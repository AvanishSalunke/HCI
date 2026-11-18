import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './ImageViewer.css';

// Full-screen gallery: whole photo visible, left/right buttons, arrow keys, Esc to close.
function ImageViewer({ images, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const count = images.length;

  const prev = useCallback(() => setIndex(i => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIndex(i => (i + 1) % count), [count]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // stop the page behind from scrolling while the viewer is open
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [prev, next, onClose]);

  // Portal to <body>: an animated (transformed) ancestor would otherwise shrink
  // "fixed" positioning to that ancestor instead of the whole window.
  return createPortal(
    <div className="imgv-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Attachments">
      <button type="button" className="imgv-close" onClick={onClose} aria-label="Close">×</button>

      {count > 1 && (
        <button
          type="button"
          className="imgv-arrow left"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Previous photo"
        >‹</button>
      )}

      <img
        key={index}
        src={images[index]}
        alt={`Attachment ${index + 1} of ${count}`}
        className="imgv-image"
        onClick={(e) => e.stopPropagation()}
      />

      {count > 1 && (
        <button
          type="button"
          className="imgv-arrow right"
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Next photo"
        >›</button>
      )}

      <div className="imgv-counter" onClick={(e) => e.stopPropagation()}>
        {index + 1} / {count}
      </div>
    </div>,
    document.body
  );
}

export default ImageViewer;
