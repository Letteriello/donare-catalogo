import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { useProductDraftStore } from '@/stores/useProductDraftStore';
import { PREDEFINED_COLORS } from "@/lib/predefinedColors";
import { ProductForm } from '../productForm/ProductForm';

import { Product, Category } from "@/api/entities";
import { X, Plus, Loader2, Search, GripVertical, ChevronDown, ChevronUp, Camera, Save, Edit, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "@/hooks/use-toast";

export default function AdminEditProduct() {
  // Zustand store hooks
  const draft = useProductDraftStore((state) => state.draft);
  const setDraft = useProductDraftStore((state) => state.setDraft);
  const initialDraftStateFromStore = useProductDraftStore.getState().initialDraft;

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Para operação de salvar
  const [isProductsLoading, setIsProductsLoading] = useState(true); // Para carregamento da lista
  const [isCreating, setIsCreating] = useState(false); // Controla visibilidade do formulário vs. lista
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [categories, setCategories] = useState([]);
  const initialLoadDone = useRef(false);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsProductsLoading(true);
    try {
      const fetchedProducts = await Product.list();
      setProducts(fetchedProducts);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      toast({ title: "Erro", description: "Falha ao carregar produtos.", variant: "destructive" });
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

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
    if (!initialLoadDone.current) {
      loadProducts();
      loadCategories();
      initialLoadDone.current = true;
    }
  }, [loadProducts, loadCategories]);

  const handleSubmitProductForm = async () => {
    setIsLoading(true);
    try {
      const payload = {
        ...draft,
        keywords: Array.isArray(draft.keywords) ? draft.keywords.join(', ') : draft.keywords,
      };

      if (draft.id) {
        await Product.update(draft.id, payload);
      } else {
        await Product.create(payload);
      }
      await loadProducts();

      if (initialDraftStateFromStore) {
        setDraft(initialDraftStateFromStore);
      } else {
        console.warn("Initial draft state from store is undefined. Resetting to a basic empty draft.");
        setDraft({
          id: null, baseName: '', categoryId: '', material: '', dimensions: '', description: '',
          variants: [], status: 'draft', seoTitle: '', seoDescription: '', keywords: []
        });
      }

      setIsCreating(false);
      toast({ title: "Sucesso", description: "Produto salvo com sucesso." });
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      toast({ title: "Erro", description: "Falha ao salvar produto.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (productToEdit) => {
    const transformedDraft = {
      id: productToEdit.id,
      name: productToEdit.name || "",
      baseName: productToEdit.baseName || productToEdit.name || "",
      baseProductName: productToEdit.baseProductName || "",
      categoryId: productToEdit.categoryId || productToEdit.category || "",
      material: productToEdit.material || "",
      dimensions: productToEdit.dimensions || "",
      description: productToEdit.description || "",
      variants: productToEdit.variants || [],
      status: productToEdit.status || "draft",
      main_image: productToEdit.main_image || "",
      seoTitle: productToEdit.seoTitle || productToEdit.name || "",
      seoDescription: productToEdit.seoDescription || productToEdit.description || "",
      price: productToEdit.price || 0,
      keywords: Array.isArray(productToEdit.keywords)
                ? productToEdit.keywords
                : (productToEdit.keywords ? String(productToEdit.keywords).split(',').map(k => k.trim()).filter(k => k) : []),
    };
    setDraft(transformedDraft);
    setIsCreating(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await Product.delete(productId);
        await loadProducts();
        toast({ title: "Sucesso", description: "Produto excluído com sucesso." });
      } catch (err) {
        console.error("Erro ao excluir produto:", err);
        toast({ title: "Erro", description: "Falha ao excluir produto.", variant: "destructive" });
      }
    }
  };

  const handleCreateNewProduct = () => {
    const defaultVariants = PREDEFINED_COLORS.map(colorObj => ({
      id: uuidv4(),
      color: colorObj.name,
      hex: colorObj.hex,
      images: [],
      retail: 0,
      wholesale: 0,
      sku: '',
    }));

    if (initialDraftStateFromStore) {
      setDraft({
        ...initialDraftStateFromStore,
        variants: defaultVariants
      });
    } else {
      setDraft({
        id: null, baseName: '', categoryId: '', material: '', dimensions: '', description: '',
        variants: defaultVariants,
        status: 'draft', seoTitle: '', seoDescription: '', keywords: []
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

  // Agrupar produtos por categoria
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

  const handleProductDragEnd = (result) => {
    if (!result.destination) return;

    const sourceCategoryId = result.source.droppableId;
    const destCategoryId = result.destination.droppableId;

    let movedProduct;

    const sourceCatProducts = groupedProducts[sourceCategoryId];
    if (sourceCatProducts) {
        movedProduct = sourceCatProducts.splice(result.source.index, 1)[0];
    }

    if (!movedProduct) return;

    if (sourceCategoryId !== destCategoryId && destCategoryId !== "sem_categoria") {
        movedProduct.categoryId = destCategoryId;
    } else if (destCategoryId === "sem_categoria") {
        movedProduct.categoryId = null;
    }

    const destCatProducts = groupedProducts[destCategoryId];
    if (destCatProducts) {
        destCatProducts.splice(result.destination.index, 0, movedProduct);
    } else if (destCategoryId) {
        groupedProducts[destCategoryId] = [movedProduct];
    }

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
        return Product.update(product.id, {
            display_order: index,
            categoryId: product.categoryId
        });
      });
      await Promise.all(updatePromises);
      setHasOrderChanges(false);
      await loadProducts();
      toast({ title: "Sucesso", description: "Ordem dos produtos salva com sucesso." });
    } catch (err) {
      console.error("Erro ao salvar ordem dos produtos:", err);
      toast({ title: "Erro", description: "Falha ao salvar a ordem dos produtos.", variant: "destructive" });
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Interface de criação/edição de produto
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
            }}
            className="text-[#0B1F3A]/60 hover:text-[#0B1F3A] p-2 rounded-full hover:bg-[#F4F1EC]"
          >
            <X size={28} />
          </button>
        </div>

        <ProductForm />

        <div className="flex flex-col sm:flex-row sm:justify-end gap-4 pt-6 mt-6 border-t border-[#0B1F3A]/10">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmitProductForm}
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#0B1F3A] text-white hover:bg-[#0B1F3A]/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Produto'
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Interface de lista de produtos
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      {/* Cabeçalho da página */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-belleza">Gerenciar Produtos</h2>
        {hasOrderChanges && (
          <Button 
            onClick={saveProductOrder}
            variant="outline"
            className="text-[#0B1F3A] border-[#0B1F3A]/20 hover:bg-[#0B1F3A]/5"
            disabled={isProductsLoading || isSavingOrder}
          >
            {isSavingOrder ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Ordem
              </>
            )}
          </Button>
        )}
      </div>

      {/* Área de busca e botão de novo produto */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0B1F3A]/50" />
        </div>
        <Button 
          onClick={handleCreateNewProduct}
          className="bg-[#0B1F3A] text-white hover:bg-[#0B1F3A]/90 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Estado de carregamento */}
      {isProductsLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="animate-spin w-10 h-10 text-[#0B1F3A]" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleProductDragEnd}>
          <div className="space-y-6">
            {/* Lista de produtos por categoria */}
            {Object.entries(groupedProducts).map(([categoryId, categoryProducts]) => {
              const categoryName = categoryId === "sem_categoria" ? "Sem Categoria" : formatCategoryName(categoryId);
              const isExpanded = expandedCategories[categoryId];

              return (
                <div key={categoryId} className="bg-[#FDFBF8] rounded-xl p-4 shadow-sm mb-6">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleCategoryExpansion(categoryId)}
                  >
                    <h3 className="text-lg font-belleza text-[#0B1F3A]">
                      {categoryName} {categoryId !== "sem_categoria" && categoryName !== 'Categoria Desconhecida' ? `(${categoryProducts.length})` : ''}
                    </h3>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>

                  {isExpanded && (
                    <div className="overflow-x-auto mt-4">
                      <Droppable droppableId={categoryId} type="PRODUCT">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="min-w-full"
                          >
                            <table className="min-w-full divide-y divide-[#0B1F3A]/10 rounded-xl overflow-hidden">
                              <thead className="bg-[#F4F1EC]/50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#0B1F3A]/70 uppercase tracking-wider w-10">
                                    Ordem
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#0B1F3A]/70 uppercase tracking-wider w-24">
                                    Imagem
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#0B1F3A]/70 uppercase tracking-wider">
                                    Nome
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#0B1F3A]/70 uppercase tracking-wider">
                                    Descrição
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#0B1F3A]/70 uppercase tracking-wider w-32">
                                    Ações
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-[#0B1F3A]/10">
                                {categoryProducts.map((product, index) => (
                                  <Draggable
                                    key={product.id}
                                    draggableId={String(product.id)}
                                    index={index}
                                  >
                                    {(providedDraggable, snapshot) => (
                                      <tr
                                        ref={providedDraggable.innerRef}
                                        {...providedDraggable.draggableProps}
                                        {...providedDraggable.dragHandleProps}
                                        className={`hover:bg-[#F4F1EC]/50 transition-colors ${
                                          snapshot.isDragging ? 'bg-[#F4F1EC] shadow-lg' : ''
                                        }`}
                                      >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center cursor-grab active:cursor-grabbing">
                                            <GripVertical size={20} className="text-[#0B1F3A]/40" />
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          {product.main_image ? (
                                            <img
                                              src={product.main_image}
                                              alt={product.name}
                                              className="h-16 w-16 rounded-xl object-cover"
                                            />
                                          ) : (
                                            <div className="h-16 w-16 rounded-xl bg-[#0B1F3A]/10 flex items-center justify-center">
                                              <Camera size={20} className="text-[#0B1F3A]/40" />
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0B1F3A]">
                                          {product.name || `Produto ${product.id.slice(0, 8)}`}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#0B1F3A]/70">
                                          <div className="max-w-xs truncate">
                                            {product.description || "Sem descrição"}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                          <div className="flex justify-end space-x-2">
                                            <button
                                              onClick={() => handleEditProduct(product)}
                                              className="p-2 bg-[#F4F1EC] text-blue-600 hover:text-blue-800 rounded-xl hover:bg-[#F4F1EC]/80 transition-colors"
                                            >
                                              <Edit size={20} />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteProduct(product.id)}
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
                        )}
                      </Droppable>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Mensagem quando não há produtos */}
            {Object.keys(groupedProducts).length === 0 && !isProductsLoading && (
              <div className="text-center py-10 text-[#0B1F3A]/60">
                <p className="mb-2 text-lg">Nenhum produto encontrado.</p>
                <p className="text-sm">
                  {searchTerm ? "Tente refinar sua busca ou " : ""}
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      handleCreateNewProduct();
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
    </div>
  );
}

AdminEditProduct.propTypes = {
  // Não há props neste componente
};
