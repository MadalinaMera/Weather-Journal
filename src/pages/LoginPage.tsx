import React, { useState } from 'react';
import {
    IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
    IonItem, IonInput, IonButton, IonIcon, useIonRouter, useIonToast, IonCard, IonCardContent, IonLabel
} from '@ionic/react';
import { logInOutline, personAddOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';
const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const { login, register } = useAuth();
    const router = useIonRouter();
    const [present] = useIonToast();

    const handleSubmit = async () => {
        if (!username.trim() || !password.trim()) {
            present({ message: 'Please enter username and password', duration: 2000, color: 'warning' });
            return;
        }

        let success;
        if (isRegistering) {
            success = await register(username, password);
        } else {
            success = await login(username, password);
        }

        if (success) {
            router.push('/journal', 'root');
            setUsername(''); setPassword('');
        } else {
            present({ message: isRegistering ? 'Registration failed (User exists?)' : 'Invalid credentials', duration: 2000, color: 'danger' });
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
                                    onClick={handleSubmit}
                                    className="login-button"
                                >
                                    <IonIcon slot="start" icon={isRegistering ? personAddOutline : logInOutline} />
                                    {isRegistering ? 'Sign Up' : 'Login'}
                                </IonButton>
                                <IonButton fill="clear" onClick={() => setIsRegistering(!isRegistering)}>
                                    {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
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