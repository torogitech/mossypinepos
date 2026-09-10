
import React, { useMemo, useState } from 'react';
import { Transaction, StockLog, ExpenseRecord, Product } from '../types';
import { ArrowLeft, TrendingUp, DollarSign, PieChart, BarChart3, ArrowUpRight, ArrowDownRight, Calendar, Calculator, Hash } from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  expenses: ExpenseRecord[];
  products: Product[];
  stockLogs: StockLog[];
  onBack: () => void;
}

type TimeRange = 'Today' | 'This Week' | 'This Month' | 'All Time';

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, expenses, products, stockLogs, onBack }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('This Month');
  
  // --- Filtering Logic ---
  const { filteredTransactions, filteredExpenses } = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of Week (Sunday)
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    // Start of Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const filterFn = (dateStr?: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;

        switch (timeRange) {
            case 'Today': return d >= startOfDay;
            case 'This Week': return d >= startOfWeek;
            case 'This Month': return d >= startOfMonth;
            default: return true;
        }
    };

    return {
        filteredTransactions: transactions.filter(t => t.status === 'completed' && filterFn(t.timestamp || t.dateStr)),
        filteredExpenses: expenses.filter(e => filterFn(e.date)),
    };
  }, [timeRange, transactions, expenses]);

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    // 1. Revenue & Counts
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = filteredTransactions.length;
    const avgSale = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    // 2. Costs (COGS + Manual Expenses)
    // Estimate COGS based on sold items to get accurate "Sales" profit
    let cogs = 0;
    filteredTransactions.forEach(t => {
        if (t.orderItems && t.orderItems.length > 0) {
            t.orderItems.forEach(item => {
                // Try to find current cost price from products list if not in item
                const product = products.find(p => p.id === item.id);
                const cost = product?.costPrice || (item.price * 0.6); // Fallback to 60% rule
                cogs += cost * item.quantity;
            });
        } else {
             // Fallback if no item details
             cogs += t.amount * 0.6;
        }
    });

    const manualExpensesTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = cogs + manualExpensesTotal;
    
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 3. Category Breakdown
    const categorySales: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    filteredTransactions.forEach(t => {
      if (t.orderItems) {
        t.orderItems.forEach(item => {
          const cat = item.category || 'Uncategorized';
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

    // 4. Top Items
    const itemSales: Record<string, { name: string, qty: number, revenue: number, image: string }> = {};

    filteredTransactions.forEach(t => {
      if (t.orderItems) {
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

    return {
      totalRevenue,
      transactionCount,
      avgSale,
      totalExpenses,
      netProfit,
      profitMargin,
      sortedCategories,
      topItems,
    };
  }, [filteredTransactions, filteredExpenses, products]);

  // --- Chart Data Calculation ---
  const chartData = useMemo(() => {
    const dataMap = new Map<string, number>();
    
    // Sort transactions by time
    const sortedTx = [...filteredTransactions].sort((a, b) => {
        const tA = new Date(a.timestamp || a.dateStr || '').getTime();
        const tB = new Date(b.timestamp || b.dateStr || '').getTime();
        return tA - tB;
    });

    if (sortedTx.length === 0) return [];

    const getKey = (date: Date) => {
        if (timeRange === 'Today') {
            // Group by Hour (e.g., "14:00")
            return `${date.getHours()}:00`;
        } else if (timeRange === 'This Week' || timeRange === 'This Month') {
            // Group by Day (e.g., "Mon 15")
            return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        } else {
             // Group by Month (e.g., "Jan 24")
             return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }
    };

    // Pre-fill keys for "Today" to show empty hours? 
    // For simplicity, we'll just map existing data points first.
    
    sortedTx.forEach(t => {
        const d = new Date(t.timestamp || t.dateStr || '');
        if (!isNaN(d.getTime())) {
            const key = getKey(d);
            dataMap.set(key, (dataMap.get(key) || 0) + t.amount);
        }
    });

    // Convert map to array. For "Today", we might want to sort by hour integer.
    // For others, we rely on the insertion order if sorted by date, or we sort again.
    // Since we sortedTx first, insertion order should be roughly correct, but Map iteration order is insertion order.
    
    // Let's create a unique list of keys derived from sortedTx to maintain order
    const keys = Array.from(new Set(sortedTx.map(t => {
         const d = new Date(t.timestamp || t.dateStr || '');
         return getKey(d);
    })));

    return keys.map(key => ({
        label: key,
        value: dataMap.get(key) || 0
    }));

  }, [filteredTransactions, timeRange]);

  // --- Helper: Format Currency ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderChart = () => {
      if (chartData.length === 0) {
          return (
              <div className="h-48 flex flex-col items-center justify-center text-[#B0C4B0] border border-dashed border-[#E8EFE6] rounded-xl bg-[#F9FAF9]">
                  <BarChart3 size={32} className="mb-2 opacity-50" />
                  <p className="text-xs">No sales data for this period</p>
              </div>
          );
      }

      const height = 180;
      const width = 800;
      const maxVal = Math.max(...chartData.map(d => d.value)) * 1.15 || 100;
      
      const points = chartData.map((d, i) => {
          const x = chartData.length === 1 ? width / 2 : (i / (chartData.length - 1)) * width;
          const y = height - (d.value / maxVal) * height;
          return `${x},${y}`;
      });

      const areaPath = chartData.length === 1
        ? `M0,${height} L0,${points[0].split(',')[1]} L${width},${points[0].split(',')[1]} L${width},${height} Z`
        : `M0,${height} L${points[0]} ${points.map(p => `L${p}`).join(' ')} L${width},${height} Z`;

      return (
          <div className="relative h-60 w-full mt-4 select-none overflow-hidden">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4A6741" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#4A6741" stopOpacity="0" />
                      </linearGradient>
                  </defs>
                  
                  <path d={areaPath} fill="url(#salesGradient)" />
                  
                  {chartData.length > 1 && (
                       <polyline 
                        points={points.join(' ')} 
                        fill="none" 
                        stroke="#4A6741" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        vectorEffect="non-scaling-stroke"
                       />
                  )}
                  
                  {chartData.map((d, i) => {
                      const x = chartData.length === 1 ? width / 2 : (i / (chartData.length - 1)) * width;
                      const y = height - (d.value / maxVal) * height;
                      // Subsample dots if too many
                      if (chartData.length > 15 && i % Math.ceil(chartData.length / 10) !== 0) return null;
                      return (
                          <circle key={i} cx={x} cy={y} r={4} fill="white" stroke="#4A6741" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                      );
                  })}
              </svg>
              
              {/* X Axis Labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-[#7A8C7A] font-medium translate-y-4 pt-2 border-t border-[#E8EFE6]">
                  <span>{chartData[0]?.label}</span>
                  {chartData.length > 3 && <span>{chartData[Math.floor(chartData.length / 2)]?.label}</span>}
                  {chartData.length > 1 && <span>{chartData[chartData.length - 1]?.label}</span>}
              </div>
          </div>
      );
  };

  return (
    <div className="mb-24 lg:mb-8 mx-2 md:mx-0 pb-10 lg:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#F2F5F1]/95 backdrop-blur-sm pb-3 pt-2 -mx-2 px-2 md:mx-0 md:px-0">
        <div className="flex items-center gap-3 mb-4 px-2 md:px-0">
            <button 
                onClick={onBack} 
                className="bg-white p-2 rounded-full shadow-sm border border-[#E8EFE6] text-[#1A2F1A] hover:bg-[#F2F5F1] transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-[#1A2F1A]">Sales Reports</h2>
                <p className="text-xs text-[#7A8C7A]">Performance & Analytics</p>
            </div>
        </div>

        {/* Time Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
            {(['Today', 'This Week', 'This Month', 'All Time'] as TimeRange[]).map((range) => (
                <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                        timeRange === range 
                        ? 'bg-[#1A2F1A] text-white shadow-[#1A2F1A]/20 scale-105' 
                        : 'bg-white text-[#7A8C7A] border border-[#E8EFE6] hover:bg-[#F2F5F1]'
                    }`}
                >
                    {range}
                </button>
            ))}
        </div>
      </div>

      <div className="space-y-6 px-2 md:px-0 mt-4">
        
        {/* Main Chart Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8EFE6] shadow-sm">
            <div className="flex justify-between items-center mb-2">
                 <h3 className="font-bold text-lg text-[#1A2F1A] flex items-center gap-2">
                    <TrendingUp size={20} className="text-[#4A6741]" />
                    Sales Trend
                </h3>
                 <span className="text-xs font-bold text-[#4A6741] bg-[#E8F5E9] px-2 py-1 rounded-lg">
                     {timeRange}
                 </span>
            </div>
            {renderChart()}
        </div>

        {/* Primary Metrics Grid (Revenue, Count, Avg) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Total Revenue */}
            <div className="bg-[#4A6741] text-white p-5 rounded-3xl shadow-lg shadow-[#4A6741]/20 relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-white/80">
                        <DollarSign size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                    </div>
                    <span className="text-3xl font-black block">{formatCurrency(stats.totalRevenue)}</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                     <PieChart size={100} />
                </div>
            </div>

            {/* Transaction Count */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8EFE6] shadow-sm flex flex-col justify-center relative overflow-hidden group">
                 <div className="flex items-center gap-2 text-[#7A8C7A] mb-2">
                    <Hash size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Transactions</span>
                </div>
                <span className="text-3xl font-black text-[#1A2F1A]">{stats.transactionCount}</span>
                <div className="absolute -right-4 -bottom-4 text-[#F2F5F1] group-hover:scale-110 transition-transform duration-500">
                     <BarChart3 size={90} />
                </div>
            </div>

            {/* Average Sale */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8EFE6] shadow-sm flex flex-col justify-center relative overflow-hidden group">
                 <div className="flex items-center gap-2 text-[#7A8C7A] mb-2">
                    <Calculator size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Avg. Sale</span>
                </div>
                <span className="text-3xl font-black text-[#1A2F1A]">{formatCurrency(stats.avgSale)}</span>
                 <div className="absolute -right-4 -bottom-4 text-[#F2F5F1] group-hover:scale-110 transition-transform duration-500">
                     <DollarSign size={90} />
                </div>
            </div>
        </div>

        {/* Secondary Metrics (Profit & Expenses) */}
        <div className="grid grid-cols-2 gap-4">
             <div className="bg-[#FDFDFD] p-4 rounded-3xl border border-[#F2F5F1] shadow-sm">
                 <div className="flex items-center gap-2 mb-1">
                     <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-full">
                         <ArrowUpRight size={14} />
                     </div>
                     <span className="text-xs font-bold text-[#7A8C7A] uppercase">Net Profit</span>
                 </div>
                 <p className="text-lg font-bold text-[#1A2F1A]">{formatCurrency(stats.netProfit)}</p>
                 <p className={`text-[10px] font-bold ${stats.profitMargin >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                     {Number(stats.profitMargin || 0).toFixed(1)}% Margin
                 </p>
             </div>

             <div className="bg-[#FDFDFD] p-4 rounded-3xl border border-[#F2F5F1] shadow-sm">
                 <div className="flex items-center gap-2 mb-1">
                     <div className="p-1.5 bg-red-100 text-red-500 rounded-full">
                         <ArrowDownRight size={14} />
                     </div>
                     <span className="text-xs font-bold text-[#7A8C7A] uppercase">Expenses</span>
                 </div>
                 <p className="text-lg font-bold text-[#1A2F1A]">{formatCurrency(stats.totalExpenses)}</p>
                 <p className="text-[10px] text-[#B0C4B0]">
                     COGS + Ops
                 </p>
             </div>
        </div>

        {/* Categories & Top Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sales by Category */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8EFE6] shadow-sm">
                <h3 className="font-bold text-lg text-[#1A2F1A] mb-6">Sales by Category</h3>
                <div className="space-y-5">
                    {stats.sortedCategories.slice(0, 5).map((cat) => (
                        <div key={cat.name} className="relative">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-sm font-bold text-[#1A2F1A]">{cat.name}</span>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-[#4A6741]">{formatCurrency(cat.value)}</span>
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
                        <div className="text-center py-8 text-[#B0C4B0]">
                            <PieChart size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No data for {timeRange}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Selling Products */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8EFE6] shadow-sm">
                <h3 className="font-bold text-lg text-[#1A2F1A] mb-6">Top Selling Items</h3>
                <div className="space-y-4">
                    {stats.topItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 border-b border-[#F9FAF9] last:border-0 pb-3 last:pb-0">
                            <span className="font-bold text-[#B0C4B0] w-4 text-sm">#{idx + 1}</span>
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl bg-[#F2F5F1] object-cover" />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-[#1A2F1A] text-sm truncate">{item.name}</p>
                                <p className="text-xs text-[#7A8C7A]">{item.qty} sold</p>
                            </div>
                            <span className="font-bold text-[#1A2F1A] text-sm">{formatCurrency(item.revenue)}</span>
                        </div>
                    ))}
                    {stats.topItems.length === 0 && (
                        <div className="text-center py-8 text-[#B0C4B0]">
                            <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No data for {timeRange}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
