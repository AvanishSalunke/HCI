import React, { useState, useEffect, useRef } from 'react';
import { formatTime } from '../eventUtils';
import './TimePicker.css';

const ITEM_H = 44; // px, keep in sync with TimePicker.css
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'];

// "HH:MM" (24h) -> { hour12, minute, pm }
const parse = (value) => {
  if (!value) return { hour12: 12, minute: 0, pm: true };
  const [h, m] = value.split(':').map(Number);
  return { hour12: ((h + 11) % 12) + 1, minute: m, pm: h >= 12 };
};

const toValue = ({ hour12, minute, pm }) => {
  const h24 = (hour12 % 12) + (pm ? 12 : 0);
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

function Wheel({ items, selectedIndex, onChange, format = String, label }) {
  const ref = useRef(null);
  const timer = useRef(null);

  // Jump to the current value when the wheel mounts
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = selectedIndex * ITEM_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const index = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.min(items.length - 1, Math.max(0, index));
      if (clamped !== selectedIndex) onChange(clamped);
    }, 80);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="tp-wheel" ref={ref} onScroll={handleScroll} role="listbox" aria-label={label}>
      <div className="tp-spacer" />
      {items.map((item, i) => (
        <div
          key={item}
          role="option"
          aria-selected={i === selectedIndex}
          className={i === selectedIndex ? 'tp-item selected' : 'tp-item'}
          onClick={() => {
            ref.current.scrollTo({ top: i * ITEM_H, behavior: 'smooth' });
            onChange(i);
          }}
        >
          {format(item)}
        </div>
      ))}
      <div className="tp-spacer" />
    </div>
  );
}

// Android-alarm style time picker. `value` and `onChange` use 24h "HH:MM".
function TimePicker({ id, value, onChange, required }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(parse(value));
  const rootRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const openPicker = () => {
    setDraft(parse(value));
    setOpen(true);
  };

  const confirm = () => {
    onChange(toValue(draft));
    setOpen(false);
  };

  return (
    <div className="tp-root" ref={rootRef}>
      <button type="button" id={id} className="tp-trigger" onClick={openPicker}>
        {value ? formatTime(value) : 'Select time'}
        <span className="tp-clock" aria-hidden="true">🕒</span>
      </button>
      {/* Invisible input so the browser's "required" check still works */}
      {required && (
        <input className="tp-required" tabIndex={-1} value={value} onChange={() => {}} required aria-hidden="true" />
      )}

      {open && (
        <div className="tp-popover">
          <div className="tp-wheels">
            <div className="tp-band" />
            <Wheel
              label="Hour"
              items={HOURS}
              selectedIndex={HOURS.indexOf(draft.hour12)}
              onChange={(i) => setDraft(d => ({ ...d, hour12: HOURS[i] }))}
            />
            <span className="tp-colon">:</span>
            <Wheel
              label="Minute"
              items={MINUTES}
              selectedIndex={draft.minute}
              format={(m) => String(m).padStart(2, '0')}
              onChange={(i) => setDraft(d => ({ ...d, minute: MINUTES[i] }))}
            />
            <Wheel
              label="AM or PM"
              items={PERIODS}
              selectedIndex={draft.pm ? 1 : 0}
              onChange={(i) => setDraft(d => ({ ...d, pm: i === 1 }))}
            />
          </div>
          <div className="tp-actions">
            <button type="button" className="tp-cancel" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="tp-ok" onClick={confirm}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimePicker;
