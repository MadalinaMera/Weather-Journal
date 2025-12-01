import { io, Socket } from 'socket.io-client';
import { WeatherEntry, PaginatedResponse, OpenWeatherResponse } from './types';

const API_URL = 'http://localhost:3001';
const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY ?? '';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const GEO_API_URL = 'http://api.openweathermap.org/geo/1.0/direct';

class ApiService {
    private socket: Socket | null = null;

    // Initialize WebSocket connection
    initSocket(): Socket {
        if (!this.socket) {
            const token = localStorage.getItem('jwt_token');
            this.socket = io(API_URL, {
                auth: {
                    token: token
                }
            });

            this.socket.on('connect', () => {
                console.log('✅ Connected to WebSocket server');
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Disconnected from WebSocket server');
            });
        }
        return this.socket;
    }

    // Get socket instance
    getSocket(): Socket | null {
        return this.socket;
    }

    // 1. Update getEntries
    async getEntries(page: number = 1, limit: number = 10): Promise<PaginatedResponse> {
        const token = localStorage.getItem('jwt_token'); // <--- GET TOKEN HERE

        try {
            const response = await fetch(`${API_URL}/entries?page=${page}&limit=${limit}`, {
                method: 'GET', // Explicitly state method (good practice)
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // <--- ADD HEADER
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch entries');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching entries:', error);
            throw error;
        }
    }

    // 2. Update addEntry
    async addEntry(entry: Omit<WeatherEntry, 'id'>): Promise<WeatherEntry> {
        const token = localStorage.getItem('jwt_token'); // <--- GET TOKEN HERE

        try {
            const response = await fetch(`${API_URL}/entries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // <--- ADD HEADER
                },
                body: JSON.stringify(entry),
            });

            if (!response.ok) {
                throw new Error('Failed to add entry');
            }

            return await response.json();
        } catch (error) {
            console.error('Error adding entry:', error);
            throw error;
        }
    }

    // 3. Update updateEntry
    async updateEntry(id: string, entry: Omit<WeatherEntry, 'id'>): Promise<WeatherEntry> {
        const token = localStorage.getItem('jwt_token'); // <--- GET TOKEN HERE

        try {
            const response = await fetch(`${API_URL}/entries/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // <--- ADD HEADER
                },
                body: JSON.stringify(entry),
            });

            if (!response.ok) {
                throw new Error('Failed to update entry');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating entry:', error);
            throw error;
        }
    }
    // User login
    async login(username: string, password: string): Promise<{ token: string; username: string }> {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // User Registration
    async register(username: string, password: string): Promise<void> {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }
    }
    // Mock weather data (use this until you add your API key)
    getMockWeatherData(): OpenWeatherResponse {
        const mockWeatherTypes = [
            { main: 'Clear', description: 'clear sky', icon: '01d', temp: 24 },
            { main: 'Clouds', description: 'few clouds', icon: '02d', temp: 20 },
            { main: 'Rain', description: 'light rain', icon: '10d', temp: 16 },
            { main: 'Snow', description: 'light snow', icon: '13d', temp: -2 },
        ];

        const randomWeather = mockWeatherTypes[Math.floor(Math.random() * mockWeatherTypes.length)];

        return {
            main: {
                temp: randomWeather.temp,
                feels_like: randomWeather.temp - 2,
                humidity: Math.floor(Math.random() * 40) + 40,
            },
            weather: [{
                main: randomWeather.main,
                description: randomWeather.description,
                icon: randomWeather.icon,
            }],
            name: 'Current Location',
            sys: {
                country: 'XX',
            },
        };
    }

    // Fetch real weather data from OpenWeatherMap
    async getWeatherData(lat: number, lon: number): Promise<OpenWeatherResponse> {
        // If no API key is set, return mock data
        if (OPENWEATHER_API_KEY === null) {
            console.log('ℹ️ Using mock weather data. Add your OpenWeatherMap API key to get real data.');
            return this.getMockWeatherData();
        }

        try {
            const url = `${OPENWEATHER_BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching weather data, using mock data:', error);
            return this.getMockWeatherData();
        }
    }
    async searchCity(query: string): Promise<any[]> {
        if (!OPENWEATHER_API_KEY) return [];

        try {
            // limit=5 means "give me the top 5 matching cities"
            const response = await fetch(
                `${GEO_API_URL}?q=${query}&limit=5&appid=${OPENWEATHER_API_KEY}`
            );
            return await response.json();
        } catch (error) {
            console.error('Error searching city:', error);
            return [];
        }
    }

    // Disconnect socket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export default new ApiService();