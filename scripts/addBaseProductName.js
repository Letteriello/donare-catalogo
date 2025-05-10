// scripts/addBaseProductName.js
import admin from 'firebase-admin';
import { readFile } from 'fs/promises'; // Para ler o arquivo JSON da chave
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Obter o diretório do script atual para construir caminhos relativos
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho para o arquivo da chave da conta de serviço
// ASSUMINDO QUE O ARQUIVO ESTÁ NA RAIZ DO PROJETO, UM NÍVEL ACIMA DA PASTA 'scripts'
const SERVICE_ACCOUNT_PATH = resolve(__dirname, '../donare-catalogo-firebase-adminsdk-fbsvc-d704f261b9.json');

async function loadServiceAccount() {
  try {
    const serviceAccountJson = await readFile(SERVICE_ACCOUNT_PATH, 'utf8');
    return JSON.parse(serviceAccountJson);
  } catch (error) {
    console.error(`Erro ao carregar o arquivo da conta de serviço de ${SERVICE_ACCOUNT_PATH}:`, error);
    console.error("Verifique se o arquivo existe no caminho especificado e se o script tem permissão para lê-lo.");
    console.error("O nome do arquivo no .gitignore é 'donare-catalogo-adminsdk.json'. Certifique-se que o nome e o caminho correspondem.");
    process.exit(1); // Termina o script se a chave não puder ser carregada
  }
}

// --- Lista de Cores (ordenada por comprimento descendente, depois alfabeticamente) ---
const colorsToRemove = [
    "VERDE MILITAR", "AZUL MARINHO", "AZUL ROYAL", "OFF WHITE", "ROSA BEBÊ",
    "AZUL BEBÊ", "CASTANHO", "VERMELHO", "LARANJA", "CHUMBO", "BLACK",
    "CACAU", "LEMON", "PALHA", "NUDE", "ROSA"
].map(c => c.toUpperCase());

function deriveBaseProductName(productName) {
    if (!productName || typeof productName !== 'string') {
        return null;
    }
    const originalNameTrimmed = productName.trim();
    const nameUpper = originalNameTrimmed.toUpperCase();

    for (const color of colorsToRemove) {
        const suffixToTest = ` ${color}`;
        if (nameUpper.endsWith(suffixToTest)) {
            const lastSpaceIndex = nameUpper.lastIndexOf(suffixToTest);
            const baseName = originalNameTrimmed.substring(0, lastSpaceIndex).trim();
            if (baseName) {
                return baseName;
            }
        }
    }
    return null;
}

async function updateProductsInFirestore() {
    const serviceAccount = await loadServiceAccount();

    // --- Inicializa Firebase Admin ---
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        if (error.code === 'app/duplicate-app') {
            console.warn("App Firebase já inicializado.");
        } else {
            console.error("Erro ao inicializar o Firebase Admin:", error);
            process.exit(1);
        }
    }
    
    const db = admin.firestore();
    const productsCollectionRef = db.collection("products");
    let productsChecked = 0;
    let productsUpdated = 0;
    let productsFailedToUpdate = 0;
    let productsWithNoBaseNameDerived = 0;
    let productsAlreadyCorrect = 0;

    try {
        const querySnapshot = await productsCollectionRef.get();
        console.log(`Encontrados ${querySnapshot.size} produtos. Processando...`);

        for (const docSnap of querySnapshot.docs) {
            productsChecked++;
            const productData = docSnap.data();
            const productId = docSnap.id;
            const currentName = productData.name;
            const existingBaseName = productData.baseProductName;

            if (!currentName || typeof currentName !== 'string') {
                console.log(`Pulando produto ID ${productId}: nome ausente ou não é uma string.`);
                continue;
            }

            const derivedBaseName = deriveBaseProductName(currentName);

            if (derivedBaseName) {
                if (existingBaseName !== derivedBaseName) {
                    try {
                        await productsCollectionRef.doc(productId).update({ baseProductName: derivedBaseName });
                        console.log(`Produto ATUALIZADO ID ${productId} ("${currentName}"): baseProductName definido como "${derivedBaseName}"`);
                        productsUpdated++;
                    } catch (e) {
                        console.error(`FALHA ao atualizar produto ID ${productId}: ${e.message}`);
                        productsFailedToUpdate++;
                    }
                } else {
                    console.log(`Produto ID ${productId} ("${currentName}"): baseProductName já está correto ("${derivedBaseName}").`);
                    productsAlreadyCorrect++;
                }
            } else {
                console.log(`Produto ID ${productId} ("${currentName}"): Nenhum baseProductName derivado. Valor atual: "${existingBaseName || 'Não definido'}".`);
                productsWithNoBaseNameDerived++;
            }
        }
    } catch (error) {
        console.error("Erro ao buscar ou processar produtos:", error);
        return;
    }

    console.log("\n--- Processamento Concluído ---");
    console.log(`Total de produtos verificados: ${productsChecked}`);
    console.log(`Produtos atualizados com sucesso: ${productsUpdated}`);
    console.log(`Produtos já estavam corretos: ${productsAlreadyCorrect}`);
    console.log(`Produtos para os quais nenhum nome base foi derivado: ${productsWithNoBaseNameDerived}`);
    console.log(`Produtos que falharam na atualização: ${productsFailedToUpdate}`);
}

updateProductsInFirestore().then(() => {
    console.log("Script finalizado.");
    // O Firebase Admin SDK pode manter o processo Node.js ativo.
    // Terminar explicitamente para garantir que o script saia.
    if (admin.apps.length) { // Verifica se algum app foi inicializado
        admin.app().delete().then(() => {
            console.log("App Firebase Admin finalizado.");
            process.exit(0);
        }).catch(err => {
            console.error("Erro ao finalizar app Firebase Admin:", err);
            process.exit(1);
        });
    } else {
        process.exit(0);
    }
}).catch(err => {
    console.error("Erro não tratado no script:", err);
    process.exit(1);
});