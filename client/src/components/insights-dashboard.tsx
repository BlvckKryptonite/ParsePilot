import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface InsightsDashboardProps {
  processedData: {
    stats: {
      totalRows: number;
      totalColumns: number;
      missingDataPercentage: number;
      columnTypes: {
        text: number;
        numeric: number;
        json: number;
      };
    };
    distributions?: Record<string, { values: string[]; counts: number[] }>;
  };
}

export default function InsightsDashboard({ processedData }: InsightsDashboardProps) {
  const { stats, distributions } = processedData;

  const columnTypeData = [
    { name: 'Text', value: stats.columnTypes.text, color: '#64748B' },
    { name: 'JSON', value: stats.columnTypes.json, color: '#F59E0B' },
    { name: 'Numeric', value: stats.columnTypes.numeric, color: '#059669' },
  ].filter(item => item.value > 0);

  // Get status distribution if available
  const statusDistribution = distributions && Object.keys(distributions).find(key => 
    key.toLowerCase().includes('status')
  );

  const statusData = statusDistribution 
    ? distributions[statusDistribution].values.map((value, index) => ({
        name: value,
        value: distributions[statusDistribution].counts[index],
        percentage: Math.round((distributions[statusDistribution].counts[index] / stats.totalRows) * 100)
      }))
    : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Quick Insights</h2>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Row Count */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">
            {stats.totalRows.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Total Rows</div>
        </div>
        
        {/* Missing Data */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Missing Data</span>
            <span className="text-sm text-gray-500">{stats.missingDataPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-warning h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(stats.missingDataPercentage, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Column Types Chart */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Column Types</h4>
          <div className="h-32 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={columnTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                >
                  {columnTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-sm">
            {columnTypeData.map((type) => (
              <div key={type.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-gray-600">{type.name}</span>
                </div>
                <span className="font-medium">{type.value} columns</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Status Distribution */}
        {statusData.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Status Distribution</h4>
            <div className="space-y-2">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      item.name.toLowerCase() === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">
                    {item.value.toLocaleString()} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Values for Text Columns */}
        {distributions && Object.keys(distributions).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Top Values</h4>
            <div className="space-y-3">
              {Object.entries(distributions).slice(0, 2).map(([column, data]) => (
                <div key={column}>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">{column}</h5>
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.values.slice(0, 5).map((value, index) => ({
                        name: value.length > 10 ? value.substring(0, 10) + '...' : value,
                        value: data.counts[index]
                      }))}>
                        <XAxis dataKey="name" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#2563EB" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
