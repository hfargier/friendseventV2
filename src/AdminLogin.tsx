// Partie connexion
import { Lock, ChevronLeft } from 'lucide-react';

interface Props {
  adminPass: string;
  setAdminPass: (val: string) => void;
  handleLogin: () => void;
  onBack: () => void;
  loading: boolean;
}

export const AdminLogin = ({
  adminPass,
  setAdminPass,
  handleLogin,
  onBack,
  loading,
}: Props) => (
  <div className="main-wrapper">
    <div className="event-card">
      <button className="back-link" onClick={onBack}>
        <ChevronLeft size={20} /> Retour
      </button>
      <div className="login-form">
        <Lock
          size={40}
          className="indigo-color"
          style={{ marginBottom: '20px' }}
        />
        <h2>Administration</h2>
        <input
          type="password"
          placeholder="Code secret"
          className="modern-input"
          value={adminPass}
          onChange={(e) => setAdminPass(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        <button
          onClick={handleLogin}
          className="main-pay-btn"
          disabled={loading}
        >
          {loading ? 'Vérification...' : 'Entrer'}
        </button>
      </div>
    </div>
  </div>
);
