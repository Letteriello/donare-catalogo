// Components & Hooks
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Utils & Data
import { createPageUrl } from "@/utils";
import { Category, User } from "@/api/entities";

// Icons
import { ArrowRight, Lock, Settings, RefreshCw, LogOut } from "lucide-react";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loginError, setLoginError] = useState('');

  // Carregar categorias com intervalo para evitar rate limit
  useEffect(() => {
    const loadCategories = async () => {
      if (retryCount > 3) {
        setErrorMessage("Muitas tentativas. Por favor, aguarde alguns minutos e tente novamente.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      
      try {
        const data = await Category.list();
        setCategories(data);
        setRetryCount(0);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        // Verificar se é erro de rate limit (429)
        if (error.message && error.message.includes("429")) {
          setErrorMessage("Muitas requisições. Aguardando antes de tentar novamente...");
          // Aguardar mais tempo em cada retry (backoff exponencial)
          const waitTime = Math.min(2000 * Math.pow(2, retryCount), 10000);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, waitTime);
        } else {
          setErrorMessage("Não foi possível carregar as categorias. Por favor, tente novamente.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCategories();
  }, [retryCount]);

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
    setRetryCount(prev => prev + 1);
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
    <div className="min-h-screen bg-[#f5f2f0] text-[#0B1F3A] font-work-sans p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="py-8 md:py-12 relative">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1 className="font-belleza text-4xl md:text-5xl text-[#0B1F3A]">
                Donare
              </h1>
              <p className="text-[#0B1F3A]/60 font-light mt-1">Catalogo</p>
            </div>
            
            {renderAdminControls()}
          </div>
        </header>

        {/* Main Content */}
        <main className="py-6">
          {errorMessage ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{errorMessage}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 py-3 px-6 bg-white rounded-full text-[#0B1F3A] text-sm shadow-sm hover:shadow transition-all"
              >
                <RefreshCw size={14} />
                Tentar novamente
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B1F3A]"></div>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-2xl mx-auto"
            >
              {categories.length > 0 ? (
                categories.map((category) => (
                  <motion.div
                    key={category.id}
                    variants={fadeIn}
                    className="mb-5"
                  >
                    <Link
                      to={`${createPageUrl(category.slug)}`}
                      className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-medium">{category.name}</h2>
                        <ArrowRight
                          size={18}
                          className="text-[#0B1F3A]/40"
                        />
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-[#0B1F3A]/60 mb-4">
                    Nenhuma categoria encontrada
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </main>

        {/* Admin Login Button */}
        <div className="mt-12 text-center pb-8">
          {!isAuthenticated ? (
            <>
              <button
                onClick={handleAdminLogin}
                className="inline-flex items-center gap-2 py-3 px-6 bg-white rounded-full text-[#0B1F3A]/60 hover:text-[#0B1F3A] text-sm shadow-sm hover:shadow transition-all"
              >
                <Lock size={14} />
                Admin
              </button>
              
              {loginError && (
                <div className="mt-4 text-red-500 bg-red-50 p-3 rounded-lg max-w-sm mx-auto">
                  {loginError}
                </div>
              )}
            </>
          ) : (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 py-3 px-6 bg-[#0B1F3A] text-white rounded-full text-sm shadow-sm hover:shadow transition-all"
            >
              <Settings size={14} />
              Painel Administrativo
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
