import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

// Import your components
import Dashboard from './Dashboard';
import H1 from './pages/h1';
import H2 from './pages/h2';
import H3 from './pages/h3';
import H4 from './pages/h4';
import H5 from './pages/h5';
import H6 from './pages/h6';
import H7 from './pages/h7';

// --- PLACEHOLDERS FOR FUTURE LAYERS (Replace these with your real files later) ---
const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-slate-500">
    <h1 className="text-3xl font-bold text-slate-300 mb-2">{title}</h1>
    <p>This layer is under construction.</p>
  </div>
);

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
        <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between shrink-0 z-50">
          
          <div className="flex items-center gap-5">
            {/* Original Back to Dashboard Button */}
            <button
              onClick={() => setActiveView(0)}
              className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-slate-700"></div>

            {/* New Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView(Math.max(1, activeView - 1))}
                disabled={activeView === 1}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                  activeView === 1 
                    ? 'text-slate-600 bg-slate-800/50 cursor-not-allowed' 
                    : 'text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev Layer
              </button>
              
              <div className="px-3 py-1 bg-slate-950 rounded border border-slate-800 text-slate-400 font-mono text-xs font-bold">
                L{activeView}
              </div>

              <button
                onClick={() => setActiveView(Math.min(7, activeView + 1))}
                disabled={activeView === 7}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                  activeView === 7 
                    ? 'text-slate-600 bg-slate-800/50 cursor-not-allowed' 
                    : 'text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Next Layer <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

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
