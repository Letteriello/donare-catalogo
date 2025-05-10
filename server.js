import express from 'express';
import multer from 'multer';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';

// ES Modules não tem __dirname, então precisamos criá-lo

const app = express();
const PORT = 3001; // Forçar a porta 3001 para o servidor de upload

// Middleware de log para todas as requisições recebidas
app.use((req, res, next) => {
  console.log(`[SERVER.JS LOG] Received request: ${req.method} ${req.originalUrl} (Path: ${req.path})`);
  next();
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta /public
app.use(express.static('public'));

// Configuração do multer para salvar os arquivos com nomes únicos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define a pasta de destino com base no parâmetro 'type'
    let uploadPath = path.join('public', 'uploads');
    const type = req.params.type || 'products';
    
    uploadPath = path.join(uploadPath, type);
    
    // Garante que a pasta existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Cria um nome único baseado no timestamp
    const timestamp = Date.now();
    const originalName = file.originalname;
    // Preserva a extensão original do arquivo
    const extension = path.extname(originalName);
    // Remove caracteres especiais e acentos do nome original do arquivo
    const baseName = path.basename(originalName, extension)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();
    
    cb(null, `${timestamp}-${baseName}${extension}`);
  }
});

// Configuração de limitações para upload
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // limite de 5MB
  },
  fileFilter: function (req, file, cb) {
    // Aceita apenas imagens
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
    cb(null, true);
  }
});

// Função para processar o upload de um único arquivo
const processSingleUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    const relativePath = req.file.path.replace(/^public[\\/]/, '/').replace(/\\/g, '/');
    res.json({
      success: true,
      file_url: relativePath,
      message: 'Arquivo enviado com sucesso',
    });
  } catch (error) {
    console.error('Erro no upload single:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro no upload do arquivo single',
    });
  }
};

// Função para processar o upload de múltiplos arquivos
const processBatchUpload = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const filesInfo = req.files.map(file => {
      const relativePath = file.path.replace(/^public[\\/]/, '/').replace(/\\/g, '/');
      return {
        id: file.filename, // Usando o nome do arquivo gerado como ID
        url: relativePath
      };
    });
    
    res.json(filesInfo); // Retorna diretamente o array [{id, url}]

  } catch (error) {
    console.error('Erro no upload em lote:', error);
    res.status(500).json({
      // success: false, // O formato de retorno é um array, não um objeto com success
      error: error.message || 'Erro no upload dos arquivos em lote',
    });
  }
};

// Rota para upload com tipo específico (single file)
app.post('/api/upload/:type', upload.single('file'), processSingleUpload);

// Rota para upload em lote (multiple files, usará 'products' como padrão se req.params.type não for usado no storage)
// O storage já usa 'products' como default se 'type' não está no req.params, o que é bom.
app.post('/api/uploads', upload.array('files', 10), processBatchUpload); // 'files' é o nome do campo esperado

// --- Product Routes ---
// POST /api/products ⇒ cria pai + variantes numa transação
app.post('/api/products', (req, res) => {
  console.log('[SERVER.JS LOG] POST /api/products - Body:', req.body);
  // Placeholder: Simular criação de produto e variantes
  const newProduct = { id: `prod_${Date.now()}`, ...req.body, variantsCount: req.body.variants?.length || 0 };
  console.log('[SERVER.JS LOG] Simulated new product:', newProduct);
  res.status(201).json(newProduct);
});

// PUT /api/products/:id ⇒ atualiza pai + variantes
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  console.log(`[SERVER.JS LOG] PUT /api/products/${id} - Body:`, req.body);
  // Placeholder: Simular atualização de produto
  const updatedProduct = { id, ...req.body };
  console.log('[SERVER.JS LOG] Simulated updated product:', updatedProduct);
  res.json(updatedProduct);
});

// --- Color Routes ---
let mockColors = [
  { id: 'color_1', name: 'Vermelho', hex: '#FF0000' },
  { id: 'color_2', name: 'Azul', hex: '#0000FF' },
  { id: 'color_3', name: 'Verde', hex: '#00FF00' },
];

// GET /api/colors
app.get('/api/colors', (req, res) => {
  console.log('[SERVER.JS LOG] GET /api/colors');
  res.json(mockColors);
});

// POST /api/colors
app.post('/api/colors', (req, res) => {
  console.log('[SERVER.JS LOG] POST /api/colors - Body:', req.body);
  const { name, hex } = req.body;
  if (!name || !hex) {
    return res.status(400).json({ error: 'Name and hex are required for color' });
  }
  const newColor = { id: `color_${Date.now()}`, name, hex };
  mockColors.push(newColor);
  console.log('[SERVER.JS LOG] Added new color:', newColor);
  res.status(201).json(newColor);
});

// --- Category Routes ---
let mockCategories = [
  { id: 'cat_1', name: 'Mesa Posta' },
  { id: 'cat_2', name: 'Decoração' },
  { id: 'cat_3', name: 'Cozinha' },
];

// GET /api/categories
app.get('/api/categories', (req, res) => {
  console.log('[SERVER.JS LOG] GET /api/categories');
  res.json(mockCategories);
});

// POST /api/categories
app.post('/api/categories', (req, res) => {
  console.log('[SERVER.JS LOG] POST /api/categories - Body:', req.body);
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required for category' });
  }
  const newCategory = { id: `cat_${Date.now()}`, name };
  mockCategories.push(newCategory);
  console.log('[SERVER.JS LOG] Added new category:', newCategory);
  res.status(201).json(newCategory);
});

// Rota de teste simples para POST
app.post('/testpost', (req, res) => {
  console.log(`[SERVER.JS LOG] Received request on /testpost. Method: ${req.method}`);
  res.json({ success: true, message: 'Test POST successful on /testpost' });
});

// Tratamento de erros
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Algo deu errado!',
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor de uploads rodando na porta ${PORT}`);
});