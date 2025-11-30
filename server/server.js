const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken'); // Import JWT

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT']
    }
});

// Configuration
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'your-secret-key-change-this-in-production'; // Keep this secure

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
// Users for authentication (In a real app, this would be a database)
const users = [
    { username: 'admin', password: 'password123' }
];

let weatherEntries = [
    {
        id: uuidv4(),
        date: new Date(Date.now() - 86400000).toISOString(),
        temperature: 22,
        description: 'Sunny with clear skies',
        photoUrl: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2',
        coords: { latitude: 40.7128, longitude: -74.0060 }
    },
    {
        id: uuidv4(),
        date: new Date(Date.now() - 172800000).toISOString(),
        temperature: 18,
        description: 'Partly cloudy, cool breeze',
        photoUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda',
        coords: { latitude: 40.7128, longitude: -74.0060 }
    },
    {
        id: uuidv4(),
        date: new Date(Date.now() - 259200000).toISOString(),
        temperature: 15,
        description: 'Overcast with light rain',
        photoUrl: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721',
        coords: { latitude: 40.7128, longitude: -74.0060 }
    }
];

// --- JWT Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// --- Socket.io ---
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// --- Routes ---

// Login Endpoint (Issues JWT)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log(username, password);
    // Validate user (Simple check against in-memory array)
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Generate JWT
        const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// GET /entries - Fetch entries (Protected)
app.get('/entries', authenticateToken, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Sort by date descending
    const sortedEntries = [...weatherEntries].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedEntries = sortedEntries.slice(startIndex, endIndex);
    const hasMore = endIndex < sortedEntries.length;

    res.json({
        entries: paginatedEntries,
        total: sortedEntries.length,
        page,
        limit,
        hasMore
    });
});

// POST /entries - Add a new entry (Protected)
app.post('/entries', authenticateToken, (req, res) => {
    const { date, temperature, description, photoUrl, coords } = req.body;

    if (!date || temperature === undefined || !description || !coords) {
        return res.status(400).json({
            error: 'Missing required fields: date, temperature, description, coords'
        });
    }

    const newEntry = {
        id: uuidv4(),
        date,
        temperature: parseFloat(temperature),
        description,
        photoUrl: photoUrl || undefined,
        coords
    };

    weatherEntries.push(newEntry);

    io.emit('entry_added', newEntry);

    res.status(201).json(newEntry);
});

// PUT /entries/:id - Update an existing entry (Protected)
app.put('/entries/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { date, temperature, description, photoUrl, coords } = req.body;

    const entryIndex = weatherEntries.findIndex(entry => entry.id === id);

    if (entryIndex === -1) {
        return res.status(404).json({ error: 'Entry not found' });
    }

    if (!date || temperature === undefined || !description || !coords) {
        return res.status(400).json({
            error: 'Missing required fields: date, temperature, description, coords'
        });
    }

    const updatedEntry = {
        id,
        date,
        temperature: parseFloat(temperature),
        description,
        photoUrl: photoUrl || undefined,
        coords
    };

    weatherEntries[entryIndex] = updatedEntry;

    io.emit('entry_updated', updatedEntry);

    res.json(updatedEntry);
});

// Health check (Public)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', entries: weatherEntries.length });
});

server.listen(PORT, () => {
    console.log(`🌤️  Weather Journal Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
});