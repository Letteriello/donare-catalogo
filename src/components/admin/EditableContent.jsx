import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function EditableContent({ 
  content, 
  isEditing, 
  onChange, 
  type = 'text',
  className = '',
  placeholder = 'Digite aqui...' 
}) {
  if (isEditing) {
    if (type === 'textarea') {
      return (
        <Textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      );
    }
    return (
      <Input
        type={type}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return <div className={className}>{content}</div>;
}