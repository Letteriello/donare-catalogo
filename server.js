import express from 'express';
import multer from 'multer';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES Modules não tem __dirname, então precisamos criá-lo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Função para processar o upload
const processUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    // Constrói um caminho relativo para o arquivo
    // req.file.path é algo como "public/uploads/products/123-image.png"
    // Precisamos transformá-lo em "/uploads/products/123-image.png"
    const relativePath = req.file.path.replace(/^public[\\/]/, '/').replace(/\\/g, '/');
    
    res.json({
      success: true,
      file_url: relativePath, // O frontend irá prefixar com window.location.origin
      message: 'Arquivo enviado com sucesso',
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro no upload do arquivo',
    });
  }
};

// Rota para upload com tipo específico
app.post('/api/upload/:type', upload.single('file'), processUpload);

// Rota para upload sem tipo específico (usará 'products' como padrão)
app.post('/api/upload', upload.single('file'), processUpload);

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