const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for weather entries
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

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// GET /entries - Fetch entries with pagination
app.get('/entries', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Sort by date descending (newest first)
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

// POST /entries - Add a new entry
app.post('/entries', (req, res) => {
    const { date, temperature, description, photoUrl, coords } = req.body;

    // Validation
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

    // Emit WebSocket event to all connected clients
    io.emit('entry_added', newEntry);

    res.status(201).json(newEntry);
});

// PUT /entries/:id - Update an existing entry
app.put('/entries/:id', (req, res) => {
    const { id } = req.params;
    const { date, temperature, description, photoUrl, coords } = req.body;

    // Find the entry index
    const entryIndex = weatherEntries.findIndex(entry => entry.id === id);

    if (entryIndex === -1) {
        return res.status(404).json({ error: 'Entry not found' });
    }

    // Validation
    if (!date || temperature === undefined || !description || !coords) {
        return res.status(400).json({
            error: 'Missing required fields: date, temperature, description, coords'
        });
    }

    // Update the entry
    const updatedEntry = {
        id,
        date,
        temperature: parseFloat(temperature),
        description,
        photoUrl: photoUrl || undefined,
        coords
    };

    weatherEntries[entryIndex] = updatedEntry;

    // Emit WebSocket event to all connected clients
    io.emit('entry_updated', updatedEntry);

    res.json(updatedEntry);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', entries: weatherEntries.length });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`🌤️  Weather Journal Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
});