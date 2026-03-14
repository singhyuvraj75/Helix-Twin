import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Globe,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw,
  Truck,
  Lock,
  Search,
  Scale,
  Menu,
  Activity,
  AlertOctagon,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Clock,
  Cpu,
  Layers
} from 'lucide-react';

// --- MOCK DATA: INHERITED BOM (From Layer 3) ---
const INPUT_BOM = [
  { id: 'MCU-001', mpn: 'nRF52840-QIAA', category: 'IC', origin: 'Taiwan', lead_time: '12 wks', rohs: true },
  { id: 'BAT-001', mpn: 'LIPO-5000-30C', category: 'Battery', origin: 'China', lead_time: '8 wks', rohs: true },
  { id: 'PWR-002', mpn: 'TPS63020', category: 'Power', origin: 'USA', lead_time: '16 wks', rohs: true },
  { id: 'SEN-001', mpn: 'AD5940', category: 'Sensor', origin: 'Ireland', lead_time: '4 wks', rohs: true },
  { id: 'CAP-999', mpn: 'CC0603-LEGACY', category: 'Passive', origin: 'China', lead_time: '52 wks', rohs: false } // EOL Trap
];

// --- MOCK KNOWLEDGE BASE: HAZARDS (ISO 14971) ---
const HAZARD_DB = {
  'Battery': [
    { id: 'H-01', hazard: 'Thermal Runaway', severity: 5, prob: 4, mitigation: 'BMS + Thermal Cutoff', mitigation_id: 'REQ-PWR-005' },
    { id: 'H-02', hazard: 'Electrolyte Leakage', severity: 3, prob: 2, mitigation: 'Sealed Enclosure (IP54)', mitigation_id: 'REQ-MECH-010' }
  ],
  'Power': [
    { id: 'H-03', hazard: 'Overvoltage to Patient', severity: 5, prob: 3, mitigation: 'Galvanic Isolation > 4kV', mitigation_id: 'REQ-SAF-001' }
  ],
  'Sensor': [
    { id: 'H-04', hazard: 'False Readings (Hypoxia)', severity: 4, prob: 3, mitigation: 'Dual-Redundant Polling', mitigation_id: 'REQ-SFT-003' }
  ]
};

// --- MOCK API: SILICON EXPERT (Supply Chain) ---
const checkSupplyChainAPI = (mpn) => {
  if (mpn.includes('LEGACY')) return { status: 'EOL', yteol: 0, risk: 'Critical', alt: 'CC0603-NEXTGEN' };
  if (mpn.includes('nRF')) return { status: 'Active', yteol: 8, risk: 'Low', alt: null };
  if (mpn.includes('LIPO')) return { status: 'Active', yteol: 3, risk: 'Medium', alt: 'LIPO-5000-GEN2' }; // Geopolitical risk
  return { status: 'Active', yteol: 10, risk: 'Low', alt: null };
};

// --- HELPER: RPN CALCULATOR ---
const calculateRPN = (sev, prob) => {
  const score = sev * prob;
  let color = 'bg-emerald-500 border-emerald-600';
  if (score >= 12) color = 'bg-rose-500 border-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.4)]';
  else if (score >= 8) color = 'bg-amber-500 border-amber-600';
  return { score, color };
};

// --- HIGH-END SVG RISK MATRIX CHART ---
const RiskMatrixChart = ({ data }) => {
  const width = 800;
  const height = 300;
  // Increased right margin slightly for better breathing room
  const margin = { top: 40, right: 60, bottom: 50, left: 60 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // Scales
  const xScale = (val) => margin.left + (val / 10) * plotW; // YTEOL: 0 to 10
  const yScale = (val) => margin.top + plotH - ((val - 1) / 4) * plotH; // Severity: 1 to 5

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden flex flex-col h-[380px]">
      <div className="flex justify-between items-start mb-2 z-10 relative">
         <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Risk Landscape Matrix</h4>
            <p className="text-xs text-slate-500 font-medium">Supply Chain Obsolescence vs. Clinical Hazard Severity</p>
         </div>
         <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Safe</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Monitor</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Critical</span>
         </div>
      </div>

      <div className="flex-1 relative w-full h-full">
         <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
            
            {/* Background Quadrants */}
            {/* Safe Zone (High YTEOL, Low Sev) */}
            <rect x={xScale(4)} y={yScale(3)} width={xScale(10)-xScale(4)} height={yScale(1)-yScale(3)} fill="#f0fdf4" rx="4" />
            {/* Monitor Zone (Low YTEOL OR High Sev) */}
            <rect x={xScale(0)} y={yScale(3)} width={xScale(4)-xScale(0)} height={yScale(1)-yScale(3)} fill="#fffbeb" rx="4" />
            <rect x={xScale(4)} y={yScale(5)} width={xScale(10)-xScale(4)} height={yScale(3)-yScale(5)} fill="#fffbeb" rx="4" />
            {/* Critical Zone (Low YTEOL AND High Sev) */}
            <rect x={xScale(0)} y={yScale(5)} width={xScale(4)-xScale(0)} height={yScale(3)-yScale(5)} fill="#fef2f2" rx="4" />

            {/* Grid & Axes */}
            <line x1={margin.left} y1={yScale(3)} x2={width-margin.right} y2={yScale(3)} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4" />
            <line x1={xScale(4)} y1={margin.top} x2={xScale(4)} y2={height-margin.bottom} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4" />
            
            <line x1={margin.left} y1={height-margin.bottom} x2={width-margin.right} y2={height-margin.bottom} stroke="#64748b" strokeWidth="2" />
            <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height-margin.bottom} stroke="#64748b" strokeWidth="2" />

            {/* Labels */}
            <text x={xScale(5)} y={height - 10} fontSize="12" fontWeight="bold" fill="#475569" textAnchor="middle" letterSpacing="1">YEARS TO END-OF-LIFE (YTEOL)</text>
            <text x={margin.left - 40} y={yScale(3)} fontSize="12" fontWeight="bold" fill="#475569" textAnchor="middle" letterSpacing="1" transform={`rotate(-90, ${margin.left - 40}, ${yScale(3)})`}>HAZARD SEVERITY (1-5)</text>

            <text x={xScale(0)} y={height - 35} fontSize="10" fill="#94a3b8" fontWeight="bold" textAnchor="middle">0 Yr</text>
            <text x={xScale(4)} y={height - 35} fontSize="10" fill="#f59e0b" fontWeight="bold" textAnchor="middle">4 Yrs</text>
            <text x={xScale(10)} y={height - 35} fontSize="10" fill="#94a3b8" fontWeight="bold" textAnchor="middle">10 Yrs</text>

            <text x={margin.left - 15} y={yScale(1)+4} fontSize="10" fill="#94a3b8" fontWeight="bold" textAnchor="end">1</text>
            <text x={margin.left - 15} y={yScale(3)+4} fontSize="10" fill="#f59e0b" fontWeight="bold" textAnchor="end">3</text>
            <text x={margin.left - 15} y={yScale(5)+4} fontSize="10" fill="#ef4444" fontWeight="bold" textAnchor="end">5</text>

            {/* Data Scatter Points */}
            {data.map((item, i) => {
               const cx = xScale(item.yteol);
               const cy = yScale(item.hazard_sev);
               const isCritical = item.yteol < 4 || item.hazard_sev >= 4;
               const isDanger = item.yteol < 2 || item.hazard_sev === 5;
               
               const color = isDanger ? '#ef4444' : isCritical ? '#f59e0b' : '#10b981';
               
               // Smart tooltip positioning: flip to the left if too close to the right edge
               const flipTooltip = cx > width - 150;
               const tooltipXOffset = flipTooltip ? -122 : 12;
               
               return (
                 <g key={i} className="transition-all hover:opacity-80 cursor-pointer group">
                    {isDanger && <circle cx={cx} cy={cy} r="14" fill={color} opacity="0.2" className="animate-ping" />}
                    <circle cx={cx} cy={cy} r="8" fill={color} stroke="white" strokeWidth="2" className="shadow-lg" />
                    
                    {/* Tooltip Tag */}
                    <g transform={`translate(${cx + tooltipXOffset}, ${cy - 12})`} className="opacity-100 transition-opacity">
                       <rect x="0" y="-14" width="110" height="20" fill="white" rx="4" stroke="#e2e8f0" />
                       <text x="55" y="-1" fontSize="9" fontWeight="bold" fill="#334155" textAnchor="middle">{item.mpn}</text>
                    </g>
                 </g>
               );
            })}
         </svg>
      </div>
    </div>
  );
};

// --- MAIN APPLICATION ---

export default function HelixTwinL6() {
  const [activeTab, setActiveTab] = useState('risk'); 
  const [analyzing, setAnalyzing] = useState(false);
  const [fmeaTable, setFmeaTable] = useState([]);
  const [supplyReport, setSupplyReport] = useState([]);
  const [complianceStatus, setComplianceStatus] = useState('PENDING');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- LOGIC: AUTOMATED FMEA GENERATION ---
  const runRiskAnalysis = () => {
    setAnalyzing(true);
    setComplianceStatus('PENDING');
    
    setTimeout(() => {
      const report = [];
      let failCount = 0;

      INPUT_BOM.forEach(part => {
        const hazards = HAZARD_DB[part.category] || [];
        if(hazards.length === 0) {
             report.push({
                part: part.mpn, hazard: 'General Reliability', severity: 2, pre_prob: 2, mitigation: 'Standard QA Testing', implemented: true, post_prob: 1, rpn: calculateRPN(2, 1)
             });
        }
        hazards.forEach(h => {
          const mitigationImplemented = Math.random() > 0.15; // 85% chance of passing
          const finalProb = mitigationImplemented ? Math.max(1, h.prob - 2) : h.prob;
          
          report.push({
            part: part.mpn,
            hazard: h.hazard,
            severity: h.severity,
            pre_prob: h.prob,
            mitigation: h.mitigation,
            implemented: mitigationImplemented,
            post_prob: finalProb,
            rpn: calculateRPN(h.severity, finalProb)
          });

          if (!mitigationImplemented && (h.severity * finalProb) >= 10) failCount++;
        });
      });

      setFmeaTable(report);
      setAnalyzing(false);
      if (failCount > 0) setComplianceStatus('FAIL');
    }, 1200);
  };

  // --- LOGIC: SUPPLY CHAIN CHECK ---
  const runSupplyCheck = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const report = INPUT_BOM.map(part => {
        const data = checkSupplyChainAPI(part.mpn);
        const hazard_sev = HAZARD_DB[part.category]?.[0]?.severity || 2; 
        return { ...part, ...data, hazard_sev };
      });
      setSupplyReport(report);
      setAnalyzing(false);
      
      const hasEOL = report.some(r => r.status === 'EOL');
      if (hasEOL) setComplianceStatus('FAIL');
      else if (complianceStatus !== 'FAIL') setComplianceStatus('PASS'); 
    }, 1200);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px;}
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* SIDEBAR */}
      <div className={`${isSidebarOpen ? 'w-72' : 'w-16'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-30 shadow-2xl shrink-0`}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
               <ShieldCheck className="text-white w-6 h-6" />
             </div>
             {isSidebarOpen && (
                <div>
                   <span className="font-black text-xl tracking-tight text-slate-800">Helix<span className="text-rose-600">Twin</span></span>
                   <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Layer 6: Compliance</div>
                </div>
             )}
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
             <Menu className="w-5 h-5 mx-auto" />
          </button>
        </div>

        <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
           
           {isSidebarOpen && (
             <>
               {/* Analysis Triggers */}
               <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <Activity className="w-3 h-3" /> Audit Execution
                  </h3>
                  <div className="space-y-3">
                     <button 
                       onClick={() => { setActiveTab('risk'); runRiskAnalysis(); }}
                       className="w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 px-4 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all shadow-sm"
                     >
                        <AlertTriangle className="w-4 h-4" /> Run ISO 14971 FMEA
                     </button>

                     <button 
                       onClick={() => { setActiveTab('supply'); runSupplyCheck(); }}
                       className="w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 px-4 border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all shadow-sm"
                     >
                        <Globe className="w-4 h-4" /> Run Supply Chain Scan
                     </button>
                  </div>
               </div>

               {/* Gatekeeper Status */}
               <div className="mt-auto bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500"></div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Design Release Gate</div>
                  
                  <div className="flex items-center justify-center py-2">
                     {complianceStatus === 'PENDING' && (
                        <div className="text-slate-300 font-bold flex flex-col items-center gap-3">
                           <Lock className="w-8 h-8 text-slate-500" />
                           <span className="tracking-widest uppercase text-xs">Analysis Required</span>
                        </div>
                     )}
                     {complianceStatus === 'PASS' && (
                        <div className="text-emerald-400 font-black flex flex-col items-center gap-3 animate-fade-in">
                           <div className="relative">
                              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                              <CheckCircle className="w-10 h-10 relative z-10" />
                           </div>
                           <span className="tracking-widest uppercase text-sm">Approved</span>
                        </div>
                     )}
                     {complianceStatus === 'FAIL' && (
                        <div className="text-rose-500 font-black flex flex-col items-center gap-3 animate-fade-in">
                           <div className="relative">
                              <div className="absolute inset-0 bg-rose-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                              <XCircle className="w-10 h-10 relative z-10" />
                           </div>
                           <span className="tracking-widest uppercase text-sm">Blocked</span>
                        </div>
                     )}
                  </div>
               </div>
             </>
           )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col bg-slate-50 relative min-w-0">
         
         {/* Top Slider Navigation & Header */}
         <div className="h-20 border-b border-slate-200 bg-white/90 backdrop-blur-md flex items-center justify-between px-8 z-20 sticky top-0 shadow-sm shrink-0">
            
            {/* The "Slider" Tab Switcher */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 relative">
               {/* Animated Background Pill */}
               <div 
                  className="absolute inset-y-1.5 bg-white rounded-lg shadow-md border border-slate-200/50 transition-all duration-300 ease-out"
                  style={{
                     width: 'calc(50% - 6px)',
                     left: activeTab === 'risk' ? '6px' : 'calc(50%)'
                  }}
               ></div>

               <button 
                  onClick={() => setActiveTab('risk')}
                  className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors w-48 justify-center
                     ${activeTab === 'risk' ? 'text-rose-600' : 'text-slate-500 hover:text-slate-800'}`}
               >
                  <AlertOctagon className="w-4 h-4" /> Risk Analysis
               </button>
               <button 
                  onClick={() => setActiveTab('supply')}
                  className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors w-48 justify-center
                     ${activeTab === 'supply' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'}`}
               >
                  <Globe className="w-4 h-4" /> Supply Chain
               </button>
            </div>

            <div className="flex gap-3">
               {analyzing && <span className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg animate-pulse"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Scanning...</span>}
               <button className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg transform hover:-translate-y-0.5">
                  <FileText className="w-4 h-4" /> Export Report
               </button>
            </div>
         </div>

         {/* Scrollable Content Area */}
         <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px]">
            <div className="max-w-6xl mx-auto">
               
               {/* VIEW 1: RISK TABLE */}
               {activeTab === 'risk' && (
                 <div className="w-full space-y-4 animate-fade-in">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">ISO 14971: Automated FMEA Matrix</h2>
                    
                    {fmeaTable.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 border-2 border-dashed border-slate-300 rounded-3xl bg-white/50 shadow-sm">
                          <Scale className="w-16 h-16 mb-4 opacity-40 text-rose-500" />
                          <p className="font-bold text-sm">Awaiting execution. Click "Run ISO 14971 FMEA" to generate matrix.</p>
                       </div>
                    ) : (
                       <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                           <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                              <table className="w-full text-left border-collapse">
                                 <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                       <th className="p-4 pl-6">Component ID</th>
                                       <th className="p-4">Identified Hazard</th>
                                       <th className="p-4 text-center">Severity</th>
                                       <th className="p-4 text-center">Probability</th>
                                       <th className="p-4">Required Mitigation</th>
                                       <th className="p-4 text-center">Status</th>
                                       <th className="p-4 text-center pr-6">RPN</th>
                                    </tr>
                                 </thead>
                                 <tbody className="text-sm divide-y divide-slate-100">
                                    {fmeaTable.map((row, i) => (
                                       <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                          <td className="p-4 pl-6 font-mono text-xs font-bold text-slate-700">{row.part}</td>
                                          <td className="p-4 text-slate-800 font-semibold">{row.hazard}</td>
                                          <td className="p-4 text-center font-mono text-slate-500">{row.severity}/5</td>
                                          <td className="p-4 text-center font-mono text-slate-500">{row.pre_prob}/5</td>
                                          <td className="p-4 text-slate-500 text-xs font-medium">{row.mitigation}</td>
                                          <td className="p-4 text-center">
                                             {row.implemented ? 
                                                <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md">Verified</span> : 
                                                <span className="text-rose-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-md flex items-center justify-center gap-1"><ShieldAlert className="w-3 h-3"/> Missing</span>
                                             }
                                          </td>
                                          <td className="p-4 text-center pr-6">
                                             <div className={`inline-flex items-center justify-center w-10 h-8 rounded-lg border-2 text-white font-black text-sm shadow-sm ${row.rpn.color} ${!row.implemented && row.rpn.score >= 10 ? 'animate-pulse' : ''}`}>
                                                {row.rpn.score}
                                             </div>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                       </div>
                    )}
                 </div>
               )}

               {/* VIEW 2: SUPPLY CHAIN MAP */}
               {activeTab === 'supply' && (
                  <div className="space-y-6 animate-fade-in">
                     <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">Global Component Intelligence</h2>
                     
                     {supplyReport.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 border-2 border-dashed border-slate-300 rounded-3xl bg-white/50 shadow-sm">
                           <Truck className="w-16 h-16 mb-4 opacity-40 text-amber-500" />
                           <p className="font-bold text-sm">Awaiting execution. Click "Run Supply Chain Scan" to fetch API data.</p>
                        </div>
                     ) : (
                        <>
                           {/* High End Chart */}
                           <RiskMatrixChart data={supplyReport} />
                           
                           {/* Card Grid */}
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
                              {supplyReport.map((item, i) => (
                                 <div key={i} className={`p-5 rounded-2xl border-2 flex flex-col justify-between shadow-sm transition-all hover:shadow-lg bg-white relative overflow-hidden
                                    ${item.status === 'EOL' ? 'border-rose-200' : 'border-slate-200'}`}>
                                    
                                    {/* Top decorative line for EOL */}
                                    {item.status === 'EOL' && <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500"></div>}

                                    <div className="flex justify-between items-start mb-4">
                                       <div>
                                          <div className="text-lg font-black text-slate-800 flex items-center gap-2 mb-1">
                                             <Cpu className="w-5 h-5 text-slate-400" /> {item.mpn}
                                          </div>
                                          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                             <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5"/> {item.category}</span>
                                             <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {item.origin}</span>
                                          </div>
                                       </div>
                                       {item.status === 'EOL' ? (
                                          <span className="text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md shadow-sm uppercase tracking-widest animate-pulse">Obsolescence Alert</span>
                                       ) : (
                                          <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-md uppercase tracking-widest">Active</span>
                                       )}
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                                       <div>
                                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> YTEOL</div>
                                          <div className={`text-xl font-black ${item.yteol < 5 ? 'text-rose-600' : 'text-slate-800'}`}>{item.yteol} <span className="text-sm font-bold text-slate-400">Yrs</span></div>
                                       </div>
                                       <div>
                                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lead Time</div>
                                          <div className="text-sm font-bold text-slate-700 mt-1.5">{item.lead_time}</div>
                                       </div>
                                       <div>
                                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">RoHS Comp.</div>
                                          <div className={`text-sm font-bold mt-1.5 flex items-center gap-1 ${item.rohs ? 'text-emerald-600' : 'text-rose-600'}`}>
                                             {item.rohs ? <CheckCircle className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>} 
                                             {item.rohs ? 'YES' : 'NO'}
                                          </div>
                                       </div>
                                    </div>

                                    {item.alt && (
                                       <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                                          <div className="text-xs text-amber-800">
                                             <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">Drop-in Replacement</span>
                                             Swap for <span className="font-mono font-bold">{item.alt}</span>
                                          </div>
                                          <button className="px-3 py-1.5 bg-white border border-amber-300 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm hover:bg-amber-100 transition-colors">
                                             Execute ECO
                                          </button>
                                       </div>
                                    )}
                                 </div>
                              ))}
                           </div>
                        </>
                     )}
                  </div>
               )}

            </div>
         </div>
      </div>
    </div>
  );
}
}
