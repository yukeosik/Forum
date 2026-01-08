/**
 * Валидация email
 * @param {string} email - Email для проверки
 * @returns {boolean} - Валидный ли email
 */
function validateEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Валидация пароля
 * Минимальные требования: 8 символов, хотя бы одна цифра и одна буква
 * @param {string} password - Пароль для проверки
 * @returns {Object} - {isValid: boolean, message: string}
 */
function validatePassword(password) {
    if (!password || password.length < 8) {
        return {
            isValid: false,
            message: 'Пароль должен содержать минимум 8 символов'
        };
    }
    
    if (!/\d/.test(password)) {
        return {
            isValid: false,
            message: 'Пароль должен содержать хотя бы одну цифру'
        };
    }
    
    if (!/[a-zA-Z]/.test(password)) {
        return {
            isValid: false,
            message: 'Пароль должен содержать хотя бы одну букву'
        };
    }
    
    return {
        isValid: true,
        message: 'Пароль соответствует требованиям'
    };
}

/**
 * Валидация логина
 * Требования: 3-20 символов, только буквы, цифры, подчеркивания и дефисы
 * @param {string} username - Логин для проверки
 * @returns {Object} - {isValid: boolean, message: string}
 */
function validateUsername(username) {
    if (!username || username.length < 3) {
        return {
            isValid: false,
            message: 'Логин должен содержать минимум 3 символа'
        };
    }
    
    if (username.length > 20) {
        return {
            isValid: false,
            message: 'Логин не должен превышать 20 символов'
        };
    }
    
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
        return {
            isValid: false,
            message: 'Логин может содержать только буквы, цифры, подчеркивания и дефисы'
        };
    }
    
    return {
        isValid: true,
        message: 'Логин соответствует требованиям'
    };
}

/**
 * Валидация содержимого сообщения
 * @param {string} content - Текст сообщения
 * @returns {Object} - {isValid: boolean, message: string}
 */
function validateMessageContent(content) {
    if (!content || content.trim().length === 0) {
        return {
            isValid: false,
            message: 'Сообщение не может быть пустым'
        };
    }
    
    if (content.trim().length > 5000) {
        return {
            isValid: false,
            message: 'Сообщение не должно превышать 5000 символов'
        };
    }
    
    return {
        isValid: true,
        message: 'Сообщение соответствует требованиям'
    };
}

/**
 * Валидация заголовка темы
 * @param {string} title - Заголовок темы
 * @returns {Object} - {isValid: boolean, message: string}
 */
function validateTopicTitle(title) {
    if (!title || title.trim().length === 0) {
        return {
            isValid: false,
            message: 'Заголовок не может быть пустым'
        };
    }
    
    if (title.trim().length < 5) {
        return {
            isValid: false,
            message: 'Заголовок должен содержать минимум 5 символов'
        };
    }
    
    if (title.trim().length > 200) {
        return {
            isValid: false,
            message: 'Заголовок не должен превышать 200 символов'
        };
    }
    
    return {
        isValid: true,
        message: 'Заголовок соответствует требованиям'
    };
}

/**
 * Проверка ID (числовое)
 * @param {any} id - ID для проверки
 * @returns {boolean} - Валидный ли ID
 */
function validateId(id) {
    if (!id) return false;
    const num = Number(id);
    return !isNaN(num) && num > 0 && Number.isInteger(num);
}

/**
 * Валидация данных регистрации
 * @param {Object} data - Данные регистрации
 * @returns {Object} - {isValid: boolean, errors: Array<string>}
 */
function validateRegistrationData(data) {
    const errors = [];
    
    if (!validateEmail(data.email)) {
        errors.push('Неверный формат email');
    }
    
    if (data.email !== data.confirmEmail) {
        errors.push('Email адреса не совпадают');
    }
    
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.isValid) {
        errors.push(usernameValidation.message);
    }
    
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
        errors.push(passwordValidation.message);
    }
    
    if (data.password !== data.confirmPassword) {
        errors.push('Пароли не совпадают');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Валидация данных входа
 * @param {Object} data - Данные входа
 * @returns {Object} - {isValid: boolean, errors: Array<string>}
 */
function validateLoginData(data) {
    const errors = [];
    
    if (!data.login || data.login.trim().length === 0) {
        errors.push('Введите логин или email');
    }
    
    if (!data.password || data.password.length === 0) {
        errors.push('Введите пароль');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

module.exports = {
    validateEmail,
    validatePassword,
    validateUsername,
    validateMessageContent,
    validateTopicTitle,
    validateId,
    validateRegistrationData,
    validateLoginData
};