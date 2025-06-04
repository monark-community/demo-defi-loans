
import { useState } from 'react';
import { TrendingUp, DollarSign, Clock, AlertCircle } from 'lucide-react';

export const LoanDashboard = () => {
  const [activeLoans] = useState([
    {
      id: '1',
      collateral: { asset: 'ETH', amount: 5.2, value: 12180 },
      borrowed: { asset: 'USDC', amount: 8500, rate: 5.2 },
      healthFactor: 1.43,
      liquidationPrice: 2100,
      nextPayment: '2024-06-15'
    },
    {
      id: '2',
      collateral: { asset: 'BTC', amount: 0.25, value: 10812 },
      borrowed: { asset: 'DAI', amount: 6500, rate: 4.8 },
      healthFactor: 1.66,
      liquidationPrice: 38500,
      nextPayment: '2024-06-18'
    }
  ]);

  const totalCollateralValue = activeLoans.reduce((sum, loan) => sum + loan.collateral.value, 0);
  const totalBorrowed = activeLoans.reduce((sum, loan) => sum + loan.borrowed.amount, 0);
  const averageHealthFactor = activeLoans.reduce((sum, loan) => sum + loan.healthFactor, 0) / activeLoans.length;

  return (
    <div className="space-y-8">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <DollarSign className="text-blue-400" size={20} />
            </div>
            <span className="text-slate-400 text-sm">Total Collateral</span>
          </div>
          <div className="text-2xl font-bold text-white">${totalCollateralValue.toLocaleString()}</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-400" size={20} />
            </div>
            <span className="text-slate-400 text-sm">Total Borrowed</span>
          </div>
          <div className="text-2xl font-bold text-white">${totalBorrowed.toLocaleString()}</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-green-400" size={20} />
            </div>
            <span className="text-slate-400 text-sm">Avg Health Factor</span>
          </div>
          <div className="text-2xl font-bold text-white">{averageHealthFactor.toFixed(2)}</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-400" size={20} />
            </div>
            <span className="text-slate-400 text-sm">Active Loans</span>
          </div>
          <div className="text-2xl font-bold text-white">{activeLoans.length}</div>
        </div>
      </div>

      {/* Active Loans */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">Active Loans</h2>
        
        <div className="space-y-4">
          {activeLoans.map((loan) => (
            <div key={loan.id} className="bg-slate-900/50 rounded-lg p-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div>
                  <h4 className="text-slate-400 text-sm mb-1">Collateral</h4>
                  <div className="text-white font-medium">
                    {loan.collateral.amount} {loan.collateral.asset}
                  </div>
                  <div className="text-slate-400 text-sm">
                    ${loan.collateral.value.toLocaleString()}
                  </div>
                </div>

                <div>
                  <h4 className="text-slate-400 text-sm mb-1">Borrowed</h4>
                  <div className="text-white font-medium">
                    ${loan.borrowed.amount.toLocaleString()} {loan.borrowed.asset}
                  </div>
                  <div className="text-slate-400 text-sm">
                    {loan.borrowed.rate}% APR
                  </div>
                </div>

                <div>
                  <h4 className="text-slate-400 text-sm mb-1">Health Factor</h4>
                  <div className={`font-medium ${
                    loan.healthFactor >= 2 ? 'text-green-400' :
                    loan.healthFactor >= 1.2 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {loan.healthFactor.toFixed(2)}
                  </div>
                </div>

                <div>
                  <h4 className="text-slate-400 text-sm mb-1">Liquidation Price</h4>
                  <div className="text-white font-medium">
                    ${loan.liquidationPrice.toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-all">
                    Repay
                  </button>
                  <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-all">
                    Add Collateral
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
