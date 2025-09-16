const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/';

// Garante que o diretório de uploads exista
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Configuração de armazenamento do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Onde salvar os arquivos
    },
    filename: (req, file, cb) => {
        // Cria um nome de arquivo único para evitar sobreposições
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Filtro de arquivo para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // Limite de 5MB por arquivo
});

module.exports = upload;