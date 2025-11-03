// Importa as bibliotecas necessárias
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './server/.env' });

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("Erro: A variável GOOGLE_API_KEY não foi encontrada no seu arquivo .env.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    console.log("Buscando modelos disponíveis...");
    try {
        // <<< A CORREÇÃO ESTÁ AQUI
        // Pegamos um modelo base para acessar a funcionalidade de listagem.
        const generativeModel = genAI.getGenerativeModel({ model: "gemini-1.0-pro" }); 
        
        // A função agora é _listModels() (privada, mas funcional) ou através de outra via.
        // A documentação oficial pode ter mudado. Vamos tentar a abordagem mais provável.
        // Em versões mais recentes, a forma correta é através de uma chamada direta à API.
        
        // A biblioteca não expõe mais um 'listModels' publicamente de forma simples.
        // A maneira mais garantida é fazer uma chamada HTTP direta para o endpoint da API.
        // Vamos construir essa chamada.
        
        const fetch = (await import('node-fetch')).default;

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Erro na API: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
        }
        
        const data = await response.json();
        const models = data.models;
        
        console.log("------------------------------------------");
        console.log("Modelos e seus métodos suportados:");
        console.log("------------------------------------------");

        for (const m of models) {
            console.log(`\nModelo: ${m.name}`);
            console.log(`  Display Name: ${m.displayName}`);
            console.log(`  Descrição: ${m.description.substring(0, 80)}...`); // Mostra parte da descrição
            console.log(`  Métodos Suportados: ${m.supportedGenerationMethods.join(', ')}`);
        }
        console.log("\n------------------------------------------");

    } catch (error) {
        console.error("Ocorreu um erro ao listar os modelos:", error);
    }
}

// Executa a função
run();