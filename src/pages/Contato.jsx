
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Send, MessageCircle, Phone, Mail, AlertCircle, CheckCircle, ChevronLeft } from "lucide-react";

export default function Contato() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    mensagem: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // null, 'success', 'error'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simular envio do formulário
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Limpar o formulário e mostrar mensagem de sucesso
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        mensagem: ""
      });
      setSubmitStatus("success");
      
      // Limpar a mensagem de sucesso após 5 segundos
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EC] pt-8 md:pt-16">
      <div className="container mx-auto px-4">
        {/* Logo e Título */}
        <div className="text-center mb-6">
          <h1 className="font-belleza text-4xl md:text-5xl text-[#0B1F3A] mb-3">DONARE HOME</h1>
          <p className="text-[#0B1F3A]/70 text-lg mb-4">Entre em contato conosco</p>
        </div>
        
        {/* Navegação */}
        <div className="flex items-center justify-center mb-8">
          <Link 
            to={createPageUrl("Home")} 
            className="inline-flex items-center px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all group text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white"
          >
            <ChevronLeft size={20} className="mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Voltar para Home</span>
          </Link>
        </div>

        {/* Formulário e Informações */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Informações de Contato */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <div className="bg-white p-6 rounded-sm shadow-sm h-full">
                <h2 className="font-belleza text-2xl text-[#0B1F3A] mb-6">Fale Conosco</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-[#F4F1EC] p-3 rounded-sm mr-4">
                      <Phone className="w-5 h-5 text-[#0B1F3A]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#0B1F3A] mb-1">Telefone / WhatsApp</h3>
                      <p className="text-[#0B1F3A]/80">+55 47 99110-6023</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#F4F1EC] p-3 rounded-sm mr-4">
                      <Mail className="w-5 h-5 text-[#0B1F3A]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#0B1F3A] mb-1">E-mail</h3>
                      <p className="text-[#0B1F3A]/80">contato@donarehome.com.br</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#F4F1EC] p-3 rounded-sm mr-4">
                      <MessageCircle className="w-5 h-5 text-[#0B1F3A]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#0B1F3A] mb-1">Instagram</h3>
                      <p className="text-[#0B1F3A]/80">@donarehome</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Formulário */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <div className="bg-white p-6 rounded-sm shadow-sm">
                <h2 className="font-belleza text-2xl text-[#0B1F3A] mb-6">Envie uma Mensagem</h2>
                
                {submitStatus === "success" && (
                  <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-sm flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Mensagem enviada com sucesso!</p>
                      <p className="text-sm">Agradecemos seu contato. Responderemos em breve.</p>
                    </div>
                  </div>
                )}
                
                {submitStatus === "error" && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-sm flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Erro ao enviar mensagem</p>
                      <p className="text-sm">Por favor, tente novamente ou utilize outro método de contato.</p>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="nome" className="block text-sm font-medium text-[#0B1F3A] mb-1">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-[#0B1F3A]/20 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]/50"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-[#0B1F3A] mb-1">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-[#0B1F3A]/20 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]/50"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="telefone" className="block text-sm font-medium text-[#0B1F3A] mb-1">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        id="telefone"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-[#0B1F3A]/20 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]/50"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="mensagem" className="block text-sm font-medium text-[#0B1F3A] mb-1">
                      Mensagem *
                    </label>
                    <textarea
                      id="mensagem"
                      name="mensagem"
                      value={formData.mensagem}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-2 border border-[#0B1F3A]/20 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]/50"
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-center bg-[#0B1F3A] text-white px-6 py-3 rounded-sm hover:bg-[#0B1F3A]/90 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" /> Enviar Mensagem
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
