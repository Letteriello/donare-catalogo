import React from 'react';
import { Pencil, Plus, Trash2, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuickEditBar({ onEdit, onDelete, onCancel, isEditing, onSave }) {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="fixed bottom-4 right-4 flex gap-2 bg-white p-3 rounded-2xl shadow-xl z-50"
    >
      {isEditing ? (
        <>
          <button
            onClick={onSave}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700 transition-all hover:shadow-lg"
          >
            <Save size={18} />
            Salvar
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 bg-gray-600 text-white px-5 py-2 rounded-xl hover:bg-gray-700 transition-all hover:shadow-lg"
          >
            <X size={18} />
            Cancelar
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg"
          >
            <Pencil size={18} />
            Editar
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-xl hover:bg-red-700 transition-all hover:shadow-lg"
            >
              <Trash2 size={18} />
              Excluir
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}