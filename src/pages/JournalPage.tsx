import React, { useEffect, useState } from 'react';
import {
    IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonLabel,
    IonNote, IonInfiniteScroll, IonInfiniteScrollContent, IonFab, IonFabButton,
    IonIcon, IonText, IonCard, IonCardContent, IonThumbnail, IonChip,
    useIonModal, useIonToast, IonBadge, IonButton
} from '@ionic/react';
import { add, cloudyOutline, logOutOutline, cloudOfflineOutline } from 'ionicons/icons';
import { WeatherEntry } from '../types';
import EntryModal from '../components/EntryModal';
import { useJournalSync } from '../hooks/useJournalSync';
import { useAuth } from '../context/AuthContext';
import apiService from '../api';
import './JournalPage.css';

const JournalPage: React.FC = () => {
    const { entries, isOnline, createEntry, updateEntry } = useJournalSync();
    const { logout } = useAuth();
    const [selectedEntry, setSelectedEntry] = useState<WeatherEntry | undefined>(undefined);
    const [present] = useIonToast();

    // Socket listeners (optional/if needed)
    useEffect(() => {
        if (isOnline) {
            const socket = apiService.initSocket();
            // Add listeners here if you want real-time updates from others
        }
    }, [isOnline]);

    const showToast = (message: string, color: 'success' | 'danger' | 'warning') => {
        present({ message, duration: 2000, color, position: 'top' });
    };

    const handleEntrySaved = async () => {
        dismissModal();
        setSelectedEntry(undefined);
    };

    const [presentModal, dismissModal] = useIonModal(EntryModal, {
        onDismiss: () => { dismissModal(); setSelectedEntry(undefined); },
        onSave: handleEntrySaved,
        entry: selectedEntry,
        customSaveHandler: async (data: any, id?: string) => {
            let online = false;

            if (id) {
                // If ID exists, it's an UPDATE
                online = await updateEntry(id, data);
            } else {
                // If no ID, it's a CREATE
                online = await createEntry(data);
            }

            showToast(
                online ? 'Success!' : 'Saved to offline queue',
                online ? 'success' : 'warning'
            );
            dismissModal();
        }
    });

    // --- MISSING FUNCTION ADDED HERE ---
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
                    <IonTitle className="journal-title">
                        My Journal { !isOnline && <IonIcon icon={cloudOfflineOutline} />}
                    </IonTitle>
                    <IonButton slot="end" fill="clear" onClick={logout}>
                        <IonIcon icon={logOutOutline} />
                    </IonButton>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="journal-content">
                {!isOnline && (
                    <div style={{ background: '#ffa726', color: 'white', textAlign: 'center', padding: '5px' }}>
                        Offline Mode - Changes will sync later
                    </div>
                )}

                {entries.length === 0 ? (
                    <div className="empty-state">
                        <IonIcon icon={cloudyOutline} className="empty-icon" />
                        <IonText>
                            <h2 className="empty-title">No Entries Yet</h2>
                        </IonText>
                    </div>
                ) : (
                    <IonList className="entries-list">
                        {entries.map((entry, index) => (
                            <IonCard
                                key={entry.id || index}
                                className="entry-card clickable"
                                onClick={(e) =>{ (e.currentTarget as HTMLElement).blur(); openEditModal(entry)}}
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
                                                    <h2 className="entry-date">{new Date(entry.date).toLocaleDateString()}</h2>
                                                </IonLabel>
                                                <IonChip className="temp-chip">
                                                    {entry.temperature}°C
                                                </IonChip>
                                            </div>
                                            <p>{entry.description}</p>
                                        </div>
                                    </div>
                                </IonCardContent>
                            </IonCard>
                        ))}
                    </IonList>
                )}

                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => { setSelectedEntry(undefined); presentModal({ cssClass: 'entry-modal' }); }} className="add-fab">
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default JournalPage;