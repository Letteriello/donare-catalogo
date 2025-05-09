// Components & Hooks
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button"; // Added Button
import { useIsMobile } from "@/hooks/use-mobile"; // Added useIsMobile

// Utils & Data
// import { createPageUrl } from "@/utils"; - Não necessário mais
import { Category, User } from "@/api/entities";

// Icons
import { ArrowRight, Lock, Settings, RefreshCw, LogOut, ChevronLeft } from "lucide-react";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loginError, setLoginError] = useState('');
  const isMobile = useIsMobile(); // Instantiated useIsMobile

  // Carregar categorias com escuta em tempo real
  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
    
    // Primeiro carregamento e configuração de listener em tempo real
    try {
      // Inicialização da lista com método list() síncrono tradicional
      const initialLoad = async () => {
        try {
          const initialData = await Category.list();
          console.log("[DEBUG] Carregamento inicial de categorias:", initialData);
          setCategories(initialData);
        } catch (initialError) {
          console.error("Erro no carregamento inicial:", initialError);
        } finally {
          setIsLoading(false);
        }
      };
      
      initialLoad();
      
      // Configura um listener para atualizações em tempo real
      const unsubscribe = Category.listenForChanges((updatedCategories) => {
        console.log("[DEBUG] Categorias atualizadas em tempo real:", updatedCategories);
        setCategories(updatedCategories);
        setIsLoading(false);
        setErrorMessage(null);
      });
      
      // Limpa o listener quando o componente for desmontado
      return () => {
        console.log("[DEBUG] Limpando listener de categorias");
        unsubscribe();
      };
    } catch (error) {
      console.error("Erro geral ao configurar listeners:", error);
      setErrorMessage("Não foi possível carregar as categorias. Por favor, tente novamente.");
      setIsLoading(false);
    }
  }, []);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar o estado atual de autenticação
        const userData = await User.me();
        if (userData && userData.email === 'hdonare@gmail.com') {
          setIsAuthenticated(true);
          setIsAdmin(true);
        } else {
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsAuthenticated(false);
        setIsAdmin(false);
        
        // Mostrar erro de autenticação se for o caso de permissão negada
        if (error.message && error.message.includes('restrito')) {
          setLoginError('Apenas o administrador tem permissão de acesso.');
          setTimeout(() => setLoginError(''), 5000);
        }
      }
    };
    
    checkAuth();
  }, []);

  const handleAdminLogin = async () => {
    setLoginError('');
    
    try {
      await User.login();
      setIsAuthenticated(true);
      setIsAdmin(true);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setLoginError('Apenas o administrador tem permissão de acesso.');
      setTimeout(() => setLoginError(''), 5000); // Limpa o erro após 5 segundos
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      setIsAuthenticated(false);
      setIsAdmin(false);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleRetry = () => {
    // Recarregar a página manualmente
    window.location.reload();
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  // Renderização condicional baseada no estado de autenticação e administrador
  const renderAdminControls = () => {
    if (isAuthenticated && isAdmin) {
      return (
        <div className="flex justify-end mt-4">
          <button
            onClick={handleLogout}
            className="bg-[#f5f2f0] text-[#0B1F3A]/60 hover:text-[#0B1F3A] flex items-center gap-2 py-2 px-4 rounded-full text-sm hover:bg-white transition-all shadow-sm hover:shadow"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f5f2f0] bg-[url('/img/subtle-pattern.png')] bg-opacity-40 text-[#0B1F3A] font-work-sans p-4">
      <div className="max-w-6xl mx-auto relative">
        {/* Elementos decorativos */}
        <div className="hidden md:block absolute top-20 right-10 w-72 h-72 bg-[#B9A67E]/10 rounded-full -z-10 blur-3xl"></div>
        <div className="hidden md:block absolute bottom-40 left-10 w-64 h-64 bg-[#0B1F3A]/5 rounded-full -z-10 blur-3xl"></div>
        
        {/* Header Aprimorado */}
        <header className={`${isMobile ? 'py-6' : 'py-8 md:py-12'} relative`}>
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1 className="font-belleza text-4xl md:text-5xl text-[#0B1F3A] relative">
                Donare Home
                <span className="absolute -bottom-2 left-0 w-20 h-1 bg-gradient-to-r from-[#B9A67E] to-transparent"></span>
              </h1>
              <p className="text-[#0B1F3A]/60 font-light mt-1">Catálogo</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 mt-3 py-2 px-4 bg-white rounded-xl text-[#0B1F3A]/80 hover:text-[#0B1F3A] text-sm shadow-sm hover:shadow transition-all hover:bg-[#F4F1EC] border border-transparent hover:border-[#0B1F3A]/10"
              >
                <ChevronLeft size={16} /> Voltar para o Início
              </Link>
            </div>
            
            {renderAdminControls()}
          </div>
          
          {/* Banner com Slogan da Marca */}
          <div className={`${isMobile ? 'mt-8 mb-6' : 'mt-12 mb-10'} bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm border border-[#0B1F3A]/5`}>
            <p className="font-belleza text-xl md:text-2xl text-[#0B1F3A]/90">
              &ldquo;A estética do lar com propósito e significado&rdquo;
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-6">
          {errorMessage ? (
            <div className="text-center py-12 bg-red-50/70 rounded-xl border border-red-100 backdrop-blur-sm">
              <p className="text-red-500 mb-4 font-medium">{errorMessage}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 py-3 px-6 bg-white rounded-xl text-[#0B1F3A] text-sm shadow-sm hover:shadow transition-all"
              >
                <RefreshCw size={16} />
                Tentar novamente
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col justify-center items-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B1F3A]"></div>
              <p className="mt-4 text-[#0B1F3A]/60 font-light">Carregando categorias...</p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-3xl mx-auto"
            >
              {categories.length > 0 ? (
                <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}`}>
                  {categories.map((category) => (
                    <motion.div
                      key={category.id}
                      variants={fadeIn}
                      className="h-full"
                    >
                      <Link
                        to={`/catalog?categoria=${category.id}`}
                        className="block h-full bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-[#0B1F3A]/5 overflow-hidden relative group"
                      >
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#B9A67E] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                        <div className="flex justify-between items-center">
                          <h2 className="text-xl font-belleza">{category.name}</h2>
                          <ArrowRight
                            size={20}
                            className="text-[#0B1F3A]/40 group-hover:text-[#0B1F3A] transform translate-x-0 group-hover:translate-x-1 transition-all"
                          />
                        </div>
                        {category.description && (
                          <p className="text-[#0B1F3A]/60 text-sm mt-2 line-clamp-2">{category.description}</p>
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/60 rounded-xl border border-[#0B1F3A]/10 backdrop-blur-sm">
                  <p className="text-[#0B1F3A]/60 mb-4">
                    Nenhuma categoria encontrada
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </main>

        {/* Admin Login Button com Design Aprimorado */}
        <div className={`${isMobile ? 'mt-8 pb-10' : 'mt-12 pb-12'} text-center relative`}>
          {!isAuthenticated ? (
            <>
              <button
                onClick={handleAdminLogin}
                className={`
                  inline-flex items-center justify-center gap-2
                  ${isMobile ? 'py-3 px-5 text-sm' : 'py-3 px-6 text-sm'}
                  bg-white hover:bg-[#F4F1EC] rounded-xl
                  text-[#0B1F3A]/60 hover:text-[#0B1F3A]
                  shadow-sm hover:shadow
                  border border-[#0B1F3A]/5 hover:border-[#0B1F3A]/10
                  transition-all min-h-[48px]
                `}
              >
                <Lock size={isMobile ? 18 : 16} />
                {isMobile ? "Acesso Admin" : "Área Administrativa"}
              </button>
              
              {loginError && (
                <div className="mt-4 text-red-500 bg-red-50 p-4 rounded-xl border border-red-100 max-w-sm mx-auto">
                  {loginError}
                </div>
              )}
            </>
          ) : (
            <div className="relative inline-block">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0B1F3A] to-[#B9A67E] rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <Button
                asChild
                size={isMobile ? "xl" : "default"}
                className="bg-[#0B1F3A] text-white rounded-xl shadow-sm hover:shadow-md relative min-h-[48px]"
              >
                <Link to="/admin">
                  <Settings size={isMobile ? 20 : 16} className={!isMobile ? "mr-2" : ""} />
                  {!isMobile && "Painel Administrativo"}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
