import { useState, useEffect } from 'react';
import { CheckCircle, CreditCard } from 'lucide-react';

interface Option {
  id: number;
  label: string;
  prix: number;
}

interface EventData {
  id: number;
  titre: string;
  description: string;
  options: Option[];
}

export default function EventBooking({
  API,
  eventId,
}: {
  API: string;
  eventId: number;
}) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Chargement des données de l'event et de ses options
  useEffect(() => {
    fetch(`${API}?action=get_event_details&id=${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        setEvent(data);
        setLoading(false);
      });
  }, [eventId]);

  const toggleOption = (optionId: number) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

 
  // Calcul du prix total en temps réel
  const total =
    event?.options
      .filter((opt) => selectedOptions.includes(opt.id))
      .reduce((sum, opt) => sum + Number(opt.prix), 0) || 0;

  if (loading || !event) return <div>Chargement de l'événement...</div>;

  return (
    <div
      className="event-booking-card"
      style={{
        maxWidth: '500px',
        margin: 'auto',
        padding: '20px',
        background: '#1a1a1a',
        borderRadius: '15px',
        color: '#fff',
      }}
    >
      <h2 style={{ color: '#ffcc00' }}>{event.titre}</h2>
      <p style={{ color: '#888', fontSize: '0.9rem' }}>{event.description}</p>

      <div style={{ margin: '25px 0' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>
          CHOISIS TES OPTIONS :
        </h3>
        {event.options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => toggleOption(opt.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '15px',
              marginBottom: '10px',
              background: selectedOptions.includes(opt.id) ? '#333' : '#222',
              borderRadius: '10px',
              cursor: 'pointer',
              border: selectedOptions.includes(opt.id)
                ? '1px solid #ffcc00'
                : '1px solid #333',
              transition: '0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: '2px solid #ffcc00',
                  background: selectedOptions.includes(opt.id)
                    ? '#ffcc00'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedOptions.includes(opt.id) && (
                  <CheckCircle size={14} color="#000" />
                )}
              </div>
              <span>{opt.label}</span>
            </div>
            <span style={{ fontWeight: 'bold' }}>
              {opt.prix > 0 ? `${opt.prix}€` : 'Gratuit'}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: '1px solid #333',
          paddingTop: '20px',
          marginTop: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '1.2rem',
            fontWeight: '900',
            marginBottom: '20px',
          }}
        >
          <span>TOTAL à payer :</span>
          <span className="yellow">{total}€</span>
        </div>

        <button
          disabled={total === 0}
          style={{
            width: '100%',
            padding: '15px',
            background: total > 0 ? '#ffcc00' : '#444',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: total > 0 ? 'pointer' : 'not-allowed',
          }}
          onClick={() => {
            // Ici on appellera le PHP pour créer la session Stripe
            console.log('Envoi vers Stripe pour :', selectedOptions);
          }}
        >
          <CreditCard size={20} /> PAYER MA PART
        </button>
      </div>
    </div>
  );
}
