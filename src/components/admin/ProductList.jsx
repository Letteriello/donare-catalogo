import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { Edit, Trash2, GripVertical } from 'lucide-react';

export default function ProductList({ products, onEdit, onDelete, onReorder }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(products);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="products">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {products.map((product, index) => (
              <Draggable
                key={product.id}
                draggableId={product.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <motion.div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white border border-[#0B1F3A]/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all ${
                      snapshot.isDragging ? 'shadow-lg scale-105' : ''
                    }`}
                  >
                    <div className="relative h-48 bg-[#F4F1EC]">
                      <div
                        {...provided.dragHandleProps}
                        className="absolute top-2 left-2 p-2 bg-white/90 rounded-xl cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical size={20} className="text-[#0B1F3A]/40" />
                      </div>
                      {product.main_image ? (
                        <img 
                          src={product.main_image} 
                          alt={product.name} 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-[#F4F1EC]">
                          <p className="text-[#0B1F3A]/40">Sem imagem</p>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => onEdit(product)}
                          className="p-2 bg-white/90 text-blue-600 rounded-xl shadow-sm hover:bg-white hover:text-blue-700"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => onDelete(product.id)}
                          className="p-2 bg-white/90 text-red-600 rounded-xl shadow-sm hover:bg-white hover:text-red-700"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-[#0B1F3A] text-lg truncate">{product.name}</h3>
                      <p className="text-[#0B1F3A]/60 text-sm mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm px-2 py-1 bg-[#F4F1EC] rounded-lg text-[#0B1F3A]/80">
                          {product.category}
                        </span>
                        <span className="font-medium text-[#0B1F3A]">
                          {product.price ? `R$ ${Number(product.price).toFixed(2)}` : "Sob consulta"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}