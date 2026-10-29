import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import AiChatWidget from './components/AiChatWidget';

// Existing Pages (v1.0 preserved)
import Log from './pages/Log';
import Dashboard from './pages/Dashboard';
import WhatIf from './pages/WhatIf';
import Progress from './pages/Progress';
import Actions from './pages/Actions';
import Challenges from './pages/Challenges';
import Leaderboard from './pages/Leaderboard';

// CarbonKatha 2.0 Extended Pages
import Evidence from './pages/Evidence';
import Family from './pages/Family';
import Organization from './pages/Organization';
import Rewards from './pages/Rewards';
import GpsTracker from './pages/GpsTracker';
import Login from './pages/Login';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-beach-100 text-coastal-900 selection:bg-seafoam-200">
        
        {/* Top Navbar */}
        <Navbar />

        {/* Main Content Area Protected by ErrorBoundary */}
        <main className="flex-1 pb-20">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login defaultMode="login" />} />
              <Route path="/register" element={<Login defaultMode="register" />} />
              <Route path="/log" element={<Log />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/evidence" element={<Evidence />} />
              <Route path="/family" element={<Family />} />
              <Route path="/organization" element={<Organization />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/gps" element={<GpsTracker />} />
              <Route path="/whatif" element={<WhatIf />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/actions" element={<Actions />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>

        {/* Global Floating Multilingual AI Assistant */}
        <AiChatWidget />

        {/* Calming Green-Beach Footer */}
        <footer className="border-t border-beach-300 bg-beach-100/90 py-6 text-center text-xs text-coastal-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-coastal-800">CarbonKatha 2.0</span>
              <span>• Verified Proof-of-Carbon & Rewards Platform for India</span>
            </div>
            <div className="flex items-center gap-4 text-coastal-600">
              <span>English • हिन्दी • தமிழ் • తెలుగు</span>
              <span>CEA v19 Standard • SHA-256 Checksum Proof</span>
            </div>
          </div>
        </footer>

      </div>
    </BrowserRouter>
  );
}

export default App;
