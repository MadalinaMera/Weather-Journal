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
    // IonLabel, // Removed
    IonText,
    IonIcon,
    useIonToast
} from '@ionic/react';
import { close, checkmark, locationOutline } from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import apiService from '../api';
import { WeatherEntry } from '../types';
import './EntryModal.css';

interface EntryModalProps {
    onDismiss: () => void;
    onSave: () => void;
    entry?: WeatherEntry;
    customSaveHandler?: (data: any, id?: string) => Promise<void>;
}

const EntryModal: React.FC<EntryModalProps> = ({ onDismiss, onSave, entry, customSaveHandler }) => {
    // ... (keep all your state and logic functions exactly the same) ...
    const [temperature, setTemperature] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [present] = useIonToast();

    // Populate form if editing existing entry
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

    const getCurrentLocation = async () => {
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
            // Use default location if geolocation fails
            const defaultCoords = { latitude: 40.7128, longitude: -74.0060 };
            setCoords(defaultCoords);
            showToast('Using default location', 'warning');
        }
    };

    const handleSave = async () => {
        // Validation
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
                await customSaveHandler(entryData,entry?.id);
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
                    <div className="form-section">
                        <IonText>
                            <h3 className="section-title">Weather Details</h3>
                        </IonText>

                        {/* UPDATED: Modern Syntax with label slot for HTML content */}
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

                        {/* UPDATED: Modern Syntax for Textarea */}
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

                        {/* UPDATED: Modern Syntax for Photo URL */}
                        <IonItem className="form-item">
                            <IonInput
                                label="Photo URL (optional)"
                                labelPlacement="stacked"
                                type="url"
                                value={photoUrl}
                                onIonChange={(e) => setPhotoUrl(e.detail.value!)}
                                placeholder="https://example.com/photo.jpg"
                                className="form-input"
                            />
                        </IonItem>
                    </div>

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
                                        <p className="location-status">Location captured</p>
                                    </IonText>
                                </div>
                            ) : (
                                <IonText color="medium">
                                    <p className="location-prompt">Tap the button below to capture your current location</p>
                                </IonText>
                            )}

                            <IonButton
                                expand="block"
                                onClick={getCurrentLocation}
                                className="location-button"
                                disabled={loading}
                            >
                                <IonIcon icon={locationOutline} slot="start" />
                                {coords ? 'Update Location' : 'Capture Location'}
                            </IonButton>
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