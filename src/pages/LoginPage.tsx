import React, { useState } from 'react';
import {
    IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
    IonItem, IonInput, IonButton, IonIcon, useIonRouter, useIonToast
} from '@ionic/react';
import { logInOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const router = useIonRouter();
    const [present] = useIonToast();

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            present({ message: 'Please enter username and password', duration: 2000, color: 'warning' });
            return;
        }

        const success = await login(username, password);

        if (success) {
            router.push('/journal', 'root');
        } else {
            present({ message: 'Invalid credentials', duration: 2000, color: 'danger' });
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Login</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                    {/* UPDATED: Modern Syntax */}
                    <IonItem>
                        <IonInput
                            label="Username"
                            labelPlacement="stacked"
                            value={username}
                            onIonChange={e => setUsername(e.detail.value!)}
                            placeholder="admin"
                        />
                    </IonItem>

                    {/* UPDATED: Modern Syntax */}
                    <IonItem>
                        <IonInput
                            label="Password"
                            labelPlacement="stacked"
                            type="password"
                            value={password}
                            onIonChange={e => setPassword(e.detail.value!)}
                            placeholder="password123"
                        />
                    </IonItem>

                    <IonButton expand="block" onClick={handleLogin}>
                        <IonIcon slot="start" icon={logInOutline} />
                        Login
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default LoginPage;