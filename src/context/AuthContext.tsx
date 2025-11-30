import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../api';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    login: async () => false,
    logout: () => {},
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Check for token on app start
        const checkAuth = () => {
            const token = localStorage.getItem('jwt_token');
            // Optional: You could decode the token here to check expiry
            setIsAuthenticated(!!token);
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const data = await apiService.login(username, password);

            // Store the REAL token from the server
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('username', data.username);

            setIsAuthenticated(true);
            return true;
        } catch (error) {
            console.error('Authentication failed', error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};