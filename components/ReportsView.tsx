
import React, { useMemo, useState } from 'react';
import { Transaction, StockLog, ExpenseRecord, Product } from '../types';
import { ArrowLeft, TrendingUp, DollarSign, PieChart, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  expenses: ExpenseRecord[];
  products: Product[];
  stockLogs: StockLog[];
  onBack: () => void;
}

type ChartPeriod = 'Daily' | 'Weekly' | 'Monthly';

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, expenses, products, stockLogs, onBack }) => {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('Daily');
  
  // --- Calculations ---

  const stats = useMemo(() => {
    // 1. Financials
    const totalRevenue = transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate Stock-based Expenses
    const stockExpenses = stockLogs.reduce((sum, log) => {
        const isExpenseAction = ['RESTOCK', 'INITIAL', 'BULK_IMPORT'].includes(log.action);
        const isLossAction = (log.action === 'ADJUSTMENT' && log.quantityChange < 0) || log.action === 'DELETE';
        
        if (isExpenseAction || isLossAction) {
            const product = products.find(p => p.id === log.productId);
            if (product) {
                return sum + (Math.abs(log.quantityChange) * product.costPrice);
            }
        }
        return sum;
    }, 0);

    const totalManualExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = totalManualExpenses + stockExpenses;
    
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 2. Category Performance
    const categorySales: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.status === 'completed' && t.orderItems) {
        t.orderItems.forEach(item => {
          const cat = item.category;
          categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.quantity);
          categoryCounts[cat] = (categoryCounts[cat] || 0) + item.quantity;
        });
      }
    });

    const sortedCategories = Object.entries(categorySales)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        value,
        count: categoryCounts[name] || 0,
        percentage: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0
      }));

    // 3. Top Selling Items
    const itemSales: Record<string, { name: string, qty: number, revenue: number, image: string }> = {};

    transactions.forEach(t => {
      if (t.status === 'completed' && t.orderItems) {
        t.orderItems.forEach(item => {
          if (!itemSales[item.id]) {
            itemSales[item.id] = { name: item.name, qty: 0, revenue: 0, image: item.image };
          }
          itemSales[item.id].qty += item.quantity;
          itemSales[item.id].revenue += (item.price * item.quantity);
        });
      }
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // 4. Inventory Value
    const inventoryValue = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);
    const lowStockCount = products.filter(p => p.stock < 10).length;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      sortedCategories,
      topItems,
      inventoryValue,
      lowStockCount,
      transactionCount: transactions.length
    };
  }, [transactions, expenses, products, stockLogs]);

  // --- Chart Data Calculation ---
  const chartData = useMemo(() => {
    const dataMap = new Map<string, number>();
    
    // Helper to get sortable key (ISO format)
    const getSortableKey = (date: Date) => {
        if (chartPeriod === 'Daily') return date.toISOString().split('T')[0];
        if (chartPeriod === 'Weekly') {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            d.setDate(d.getDate() - d.getDay()); // Simple sunday start
            return d.toISOString().split('T')[0];
        }
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    };

    // Helper to get display label
    const getLabel = (date: Date) => {
        if (chartPeriod === 'Daily') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (chartPeriod === 'Weekly') {
            const d = new Date(date);
            d.setDate(d.getDate() - d.getDay());
            return `Wk ${Math.ceil((d.getDate() + 1) / 7)} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
        }
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    // Filter and Sort
    const sortedTx = [...transactions]
        .filter(t => t.status === 'completed')
        .sort((a, b) => {
            const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return tA - tB;
        });

    if (sortedTx.length === 0) return [];

    // Aggregate
    sortedTx.forEach(t => {
        const d = t.timestamp ? new Date(t.timestamp) : new Date();
        const key = getSortableKey(d);
        dataMap.set(key, (dataMap.get(key) || 0) + t.amount);
    });

    // Convert to array and sort by time
    return Array.from(dataMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => {
             const date = new Date(key); // key is ISO date string
             return {
                 label: getLabel(date),
                 value,
                 key
             };
        });
  }, [transactions, chartPeriod]);

  // --- Chart Rendering Helpers ---
  const renderChart = () => {
      if (chartData.length === 0) {
          return (
              <div className="h-48 flex flex-col items-center justify-center text-[#B0C4B0] border border-dashed border-[#E8EFE6] rounded-xl">
                  <BarChart3 size={32} className="mb-2 opacity-50" />
                  <p className="text-xs">No chart data available</p>
              </div>
          );
      }

      const height = 150;
      const width = 1000; // Logical width
      const maxVal = Math.max(...chartData.map(d => d.value)) * 1.1 || 100; // Add 10% padding
      
      // Generate points
      const points = chartData.map((d, i) => {
          const x = chartData.length === 1 ? width / 2 : (i / (chartData.length - 1)) * width;
          const y = height - (d.value / maxVal) * height;
          return `${x},${y}`;
      });

      const linePath = chartData.length === 1 
          ? `M0,${points[0].split(',')[1]} L${width},${points[0].split(',')[1]}` // Flat line for single point
          : `M${points.join(' L')}`;
      
      const areaPath = chartData.length === 1
          ? `M0,${height} L0,${points[0].split(',')[1]} L${width},${points[0].split(',')[1]} L${width},${height} Z`
          : `M0,${height} L${points[0]} ${points.map(p => `L${p}`).join(' ')} L${width},${height} Z`;

      return (
          <div className="relative h-56 w-full mt-4 select-none">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  {/* Gradients */}
                  <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4A6741" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#4A6741" stopOpacity="0" />
                      </linearGradient>
                  </defs>
                  
                  {/* Area Fill */}
                  <path d={areaPath} fill="url(#chartGradient)" />
                  
                  {/* Line */}
                  <path d={linePath} fill="none" stroke="#4A6741" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Points (dots) */}
                  {chartData.map((d, i) => {
                      const x = chartData.length === 1 ? width / 2 : (i / (chartData.length - 1)) * width;
                      const y = height - (d.value / maxVal) * height;
                      // Show dots only if less than 20 points to avoid clutter
                      if (chartData.length > 20 && i % Math.ceil(chartData.length / 10) !== 0) return null;
                      
                      return (
                          <circle key={i} cx={x} cy={y} r={chartData.length > 20 ? 2 : 4} fill="white" stroke="#4A6741" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                      );
                  })}
              </svg>
              
              {/* Labels X-Axis */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-[#7A8C7A] font-medium translate-y-full pt-2">
                  <span>{chartData[0]?.label}</span>
                  {chartData.length > 2 && <span>{chartData[Math.floor(chartData.length / 2)]?.label}</span>}
                  {chartData.length > 1 && <span>{chartData[chartData.length - 1]?.label}</span>}
              </div>
          </div>
      );
  };

  // Helper for currency formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  return (
    <div className="mb-24 lg:mb-8 mx-2 md:mx-0 pb-10 lg:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#F2F5F1]/95 backdrop-blur-sm pb-3 pt-2 -mx-2 px-2 md:mx-0 md:px-0">
        <div className="flex items-center gap-3 mb-4 px-2 md:px-0">
            <button 
                onClick={onBack} 
                className="bg-white p-2 rounded-full shadow-sm border border-[#E8EFE6] text-[#1A2F1A] hover:bg-[#F2F5F1]"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-[#1A2F1A]">Reports</h2>
                <p className="text-xs text-[#7A8C7A]">System Performance Analysis</p>
            </div>
        </div>
      </div>

      <div className="space-y-6 px-2 md:px-0">
        
        {/* Sales Trend Chart Section */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8EFE6] shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="font-bold text-lg text-[#1A2F1A] flex items-center gap-2">
                        <TrendingUp size={20} className="text-[#4A6741]" />
                        Sales Trends
                    </h3>
                    <p className="text-xs text-[#7A8C7A]">Revenue over time</p>
                </div>
                <div className="flex p-1 bg-[#F2F5F1] rounded-xl">
                    {(['Daily', 'Weekly', 'Monthly'] as ChartPeriod[]).map((period) => (
                        <button
                            key={period}
                            onClick={() => setChartPeriod(period)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                chartPeriod === period 
                                ? 'bg-white text-[#4A6741] shadow-sm' 
                                : 'text-[#7A8C7A] hover:text-[#1A2F1A]'
                            }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>
            
            {renderChart()}
            
            <div className="mt-8 pt-4 border-t border-[#F2F5F1] grid grid-cols-2 gap-4">
                <div>
                    <span className="text-[10px] font-bold text-[#B0C4B0] uppercase">Highest Sales</span>
                    <p className="text-lg font-bold text-[#1A2F1A]">{formatCurrency(Math.max(...chartData.map(d => d.value), 0))}</p>
                </div>
                 <div className="text-right">
                    <span className="text-[10px] font-bold text-[#B0C4B0] uppercase">Period Total</span>
                    <p className="text-lg font-bold text-[#4A6741]">{formatCurrency(chartData.reduce((sum, d) => sum + d.value, 0))}</p>
                </div>
            </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Net Profit Card */}
            <div className="bg-[#1A2F1A] text-white p-5 rounded-3xl shadow-lg shadow-[#1A2F1A]/20 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <DollarSign size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Net Profit</span>
                    </div>
                    <span className="text-3xl font-black block mb-1">{formatCurrency(stats.netProfit)}</span>
                    <div className="flex items-center gap-2 text-xs">
                         <span className={`${stats.profitMargin >= 0 ? 'text-emerald-300' : 'text-red-300'} font-bold`}>
                             {stats.profitMargin.toFixed(1)}% Margin
                         </span>
                         <span className="opacity-50">All Time</span>
                    </div>
                </div>
                <div className="absolute right-0 bottom-0 p-4 opacity-5">
                     <TrendingUp size={100} />
                </div>
            </div>

            {/* Revenue Card */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8EFE6] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2 text-[#7A8C7A]">
                        <BarChart3 size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Revenue</span>
                    </div>
                    <div className="bg-[#E8F5E9] text-[#4A6741] p-1.5 rounded-full">
                        <ArrowUpRight size={14} />
                    </div>
                </div>
                <span className="text-2xl font-black text-[#1A2F1A] block mb-1">{formatCurrency(stats.totalRevenue)}</span>
                <p className="text-xs text-[#B0C4B0]">{stats.transactionCount} total transactions</p>
            </div>

            {/* Expense Card */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8EFE6] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2 text-[#7A8C7A]">
                        <PieChart size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Expenses</span>
                    </div>
                    <div className="bg-red-50 text-red-500 p-1.5 rounded-full">
                        <ArrowDownRight size={14} />
                    </div>
                </div>
                <span className="text-2xl font-black text-[#1A2F1A] block mb-1">{formatCurrency(stats.totalExpenses)}</span>
                <p className="text-xs text-[#B0C4B0]">Includes stock & manual</p>
            </div>
        </div>

        {/* Inventory Valuation Summary */}
        <div className="bg-gradient-to-r from-[#4A6741] to-[#3A5232] p-6 rounded-3xl text-white shadow-md flex items-center justify-between">
            <div>
                <p className="text-xs font-bold opacity-80 uppercase mb-1">Inventory Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.inventoryValue)}</p>
            </div>
            <div className="text-right">
                 <p className="text-xs font-bold opacity-80 uppercase mb-1">Low Stock Items</p>
                 <p className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-amber-300' : 'text-white'}`}>
                     {stats.lowStockCount}
                 </p>
            </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8EFE6] shadow-sm">
            <h3 className="font-bold text-lg text-[#1A2F1A] mb-6">Sales by Category</h3>
            <div className="space-y-5">
                {stats.sortedCategories.map((cat) => (
                    <div key={cat.name} className="relative">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-sm font-bold text-[#1A2F1A]">{cat.name}</span>
                            <div className="text-right">
                                <span className="text-sm font-bold text-[#4A6741]">{formatCurrency(cat.value)}</span>
                                <span className="text-[10px] text-[#B0C4B0] ml-2">({cat.count} sold)</span>
                            </div>
                        </div>
                        <div className="w-full bg-[#F2F5F1] h-2 rounded-full overflow-hidden">
                            <div 
                                className="bg-[#4A6741] h-full rounded-full" 
                                style={{ width: `${cat.percentage}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
                {stats.sortedCategories.length === 0 && (
                    <p className="text-center text-[#B0C4B0] py-4 text-sm">No sales data available yet.</p>
                )}
            </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8EFE6] shadow-sm">
             <h3 className="font-bold text-lg text-[#1A2F1A] mb-4">Top Products</h3>
             <div className="space-y-4">
                 {stats.topItems.map((item, idx) => (
                     <div key={idx} className="flex items-center gap-4">
                         <span className="font-bold text-[#B0C4B0] w-4">{idx + 1}</span>
                         <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg bg-[#F2F5F1] object-cover" />
                         <div className="flex-1 min-w-0">
                             <p className="font-bold text-[#1A2F1A] text-sm truncate">{item.name}</p>
                             <p className="text-xs text-[#7A8C7A]">{item.qty} units sold</p>
                         </div>
                         <span className="font-bold text-[#1A2F1A] text-sm">{formatCurrency(item.revenue)}</span>
                     </div>
                 ))}
                  {stats.topItems.length === 0 && (
                    <p className="text-center text-[#B0C4B0] py-4 text-sm">No sales data available yet.</p>
                )}
             </div>
        </div>

      </div>
    </div>
  );
};
