// Integração com API do ERP Tiny
import { db } from './firebase';
import { collection, addDoc, query, getDocs } from 'firebase/firestore';

// Configurações do ERP Tiny
const TINY_FRETE_ENDPOINT = '/api/tiny/cotar';
const TINY_INTEGRADOR_ID = '8471';

// Função para obter o token armazenado localmente
const getTinyToken = () => {
  const token = window.localStorage.getItem('tiny_token') || 
    '15e1c07a36aef142a17114caf354c42ad3daeb673bedb496d34357ad486fad53'; // Token padrão
  return token;
};

/**
 * Calcula frete para um pedido
 * @param {Object} orderData - Dados do pedido
 * @param {string} orderData.cep - CEP de destino
 * @param {Array} orderData.items - Itens do pedido
 * @param {number} orderData.total - Valor total do pedido
 * @returns {Promise<Object>} Objeto com status e opções de frete
 */
export const calculateShipping = async (orderData) => {
  try {
    const token = getTinyToken();
    
    // Validar CEP
    if (!orderData.cep || !/^\d{5}-?\d{3}$/.test(orderData.cep)) {
      throw new Error('CEP inválido. Use o formato 00000-000 ou 00000000');
    }
    
    // Formatar CEP para padrão sem hífen
    const cep = orderData.cep.replace(/[^0-9]/g, '');
    
    // Construir payload para API Tiny
    const payload = {
      token: token,
      id_integrador: TINY_INTEGRADOR_ID,
      cep_destino: cep,
      valor_pedido: orderData.total,
      itens: orderData.items.map(item => ({
        peso: item.weight || 0.1, // Peso em kg (padrão 100g)
        altura: item.height || 5, // Altura em cm (padrão 5cm)
        largura: item.width || 15, // Largura em cm (padrão 15cm)
        comprimento: item.length || 15, // Comprimento em cm (padrão 15cm)
        valor_unitario: item.price,
        quantidade: item.quantity
      }))
    };
    
    // Chamar API de cotação de frete
    const response = await fetch(TINY_FRETE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ao calcular frete: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Verificar se há erro na resposta
    if (data.status === 'erro' || !data.resultado) {
      throw new Error(`Erro na API de frete: ${data.mensagem || 'Falha na cotação'}`);
    }
    
    // Formatar as opções de frete para um padrão mais amigável
    const shippingOptions = data.resultado.cotacoes.map(option => ({
      id: option.id,
      name: option.nome || option.servico,
      price: option.valor,
      currency: 'BRL',
      estimatedDays: option.prazo || null,
      company: option.transportadora || 'Transportadora',
      method: option.forma_envio || 'Padrão'
    }));
    
    // Registrar cotação no histórico (opcional)
    await saveShippingQuote({
      cep,
      timestamp: new Date(),
      orderTotal: orderData.total,
      options: shippingOptions,
      itemCount: orderData.items.length
    });
    
    return {
      success: true,
      options: shippingOptions
    };
    
  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    return {
      success: false,
      message: error.message,
      options: []
    };
  }
};

/**
 * Salva cotação de frete no histórico
 * @private
 * @param {Object} quoteData - Dados da cotação
 */
const saveShippingQuote = async (quoteData) => {
  try {
    // Adicionar ao Firestore para histórico e análise posterior
    await addDoc(collection(db, 'shipping_quotes'), quoteData);
  } catch (error) {
    // Apenas registrar erro, não interromper o fluxo principal
    console.error('Erro ao salvar histórico de cotação:', error);
  }
};

/**
 * Configura o token da API Tiny
 * @param {string} token - Token de autenticação
 */
export const setTinyToken = (token) => {
  if (!token) {
    throw new Error('Token inválido');
  }
  window.localStorage.setItem('tiny_token', token);
};

/**
 * Busca histórico de cotações de frete
 * @param {number} limit - Limite de registros a retornar
 * @returns {Promise<Array>} Histórico de cotações
 */
export const getShippingQuoteHistory = async (limit = 50) => {
  try {
    const quotesRef = collection(db, 'shipping_quotes');
    const quotesQuery = query(quotesRef);
    const snapshot = await getDocs(quotesQuery);
    
    const quotes = [];
    snapshot.forEach(doc => {
      quotes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Ordenar por timestamp descendente e limitar quantidade
    return quotes
      .sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate())
      .slice(0, limit);
      
  } catch (error) {
    console.error('Erro ao buscar histórico de cotações:', error);
    return [];
  }
};

/**
 * Testa a conexão com a API do Tiny
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const testTinyConnection = async () => {
  try {
    const token = getTinyToken();
    
    // Criar um payload de teste com CEP válido
    const testPayload = {
      token: token,
      id_integrador: TINY_INTEGRADOR_ID,
      cep_destino: '01310100', // CEP de exemplo (Av. Paulista)
      valor_pedido: 100,
      itens: [
        {
          peso: 0.5,
          altura: 10,
          largura: 20,
          comprimento: 20,
          valor_unitario: 100,
          quantidade: 1
        }
      ]
    };
    
    // Teste com a API real
    const response = await fetch(TINY_FRETE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    const data = await response.json();
    
    if (!response.ok || data.status === 'erro') {
      return {
        success: false,
        message: data.mensagem || 'Falha ao conectar com o Tiny ERP'
      };
    }
    
    return {
      success: true,
      message: 'Conexão com Tiny ERP estabelecida com sucesso!'
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Erro na conexão: ${error.message}`
    };
  }
};
