const path = require('path');
const fs = require('fs');
const { getDbConnection } = require('../config/database');

class UploadService {
    // Директория для аватаров
    static avatarsDir = path.join(__dirname, '..', 'public', 'assets', 'avatars');

    // Убедиться, что директория существует
    static ensureAvatarsDir() {
        if (!fs.existsSync(this.avatarsDir)) {
            fs.mkdirSync(this.avatarsDir, { recursive: true });
            console.log(`✅ Создана директория для аватаров: ${this.avatarsDir}`);
        }
    }

    // Удалить старый аватар пользователя
    static async deleteOldAvatar(userId) {
        let connection;
        try {
            connection = await getDbConnection();

            // Получаем текущий аватар пользователя
            const [users] = await connection.execute(
                'SELECT avatar FROM users WHERE id = ?',
                [userId]
            );

            if (users.length > 0 && users[0].avatar) {
                const oldAvatar = users[0].avatar;
                
                // Проверяем, что это не дефолтная аватарка
                if (!oldAvatar.includes('/assets/images/poringAvatar.png') && 
                    !oldAvatar.includes('poringAvatar')) {
                    
                    // Извлекаем имя файла
                    let oldFilename;
                    if (oldAvatar.includes('/assets/avatars/')) {
                        oldFilename = oldAvatar.split('/').pop();
                    } else if (oldAvatar.includes('localhost:3000')) {
                        const url = new URL(oldAvatar);
                        oldFilename = url.pathname.split('/').pop();
                    }
                    
                    if (oldFilename) {
                        const oldFilePath = path.join(this.avatarsDir, oldFilename);
                        if (fs.existsSync(oldFilePath)) {
                            fs.unlinkSync(oldFilePath);
                            console.log(`🗑️ Удален старый аватар: ${oldFilename}`);
                            return true;
                        }
                    }
                }
            }
            return false;
        } catch (error) {
            console.error('❌ Ошибка при удалении старого аватара:', error);
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    }

    // Сохранить информацию об аватаре в БД
    static async saveAvatarInfo(userId, filename) {
        let connection;
        try {
            connection = await getDbConnection();

            // Генерируем URL для доступа к файлу
            const avatarUrl = `/assets/avatars/${filename}`;

            // Обновляем аватар в базе данных
            await connection.execute(
                'UPDATE users SET avatar = ? WHERE id = ?',
                [avatarUrl, userId]
            );

            console.log(`✅ Аватар сохранен в БД для пользователя ${userId}: ${avatarUrl}`);
            
            return avatarUrl;
        } catch (error) {
            console.error('❌ Ошибка сохранения аватара в БД:', error);
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    }

    // Удалить аватар пользователя полностью
    static async removeAvatar(userId) {
        let connection;
        try {
            connection = await getDbConnection();

            // Получаем текущий аватар пользователя
            const [users] = await connection.execute(
                'SELECT avatar FROM users WHERE id = ?',
                [userId]
            );

            let fileDeleted = false;
            
            if (users.length > 0 && users[0].avatar) {
                const oldAvatar = users[0].avatar;
                
                // Извлекаем имя файла из URL
                let filename;
                if (oldAvatar.includes('/assets/avatars/')) {
                    filename = oldAvatar.split('/').pop();
                } else if (oldAvatar.includes('localhost:3000')) {
                    filename = oldAvatar.split('/').pop();
                }
                
                // Удаляем файл с диска
                if (filename) {
                    const filePath = path.join(this.avatarsDir, filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`🗑️ Файл аватара удален с диска: ${filename}`);
                        fileDeleted = true;
                    }
                }
            }

            // Обновляем базу данных - устанавливаем аватар в NULL
            await connection.execute(
                'UPDATE users SET avatar = NULL WHERE id = ?',
                [userId]
            );

            console.log(`✅ Аватар удален из БД для пользователя ${userId}`);

            return fileDeleted;
        } catch (error) {
            console.error('❌ Ошибка удаления аватара:', error);
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    }

    // Проверить размер файла
    static validateFileSize(fileSize, maxSizeMB = 5) {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (fileSize > maxSizeBytes) {
            throw new Error(`Файл слишком большой. Максимальный размер: ${maxSizeMB}MB`);
        }
        return true;
    }

    // Проверить тип файла
    static validateFileType(mimetype) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(mimetype)) {
            throw new Error('Недопустимый тип файла. Разрешены только изображения (JPEG, PNG, GIF, WebP)');
        }
        return true;
    }

    // Получить полный путь к файлу аватара
    static getAvatarPath(filename) {
        return path.join(this.avatarsDir, filename);
    }

    // Проверить существует ли файл
    static fileExists(filename) {
        const filePath = this.getAvatarPath(filename);
        return fs.existsSync(filePath);
    }
}

// Инициализация директории при загрузке модуля
UploadService.ensureAvatarsDir();

module.exports = UploadService;