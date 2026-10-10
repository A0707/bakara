import React, { useEffect, useId, useRef } from 'react';
import Icon from './Icon';
export function Badge({ t, c }) {
  return (
    <span className="badge" style={{ color: c, background: c + '14' }}>
      {t}
    </span>
  );
}
export function Modal({ show, onClose, title, children }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    if (!show) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector('input,select,button')?.focus();
    const listener = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const nodes = [
          ...ref.current.querySelectorAll(
            'button:not(:disabled),input,select,textarea,[tabindex="0"]',
          ),
        ];
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [show]);
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="modal-card"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-heading">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Fermer">
            <Icon name="close" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function Inp({ l, v, onChange, type = 'text', opts, ph }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{l}</label>
      {opts ? (
        <select id={id} value={v} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choisir…</option>
          {opts.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={v}
          placeholder={ph}
          min={type === 'number' ? 0 : undefined}
          step={type === 'number' ? '0.01' : undefined}
          autoComplete={
            type === 'email' ? 'username' : type === 'password' ? 'current-password' : undefined
          }
          onChange={(e) =>
            onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)
          }
        />
      )}
    </div>
  );
}
export function Btn({ children, onClick, c, outline, sm, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`button ${outline ? 'button-outline' : ''} ${sm ? 'button-small' : ''}`}
      style={c && outline ? { color: c } : undefined}
    >
      {children}
    </button>
  );
}
