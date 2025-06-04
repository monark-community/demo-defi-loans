
import { useState } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { StatsOverview } from '@/components/StatsOverview';
import { LendingInterface } from '@/components/LendingInterface';
import { LoanDashboard } from '@/components/LoanDashboard';
import { TransactionHistory } from '@/components/TransactionHistory';

const Index = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'lending' | 'dashboard' | 'history'>('lending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Header 
        isWalletConnected={isWalletConnected}
        onWalletConnect={() => setIsWalletConnected(true)}
      />
      
      {!isWalletConnected ? (
        <>
          <HeroSection onGetStarted={() => setIsWalletConnected(true)} />
          <StatsOverview />
        </>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('lending')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'lending'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Lending
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              History
            </button>
          </div>

          {activeTab === 'lending' && <LendingInterface />}
          {activeTab === 'dashboard' && <LoanDashboard />}
          {activeTab === 'history' && <TransactionHistory />}
        </div>
      )}
    </div>
  );
};

export default Index;
