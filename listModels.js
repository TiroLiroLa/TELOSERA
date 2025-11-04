
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
        const generativeModel = genAI.getGenerativeModel({ model: "gemini-1.0-pro" }); 
        
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
            console.log(`  Descrição: ${m.description.substring(0, 80)}...`);
            console.log(`  Métodos Suportados: ${m.supportedGenerationMethods.join(', ')}`);
        }
        console.log("\n------------------------------------------");

    } catch (error) {
        console.error("Ocorreu um erro ao listar os modelos:", error);
    }
}

run();