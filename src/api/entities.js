// Implementações de entidades com Firebase Firestore
import { db, auth } from './firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { 
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from 'firebase/auth';

// Entidade Product
export const Product = {
  // Métodos para manipulação de produtos
  list: async (categoryId = null) => {
    try {
      let productsQuery;
      
      if (categoryId) {
        productsQuery = query(
          collection(db, 'products'), 
          where('categoryId', '==', categoryId),
          orderBy('name')
        );
      } else {
        productsQuery = query(
          collection(db, 'products'),
          orderBy('name')
        );
      }
      
      const snapshot = await getDocs(productsQuery);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      return [];
    }
  },
  
  // NOVO: Método para ouvir mudanças em tempo real nos produtos
  listenForChanges: (callback, categoryId = null) => {
    try {
      console.log(`[DEBUG] Configurando listener para produtos ${categoryId ? `da categoria: ${categoryId}` : 'de todas as categorias'}`);
      
      // Define a query com ou sem filtro por categoria
      let productsQuery;
      
      if (categoryId) {
        // Utilizamos o campo 'categoryId' para filtrar produtos
        // Vamos garantir que estamos usando o campo correto e valor correto
        console.log(`[DEBUG] Buscando produtos com categoryId = '${categoryId}'`);
        
        productsQuery = query(
          collection(db, 'products'), 
          where('categoryId', '==', categoryId)
          // a ordenação foi removida para evitar problemas com índices
        );
      } else {
        // Sem filtro, podemos manter a ordenação
        productsQuery = query(
          collection(db, 'products'),
          orderBy('name')
        );
      }
      
      // Registra o listener e armazena a função de cancelamento
      const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
        // Mapeia os documentos recebidos para o formato esperado
        const products = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        
        // Chama o callback fornecido com os dados atualizados
        callback(products);
      }, (error) => {
        console.error('Erro no listener de produtos:', error);
        callback([]);
      });
      
      // Retorna a função de cancelamento para ser usada quando não precisarmos mais escutar
      return unsubscribe;
    } catch (error) {
      console.error('Erro ao configurar listener para produtos:', error);
      return () => {}; // Função vazia em caso de falha
    }
  },
  
  get: async (id) => {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id };
      } else {
        console.log('Produto não encontrado');
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return null;
    }
  },
  
  create: async (productData) => {
    try {
      // Garantir que os dados do produto estão formatados corretamente
      // Especialmente o campo categoryId que deve estar no formato correto
      console.log('[DEBUG] Criando produto com dados:', productData);
      
      // Verificar se categoryId existe e não está vazio
      if (!productData.categoryId) {
        console.error('Erro: tentativa de criar produto sem categoryId');
        throw new Error('O campo categoryId é obrigatório para criar um produto');
      }
      
      // Garantir que o campo categoryId seja uma string
      const productToSave = {
        ...productData,
        categoryId: String(productData.categoryId),
        priceRetail: productData.priceRetail || null,
        priceWholesale: productData.priceWholesale || null,
        dimensions: {
          height: productData.dimensions?.height || null,
          width: productData.dimensions?.width || null,
          length: productData.dimensions?.length || null,
        },
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'products'), productToSave);
      console.log(`[DEBUG] Produto criado com ID: ${docRef.id}`);
      return { ...productToSave, id: docRef.id };
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  },
  
  update: async (id, productData) => {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, productData);
      return { id, ...productData };
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      throw error;
    }
  }
};

// Entidade Category
export const Category = {
  // Métodos para manipulação de categorias
  list: async () => {
    try {
      // Primeiro, tentamos com getDocs para compatibilidade imediata
      const categoriesQuery = query(collection(db, 'categories'), orderBy('order'));
      const snapshot = await getDocs(categoriesQuery);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      return [];
    }
  },

  // NOVO: Método para ouvir mudanças em tempo real nas categorias
  listenForChanges: (callback) => {
    try {
      // Cria um listener em tempo real para a coleção de categorias, ordenado por 'order'
      const categoriesQuery = query(collection(db, 'categories'), orderBy('order'));
      
      // Registra o listener e armazena a função de cancelamento
      const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
        // Mapeia os documentos recebidos para o formato esperado
        const categories = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        
        // Chama o callback fornecido com os dados atualizados
        callback(categories);
      }, (error) => {
        console.error('Erro no listener de categorias:', error);
        callback([]);
      });
      
      // Retorna a função de cancelamento para ser usada quando não precisarmos mais escutar
      return unsubscribe;
    } catch (error) {
      console.error('Erro ao configurar listener para categorias:', error);
      return () => {}; // Função vazia em caso de falha
    }
  },
  
  get: async (id) => {
    try {
      const docRef = doc(db, 'categories', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id };
      } else {
        console.log('Categoria não encontrada');
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      return null;
    }
  },
  
  create: async (categoryData) => {
    try {
      const docRef = await addDoc(collection(db, 'categories'), categoryData);
      // Ensure Firestore's generated ID is the one returned, even if categoryData has an 'id' field.
      return { ...categoryData, id: docRef.id };
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  },
  
  update: async (id, categoryData) => {
    try {
      console.log(`Tentando atualizar documento com ID: ${id}`, categoryData);
      
      // Remover o campo ID dos dados a serem atualizados para evitar conflitos
      // O Firestore não permite alterar o ID do documento
      const dataToUpdate = { ...categoryData };
      delete dataToUpdate.id; // Remove o campo ID se existir
      
      // Criar referência do documento
      const docRef = doc(db, 'categories', id);
      
      // Verificar se o documento existe
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        console.error(`Documento não encontrado para o ID: ${id}`);
        throw new Error('Documento não encontrado no Firestore');
      }
      
      console.log('Documento encontrado, atualizando com dados:', dataToUpdate);
      
      // Atualizar o documento
      await updateDoc(docRef, dataToUpdate);
      console.log('Documento atualizado com sucesso');
      
      return { id, ...dataToUpdate };
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      console.log(`Tentando excluir documento com ID: ${id}`);
      
      // Criar referência do documento
      const docRef = doc(db, 'categories', id);
      
      // Verificar se o documento existe antes de tentar excluir
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        console.error(`Documento não encontrado para o ID: ${id}`);
        throw new Error('Documento não encontrado no Firestore');
      }
      
      console.log('Documento encontrado, excluindo...');
      
      // Excluir o documento
      await deleteDoc(docRef);
      console.log('Documento excluído com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      throw error;
    }
  }
};

// Entidade User
export const User = {
  // Estado atual
  current: null,
  
  // Métodos para autenticação e manipulação de usuários
  login: async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Configurações para minimizar problemas de COOP
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Usar popup com configurações otimizadas
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Verificar se o email é do administrador
      if (user.email !== 'hdonare@gmail.com') {
        await signOut(auth);
        throw new Error('Acesso restrito apenas ao administrador');
      }
      
      // Verificar se o usuário já existe no Firestore
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', '==', user.uid),
        limit(1)
      );
      
      const snapshot = await getDocs(usersQuery);
      
      if (snapshot.empty) {
        // Criar usuário com permissões de admin no Firestore
        await addDoc(collection(db, 'users'), {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'Admin',
          photoURL: user.photoURL || '',
          role: 'admin',
          createdAt: new Date()
        });
      }
      
      // Buscar dados do usuário
      const userData = snapshot.empty ? {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'Admin',
        photoURL: user.photoURL || '',
        role: 'admin'
      } : { 
        uid: user.uid, 
        email: user.email,
        ...snapshot.docs[0].data()
      };
      
      User.current = userData;
      return userData;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await signOut(auth);
      User.current = null;
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  },
  
  getCurrentUser: () => {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        
        if (user) {
          try {
            // Verificar se o email é do administrador
            if (user.email !== 'hdonare@gmail.com') {
              await signOut(auth);
              resolve(null);
              return;
            }
            
            // Buscar dados adicionais do usuário no Firestore
            const usersQuery = query(
              collection(db, 'users'),
              where('uid', '==', user.uid),
              limit(1)
            );
            
            const snapshot = await getDocs(usersQuery);
            
            if (!snapshot.empty) {
              User.current = { 
                uid: user.uid, 
                email: user.email,
                ...snapshot.docs[0].data()
              };
              resolve(User.current);
            } else {
              User.current = { 
                uid: user.uid, 
                email: user.email,
                name: user.displayName || 'Admin',
                photoURL: user.photoURL || '',
                role: 'admin'
              };
              resolve(User.current);
            }
          } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            resolve({ 
              uid: user.uid, 
              email: user.email
            });
          }
        } else {
          User.current = null;
          resolve(null);
        }
      }, reject);
    });
  },
  
  me: async () => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        // Ao invés de lançar erro, apenas retornamos null quando não há usuário autenticado
        return null;
      }
      
      // Verificar se o email é do administrador
      if (currentUser.email !== 'hdonare@gmail.com') {
        await signOut(auth);
        throw new Error('Acesso restrito apenas ao administrador');
      }
      
      // Buscar dados adicionais do usuário no Firestore
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', '==', currentUser.uid),
        limit(1)
      );
      
      const snapshot = await getDocs(usersQuery);
      
      if (!snapshot.empty) {
        User.current = { 
          uid: currentUser.uid, 
          email: currentUser.email,
          ...snapshot.docs[0].data()
        };
        return User.current;
      } else {
        // Criar perfil no Firestore se não existir
        const userData = {
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName || 'Admin',
          photoURL: currentUser.photoURL || '',
          role: 'admin',
          createdAt: new Date()
        };
        
        await addDoc(collection(db, 'users'), userData);
        
        User.current = userData;
        return userData;
      }
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      throw error;
    }
  },
  
  get: async (uid) => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', '==', uid),
        limit(1)
      );
      
      const snapshot = await getDocs(usersQuery);
      
      if (!snapshot.empty) {
        return { 
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        };
      } else {
        console.log('Usuário não encontrado');
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  },
  
  update: async (uid, userData) => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', '==', uid),
        limit(1)
      );
      
      const snapshot = await getDocs(usersQuery);
      
      if (!snapshot.empty) {
        const userDocRef = doc(db, 'users', snapshot.docs[0].id);
        await updateDoc(userDocRef, {
          ...userData,
          updatedAt: serverTimestamp()
        });
        
        // Atualizar o User.current se o usuário modificado for o usuário logado
        if (User.current && User.current.uid === uid) {
          User.current = {
            ...User.current,
            ...userData
          };
        }
        
        return { 
          id: snapshot.docs[0].id, 
          ...userData 
        };
      } else {
        console.error('Usuário não encontrado para atualização');
        throw new Error('Usuário não encontrado');
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },
  
  delete: async (uid) => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', '==', uid),
        limit(1)
      );
      
      const snapshot = await getDocs(usersQuery);
      
      if (!snapshot.empty) {
        const userDocRef = doc(db, 'users', snapshot.docs[0].id);
        await deleteDoc(userDocRef);
        
        // Limpar User.current se o usuário excluído for o usuário logado
        if (User.current && User.current.uid === uid) {
          User.current = null;
        }
        
        return { success: true };
      } else {
        console.error('Usuário não encontrado para exclusão');
        throw new Error('Usuário não encontrado');
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw error;
    }
  }
};
