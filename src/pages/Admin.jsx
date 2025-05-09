import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Layers, Package, ChevronLeft, Home, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import AdminEditProduct from "../components/admin/AdminEditProduct";
import CategoryManager from "../components/admin/CategoryManager";
import ProtectedRoute from "../components/ProtectedRoute";
import { useIsMobile } from "@/hooks/use-mobile"; // Corrected path assuming jsconfig.json paths
import { Button } from "@/components/ui/button"; // Corrected path assuming jsconfig.json paths

export default function Admin() {
  const [activeView, setActiveView] = React.useState(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await User.logout();
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F4F1EC] pt-8 md:pt-16">
        <div className="container mx-auto px-4">
          {/* Logo e Título */}
          <div className="text-center mb-6">
            <h1 className="font-belleza text-4xl md:text-5xl text-[#0B1F3A] mb-3">DONARE HOME</h1>
            <p className="text-[#0B1F3A]/70 text-lg mb-4">Painel Administrativo</p>
          </div>

          {/* Navegação */}
          <div className="flex items-center justify-between mb-8">
            {activeView ? (
              <Button
                variant="ghost"
                size={isMobile ? "xl" : "default"}
                onClick={() => setActiveView(null)}
                className="text-[#0B1F3A]"
              >
                <ChevronLeft size={20} />
                {!isMobile && <span className="text-sm font-medium">Voltar</span>}
              </Button>
            ) : (
              <Button
                asChild
                variant="ghost"
                size={isMobile ? "xl" : "default"}
                className="text-[#0B1F3A]"
              >
                <Link to={createPageUrl("Home")}>
                  <Home size={20} className={!isMobile ? "mr-1" : ""} />
                  {!isMobile && <span className="text-sm font-medium">Ir para Home</span>}
                </Link>
              </Button>
            )}

            <Button
              onClick={handleLogout}
              variant="outline" // Using outline, can adjust if needed
              size={isMobile ? "xl" : "default"}
              className={`bg-white text-[#0B1F3A] hover:bg-slate-50 ${isMobile ? 'p-4' : ''}`} // Added bg-white for solid background and p-4 for mobile
            >
              <LogOut size={20} className={!isMobile ? "mr-2" : ""} />
              {!isMobile && <span className="text-sm font-medium">Sair</span>}
            </Button>
          </div>

          {/* Conteúdo */}
          {!activeView ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid gap-4 max-w-xl mx-auto"
            >
              <button
                onClick={() => setActiveView('products')}
                className="flex items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-left hover:scale-[1.02]"
              >
                <Package size={24} className="text-[#0B1F3A] mr-4" />
                <div>
                  <h2 className="text-lg sm:text-xl font-belleza text-[#0B1F3A]">Produtos</h2>
                  <p className="text-[#0B1F3A]/70 text-sm">Gerenciar produtos do catálogo</p>
                </div>
              </button>

              <button
                onClick={() => setActiveView('categories')}
                className="flex items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-left hover:scale-[1.02]"
              >
                <Layers size={24} className="text-[#0B1F3A] mr-4" />
                <div>
                  <h2 className="text-lg sm:text-xl font-belleza text-[#0B1F3A]">Categorias</h2>
                  <p className="text-[#0B1F3A]/70 text-sm">Gerenciar categorias do catálogo</p>
                </div>
              </button>

            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {activeView === 'products' && <AdminEditProduct onSave={() => setActiveView(null)} />}
              {activeView === 'categories' && <CategoryManager />}
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}