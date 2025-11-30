# Weather Journal App 🌤️

A beautiful, full-stack **IONIC REACT** Weather Journal application built with Capacitor and Node.js for a university assignment.

## 📋 Features

### Tab 1: Forecast
- Displays real-time weather data from OpenWeatherMap API
- Beautiful gradient backgrounds based on weather conditions
- Animated weather icons with floating effects
- Current temperature, feels-like temperature, and humidity
- Geolocation support with fallback to default location
- Mock data mode for testing without API key

### Tab 2: Journal
- Master-detail view with infinite scroll
- Real-time updates via WebSocket (Socket.io)
- Add new weather entries with location capture
- Paginated list of weather journal entries
- Beautiful card-based UI with smooth animations
- Entry details include: date, temperature, description, photo, and coordinates

## 🛠️ Tech Stack

**Frontend:**
- **Ionic 7.5+ with React**
- TypeScript
- Socket.io Client
- Capacitor for native features (Geolocation)
- React Router

**Backend:**
- Node.js
- Express
- Socket.io (WebSocket)
- In-memory storage (array)

## 📁 Project Structure

```
weather-journal/
├── ionic.config.json        # Ionic configuration
├── capacitor.config.ts      # Capacitor mobile config
├── tsconfig.json           # TypeScript configuration
├── package.json            # Frontend dependencies
│
├── public/                 # Static assets
│   ├── index.html
│   └── manifest.json
│
├── server/                 # Backend
│   ├── server.js          # Express + Socket.io server
│   └── package.json       # Backend dependencies
│
└── src/                   # Frontend source
    ├── App.tsx           # Main app with IonTabs
    ├── index.tsx         # React entry point
    ├── types.ts          # TypeScript interfaces
    ├── api.ts            # API service layer
    ├── components/
    │   ├── EntryModal.tsx
    │   └── EntryModal.css
    ├── pages/
    │   ├── ForecastPage.tsx
    │   ├── ForecastPage.css
    │   ├── JournalPage.tsx
    │   └── JournalPage.css
    └── theme/
        └── variables.css  # Ionic theme variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- **Ionic CLI** (install globally: `npm install -g @ionic/cli`)
- (Optional) OpenWeatherMap API key for real weather data

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the project root:
```bash
cd weather-journal
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Add your OpenWeatherMap API key:
   - Open `src/api.ts`
   - Replace `'YOUR_API_KEY_HERE'` with your actual API key
   - Get a free key at: https://openweathermap.org/api

4. Start the **Ionic development server**:
```bash
ionic serve
```

Or alternatively:
```bash
npm start
```

The app will run on `http://localhost:8100` (Ionic default port)

### Testing Without API Key

The app includes mock weather data, so you can test it immediately without an API key. It will automatically use mock data when no API key is configured.

## 📱 Building for Mobile

### iOS

1. Build the web app:
```bash
ionic build
```

2. Add iOS platform:
```bash
ionic cap add ios
```

3. Sync and open in Xcode:
```bash
ionic cap sync
ionic cap open ios
```

### Android

1. Build the web app:
```bash
ionic build
```

2. Add Android platform:
```bash
ionic cap add android
```

3. Sync and open in Android Studio:
```bash
ionic cap sync
ionic cap open android
```

## 🔌 API Endpoints

### Backend REST API

- `GET /entries?page=1&limit=10` - Fetch paginated journal entries
- `POST /entries` - Add a new journal entry
- `GET /health` - Health check endpoint

### WebSocket Events

- `entry_added` - Emitted when a new entry is added to the journal

## 📊 Data Model

```typescript
interface WeatherEntry {
  id: string;
  date: string;           // ISO 8601 format
  temperature: number;    // Celsius
  description: string;
  photoUrl?: string;
  coords: {
    latitude: number;
    longitude: number;
  };
}
```

## 🎨 Design Features

- **Modern Gradient UI** with smooth animations
- **Poppins Font** for clean, modern typography
- **Responsive Design** that works on mobile and desktop
- **Custom Tab Bar** with Ionic styling
- **Beautiful Cards** with hover effects and shadows
- **Real-time Updates** via WebSocket
- **Infinite Scroll** for seamless browsing
- **Ionic Components** throughout (IonPage, IonHeader, IonCard, etc.)

## 🧪 Testing the App

1. **Forecast Tab**: 
   - View current weather (mock or real)
   - Tap refresh button to update data
   - Check different weather conditions

2. **Journal Tab**:
   - Add new entries using the FAB button
   - Scroll to load more entries (infinite scroll)
   - Watch for real-time updates when entries are added

## 🔧 Configuration

### Changing Backend URL

If your backend runs on a different port or host, update the `API_URL` in `src/api.ts`:

```typescript
const API_URL = 'http://your-backend-url:port';
```

### Adjusting Pagination

In `src/pages/JournalPage.tsx`, you can adjust the pagination limit:

```typescript
const response = await apiService.getEntries(pageNum, 20); // Load 20 entries per page
```

## 📝 Ionic CLI Commands

- `ionic serve` - Start development server
- `ionic build` - Build the app for production
- `ionic cap add ios` - Add iOS platform
- `ionic cap add android` - Add Android platform
- `ionic cap sync` - Sync web code to native projects
- `ionic cap open ios` - Open Xcode
- `ionic cap open android` - Open Android Studio

## 📝 Notes

- This is a **proper Ionic React project** with all Ionic components
- The app uses **in-memory storage** for simplicity. Data will be lost when the server restarts.
- Location permissions are required for accurate geolocation.
- The app provides a fallback to New York City coordinates if geolocation fails.
- WebSocket connection is established automatically when visiting the Journal tab.
- Uses **Ionic's IonTabs**, **IonPage**, **IonHeader**, etc. for true Ionic architecture

## 🎓 Assignment Requirements Checklist

✅ **Ionic React** application (not just React)  
✅ Tab-based application with IonTabs (2 tabs)  
✅ Real weather API integration (OpenWeatherMap)  
✅ Node.js backend with Express  
✅ WebSocket (Socket.io) for real-time updates  
✅ Pagination support (GET /entries?page=1&limit=10)  
✅ REST API (GET and POST endpoints)  
✅ Master-Detail view (Journal list + Entry modal)  
✅ Infinite scroll with IonInfiniteScroll  
✅ TypeScript types and interfaces  
✅ Modern, responsive UI with Ionic components  
✅ Capacitor for native features (Geolocation)  

## 📄 License

This project is created for educational purposes as part of a university assignment.

## 🤝 Contributing

This is an assignment project, but feedback and suggestions are welcome!

---

Built with ❤️ using **Ionic React** and Node.js
