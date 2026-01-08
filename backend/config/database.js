const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'forum_user',
    password: 'forum_pass',
    database: 'forum_deploy',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
};

async function getDbConnection() {
    return await mysql.createConnection(dbConfig);
}

module.exports = {
    getDbConnection
};