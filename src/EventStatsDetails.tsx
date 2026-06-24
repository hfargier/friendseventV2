import { useState } from 'react';
import {
  Users,
  Wallet,
  ListChecks,
  Download,
  Search,
  X,
  User,
} from 'lucide-react';

interface Props {
  data: {
    participants: any[];
    stats_options: any[];
  };
  eventTitle: string;
}

export const EventStatsDetails = ({ data, eventTitle }: Props) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrage des participants par nom ou email
  const filteredParticipants = data.participants.filter(
    (p) =>
      p.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonction d'exportation CSV avec colonnes dynamiques
  const exportToCSV = () => {
    if (!data.participants || data.participants.length === 0) return;
    const dynamicOptions = data.stats_options.map((opt: any) => opt.label);
    const headers = [
      'Nom',
      'Email',
      'Total Paye',
      'Date Inscription',
      ...dynamicOptions,
    ];

    const rows = data.participants.map((p: any) => {
      const baseInfo = [
        `"${p.client_nom}"`,
        `"${p.client_email}"`,
        `"${p.total_amount}€"`,
        `"${p.created_at}"`,
      ];
      const optQty = dynamicOptions.map((label: string) => {
        const regex = new RegExp(
          `${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(x(\\d+)\\)`
        );
        const match = p.options_choisies?.match(regex);
        return match ? match[1] : '0';
      });
      return [...baseInfo, ...optQty];
    });

    const csvContent =
      '\uFEFF' + [headers, ...rows].map((e) => e.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Export_${eventTitle.replace(/\s+/g, '_')}.csv`
    );
    link.click();
  };

  return (
    <div className="admin-dashboard-detailed">
      {/* HEADER : Titre et bouton Export */}
      <div className="admin-header-flex">
        <div className="title-group">
          <h2>{eventTitle}</h2>
          <span className="event-badge-count">
            {data.participants.length} inscrits
          </span>
        </div>
        <button onClick={exportToCSV} className="btn-export">
          <Download size={18} /> Export Excel
        </button>
      </div>

      {/* STATS CARDS : Affichage en colonnes pour éviter les chevauchements */}
      <div className="stats-grid-modern">
        <div className="stat-card-new">
          <div className="stat-icon-wrapper indigo">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Inscriptions</span>
            <span className="stat-val">{data.participants.length}</span>
          </div>
        </div>
        <div className="stat-card-new">
          <div className="stat-icon-wrapper cyan">
            <Wallet size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Collecté</span>
            <span className="stat-val">
              {data.participants.reduce(
                (acc, curr) => acc + parseFloat(curr.total_amount || '0'),
                0
              )}
              €
            </span>
          </div>
        </div>
      </div>

      {/* SECTION RECHERCHE ET LISTE */}
      <section className="participants-section">
        <div className="section-header">
          <div className="section-title">
            <ListChecks size={20} color="var(--cyan)" />
            <h3>Participants</h3>
          </div>

          <div className="modern-search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <X
                size={16}
                className="clear-icon"
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>
        </div>

        <div className="p-list-container">
          {filteredParticipants.length > 0 ? (
            filteredParticipants.map((p, i) => (
              <div key={i} className="participant-item">
                {/* LIGNE 1 : IDENTITÉ ET PRIX (Séparés proprement) */}
                <div className="p-top-bar">
                  <div className="p-left-content">
                    <div className="p-avatar">
                      <User size={20} />
                    </div>
                    <div className="p-identity">
                      <span className="p-name">{p.client_nom}</span>
                      <span className="p-email">{p.client_email}</span>
                    </div>
                  </div>
                  <div className="p-price-tag">{p.total_amount}€</div>
                </div>

                {/* LIGNE 2 : OPTIONS (Grille de badges en dessous) */}
                {p.options_choisies && (
                  <div className="p-options-grid">
                    {p.options_choisies
                      .split(', ')
                      .map((opt: string, idx: number) => (
                        <span key={idx} className="p-opt-chip">
                          {opt}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-empty-state">Aucun participant trouvé.</div>
          )}
        </div>
      </section>
    </div>
  );
};
