import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonSpinner,
    IonIcon,
    IonButton,
    IonText,
    useIonToast,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel
} from '@ionic/react';
import { refreshOutline, locationOutline, waterOutline, thermometerOutline } from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import apiService from '../api';
import { OpenWeatherResponse } from '../types';
import './ForecastPage.css';

const ForecastPage: React.FC = () => {
    const [weather, setWeather] = useState<OpenWeatherResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [present] = useIonToast();

    // Search state
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const showToast = (message: string, color: 'success' | 'danger' | 'warning') => {
        present({
            message,
            duration: 2000,
            color,
            position: 'top'
        });
    };

    const getCurrentLocation = async () => {
        try {
            const coordinates = await Geolocation.getCurrentPosition();
            const loc = {
                lat: coordinates.coords.latitude,
                lon: coordinates.coords.longitude
            };
            setLocation(loc);
            return loc;
        } catch (error) {
            console.log('Geolocation error, using default location:', error);
            const defaultLoc = { lat: 40.7128, lon: -74.0060 };
            setLocation(defaultLoc);
            return defaultLoc;
        }
    };

    const fetchWeather = async () => {
        setLoading(true);
        try {
            const loc = location || await getCurrentLocation();
            const data = await apiService.getWeatherData(loc.lat, loc.lon);
            setWeather(data);
            showToast('Weather updated successfully', 'success');
        } catch (error) {
            console.error('Error fetching weather:', error);
            showToast('Failed to fetch weather data', 'danger');
        } finally {
            setLoading(false);
        }
    };

    // Handle search input
    const handleSearch = async (e: CustomEvent) => {
        const query = e.detail.value;
        setSearchText(query);

        if (query && query.length > 2) {
            const results = await apiService.searchCity(query);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    // Handle selecting a city
    const selectCity = (city: any) => {
        setLocation({
            lat: city.lat,
            lon: city.lon
        });
        setSearchText('');
        setSearchResults([]);
    };

    useEffect(() => {
        if (location) {
            fetchWeather();
        } else {
            getCurrentLocation().then(loc => {
                apiService.getWeatherData(loc.lat, loc.lon).then(data => setWeather(data));
            });
        }
    }, [location]);

    const getWeatherIcon = (iconCode: string) => {
        return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    };

    const getWeatherBackground = (main: string) => {
        const backgrounds: { [key: string]: string } = {
            Clear: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            Clouds: 'linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)',
            Rain: 'linear-gradient(135deg, #4b79a1 0%, #283e51 100%)',
            Snow: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
            Thunderstorm: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
            Drizzle: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
            Mist: 'linear-gradient(135deg, #d7d2cc 0%, #304352 100%)',
        };
        return backgrounds[main] || backgrounds.Clear;
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="forecast-toolbar">
                    <IonTitle className="forecast-title">Current Forecast</IonTitle>
                    <IonButton
                        slot="end"
                        fill="clear"
                        onClick={fetchWeather}
                        disabled={loading}
                    >
                        <IonIcon icon={refreshOutline} />
                    </IonButton>
                </IonToolbar>

                {/* --- ADDED: Search Bar Toolbar --- */}
                <IonToolbar className="forecast-toolbar">
                    <IonSearchbar
                        value={searchText}
                        onIonInput={handleSearch}
                        placeholder="Search city..."
                        debounce={500}
                        searchIcon={locationOutline}
                    />
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="forecast-content">

                {/* --- ADDED: Search Results List (Overlays content) --- */}
                {searchResults.length > 0 && (
                    <IonList className="search-results-list">
                        {searchResults.map((city, index) => (
                            <IonItem
                                key={index}
                                button
                                onClick={() => selectCity(city)}
                                className="search-result-item"
                                lines="full"
                            >
                                <IonIcon icon={locationOutline} slot="start" color="primary" />
                                <IonLabel>
                                    <h2>{city.name}</h2>
                                    <p>{city.state ? `${city.state}, ` : ''}{city.country}</p>
                                </IonLabel>
                            </IonItem>
                        ))}
                    </IonList>
                )}

                {loading ? (
                    <div className="loading-container">
                        <IonSpinner name="crescent" className="large-spinner" />
                        <IonText>
                            <p className="loading-text">Fetching weather data...</p>
                        </IonText>
                    </div>
                ) : weather ? (
                    <div className="weather-container">
                        <IonCard
                            className="weather-card"
                            style={{ background: getWeatherBackground(weather.weather[0].main) }}
                        >
                            <IonCardContent>
                                <div className="location-info">
                                    <IonIcon icon={locationOutline} className="location-icon" />
                                    <IonText>
                                        <h2 className="location-name">
                                            {weather.name}, {weather.sys.country}
                                        </h2>
                                    </IonText>
                                </div>

                                <div className="weather-main">
                                    <img
                                        src={getWeatherIcon(weather.weather[0].icon)}
                                        alt={weather.weather[0].description}
                                        className="weather-icon"
                                    />
                                    <div className="temperature-display">
                                        <span className="temperature">{Math.round(weather.main.temp)}°</span>
                                        <span className="temperature-unit">C</span>
                                    </div>
                                </div>

                                <IonText>
                                    <p className="weather-description">
                                        {weather.weather[0].description.charAt(0).toUpperCase() +
                                            weather.weather[0].description.slice(1)}
                                    </p>
                                </IonText>

                                <div className="weather-details">
                                    <div className="weather-detail-item">
                                        <IonIcon icon={thermometerOutline} className="detail-icon" />
                                        <div className="detail-content">
                                            <span className="detail-label">Feels Like</span>
                                            <span className="detail-value">{Math.round(weather.main.feels_like)}°C</span>
                                        </div>
                                    </div>

                                    <div className="weather-detail-item">
                                        <IonIcon icon={waterOutline} className="detail-icon" />
                                        <div className="detail-content">
                                            <span className="detail-label">Humidity</span>
                                            <span className="detail-value">{weather.main.humidity}%</span>
                                        </div>
                                    </div>
                                </div>
                            </IonCardContent>
                        </IonCard>

                        <div className="info-note">
                            <IonButton
                                fill="clear"
                                color="medium"
                                onClick={getCurrentLocation}
                                className="location-reset-button"
                            >
                                <IonIcon slot="start" icon={locationOutline} />
                                <IonLabel>Use Device Location</IonLabel>
                            </IonButton>
                        </div>
                    </div>
                ) : (
                    <div className="error-container">
                        <IonText color="danger">
                            <p>Failed to load weather data</p>
                        </IonText>
                        <IonButton onClick={fetchWeather}>
                            Retry
                        </IonButton>
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ForecastPage;