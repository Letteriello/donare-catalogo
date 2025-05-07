// Upload de arquivos para Firebase Storage
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Faz upload de um arquivo para o Firebase Storage
 * @param {File} file - Arquivo a ser enviado
 * @param {string} path - Caminho no storage (ex: 'products', 'categories')
 * @returns {Promise<string>} URL pública do arquivo
 */
export async function UploadFile(file, path = 'uploads') {
  try {
    // Criar nome único para o arquivo
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}-${file.name}`;
    
    // Referência para o storage
    const storageRef = ref(storage, `${path}/${fileName}`);
    
    // Upload do arquivo
    const snapshot = await uploadBytes(storageRef, file);
    
    // Obter URL pública
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    throw error;
  }
}
