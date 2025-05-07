import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Category } from '@/api/entities';
import { UploadFile } from "@/api/integrations";
import { Plus, Trash2, Edit, Image as ImageIcon, Save, X, Search, Loader2, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    image: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await Category.list();
      setCategories(data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCategoryId = (name) => {
    return name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
  };

  const handleImageUpload = async (e, isEditing) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await UploadFile({ file });
      
      if (isEditing) {
        setEditingCategory(prev => ({ ...prev, image: file_url }));
      } else {
        setNewCategory(prev => ({ ...prev, image: file_url }));
      }
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
    }
  };

  const handleCreateCategory = async (e, formData) => {
    e.preventDefault();
    try {
      const categoryData = {
        ...formData,
        id: generateCategoryId(formData.name)
      };
      await Category.create(categoryData);
      await loadCategories();
      setIsCreating(false);
      setNewCategory({ name: '', description: '', image: '' });
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
    }
  };

  const handleUpdateCategory = async (e, formData) => {
    e.preventDefault();
    try {
      console.log('Tentando atualizar categoria:', editingCategory);
      setIsLoading(true);
      
      // Pular verificação de existência já que temos a categoria em mãos
      // Se temos a categoria na lista, ela existe no Firestore
      
      // Preservar o ID e ordem ao atualizar
      const updatedData = {
        ...formData,
        id: editingCategory.id,
        order: editingCategory.order || 0
      };
      
      await Category.update(editingCategory.id, updatedData);
      console.log('Categoria atualizada com sucesso');
      
      // Atualizar o estado local para resposta imediata
      setCategories(prev => 
        prev.map(cat => cat.id === editingCategory.id ? {...cat, ...updatedData} : cat)
      );
      
      setEditingCategory(null);
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      alert(`Erro ao atualizar categoria: ${error.message || 'Erro desconhecido'}. Você tem permissões de administrador?`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
      try {
        console.log('Tentando excluir categoria com ID:', categoryId);
        // Adicionar feedback visual de loading
        setIsLoading(true);
        
        // Pular verificação de existência e tentar excluir diretamente
        // Se a categoria está na lista, ela existe no Firestore
        
        // Tentar excluir a categoria
        await Category.delete(categoryId);
        console.log('Categoria excluída com sucesso');
        
        // Atualizar a lista local
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      } catch (error) {
        console.error("Erro ao excluir categoria:", error);
        alert(`Erro ao excluir categoria: ${error.message || 'Erro desconhecido'}. Você tem permissões de administrador?`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Filtrar categorias com base na busca
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Definição do componente CategoryForm com props explícitas
  const CategoryForm = ({ isEditing, data, onSubmit, onCancel }) => {
    // Criar estado local para os campos do formulário
    const [localData, setLocalData] = useState(data);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Atualizar estado local quando data mudar
    useEffect(() => {
      setLocalData(data);
    }, [data]);

    // Função para lidar com mudanças nos campos
    const handleFieldChange = (field, value) => {
      const newData = { ...localData, [field]: value };
      setLocalData(newData);
    };

    // Função para submeter o formulário
    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      await onSubmit(e, localData);
      setIsSubmitting(false);
    };

    return (
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-belleza text-[#0B1F3A]">
            {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-[#0B1F3A]/60 hover:text-[#0B1F3A] p-2 rounded-full hover:bg-[#F4F1EC]"
          >
            <X size={24} />
          </button>
        </div>
      
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label 
              htmlFor="category-name" 
              className="block text-sm font-medium text-[#0B1F3A] mb-2"
            >
              Nome da Categoria *
            </label>
            <input
              id="category-name"
              type="text"
              value={localData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50"
              placeholder="Linha Mesa Posta"
              required
            />
          </div>

          <div>
            <label 
              htmlFor="category-description" 
              className="block text-sm font-medium text-[#0B1F3A] mb-2"
            >
              Descrição
            </label>
            <textarea
              id="category-description"
              value={localData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50"
              rows={3}
              placeholder="Descrição da categoria..."
            />
          </div>

          <div>
            <label 
              htmlFor="category-image" 
              className="block text-sm font-medium text-[#0B1F3A] mb-2"
            >
              Imagem da Categoria
            </label>
            <div className="flex items-center gap-4">
              {localData.image ? (
                <div className="relative w-32 h-32">
                  <img
                    src={localData.image}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('image', '')}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-[#F4F1EC] flex items-center justify-center rounded-xl border-2 border-dashed border-[#0B1F3A]/20">
                  <label 
                    htmlFor="category-image" 
                    className="cursor-pointer text-center"
                  >
                    <ImageIcon size={24} className="mx-auto mb-2 text-[#0B1F3A]/40" />
                    <span className="text-xs text-[#0B1F3A]/60">Upload</span>
                    <input
                      id="category-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, isEditing, localData.id)}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 border-2 border-[#0B1F3A]/20 rounded-xl hover:bg-[#F4F1EC] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-3 bg-[#0B1F3A] text-white rounded-xl hover:bg-[#0B1F3A]/90 transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>{isEditing ? 'Atualizar' : 'Criar'} Categoria</span>
              </>
            )}
          </button>
        </div>
      </form>
    );
  };

  CategoryForm.propTypes = {
    isEditing: PropTypes.bool.isRequired,
    data: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      image: PropTypes.string
    }).isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B1F3A] mx-auto mb-4"></div>
        <p className="text-[#0B1F3A]/70">Carregando categorias...</p>
      </div>
    );
  }

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    try {
      // Obter a lista atual e reorganizar localmente primeiro
      const items = Array.from(categories);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      // Atualizar a interface imediatamente para feedback visual
      setCategories(items);
      
      // Atualizar cada item com sua nova ordem no Firebase
      // Usamos Promise.all para garantir que todas as atualizações sejam feitas
      console.log('Iniciando atualização de ordens...');
      
      // Primeiro, vamos simplificar e garantir que temos apenas os dados necessários
      const updatePromises = items.map(async (category, index) => {
        try {
          // Vamos criar um novo objeto para atualização para evitar conflitos
          await Category.update(category.id, { order: index });
          console.log(`Ordem da categoria ${category.name} atualizada para ${index}`);
        } catch (error) {
          console.error(`Erro ao atualizar ordem da categoria ${category.name}:`, error);
          throw error; // Relança o erro para ser capturado pelo Promise.all
        }
      });
      
      // Aguardar todas as atualizações completarem
      await Promise.all(updatePromises);
      console.log('Todas as ordens de categorias foram atualizadas com sucesso!');
      
      // Forçar uma recarga das categorias para garantir que temos os dados mais recentes
      await loadCategories();
    } catch (error) {
      console.error('Erro ao reorganizar categorias:', error);
      // Recarregar as categorias originais em caso de erro
      await loadCategories();
      alert('Ocorreu um erro ao reorganizar as categorias. Por favor, tente novamente.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-belleza text-[#0B1F3A]">Gerenciar Categorias</h2>
        {!isCreating && !editingCategory && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0B1F3A] text-white rounded-xl hover:bg-[#0B1F3A]/90 transition-all"
          >
            <Plus size={20} />
            Nova Categoria
          </button>
        )}
      </div>

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <CategoryForm
            isEditing={false}
            data={newCategory}
            onSubmit={handleCreateCategory}
            onCancel={() => {
              setIsCreating(false);
              setNewCategory({ name: '', description: '', image: '' });
            }}
          />
        </motion.div>
      )}

      {editingCategory && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <CategoryForm
            isEditing={true}
            data={editingCategory}
            onSubmit={handleUpdateCategory}
            onCancel={() => setEditingCategory(null)}
          />
        </motion.div>
      )}

      {/* Busca */}
      {!isCreating && !editingCategory && (
        <div className="relative mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar categorias..."
            className="w-full px-4 py-3 pl-10 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50"
          />
          <Search className="absolute left-3 top-3.5 text-[#0B1F3A]/40" size={20} />
        </div>
      )}

      {/* Lista de categorias */}
      {!isCreating && !editingCategory && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="overflow-hidden rounded-xl border border-[#0B1F3A]/10"
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#0B1F3A]/10">
                    <thead className="bg-[#F4F1EC]">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#0B1F3A]/70 uppercase tracking-wider">
                          Ordem
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#0B1F3A]/70 uppercase tracking-wider">
                          Imagem
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#0B1F3A]/70 uppercase tracking-wider">
                          Nome
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#0B1F3A]/70 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#0B1F3A]/70 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#0B1F3A]/10">
                      {filteredCategories.map((category, index) => (
                        <Draggable
                          key={category.id}
                          draggableId={category.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`hover:bg-[#F4F1EC]/50 transition-colors ${
                                snapshot.isDragging ? 'bg-[#F4F1EC] shadow-lg' : ''
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className="flex items-center cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical size={20} className="text-[#0B1F3A]/40" />
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {category.image ? (
                                  <img
                                    src={category.image}
                                    alt={category.name}
                                    className="h-16 w-16 rounded-xl object-cover"
                                  />
                                ) : (
                                  <div className="h-16 w-16 rounded-xl bg-[#0B1F3A]/10 flex items-center justify-center">
                                    <ImageIcon size={20} className="text-[#0B1F3A]/40" />
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0B1F3A]">
                                {category.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-[#0B1F3A]/70">
                                <div className="max-w-xs truncate">
                                  {category.description}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => setEditingCategory(category)}
                                    className="p-2 bg-[#F4F1EC] text-blue-600 hover:text-blue-800 rounded-xl hover:bg-[#F4F1EC]/80 transition-colors"
                                  >
                                    <Edit size={20} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="p-2 bg-[#F4F1EC] text-red-600 hover:text-red-800 rounded-xl hover:bg-[#F4F1EC]/80 transition-colors"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
