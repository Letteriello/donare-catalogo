// Upload de arquivos para o servidor local
/**
 * Faz upload de um arquivo para o servidor local
 * @param {Object} params - Parâmetros da função
 * @param {File} params.file - Arquivo a ser enviado
 * @param {string} params.path - Caminho no storage (ex: 'products', 'categories')
 * @returns {Promise<{file_url: string}>} URL pública do arquivo
 */
export async function UploadFile({ file, path = 'products' }) {
  try {
    if (!file) {
      throw new Error('Arquivo não fornecido');
    }

    // Criar um FormData para enviar o arquivo
    const formData = new FormData();
    formData.append('file', file);

    // Determina o URL do servidor de upload
    // Em desenvolvimento: localhost:3001
    // Em produção: o mesmo domínio da aplicação
    const isDev = import.meta.env.DEV;
    let uploadUrl;
    
    if (isDev) {
      uploadUrl = `http://localhost:3001/api/upload/${path}`;
    } else {
      // Em produção, usa o mesmo domínio da aplicação frontend
      uploadUrl = `/api/upload/${path}`;
    }
    
    // Faz a requisição para o servidor de upload
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao fazer upload');
    }
    
    const data = await response.json();
    
    // O backend retorna um caminho relativo como /uploads/products/image.png
    // O frontend constrói a URL completa.
    // Em desenvolvimento, se o servidor de upload estiver em outra porta, window.location.origin pode não ser o correto
    // para exibir a imagem diretamente, mas para armazenamento, o caminho relativo é o que importa.
    // Para produção (Easypanel), window.location.origin será o domínio correto.
    const absoluteFileUrl = `${window.location.origin}${data.file_url}`;
    
    return { ...data, file_url: absoluteFileUrl }; // Retorna { success: true, file_url: 'https://yourdomain.com/uploads/...' }
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    throw error;
  }
}
