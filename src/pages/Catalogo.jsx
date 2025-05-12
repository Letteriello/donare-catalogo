import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Product } from "@/api/entities";
import { Category } from "@/api/entities";
import { ChevronLeft, RefreshCw, Home, ChevronRight, List } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function Catalogo() {
  const [products, setProducts] = useState([]);
  const [processedProducts, setProcessedProducts] = useState([]); // New state for grouped/single products
  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // Extrai o ID da categoria da URL
    const urlParams = new URLSearchParams(location.search);
    const categoryId = urlParams.get("categoria");
    
    console.log("[DEBUG] Parâmetro categoria na URL:", categoryId);
    
    // Garantir que o categoryId não seja uma string vazia
    if (categoryId === "") {
      console.log("[DEBUG] categoryId é uma string vazia, ajustando para null");
      setError("Categoria não especificada. Selecione uma categoria válida.");
      setIsLoading(false);
      return;
    }
    
    // Variáveis para armazenar as funções de cancelamento
    let unsubscribeCategories = null;
    let unsubscribeProducts = null;
    
    try {
      // 1. Configura listener em tempo real para categorias
      unsubscribeCategories = Category.listenForChanges((categories) => {
        console.log("[DEBUG] Categorias atualizadas em tempo real:", categories);
        
        if (categoryId) {
          // Encontrar a categoria atual com correspondência mais flexível
          const categoryData = categories.find(cat =>
            cat.id === categoryId ||
            (cat.id && cat.id.toLowerCase() === categoryId.toLowerCase()) ||
            (cat.name && cat.name.toLowerCase().replace(/ /g, '_') === categoryId.toLowerCase())
          );
          
          console.log("[DEBUG] Categoria encontrada:", categoryData);
          
          if (!categoryData) {
            console.log("[ERRO] Categoria não encontrada para ID:", categoryId);
            setError(`Categoria não encontrada. ID: ${categoryId}`);
            setIsLoading(false);
            return;
          }
          
          setCategory(categoryData);
          
          // 2. Configura listener em tempo real para produtos com filtro de categoria
          if (categoryData?.id) {
            // Se já existe um listener para produtos, limpe-o primeiro
            if (unsubscribeProducts) {
              unsubscribeProducts();
            }
            
            // Configura novo listener para produtos filtrados por categoria
            console.log(`[DEBUG] Buscando produtos para categoria: ${categoryData.name} (ID: ${categoryData.id})`);
            unsubscribeProducts = Product.listenForChanges((products) => {
              console.log("[DEBUG] Produtos atualizados em tempo real:", products);
              // Debugando os dados de produtos para verificar se estão corretos
              if (products.length === 0) {
                console.log("[DEBUG] Nenhum produto encontrado para esta categoria");
              } else {
                console.log("[DEBUG] Exemplo do primeiro produto:", products[0]);
                console.log("[DEBUG] categoryId do primeiro produto:", products[0].categoryId);
              }
              
              setProducts(products);
              setIsLoading(false);
            }, categoryData.id); // Passa o ID da categoria como filtro
          } else {
            // Se não encontrou a categoria, mostra todos os produtos
            console.log("[AVISO] Categoria não encontrada, mostrando todos os produtos");
            
            if (unsubscribeProducts) {
              unsubscribeProducts();
            }
            
            unsubscribeProducts = Product.listenForChanges((products) => {
              console.log("[DEBUG] Todos os produtos atualizados em tempo real:", products);
              setProducts(products);
              setIsLoading(false);
            });
          }
        } else {
          // Se não há categoria especificada, mostra todos os produtos
          console.log("[DEBUG] Nenhuma categoria especificada, mostrando todos os produtos");
          
          if (unsubscribeProducts) {
            unsubscribeProducts();
          }
          
          unsubscribeProducts = Product.listenForChanges((products) => {
            console.log("[DEBUG] Todos os produtos atualizados em tempo real:", products);
            setProducts(products);
            setIsLoading(false);
          });
        }
      });
    } catch (error) {
      console.error("Erro ao configurar listeners:", error);
      setError("Erro ao carregar dados. Por favor, tente novamente.");
      setIsLoading(false);
    }
    
    // Limpa os listeners quando o componente for desmontado
    return () => {
      console.log("[DEBUG] Limpando listeners");
      if (unsubscribeCategories) unsubscribeCategories();
      if (unsubscribeProducts) unsubscribeProducts();
    };
  }, [location.search]);

  // useEffect to process products for grouping
  useEffect(() => {
    console.log("[DEBUG Catalogo.jsx] Raw products received for processing:", JSON.parse(JSON.stringify(products)));
    if (!products || products.length === 0) {
      console.log("[DEBUG Catalogo.jsx] No products or empty products array, setting processedProducts to empty.");
      setProcessedProducts([]);
      return;
    }

    const grouped = {};
    const singles = [];

    products.forEach(product => {
      if (product.baseProductName && product.baseProductName.trim() !== "") {
        if (!grouped[product.baseProductName]) {
          grouped[product.baseProductName] = {
            id: product.baseProductName, // Use baseProductName as a unique key for the group
            name: product.baseProductName,
            main_image: product.main_image, // Use first product's image for the group
            description: `Variantes de ${product.baseProductName}`, // Generic description
            price: product.price, // Use first product's price as representative
            isGrouped: true,
            variants: []
          };
        }
        grouped[product.baseProductName].variants.push(product);
        // Optionally, update price to "A partir de X" or find min price
        if (grouped[product.baseProductName].variants.length > 1) {
           // Find the minimum price among variants if desired, or keep the first one
           const minPrice = grouped[product.baseProductName].variants.reduce((min, p) => {
            return (p.price !== null && (min === null || p.price < min)) ? p.price : min;
          }, null);
          grouped[product.baseProductName].price = minPrice;
        }

      } else {
        singles.push({...product, isGrouped: false});
      }
    });

    const newProcessedProducts = [...Object.values(grouped), ...singles];
    console.log("[DEBUG Catalogo.jsx] Processed products (grouped and singles):", JSON.parse(JSON.stringify(newProcessedProducts)));
    setProcessedProducts(newProcessedProducts);
  }, [products]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F9F6F3]">
      {/* Header fixo com navegação */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#0B1F3A]/10 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-full text-[#0B1F3A] hover:bg-[#0B1F3A]/5"
            >
              <Link to="/home">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <h1 className="font-belleza text-lg sm:text-xl text-[#0B1F3A] truncate px-2 text-center flex-1">
              {category ? category.name : "Catálogo"}
            </h1>
            
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-full text-[#0B1F3A] hover:bg-[#0B1F3A]/5"
            >
              <Link to="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-4 relative">

        {/* Categorias em formato lista (para mobile) */}
        {category && (
          <div className="mb-4 rounded-lg">
            <ScrollArea className="overflow-x-auto whitespace-nowrap py-2 hidden sm:block">
              <div className="flex space-x-2 pb-1">
                <Badge 
                  variant="outline" 
                  className="py-1.5 px-3 flex items-center bg-white shadow-sm cursor-pointer hover:bg-[#0B1F3A]/5 font-medium text-sm"
                >
                  <Link to="/home" className="flex items-center">
                    <List className="mr-1.5 h-3.5 w-3.5" />
                    Todas as categorias
                  </Link>
                </Badge>
                <Separator orientation="vertical" className="h-6 bg-[#0B1F3A]/10" />
                <Badge 
                  className="py-1.5 px-3 bg-[#0B1F3A] text-white shadow-sm font-medium text-sm flex items-center"
                >
                  {category.image && (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-5 h-5 rounded-full mr-1.5 object-cover" 
                    />
                  )}
                  {category.name}
                </Badge>
              </div>
            </ScrollArea>
          </div>
        )}
        
        {/* Estado de Carregamento Aprimorado */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <Card key={index} className="overflow-hidden shadow-sm border-[#0B1F3A]/10">
                <div className="flex items-center">
                  <div className="p-3 w-24 sm:w-32">
                    <AspectRatio ratio={1} className="overflow-hidden rounded bg-[#0B1F3A]/5">
                      <Skeleton className="h-full w-full" />
                    </AspectRatio>
                  </div>
                  <div className="p-3 flex-1">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center mb-6 border border-red-200">
            <h3 className="font-medium text-red-600 mb-2">Ocorreu um Erro</h3>
            <p className="text-gray-700 mb-4">
              {error}
            </p>
            <Button
              onClick={handleRetry}
              variant="destructive"
              className="mt-2"
            >
              <RefreshCw size={16} className="mr-2" />
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <>
            {/* Lista de Produtos em Formato Listview Mobile-Friendly */}
            <div className="space-y-3">
              {processedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Link
                    to={createPageUrl("ProdutoDetalhe", { id: product.id, isGrouped: product.isGrouped ? '1' : '0' })}
                    className="block"
                  >
                    <Card className="overflow-hidden border-[#0B1F3A]/10 shadow-sm hover:shadow-md transition-all duration-200 group">
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative w-full sm:w-40 md:w-48 flex-shrink-0">
                          <AspectRatio ratio={1} className="h-full">
                            <img
                              src={product.main_image}
                              alt={product.name}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </AspectRatio>
                          {product.isGrouped && (
                            <Badge className="absolute top-2 right-2 text-xs bg-[#0B1F3A]/80 hover:bg-[#0B1F3A] px-2 py-1 rounded-full">
                              {product.variants.length} cores
                            </Badge>
                          )}
                        </div>
                        <div className="p-4 flex flex-col justify-between flex-1">
                          <div>
                            <h3 className="font-medium text-[#0B1F3A] line-clamp-1 mb-2 text-lg">
                              {product.name}
                            </h3>
                            <p className="text-[#0B1F3A]/70 text-sm leading-relaxed line-clamp-2">
                              {product.isGrouped ? `Disponível em ${product.variants.length} cores/variantes` : product.description}
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#0B1F3A]/10">
                            <div className="text-[#0B1F3A] font-medium">
                              {product.price != null
                                ? (product.isGrouped ? `A partir de R$ ${product.price.toFixed(2)}` : `R$ ${product.price.toFixed(2)}`)
                                : "Sob consulta"}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-[#0B1F3A]/70 hover:text-[#0B1F3A] hover:bg-[#0B1F3A]/5 rounded-full p-2"
                            >
                              <span className="text-xs mr-1 hidden sm:inline">Detalhes</span>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Mensagem quando não há produtos - Design simplificado */}
            {processedProducts.length === 0 && !isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-sm p-8 text-center mt-8 border border-[#0B1F3A]/5"
              >
                <div className="max-w-md mx-auto">
                  <div className="relative h-32 mb-6">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#0B1F3A]/20">
                        <path d="M21 7v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h9.586a1 1 0 0 1 .707.293l7.414 7.414a1 1 0 0 1 .293.707Z"></path>
                        <path d="M14 3v5a1 1 0 0 0 1 1h5"></path>
                        <path d="M7 13h10"></path>
                        <path d="M7 17h10"></path>
                        <path d="M7 9h3"></path>
                      </svg>
                    </motion.div>
                  </div>
                  
                  <h2 className="font-medium text-[#0B1F3A] text-xl mb-3">Catálogo em Expansão</h2>
                  <p className="text-[#0B1F3A]/70 text-base mb-6 leading-relaxed">
                    Ainda não temos produtos cadastrados nesta categoria, mas nosso catálogo 
                    está sempre crescendo com novas adições.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      asChild
                      size="default"
                      className="bg-[#0B1F3A] text-white hover:bg-[#0B1F3A]/90 rounded-full px-6"
                    >
                      <Link to="/home">
                        <Home className="mr-2 h-4 w-4" />
                        Página Inicial
                      </Link>
                    </Button>
                    
                    <Button
                      asChild
                      variant="outline"
                      size="default"
                      className="border-[#0B1F3A]/20 text-[#0B1F3A] hover:bg-[#0B1F3A]/5 rounded-full px-6"
                    >
                      <Link to="#" onClick={() => window.history.back()}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Voltar
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
