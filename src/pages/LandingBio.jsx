import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Instagram, Lightbulb, MessageCircle, FileText, ExternalLink } from "lucide-react";
import PropTypes from "prop-types";

export default function LandingBio() {
  // Estados para animações e interações
  const [activeButton, setActiveButton] = useState(null);

  // Animações
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Links para redes sociais e contatos
  const links = [
    { 
      id: 'catalog', 
      icon: <FileText size={20} />, 
      label: "Ver Catálogo", 
      url: "/home", 
      primary: true 
    },
    { 
      id: 'instagram', 
      icon: <Instagram size={20} />, 
      label: "Instagram", 
      url: "https://www.instagram.com/donarehome_", 
      external: true 
    },
    { 
      id: 'pinterest', 
      icon: <Lightbulb size={20} />, 
      label: "Idéias no Pinterest 💡", 
      url: "https://br.pinterest.com/donarehome/", 
      external: true 
    },
    { 
      id: 'whatsapp', 
      icon: <MessageCircle size={20} />, 
      label: "WhatsApp", 
      url: "https://wa.me/5547991106023", 
      external: true 
    }
  ];

  // Renderização do componente
  return (
    <div className="min-h-screen bg-[#F4F1EC] flex flex-col items-center justify-center p-4">
      <motion.div 
        className="max-w-md w-full mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo e cabeçalho */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <img 
              src="/logo.png" 
              alt="Donare Home" 
              className="h-24 w-auto"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "https://placehold.co/200x200/F4F1EC/0B1F3A?text=Donare+Home";
              }}
            />
          </div>
          <h1 className="font-belleza text-4xl text-[#0B1F3A] mb-2">Donare Home</h1>
          <p className="text-[#0B1F3A]/70 text-lg">Decoração para sua casa</p>
        </div>

        {/* Links e botões */}
        <motion.div
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {links.map((link) => (
            <motion.div
              key={link.id}
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              animate={activeButton === link.id ? "active" : ""}
              onClick={() => setActiveButton(link.id)}
              className={`w-full ${link.primary ? 'mb-6' : ''}`}
            >
              {link.external ? (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between px-6 py-4 rounded-xl w-full transition-all ${
                    link.primary 
                      ? 'bg-[#0B1F3A] text-white hover:bg-[#0B1F3A]/90' 
                      : 'bg-white text-[#0B1F3A] hover:bg-[#0B1F3A]/5'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-3">{link.icon}</span>
                    <span className="font-medium">{link.label}</span>
                  </div>
                  <ExternalLink size={16} />
                </a>
              ) : (
                <Link
                  to={link.url}
                  className={`flex items-center justify-between px-6 py-4 rounded-xl w-full transition-all ${
                    link.primary 
                      ? 'bg-[#0B1F3A] text-white hover:bg-[#0B1F3A]/90' 
                      : 'bg-white text-[#0B1F3A] hover:bg-[#0B1F3A]/5'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-3">{link.icon}</span>
                    <span className="font-medium">{link.label}</span>
                  </div>
                  <ArrowRight size={16} />
                </Link>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Rodapé */}
        <motion.div 
          className="mt-12 text-center text-[#0B1F3A]/50 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <p>© {new Date().getFullYear()} Donare Home</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Importação local para o componente ArrowRight (caso não esteja disponível no lucide-react)
const ArrowRight = ({ size }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
);

// Definição das PropTypes
ArrowRight.propTypes = {
  size: PropTypes.number.isRequired
};
