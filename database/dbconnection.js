const mysql = require('mysql2');
require('dotenv').config();
const logger = require('../src/config/config').logger

const pool  = mysql.createPool({
    connectionLimit : 10,
    host     : process.env.DB_HOST,
    port     : process.env.DB_PORT,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE,
    timezone : 'utf'
});

pool.on('acquire', function (connection) {
    logger.debug('Connection %d acquired', connection.threadId)
})

pool.on('release', function (connection) {
    logger.debug('Connection %d released', connection.threadId)
})

module.exports = pool;
