const { dbUser, dbPass, dbName, dbHost } = require('./api/vars');

module.exports = {
    development: {
        username: dbUser,
        password: dbPass,
        database: dbName,
        host: dbHost,
        dialect: 'postgres',
    },
    production: {
        use_env_variable: 'DATABASE_URL',
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    },
};
