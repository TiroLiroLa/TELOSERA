const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configura o cliente do Cloudinary com as credenciais do .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Usa HTTPS
});

module.exports = cloudinary;