/**
 * Cria uma URL formatada para navegação interna.
 *
 * @param pageName Nome da página ou caminho relativo
 * @param queryParams Objeto com parâmetros de querystring opcionais
 * @returns URL formatada
 */
export function createPageUrl(pageName: string, queryParams?: Record<string, string>) {
    // Mapeamento de nomes de página para suas rotas reais
    const pageRoutes: Record<string, string> = {
        'Home': '/home',
        'Catalog': '/catalog',
        'Catalogo': '/catalog',
        'ProdutoDetalhe': '/produto',
        'Product': '/produto',  // Alias em inglês
        'Admin': '/admin',
        'Contato': '/contato',
        'LandingBio': '/'
    };
    
    // Se começar com "/", assume que é um path direto e não um nome de página
    let path = pageName.startsWith('/') 
        ? pageName
        : (pageRoutes[pageName] || '/' + pageName.toLowerCase().replace(/ /g, '-'));
    
    // Adiciona querystring, se houver parâmetros
    if (queryParams && Object.keys(queryParams).length > 0) {
        const params = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, value);
            }
        });
        path += `?${params.toString()}`;
    }
    
    return path;
}