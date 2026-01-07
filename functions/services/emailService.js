const nodemailer = require('nodemailer');

// Создаем транспорт для отправки email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'shadowroyaletv@gmail.com',
        pass: 'uxld hopx hwxh sqsz'
    }
});

class EmailService {
    // Отправить email с кодом подтверждения
    static async sendVerificationEmail(email, verificationCode) {
        try {
            const mailOptions = {
                from: 'shadowroyaletv@gmail.com',
                to: email,
                subject: 'Подтверждение регистрации',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Подтверждение регистрации</h2>
                        <p>Ваш код подтверждения: <strong style="font-size: 24px; color: #007bff;">${verificationCode}</strong></p>
                        <p>Или перейдите по ссылке:</p>
                        <a href="http://localhost:8080/verify?email=${encodeURIComponent(email)}&code=${verificationCode}" 
                            style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
                            Подтвердить аккаунт
                        </a>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Код подтверждения отправлен на ${email}: ${verificationCode}`);
            
        } catch (error) {
            console.error('❌ Ошибка отправки email:', error);
            throw error;
        }
    }

    // Отправить email с новым кодом подтверждения
    static async sendNewVerificationCode(email, newVerificationCode) {
        try {
            const mailOptions = {
                from: 'shadowroyaletv@gmail.com',
                to: email,
                subject: 'Новый код подтверждения',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Новый код подтверждения</h2>
                        <p>Ваш новый код подтверждения: <strong style="font-size: 24px; color: #007bff;">${newVerificationCode}</strong></p>
                        <p>Или перейдите по ссылке:</p>
                        <a href="http://localhost:8080/verify?email=${encodeURIComponent(email)}&code=${newVerificationCode}" 
                            style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
                            Подтвердить аккаунт
                        </a>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Новый код подтверждения отправлен на ${email}: ${newVerificationCode}`);
            
        } catch (error) {
            console.error('❌ Ошибка отправки нового кода:', error);
            throw error;
        }
    }
}

module.exports = EmailService;