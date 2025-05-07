// Dados simulados para desenvolvimento
export const mockCategories = [
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
  },
  {
    id: 'cat-4',
    name: 'Banheiro',
    description: 'Acessórios e decoração para banheiro',
    image_url: 'https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/categories%2Fbanheiro.jpg?alt=media',
    position: 4
  },
  {
    id: 'cat-5',
    name: 'Área Externa',
    description: 'Móveis e decoração para jardim e varanda',
    image_url: 'https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/categories%2Farea-externa.jpg?alt=media',
    position: 5
  }
];

export const mockProducts = [
  // Produtos da categoria Sala de Estar
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
    id: 'prod-3',
    name: 'Poltrona Decorativa Amarela',
    description: 'Poltrona decorativa em tecido amarelo com pés em madeira escura.',
    category_id: 'cat-1',
    price: 749.90,
    sku: 'POL-AM-001',
    images: ['https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/products%2Fpoltrona-amarela.jpg?alt=media'],
    stock: 6
  },
  
  // Produtos da categoria Quarto
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
    id: 'prod-5',
    name: 'Guarda-Roupa 6 Portas',
    description: 'Guarda-roupa em MDF com 6 portas e 3 gavetas, acabamento em branco fosco.',
    category_id: 'cat-2',
    price: 1599.90,
    sku: 'GR-6P-01',
    images: ['https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/products%2Fguarda-roupa.jpg?alt=media'],
    stock: 4
  },
  
  // Produtos da categoria Cozinha
  {
    id: 'prod-6',
    name: 'Conjunto de Panelas Antiaderente',
    description: 'Conjunto com 5 panelas antiaderentes de alumínio com cabos em silicone.',
    category_id: 'cat-3',
    price: 249.90,
    sku: 'PAN-ANT-5',
    images: ['https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/products%2Fpanelas.jpg?alt=media'],
    stock: 12
  },
  {
    id: 'prod-7',
    name: 'Jogo de Facas Profissional',
    description: 'Conjunto com 6 facas profissionais em aço inox com cabo ergonômico.',
    category_id: 'cat-3',
    price: 189.90,
    sku: 'FAC-PROF-6',
    images: ['https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/products%2Ffacas.jpg?alt=media'],
    stock: 8
  },
  
  // Produtos da categoria Banheiro
  {
    id: 'prod-8',
    name: 'Gabinete para Banheiro com Cuba',
    description: 'Gabinete para banheiro em MDF com cuba de porcelana, espelho incluso.',
    category_id: 'cat-4',
    price: 699.90,
    sku: 'GAB-BAN-01',
    images: ['https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/products%2Fgabinete-banheiro.jpg?alt=media'],
    stock: 5
  },
  
  // Produtos da categoria Área Externa
  {
    id: 'prod-9',
    name: 'Conjunto Mesa e Cadeiras para Jardim',
    description: 'Conjunto com mesa e 4 cadeiras em alumínio e fibra sintética para área externa.',
    category_id: 'cat-5',
    price: 899.90,
    sku: 'CJ-JAR-01',
    images: ['https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/products%2Fconjunto-jardim.jpg?alt=media'],
    stock: 3
  },
  {
    id: 'prod-10',
    name: 'Churrasqueira a Carvão Portátil',
    description: 'Churrasqueira a carvão portátil em aço inox, ideal para pequenos espaços.',
    category_id: 'cat-5',
    price: 299.90,
    sku: 'CHU-PORT-01',
    images: ['https://firebasestorage.googleapis.com/v0/b/donare-catalogo.appspot.com/o/products%2Fchurrasqueira.jpg?alt=media'],
    stock: 7
  }
];
