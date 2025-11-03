const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

// Inicializa o cliente da API do Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Função auxiliar para converter um arquivo para o formato da API
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: fs.readFileSync(path).toString("base64"),
            mimeType
        },
    };
}

/**
 * Modera o texto de um anúncio.
 * @param {string} title - O título do anúncio.
 * @param {string} description - A descrição do anúncio.
 * @returns {Promise<string>} Retorna "SAFE" ou "UNSAFE".
 */
async function moderateText(title, description) {
    // <<< USA O NOVO MODELO CORRETO
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Analise o seguinte título e descrição de um anúncio. O conteúdo é impróprio, ofensivo, ilegal, ou viola políticas de conteúdo seguro? Responda APENAS com "SAFE" se for apropriado, ou "UNSAFE" se não for. Título: "${title}". Descrição: "${description}"`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim().toUpperCase();
        console.log(`Text moderation result: ${text}`);
        // Adicionamos uma verificação mais robusta para a resposta
        return (text === "SAFE") ? "SAFE" : "UNSAFE";
    } catch (error) {
        console.error("Erro na moderação de texto:", error);
        return "UNSAFE"; // Assume como inseguro em caso de erro na API
    }
}

/**
 * Modera as imagens de um anúncio.
 * @param {Array<object>} files - Um array de objetos de arquivo do multer.
 * @returns {Promise<string>} Retorna "SAFE" ou "UNSAFE".
 */
async function moderateImages(files) {
    // <<< USA O MESMO MODELO MULTIMODAL
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Esta imagem é apropriada para um site de classificados de serviços profissionais? Ela contém nudez, violência, conteúdo de ódio ou qualquer coisa imprópria? Responda APENAS com "SAFE" se for apropriada, ou "UNSAFE" se não for.`;
    
    // Converte todos os arquivos para o formato da API
    const imageParts = files.map(file => fileToGenerativePart(file.path, file.mimetype));

    try {
        // Envia o prompt junto com TODAS as imagens de uma vez.
        // O modelo analisará cada uma delas no contexto do prompt.
        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text().trim().toUpperCase();
        console.log(`Image moderation result: ${text}`);
        
        // Se a resposta contiver UNSAFE em qualquer lugar, consideramos o lote todo inseguro.
        return (text.includes("UNSAFE")) ? "UNSAFE" : "SAFE";
    } catch (error) {
        console.error("Erro na moderação de imagem:", error);
        return "UNSAFE";
    }
}

module.exports = { moderateText, moderateImages };