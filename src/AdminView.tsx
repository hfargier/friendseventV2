import React, { useState } from 'react';
import { ChevronLeft, Plus, Edit2, Eye, EyeOff, Trash2, ArrowRight } from 'lucide-react';
import { AdminLogin } from './AdminLogin';
import { EventForm } from './EventForm';
import { EventStatsDetails } from './EventStatsDetails';

const API_URL = 'https://seme-et-tisse.fr/API/api_friends_event.php';

export default function AdminView({ onBack }: { onBack: () => void }) {
  // --- ÉTATS ---
  const [adminPass, setAdminPass] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState<'menu' | 'create' | 'edit' | 'view_stats'>('menu');
  
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [adminData, setAdminData] = useState({ participants: [], stats_options: [] });
  
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState({ 
    titre: '', 
    date: '', 
    lieu: '', 
    description: '', 
    options: [{ label: '', description: '', prix: 0 }] 
  });

  // --- LOGIQUE API ---

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=get_admin_events&pass=${adminPass}&v=${Date.now()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvents(data);
        setIsAuth(true);
      } else {
        alert('Accès refusé.');
      }
    } catch (err) {
      alert('Erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  const viewEventDetails = async (id: number) => {
    const event: any = events.find((e: any) => e.id === id);
    if (event) setSelectedEventTitle(event.titre);

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=get_admin_list&pass=${adminPass}&event_id=${id}&v=${Date.now()}`);
      const data = await res.json();
      setAdminData({
        participants: data.participants || [],
        stats_options: data.stats_options || [],
      });
      setAdminMode('view_stats');
    } catch (err) {
      alert('Erreur de chargement des stats.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = async (e: React.MouseEvent, event: any) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=get_all_events&v=${Date.now()}`);
      const allEvents = await res.json();
      const fullEvent = allEvents.find((ev: any) => ev.id === event.id);

      if (fullEvent) {
        setEventForm({
          titre: fullEvent.titre,
          date: event.date.split('/').reverse().join('-'), 
          lieu: fullEvent.lieu,
          description: fullEvent.description,
          options: fullEvent.options.map((o: any) => ({ 
            label: o.label, 
            description: o.description || '', 
            prix: o.prix 
          })),
        });
        setEditingEventId(event.id);
        setAdminMode('edit');
      }
    } catch (err) {
      alert("Erreur lors de la récupération des détails.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!eventForm.titre || !eventForm.date) return alert("Le titre et la date sont requis.");
    setLoading(true);
    const action = adminMode === 'edit' ? 'update_event' : 'create_event';
    const body = adminMode === 'edit' ? { ...eventForm, id: editingEventId } : eventForm;

    try {
      const res = await fetch(`${API_URL}?action=${action}&pass=${adminPass}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        alert(adminMode === 'edit' ? "Mis à jour !" : "Événement créé !");
        window.location.reload();
      }
    } catch (err) {
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
        await fetch(`${API_URL}?action=toggle_event_status&pass=${adminPass}`, {
            method: 'POST',
            body: JSON.stringify({ id }),
        });
        setEvents((prev: any) =>
            prev.map((ev: any) => ev.id === id ? { ...ev, is_active: ev.is_active === 1 ? 0 : 1 } : ev)
        );
    } catch (err) {
        alert("Erreur changement de statut.");
    }
  };

  const deleteEvent = async (e: React.MouseEvent, id: number, titre: string) => {
    e.stopPropagation();
    if (window.confirm(`Supprimer définitivement "${titre}" ?`)) {
      try {
          await fetch(`${API_URL}?action=delete_event&pass=${adminPass}`, {
            method: 'POST',
            body: JSON.stringify({ id }),
          });
          setEvents((prev) => prev.filter((ev: any) => ev.id !== id));
      } catch (err) {
          alert("Erreur lors de la suppression.");
      }
    }
  };

  // --- RENDUS CONDITIONNELS ---

  if (!isAuth) {
    return (
        <AdminLogin 
            adminPass={adminPass} 
            setAdminPass={setAdminPass} 
            handleLogin={handleLogin} 
            onBack={onBack} 
            loading={loading} 
        />
    );
  }

  return (
    <div className="main-wrapper admin-view">
      <div className="event-card wide">
        <button 
            className="back-link" 
            onClick={() => adminMode === 'menu' ? onBack() : setAdminMode('menu')}
        >
          <ChevronLeft size={20} /> {adminMode === 'menu' ? 'Quitter' : 'Menu Admin'}
        </button>

        {adminMode === 'menu' && (
          <div className="admin-menu">
            <h2 style={{ marginBottom: '25px' }}>Tableau de bord</h2>
            <button className="admin-menu-btn create" onClick={() => { 
                setEventForm({ titre: '', date: '', lieu: '', description: '', options: [{ label: '', description: '', prix: 0 }] }); 
                setAdminMode('create'); 
            }}>
              <Plus size={24} /> Créer un événement
            </button>
            <div className="admin-events-list">
              {events.map((ev: any) => (
                <div key={ev.id} className={`admin-event-item ${ev.is_active === 0 ? 'inactive' : ''}`} onClick={() => viewEventDetails(ev.id)}>
                  <div style={{ flex: 1 }}>
                    <strong>{ev.titre}</strong>
                    <small style={{ display: 'block', color: '#94a3b8' }}>{ev.date}</small>
                  </div>
                  <div className="admin-actions">
                    <button onClick={(e) => startEdit(e, ev)} className="action-btn" title="Modifier">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={(e) => toggleStatus(e, ev.id)} className="action-btn">
                        {ev.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button onClick={(e) => deleteEvent(e, ev.id, ev.titre)} className="action-btn delete">
                        <Trash2 size={18} />
                    </button>
                    <ArrowRight size={18} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(adminMode === 'create' || adminMode === 'edit') && (
            <EventForm 
                mode={adminMode} 
                form={eventForm} 
                setForm={setEventForm} 
                onSave={handleSaveEvent} 
                loading={loading} 
            />
        )}

        {adminMode === 'view_stats' && (
            <EventStatsDetails 
                data={adminData} 
                eventTitle={selectedEventTitle} 
            />
        )}
      </div>
    </div>
  );
}