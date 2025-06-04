
import { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, DollarSign, Shield } from 'lucide-react';

export const TransactionHistory = () => {
  const [transactions] = useState([
    {
      id: '1',
      type: 'supply',
      asset: 'ETH',
      amount: 2.5,
      value: 5850,
      timestamp: '2024-06-04T10:30:00Z',
      txHash: '0x1234...5678',
      status: 'confirmed'
    },
    {
      id: '2',
      type: 'borrow',
      asset: 'USDC',
      amount: 4000,
      value: 4000,
      timestamp: '2024-06-04T10:32:00Z',
      txHash: '0x2345...6789',
      status: 'confirmed'
    },
    {
      id: '3',
      type: 'repay',
      asset: 'USDC',
      amount: 1000,
      value: 1000,
      timestamp: '2024-06-03T15:45:00Z',
      txHash: '0x3456...7890',
      status: 'confirmed'
    },
    {
      id: '4',
      type: 'liquidation',
      asset: 'BTC',
      amount: 0.1,
      value: 4325,
      timestamp: '2024-06-02T09:15:00Z',
      txHash: '0x4567...8901',
      status: 'confirmed'
    }
  ]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'supply':
        return <ArrowUpRight className="text-green-400" size={20} />;
      case 'borrow':
        return <ArrowDownLeft className="text-blue-400" size={20} />;
      case 'repay':
        return <DollarSign className="text-purple-400" size={20} />;
      case 'liquidation':
        return <Shield className="text-red-400" size={20} />;
      default:
        return <DollarSign className="text-slate-400" size={20} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'supply':
        return 'bg-green-600/20 border-green-600/30';
      case 'borrow':
        return 'bg-blue-600/20 border-blue-600/30';
      case 'repay':
        return 'bg-purple-600/20 border-purple-600/30';
      case 'liquidation':
        return 'bg-red-600/20 border-red-600/30';
      default:
        return 'bg-slate-600/20 border-slate-600/30';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
      
      <div className="space-y-4">
        {transactions.map((tx) => (
          <div key={tx.id} className={`border rounded-lg p-4 ${getTransactionColor(tx.type)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                  {getTransactionIcon(tx.type)}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium capitalize">{tx.type}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">
                      {tx.amount} {tx.asset}
                    </span>
                  </div>
                  <div className="text-slate-400 text-sm">
                    {formatDate(tx.timestamp)}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-white font-medium">
                  ${tx.value.toLocaleString()}
                </div>
                <div className="text-slate-400 text-sm">
                  {tx.txHash}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition-all">
        Load More Transactions
      </button>
    </div>
  );
};
