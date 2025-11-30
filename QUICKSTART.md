# Quick Start Guide - Ionic Weather Journal 🚀

Get your Ionic React Weather Journal app running in 3 simple steps!

## Prerequisites

Before you begin, install Ionic CLI globally (if you haven't already):

```bash
npm install -g @ionic/cli
```

## Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd weather-journal/server
npm install
npm start
```

You should see:
```
🌤️  Weather Journal Server running on port 3001
📡 WebSocket server ready
```

**Keep this terminal open!**

## Step 2: Start the Ionic App

Open a **NEW terminal** and run:

```bash
cd weather-journal
npm install
ionic serve
```

You should see:
```
[INFO] Development server running!

       Local: http://localhost:8100
       
       Use Ctrl+C to quit this process
```

## Step 3: Open the App

Open your browser and go to:
```
http://localhost:8100
```

## 🎉 That's it!

You should now see the Weather Journal app with two tabs:
- **Forecast Tab**: Shows current weather (using mock data by default)
- **Journal Tab**: Your weather journal entries

## ⚡ Quick Commands

| Command | Description |
|---------|-------------|
| `ionic serve` | Start dev server (http://localhost:8100) |
| `ionic build` | Build for production |
| `ionic cap add ios` | Add iOS platform |
| `ionic cap add android` | Add Android platform |
| `ionic cap sync` | Sync code to native projects |
| `ionic cap open ios` | Open Xcode |
| `ionic cap open android` | Open Android Studio |

## 🔑 Adding Real Weather Data (Optional)

1. Get a free API key from OpenWeatherMap:
   - Go to https://openweathermap.org/api
   - Sign up for a free account
   - Copy your API key

2. Open `weather-journal/src/api.ts`

3. Replace this line:
   ```typescript
   const OPENWEATHER_API_KEY = 'YOUR_API_KEY_HERE';
   ```
   
   With your actual key:
   ```typescript
   const OPENWEATHER_API_KEY = 'your_actual_api_key_here';
   ```

4. Save the file and the app will hot-reload automatically!

## 📱 Testing Features

### Forecast Tab
- The app will show weather for your current location
- If location permission is denied, it uses New York City as default
- Click the refresh button (top right) to update weather data
- Different weather conditions show different gradient backgrounds

### Journal Tab
- Click the **+** button (bottom right) to add a new entry
- Fill in temperature and description
- Click "Capture Location" to get your coordinates
- Click the checkmark to save
- Watch the entry appear instantly in the list (WebSocket!)
- Scroll down to see infinite scroll loading more entries

## 🎨 Ionic Features You'll See

- **IonTabs** for bottom tab navigation
- **IonPage** for each page structure
- **IonHeader** with toolbars
- **IonCard** for content display
- **IonInfiniteScroll** for pagination
- **IonModal** for the add entry form
- **IonFab** for the floating action button
- **IonToast** for notifications

## 🐛 Troubleshooting

### Backend won't start
- Make sure port 3001 is not in use
- Try `npm install` again in the server folder

### Frontend won't start
- Make sure Ionic CLI is installed: `npm install -g @ionic/cli`
- Try deleting `node_modules` and running `npm install` again
- Check that port 8100 is not in use

### Location not working
- Grant location permissions when prompted
- The app will use default coordinates (NYC) if permission is denied

### Mock data always showing
- Check that your API key is correctly added to `src/api.ts`
- Make sure there are no typos in the API key
- Save the file after editing (Ionic will hot-reload)

## 📱 Building for Mobile

### For iOS (requires Mac):
```bash
ionic build
ionic cap add ios
ionic cap sync
ionic cap open ios
```

Then build and run from Xcode.

### For Android:
```bash
ionic build
ionic cap add android
ionic cap sync
ionic cap open android
```

Then build and run from Android Studio.

## 💡 Development Tips

- Changes to the frontend auto-reload (hot reload)
- Changes to the backend require restarting the server
- Use Chrome DevTools (F12) to debug
- Check the Network tab to see API calls
- Check the Console for any errors

## 📚 Learn More

- **Ionic Docs**: https://ionicframework.com/docs
- **Ionic React Docs**: https://ionicframework.com/docs/react
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Socket.io Docs**: https://socket.io/docs/

## ✅ What's Working?

After following these steps, you should have:
- ✅ Backend server running on port 3001
- ✅ Ionic app running on http://localhost:8100
- ✅ Two tabs: Forecast and Journal
- ✅ Mock weather data displaying
- ✅ Ability to add new journal entries
- ✅ Real-time updates via WebSocket
- ✅ Infinite scroll loading more entries
- ✅ Beautiful Ionic UI with smooth animations

## 🆘 Need Help?

Check the main README.md for more detailed information!

---

Happy coding with Ionic! 🌤️⚡
