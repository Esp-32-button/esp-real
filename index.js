const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const SECRET_KEY = 'V//9oMX4MY3S3283rwwxicEqr0AWDmVuT1Z863WY4QTGsljPdmfdzosker0mLMxHLsUK5ZeDafwXp3WkUG8khg=='; // Change to a secure key

// Routes
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).send({ error: 'Email and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]);
        res.status(201).send({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Registration error:', err); // Log the error for debugging
        res.status(400).send({ error: 'Registration failed' });
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (!result.rows.length) return res.status(404).send({ error: 'User not found' });

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).send({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id }, SECRET_KEY);
        res.status(200).send({ token });
    } catch (err) {
        res.status(400).send({ error: 'Login failed' });
    }
});

app.get('/led', async (req, res) => {
    try {
        const result = await pool.query('SELECT state FROM led_state LIMIT 1');
        res.status(200).send(result.rows[0]);
    } catch (err) {
        res.status(400).send({ error: 'Failed to fetch LED state' });
    }
});

app.post('/led', async (req, res) => {
    const { state } = req.body;
    try {
        await pool.query('UPDATE led_state SET state = $1', [state]);
        res.status(200).send({ message: `LED turned ${state}` });
    } catch (err) {
        res.status(400).send({ error: 'Failed to update LED state' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
