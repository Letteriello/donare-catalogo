import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Layers, Package, ChevronLeft, Home, LogOut, Globe } from "lucide-react";
import { motion } from "framer-motion";
import AdminEditProduct from "../components/admin/AdminEditProduct";
import CategoryManager from "../components/admin/CategoryManager";
import IntegrationsPage from "./Admin/IntegrationsPage";
import ProtectedRoute from "../components/ProtectedRoute";

export default function Admin() {
  const [activeView, setActiveView] = React.useState(null);
  const navigate = useNavigate();

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
              <button 
                onClick={() => setActiveView(null)}
                className="flex items-center text-[#0B1F3A] hover:text-[#0B1F3A]/70 transition-all"
              >
                <ChevronLeft size={20} className="mr-1" />
                <span className="text-sm font-medium">Voltar</span>
              </button>
            ) : (
              <Link 
                to={createPageUrl("Home")}
                className="flex items-center text-[#0B1F3A] hover:text-[#0B1F3A]/70 transition-all"
              >
                <Home size={20} className="mr-1" />
                <span className="text-sm font-medium">Ir para Home</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-[#0B1F3A]"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Sair</span>
            </button>
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
                  <h2 className="text-xl font-belleza text-[#0B1F3A]">Produtos</h2>
                  <p className="text-[#0B1F3A]/70 text-sm">Gerenciar produtos do catálogo</p>
                </div>
              </button>

              <button
                onClick={() => setActiveView('categories')}
                className="flex items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-left hover:scale-[1.02]"
              >
                <Layers size={24} className="text-[#0B1F3A] mr-4" />
                <div>
                  <h2 className="text-xl font-belleza text-[#0B1F3A]">Categorias</h2>
                  <p className="text-[#0B1F3A]/70 text-sm">Gerenciar categorias do catálogo</p>
                </div>
              </button>

              <button
                onClick={() => setActiveView('integrations')}
                className="flex items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-left hover:scale-[1.02]"
              >
                <Globe size={24} className="text-[#0B1F3A] mr-4" />
                <div>
                  <h2 className="text-xl font-belleza text-[#0B1F3A]">Integrações</h2>
                  <p className="text-[#0B1F3A]/70 text-sm">Conectar Olist e Tiny ERP</p>
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
              {activeView === 'integrations' && <IntegrationsPage />}
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}