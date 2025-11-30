import { useState, useEffect, useCallback } from 'react';
import { Network } from '@capacitor/network';
import apiService from '../api';
import { WeatherEntry } from '../types';
import { v4 as uuidv4 } from 'uuid'; // You might need to install uuid: npm i uuid @types/uuid

const STORAGE_KEY = 'journal_entries';
const QUEUE_KEY = 'sync_queue';

export const useJournalSync = () => {
    const [entries, setEntries] = useState<WeatherEntry[]>([]);
    const [isOnline, setIsOnline] = useState<boolean>(true);

    // 1. Initial Load: LocalStorage First, then API
    const loadEntries = useCallback(async () => {
        // A. Load from LocalStorage immediately
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setEntries(JSON.parse(stored));
        }

        // B. Check connection
        const status = await Network.getStatus();
        setIsOnline(status.connected);

        // C. If online, fetch fresh data and update LocalStorage
        if (status.connected) {
            try {
                const response = await apiService.getEntries(1, 50); // Fetching more for offline cache
                setEntries(response.entries);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(response.entries));
            } catch (error) {
                console.error('Background fetch failed', error);
            }
        }
    }, []);

    // 2. Write Strategy: Check Network -> API or Queue
    const saveEntry = async (entryData: Omit<WeatherEntry, 'id'>) => {
        const status = await Network.getStatus();

        if (status.connected) {
            // Online: Send directly
            const newEntry = await apiService.addEntry(entryData);
            // State update happens via socket usually, but we update local cache too
            const updated = [newEntry, ...entries];
            setEntries(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return true;
        } else {
            // Offline: Add to Queue
            const tempId = uuidv4(); // Generate temp ID for UI
            const offlineEntry: WeatherEntry = { ...entryData, id: tempId };

            // 1. Update UI immediately (Optimistic)
            const updated = [offlineEntry, ...entries];
            setEntries(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

            // 2. Add to Sync Queue
            const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            queue.push(entryData); // We push the raw data without the temp ID
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

            return false; // Indicates saved offline
        }
    };

    // 3. Sync Logic: Flush queue when connection returns
    const flushQueue = async () => {
        const queueString = localStorage.getItem(QUEUE_KEY);
        if (!queueString) return;

        const queue: Omit<WeatherEntry, 'id'>[] = JSON.parse(queueString);
        if (queue.length === 0) return;

        console.log(`📡 Connection restored. Flushing ${queue.length} items...`);

        // Process queue sequentially
        for (const item of queue) {
            try {
                await apiService.addEntry(item);
            } catch (e) {
                console.error('Sync failed for item', item);
                return; // Stop syncing if error, try again later
            }
        }

        // Clear queue after success
        localStorage.removeItem(QUEUE_KEY);

        // Refresh data from server to get correct IDs
        loadEntries();
    };

    useEffect(() => {
        // Listen for network changes
        const listener = Network.addListener('networkStatusChange', status => {
            setIsOnline(status.connected);
            if (status.connected) {
                flushQueue();
            }
        });

        loadEntries(); // Initial load

        return () => {
            listener.then(handle => handle.remove());
        };
    }, [loadEntries]);

    return { entries, isOnline, saveEntry, refresh: loadEntries };
};