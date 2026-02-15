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
    Scale
} from 'lucide-react';

// --- MOCK DATA: INHERITED BOM (From Layer 3) ---
const INPUT_BOM = [
    { id: 'MCU-001', mpn: 'nRF52840-QIAA', category: 'IC', risk_profile: 'Low', origin: 'Taiwan' },
    { id: 'BAT-001', mpn: 'LIPO-5000-30C', category: 'Battery', risk_profile: 'High', origin: 'China' },
    { id: 'PWR-002', mpn: 'TPS63020', category: 'Power', risk_profile: 'Medium', origin: 'USA' },
    { id: 'SEN-001', mpn: 'AD5940', category: 'Sensor', risk_profile: 'Low', origin: 'Ireland' },
    { id: 'CAP-999', mpn: 'CC0603-LEGACY', category: 'Passive', risk_profile: 'Low', origin: 'China' } // EOL Trap
];

// --- MOCK KNOWLEDGE BASE: HAZARDS (ISO 14971) ---
const HAZARD_DB = {
    'Battery': [
        { id: 'H-01', hazard: 'Thermal Runaway', severity: 5, prob: 4, mitigation: 'Battery Management System (BMS)', mitigation_id: 'REQ-PWR-005' },
        { id: 'H-02', hazard: 'Electrolyte Leakage', severity: 3, prob: 2, mitigation: 'Sealed Enclosure (IP67)', mitigation_id: 'REQ-MECH-010' }
    ],
    'HighVoltage': [
        { id: 'H-03', hazard: 'Electric Shock', severity: 5, prob: 3, mitigation: 'Galvanic Isolation > 4kV', mitigation_id: 'REQ-SAF-001' }
    ],
    'Sensor': [
        { id: 'H-04', hazard: 'Biocompatibility Failure', severity: 4, prob: 2, mitigation: 'ISO 10993 Certified Materials', mitigation_id: 'REQ-MAT-003' }
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
    let color = 'bg-green-500';
    if (score >= 10) color = 'bg-red-500';
    else if (score >= 6) color = 'bg-yellow-500';
    return { score, color };
};

// --- MAIN APPLICATION ---

export default function HelixTwinL6() {
    const [activeTab, setActiveTab] = useState('risk'); // risk, supply
    const [analyzing, setAnalyzing] = useState(false);
    const [fmeaTable, setFmeaTable] = useState([]);
    const [supplyReport, setSupplyReport] = useState([]);
    const [complianceStatus, setComplianceStatus] = useState('PENDING'); // PENDING, PASS, FAIL

    // --- LOGIC: AUTOMATED FMEA GENERATION ---
    const runRiskAnalysis = () => {
        setAnalyzing(true);
        setComplianceStatus('PENDING');

        setTimeout(() => {
            const report = [];
            let failCount = 0;

            INPUT_BOM.forEach(part => {
                const hazards = HAZARD_DB[part.category] || [];
                hazards.forEach(h => {
                    // Simulation: Check if mitigation exists (Randomized for demo, but usually checks L1/L3 links)
                    const mitigationImplemented = Math.random() > 0.3;

                    // Recalculate Probability based on mitigation
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
        }, 1500);
    };

    // --- LOGIC: SUPPLY CHAIN CHECK ---
    const runSupplyCheck = () => {
        setAnalyzing(true);
        setTimeout(() => {
            const report = INPUT_BOM.map(part => {
                const data = checkSupplyChainAPI(part.mpn);
                return { ...part, ...data };
            });
            setSupplyReport(report);
            setAnalyzing(false);

            const hasEOL = report.some(r => r.status === 'EOL');
            if (hasEOL) setComplianceStatus('FAIL');
            else if (complianceStatus !== 'FAIL') setComplianceStatus('PASS'); // Only pass if risk didn't fail
        }, 1500);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

            {/* SIDEBAR */}
            <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shadow-2xl">
                <div className="p-4 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-lg">
                        <ShieldCheck className="w-6 h-6" /> Helix-Twin
                    </div>
                    <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">Layer 6: Compliance Sentinel</div>
                </div>

                <div className="p-4 space-y-6">

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={() => { setActiveTab('risk'); runRiskAnalysis(); }}
                            className={`w-full py-3 rounded text-xs font-bold flex items-center justify-between px-4 border transition-all ${activeTab === 'risk' ? 'bg-purple-900/30 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> ISO 14971 Risk Analysis
                            </div>
                            {activeTab === 'risk' && analyzing && <RefreshCw className="w-3 h-3 animate-spin" />}
                        </button>

                        <button
                            onClick={() => { setActiveTab('supply'); runSupplyCheck(); }}
                            className={`w-full py-3 rounded text-xs font-bold flex items-center justify-between px-4 border transition-all ${activeTab === 'supply' ? 'bg-blue-900/30 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Supply Chain Sentinel
                            </div>
                            {activeTab === 'supply' && analyzing && <RefreshCw className="w-3 h-3 animate-spin" />}
                        </button>
                    </div>

                    {/* Gatekeeper Status */}
                    <div className="bg-black/40 rounded border border-slate-800 p-4 mt-8">
                        <div className="text-[10px] font-mono text-slate-500 uppercase mb-2">Design Release Gate</div>
                        <div className="flex items-center justify-center py-4">
                            {complianceStatus === 'PENDING' && <div className="text-slate-500 font-bold flex items-center gap-2"><Lock className="w-5 h-5" /> ANALYSIS REQUIRED</div>}
                            {complianceStatus === 'PASS' && <div className="text-green-400 font-bold flex items-center gap-2 text-xl animate-pulse"><CheckCircle className="w-6 h-6" /> APPROVED</div>}
                            {complianceStatus === 'FAIL' && <div className="text-red-500 font-bold flex items-center gap-2 text-xl animate-pulse"><XCircle className="w-6 h-6" /> REJECTED</div>}
                        </div>
                        <div className="text-xs text-center text-slate-500">
                            {complianceStatus === 'FAIL' ? 'Critical Non-Conformities Detected' : complianceStatus === 'PASS' ? 'Ready for Layer 7 (Dashboard)' : 'Awaiting Audit Scans'}
                        </div>
                    </div>

                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">

                {/* Header */}
                <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-8">
                    <div>
                        <h1 className="text-lg font-bold text-slate-100">
                            {activeTab === 'risk' ? 'Automated FMEA Engine (ISO 14971)' : 'Global Supply Chain Intelligence'}
                        </h1>
                        <p className="text-xs text-slate-500">
                            {activeTab === 'risk' ? 'Tracing: Hazard -> Component -> Mitigation -> Verification' : 'Source: SiliconExpert API (Simulated) | Scope: Obsolescence & Geo-Risk'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-slate-800 rounded border border-slate-700 text-xs text-slate-400 font-mono flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Export PDF
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">

                    {/* VIEW 1: RISK TABLE */}
                    {activeTab === 'risk' && (
                        <div className="w-full">
                            {fmeaTable.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-600">
                                    <Scale className="w-12 h-12 mb-4 opacity-50" />
                                    <p>Initiate Risk Analysis to generate FMEA matrix.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs font-bold text-slate-500 border-b border-slate-700">
                                            <th className="p-3">Component / ID</th>
                                            <th className="p-3">Hazard</th>
                                            <th className="p-3 text-center">Sev</th>
                                            <th className="p-3 text-center">Prob (Pre)</th>
                                            <th className="p-3">Mitigation</th>
                                            <th className="p-3 text-center">Implemented?</th>
                                            <th className="p-3 text-center">RPN (Risk Score)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {fmeaTable.map((row, i) => (
                                            <tr key={i} className="border-b border-slate-800 hover:bg-slate-900/50">
                                                <td className="p-3 font-mono text-cyan-400">{row.part}</td>
                                                <td className="p-3 text-slate-300">{row.hazard}</td>
                                                <td className="p-3 text-center text-slate-400">{row.severity}</td>
                                                <td className="p-3 text-center text-slate-400">{row.pre_prob}</td>
                                                <td className="p-3 text-slate-400 text-xs">{row.mitigation}</td>
                                                <td className="p-3 text-center">
                                                    {row.implemented ?
                                                        <span className="text-green-400 text-xs px-2 py-1 bg-green-900/20 rounded">YES</span> :
                                                        <span className="text-red-400 text-xs px-2 py-1 bg-red-900/20 rounded font-bold animate-pulse">MISSING</span>
                                                    }
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className={`inline-block px-3 py-1 rounded text-white font-bold text-xs ${row.rpn.color}`}>
                                                        {row.rpn.score}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* VIEW 2: SUPPLY CHAIN MAP */}
                    {activeTab === 'supply' && (
                        <div className="grid grid-cols-1 gap-4">
                            {supplyReport.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-600">
                                    <Truck className="w-12 h-12 mb-4 opacity-50" />
                                    <p>Scanning Global Distributors...</p>
                                </div>
                            ) : (
                                supplyReport.map((item, i) => (
                                    <div key={i} className={`p-4 rounded border flex items-center justify-between ${item.status === 'EOL' ? 'bg-red-900/10 border-red-500/50' : 'bg-slate-900 border-slate-800'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-12 rounded ${item.status === 'EOL' ? 'bg-red-500' : item.risk === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                                    {item.mpn}
                                                    {item.status === 'EOL' && <span className="text-[10px] bg-red-600 text-white px-1 rounded">OBSOLETE</span>}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    Category: {item.category} | Origin: {item.origin}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 text-right">
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase">YTEOL (Years to End)</div>
                                                <div className={`text-lg font-bold ${item.yteol < 5 ? 'text-red-400' : 'text-slate-200'}`}>{item.yteol} Yrs</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase">Geo-Risk</div>
                                                <div className="text-sm text-slate-300">{item.risk}</div>
                                            </div>
                                            {item.alt ? (
                                                <div className="text-xs bg-blue-900/30 text-blue-300 px-3 py-2 rounded border border-blue-800">
                                                    <div className="font-bold">Recommendation:</div>
                                                    <div>Swap for {item.alt}</div>
                                                </div>
                                            ) : (
                                                <div className="w-24"></div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}