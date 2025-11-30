import { Redirect, Route } from 'react-router-dom';
import {
    IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { cloudyOutline, bookOutline, logInOutline } from 'ionicons/icons';

import ForecastPage from './pages/ForecastPage';
import JournalPage from './pages/JournalPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import context

/* ... CSS imports ... */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';

setupIonicReact();

// Create a protected route component
const ProtectedRoute: React.FC<{ component: React.ComponentType<any>, path: string, exact?: boolean }> = ({ component: Component, ...rest }) => {
    const { isAuthenticated } = useAuth();
    return (
        <Route
            {...rest}
            render={(props) =>
                isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />
            }
        />
    );
};

const AppRoutes: React.FC = () => {
    const { isAuthenticated } = useAuth(); // To conditionally show Tabs

    return (
        <IonTabs>
            <IonRouterOutlet>
                <Route exact path="/login">
                    <LoginPage />
                </Route>
                <Route exact path="/forecast">
                    <ForecastPage />
                </Route>
                {/* Use ProtectedRoute for Journal */}
                <ProtectedRoute exact path="/journal" component={JournalPage} />

                <Route exact path="/">
                    <Redirect to="/forecast" />
                </Route>
            </IonRouterOutlet>

            <IonTabBar slot="bottom" className="custom-tab-bar">
                <IonTabButton tab="forecast" href="/forecast">
                    <IonIcon icon={cloudyOutline} />
                    <IonLabel>Forecast</IonLabel>
                </IonTabButton>

                {/* Only show Journal tab if logged in, or show Login tab */}
                {isAuthenticated ? (
                    <IonTabButton tab="journal" href="/journal">
                        <IonIcon icon={bookOutline} />
                        <IonLabel>Journal</IonLabel>
                    </IonTabButton>
                ) : (
                    <IonTabButton tab="login" href="/login">
                        <IonIcon icon={logInOutline} />
                        <IonLabel>Login</IonLabel>
                    </IonTabButton>
                )}
            </IonTabBar>
        </IonTabs>
    );
};

const App: React.FC = () => (
    <IonApp>
        <AuthProvider>
            <IonReactRouter>
                <AppRoutes />
            </IonReactRouter>
        </AuthProvider>
    </IonApp>
);

export default App;