
import { Wallet } from 'lucide-react';

interface HeaderProps {
  isWalletConnected: boolean;
  onWalletConnect: () => void;
}

export const Header = ({ isWalletConnected, onWalletConnect }: HeaderProps) => {
  return (
    <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <h1 className="text-2xl font-bold text-white">VaultLend</h1>
        </div>
        
        <button
          onClick={onWalletConnect}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
        >
          <Wallet size={20} />
          {isWalletConnected ? '0x1234...5678' : 'Connect Wallet'}
        </button>
      </div>
    </header>
  );
};
