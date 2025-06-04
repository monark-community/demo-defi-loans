
import { TrendingUp, Shield, Zap } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Decentralized 
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {" "}Lending{" "}
          </span>
          Protocol
        </h1>
        
        <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
          Lock collateral, borrow assets, and learn DeFi fundamentals in a secure educational environment. 
          Experience overcollateralization, liquidation mechanics, and risk management.
        </p>
        
        <button
          onClick={onGetStarted}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all transform hover:scale-105"
        >
          Start Lending
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
              <Shield className="text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Secure Collateral</h3>
            <p className="text-slate-400">Lock your assets with overcollateralization ratios to ensure protocol security</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="text-purple-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Competitive Rates</h3>
            <p className="text-slate-400">Enjoy dynamic interest rates that adjust based on utilization and market conditions</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-green-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Instant Liquidation</h3>
            <p className="text-slate-400">Automated liquidation system maintains protocol health and user safety</p>
          </div>
        </div>
      </div>
    </section>
  );
};
