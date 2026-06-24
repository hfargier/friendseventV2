import { useState, useEffect } from 'react';
import { CreditCard, Check, Calendar, MapPin } from 'lucide-react';

interface Option {
  id: number;
  label: string;
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

export default function EventSelector({ API_URL }: { API_URL: string }) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On récupère l'événement actif (ex: le premier de la liste pour tes amis)
    fetch(`${API_URL}?action=get_active_event`)
      .then(res => res.json())
      .then(data => {
        setEvent(data);
        setLoading(false);
      });
  }, []);

  const toggleOption = (id: number) => {
    setSelectedOptions(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    if (!event) return 0;
    return event.options
      .filter(opt => selectedOptions.includes(opt.id))
      .reduce((sum, opt) => sum + Number(opt.prix), 0);
  };

  const handlePayment = async () => {
    const res = await fetch(`${API_URL}/stripe_handler.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: selectedOptions })
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // Redirection vers Stripe
    }
  };

  if (loading) return <div className="loading-jsa">CHARGEMENT...</div>;
  if (!event) return <div className="error-jsa">AUCUN ÉVÉNEMENT TROUVÉ.</div>;

  return (
    <div className="view-fade" style={{ padding: '15px', maxWidth: '500px', margin: 'auto' }}>
      {/* CARD ÉVÉNEMENT STYLE JSA */}
      <div className="player-data-card" style={{ marginBottom: '20px' }}>
        <h2 className="section-title-moyenne" style={{ color: '#ffcc00' }}>{event.titre.toUpperCase()}</h2>
        
        <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '0.8rem', color: '#888' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={14} className="yellow" /> {new Date(event.date).toLocaleDateString('fr-FR')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={14} className="yellow" /> {event.lieu}
          </span>
        </div>
        
        <p style={{ marginTop: '15px', fontSize: '0.9rem', lineHeight: '1.4' }}>{event.description}</p>
      </div>

      {/* LISTE DES OPTIONS */}
      <h3 style={{ fontSize: '0.8rem', color: '#666', marginBottom: '10px', fontWeight: '800' }}>OPTIONS DISPONIBLES</h3>
      <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {event.options.map(opt => (
          <div 
            key={opt.id}
            onClick={() => toggleOption(opt.id)}
            className={`player-data-card ${selectedOptions.includes(opt.id) ? 'active-border' : ''}`}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              border: selectedOptions.includes(opt.id) ? '1px solid #ffcc00' : '1px solid #222'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '20px', height: '20px', border: '2px solid #333', borderRadius: '4px',
                background: selectedOptions.includes(opt.id) ? '#ffcc00' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {selectedOptions.includes(opt.id) && <Check size={14} color="#000" />}
              </div>
              <span style={{ fontWeight: '700' }}>{opt.label}</span>
            </div>
            <span className="yellow" style={{ fontWeight: '800' }}>{opt.prix}€</span>
          </div>
        ))}
      </div>

      {/* BARRE DE PAIEMENT FIXE EN BAS */}
      <div className="payment-footer" style={{ 
        marginTop: '30px', borderTop: '1px solid #222', paddingTop: '20px',
        display: 'flex', flexDirection: 'column', gap: '15px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>TOTAL À RÉGLER</span>
          <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ffcc00' }}>{calculateTotal()}€</span>
        </div>
        
        <button 
          className="login-button" 
          disabled={calculateTotal() === 0}
          onClick={handlePayment}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          <CreditCard size={20} /> PAYER PAR CARTE
        </button>
      </div>
    </div>
  );
}