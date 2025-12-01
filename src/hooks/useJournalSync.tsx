import { useState, useEffect, useCallback } from 'react';
import { Network } from '@capacitor/network';
import apiService from '../api';
import { WeatherEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'journal_entries';
const QUEUE_KEY = 'sync_queue';

interface SyncItem {
    type: 'ADD' | 'UPDATE';
    data: Omit<WeatherEntry, 'id'>;
    id?: string;
}

export const useJournalSync = () => {
    const [entries, setEntries] = useState<WeatherEntry[]>([]);
    const [isOnline, setIsOnline] = useState<boolean>(true);

    // 1. Load Data
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

    // 2. Setup WebSocket Listeners
    useEffect(() => {
        let socket: any = null;

        if (isOnline) {
            socket = apiService.initSocket();

            // Listen for new entries
            socket.on('entry_added', (newEntry: WeatherEntry) => {
                setEntries(prev => {
                    // Prevent duplicates if we just added it ourselves
                    if (prev.some(e => e.id === newEntry.id)) return prev;
                    const updated = [newEntry, ...prev];
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                    return updated;
                });
            });

            // Listen for updates
            socket.on('entry_updated', (updatedEntry: WeatherEntry) => {
                setEntries(prev => {
                    const updated = prev.map(entry =>
                        entry.id === updatedEntry.id ? updatedEntry : entry
                    );
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                    return updated;
                });
            });
        }

        // Cleanup listeners on unmount or offline
        return () => {
            if (socket) {
                socket.off('entry_added');
                socket.off('entry_updated');
            }
        };
    }, [isOnline]);

    // 3. Create Entry Logic
    const createEntry = async (entryData: Omit<WeatherEntry, 'id'>) => {
        const status = await Network.getStatus();

        if (status.connected) {
            const newEntry = await apiService.addEntry(entryData);
            setEntries(prev => {
                if(prev.some(entry => entry.id === newEntry.id)) return prev;
                const updated = [newEntry, ...prev];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });
            return true;
        } else {
            const tempId = uuidv4();
            const offlineEntry: WeatherEntry = { ...entryData, id: tempId };

            setEntries(prev => {
                const updated = [offlineEntry, ...prev];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });

            const queue: SyncItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            queue.push({ type: 'ADD', data: entryData });
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

            return false;
        }
    };

    // 4. Update Entry Logic
    const updateEntry = async (id: string, entryData: Omit<WeatherEntry, 'id'>) => {
        const status = await Network.getStatus();

        if (status.connected) {
            const updatedEntry = await apiService.updateEntry(id, entryData);
            setEntries(prev => {
                const updated = prev.map(e => e.id === id ? updatedEntry : e);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });
            return true;
        } else {
            const updatedEntry: WeatherEntry = { ...entryData, id };

            setEntries(prev => {
                const updated = prev.map(e => e.id === id ? updatedEntry : e);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });

            const queue: SyncItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            queue.push({ type: 'UPDATE', id, data: entryData });
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

            return false;
        }
    };

    // 5. Sync Queue
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
        loadEntries(); // Refresh from server to ensure IDs are synced
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