import { useState, useEffect } from "react";
import PropTypes from "prop-types"; // Added import
import { Product } from "@/api/entities";
import { Category } from "@/api/entities";
import { X, Plus, Loader2, Upload, Trash2, Edit, Search, GripVertical, ChevronDown, ChevronUp, Camera, Save } from "lucide-react";
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
    category: "", // This is categoryId
    subcategory: "",
    options: [],
    priceRetail: "", // Renamed from price
    priceWholesale: "", // New field
    dimensions: { // New field group
      height: "",
      width: "",
      length: ""
    },
    whatsapp_link: "",
    is_new: false,
    is_limited: false,
    is_featured: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [error, setError] = useState("");
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
      
      // Convert retail price
      if (productData.priceRetail === "" || productData.priceRetail === undefined) {
        productData.priceRetail = null;
      } else {
        productData.priceRetail = Number(productData.priceRetail);
      }

      // Convert wholesale price
      if (productData.priceWholesale === "" || productData.priceWholesale === undefined) {
        productData.priceWholesale = null;
      } else {
        productData.priceWholesale = Number(productData.priceWholesale);
      }

      // Convert dimensions, ensuring the dimensions object exists
      productData.dimensions = productData.dimensions || {};
      const { height, width, length } = productData.dimensions;

      productData.dimensions.height = (height === "" || height === undefined) ? null : Number(height);
      productData.dimensions.width = (width === "" || width === undefined) ? null : Number(width);
      productData.dimensions.length = (length === "" || length === undefined) ? null : Number(length);

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
      category: product.category || "", // This is categoryId
      subcategory: product.subcategory || "",
      options: product.options || [],
      priceRetail: product.priceRetail || product.price || "", // Fallback to old 'price' field if priceRetail is missing
      priceWholesale: product.priceWholesale || "",
      dimensions: {
        height: product.dimensions?.height || "",
        width: product.dimensions?.width || "",
        length: product.dimensions?.length || ""
      },
      whatsapp_link: product.whatsapp_link || "",
      is_new: product.is_new || false,
      is_limited: product.is_limited || false,
      is_featured: product.is_featured || false
    });
    setIsCreating(true);
  };

  // Modificar o componente de upload de imagem para suportar câmera
  const ImageUploadButton = ({ id, onUpload, disabled }) => (
    <div className="flex flex-col sm:flex-row gap-2">
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

ImageUploadButton.propTypes = {
  id: PropTypes.string.isRequired,
  onUpload: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

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
      category: "", // This is categoryId
      subcategory: "",
      options: [],
      priceRetail: "",
      priceWholesale: "",
      dimensions: {
        height: "",
        width: "",
        length: ""
      },
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
    
    const [sourceCategoryId] = result.source.droppableId.split('-');
    const [destCategoryId] = result.destination.droppableId.split('-');
    
    
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
      
      const response = await UploadFile({ file, path: 'products' });
      
      clearInterval(interval);
      setImageProgress(100);
      
      const file_url = response.file_url;
      
      if (type === "main") {
        setFormData(prev => ({ ...prev, main_image: file_url }));
      } else {
        setFormData(prev => ({ ...prev, gallery: [...prev.gallery, file_url] }));
      }
    } catch (error) {
      console.error("Upload error:", error);
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
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-belleza text-[#0B1F3A]">
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
                  className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-base sm:text-lg"
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
                  className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-base sm:text-lg"
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
                  className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-base sm:text-lg"
                />
              </div>
            </div>

            {/* New section for Dimensions */}
            <div>
              <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                Dimensões (cm)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="dimensionHeight" className="block text-xs font-medium text-[#0B1F3A]/80 mb-1">Altura</label>
                  <input
                    type="number"
                    name="dimensionHeight"
                    id="dimensionHeight"
                    value={formData.dimensions.height}
                    onChange={(e) => setFormData({...formData, dimensions: { ...formData.dimensions, height: e.target.value }})}
                    step="0.1"
                    className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-base sm:text-lg"
                    placeholder="Ex: 10.5"
                  />
                </div>
                </div>
                <div>
                  <label htmlFor="dimensionWidth" className="block text-xs font-medium text-[#0B1F3A]/80 mb-1">Largura</label>
                  <input
                    type="number"
                    name="dimensionWidth"
                    id="dimensionWidth"
                    value={formData.dimensions.width}
                    onChange={(e) => setFormData({...formData, dimensions: { ...formData.dimensions, width: e.target.value }})}
                    step="0.1"
                    className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-base sm:text-lg"
                    placeholder="Ex: 15.0"
                  />
                </div>
                <div>
                  <label htmlFor="dimensionLength" className="block text-xs font-medium text-[#0B1F3A]/80 mb-1">Comprimento</label>
                  <input
                    type="number"
                    name="dimensionLength"
                    id="dimensionLength"
                    value={formData.dimensions.length}
                    onChange={(e) => setFormData({...formData, dimensions: { ...formData.dimensions, length: e.target.value }})}
                    step="0.1"
                    className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-base sm:text-lg"
                    placeholder="Ex: 20.2"
                  />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                    Categoria *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-base sm:text-lg"
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
                    Preço Varejo (R$)
                  </label>
                  <input
                    type="number"
                    name="priceRetail"
                    value={formData.priceRetail}
                    onChange={(e) => setFormData({...formData, priceRetail: e.target.value})}
                    step="0.01"
                    className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-base sm:text-lg"
                    placeholder="Ex: 29.90"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                    Preço Atacado (R$)
                  </label>
                  <input
                    type="number"
                    name="priceWholesale"
                    value={formData.priceWholesale}
                    onChange={(e) => setFormData({...formData, priceWholesale: e.target.value})}
                    step="0.01"
                    className="w-full px-4 py-3 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50 text-base sm:text-lg"
                    placeholder="Ex: 19.90"
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
                        <div className="flex flex-col sm:flex-row sm:items-center w-full">
                        {formData.main_image ? (
                          <Draggable
                            draggableId="main-image-draggable" // Changed to avoid conflict with droppableId
                            index={0}
                          >
                            {(providedDraggable, snapshot) => ( // Renamed to avoid conflict with outer 'provided'
                              <div
                                ref={providedDraggable.innerRef}
                                {...providedDraggable.draggableProps}
                                {...providedDraggable.dragHandleProps}
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
                        </div>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {!formData.main_image && (
                    <div className="relative">
                      <ImageUploadButton
                        id="main_image"
                        onUpload={(e) => handleImageUpload(e, "main")}
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

          <div className="flex flex-col sm:flex-row sm:justify-end gap-4 pt-6 border-t border-[#0B1F3A]/10">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsCreating(false);
              }}
              className="w-full sm:w-auto px-4 py-2 text-base sm:px-6 sm:py-3 sm:text-lg border-2 border-[#0B1F3A]/20 rounded-xl hover:bg-[#F4F1EC] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 text-base sm:px-6 sm:py-3 sm:text-lg bg-[#0B1F3A] text-white rounded-xl hover:bg-[#0B1F3A]/90 transition-colors disabled:opacity-70 flex items-center justify-center sm:justify-start"
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
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-belleza text-[#0B1F3A]">Produtos</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 text-sm sm:text-base bg-[#0B1F3A] text-white rounded-xl hover:bg-[#0B1F3A]/90 transition-all"
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
          placeholder="Buscar por nome, descrição ou categoria..."
          className="w-full px-4 py-3 pl-10 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#0B1F3A]/40" />
      </div>

      {/* Botão Salvar Ordem */}
      {hasOrderChanges && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={saveProductOrder}
            disabled={isSavingOrder}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            {isSavingOrder ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                Salvando Ordem...
              </>
            ) : (
              <>
                <Save size={18} />
                Salvar Ordem dos Produtos
              </>
            )}
          </button>
        </div>
      )}

      {isProductsLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="animate-spin w-10 h-10 text-[#0B1F3A]" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleProductDragEnd}>
          <div className="space-y-6">
            {Object.entries(groupedProducts).map(([categoryId, categoryProducts]) => {
              const categoryName = categoryId === "sem_categoria" ? "Sem Categoria" : formatCategory(categoryId);
              const isExpanded = expandedCategories[categoryId];

              return (
                <div key={categoryId} className="bg-[#FDFBF8] rounded-xl p-4 shadow-sm">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleCategoryExpansion(categoryId)}
                  >
                    <h3 className="text-lg font-belleza text-[#0B1F3A]">{categoryName} {categoryId !== "sem_categoria" && categoryName !== 'Categoria não encontrada' ? `(${categoryProducts.length})` : ''}</h3>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <Droppable droppableId={categoryId} type="PRODUCT">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="mt-4 space-y-3"
                            >
                              {categoryProducts.map((product, index) => (
                                <Draggable key={product.id} draggableId={product.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`flex items-start gap-3 p-3 bg-white rounded-lg shadow-md transition-shadow ${
                                        snapshot.isDragging ? 'shadow-xl' : ''
                                      }`}
                                    >
                                      <div
                                        {...provided.dragHandleProps}
                                        className="p-1.5 text-[#0B1F3A]/50 hover:text-[#0B1F3A] cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical size={20} />
                                      </div>
                                      
                                      <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-[#F4F1EC]">
                                        {product.main_image ? (
                                          <img
                                            src={product.main_image}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[#0B1F3A]/30">
                                            <Camera size={32} />
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex-grow min-w-0">
                                        <h4 className="text-base font-semibold text-[#0B1F3A] truncate">{product.name}</h4>
                                        <p className="text-sm text-[#0B1F3A]/70 truncate">{product.description}</p>
                                        <p className="text-xs text-[#0B1F3A]/50">
                                          Preço: {product.price ? `R$ ${Number(product.price).toFixed(2)}` : 'Sob consulta'}
                                        </p>
                                      </div>
                                      
                                      <div className="flex flex-col sm:flex-row gap-2 items-center">
                                        <button
                                          onClick={() => handleEditProduct(product)}
                                          className="p-2 text-[#0B1F3A]/70 hover:text-[#0B1F3A] hover:bg-[#F4F1EC] rounded-full transition-colors"
                                          title="Editar Produto"
                                        >
                                          <Edit size={20} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteProduct(product.id)}
                                          className="p-2 text-red-500/70 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                          title="Excluir Produto"
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            
            {Object.keys(groupedProducts).length === 0 && !isProductsLoading && (
              <div className="text-center py-10 text-[#0B1F3A]/60">
                <p className="mb-2 text-lg">Nenhum produto encontrado.</p>
                <p className="text-sm">
                  {searchTerm ? "Tente refinar sua busca ou " : ""}
                  <button
                    onClick={() => {
                      setSearchTerm(""); // Limpar busca
                      setIsCreating(true); // Abrir formulário de novo produto
                    }}
                    className="text-[#0B1F3A] hover:underline font-semibold"
                  >
                    adicione um novo produto
                  </button>.
                </p>
              </div>
            )}
          </div>
        </DragDropContext>
      )}

      {/* Botão de Cancelar (caso o usuário não queira salvar a ordem) */}
      {onCancel && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-3 text-base border-2 border-[#0B1F3A]/20 rounded-xl hover:bg-[#F4F1EC] transition-colors"
          >
            Voltar
          </button>
        </div>
      )}
    </div>
  );
}
AdminEditProduct.propTypes = {
  onSave: PropTypes.func,
  onCancel: PropTypes.func
};
