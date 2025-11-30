import React, { useState } from 'react';
import {
    IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
    IonItem, IonInput, IonButton, IonIcon, useIonRouter, useIonToast, IonCard, IonCardContent, IonLabel
} from '@ionic/react';
import { logInOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';
const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const router = useIonRouter();
    const [present] = useIonToast();

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            present({ message: 'Please enter username and password', duration: 2000, color: 'warning', position: 'top' });
            return;
        }

        const success = await login(username, password);

        if (success) {
            router.push('/journal', 'root');
        } else {
            present({ message: 'Invalid credentials', duration: 2000, color: 'danger', position: 'top' });
        }
    };

    return (
        <IonPage>
            <IonContent className="login-content" fullscreen>
                <div className="login-container">
                    <div className="login-header">
                        <div className="login-logo">🌤️</div>
                        <h1 className="login-title">Weather Journal</h1>
                        <p className="login-subtitle">Sign in to access your journal</p>
                    </div>

                    <IonCard className="login-card">
                        <IonCardContent>
                            <div className="login-form">
                                <IonItem className="login-item" lines="none">
                                    <IonInput
                                        label="Username"
                                        labelPlacement="stacked"
                                        type="text"
                                        value={username}
                                        onIonChange={(e) => setUsername(e.detail.value!)}
                                        placeholder="Enter your username"
                                    />
                                </IonItem>

                                <IonItem className="login-item" lines="none">
                                    <IonInput
                                        label="Password"
                                        labelPlacement="stacked"
                                        type="password"
                                        value={password}
                                        onIonChange={(e) => setPassword(e.detail.value!)}
                                        placeholder="Enter your password"
                                    />
                                </IonItem>

                                <IonButton
                                    expand="block"
                                    onClick={handleLogin}
                                    className="login-button"
                                >
                                    Log In <IonIcon icon={logInOutline} slot="end" />
                                </IonButton>
                            </div>
                        </IonCardContent>
                    </IonCard>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default LoginPage;