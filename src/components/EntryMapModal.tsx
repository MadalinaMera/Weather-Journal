import React, { useEffect } from 'react';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, IonPage } from '@ionic/react';
import { close } from 'ionicons/icons';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Leaflet Icon Fix ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapModalProps {
    onDismiss: () => void;
    coords: { latitude: number; longitude: number };
}

// Helper to force map resize/center
const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
        setTimeout(() => map.invalidateSize(), 200);
    }, [center, map]);
    return null;
};

const EntryMapModal: React.FC<MapModalProps> = ({ onDismiss, coords }) => {
    if(!coords) {
        return null;
    }
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar style={{ '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '--color': 'white' }}>
                    <IonTitle>Entry Location</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onDismiss} color="light">
                            <IonIcon icon={close} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <div style={{ height: '100%', width: '100%' }}>
                    <MapContainer
                        center={[coords.latitude, coords.longitude]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        <Marker position={[coords.latitude, coords.longitude]} />
                        <MapController center={[coords.latitude, coords.longitude]} />
                    </MapContainer>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default EntryMapModal;