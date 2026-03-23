import React, { useState, createContext, useContext } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

// ============================================================================
// MOCK COMPONENTS FOR CANVAS COMPILATION
// (Replacing external imports so the sandbox runs without crashing)
// ============================================================================
const Dashboard = ({ onNavigate }) => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400">
    <h2 className="text-2xl font-bold text-white mb-4">Omni-Dashboard (Placeholder)</h2>
    <button onClick={() => onNavigate(1)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
      Launch Layer 1 (Semantic Intent)
    </button>
  </div>
);

const H1 = () => <div className="flex items-center justify-center h-full text-xl text-slate-400">L1: Semantic Intent (Placeholder)</div>;
const H2 = () => <div className="flex items-center justify-center h-full text-xl text-slate-400">L2: Knowledge Helix (Placeholder)</div>;
const H3 = () => <div className="flex items-center justify-center h-full text-xl text-slate-400">L3: Generative Design (Placeholder)</div>;
const H4 = () => <div className="flex items-center justify-center h-full text-xl text-slate-400">L4: Calibration Matrix (Placeholder)</div>;
const H5 = () => <div className="flex items-center justify-center h-full text-xl text-slate-400">L5: Co-Simulation (Placeholder)</div>;
const H6 = () => <div className="flex items-center justify-center h-full text-xl text-slate-400">L6: Compliance Sentinel (Placeholder)</div>;
const H7 = () => <div className="flex items-center justify-center h-full text-xl text-slate-400">L7: Omni-Dashboard (Placeholder)</div>;


// ============================================================================
// 1. GLOBAL STATE ORCHESTRATOR (THE "RIPPLE EFFECT" BRAIN)
// ============================================================================
export const SimulationContext = createContext();

export const SimulationProvider = ({ children }) => {
  // --- BASE REQUIREMENTS (L1) ---
  const [requirements, setRequirements] = useState({
    deviceType: 'Ventilator',
    transportTime: 4, // Initial: 4 hours
    maxMass: 5.0, // kg
  });

  // --- DERIVED SYSTEM STATE (L2 - L6) ---
  const [bom, setBom] = useState([
    { id: 'MCU-001', mpn: 'nRF52840-QIAA', category: 'IC', origin: 'Taiwan', lead_time: '12 wks', rohs: true },
    { id: 'BAT-001', mpn: 'LIPO-5000-30C', category: 'Battery', origin: 'China', lead_time: '8 wks', rohs: true, capacity: '5000mAh', mass: '0.4kg' },
    { id: 'PWR-002', mpn: 'TPS63020', category: 'Power', origin: 'USA', lead_time: '16 wks', rohs: true },
    { id: 'SEN-001', mpn: 'AD5940', category: 'Sensor', origin: 'Ireland', lead_time: '4 wks', rohs: true },
    { id: 'CAP-999', mpn: 'CC0603-LEGACY', category: 'Passive', origin: 'China', lead_time: '52 wks', rohs: false }
  ]);

  const [mcadState, setMcadState] = useState({
    material: 'Medical ABS (White)',
    wallThickness: '2.5mm',
    thermalLoad: 'Nominal',
    systemMass: 4.8
  });

  const [globalHazards, setGlobalHazards] = useState([]);
  const [globalLogs, setGlobalLogs] = useState(["System Initialized. Baseline requirements loaded."]);

  const addLog = (msg) => {
    setGlobalLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // --- THE RIPPLE EFFECT ENGINE ---
  // This function is triggered by Layer 1 (Semantic Intent)
  const triggerRippleEffect = (newTransportTime) => {
    addLog(`[L1: Semantic Intent] Transport time requirement updated to ${newTransportTime} hours.`);
    setRequirements(prev => ({ ...prev, transportTime: newTransportTime }));

    if (newTransportTime > 4) {
      // CASCADE 1: Knowledge Helix (L2) swaps the battery
      setTimeout(() => {
        addLog(`[L2: GraphRAG] Original LiPo-5000 insufficient for ${newTransportTime}h. Swapping to High-Density LiPo-10000.`);
        setBom(prev => prev.map(item => 
          item.category === 'Battery' 
          ? { ...item, id: 'BAT-002', mpn: 'LIPO-10000-HD', capacity: '10000mAh', mass: '1.2kg', origin: 'Japan', lead_time: '14 wks' } 
          : item
        ));

        // CASCADE 2: Generative Design (L3) updates MCAD and thermal parameters
        setTimeout(() => {
          addLog(`[L3: GenDesign] Battery mass increased (+0.8kg). Thermal output increased. Updating MCAD material to Ti-6Al-4V to manage thermal load.`);
          setMcadState({
            material: 'Titanium Alloy (Ti-6Al-4V)',
            wallThickness: '1.8mm', // Thinner but stronger/better heat dissipation
            thermalLoad: 'High (Warning)',
            systemMass: 5.4 // Exceeds the 5.0kg limit!
          });

          // CASCADE 3: Compliance Sentinel (L6) flags the new hazard
          setTimeout(() => {
            addLog(`[L6: Sentinel] ISO 14971 Violation: High Thermal Load increases risk of Thermal Runaway. Flagging hazard.`);
            setGlobalHazards([{
              id: 'HAZ-NEW-01',
              layer: 'L6',
              type: 'ISO 14971',
              title: 'Thermal Runaway Risk',
              desc: 'High-density battery combined with Ti-alloy enclosure exceeds safe surface temperature limits.'
            }]);
          }, 800);
        }, 800);
      }, 800);
    } else {
      // Revert to baseline if changed back
      addLog(`[System] Reverting to baseline state.`);
      setBom(bom.map(item => item.category === 'Battery' ? { ...item, id: 'BAT-001', mpn: 'LIPO-5000-30C', capacity: '5000mAh', mass: '0.4kg', origin: 'China', lead_time: '8 wks' } : item));
      setMcadState({ material: 'Medical ABS (White)', wallThickness: '2.5mm', thermalLoad: 'Nominal', systemMass: 4.8 });
      setGlobalHazards([]);
    }
  };

  return (
    <SimulationContext.Provider value={{
      requirements,
      bom,
      mcadState,
      globalHazards,
      globalLogs,
      triggerRippleEffect
    }}>
      {children}
    </SimulationContext.Provider>
  );
};

// ============================================================================
// 2. MAIN APPLICATION ROUTER
// ============================================================================

function AppContent() {
  // State 0 = Dashboard, 1-7 = Layers
  const [activeView, setActiveView] = useState(0);
  const { globalHazards } = useContext(SimulationContext);

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
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden font-sans">

      {/* Global Navigation Bar (Only shows when inside a layer) */}
      {activeView !== 0 && (
        <div className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center px-6 justify-between shrink-0 z-50">
          <button
            onClick={() => setActiveView(0)}
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4" /> Omni-Dashboard
          </button>

          <div className="flex items-center gap-6">
            {/* Global Hazard Alert (Shows up instantly during the Ripple Effect) */}
            {globalHazards.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 border border-rose-500/50 rounded-lg text-rose-400 text-xs font-bold animate-pulse">
                <ShieldAlert className="w-4 h-4" /> {globalHazards.length} System Alert(s)
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Active Core</span>
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20">
                 <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
              </div>
            </div>
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

// Wrap the App in the Global State Provider
export default function App() {
  return (
    <SimulationProvider>
      <AppContent />
    </SimulationProvider>
  );
}
