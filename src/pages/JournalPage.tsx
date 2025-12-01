import React, { useEffect, useState } from 'react';
import {
    IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonLabel,
    IonFab, IonFabButton, IonIcon, IonText, IonCard, IonCardContent, IonThumbnail, IonChip,
    useIonModal, useIonToast, IonButton, IonInfiniteScroll, IonInfiniteScrollContent
} from '@ionic/react';
import { add, cloudyOutline, logOutOutline, cloudOfflineOutline, mapOutline } from 'ionicons/icons'; // Added mapOutline
import { WeatherEntry } from '../types';
import EntryModal from '../components/EntryModal';
import EntryMapModal from '../components/EntryMapModal'; // Import Map Modal
import { useJournalSync } from '../hooks/useJournalSync';
import { useAuth } from '../context/AuthContext';
import apiService from '../api';
import { modalEnterAnimation, modalLeaveAnimation } from '../theme/animations'; // Import Animations
import './JournalPage.css';

const JournalPage: React.FC = () => {
    const { entries, isOnline, createEntry, updateEntry, loadMore, hasMore } = useJournalSync();
    const { logout } = useAuth();
    const [selectedEntry, setSelectedEntry] = useState<WeatherEntry | undefined>(undefined);
    const [mapEntry, setMapEntry] = useState<WeatherEntry | undefined>(undefined); // For Map Modal
    const [present] = useIonToast();

    // Socket listeners
    useEffect(() => {
        if (isOnline) {
            const socket = apiService.initSocket();
        }
    }, [isOnline]);

    const showToast = (message: string, color: 'success' | 'danger' | 'warning') => {
        present({ message, duration: 2000, color, position: 'top' });
    };

    // --- ENTRY MODAL CONFIG ---
    const [presentEntryModal, dismissEntryModal] = useIonModal(EntryModal, {
        onDismiss: () => { setSelectedEntry(undefined); },
        onSave: () => { dismissEntryModal(); setSelectedEntry(undefined); },
        entry: selectedEntry,
        customSaveHandler: async (data: any, id?: string) => {
            let online = false;
            if (id) online = await updateEntry(id, data);
            else online = await createEntry(data);

            showToast(online ? 'Success!' : 'Saved to offline queue', online ? 'success' : 'warning');
            dismissEntryModal();
        }
    });

    // --- MAP MODAL CONFIG ---
    const [presentMapModal, dismissMapModal] = useIonModal(EntryMapModal, {
        onDismiss: () => { dismissMapModal(); setMapEntry(undefined); },
        coords: mapEntry?.coords
    });

    const openEditModal = (entry: WeatherEntry) => {
        setSelectedEntry(entry);
        presentEntryModal({
            cssClass: 'entry-modal',
            enterAnimation: modalEnterAnimation, // <--- Custom Animation
            leaveAnimation: modalLeaveAnimation  // <--- Custom Animation
        });
    };

    const openMapModal = (e: React.MouseEvent, entry: WeatherEntry) => {
        e.stopPropagation(); // Prevent opening edit modal
        setMapEntry(entry);
        presentMapModal({
            enterAnimation: modalEnterAnimation,
            leaveAnimation: modalLeaveAnimation
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
                        <IonText><h2 className="empty-title">No Entries Yet</h2></IonText>
                    </div>
                ) : (
                    <IonList className="entries-list">
                        {entries.map((entry, index) => (
                            <IonCard
                                key={entry.id || index}
                                className="entry-card clickable"
                                onClick={(e) => { (e.currentTarget as HTMLElement).blur(); openEditModal(entry); }}
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
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    {/* MAP BUTTON */}
                                                    <IonButton
                                                        size="small"
                                                        fill="clear"
                                                        onClick={(e) => openMapModal(e, entry)}
                                                    >
                                                        <IonIcon slot="icon-only" icon={mapOutline} />
                                                    </IonButton>
                                                    <IonChip className="temp-chip">
                                                        {entry.temperature}°C
                                                    </IonChip>
                                                </div>
                                            </div>
                                            <p>{entry.description}</p>
                                        </div>
                                    </div>
                                </IonCardContent>
                            </IonCard>
                        ))}
                    </IonList>
                )}
                <IonInfiniteScroll
                    onIonInfinite={async (ev) => {
                        await loadMore();
                        ev.target.complete();
                    }}
                    disabled={!hasMore}
                >
                    <IonInfiniteScrollContent loadingText="Loading more memories..." />
                </IonInfiniteScroll>
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => {
                        setSelectedEntry(undefined);
                        presentEntryModal({
                            cssClass: 'entry-modal',
                            enterAnimation: modalEnterAnimation,
                            leaveAnimation: modalLeaveAnimation
                        });
                    }} className="add-fab">
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default JournalPage;