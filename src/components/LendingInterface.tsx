
import { useState } from 'react';
import { Lock, ArrowDown } from 'lucide-react';
import { HealthFactorCard } from './HealthFactorCard';

export const LendingInterface = () => {
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [selectedCollateral, setSelectedCollateral] = useState('ETH');
  const [selectedBorrow, setSelectedBorrow] = useState('USDC');

  const collateralTypes = [
    { symbol: 'ETH', name: 'Ethereum', price: 2340, ltv: 80 },
    { symbol: 'BTC', name: 'Bitcoin', price: 43250, ltv: 75 },
    { symbol: 'LINK', name: 'Chainlink', price: 14.5, ltv: 70 }
  ];

  const borrowableAssets = [
    { symbol: 'USDC', name: 'USD Coin', price: 1.00, rate: 5.2 },
    { symbol: 'DAI', name: 'Dai Stablecoin', price: 1.00, rate: 4.8 },
    { symbol: 'USDT', name: 'Tether', price: 1.00, rate: 5.5 }
  ];

  const calculateMaxBorrow = () => {
    const collateral = collateralTypes.find(c => c.symbol === selectedCollateral);
    if (!collateral || !collateralAmount) return 0;
    
    const collateralValue = parseFloat(collateralAmount) * collateral.price;
    return (collateralValue * collateral.ltv) / 100;
  };

  const calculateHealthFactor = () => {
    const maxBorrow = calculateMaxBorrow();
    const currentBorrow = parseFloat(borrowAmount) || 0;
    
    if (currentBorrow === 0) return 5;
    return maxBorrow / currentBorrow;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Supply & Borrow</h2>
          
          {/* Collateral Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lock size={20} />
              Collateral
            </h3>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-slate-300">Asset</label>
                <select
                  value={selectedCollateral}
                  onChange={(e) => setSelectedCollateral(e.target.value)}
                  className="bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                >
                  {collateralTypes.map(asset => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.symbol} - ${asset.price}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-between items-center mb-3">
                <label className="text-slate-300">Amount</label>
                <span className="text-slate-400 text-sm">Balance: 10.5 {selectedCollateral}</span>
              </div>
              
              <input
                type="number"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 text-xl"
              />
              
              <div className="mt-3 text-sm text-slate-400">
                LTV: {collateralTypes.find(c => c.symbol === selectedCollateral)?.ltv}%
              </div>
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <ArrowDown className="text-slate-400" size={20} />
            </div>
          </div>

          {/* Borrow Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Borrow</h3>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-slate-300">Asset</label>
                <select
                  value={selectedBorrow}
                  onChange={(e) => setSelectedBorrow(e.target.value)}
                  className="bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                >
                  {borrowableAssets.map(asset => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.symbol} - {asset.rate}% APR
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-between items-center mb-3">
                <label className="text-slate-300">Amount</label>
                <span className="text-slate-400 text-sm">
                  Max: ${calculateMaxBorrow().toLocaleString()}
                </span>
              </div>
              
              <input
                type="number"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                placeholder="0.0"
                max={calculateMaxBorrow()}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 text-xl"
              />
              
              <div className="mt-3 text-sm text-slate-400">
                APR: {borrowableAssets.find(a => a.symbol === selectedBorrow)?.rate}%
              </div>
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-lg font-medium transition-all">
            Supply & Borrow
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <HealthFactorCard healthFactor={calculateHealthFactor()} />
        
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Transaction Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Collateral Value</span>
              <span className="text-white">
                ${(parseFloat(collateralAmount || '0') * (collateralTypes.find(c => c.symbol === selectedCollateral)?.price || 0)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Borrow Amount</span>
              <span className="text-white">${parseFloat(borrowAmount || '0').toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Utilization</span>
              <span className="text-white">
                {calculateMaxBorrow() > 0 ? ((parseFloat(borrowAmount || '0') / calculateMaxBorrow()) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
