const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

async function getDbConfig() {
    try {
        const response = await axios.get('http://127.0.0.1:8200/v1/secret/data/db-config', {
            headers: { 'X-Vault-Token': 'process.env.VAULT_TOKEN ' },
        });
        return response.data.data.data;
    } catch (error) {
        console.error('Error al obtener las credenciales de Vault:', error);
        process.exit(1);
    }
}

(async () => {
    const dbConfig = await getDbConfig();

    const pool = new Pool({
        user: dbConfig.username,
        host: 'localhost',
        database: 'usersdb',
        password: dbConfig.password,
        port: 5432,
    });

    app.get('/users', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM users');
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al obtener usuarios');
        }
    });

    app.post('/users', async (req, res) => {
        const { name, email } = req.body;
        try {
            const result = await pool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]);
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al crear usuario');
        }
    });

    app.put('/users/:id', async (req, res) => {
        const { id } = req.params;
        const { name, email } = req.body;
        try {
            const result = await pool.query('UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *', [name, email, id]);
            res.json(result.rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al actualizar usuario');
        }
    });

    app.delete('/users/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await pool.query('DELETE FROM users WHERE id = $1', [id]);
            res.status(204).send();
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al eliminar usuario');
        }
    });

    app.listen(3000, () => {
        console.log('API corriendo en http://localhost:3000');
    });
})();
