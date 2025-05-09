
import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Product } from "@/api/entities";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
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

  // Modal de imagem aprimorado
  const ImageModal = ({ image, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-7xl w-full max-h-[90vh] flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Botão de fechar aprimorado */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black/30 hover:bg-black/50 p-2 rounded-full transition-all z-50 min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="Fechar visualização"
        >
          <X size={28} />
        </button>
        
        {/* Indicação visual para fechar em dispositivos móveis */}
        <div className="absolute bottom-8 left-0 right-0 text-center text-white/60 text-sm">
          Toque fora da imagem para fechar
        </div>
        
        {/* Imagem com melhor tratamento */}
        <img
          src={image}
          alt="Produto em tela cheia"
          className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-md"
        />
      </motion.div>
    </motion.div>
  );

  return (
    <div className="bg-[#F4F1EC] bg-[url('/img/subtle-pattern.png')] bg-opacity-40 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Navegação Aprimorada */}
        <div className="sticky top-0 z-10 px-3 py-4 -mx-4 mb-6 bg-[#F4F1EC]/95 backdrop-blur-sm shadow-sm">
          <Link
            to={createPageUrl("Home")}
            className="inline-flex items-center px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all group text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white min-h-[48px]"
          >
            <ChevronLeft size={20} className="mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Voltar para Home</span>
          </Link>
        </div>

          {/* Produto Detalhe */}
          <section className="py-6">
            
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  className="grid grid-cols-1 md:grid-cols-2 gap-12"
                >
                  {/* Galeria de Imagens Aprimorada */}
                  <div className="space-y-4">
                    <div className="relative bg-white p-4 rounded-xl shadow-md group overflow-hidden">
                      {/* Indicador de posição da imagem */}
                      {allImages.length > 1 && (
                        <div className="absolute top-3 left-3 z-10 bg-[#0B1F3A]/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                          {currentImageIndex + 1} / {allImages.length}
                        </div>
                      )}
                      
                      <img
                        src={allImages[currentImageIndex]}
                        alt={product.name}
                        className="w-full h-[400px] md:h-[500px] object-contain cursor-zoom-in transition-opacity"
                        onClick={() => setIsImageExpanded(true)}
                        loading="lazy"
                      />
                      
                      {/* Botão de zoom mais visível */}
                      <button
                        onClick={() => setIsImageExpanded(true)}
                        className="absolute top-4 right-4 bg-white/90 p-2 rounded-full opacity-70 group-hover:opacity-100 transition-all shadow-md hover:shadow-lg"
                        title="Ampliar imagem"
                      >
                        <Maximize2 size={24} className="text-[#0B1F3A]" />
                      </button>
                      
                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-md hover:bg-white transition-all min-h-[48px] min-w-[48px] flex items-center justify-center"
                            aria-label="Imagem anterior"
                          >
                            <ChevronLeft size={24} className="text-[#0B1F3A]" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-md hover:bg-white transition-all min-h-[48px] min-w-[48px] flex items-center justify-center"
                            aria-label="Próxima imagem"
                          >
                            <ChevronRight size={24} className="text-[#0B1F3A]" />
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Thumbnails com Otimização para Touch */}
                    {allImages.length > 1 && (
                      <div className="flex space-x-3 overflow-x-auto py-3 px-1 scrollbar-thin scrollbar-thumb-[#0B1F3A]/20 scrollbar-track-transparent">
                        {allImages.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => selectImage(index)}
                            className={`flex-shrink-0 border-2 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all min-h-[60px] min-w-[60px] ${
                              currentImageIndex === index ? 'border-[#0B1F3A] scale-105' : 'border-transparent'
                            }`}
                          >
                            <img
                              src={image}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-20 h-20 object-cover"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Informações do Produto com Design Aprimorado */}
                  <div className="space-y-6 bg-white p-6 md:p-8 rounded-xl shadow-md relative overflow-hidden">
                    {/* Elemento decorativo */}
                    <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-[#B9A67E]/20 to-transparent rounded-bl-full -z-0"></div>
                    
                    <div className="relative">
                      <h1 className="font-belleza text-2xl md:text-3xl text-[#0B1F3A] mb-2">{product.name}</h1>
                      <div className="flex flex-wrap gap-2 mb-1">
                        {product.is_new && (
                          <span className="bg-[#0B1F3A] text-white text-xs px-3 py-1 rounded-full shadow-sm">
                            Novidade
                          </span>
                        )}
                        {product.is_limited && (
                          <span className="bg-[#B9A67E] text-white text-xs px-3 py-1 rounded-full shadow-sm">
                            Edição Limitada
                          </span>
                        )}
                      </div>
                    </div>

                    {product.price != null && product.price !== undefined ? (
                      <div className="text-2xl font-medium text-[#0B1F3A] bg-[#F4F1EC]/50 py-2 px-4 rounded-lg inline-block">
                        R$ {product.price.toFixed(2)}
                      </div>
                    ) : (
                      <div className="text-[#0B1F3A]/70 italic bg-[#F4F1EC]/50 py-2 px-4 rounded-lg inline-block">
                        Preço sob consulta
                      </div>
                    )}

                    <div className="prose text-[#0B1F3A]/80 max-w-none border-l-4 border-[#0B1F3A]/10 pl-4 py-1">
                      {product.description}
                    </div>

                    {product.options && product.options.length > 0 && (
                      <div className="bg-[#F4F1EC]/30 p-4 rounded-lg">
                        <h3 className="font-medium text-[#0B1F3A] mb-3">Opções disponíveis:</h3>
                        <div className="flex flex-wrap gap-2">
                          {product.options.map((option, index) => (
                            <span
                              key={index}
                              className="inline-block px-3 py-1 bg-white border border-[#0B1F3A]/10 rounded-full text-sm shadow-sm"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-[#0B1F3A]/10 pt-6 mt-6">
                      <p className="text-[#0B1F3A]/70 text-sm mb-4">
                        Para mais informações ou para encomendar este produto, entre em contato:
                      </p>
                      <a
                        href={product.whatsapp_link || "https://wa.me/5547991106023"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#0B1F3A] text-white px-6 py-3 font-medium rounded-xl hover:bg-[#0B1F3A]/90 transition-all hover:shadow-lg hover:-translate-y-1 min-h-[48px]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 18L20 18"></path>
                          <path d="M4 12L20 12"></path>
                          <path d="M4 6L20 6"></path>
                        </svg>
                        Ver Produto no WhatsApp
                      </a>
                    </div>
                  </div>
                </motion.div>

                {/* Produtos Relacionados com Design Aprimorado */}
                {relatedProducts.length > 0 && (
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-10%" }}
                    variants={fadeIn}
                    className="mt-16 md:mt-20 relative"
                  >
                    {/* Elemento decorativo */}
                    <div className="absolute -top-10 right-10 w-32 h-32 bg-[#B9A67E]/10 rounded-full -z-10 blur-2xl"></div>
                    
                    <div className="flex items-center mb-8">
                      <div className="w-10 h-0.5 bg-[#0B1F3A]/20 mr-4"></div>
                      <h2 className="font-belleza text-2xl md:text-3xl text-[#0B1F3A]">Você também pode gostar</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                      {relatedProducts.map(relatedProduct => (
                        <motion.div
                          key={relatedProduct.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5 }}
                          className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
                        >
                          <Link
                            to={`${createPageUrl("ProdutoDetalhe")}?id=${relatedProduct.id}`}
                            className="block min-h-[48px]"
                          >
                            <div className="h-56 md:h-64 overflow-hidden relative group">
                              <img
                                src={relatedProduct.main_image}
                                alt={relatedProduct.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="p-5 md:p-6">
                              <h3 className="font-belleza text-xl text-[#0B1F3A] mb-2">{relatedProduct.name}</h3>
                              <p className="text-[#0B1F3A]/70 text-sm line-clamp-2 mb-4">{relatedProduct.description}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-[#0B1F3A] font-medium">
                                  {relatedProduct.price != null ? `R$ ${relatedProduct.price.toFixed(2)}` : "Sob consulta"}
                                </span>
                                <span className="text-[#0B1F3A]/60 text-sm underline transition-colors group-hover:text-[#0B1F3A]">Ver detalhes</span>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
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
