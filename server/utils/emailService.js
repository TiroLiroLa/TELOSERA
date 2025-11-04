const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `http://localhost:3000/verify/${token}`;

    const mailOptions = {
        from: `"Telosera" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verifique seu E-mail - Telosera',
        html: `
            <h2>Bem-vindo ao Telosera!</h2>
            <p>Obrigado por se cadastrar. Por favor, clique no link abaixo para verificar seu endereço de e-mail:</p>
            <a href="${verificationUrl}" style="background-color: #fa5700; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verificar E-mail</a>
            <p>Se você não se cadastrou, por favor ignore este e-mail.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('E-mail de verificação enviado para:', email);
    } catch (error) {
        console.error('Erro ao enviar e-mail de verificação:', error);
        throw new Error('Não foi possível enviar o e-mail de verificação.');
    }
};

module.exports = { sendVerificationEmail };