/**
 * Mapeamento de códigos de produtos e cores para geração de SKUs
 */

interface ProductCodeMap {
  [key: string]: string;
}

interface ColorCodeMap {
  [key: string]: string;
}

// Códigos para grupos de produtos
export const PRODUCT_CODES: ProductCodeMap = {
  // Porta Guardanapos
  "PORTA GUARDANAPOS COURO": "1000",
  "PORTA GUARDANAPO INFINITO": "1001",
  "PORTA GUARDANAPO MICKEY": "1002",
  "PORTA GUARDANAPO LOVE": "1003",
  "PORTA GUARDANAPO QUADRADO": "1004",
  "PORTA GUARDANAPO MICKEY VAZADO": "1005",
  "PORTA GUARDANAPO LOVE VAZADO": "1006",
  "PORTA GUARDANAPO LIMAO SICILIANO": "1007",
  "PORTA GUARDANAPO POÁ VAZADO": "1008",
  "PORTA GUARDANAPO FLOR VAZADO": "1009",
  
  // Porta Copos
  "PORTA COPO COURO": "2000",
  "PORTA COPO ARABESCO": "2001",
  "PORTA COPO REDONDO": "2002",
  "PORTA COPO RETANGULAR": "2003",
  "PORTA COPO COSTELA DE ADAO": "2004",
  "PORTA COPO FOLHA DE PLÁTANO": "2005",
  "PORTA COPO PONTILLÉ": "2006",
  "PORTA COPO LOVE": "2007",
  "PORTA COPO ORGANICO": "2008",
  "PORTA COPO LIMAO SICILIANO": "2009",
  "PORTA COPO CIRCULO GREGO": "2010",
  "PORTA COPO MICKEY": "2011",
  "PORTA COPO BLOOM ROSÉ": "2012",
  "PORTA COPO TAVOLA DI FIORI": "2013",
  
  // Jogos Americanos
  "JOGO AMERICANO COURO": "3000",
  "LUGAR AMERICANO ARABESCO": "3001",
  "LUGAR AMERICANO REDONDO": "3002",
  "LUGAR AMERICANO RETANGULAR": "3003",
  "LUGAR AMERICANO COSTELA DE ADÃO": "3004",
  "LIUGAR AMERICANO FOLHA DE PLÁTANO": "3005",
  "LUGAR AMERICANO PONTILLÉ": "3006",
  "LUGAR AMERICANO LOVE": "3007",
  "LUGAR AMERICANO MICKEY": "3008",
  "LUGAR AMERICANO LIMAO SICILIANO": "3009",
  "LUGAR AMERICANO CIRCULO GREGO": "3010",
  "LUGAR AMERICANO ORGANICO": "3011",
  
  // Porta Jarras
  "PORTA JARRA": "4000",
  "PORTA JARRA REDONDO": "4001",
  "PORTA JARRA ARABESCO": "4002",
  "PORTA JARRA RETANGULAR": "4003",
  "PORTA JARRA LOVE": "4004",
  "PORTA JARRA COSTELA DE ADÃO": "4005",
  "PORTA JARRA FOLHA DE PLÁTANO": "4006",
  "PORTA JARRA PONTILLÉ": "4007",
  "PORTA JARRA MICKEY": "4008",
  "PORTA JARRA LIMAO SICILIANO": "4009",
  "PORTA JARRA CIRCULO BREGO": "4010",
  "PORTA JARRA ORGANICO": "4011",
  
  // Marcadores de Taça
  "MARCADOR DE TAÇA": "5000",
  "MARCADOR DE TACA LOVE": "5001",
  "MARCADOR DE TAÇA COSTELA DE ADÃO": "5002",
  "MARCADOR DE TAÇA FOLHA DE PLÁTANO": "5003",
  "MARCADOR DE TAÇA MICKEY": "5004",
  "MARCADOR DE TAÇA LAÇO": "5005",
  
  // Guardanapos
  "GUARDANAPO GABARDINE PONTO AJOUR": "6001",
  
  // Porta Guardanapos Acrílico
  "PORTA GUARDANAPO ACRÍLICO": "7000",
  "PORTA GUARDANAPO ACRILICO LOVE": "7001",
  "PORTA GUARDANAPO ACRILICO MICKEY": "7002",
  "PORTA GUARDANAPO ACRILICO QUADRADO": "7003",
  "PORTA GUARDANAPO ACRILICO REDONDO": "7004",
  "PORTA GUARDANAPO ACRILICO CRUZ": "7005",
  "PORTA GUARDANAPO ACRILICO ARVORE NATALINA": "7006",
  "PORTA GUARDANAPO ACRILICO ORELHA DE COELHO": "7007",
  "PORTA GUARDANAPO ACRILICO COELHO": "7008"
};

// Códigos para cores
export const COLOR_CODES: ColorCodeMap = {
  "VERMELHO": "10",
  "CACAU": "20",
  "PALHA": "30",
  "BLACK": "40",
  "OFF WHITE": "50",
  "VERDE MILITAR": "60",
  "AZUL MARINHO": "70",
  "ROSA": "80",
  "ROSA BEBÊ": "90",
  "NUDE": "100",
  "AZUL ROYAL": "110",
  "CASTANHO": "120",
  "CHUMBO": "130",
  "AZUL BEBÊ": "140",
  "LARANJA": "150",
  "LEMON": "160"
};

/**
 * Gera um SKU baseado no nome do produto e cor
 * @param productName Nome do produto
 * @param colorName Nome da cor
 * @returns SKU gerado no formato [código produto]-[código cor]-UN
 */
export function generateSKU(productName: string, colorName: string): string {
  // Normaliza os nomes para comparação mais precisa
  const normalizedProductName = productName.toUpperCase().trim();
  const normalizedColorName = colorName.toUpperCase().trim();
  
  // Procura pelo código do produto
  let productCode = "";
  for (const [key, code] of Object.entries(PRODUCT_CODES)) {
    if (normalizedProductName.includes(key) || key.includes(normalizedProductName)) {
      productCode = code;
      break;
    }
  }
  
  // Procura pelo código da cor
  let colorCode = "";
  for (const [key, code] of Object.entries(COLOR_CODES)) {
    if (normalizedColorName === key) {
      colorCode = code;
      break;
    }
  }
  
  // Se encontrou ambos os códigos, gera o SKU
  if (productCode && colorCode) {
    return `${productCode}-${colorCode}-UN`;
  }
  
  // Se não encontrou, retorna uma string vazia para indicar que não foi possível gerar o SKU
  return "";
}

/**
 * Verifica se um produto existe no mapeamento de códigos
 * @param productName Nome do produto para verificar
 * @returns Verdadeiro se o produto existir no mapeamento
 */
export function doesProductExist(productName: string): boolean {
  const normalizedProductName = productName.toUpperCase().trim();
  
  for (const key of Object.keys(PRODUCT_CODES)) {
    if (normalizedProductName.includes(key) || key.includes(normalizedProductName)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Obtém o código do produto baseado no nome
 * @param productName Nome do produto
 * @returns Código do produto ou string vazia se não encontrado
 */
export function getProductCode(productName: string): string {
  const normalizedProductName = productName.toUpperCase().trim();
  
  for (const [key, code] of Object.entries(PRODUCT_CODES)) {
    if (normalizedProductName.includes(key) || key.includes(normalizedProductName)) {
      return code;
    }
  }
  
  return "";
}

/**
 * Obtém o código da cor baseado no nome
 * @param colorName Nome da cor
 * @returns Código da cor ou string vazia se não encontrado
 */
export function getColorCode(colorName: string): string {
  const normalizedColorName = colorName.toUpperCase().trim();
  
  return COLOR_CODES[normalizedColorName] || "";
}
