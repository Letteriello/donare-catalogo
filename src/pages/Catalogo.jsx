
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Product } from "@/api/entities";
import { Category } from "@/api/entities";
import { ChevronLeft, RefreshCw, Home } from "lucide-react"; // Added Home icon
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

export default function Catalogo() {
  const [products, setProducts] = useState([]);
  const [processedProducts, setProcessedProducts] = useState([]); // New state for grouped/single products
  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const isMobile = useIsMobile();

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
    <div className="min-h-screen bg-[#F4F1EC] bg-[url('/img/subtle-pattern.png')] bg-opacity-50">
      <div className="container mx-auto px-4 py-8 relative">
        {/* Elemento visual decorativo */}
        <div className="hidden md:block absolute top-0 right-0 w-64 h-64 bg-[#0B1F3A]/5 rounded-full -z-10 blur-3xl"></div>
        <div className="hidden md:block absolute bottom-0 left-0 w-48 h-48 bg-[#B9A67E]/10 rounded-full -z-10 blur-3xl"></div>
        {/* Navegação Aprimorada */}
        <div className={`${isMobile ? 'sticky top-0 z-10 px-3 py-4 -mx-4 mb-6 bg-[#F4F1EC]/95 backdrop-blur-sm shadow-sm' : 'mb-8'}`}>
          <div className={`flex ${isMobile ? 'justify-between w-full' : 'flex-wrap gap-3'}`}>
            <Button
              asChild
              size={isMobile ? "xl" : "default"}
              className={`${isMobile ? 'flex-1 mr-2' : ''} bg-[#0B1F3A] text-white rounded-xl shadow-md hover:bg-[#0A1A30] transition-all group min-h-[48px]`}
            >
              <Link to="/home">
                <ChevronLeft size={isMobile ? 22 : 20} className={`${isMobile ? '' : 'mr-2'} transition-transform group-hover:-translate-x-1`} />
                {!isMobile && <span className="font-medium">Voltar para Categorias</span>}
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size={isMobile ? "xl" : "default"}
              className={`${isMobile ? 'flex-1' : ''} bg-white text-[#0B1F3A] hover:bg-[#0B1F3A]/10 rounded-xl shadow-sm group transition-all min-h-[48px]`}
            >
              <Link to="/">
                {isMobile ? (
                  <div className="flex items-center justify-center w-full">
                    <Home size={22} className="transition-transform group-hover:scale-110" />
                  </div>
                ) : (
                  <>
                    <Home size={16} className="mr-2 transition-transform group-hover:scale-110" />
                    <span className="font-medium">Página Inicial</span>
                  </>
                )}
              </Link>
            </Button>
          </div>
          
          {/* Título da Categoria em Mobile - Move para dentro da navegação fixa */}
          {isMobile && category && (
            <h1 className="font-belleza text-xl text-center text-[#0B1F3A] mt-2 truncate px-6">
              {category.name}
            </h1>
          )}
        </div>

        {/* Estado de Carregamento Aprimorado */}
        {isLoading ? (
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'grid-cols-2 lg:grid-cols-3 gap-6'}`}>
            {[...Array(isMobile ? 2 : 6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md relative">
                {/* Adiciona um overlay com gradiente para dar um aspecto mais sofisticado */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F3A]/5 to-transparent animate-pulse"></div>
                <Skeleton className={`${isMobile ? 'h-72' : 'h-64'} w-full`} />
                <div className="p-6">
                  <Skeleton className="h-8 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-1/3" />
                    {isMobile && <Skeleton className="h-4 w-1/4" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-center">
            <p>{error}</p>
            <button 
              onClick={handleRetry}
              className="mt-2 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
            >
              <RefreshCw size={16} className="mr-2" />
              Tentar Novamente
            </button>
          </div>
        ) : (
          <>
            {/* Título da Categoria com Design Aprimorado - apenas para desktop */}
            {!isMobile && category && (
              <div className="text-center mb-12 relative">
                <div className="absolute left-0 right-0 top-1/2 border-t border-[#0B1F3A]/10 -z-10"></div>
                <h1 className="font-belleza text-3xl md:text-4xl text-[#0B1F3A] mb-2 inline-block bg-[#F4F1EC] px-6">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-[#0B1F3A]/70 max-w-2xl mx-auto mt-3">
                    {category.description}
                  </p>
                )}
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#B9A67E] to-transparent mx-auto mt-4"></div>
              </div>
            )}

            {/* Lista de Produtos - Layout otimizado para mobile */}
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'grid-cols-2 lg:grid-cols-3 gap-6'}`}>
                  {processedProducts.map(product => (
                    <motion.div
                      key={product.id} // This will be baseProductName for grouped, or product.id for singles
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1"
                    >
                      <Link
                        to={product.isGrouped ? `${createPageUrl("ProdutoDetalhe")}?id=${product.variants[0].id}&group=${product.name}` : `${createPageUrl("ProdutoDetalhe")}?id=${product.id}`}
                        className="block min-h-[48px]" // Aumenta área clicável
                      >
                        <div className={`${isMobile ? 'h-72' : 'h-64'} overflow-hidden`}>
                          <img
                            src={product.main_image} // For grouped, this is the first variant's image
                            alt={product.name} // For grouped, this is the baseProductName
                            className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                            loading="lazy" // Otimização de carregamento
                          />
                        </div>
                        <div className={`p-6 ${isMobile ? 'pb-8' : ''}`}>
                          <h3 className="font-belleza text-xl sm:text-2xl text-[#0B1F3A] mb-2">{product.name}</h3>
                          <p className="text-[#0B1F3A]/80 text-sm md:text-base line-clamp-2 mb-4">
                            {product.isGrouped ? `Disponível em ${product.variants.length} cores` : product.description}
                          </p>
                          <div className="flex items-center justify-between">
                            {!product.isGrouped && (
                              <span className="text-[#0B1F3A] font-semibold text-lg">
                                {product.price != null
                                  ? `R$ ${product.price.toFixed(2)}`
                                  : "Sob consulta"}
                              </span>
                            )}
                            {isMobile && (
                              <span className="text-sm text-[#0B1F3A]/60 underline">Ver detalhes</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
              ))}
            </div>
 
            {/* Mensagem quando não há produtos - Com melhor design */}
            {processedProducts.length === 0 && (
              <div className="text-center py-16 bg-white/50 rounded-xl border border-[#0B1F3A]/10 backdrop-blur-sm">
                <div className="max-w-md mx-auto px-6">
                  <h3 className="font-belleza text-xl text-[#0B1F3A] mb-3">Nenhum produto encontrado</h3>
                  <p className="text-[#0B1F3A]/70 mb-6">
                    Ainda não temos produtos cadastrados nesta categoria, mas estamos trabalhando para adicionar novidades em breve.
                  </p>
                  <Button
                    asChild
                    className="bg-[#0B1F3A] text-white hover:bg-[#0B1F3A]/90"
                  >
                    <Link to="/home">
                      Explorar outras categorias
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
