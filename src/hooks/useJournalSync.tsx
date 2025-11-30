import { useState, useEffect, useCallback } from 'react';
import { Network } from '@capacitor/network';
import apiService from '../api';
import { WeatherEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'journal_entries';
const QUEUE_KEY = 'sync_queue';

// Define what a sync item looks like
interface SyncItem {
    type: 'ADD' | 'UPDATE';
    data: Omit<WeatherEntry, 'id'>;
    id?: string; // Only for UPDATE
}

export const useJournalSync = () => {
    const [entries, setEntries] = useState<WeatherEntry[]>([]);
    const [isOnline, setIsOnline] = useState<boolean>(true);

    const loadEntries = useCallback(async () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setEntries(JSON.parse(stored));
        }

        const status = await Network.getStatus();
        setIsOnline(status.connected);

        if (status.connected) {
            try {
                const response = await apiService.getEntries(1, 50);
                setEntries(response.entries);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(response.entries));
            } catch (error) {
                console.error('Background fetch failed', error);
            }
        }
    }, []);

    // 1. Create (ADD) Logic
    const createEntry = async (entryData: Omit<WeatherEntry, 'id'>) => {
        const status = await Network.getStatus();

        if (status.connected) {
            const newEntry = await apiService.addEntry(entryData);
            const updated = [newEntry, ...entries];
            setEntries(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return true;
        } else {
            // Offline: Add to Queue
            const tempId = uuidv4();
            const offlineEntry: WeatherEntry = { ...entryData, id: tempId };

            // Optimistic UI Update
            const updated = [offlineEntry, ...entries];
            setEntries(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

            // Add to Queue as 'ADD' operation
            const queue: SyncItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            queue.push({ type: 'ADD', data: entryData });
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

            return false;
        }
    };

    // 2. Update (EDIT) Logic
    const updateEntry = async (id: string, entryData: Omit<WeatherEntry, 'id'>) => {
        const status = await Network.getStatus();

        if (status.connected) {
            const updatedEntry = await apiService.updateEntry(id, entryData);
            const updated = entries.map(e => e.id === id ? updatedEntry : e);
            setEntries(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return true;
        } else {
            // Offline: Optimistic UI Update
            // We use the existing ID since we are just editing locally
            const updatedEntry: WeatherEntry = { ...entryData, id };
            const updated = entries.map(e => e.id === id ? updatedEntry : e);
            setEntries(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

            // Add to Queue as 'UPDATE' operation
            const queue: SyncItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            queue.push({ type: 'UPDATE', id, data: entryData });
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

            return false;
        }
    };

    // 3. Flush Queue (Handle both types)
    const flushQueue = async () => {
        const queueString = localStorage.getItem(QUEUE_KEY);
        if (!queueString) return;

        const queue: SyncItem[] = JSON.parse(queueString);
        if (queue.length === 0) return;

        console.log(`📡 Connection restored. Flushing ${queue.length} items...`);

        for (const item of queue) {
            try {
                if (item.type === 'ADD') {
                    await apiService.addEntry(item.data);
                } else if (item.type === 'UPDATE' && item.id) {
                    await apiService.updateEntry(item.id, item.data);
                }
            } catch (e) {
                console.error(`Sync failed for ${item.type}`, e);
                return;
            }
        }

        localStorage.removeItem(QUEUE_KEY);
        loadEntries();
    };

    useEffect(() => {
        const listener = Network.addListener('networkStatusChange', status => {
            setIsOnline(status.connected);
            if (status.connected) {
                flushQueue();
            }
        });

        loadEntries();

        return () => {
            listener.then(handle => handle.remove());
        };
    }, [loadEntries]);

    return { entries, isOnline, createEntry, updateEntry, refresh: loadEntries };
};