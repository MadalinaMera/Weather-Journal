import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonList,
    IonLabel,
    IonNote,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonCard,
    IonCardContent,
    IonThumbnail,
    IonChip,
    useIonModal,
    useIonToast
} from '@ionic/react';
import { add, cloudyOutline } from 'ionicons/icons';
import apiService from '../api';
import { WeatherEntry } from '../types';
import EntryModal from '../components/EntryModal';
import './JournalPage.css';

const JournalPage: React.FC = () => {
    const [entries, setEntries] = useState<WeatherEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [selectedEntry, setSelectedEntry] = useState<WeatherEntry | undefined>(undefined);
    const [present] = useIonToast();

    const showToast = (message: string, color: 'success' | 'danger' | 'warning') => {
        present({
            message,
            duration: 2000,
            color,
            position: 'top'
        });
    };

    const fetchEntries = async (pageNum: number, append: boolean = false) => {
        try {
            const response = await apiService.getEntries(pageNum, 10);

            if (append) {
                setEntries(prev => [...prev, ...response.entries]);
            } else {
                setEntries(response.entries);
            }

            setHasMore(response.hasMore);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching entries:', error);
            showToast('Failed to load entries', 'danger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries(1);

        // Initialize WebSocket connection
        const socket = apiService.initSocket();

        // Listen for new entries
        socket.on('entry_added', (newEntry: WeatherEntry) => {
            setEntries(prev => [newEntry, ...prev]);
            showToast('New entry added!', 'success');
        });

        // Listen for updated entries
        socket.on('entry_updated', (updatedEntry: WeatherEntry) => {
            setEntries(prev =>
                prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
            );
            showToast('Entry updated!', 'success');
        });

        return () => {
            socket.off('entry_added');
            socket.off('entry_updated');
        };
    }, []);

    const loadMoreData = async (event: CustomEvent<void>) => {
        if (hasMore) {
            await fetchEntries(page + 1, true);
        }
        (event.target as HTMLIonInfiniteScrollElement).complete();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDismissModal = () => {
        dismissModal();
        setSelectedEntry(undefined);
    };

    const handleEntrySaved = async () => {
        dismissModal();
        setSelectedEntry(undefined);
        // Refresh the list
        setLoading(true);
        await fetchEntries(1);
    };

    const [presentModal, dismissModal] = useIonModal(EntryModal, {
        onDismiss: handleDismissModal,
        onSave: handleEntrySaved,
        entry: selectedEntry,
    });

    const openAddModal = () => {
        setSelectedEntry(undefined);
        presentModal({
            cssClass: 'entry-modal',
        });
    };

    const openEditModal = (entry: WeatherEntry) => {
        setSelectedEntry(entry);
        presentModal({
            cssClass: 'entry-modal',
        });
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="journal-toolbar">
                    <IonTitle className="journal-title">My Weather Journal</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="journal-content">
                {loading ? (
                    <div className="loading-container">
                        <IonSpinner name="crescent" className="large-spinner" />
                        <IonText>
                            <p className="loading-text">Loading your journal...</p>
                        </IonText>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="empty-state">
                        <IonIcon icon={cloudyOutline} className="empty-icon" />
                        <IonText>
                            <h2 className="empty-title">No Entries Yet</h2>
                            <p className="empty-description">
                                Start your weather journal by adding your first entry!
                            </p>
                        </IonText>
                    </div>
                ) : (
                    <IonList className="entries-list">
                        {entries.map((entry, index) => (
                            <IonCard
                                key={entry.id}
                                className="entry-card clickable"
                                style={{ animationDelay: `${index * 0.1}s` }}
                                onClick={() => openEditModal(entry)}
                                button
                            >
                                <IonCardContent>
                                    <div className="entry-content">
                                        {entry.photoUrl && (
                                            <IonThumbnail className="entry-thumbnail">
                                                <img src={entry.photoUrl} alt="Weather" />
                                            </IonThumbnail>
                                        )}

                                        <div className="entry-details">
                                            <div className="entry-header">
                                                <IonLabel>
                                                    <h2 className="entry-date">{formatDate(entry.date)}</h2>
                                                    <p className="entry-time">{formatTime(entry.date)}</p>
                                                </IonLabel>
                                                <IonChip className="temp-chip">
                                                    <IonLabel className="temp-label">{entry.temperature}°C</IonLabel>
                                                </IonChip>
                                            </div>

                                            <IonText>
                                                <p className="entry-description">{entry.description}</p>
                                            </IonText>

                                            <IonNote className="entry-coords">
                                                📍 {entry.coords.latitude.toFixed(4)}, {entry.coords.longitude.toFixed(4)}
                                            </IonNote>
                                        </div>
                                    </div>
                                </IonCardContent>
                            </IonCard>
                        ))}
                    </IonList>
                )}

                {!loading && hasMore && entries.length > 0 && (
                    <IonInfiniteScroll
                        onIonInfinite={loadMoreData}
                        threshold="100px"
                    >
                        <IonInfiniteScrollContent
                            loadingText="Loading more entries..."
                            loadingSpinner="crescent"
                        />
                    </IonInfiniteScroll>
                )}

                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={openAddModal} className="add-fab">
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default JournalPage;