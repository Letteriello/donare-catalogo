import { useState } from 'react';
import PropTypes from 'prop-types';
import { importOlistCatalog } from '@/api/olistIntegration';
import { setTinyToken, testTinyConnection } from '@/api/tinyIntegration';
import { 
  Download, RefreshCw, CheckCircle, AlertCircle, 
  Truck, Key, Database, ArrowRight, Settings
} from 'lucide-react';

/**
 * Página de Integrações do Admin que centraliza Olist e Tiny ERP
 */
export default function IntegrationsPage() {
  // State para tab atual
  const [activeTab, setActiveTab] = useState('olist');
  
  // Retorna o componente correspondente à tab selecionada
  const renderTabContent = () => {
    switch (activeTab) {
      case 'olist':
        return <OlistIntegration />;
      case 'tiny':
        return <TinyIntegration />;
      default:
        return <OlistIntegration />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#0B1F3A]">Integrações</h1>
      
      <div className="mb-6 flex border-b border-gray-200">
        <TabButton 
          active={activeTab === 'olist'} 
          onClick={() => setActiveTab('olist')}
          icon={<Database size={16} />}
          label="Catálogo Olist"
        />
        <TabButton 
          active={activeTab === 'tiny'} 
          onClick={() => setActiveTab('tiny')}
          icon={<Truck size={16} />}
          label="Frete Tiny ERP"
        />
      </div>
      
      {renderTabContent()}
    </div>
  );
}

/**
 * Componente de botão de tab
 */
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm ${
        active
          ? 'border-[#0B1F3A] text-[#0B1F3A]'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );
}

// Validação de props do TabButton
TabButton.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired
};

/**
 * Componente para integração com Olist
 */
function OlistIntegration() {
  const [isImporting, setIsImporting] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('olist_api_key') || '');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsImporting(true);
      setImportResult(null);
      
      // Atualizar a API key na memória
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
    <div>
      <div className="bg-white shadow-sm rounded-xl p-6 mb-8">
        <div className="flex items-center mb-4">
          <Database size={20} className="text-[#0B1F3A] mr-2" />
          <h2 className="text-lg font-semibold text-[#0B1F3A]">Importação de Catálogo Olist</h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          Importe seu catálogo de produtos diretamente da Olist para o seu site.
        </p>
        
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
    </div>
  );
}

/**
 * Componente para integração com Tiny ERP
 */
function TinyIntegration() {
  const [token, setToken] = useState(localStorage.getItem('tiny_token') || '15e1c07a36aef142a17114caf354c42ad3daeb673bedb496d34357ad486fad53');
  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  const handleSaveToken = () => {
    try {
      setTinyToken(token);
      
      setTestResult({
        success: true,
        message: 'Token salvo com sucesso!'
      });
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setTestResult(null);
      }, 3000);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Erro ao salvar token: ${error.message}`
      });
    }
  };
  
  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      
      // Atualizar token antes do teste
      setTinyToken(token);
      
      // Testar conexão
      const result = await testTinyConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Erro no teste: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <div>
      <div className="bg-white shadow-sm rounded-xl p-6 mb-8">
        <div className="flex items-center mb-4">
          <Truck size={20} className="text-[#0B1F3A] mr-2" />
          <h2 className="text-lg font-semibold text-[#0B1F3A]">Integração com Tiny ERP (Fretes)</h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          Configure a integração com o Tiny ERP para calcular fretes automaticamente em seu site.
        </p>
        
        <div className="mb-4">
          <label className="block text-[#0B1F3A] font-medium mb-2">
            Token do Tiny ERP
          </label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Digite o token do Tiny ERP"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-2 text-gray-500"
            >
              {showToken ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            O token é armazenado localmente e não é compartilhado.
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-[#0B1F3A] font-medium mb-2">
            Identificador do Integrador
          </label>
          <input
            type="text"
            value="8471"
            disabled
            className="w-full p-2 border border-gray-300 rounded bg-gray-50"
          />
          <p className="text-sm text-gray-500 mt-1">
            Este é o ID fixo do seu integrador.
          </p>
        </div>
        
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleSaveToken}
            className="flex items-center justify-center px-4 py-2 rounded-lg
              bg-[#0B1F3A] text-white hover:bg-[#0B1F3A]/90 transition-colors"
          >
            <Key size={18} className="mr-2" />
            Salvar Token
          </button>
          
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className={`flex items-center justify-center px-4 py-2 rounded-lg
              ${isTesting 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-white border border-[#0B1F3A] text-[#0B1F3A] hover:bg-gray-50'
              } transition-colors`}
          >
            {isTesting ? (
              <>
                <RefreshCw size={18} className="mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Settings size={18} className="mr-2" />
                Testar Conexão
              </>
            )}
          </button>
        </div>
      </div>
      
      {testResult && (
        <div className={`p-4 rounded-lg mb-4 ${
          testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            {testResult.success ? (
              <CheckCircle className="text-green-500 mr-3 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-red-500 mr-3 mt-0.5" size={20} />
            )}
            <div>
              <h3 className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.success ? 'Sucesso' : 'Erro'}
              </h3>
              <p className="text-sm mt-1">{testResult.message}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 flex items-center">
          <ArrowRight size={16} className="mr-2" />
          Como funciona
        </h3>
        <p className="text-sm text-blue-700 mt-1">
          Esta integração permite calcular fretes automaticamente no checkout usando a API do Tiny ERP.
          As cotações são feitas em tempo real com base no CEP do cliente e características dos produtos.
        </p>
      </div>
    </div>
  );
}
