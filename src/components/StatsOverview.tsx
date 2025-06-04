
export const StatsOverview = () => {
  const stats = [
    { label: 'Total Value Locked', value: '$2.4M', change: '+12.5%' },
    { label: 'Total Borrowed', value: '$1.1M', change: '+8.3%' },
    { label: 'Active Loans', value: '1,247', change: '+15.7%' },
    { label: 'Liquidations (24h)', value: '23', change: '-5.2%' }
  ];

  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-white text-center mb-12">Protocol Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
            <h3 className="text-slate-400 text-sm font-medium mb-2">{stat.label}</h3>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-white">{stat.value}</span>
              <span className={`text-sm font-medium ${
                stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
              }`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
