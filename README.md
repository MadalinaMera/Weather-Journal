# 🌤️ Ionic Weather Journal App

A full-stack, cross-platform mobile application built with **Ionic React** and **Node.js**. This app allows users to check real-time weather forecasts and maintain a personal weather journal with photos and geolocation data.

It features robust **offline capabilities**, **real-time synchronization**, and **native device integration** (Camera & GPS).

## ✨ Features

### 1\. 🌍 Weather Forecast (Tab 1)

* **Live Weather Data:** Fetches real-time weather (Temperature, Humidity, Feels Like) from the OpenWeatherMap API.
* **City Search:** Search for any city worldwide to check its local weather.
* **Device Location:** One-tap button to reset the forecast to your current GPS coordinates.
* **Dynamic UI:** Beautiful glassmorphism design with dynamic backgrounds that change based on weather conditions (Rain, Snow, Clear, Clouds).

### 2\. 📖 Weather Journal (Tab 2)

* **Personal Diary:** Create entries to record your experience of the weather.
* **Infinite Scroll:** Efficiently loads entries in batches as you scroll (Pagination).
* **Real-time Updates:** Uses **Socket.io** to instantly push new entries or edits to all connected devices without refreshing.
* **Map View:** View the exact location of an entry on an interactive Leaflet map.

### 3\. 📸 Native Device Features

* **Camera Integration:** Capture photos directly using the device camera or upload from the gallery.
* **Geolocation:** Automatically tags journal entries with your precise latitude and longitude.
* **Offline Queue:** If the internet is lost, entries are saved locally and automatically synced to the server when the connection is restored.

## 🛠️ Tech Stack

### Frontend (Client)

* **Framework:** [Ionic 7](https://ionicframework.com/) with [React](https://react.dev/)
* **Language:** TypeScript
* **State Management:** React Hooks (Custom `useJournalSync` hook)
* **Native Wrapper:** Capacitor (Camera, Geolocation, Network plugins)
* **Maps:** Leaflet & React-Leaflet
* **Styling:** CSS Modules & Ionic Utility Classes

### Backend (Server)

* **Runtime:** Node.js & Express
* **Database:** PostgreSQL (Persists text and Base64 image data)
* **Real-time:** Socket.io (WebSockets)
* **Authentication:** JSON Web Tokens (JWT) & Bcrypt (Password hashing)

## 🚀 Getting Started

### Prerequisites

* Node.js (v16+)
* PostgreSQL installed and running locally
* Ionic CLI (`npm install -g @ionic/cli`)

### 1\. Database Setup

Create a PostgreSQL database named `weather_journal` and run the following SQL to create the required tables:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE entries (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    date TIMESTAMP,
    temperature NUMERIC,
    description TEXT,
    photo_url TEXT, -- Must be TEXT to hold Base64 strings
    coords TEXT     -- Stores JSON stringified coordinates
);
```

### 2\. Backend Setup

1.  Navigate to the server directory:

    ```bash
    cd server
    npm install
    ```

2.  Configure your database connection in `server.js`:

    ```javascript
    const pool = new Pool({
        user: 'your_postgres_user',
        host: 'localhost',
        database: 'weather_journal',
        password: 'your_postgres_password',
        port: 5432,
    });
    ```

3.  Start the server:

    ```bash
    npm start
    ```

    *Server runs on `http://localhost:3001`*

### 3\. Frontend Setup

1.  Navigate to the project root:

    ```bash
    cd weather-journal
    npm install
    ```

2.  Add your OpenWeatherMap API key in `src/api.ts`:

    ```typescript
    const OPENWEATHER_API_KEY = 'YOUR_API_KEY_HERE';
    ```

3.  Start the development server:

    ```bash
    ionic serve
    ```

    *App runs on `http://localhost:8100`*

## 🔌 API Endpoints

| Method | Endpoint | Description                                 | Protected? |
| :--- | :--- |:--------------------------------------------| :--- |
| `POST` | `/register` | Create a new user account                   | No |
| `POST` | `/login` | Log in and receive JWT                      | No |
| `GET` | `/entries` | Fetch paginated entries (`?page=1&limit=5`) | **Yes** |
| `POST` | `/entries` | Create a new journal entry                  | **Yes** |
| `PUT` | `/entries/:id` | Update an existing entry                    | **Yes** |

## 💡 Key Logic Explained

**Offline Synchronization:**
The app monitors network status using Capacitor's Network plugin.

1.  If **Online**: Entries are sent directly to the PostgreSQL database.
2.  If **Offline**: Entries are stored in the browser's `localStorage` and added to a sync queue.
3.  When **Connection Restores**: The app automatically flushes the queue, sending all offline entries to the backend.

**Image Handling:**
Images are captured as Base64 strings to allow for easy offline storage and universal compatibility without needing a separate file storage bucket (S3/Cloudinary) for this prototype.

## 📄 License

Created for educational purposes.