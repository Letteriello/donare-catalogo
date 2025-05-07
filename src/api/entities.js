// Implementações de entidades com Firebase Firestore
import { db, auth } from './firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit 
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      return [];
    }
  },
  
  get: async (id) => {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
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
      const docRef = await addDoc(collection(db, 'products'), productData);
      return { id: docRef.id, ...productData };
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
      let categoriesQuery;
      
      try {
        // Tenta primeiro com ordenação por 'order'
        categoriesQuery = query(
          collection(db, 'categories'),
          orderBy('order')
        );
      } catch (orderError) {
        console.warn('Campo order não existe, usando nome para ordenação:', orderError);
        
        // Se falhar, usa ordenação por 'name'
        categoriesQuery = query(
          collection(db, 'categories'),
          orderBy('name')
        );
      }
      
      // Se ainda falhar, busca sem ordenação
      try {
        const snapshot = await getDocs(categoriesQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (queryError) {
        console.warn('Erro na query com ordenação, buscando sem ordenação:', queryError);
        
        // Último recurso: busca sem ordenação
        const simpleQuery = collection(db, 'categories');
        const snapshot = await getDocs(simpleQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      return [];
    }
  },
  
  get: async (id) => {
    try {
      const docRef = doc(db, 'categories', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
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
      return { id: docRef.id, ...categoryData };
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  },
  
  update: async (id, categoryData) => {
    try {
      const docRef = doc(db, 'categories', id);
      await updateDoc(docRef, categoryData);
      return { id, ...categoryData };
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
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
          updatedAt: new Date()
        });
        
        if (User.current && User.current.uid === uid) {
          User.current = {
            ...User.current,
            ...userData
          };
        }
        
        return { 
          uid,
          ...userData
        };
      } else {
        throw new Error('Usuário não encontrado');
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }
};
