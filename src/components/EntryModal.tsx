import React, { useState, useEffect } from 'react';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonInput,
    IonTextarea,
    IonItem,
    IonLabel,
    IonText,
    IonIcon,
    useIonToast
} from '@ionic/react';
import { close, checkmark, locationOutline, cameraOutline, imageOutline } from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import apiService from '../api';
import { WeatherEntry } from '../types';
import './EntryModal.css';
import 'leaflet/dist/leaflet.css';

// --- Leaflet Icon Fix ---
// This fixes the missing marker icon issue in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
// ------------------------

interface EntryModalProps {
    onDismiss: () => void;
    onSave: () => void;
    entry?: WeatherEntry;
    customSaveHandler?: (data: any, id?: string) => Promise<void>;
}

// Helper component to handle map clicks
const LocationMarker: React.FC<{
    coords: { latitude: number; longitude: number } | null,
    setCoords: (coords: { latitude: number; longitude: number }) => void
}> = ({ coords, setCoords }) => {
    useMapEvents({
        click(e) {
            setCoords({
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
            });
        },
    });

    return coords ? (
        <Marker position={[coords.latitude, coords.longitude]} />
    ) : null;
};

// This component handles re-centering and fixing layout glitches
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();

    useEffect(() => {
        // 1. Fly to the new center when coordinates change
        map.setView(center, map.getZoom());

        // 2. Fix the "Grey Box" issue by forcing a resize calculation
        // We wait a tick to ensure the modal animation is done/DOM is ready
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [center, map]);

    return null;
};

const EntryModal: React.FC<EntryModalProps> = ({ onDismiss, onSave, entry, customSaveHandler }) => {
    const [temperature, setTemperature] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [present] = useIonToast();

    useEffect(() => {
        if (entry) {
            setTemperature(entry.temperature.toString());
            setDescription(entry.description);
            setPhotoUrl(entry.photoUrl || '');
            setCoords(entry.coords);
        }
    }, [entry]);

    const showToast = (message: string, color: 'success' | 'danger' | 'warning') => {
        present({
            message,
            duration: 2000,
            color,
            position: 'top'
        });
    };

    const takePicture = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 80,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                saveToGallery: true,
                source: CameraSource.Camera
            });

            if (image.base64String) {
                // Create a data URL for display and upload
                const dataUrl = `data:image/jpeg;base64,${image.base64String}`;
                setPhotoUrl(dataUrl);
                showToast('Photo captured & saved to gallery!', 'success');
            }
        } catch (error) {
            console.error('Camera error:', error);
            // Don't show error if user just closed the camera
        }
    };

    const getCurrentLocation = async () => {
        setLoading(true);
        try {
            const position = await Geolocation.getCurrentPosition();
            const newCoords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            setCoords(newCoords);
            showToast('Location captured successfully', 'success');
        } catch (error) {
            console.error('Error getting location:', error);
            // Default to NYC if permission denied or error
            const defaultCoords = { latitude: 40.7128, longitude: -74.0060 };
            setCoords(defaultCoords);
            showToast('Using default location (Permission denied?)', 'warning');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!temperature || !description) {
            showToast('Please fill in all required fields', 'warning');
            return;
        }

        if (!coords) {
            showToast('Please capture your location first', 'warning');
            return;
        }

        const tempNum = parseFloat(temperature);
        if (isNaN(tempNum)) {
            showToast('Temperature must be a number', 'warning');
            return;
        }

        const entryData = {
            date: entry ? entry.date : new Date().toISOString(),
            temperature: tempNum,
            description,
            photoUrl: photoUrl || undefined,
            coords
        };

        setLoading(true);

        try {
            if (customSaveHandler) {
                await customSaveHandler(entryData, entry?.id);
            } else {
                if (entry) {
                    await apiService.updateEntry(entry.id, entryData);
                    showToast('Entry updated successfully!', 'success');
                } else {
                    await apiService.addEntry(entryData);
                    showToast('Entry saved successfully!', 'success');
                }
                onSave();
            }
        } catch (error) {
            console.error('Error saving entry:', error);
            showToast('Failed to save entry', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <IonHeader>
                <IonToolbar className="modal-toolbar">
                    <IonButtons slot="start">
                        <IonButton onClick={onDismiss} disabled={loading}>
                            <IonIcon icon={close} />
                        </IonButton>
                    </IonButtons>
                    <IonTitle className="modal-title">{entry ? 'Edit Entry' : 'New Entry'}</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave} disabled={loading} strong>
                            <IonIcon icon={checkmark} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="modal-content">
                <div className="modal-form">
                    {/* --- WEATHER SECTION --- */}
                    <div className="form-section">
                        <IonText>
                            <h3 className="section-title">Weather Details</h3>
                        </IonText>

                        <IonItem className="form-item">
                            <IonInput
                                labelPlacement="stacked"
                                type="number"
                                value={temperature}
                                onIonChange={(e) => setTemperature(e.detail.value!)}
                                placeholder="e.g., 22"
                                className="form-input"
                            >
                                <div slot="label" className="form-label">
                                    Temperature (°C) <span className="required">*</span>
                                </div>
                            </IonInput>
                        </IonItem>

                        <IonItem className="form-item">
                            <IonTextarea
                                labelPlacement="stacked"
                                value={description}
                                onIonChange={(e) => setDescription(e.detail.value!)}
                                placeholder="Describe the weather conditions..."
                                rows={4}
                                className="form-textarea"
                            >
                                <div slot="label" className="form-label">
                                    Description <span className="required">*</span>
                                </div>
                            </IonTextarea>
                        </IonItem>
                    </div>

                    {/* --- PHOTO SECTION --- */}
                    <div className="form-section">
                        <IonText>
                            <h3 className="section-title">Photo</h3>
                        </IonText>

                        {photoUrl ? (
                            <div className="photo-preview-container">
                                <img src={photoUrl} alt="Captured" className="preview-image" />
                                <IonButton
                                    fill="clear"
                                    color="danger"
                                    onClick={() => setPhotoUrl('')}
                                    size="small"
                                >
                                    Remove Photo
                                </IonButton>
                            </div>
                        ) : (
                            <IonButton
                                expand="block"
                                onClick={takePicture}
                                className="camera-button"
                            >
                                <IonIcon icon={cameraOutline} slot="start" />
                                Take Photo
                            </IonButton>
                        )}

                        {/* Fallback input for manual URL if needed */}
                        <IonItem className="form-item">
                            <IonInput
                                label="Or paste URL"
                                labelPlacement="stacked"
                                type="url"
                                value={photoUrl}
                                onIonChange={(e) => setPhotoUrl(e.detail.value!)}
                                placeholder="https://example.com/photo.jpg"
                                className="form-input"
                            />
                        </IonItem>
                    </div>

                    {/* --- LOCATION & MAP SECTION --- */}
                    <div className="form-section">
                        <IonText>
                            <h3 className="section-title">Location</h3>
                        </IonText>

                        <div className="location-section">
                            {coords ? (
                                <div className="location-display">
                                    <IonIcon icon={locationOutline} className="location-icon-large" />
                                    <IonText>
                                        <p className="location-coords">
                                            {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                                        </p>
                                        <p className="location-status">Tap map to adjust</p>
                                    </IonText>
                                </div>
                            ) : (
                                <IonText color="medium">
                                    <p className="location-prompt">Use the button below or tap the map</p>
                                </IonText>
                            )}

                            <IonButton
                                expand="block"
                                onClick={getCurrentLocation}
                                className="location-button"
                                disabled={loading}
                            >
                                <IonIcon icon={locationOutline} slot="start" />
                                Use Current Location
                            </IonButton>

                            {/* --- MAP CONTAINER --- */}
                            <div className="map-container">
                                <MapContainer
                                    center={[coords?.latitude || 40.7128, coords?.longitude || -74.0060]}
                                    zoom={13}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; OpenStreetMap contributors'
                                    />
                                    <LocationMarker coords={coords} setCoords={setCoords} />
                                    <MapUpdater center={[coords?.latitude || 46.7695, coords?.longitude || 23.5898]} />
                                </MapContainer>
                            </div>
                        </div>
                    </div>

                    <IonText color="medium" className="form-note">
                        <p>* Required fields</p>
                    </IonText>
                </div>
            </IonContent>
        </>
    );
};

export default EntryModal;