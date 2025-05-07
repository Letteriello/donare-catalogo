
import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Product } from "@/api/entities";
import { ChevronLeft, ChevronRight, X, Maximize2, MinusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProdutoDetalhe() {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        const urlParams = new URLSearchParams(location.search);
        const productId = urlParams.get("id");
        
        if (!productId) {
          navigate(createPageUrl("Catalogo"));
          return;
        }
        
        // Buscar produto específico
        const productData = await Product.get(productId);
        setProduct(productData);
        
        // Buscar produtos relacionados (mesma categoria)
        if (productData && productData.category) {
          const allProducts = await Product.list();
          const related = allProducts
            .filter(p => p.category === productData.category && p.id !== productData.id)
            .slice(0, 3);
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error("Erro ao carregar produto:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [location.search, navigate]);

  const nextImage = () => {
    if (!product || !product.gallery) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === product.gallery.length ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    if (!product || !product.gallery) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? product.gallery.length : prevIndex - 1
    );
  };

  const selectImage = (index) => {
    setCurrentImageIndex(index);
  };

  // Obter todas as imagens (principal + galeria)
  const getAllImages = () => {
    if (!product) return [];
    return [product.main_image, ...(product.gallery || [])];
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white h-[500px] animate-pulse rounded-sm"></div>
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-white animate-pulse rounded-sm"></div>
              <div className="h-4 w-1/4 bg-white animate-pulse rounded-sm"></div>
              <div className="h-4 w-full bg-white animate-pulse rounded-sm mt-6"></div>
              <div className="h-4 w-full bg-white animate-pulse rounded-sm"></div>
              <div className="h-4 w-3/4 bg-white animate-pulse rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-belleza text-[#0B1F3A] mb-4">Produto não encontrado</h2>
        <p className="text-[#0B1F3A]/70 mb-6">O produto que você está procurando não existe ou foi removido.</p>
        <Link 
          to={createPageUrl("Catalogo")}
          className="inline-block bg-[#0B1F3A] text-white px-6 py-2 rounded-sm hover:bg-[#0B1F3A]/90 transition-all"
        >
          Voltar para o Catálogo
        </Link>
      </div>
    );
  }

  const allImages = getAllImages();

  const ImageModal = ({ image, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-7xl w-full max-h-[90vh] flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-white/80 z-50"
        >
          <X size={32} />
        </button>
        <img 
          src={image} 
          alt="Produto em tela cheia"
          className="max-w-full max-h-[90vh] object-contain"
        />
      </motion.div>
    </motion.div>
  );

  return (
    <div className="bg-[#F4F1EC]">
      
      <div className="container mx-auto px-4 py-8">
        {/* Navegação */}
        
          <Link 
            to={createPageUrl("Home")}
            className="inline-flex items-center px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all group text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white"
          >
            <ChevronLeft size={20} className="mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Voltar para Home</span>
          </Link>

          {/* Produto Detalhe */}
          <section className="py-6">
            
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  className="grid grid-cols-1 md:grid-cols-2 gap-12"
                >
                  {/* Galeria de Imagens */}
                  <div className="space-y-4">
                    <div className="relative bg-white p-4 rounded-xl shadow-md group">
                      <img 
                        src={allImages[currentImageIndex]} 
                        alt={product.name} 
                        className="w-full h-[400px] md:h-[500px] object-contain cursor-zoom-in"
                        onClick={() => setIsImageExpanded(true)}
                      />
                      
                      <button
                        onClick={() => setIsImageExpanded(true)}
                        className="absolute top-4 right-4 bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Maximize2 size={24} className="text-[#0B1F3A]" />
                      </button>
                      
                      {allImages.length > 1 && (
                        <>
                          <button 
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-md hover:bg-white transition-all"
                          >
                            <ChevronLeft size={24} className="text-[#0B1F3A]" />
                          </button>
                          <button 
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-md hover:bg-white transition-all"
                          >
                            <ChevronRight size={24} className="text-[#0B1F3A]" />
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Thumbnails */}
                    {allImages.length > 1 && (
                      <div className="flex space-x-2 overflow-x-auto py-2">
                        {allImages.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => selectImage(index)}
                            className={`flex-shrink-0 border-2 rounded-xl overflow-hidden ${
                              currentImageIndex === index ? 'border-[#0B1F3A]' : 'border-transparent'
                            }`}
                          >
                            <img 
                              src={image} 
                              alt={`Thumbnail ${index + 1}`} 
                              className="w-20 h-20 object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Informações do Produto */}
                  <div className="space-y-6 bg-white p-8 rounded-xl shadow-md">
                    <div>
                      <h1 className="font-belleza text-3xl text-[#0B1F3A] mb-2">{product.name}</h1>
                      <div className="flex gap-2">
                        {product.is_new && (
                          <span className="bg-[#0B1F3A] text-white text-xs px-3 py-1 rounded-full">
                            Novidade
                          </span>
                        )}
                        {product.is_limited && (
                          <span className="bg-[#8B6844] text-white text-xs px-3 py-1 rounded-full">
                            Edição Limitada
                          </span>
                        )}
                      </div>
                    </div>

                    {product.price != null && product.price !== undefined ? (
                      <div className="text-2xl font-medium text-[#0B1F3A]">
                        R$ {product.price.toFixed(2)}
                      </div>
                    ) : (
                      <div className="text-[#0B1F3A]/70 italic">
                        Preço sob consulta
                      </div>
                    )}

                    <div className="prose text-[#0B1F3A]/80 max-w-none">
                      {product.description}
                    </div>

                    {product.options && product.options.length > 0 && (
                      <div>
                        <h3 className="font-medium text-[#0B1F3A] mb-2">Opções disponíveis:</h3>
                        <div className="flex flex-wrap gap-2">
                          {product.options.map((option, index) => (
                            <span 
                              key={index}
                              className="inline-block px-3 py-1 bg-[#F4F1EC] border border-[#0B1F3A]/10 rounded-full text-sm"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-[#0B1F3A]/10 pt-6">
                      <p className="text-[#0B1F3A]/70 text-sm mb-4">
                        Para mais informações ou para encomendar este produto, entre em contato:
                      </p>
                      <a 
                        href={product.whatsapp_link || "https://wa.me/5547991106023"}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block bg-[#0B1F3A] text-white px-6 py-3 font-medium rounded-xl hover:bg-[#0B1F3A]/90 transition-all hover:shadow-lg hover:-translate-y-1"
                      >
                        Ver Produto no WhatsApp
                      </a>
                    </div>
                  </div>
                </motion.div>

                {/* Produtos Relacionados */}
                {relatedProducts.length > 0 && (
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                    className="mt-20"
                  >
                    <h2 className="font-belleza text-2xl text-[#0B1F3A] mb-8">Você também pode gostar</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {relatedProducts.map(relatedProduct => (
                        <div 
                          key={relatedProduct.id}
                          className="bg-white rounded-xl overflow-hidden shadow-md card-shadow hover:shadow-lg card-hover transition-all"
                        >
                          <Link to={`${createPageUrl("ProdutoDetalhe")}?id=${relatedProduct.id}`}>
                            <div className="h-64 overflow-hidden">
                              <img 
                                src={relatedProduct.main_image} 
                                alt={relatedProduct.name} 
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                              />
                            </div>
                            <div className="p-6">
                              <h3 className="font-belleza text-xl text-[#0B1F3A] mb-2">{relatedProduct.name}</h3>
                              <p className="text-[#0B1F3A]/70 text-sm line-clamp-2 mb-4">{relatedProduct.description}</p>
                              <span className="text-[#0B1F3A] text-sm underline">Ver detalhes</span>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            
          </section>
        
      </div>

      {/* Modal de imagem expandida */}
      <AnimatePresence>
        {isImageExpanded && (
          <ImageModal 
            image={allImages[currentImageIndex]}
            onClose={() => setIsImageExpanded(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
