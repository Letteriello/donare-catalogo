
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Product } from "@/api/entities";
import { Category } from "@/api/entities";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function Catalogo() {
  const [products, setProducts] = useState([]);
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

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F4F1EC]">
      <div className="container mx-auto px-4 py-8">
        {/* Navegação */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link 
            to="/home"
            className="inline-flex items-center px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all group text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white"
          >
            <ChevronLeft size={20} className="mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Voltar para Categorias</span>
          </Link>

          <Link 
            to="/"
            className="inline-flex items-center px-6 py-3 bg-white/50 rounded-xl shadow-sm hover:shadow hover:bg-white transition-all group text-[#0B1F3A]/80 hover:text-[#0B1F3A]"
          >
            <ChevronLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Página Inicial</span>
          </Link>
        </div>

        {/* Estado de Carregamento */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B1F3A]"></div>
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
            {/* Título da Categoria */}
            {category && (
              <div className="text-center mb-12">
                <h1 className="font-belleza text-3xl md:text-4xl text-[#0B1F3A] mb-2">{category.name}</h1>
                {category.description && (
                  <p className="text-[#0B1F3A]/70">{category.description}</p>
                )}
              </div>
            )}

            {/* Lista de Produtos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all"
                >
                  <Link to={`${createPageUrl("ProdutoDetalhe")}?id=${product.id}`}>
                    <div className="h-64 overflow-hidden">
                      <img 
                        src={product.main_image} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="font-belleza text-xl text-[#0B1F3A] mb-2">{product.name}</h3>
                      <p className="text-[#0B1F3A]/70 text-sm line-clamp-2 mb-4">{product.description}</p>
                      <span className="text-[#0B1F3A] font-medium">
                        {product.price != null ? `R$ ${product.price.toFixed(2)}` : "Sob consulta"}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Mensagem quando não há produtos */}
            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#0B1F3A]/70">Nenhum produto encontrado nesta categoria.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
