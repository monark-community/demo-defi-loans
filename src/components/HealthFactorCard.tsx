
import { AlertTriangle, Shield, TrendingDown } from 'lucide-react';

interface HealthFactorCardProps {
  healthFactor: number;
}

export const HealthFactorCard = ({ healthFactor }: HealthFactorCardProps) => {
  const getHealthStatus = (factor: number) => {
    if (factor >= 2) return { status: 'Safe', color: 'green', icon: Shield };
    if (factor >= 1.2) return { status: 'Caution', color: 'yellow', icon: AlertTriangle };
    return { status: 'Danger', color: 'red', icon: TrendingDown };
  };

  const { status, color, icon: Icon } = getHealthStatus(healthFactor);
  
  const getColorClasses = (colorName: string) => {
    switch (colorName) {
      case 'green':
        return { bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-600/30' };
      case 'yellow':
        return { bg: 'bg-yellow-600/20', text: 'text-yellow-400', border: 'border-yellow-600/30' };
      case 'red':
        return { bg: 'bg-red-600/20', text: 'text-red-400', border: 'border-red-600/30' };
      default:
        return { bg: 'bg-slate-600/20', text: 'text-slate-400', border: 'border-slate-600/30' };
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <div className={`bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border ${colorClasses.border}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 ${colorClasses.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={colorClasses.text} size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Health Factor</h3>
          <span className={`text-sm font-medium ${colorClasses.text}`}>{status}</span>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold text-white">{healthFactor.toFixed(2)}</div>
        <div className="text-sm text-slate-400 mt-1">
          {healthFactor < 1 ? 'Liquidation risk' : 'Position healthy'}
        </div>
      </div>
      
      <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            healthFactor >= 2 ? 'bg-green-500' :
            healthFactor >= 1.2 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(100, (healthFactor / 3) * 100)}%` }}
        />
      </div>
      
      <div className="text-xs text-slate-400">
        A health factor below 1.0 may trigger liquidation
      </div>
    </div>
  );
};
