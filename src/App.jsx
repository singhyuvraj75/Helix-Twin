import React, { useState } from 'react';
import { Home, ArrowLeft } from 'lucide-react';

// --- MOCK COMPONENTS FOR CANVAS COMPILATION ---
// (In your local GitHub repository, you can replace these with your actual imports: 
// import Dashboard from './Dashboard'; import H1 from './pages/h1'; etc.)

const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-slate-500">
    <h1 className="text-3xl font-bold text-slate-300 mb-2">{title}</h1>
    <p>This layer is under construction.</p>
  </div>
);

const Dashboard = ({ onNavigate }) => (
  <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-slate-500 gap-4">
    <h1 className="text-3xl font-bold text-slate-300">Omni-Dashboard</h1>
    <div className="flex gap-4 flex-wrap justify-center max-w-2xl">
      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
        <button
          key={num}
          onClick={() => onNavigate(num)}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors font-bold"
        >
          Launch Layer {num}
        </button>
      ))}
    </div>
  </div>
);

const H1 = () => <Placeholder title="L1: Semantic Intent" />;
const H2 = () => <Placeholder title="L2: Knowledge Helix" />;
const H3 = () => <Placeholder title="L3: Generative Design" />;
const H4 = () => <Placeholder title="L4: Calibration Matrix" />;
const H5 = () => <Placeholder title="L5: Co-Simulation" />;
const H6 = () => <Placeholder title="L6: Compliance Sentinel" />;
const H7 = () => <Placeholder title="L7: Omni-Dashboard" />;

export default function App() {
  // State 0 = Dashboard, 1-7 = Layers
  const [activeView, setActiveView] = useState(0);

  // Helper to render the correct component
  const renderView = () => {
    switch (activeView) {
      case 0: return <Dashboard onNavigate={setActiveView} />;
      case 1: return <H1 />;
      case 2: return <H2 />;
      case 3: return <H3 />;
      case 4: return <H4 />;
      case 5: return <H5 />;
      case 6: return <H6 />;
      case 7: return <H7 />;
      default: return <Dashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden">

      {/* Global Navigation Bar (Only shows when inside a layer) */}
      {activeView !== 0 && (
        <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between shrink-0">
          <button
            onClick={() => setActiveView(0)}
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-xs uppercase tracking-widest">Active Session</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {renderView()}
      </div>

    </div>
  );
}
