
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
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const urlParams = new URLSearchParams(location.search);
        const categoryId = urlParams.get("categoria");
        
        // Remova a verificação que estava causando o erro
        // if (!categoryId) {
        //   setError("Categoria não especificada");
        //   setIsLoading(false);
        //   return;
        // }

        try {
          // Carregar categorias
          const categories = await Category.list();
          
          if (categoryId) {
            // Encontrar a categoria atual (verificando se categoryId existe)
            const categoryData = categories.find(cat => 
              cat.id === categoryId || 
              (cat.id && cat.id.toLowerCase() === categoryId.toLowerCase()) ||
              (cat.name && cat.name.toLowerCase().replace(/ /g, '_') === categoryId.toLowerCase())
            );
            
            setCategory(categoryData);
            
            // Carregar produtos
            const allProducts = await Product.list();
            
            // Filtrar produtos pela categoria - CORRIGIDO
            const filteredProducts = allProducts.filter(product => 
              product.categoryId === categoryData?.id
            );
            
            setProducts(filteredProducts);
          } else {
            // Se não houver categoria especificada, mostrar todos os produtos
            const allProducts = await Product.list();
            setProducts(allProducts);
          }
          
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
          setError("Erro ao carregar dados. Por favor, tente novamente.");
        }
      } catch (error) {
        console.error("Erro geral:", error);
        setError("Ocorreu um erro ao carregar a página. Por favor, tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [location.search]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F4F1EC]">
      <div className="container mx-auto px-4 py-8">
        {/* Navegação */}
        <Link 
          to={createPageUrl("Home")}
          className="inline-flex items-center px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all group text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white"
        >
          <ChevronLeft size={20} className="mr-2 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Voltar para Categorias</span>
        </Link>

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
