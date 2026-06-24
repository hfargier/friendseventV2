import { useState, useEffect } from 'react';
import './App.css';
import { CreditCard, Calendar, MapPin, Check, ChevronLeft, ArrowRight, Sparkles, Minus, Plus, Download } from 'lucide-react';
import AdminView from './AdminView';

// Utilisation d'un timestamp pour le Cache Buster
const version = Date.now();
const API_URL = `https://seme-et-tisse.fr/API/api_friends_event.php?v=${version}`;

// --- INTERFACES ---
interface Option { 
  id: number; 
  label: string; 
  description?: string; 
  prix: number; 
}

interface EventData { 
  id: number; 
  titre: string; 
  description: string; 
  date: string; 
  lieu: string; 
  options: Option[]; 
}

interface Selection {
  optionId: number;
  quantite: number;
}

export default function App() {
  // --- ÉTATS POUR L'INSTALLATION PWA ---
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // --- ÉTATS DE NAVIGATION ET DONNÉES ---
  const [view, setView] = useState<'list' | 'detail' | 'admin'>('list');
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 1. Gestion de l'événement d'installation PWA
  useEffect(() => {
    const handler = (e: any) => {
      console.log("🚀 Événement beforeinstallprompt capturé !");
      e.preventDefault();
      setInstallPrompt(e); // L'app est installable, on stocke l'événement
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // 2. Charger les événements au démarrage
  useEffect(() => {
    fetch(`${API_URL}&action=get_all_events`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEvents(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur chargement events:", err);
        setLoading(false);
      });
  }, []);

  // Fonction pour déclencher l'installation
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`Résultat de l'installation : ${outcome}`);
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const openEvent = (event: EventData) => {
    setSelectedEvent(event);
    setSelections([]); 
    setView('detail');
    window.scrollTo(0, 0);
  };

  const updateQuantite = (optionId: number, delta: number) => {
    setSelections(prev => {
      const existing = prev.find(s => s.optionId === optionId);
      if (existing) {
        const newQty = existing.quantite + delta;
        if (newQty <= 0) return prev.filter(s => s.optionId !== optionId);
        return prev.map(s => s.optionId === optionId ? { ...s, quantite: newQty } : s);
      }
      if (delta > 0) return [...prev, { optionId, quantite: 1 }];
      return prev;
    });
  };

  const handlePayment = async () => {
    if (!selectedEvent || selections.length === 0) return;
    setIsRedirecting(true);
    try {
      const res = await fetch(`${API_URL}&action=create_checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          options: selections, 
          event_id: selectedEvent.id 
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur Stripe: " + (data.error || "Inconnue"));
        setIsRedirecting(false);
      }
    } catch (err) {
      console.error("Erreur paiement:", err);
      setIsRedirecting(false);
    }
  };

  if (loading) return <div className="loading-screen">Chargement...</div>;
  if (view === 'admin') return <AdminView onBack={() => setView('list')} />;

  // --- VUE LISTE ---
  if (view === 'list') {
    return (
      <div className="main-wrapper">
        <div className="hero-banner-slim">
            <Sparkles size={48} className="sparkle-icon" />
        </div>
        <div className="container catalogue-container">
          <header className="page-header">
            {/* BOUTON INSTALLATION CONDITIONNEL */}
            {installPrompt && (
              <button 
                onClick={handleInstallClick}
                className="install-pwa-btn"
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                }}
              >
                <Download size={20} />
                Installer l'application
              </button>
            )}
            
            <h1>Liste des événements</h1>
            <p>Sélectionne un événement pour t'inscrire</p>
          </header>

          <div className="events-list">
            {events.length > 0 ? events.map(ev => (
              <div key={ev.id} className="modern-event-card" onClick={() => openEvent(ev)}>
                <div className="card-content">
                  <span className="event-date-tag">{ev.date}</span>
                  <h3>{ev.titre}</h3>
                  <div className="event-location"><MapPin size={14} /> {ev.lieu}</div>
                </div>
                <div className="card-arrow"><ArrowRight size={20} /></div>
              </div>
            )) : <p className="empty-msg">Aucun événement disponible.</p>}
          </div>
          <button className="admin-link" onClick={() => setView('admin')}>Accès Organisateur</button>
        </div>
      </div>
    );
  }

  // --- VUE DETAIL ---
  if (view === 'detail' && selectedEvent) {
    const eventOptions = Array.isArray(selectedEvent.options) ? selectedEvent.options : [];
    const total = eventOptions.reduce((acc, opt) => {
      const sel = selections.find(s => s.optionId === Number(opt.id));
      return acc + (sel ? Number(opt.prix) * sel.quantite : 0);
    }, 0);

    return (
      <div className="main-wrapper">
        <div className="event-card">
          <button className="back-link" onClick={() => setView('list')}>
            <ChevronLeft size={20} /> Retour à la liste
          </button>
          
          <header className="event-header">
            <h1 style={{ lineHeight: '1.4', paddingBottom: '4px' }}>{selectedEvent.titre}</h1>
            <div className="event-meta">
               <span><Calendar size={16} color="#6366f1"/> {selectedEvent.date}</span>
               <span><MapPin size={16} color="#6366f1"/> {selectedEvent.lieu}</span>
            </div>
            <div className="event-desc-container">
                <p className="event-desc">{selectedEvent.description}</p>
            </div>
          </header>

          <section className="options-section">
            <h2 className="section-title">Choisis tes options</h2>
            {eventOptions.length > 0 ? (
              eventOptions.map(opt => {
                const currentSel = selections.find(s => s.optionId === Number(opt.id));
                const qty = currentSel ? currentSel.quantite : 0;

                return (
                  <div 
                    key={opt.id} 
                    className={`option-item-modern ${qty > 0 ? 'active' : ''}`} 
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px' }}
                  >
                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="opt-check">
                          {qty > 0 && <Check size={16} strokeWidth={3} />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="opt-label" style={{ fontWeight: '700' }}>{opt.label}</span>
                            <span className="opt-price" style={{ fontWeight: '800', color: '#6366f1' }}>{opt.prix}€</span>
                        </div>
                      </div>

                      <div className="qty-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                          className="qty-btn"
                          onClick={() => updateQuantite(Number(opt.id), -1)}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #374151', background: '#1f2937', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ minWidth: '16px', textAlign: 'center', fontWeight: 'bold' }}>{qty}</span>
                        <button 
                          className="qty-btn"
                          onClick={() => updateQuantite(Number(opt.id), 1)}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    {opt.description && (
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px', marginLeft: '32px', lineHeight: '1.4', opacity: 0.8 }}>
                        {opt.description}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Aucune option disponible.</p>
            )}
          </section>

          <footer className="detail-footer">
            <div className="total-box">
                <span>Total à régler : </span>
                <span className="price-big">{total}€</span>
            </div>
            <button 
              className="main-pay-btn" 
              disabled={total === 0 || isRedirecting} 
              onClick={handlePayment}
            >
              {isRedirecting ? "Chargement..." : <><CreditCard size={20} /> Réserver ma place</>}
            </button>
          </footer>
        </div>
      </div>
    );
  }

  return null;
}