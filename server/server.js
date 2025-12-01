const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const {v4: uuidv4}  = require('uuid');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT'] }
});

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'super-secret-key-change-in-production';

// Database Connection
const pool = new Pool({
    user: 'postgres',      // CHANGE THIS
    host: 'localhost',
    database: 'weather_journal', // CHANGE THIS
    password: 'postgres',  // CHANGE THIS
    port: 5432,
});

app.use(cors());
app.use(express.json({ limit: '50mb' })); // High limit for Base64 photos

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user; // contains { id, username }
        next();
    });
};

// --- SOCKET.IO AUTH ---
// Middleware to protect socket connection
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error("Authentication error"));
        socket.user = decoded; // Attach user to socket
        next();
    });
});

io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected (Socket: ${socket.id})`);

    // Join a private room for this user ID
    socket.join(`user_${socket.user.id}`);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// --- AUTH ROUTES ---

// Register
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
            [username, hashedPassword]
        );
        res.status(201).json({ message: 'User created', user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Username exists' });
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- JOURNAL ROUTES (Protected) ---

app.get('/entries', authenticateToken, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const result = await pool.query(
            `SELECT * FROM entries WHERE user_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );

        // Check if there are more
        const countResult = await pool.query('SELECT COUNT(*) FROM entries WHERE user_id = $1', [req.user.id]);
        const total = parseInt(countResult.rows[0].count);

        const formattedEntries = result.rows.map(row => ({
            ...row,
            photoUrl: row.photo_url,
            coords: typeof row.coords === 'string' ? JSON.parse(row.coords) : row.coords
        }));
        res.json({
            entries: formattedEntries,
            total,
            page,
            hasMore: offset + limit < total
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/entries', authenticateToken, async (req, res) => {
    const { id, date, temperature, description, photoUrl, coords } = req.body; // Accept ID from client for sync

    try {
        const entryId = id || uuidv4();

        const query = `
            INSERT INTO entries (id, user_id, date, temperature, description, photo_url, coords)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [entryId, req.user.id, date, temperature, description, photoUrl, JSON.stringify(coords)];

        const result = await pool.query(query, values);
        const rawEntry = result.rows[0];

        const newEntry = {
            ...rawEntry,
            photoUrl: rawEntry.photo_url,
            coords: typeof rawEntry.coords === 'string' ? JSON.parse(rawEntry.coords) : rawEntry.coords
        };

        // Emit ONLY to this user's room
        io.to(`user_${req.user.id}`).emit('entry_added', newEntry);

        res.status(201).json(newEntry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/entries/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { date, temperature, description, photoUrl, coords } = req.body;

    try {
        const query = `
            UPDATE entries 
            SET date = $1, temperature = $2, description = $3, photo_url = $4, coords = $5
            WHERE id = $6 AND user_id = $7
            RETURNING *
        `;
        const values = [date, temperature, description, photoUrl, JSON.stringify(coords), id, req.user.id];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entry not found or unauthorized' });
        }

        const rawEntry = result.rows[0];

        const updatedEntry = {
            ...rawEntry,
            photoUrl: rawEntry.photo_url,
            coords: typeof rawEntry.coords === 'string' ? JSON.parse(rawEntry.coords) : rawEntry.coords
        };
        io.to(`user_${req.user.id}`).emit('entry_updated', updatedEntry);

        res.json(updatedEntry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

server.listen(PORT, () => {
    console.log(`Postgres Server running on port ${PORT}`);
});