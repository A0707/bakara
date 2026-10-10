import React, { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon';
export function Button({ children, icon, variant = 'primary', small = false, ...props }) {
  return (
    <button
      type="button"
      className={`button button-${variant} ${small ? 'button-small' : ''}`}
      {...props}
    >
      {icon && <Icon name={icon} size={18} />} {children}
    </button>
  );
}
export function Btn({ children, onClick, outline, sm, disabled }) {
  return (
    <Button
      onClick={onClick}
      variant={outline ? 'secondary' : 'primary'}
      small={sm}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
export function Badge({ children, t, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children || t}</span>;
}
export function Modal({ show, onClose, title, children }) {
  const ref = useRef(null),
    id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (show && !dialog.open) dialog.showModal();
    if (!show && dialog.open) dialog.close();
    if (!show) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      if (dialog.open) dialog.close();
    };
  }, [show]);
  return (
    <dialog
      className="modal-card"
      ref={ref}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = ref.current.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <header className="modal-heading">
        <div>
          <span className="eyebrow">ESPACE BAKARA</span>
          <h2 id={id}>{title}</h2>
        </div>
        <button type="button" className="icon-button" aria-label="Fermer" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>
      {show && children}
    </dialog>
  );
}
export function Field({
  label,
  value,
  onChange,
  type = 'text',
  options,
  placeholder,
  required = false,
  id: givenId,
  help,
  min,
}) {
  const generated = useId(),
    id = givenId || generated;
  const common = {
    id,
    value: value ?? '',
    required,
    onChange: (event) => onChange(event.target.value),
    'aria-describedby': help ? id + '-help' : undefined,
  };
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {options ? (
        <select {...common}>
          {options.map((option) => {
            const item = typeof option === 'string' ? { value: option, label: option } : option;
            return (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          {...common}
          type={type}
          placeholder={placeholder}
          min={type === 'number' ? (min ?? 0) : undefined}
          step={type === 'number' ? '0.01' : undefined}
          autoComplete={
            type === 'email' ? 'username' : type === 'password' ? 'current-password' : undefined
          }
        />
      )}{' '}
      {help && <small id={id + '-help'}>{help}</small>}
    </div>
  );
}
export function Inp({ l, v, onChange, type, opts, ph }) {
  return (
    <Field
      label={l}
      value={v}
      onChange={onChange}
      type={type}
      options={opts ? [{ value: '', label: 'Choisir…' }, ...opts] : undefined}
      placeholder={ph}
    />
  );
}
export function Stat({ label, value, detail, icon, tone = 'blue' }) {
  return (
    <section className={`stat-card tone-${tone}`}>
      <span className="stat-icon">
        <Icon name={icon || 'wallet'} />
      </span>
      <div>
        <span className="stat-label">{label}</span>
        <strong>{value}</strong>
        {detail && <span className="stat-detail">{detail}</span>}
      </div>
    </section>
  );
}
export function EmptyState({
  title = 'Aucun résultat',
  description = 'Essayez une autre recherche.',
  icon = 'grid',
  action,
}) {
  return (
    <div className="empty-state">
      <span>
        <Icon name={icon} size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Money({ value, currency = true }) {
  return (
    <span className="money">
      {new Intl.NumberFormat('fr-MA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value) || 0)}
      {currency && (
        <>
          {' '}
          <small>MAD</small>
        </>
      )}
    </span>
  );
}
export function PanelHeader({ eyebrow, title, action }) {
  return (
    <header className="panel-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action}
    </header>
  );
}
export function RecordForm({ initial, fields, onSubmit, onCancel, submitLabel = 'Enregistrer' }) {
  const [form, setForm] = useState(initial),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await onSubmit(form);
    } catch (e) {
      setError(e.message || 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="record-form">
      <div className="form-grid">
        {fields.map((field) => (
          <div key={field.key} className={field.full ? 'field-full' : ''}>
            <Field
              {...field}
              value={form[field.key]}
              onChange={(value) => setForm((f) => ({ ...f, [field.key]: value }))}
            />
          </div>
        ))}
      </div>
      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Annuler
        </Button>
        <button className="button button-primary" type="submit" disabled={busy}>
          {busy ? 'Enregistrement…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
export function ConfirmDelete({
  show,
  title = 'Supprimer cet élément ?',
  description,
  onClose,
  onConfirm,
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    if (show) setError('');
  }, [show]);
  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      show={show}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={title}
    >
      <p className="dialog-description">{description}</p>
      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}
      <div className="form-actions">
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          Conserver
        </Button>
        <Button variant="danger" disabled={busy} onClick={confirm}>
          {busy ? 'Enregistrement…' : 'Confirmer'}
        </Button>
      </div>
    </Modal>
  );
}
