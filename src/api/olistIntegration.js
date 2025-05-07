  // Integração com API da Olist
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';

// Configurações da API Olist a partir de variáveis de ambiente
const API_MODE = import.meta.env.VITE_API_MODE || 'embedded'; // 'embedded' para dados simulados, 'production' para API real
const OLIST_BASE_URL = import.meta.env.VITE_OLIST_BASE_URL || 'https://api.olist.com';
const OLIST_API_VERSION = import.meta.env.VITE_OLIST_API_VERSION || 'v3';

// Função simples para encriptar/desencriptar o token
const encryptToken = (token) => {
  // Implementação simples de obscurecimento apenas para interface
  // Em produção, substituir por uma solução mais segura
  return btoa(`olist_${token}_secure`);
};

const decryptToken = (encrypted) => {
  if (!encrypted) return null;
  try {
    const decoded = atob(encrypted);
    return decoded.replace('olist_', '').replace('_secure', '');
  } catch (e) {
    console.error('Erro ao decodificar token', e);
    return null;
  }
};

// Função para obter a API key armazenada localmente
const getOlistApiKey = () => {
  // Verificar primeiro no localStorage
  const encryptedKey = window.localStorage.getItem('olist_api_key');
  if (encryptedKey) {
    return decryptToken(encryptedKey);
  }
  
  // Token de ambiente para desenvolvimento ou valor padrão
  const envToken = import.meta.env.VITE_OLIST_API_TOKEN || '15e1c07a36aef142a17114caf354c42ad3daeb673bedb496d34357ad486fad53';
  
  // Armazenar no localStorage
  window.localStorage.setItem('olist_api_key', encryptToken(envToken));
  return envToken;
};

/**
 * Busca o catálogo de produtos da Olist e importa para o Firestore
 * @param {boolean} replaceExisting - Se true, remove produtos existentes antes de importar
 * @returns {Promise<{success: boolean, imported: number, errors: number}>}
 */
export const importOlistCatalog = async (replaceExisting = false) => {
  try {
    // 1. Se configurado para substituir, limpar produtos existentes
    if (replaceExisting) {
      await clearExistingProducts();
    }
    
    // 2. Buscar categorias da Olist
    const categories = await fetchOlistCategories();
    
    // 3. Mapear categorias para o formato do Firebase
    const categoryMap = await processCategories(categories);
    
    // 4. Buscar produtos da Olist
    const products = await fetchOlistProducts();
    
    // 5. Importar produtos para o Firebase
    const result = await importProducts(products, categoryMap);
    
    return {
      success: true,
      message: `Importação concluída: ${result.imported} produtos importados, ${result.errors} erros`,
      ...result
    };
  } catch (error) {
    console.error('Erro ao importar catálogo da Olist:', error);
    return {
      success: false,
      message: `Erro na importação: ${error.message}`,
      imported: 0,
      errors: 1
    };
  }
};

/**
 * Limpa todos os produtos existentes no Firestore
 * @private
 */
const clearExistingProducts = async () => {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  
  const deletePromises = snapshot.docs.map(doc => 
    deleteDoc(doc.ref)
  );
  
  await Promise.all(deletePromises);
  console.log(`Removidos ${snapshot.docs.length} produtos existentes`);
};

/**
 * Busca categorias da API da Olist
 * @private
 * @returns {Promise<Array>} Lista de categorias
 */
const fetchOlistCategories = async () => {
  try {
    const apiKey = getOlistApiKey();
    const apiUrl = `${OLIST_BASE_URL}/api/${OLIST_API_VERSION}/categories`;
    
    // Modo embarcado: usar dados simulados em vez de chamar a API
    if (API_MODE === 'embedded') {
      console.log(`Modo embarcado: simulando dados para ${apiUrl}`);
      
      // Dados simulados no formato de produção
      return [
        {
          id: 'cat-1',
          name: 'Sala de Estar',
          description: 'Móveis e decoração para sala de estar',
          image_url: 'https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/categories%2Fsala.jpg?alt=media',
          position: 1
        },
        {
          id: 'cat-2',
          name: 'Quarto',
          description: 'Móveis e decoração para quarto',
          image_url: 'https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/categories%2Fquarto.jpg?alt=media',
          position: 2
        },
        {
          id: 'cat-3',
          name: 'Cozinha',
          description: 'Móveis e utensílios para cozinha',
          image_url: 'https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/categories%2Fcozinha.jpg?alt=media',
          position: 3
        }
      ];
    }
    
    // Modo de produção: chamada real à API
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar categorias: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Erro ao buscar categorias da Olist:', error);
    // Em caso de erro em ambiente de produção, retornar array vazio
    // para não bloquear o fluxo
    return [];
  }
};

/**
 * Processa categorias da Olist e adiciona ao Firestore
 * @private
 * @param {Array} categories - Lista de categorias da Olist
 * @returns {Promise<Object>} Mapa de IDs de categorias Olist para IDs Firestore
 */
const processCategories = async (categories) => {
  const categoryMap = {};
  
  // Verificar se já existem categorias mapeadas no Firestore
  const categoriesRef = collection(db, 'categories');
  const existingCategoriesSnapshot = await getDocs(categoriesRef);
  
  // Criar um mapa de categorias existentes por nome para evitar duplicação
  const existingCategoriesByName = {};
  existingCategoriesSnapshot.forEach(doc => {
    const category = doc.data();
    existingCategoriesByName[category.name] = {
      id: doc.id,
      ...category
    };
  });
  
  // Processar cada categoria da Olist
  for (const category of categories) {
    try {
      // Verificar se a categoria já existe
      if (existingCategoriesByName[category.name]) {
        categoryMap[category.id] = existingCategoriesByName[category.name].id;
        continue;
      }
      
      // Criar slug a partir do nome
      const slug = category.name
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      // Adicionar ao Firestore
      const newCategory = {
        name: category.name,
        slug,
        description: category.description || '',
        image: category.image_url || '',
        order: category.position || 0,
        olistId: category.id
      };
      
      const docRef = await addDoc(collection(db, 'categories'), newCategory);
      categoryMap[category.id] = docRef.id;
    } catch (error) {
      console.error(`Erro ao processar categoria ${category.name}:`, error);
    }
  }
  
  return categoryMap;
};

/**
 * Busca produtos da API da Olist
 * @private
 * @returns {Promise<Array>} Lista de produtos
 */
const fetchOlistProducts = async () => {
  try {
    const apiKey = getOlistApiKey();
    const apiUrl = `${OLIST_BASE_URL}/api/${OLIST_API_VERSION}/products`;

    // Modo embarcado: usar dados simulados em vez de chamar a API
    if (API_MODE === 'embedded') {
      console.log(`Modo embarcado: simulando dados para ${apiUrl}`);
      
      // Dados simulados no formato de produção
      return [
        {
          id: 'prod-1',
          name: 'Sofá 3 Lugares Cinza',
          description: 'Sofá confortável de 3 lugares em tecido cinza, estrutura em madeira maciça.',
          category_id: 'cat-1',
          price: 1899.90,
          sku: 'SOF-3LG-001',
          images: ['https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/products%2Fsofa-cinza.jpg?alt=media'],
          stock: 15
        },
        {
          id: 'prod-2',
          name: 'Mesa de Centro Retrô',
          description: 'Mesa de centro em madeira com design retrô, pés palito.',
          category_id: 'cat-1',
          price: 399.90,
          sku: 'MCR-001',
          images: ['https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/products%2Fmesa-centro-retro.jpg?alt=media'],
          stock: 8
        },
        {
          id: 'prod-4',
          name: 'Cama Box Casal',
          description: 'Cama box casal com colchão ortopédico e base em madeira.',
          category_id: 'cat-2',
          price: 1299.90,
          sku: 'CAM-BOX-01',
          images: ['https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/products%2Fcama-box-casal.jpg?alt=media'],
          stock: 10
        },
        {
          id: 'prod-6',
          name: 'Conjunto de Panelas Antiaderente',
          description: 'Conjunto com 5 panelas antiaderentes de alumínio com cabos em silicone.',
          category_id: 'cat-3',
          price: 249.90,
          sku: 'PAN-ANT-5',
          images: ['https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/products%2Fpanelas.jpg?alt=media'],
          stock: 12
        }
      ];
    }
    
    // Modo de produção: chamada real à API
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar produtos: ${response.status}`);
    }
    
    const data = await response.json();
    // A API v3 retorna os dados no formato { data: [...], pagination: {...} }
    return data.data || [];
  } catch (error) {
    console.error('Erro ao buscar produtos da Olist:', error);
    throw error;
  }
};

/**
 * Importa produtos da Olist para o Firebase
 * @private
 * @param {Array} products - Lista de produtos da Olist
 * @param {Object} categoryMap - Mapa de IDs de categorias
 * @returns {Promise<{imported: number, errors: number}>}
 */
const importProducts = async (products, categoryMap) => {
  let imported = 0;
  let errors = 0;
  
  for (const product of products) {
    try {
      // Verificar se o produto já existe por ID externo
      const productsRef = collection(db, 'products');
      const existingQuery = query(
        productsRef, 
        where('olistId', '==', product.id)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      // Se o produto já existe, pular
      if (!existingSnapshot.empty) {
        continue;
      }
      
      // Mapear para o formato do Firebase
      const newProduct = {
        name: product.name,
        description: product.description || '',
        price: product.price || 0,
        images: product.images || [],
        categoryId: categoryMap[product.category_id] || null,
        sku: product.sku || '',
        olistId: product.id,
        stock: product.stock || 0,
        createdAt: new Date()
      };
      
      // Adicionar ao Firestore
      await addDoc(collection(db, 'products'), newProduct);
      imported++;
    } catch (error) {
      console.error(`Erro ao importar produto ${product.name}:`, error);
      errors++;
    }
  }
  
  return { imported, errors };
};

/**
 * Sincroniza um produto específico da Olist
 * @param {string} olistProductId - ID do produto na Olist
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const syncOlistProduct = async (olistProductId) => {
  try {
    // Em modo embarcado, simular sincronização
    if (API_MODE === 'embedded') {
      console.log(`Modo embarcado: simulando sincronização para produto ${olistProductId}`);
      return {
        success: true,
        message: `Produto ${olistProductId} sincronizado com sucesso (simulado)`
      };
    }
    
    const apiKey = getOlistApiKey();
    
    // Buscar o produto específico na API da Olist
    const response = await fetch(`${OLIST_BASE_URL}/api/${OLIST_API_VERSION}/products/${olistProductId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar produto: ${response.status}`);
    }
    
    const product = await response.json();
    
    // Obter mapeamento de categorias
    const categories = await fetchOlistCategories();
    const categoryMap = await processCategories(categories);
    
    // Verificar se o produto já existe
    const productsRef = collection(db, 'products');
    const existingQuery = query(
      productsRef, 
      where('olistId', '==', product.id)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    // Preparar dados do produto
    const productData = {
      name: product.name,
      description: product.description || '',
      price: product.price || 0,
      images: product.images || [],
      categoryId: categoryMap[product.category_id] || null,
      sku: product.sku || '',
      olistId: product.id,
      stock: product.stock || 0,
      updatedAt: new Date()
    };
    
    if (existingSnapshot.empty) {
      // Criar novo produto
      productData.createdAt = new Date();
      await addDoc(collection(db, 'products'), productData);
      return { 
        success: true, 
        message: `Produto ${product.name} importado com sucesso` 
      };
    } else {
      // Atualizar produto existente
      const docRef = existingSnapshot.docs[0].ref;
      await updateDoc(docRef, productData);
      return { 
        success: true, 
        message: `Produto ${product.name} atualizado com sucesso` 
      };
    }
  } catch (error) {
    console.error('Erro ao sincronizar produto da Olist:', error);
    return {
      success: false,
      message: `Erro ao sincronizar: ${error.message}`
    };
  }
};
