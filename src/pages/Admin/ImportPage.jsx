import React, { useState } from 'react';
import { importOlistCatalog } from '@/api/olistIntegration';
import { Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Página administrativa para importação do catálogo da Olist
 */
export default function ImportPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsImporting(true);
      setImportResult(null);
      
      // Atualizar a API key na memória (não é armazenada no banco de dados por segurança)
      window.localStorage.setItem('olist_api_key', apiKey);
      
      // Iniciar importação
      const result = await importOlistCatalog(replaceExisting);
      setImportResult(result);
    } catch (error) {
      setImportResult({
        success: false,
        message: `Erro na importação: ${error.message}`,
        imported: 0,
        errors: 1
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#0B1F3A]">Importar Catálogo da Olist</h1>
      
      <div className="bg-white shadow-sm rounded-xl p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#0B1F3A] font-medium mb-2">
              API Key da Olist
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Digite sua API Key da Olist"
                required
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showApiKey ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              A API Key é armazenada localmente e não é compartilhada.
            </p>
          </div>
          
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="mr-2"
              />
              <span>Substituir produtos existentes</span>
            </label>
            <p className="text-sm text-gray-500 ml-5 mt-1">
              Se marcado, todos os produtos existentes serão removidos antes da importação.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isImporting}
            className={`flex items-center justify-center px-4 py-2 rounded-lg
              ${isImporting 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-[#0B1F3A] text-white hover:bg-[#0B1F3A]/90'
              } transition-colors`}
          >
            {isImporting ? (
              <>
                <RefreshCw size={18} className="mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download size={18} className="mr-2" />
                Importar Catálogo
              </>
            )}
          </button>
        </form>
      </div>
      
      {importResult && (
        <div className={`p-4 rounded-lg mb-4 ${
          importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            {importResult.success ? (
              <CheckCircle className="text-green-500 mr-3 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-red-500 mr-3 mt-0.5" size={20} />
            )}
            <div>
              <h3 className={`font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {importResult.success ? 'Importação concluída' : 'Erro na importação'}
              </h3>
              <p className="text-sm mt-1">{importResult.message}</p>
              
              {importResult.success && (
                <div className="mt-2 flex flex-col space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Produtos importados:</span>
                    <span className="font-medium">{importResult.imported}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Erros encontrados:</span>
                    <span className="font-medium">{importResult.errors}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          A importação de produtos pode levar alguns minutos dependendo do tamanho do catálogo.
          <br />Não feche a página durante o processo.
        </p>
      </div>
    </div>
  );
}
