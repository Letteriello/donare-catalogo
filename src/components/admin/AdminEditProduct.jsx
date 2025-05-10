import { useState, useEffect, useCallback } from 'react';
import PropTypes from "prop-types";
import { Dialog, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { useProductDraftStore } from '@/stores/useProductDraftStore';
import { ProductForm } from '../productForm/ProductForm'; // Main component for product editing

import { Product, Category } from "@/api/entities";
import { X, Plus, Loader2, Search, GripVertical, ChevronDown, ChevronUp, Camera, Save, Edit, Trash2 } from "lucide-react";
// import { UploadFile } from "@/api/integrations"; // Uploads handled by ProductForm
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";

export default function AdminEditProduct({ onSave, onCancel }) {
  // Zustand store hooks
  const draft = useProductDraftStore((state) => state.draft);
  const setDraft = useProductDraftStore((state) => state.setDraft);
  // resetDraft is not explicitly selected here anymore as the component primarily
  // uses setDraft(initialDraftStateFromStore) for its reset logic.
  // This change prevents the selector from returning a new object reference
  // on each render, which was the likely cause of the infinite re-render loop.
  const initialDraftStateFromStore = useProductDraftStore.getState().initialDraft;


  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // For main save operation
  const [isProductsLoading, setIsProductsLoading] = useState(true); // For product list loading
  const [isCreating, setIsCreating] = useState(false); // Controls visibility of ProductForm vs. ProductList
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [categories, setCategories] = useState([]);

  // States for BaseProductNameModal (if kept separate from ProductForm)
  const [isBaseProductNameModalOpen, setIsBaseProductNameModalOpen] = useState(false);
  const [allBaseProductNames, setAllBaseProductNames] = useState([]);
  const [newBaseProductName, setNewBaseProductName] = useState("");


  const loadUniqueBaseProductNames = useCallback((productsList) => {
    if (productsList && productsList.length > 0) {
      const uniqueNames = new Set();
      productsList.forEach(product => {
        if (product.baseProductName && product.baseProductName.trim() !== "") {
          uniqueNames.add(product.baseProductName.trim());
        }
      });
      setAllBaseProductNames(Array.from(uniqueNames).sort());
    } else {
      setAllBaseProductNames([]);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setIsProductsLoading(true);
    try {
      const fetchedProducts = await Product.list();
      setProducts(fetchedProducts);
      loadUniqueBaseProductNames(fetchedProducts);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      toast({ title: "Erro", description: "Falha ao carregar produtos.", variant: "destructive" });
    } finally {
      setIsProductsLoading(false);
    }
  }, [loadUniqueBaseProductNames]);

  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await Category.list();
      setCategories(categoriesData);
      const initialExpandedState = {};
      categoriesData.forEach(cat => {
        initialExpandedState[cat.id] = true;
      });
      setExpandedCategories(initialExpandedState);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
      toast({ title: "Erro", description: "Falha ao carregar categorias.", variant: "destructive" });
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  const handleSubmitProductForm = async () => {
    setIsLoading(true);
    // setError(""); // No longer needed with toast notifications
    try {
      // The `draft` from Zustand store is the source of truth
      const payload = {
        ...draft,
        keywords: Array.isArray(draft.keywords) ? draft.keywords.join(', ') : draft.keywords,
        // Variants are already in the correct structure in the store via ProductForm
      };

      if (draft.id) {
        await Product.update(draft.id, payload);
      } else {
        // Create new product and get its ID to update the draft in store?
        // Or rely on ProductForm to generate a temporary ID if needed for UI consistency.
        // For now, assume Product.create handles ID generation server-side.
        await Product.create(payload);
      }
      await loadProducts(); // Refresh product list
      
      // Reset form:
      // Option 1: If resetDraft is a specific action in the store
      // resetDraft(); 
      // Option 2: Reset to the store's defined initial state
      if (initialDraftStateFromStore) {
        setDraft(initialDraftStateFromStore);
      } else {
        // Fallback if initialDraftStateFromStore is not available (should be configured in store)
        console.warn("Initial draft state from store is undefined. Resetting to a basic empty draft.");
        setDraft({
          id: null, baseName: '', categoryId: '', material: '', dimensions: '', description: '',
          variants: [], status: 'draft', seoTitle: '', seoDescription: '', keywords: []
        });
      }

      setIsCreating(false); // Go back to product list view
      if (onSave) onSave(); // Prop callback
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      toast({ title: "Erro ao salvar produto", description: err.message || "Por favor, tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  const handleEditProduct = (productToEdit) => {
    const mainImage = productToEdit.main_image || null;
    const galleryImages = productToEdit.gallery || [];
    const uniqueGalleryImages = galleryImages.map(String).filter(img => img !== mainImage);
    const allVariantImages = mainImage ? [String(mainImage), ...uniqueGalleryImages] : uniqueGalleryImages;

    // Transform to the ProductDraft structure expected by the store and ProductForm
    const transformedDraft = {
      id: productToEdit.id || null, // Keep null if it's a new product based on an old one
      baseName: productToEdit.baseProductName || productToEdit.name || "",
      categoryId: productToEdit.categoryId || productToEdit.category || "",
      categoryName: productToEdit.categoryName || "", // if available from productToEdit
      material: productToEdit.materials || "",
      dimensions: productToEdit.dimensions || "",
      description: productToEdit.description || "",
      variants: productToEdit.variants && productToEdit.variants.length > 0 ? productToEdit.variants.map(v => ({
        id: v.id || uuidv4(),
        color: v.color || "Cor Única",
        hex: v.hexColor || "",
        images: v.images || [], // Ensure images is an array
        retail: parseFloat(v.priceRetail || v.retailPrice || 0),
        wholesale: parseFloat(v.priceWholesale || v.wholesalePrice || 0),
        sku: v.sku || "",
        seoTitle: v.seoTitle || "",
        seoDescription: v.seoDescription || "",
        keywords: Array.isArray(v.keywords) ? v.keywords : (v.keywords ? String(v.keywords).split(',').map(k => k.trim()).filter(k => k) : []),
      })) : [{ // Default variant if none exists in productToEdit
        id: uuidv4(),
        color: productToEdit.color || "Cor Única",
        hex: productToEdit.hexColor || "",
        images: allVariantImages,
        retail: parseFloat(productToEdit.priceRetail || productToEdit.price || 0),
        wholesale: parseFloat(productToEdit.priceWholesale || 0),
        sku: productToEdit.sku || "",
        seoTitle: "",
        seoDescription: "",
        keywords: [],
      }],
      status: productToEdit.status || 'draft',
      seoTitle: productToEdit.metaTitle || productToEdit.seoTitle || "",
      seoDescription: productToEdit.metaDescription || productToEdit.seoDescription || "",
      keywords: Array.isArray(productToEdit.keywords)
                ? productToEdit.keywords
                : (productToEdit.keywords ? String(productToEdit.keywords).split(',').map(k => k.trim()).filter(k => k) : []),
      // old fields that might not be in ProductDraft:
      // whatsapp_link: productToEdit.whatsapp_link || "",
      // careInstructions: productToEdit.careInstructions || "",
      // story: productToEdit.story || "",
      // is_new: productToEdit.is_new || false,
      // is_limited: productToEdit.is_limited || false,
      // is_featured: productToEdit.is_featured || false,
    };
    setDraft(transformedDraft);
    setIsCreating(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await Product.delete(productId);
        await loadProducts(); // Refresh list
      } catch (err) {
        console.error("Erro ao excluir produto:", err);
        toast({ title: "Erro", description: "Falha ao excluir produto.", variant: "destructive" });
      }
    }
  };

  const handleCreateNewProduct = () => {
    // Reset draft in store to its initial state before showing the form
    if (initialDraftStateFromStore) {
      setDraft(initialDraftStateFromStore);
    } else {
      // Fallback if initialDraftStateFromStore is not available
      setDraft({
        id: null, baseName: '', categoryId: '', material: '', dimensions: '', description: '',
        variants: [], status: 'draft', seoTitle: '', seoDescription: '', keywords: []
      });
    }
    setIsCreating(true);
  };
  
  const formatCategoryName = (categoryId) => {
    if (!categoryId || !categories) return 'N/A';
    const foundCategory = categories.find(cat => cat.id === categoryId);
    return foundCategory ? foundCategory.name : 'Categoria Desconhecida';
  };

  const filteredProducts = products.filter(product => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (product.name && product.name.toLowerCase().includes(searchTermLower)) ||
      (product.description && product.description.toLowerCase().includes(searchTermLower)) ||
      ((product.categoryId || product.category) && formatCategoryName(product.categoryId || product.category).toLowerCase().includes(searchTermLower))
    );
  });

  const groupedProducts = {};
  filteredProducts.forEach(product => {
    const categoryId = product.categoryId || product.category || "sem_categoria";
    if (!groupedProducts[categoryId]) {
      groupedProducts[categoryId] = [];
    }
    groupedProducts[categoryId].push(product);
  });

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Drag and drop for product reordering in the list
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const handleProductDragEnd = (result) => {
    if (!result.destination) return;
    
    const sourceCategoryId = result.source.droppableId;
    const destCategoryId = result.destination.droppableId;
    
    let movedProduct;

    // Find and remove product from source
    const sourceCatProducts = groupedProducts[sourceCategoryId];
    if (sourceCatProducts) {
        movedProduct = sourceCatProducts.splice(result.source.index, 1)[0];
    }

    if (!movedProduct) return;

    // Update product's categoryId if moved to a different category
    if (sourceCategoryId !== destCategoryId && destCategoryId !== "sem_categoria") {
        movedProduct.categoryId = destCategoryId;
    } else if (destCategoryId === "sem_categoria") {
        movedProduct.categoryId = null; // Or handle as per your DB schema for "sem_categoria"
    }
    
    // Add product to destination
    const destCatProducts = groupedProducts[destCategoryId];
    if (destCatProducts) {
        destCatProducts.splice(result.destination.index, 0, movedProduct);
    } else if (destCategoryId) { // New category for the product (should not happen if only reordering existing cats)
        groupedProducts[destCategoryId] = [movedProduct];
    }
    
    // Reconstruct the flat products array from groupedProducts to reflect new order and category changes
    let updatedFlatProducts = [];
    Object.keys(groupedProducts).forEach(catId => {
        updatedFlatProducts = updatedFlatProducts.concat(groupedProducts[catId]);
    });
    
    setProducts(updatedFlatProducts);
    setHasOrderChanges(true);
  };

  const saveProductOrder = async () => {
    setIsSavingOrder(true);
    try {
      const updatePromises = products.map((product, index) => {
        // Assuming each product in the flat `products` array now has its correct categoryId
        // and its position in this array is its new global order (if you use global order).
        // Or, if order is per-category, this logic needs to be more complex,
        // iterating through groupedProducts.
        // For simplicity, let's assume display_order is global or you adapt Product.update.
        return Product.update(product.id, { 
            display_order: index, 
            categoryId: product.categoryId // Ensure categoryId is also updated if changed
        });
      });
      await Promise.all(updatePromises);
      setHasOrderChanges(false);
      await loadProducts(); // Refresh to confirm
    } catch (err) {
      console.error("Erro ao salvar ordem dos produtos:", err);
      toast({ title: "Erro", description: "Falha ao salvar a ordem dos produtos.", variant: "destructive" });
    } finally {
      setIsSavingOrder(false);
    }
  };


  // UI Rendering
  if (isCreating) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-belleza text-[#0B1F3A]">
            {draft.id ? "Editar Produto" : "Novo Produto"}
          </h2>
          <button
            onClick={() => {
              setIsCreating(false);
              // Optionally reset draft if user cancels editing an existing product without saving
              // resetDraft(); // Or setDraft(initialDraftStateFromStore)
            }}
            className="text-[#0B1F3A]/60 hover:text-[#0B1F3A] p-2 rounded-full hover:bg-[#F4F1EC]"
          >
            <X size={28} />
          </button>
        </div>

        {/* Error messages are now handled by toast notifications */}
        
        {/* ------ ProductForm Integration ------ */}
        <ProductForm /> 
        {/* ProductForm uses Zustand store, so it will have the current draft */}
        {/* It has its own Save Draft and Publish buttons. We need to decide how they integrate. */}
        {/* For now, AdminEditProduct will have its own save button that calls handleSubmitProductForm */}
        
        <div className="flex flex-col sm:flex-row sm:justify-end gap-4 pt-6 mt-6 border-t border-[#0B1F3A]/10">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreating(false);
              // resetDraft(); // Or setDraft(initialDraftStateFromStore)
            }}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
        </div>
        {/* Modal para Gerenciar Nomes Base do Produto - If this logic is specific to AdminEditProduct and not ProductForm */}
        <Dialog open={isBaseProductNameModalOpen} onOpenChange={setIsBaseProductNameModalOpen}>
            <DialogContent className="sm:max-w-[525px] bg-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-belleza text-[#0B1F3A]">Gerenciar Nomes Base</DialogTitle>
                    <DialogDescription>
                        Selecione um nome base existente ou adicione um novo.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#0B1F3A]">Adicionar Novo Nome Base</label>
                        <div className="flex gap-2">
                            <Input
                                value={newBaseProductName}
                                onChange={(e) => setNewBaseProductName(e.target.value)}
                                placeholder="Ex: Jogo Americano Rendado"
                                className="border-[#0B1F3A]/20 focus:ring-[#0B1F3A]/50 flex-grow"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="border-[#0B1F3A] text-[#0B1F3A] hover:bg-[#0B1F3A]/10"
                                onClick={() => {
                                    if (newBaseProductName.trim() && !allBaseProductNames.includes(newBaseProductName.trim())) {
                                        const updatedNames = [...allBaseProductNames, newBaseProductName.trim()].sort();
                                        setAllBaseProductNames(updatedNames);
                                        // Here, instead of dispatching, we'd call the store action directly
                                        // setBaseName(newBaseProductName.trim()); // Assuming useProductDraftStore has setBaseName
                                        useProductDraftStore.getState().setBaseName(newBaseProductName.trim());
                                        setNewBaseProductName("");
                                        // setIsBaseProductNameModalOpen(false); // Optional
                                    }
                                }}
                                disabled={!newBaseProductName.trim() || allBaseProductNames.includes(newBaseProductName.trim())}
                            >
                                <Plus size={18} className="mr-2" /> Adicionar
                            </Button>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#0B1F3A]">Nomes Base Existentes</label>
                        <ScrollArea className="h-[200px] w-full rounded-md border border-[#0B1F3A]/20 p-3">
                            {allBaseProductNames.length > 0 ? (
                                allBaseProductNames.map((name) => (
                                    <div
                                        key={name}
                                        onClick={() => {
                                            // setBaseName(name); // Assuming useProductDraftStore has setBaseName
                                            useProductDraftStore.getState().setBaseName(name);
                                            setIsBaseProductNameModalOpen(false);
                                        }}
                                        className={`p-2 hover:bg-[#F4F1EC] rounded-md cursor-pointer text-sm transition-colors ${
                                            draft.baseName === name ? "bg-[#E0DACE] text-[#0B1F3A] font-semibold" : "text-[#0B1F3A]/80"
                                        }`}
                                    >
                                        {name}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-center text-[#0B1F3A]/50 py-4">Nenhum nome base.</p>
                            )}
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                            Fechar
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Product List View
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-belleza text-[#0B1F3A]">Produtos</h2>
        <button
          onClick={handleCreateNewProduct}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 text-sm sm:text-base bg-[#0B1F3A] text-white rounded-xl hover:bg-[#0B1F3A]/90 transition-all"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <div className="relative mb-6">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, descrição ou categoria..."
          className="w-full px-4 py-3 pl-10 border border-[#0B1F3A]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/50"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#0B1F3A]/40" />
      </div>

      {hasOrderChanges && (
        <div className="mb-6 flex justify-end">
          <Button
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
          </Button>
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
              const categoryName = categoryId === "sem_categoria" ? "Sem Categoria" : formatCategoryName(categoryId);
              const isExpanded = expandedCategories[categoryId];

              return (
                <div key={categoryId} className="bg-[#FDFBF8] rounded-xl p-4 shadow-sm">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleCategoryExpansion(categoryId)}
                  >
                    <h3 className="text-lg font-belleza text-[#0B1F3A]">{categoryName} {categoryId !== "sem_categoria" && categoryName !== 'Categoria Desconhecida' ? `(${categoryProducts.length})` : ''}</h3>
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
                                  {(providedDraggable, snapshot) => ( // Renamed provided for clarity
                                    <div
                                      ref={providedDraggable.innerRef}
                                      {...providedDraggable.draggableProps}
                                      className={`flex items-start gap-3 p-3 bg-white rounded-lg shadow-md transition-shadow ${
                                        snapshot.isDragging ? 'shadow-xl' : ''
                                      }`}
                                    >
                                      <div
                                        {...providedDraggable.dragHandleProps} // Use renamed providedDraggable
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
                                          Preço: {product.priceRetail ? `R$ ${Number(product.priceRetail).toFixed(2)}` : (product.price ? `R$ ${Number(product.price).toFixed(2)}` : 'Sob consulta')}
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
                      setSearchTerm(""); 
                      handleCreateNewProduct(); // Use the refactored handler
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
