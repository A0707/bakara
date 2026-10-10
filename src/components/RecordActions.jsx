import React from 'react';
import Icon from './Icon';
export default function RecordActions({ label, onEdit, onDelete, disabled }) {
  return (
    <div className="record-actions">
      {onEdit && (
        <button
          className="icon-button"
          disabled={disabled}
          onClick={onEdit}
          aria-label={`Modifier ${label}`}
          title="Modifier"
        >
          <Icon name="edit" size={18} />
        </button>
      )}
      {onDelete && (
        <button
          className="icon-button action-danger"
          disabled={disabled}
          onClick={onDelete}
          aria-label={`Supprimer ${label}`}
          title="Supprimer"
        >
          <Icon name="trash" size={18} />
        </button>
      )}
    </div>
  );
}
