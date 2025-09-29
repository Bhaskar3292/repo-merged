import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Edit2 } from 'lucide-react';

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  type?: 'text' | 'email' | 'select' | 'date';
  options?: string[];
  className?: string;
  placeholder?: string;
}

/**
 * EditableCell Component
 * Provides inline editing functionality for table cells
 * Supports text, email, select, and date input types
 */
export function EditableCell({ 
  value, 
  onSave, 
  type = 'text', 
  options = [], 
  className = '',
  placeholder = ''
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() !== value) {
      onSave(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div 
        className={`group flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded ${className}`}
        onClick={() => setIsEditing(true)}
      >
        <span className="flex-1">{value || placeholder}</span>
        <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {type === 'select' ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder={placeholder}
        />
      )}
      <button
        onClick={handleSave}
        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
        title="Save"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        onClick={handleCancel}
        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Cancel"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}