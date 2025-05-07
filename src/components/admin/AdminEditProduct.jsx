
import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { Category } from "@/api/entities";
import { X, Plus, Loader2, Upload, Trash2, Edit, Search, ChevronLeft, ChevronRight, GripVertical, ChevronDown, ChevronUp, Camera, Save } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function AdminEditProduct({ onSave, onCancel }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    main_image: "",
    gallery: [],
    category: "",
    subcategory: "",
    options: [],
    price: "",
    whatsapp_link: "",
    is_new: false,
    is_limited: false,
    is_featured: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentOption, setCurrentOption] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // Carregar categorias do banco de dados
  const [categories, setCategories] = useState([]);
  
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await Category.list();
      setCategories(categoriesData);
      
      // Inicializar todas as categorias como expandidas
      const initialExpandedState = {};
      categoriesData.forEach(cat => {
        initialExpandedState[cat.id] = true;
      });
      setExpandedCategories(initialExpandedState);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const loadProducts = async () => {
    setIsProductsLoading(true);
    try {
      const fetchedProducts = await Product.list();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Cria uma cópia do formData para ajustar campos antes de enviar
      const productData = { ...formData };
      
      // Converte preço vazio para null para evitar problemas no banco
      if (productData.price === "" || productData.price === undefined) {
        productData.price = null;
      } else {
        // Converte para número se houver um valor
        productData.price = Number(productData.price);
      }

      if (selectedProduct) {
        await Product.update(selectedProduct.id, productData);
      } else {
        await Product.create(productData);
      }
      await loadProducts();
      resetForm();
      setIsCreating(false);
      if (onSave) onSave();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      setError("Erro ao salvar produto. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      main_image: product.main_image || "",
      gallery: product.gallery || [],
      category: product.category || "",
      subcategory: product.subcategory || "",
      options: product.options || [],
      price: product.price || "",
      whatsapp_link: product.whatsapp_link || "",
      is_new: product.is_new || false,
      is_limited: product.is_limited || false,
      is_featured: product.is_featured || false
    });
    setIsCreating(true);
  };

  // Modificar o componente de upload de imagem para suportar câmera
  const ImageUploadButton = ({ id, onUpload, label, disabled }) => (
    <div className="flex gap-2">
      <input
        type="file"
        id={`${id}_file`}
        accept="image/*"
        onChange={onUpload}
        className="hidden"
        disabled={disabled}
      />
      <input
        type="file"
        id={`${id}_camera`}
        accept="image/*"
        capture="environment"
        onChange={onUpload}
        className="hidden"
        disabled={disabled}
      />
      <label
        htmlFor={`${id}_file`}
        className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#0B1F3A]/20 rounded-xl cursor-pointer hover:bg-[#F4F1EC] transition-colors"
      >
        <Upload className="w-6 h-6 text-[#0B1F3A]/40 mb-2" />
        <span className="text-sm text-[#0B1F3A]/70">Escolher arquivo</span>
      </label>
      <label
        htmlFor={`${id}_camera`}
        className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#0B1F3A]/20 rounded-xl cursor-pointer hover:bg-[#F4F1EC] transition-colors"
      >
        <Camera className="w-6 h-6 text-[#0B1F3A]/40 mb-2" />
        <span className="text-sm text-[#0B1F3A]/70">Usar câmera</span>
      </label>
    </div>
  );

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await Product.delete(productId);
        await loadProducts();
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
      }
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setFormData({
      name: "",
      description: "",
      main_image: "",
      gallery: [],
      category: "",
      subcategory: "",
      options: [],
      price: "",
      whatsapp_link: "",
      is_new: false,
      is_limited: false,
      is_featured: false
    });
  };

  // Função para formatar categorias
  const formatCategory = (categoryId) => {
    if (!categoryId || !categories) return 'Categoria não encontrada';
    const foundCategory = categories.find(cat => cat.id === categoryId);
    return foundCategory ? foundCategory.name : 'Categoria não encontrada';
  };

  // Função para filtrar produtos
  const filteredProducts = products.filter(product => {
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && formatCategory(product.category).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Agrupar produtos por categoria
  const groupedProducts = {};
  filteredProducts.forEach(product => {
    const categoryId = product.category || "sem_categoria";
    if (!groupedProducts[categoryId]) {
      groupedProducts[categoryId] = [];
    }
    groupedProducts[categoryId].push(product);
  });

  // Função para alternar a expansão da categoria
  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleGalleryDragEnd = (result) => {
    if (!result.destination) return;

    // Se estiver arrastando da galeria para a posição principal
    if (result.destination.droppableId === 'main-image' && result.source.droppableId === 'gallery') {
      const draggedImage = formData.gallery[result.source.index];
      const newGallery = [...formData.gallery];
      
      // Remove a imagem da galeria
      newGallery.splice(result.source.index, 1);
      
      // Se já existia uma imagem principal, adiciona ela à galeria
      if (formData.main_image) {
        newGallery.unshift(formData.main_image);
      }
      
      setFormData(prev => ({
        ...prev,
        main_image: draggedImage,
        gallery: newGallery
      }));
      return;
    }

    // Se estiver arrastando a imagem principal para a galeria
    if (result.source.droppableId === 'main-image' && result.destination.droppableId === 'gallery') {
      const newGallery = [...formData.gallery];
      const targetIndex = result.destination.index;
      
      // Adiciona a imagem principal na posição desejada da galeria
      newGallery.splice(targetIndex, 0, formData.main_image);
      
      setFormData(prev => ({
        ...prev,
        main_image: '',
        gallery: newGallery
      }));
      return;
    }

    // Reordenação normal da galeria
    if (result.source.droppableId === 'gallery' && result.destination.droppableId === 'gallery') {
      const items = Array.from(formData.gallery);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      setFormData(prev => ({ ...prev, gallery: items }));
    }
  };

  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const handleProductDragEnd = (result) => {
    if (!result.destination) return;
    
    const [sourceCategoryId, sourceIndex] = result.source.droppableId.split('-');
    const [destCategoryId, destIndex] = result.destination.droppableId.split('-');
    
    const newProducts = [...products];
    
    if (sourceCategoryId === destCategoryId) {
      // Mover dentro da mesma categoria
      const categoryProducts = groupedProducts[sourceCategoryId];
      const [movedProduct] = categoryProducts.splice(result.source.index, 1);
      categoryProducts.splice(result.destination.index, 0, movedProduct);
      
      // Atualizar o array de produtos
      const updatedProducts = products.filter(p => p.category !== sourceCategoryId);
      setProducts([...updatedProducts, ...categoryProducts]);
      setHasOrderChanges(true);
    } else {
      // Mover entre categorias
      const productToMove = groupedProducts[sourceCategoryId][result.source.index];
      const updatedProduct = { ...productToMove, category: destCategoryId };
      
      const updatedProducts = products.filter(p => p.id !== productToMove.id);
      setProducts([...updatedProducts, updatedProduct]);
      
      // Atualizar no banco de dados imediatamente quando muda de categoria
      Product.update(productToMove.id, { 
        category: destCategoryId,
        display_order: result.destination.index
      })
        .then(() => loadProducts())
        .catch(error => console.error("Erro ao atualizar categoria do produto:", error));
    }
  };

  const saveProductOrder = async () => {
    setIsSavingOrder(true);
    try {
      // Atualizar a ordem de exibição de todos os produtos em cada categoria
      for (const categoryId in groupedProducts) {
        const categoryProducts = groupedProducts[categoryId];
        const updatePromises = categoryProducts.map((product, index) => 
          Product.update(product.id, { display_order: index })
        );
        await Promise.all(updatePromises);
      }
      setHasOrderChanges(false);
      await loadProducts();
    } catch (error) {
      console.error("Erro ao salvar ordem dos produtos:", error);
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Modificar o componente de upload de imagem para suportar câmera
  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Verificar se é formato HEIC e avisar usuário
    if (file.name.toLowerCase().endsWith('.heic')) {
      setError("Formato HEIC não suportado. Por favor, converta para JPG, PNG ou WEBP antes de enviar.");
      return;
    }

    // Verificar o tamanho do arquivo (máximo 5MB)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      setError("A imagem excede o tamanho máximo de 5MB. Por favor, escolha uma imagem menor.");
      return;
    }

    // Verificar se o formato é suportado (jpg, png, webp)
    const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedFormats.includes(file.type)) {
      setError("Formato de imagem não suportado. Por favor, use JPG, PNG ou WEBP.");
      return;
    }

    try {
      setImageUploading(true);
      setImageProgress(0);
      
      const interval = setInterval(() => {
        setImageProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 300);
      
      const { file_url } = await UploadFile({ file });
      
      clearInterval(interval);
      setImageProgress(100);
      
      if (type === "main") {
        setFormData(prev => ({ ...prev, main_image: file_url }));
      } else {
        setFormData(prev => ({ ...prev, gallery: [...prev.gallery, file_url] }));
      }
    } catch (error) {
      setError("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
      setTimeout(() => {
        setImageUploading(false);
        setImageProgress(0);
      }, 500);
    }
  };

  if (isCreating) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-belleza text-[#0B1F3A]">
            {selectedProduct ? "Editar Produto" : "Novo Produto"}
          </h2>
          <button 
            onClick={() => {
              resetForm();
              setIsCreating(false);
            }}
            className="text-[#0B1F3A]/60 hover:text-[#0B1F3A] p-2 rounded-full hover:bg-[#F4F1EC]"
          >
            <X size={28} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campos do formulário */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                  Descrição *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={5}
                  className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                  Link do WhatsApp Business
                </label>
                <input
                  type="url"
                  name="whatsapp_link"
                  value={formData.whatsapp_link}
                  onChange={(e) => setFormData({...formData, whatsapp_link: e.target.value})}
                  placeholder="https://wa.me/c/..."
                  className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-lg"
                />
                <p className="mt-1 text-xs text-[#0B1F3A]/60">
                  Cole aqui o link do produto compartilhado do WhatsApp Business
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                    Categoria *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-lg"
                    required
                  >
                    <option value="">Selecione a Categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                    Preço
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    step="0.01"
                    className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-lg"
                    placeholder="Deixe vazio para 'Sob consulta'"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_new"
                    checked={formData.is_new}
                    onChange={(e) => setFormData({...formData, is_new: e.target.checked})}
                    className="w-5 h-5 rounded-lg"
                  />
                  <span className="text-[#0B1F3A]/80">Marcar como Novidade</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_limited"
                    checked={formData.is_limited}
                    onChange={(e) => setFormData({...formData, is_limited: e.target.checked})}
                    className="w-5 h-5 rounded-lg"
                  />
                  <span className="text-[#0B1F3A]/80">Marcar como Edição Limitada</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    className="w-5 h-5 rounded-lg"
                  />
                  <span className="text-[#0B1F3A]/80">Destacar na Página Inicial</span>
                </label>
              </div>
            </div>

            {/* Imagens */}
            <DragDropContext onDragEnd={handleGalleryDragEnd}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                    Imagem Principal * (Arraste uma imagem da galeria para definir como principal)
                  </label>
                  <Droppable droppableId="main-image" direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="relative bg-white p-4 rounded-xl border-2 border-dashed border-[#0B1F3A]/20 min-h-[200px]"
                      >
                        {formData.main_image ? (
                          <Draggable
                            draggableId="main-image"
                            index={0}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`relative ${snapshot.isDragging ? 'z-50' : ''}`}
                              >
                                <img
                                  src={formData.main_image}
                                  alt="Imagem principal"
                                  className="w-full h-48 object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => setFormData({...formData, main_image: ""})}
                                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-48">
                            <Upload className="w-10 h-10 text-[#0B1F3A]/40 mb-2" />
                            <p className="text-[#0B1F3A]/70">Arraste uma imagem da galeria ou faça upload</p>
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {!formData.main_image && (
                    <div className="relative">
                      <ImageUploadButton
                        id="main_image"
                        onUpload={(e) => handleImageUpload(e, "main")}
                        label="Imagem Principal"
                        disabled={imageUploading}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                    Galeria de Imagens
                    <span className="text-sm font-normal text-[#0B1F3A]/60 ml-2">
                      (Arraste para reordenar)
                    </span>
                  </label>
                  
                  <Droppable droppableId="gallery" direction="horizontal">
                    {(provided) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4"
                      >
                        {formData.gallery.map((image, index) => (
                          <Draggable 
                            key={`${image}-${index}`} 
                            draggableId={`${image}-${index}`} 
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`relative rounded-xl overflow-hidden shadow-sm transition-transform ${
                                  snapshot.isDragging ? 'scale-105 shadow-lg' : ''
                                }`}
                              >
                                <div className="aspect-square">
                                  <img 
                                    src={image} 
                                    alt={`Imagem ${index + 1}`} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                
                                <div className="absolute inset-x-0 top-0 p-2 bg-gradient-to-b from-black/50 to-transparent flex justify-between items-start">
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical size={16} className="text-white" />
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newGallery = [...formData.gallery];
                                      newGallery.splice(index, 1);
                                      setFormData(prev => ({ ...prev, gallery: newGallery }));
                                    }}
                                    className="p-1.5 rounded-lg bg-red-500/80 backdrop-blur-sm hover:bg-red-500 transition-colors"
                                  >
                                    <X size={16} className="text-white" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {(!formData.gallery || formData.gallery.length < 5) && (
                          <div className="aspect-square">
                            <input
                              type="file"
                              id="gallery_image"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, "gallery")}
                              className="hidden"
                              disabled={imageUploading}
                            />
                            <label
                              htmlFor="gallery_image"
                              className="flex items-center justify-center w-full h-full border-2 border-dashed border-[#0B1F3A]/20 rounded-xl cursor-pointer hover:bg-[#F4F1EC] transition-colors"
                            >
                              {imageUploading ? (
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B1F3A] mx-auto mb-2"></div>
                                  <p className="text-[#0B1F3A]/70 text-sm">
                                    Enviando... {imageProgress}%
                                  </p>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <Plus size={24} className="mx-auto mb-2 text-[#0B1F3A]/40" />
                                  <p className="text-[#0B1F3A]/60 text-sm">
                                    Adicionar Imagem
                                  </p>
                                </div>
                              )}
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                  
                  <p className="text-sm text-[#0B1F3A]/60">
                    Adicione até 5 imagens para mostrar diferentes ângulos do produto
                  </p>
                </div>
              </div>
            </DragDropContext>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-[#0B1F3A]/10">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsCreating(false);
              }}
              className="px-6 py-3 text-lg border-2 border-[#0B1F3A]/20 rounded-xl hover:bg-[#F4F1EC] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 text-lg bg-[#0B1F3A] text-white rounded-xl hover:bg-[#0B1F3A]/90 transition-colors disabled:opacity-70 flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  Salvando...
                </>
              ) : (
                selectedProduct ? 'Atualizar Produto' : 'Criar Produto'
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Lista de produtos
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-belleza text-[#0B1F3A]">Produtos</h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B1F3A] text-white rounded-xl hover:bg-[#0B1F3A]/90 transition-all"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {/* Busca de produtos */}
      <div className="relative mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar produtos..."
          className="w-full px-4 py-3 pl-10 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50"
        />
        <Search className="absolute left-3 top-3.5 text-[#0B1F3A]/40" size={20} />
      </div>

      {isProductsLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B1F3A] mx-auto mb-4"></div>
          <p className="text-[#0B1F3A]/70">Carregando produtos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="p-8 text-center bg-[#F4F1EC]/50 rounded-xl">
          <p className="text-[#0B1F3A]/70">Nenhum produto cadastrado.</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#0B1F3A] text-white rounded-xl hover:bg-[#0B1F3A]/90 transition-all"
          >
            <Plus size={20} />
            Criar Primeiro Produto
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleProductDragEnd}>
          <div className="space-y-6">
            {categories.map(category => {
              const categoryProducts = groupedProducts[category.id] || [];
              if (categoryProducts.length === 0 && searchTerm) return null;
              
              return (
                <div key={category.id} className="border border-[#0B1F3A]/10 rounded-xl overflow-hidden">
                  <div 
                    className="bg-[#F4F1EC]/70 p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleCategoryExpansion(category.id)}
                  >
                    <h3 className="font-belleza text-xl text-[#0B1F3A]">
                      {category.name} <span className="text-sm font-normal">({categoryProducts.length} produtos)</span>
                    </h3>
                    <button className="p-2 hover:bg-[#F4F1EC] rounded-full">
                      {expandedCategories[category.id] ? (
                        <ChevronUp size={20} className="text-[#0B1F3A]/60" />
                      ) : (
                        <ChevronDown size={20} className="text-[#0B1F3A]/60" />
                      )}
                    </button>
                  </div>
                  
                  {expandedCategories[category.id] && (
                    <Droppable droppableId={category.id}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="divide-y divide-[#0B1F3A]/10"
                        >
                          {categoryProducts.length === 0 ? (
                            <div className="p-4 text-center text-[#0B1F3A]/60">
                              Nenhum produto nesta categoria
                            </div>
                          ) : (
                            categoryProducts.map((product, index) => (
                              <Draggable
                                key={product.id}
                                draggableId={product.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center p-4 hover:bg-[#F4F1EC]/30 transition-colors ${
                                      snapshot.isDragging ? 'bg-[#F4F1EC] shadow-lg' : ''
                                    }`}
                                  >
                                    <div
                                      {...provided.dragHandleProps}
                                      className="p-2 cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical size={20} className="text-[#0B1F3A]/40" />
                                    </div>
                                    
                                    <div className="h-16 w-16 bg-white rounded-xl overflow-hidden flex-shrink-0 mr-4">
                                      {product.main_image ? (
                                        <img
                                          src={product.main_image}
                                          alt={product.name}
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#F4F1EC]">
                                          <span className="text-[#0B1F3A]/40 text-xs">Sem imagem</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-[#0B1F3A] truncate">{product.name}</h4>
                                      <p className="text-[#0B1F3A]/60 text-sm truncate">{product.description}</p>
                                    </div>
                                    
                                    <div className="text-right flex-shrink-0 ml-4">
                                      <p className="font-medium text-[#0B1F3A]">
                                        {product.price ? `R$ ${Number(product.price).toFixed(2)}` : "Sob consulta"}
                                      </p>
                                      {product.is_featured && (
                                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Destacado</span>
                                      )}
                                    </div>
                                    
                                    <div className="flex ml-4 gap-2">
                                      <button
                                        onClick={() => handleEditProduct(product)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                        title="Editar produto"
                                      >
                                        <Edit size={20} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                        title="Excluir produto"
                                      >
                                        <Trash2 size={20} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )}
                </div>
              );
            })}
            
            {/* Produtos sem categoria */}
            {groupedProducts["sem_categoria"] && groupedProducts["sem_categoria"].length > 0 && (
              <div className="border border-[#0B1F3A]/10 rounded-xl overflow-hidden">
                <div 
                  className="bg-[#F4F1EC]/70 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleCategoryExpansion("sem_categoria")}
                >
                  <h3 className="font-belleza text-xl text-[#0B1F3A]">
                    Sem categoria <span className="text-sm font-normal">({groupedProducts["sem_categoria"].length} produtos)</span>
                  </h3>
                  <button className="p-2 hover:bg-[#F4F1EC] rounded-full">
                    {expandedCategories["sem_categoria"] ? (
                      <ChevronUp size={20} className="text-[#0B1F3A]/60" />
                    ) : (
                      <ChevronDown size={20} className="text-[#0B1F3A]/60" />
                    )}
                  </button>
                </div>
                
                {expandedCategories["sem_categoria"] && (
                  <Droppable droppableId="sem_categoria">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="divide-y divide-[#0B1F3A]/10"
                      >
                        {groupedProducts["sem_categoria"].map((product, index) => (
                          <Draggable
                            key={product.id}
                            draggableId={product.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center p-4 hover:bg-[#F4F1EC]/30 transition-colors ${
                                  snapshot.isDragging ? 'bg-[#F4F1EC] shadow-lg' : ''
                                }`}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="p-2 cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical size={20} className="text-[#0B1F3A]/40" />
                                </div>
                                
                                <div className="h-16 w-16 bg-white rounded-xl overflow-hidden flex-shrink-0 mr-4">
                                  {product.main_image ? (
                                    <img
                                      src={product.main_image}
                                      alt={product.name}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#F4F1EC]">
                                      <span className="text-[#0B1F3A]/40 text-xs">Sem imagem</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-[#0B1F3A] truncate">{product.name}</h4>
                                  <p className="text-[#0B1F3A]/60 text-sm truncate">{product.description}</p>
                                </div>
                                
                                <div className="text-right flex-shrink-0 ml-4">
                                  <p className="font-medium text-[#0B1F3A]">
                                    {product.price ? `R$ ${Number(product.price).toFixed(2)}` : "Sob consulta"}
                                  </p>
                                </div>
                                
                                <div className="flex ml-4 gap-2">
                                  <button
                                    onClick={() => handleEditProduct(product)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                    title="Editar produto"
                                  >
                                    <Edit size={20} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                    title="Excluir produto"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            )}
          </div>
        </DragDropContext>
      )}
      {!isCreating && hasOrderChanges && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={saveProductOrder}
            disabled={isSavingOrder}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition-all"
          >
            {isSavingOrder ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Salvando ordem...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Salvar nova ordem</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
