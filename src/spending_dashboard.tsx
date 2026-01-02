import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus, CreditCard, Store, Building2, Banknote } from 'lucide-react';

// Rich animations for premium feel
const styles = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out forwards;
  }
  
  @keyframes numberPop {
    0% { transform: scale(0.95); opacity: 0.7; }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .animate-number-pop {
    animation: numberPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  
  .card-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.15);
  }
  
  .nav-link {
    position: relative;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #6B7280;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  .nav-link:hover {
    color: #111827;
    background: rgba(0, 0, 0, 0.04);
  }
  .nav-link.active {
    color: #111827;
    background: rgba(0, 0, 0, 0.06);
  }
  .nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 2px;
    background: linear-gradient(90deg, #10B981, #059669);
    border-radius: 2px;
  }
  .nav-blur {
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
  }
`;

// Animated number component
const AnimatedNumber = ({ value, duration = 1000, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[^0-9.-]/g, '')) 
    : value;

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (numericValue - startValue) * easeOut;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [numericValue, duration]);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'B';
    }
    return num.toFixed(1);
  };

  return <span>{prefix}{formatNumber(displayValue)}{suffix}</span>;
};

const SpendingDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Heildarúttekt');
  const [metadata, setMetadata] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/spending_data.json');
        const jsonData = await response.json();
        
        setMetadata(jsonData.metadata);
        
        const processedData = [];
        Object.entries(jsonData.monthlyData).forEach(([dateStr, values]) => {
          const [year, month] = dateStr.split('-').map(Number);
          processedData.push({
            date: dateStr,
            year,
            month,
            ...values
          });
        });
        
        processedData.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
        
        setData(processedData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!data.length) return null;
    
    const latest = data[data.length - 1];
    const lastYear = data.find(d => d.year === latest.year - 1 && d.month === latest.month);
    
    const currentValue = latest.Heildarúttekt || 0;
    const lastYearValue = lastYear?.Heildarúttekt || 0;
    const yoyChange = lastYearValue > 0 ? ((currentValue - lastYearValue) / lastYearValue * 100) : 0;
    
    // TTM calculations
    const ttmData = data.filter(d => {
      const latestDate = new Date(latest.year, latest.month - 1);
      const rowDate = new Date(d.year, d.month - 1);
      const monthsDiff = (latestDate.getFullYear() - rowDate.getFullYear()) * 12 + 
                        (latestDate.getMonth() - rowDate.getMonth());
      return monthsDiff >= 0 && monthsDiff < 12;
    });
    
    const ttmTotal = ttmData.reduce((sum, d) => sum + (d.Heildarúttekt || 0), 0);
    
    const lastTtmData = data.filter(d => {
      const latestDate = new Date(latest.year - 1, latest.month - 1);
      const rowDate = new Date(d.year, d.month - 1);
      const monthsDiff = (latestDate.getFullYear() - rowDate.getFullYear()) * 12 + 
                        (latestDate.getMonth() - rowDate.getMonth());
      return monthsDiff >= 0 && monthsDiff < 12;
    });
    
    const lastTtmTotal = lastTtmData.reduce((sum, d) => sum + (d.Heildarúttekt || 0), 0);
    const ttmChange = lastTtmTotal > 0 ? ((ttmTotal - lastTtmTotal) / lastTtmTotal * 100) : 0;
    
    // Category breakdown for current month
    const categories = [
      { key: 'Verslun', name: 'Retail', icon: Store, value: latest.Verslun || 0 },
      { key: 'Hraðbankar', name: 'ATMs', icon: Banknote, value: latest.Hraðbankar || 0 },
      { key: 'Bankar', name: 'Banks', icon: Building2, value: latest.Bankar || 0 },
    ];
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      currentMonth: `${monthNames[latest.month - 1]} ${latest.year}`,
      currentValue,
      yoyChange,
      ttmTotal,
      ttmChange,
      categories,
      latest
    };
  }, [data]);

  // Seasonal data for chart
  const seasonalData = useMemo(() => {
    if (!data.length || !kpis) return null;
    
    const currentYear = kpis.latest.year;
    const currentMonth = kpis.latest.month - 1;
    
    const historicalByMonth = Array(12).fill(0).map(() => []);
    const currentYearByMonth = Array(12).fill(null);
    
    data.forEach(row => {
      const rowYear = row.year;
      const rowMonth = row.month - 1;
      const value = row.Heildarúttekt;
      
      if (value && value > 0) {
        // Historical: 2017-2019 and 2023 onwards (exclude COVID)
        const isPreCovid = rowYear >= 2017 && rowYear <= 2019;
        const isPostCovid = rowYear >= 2023 && rowYear < currentYear;
        if (isPreCovid || isPostCovid) {
          historicalByMonth[rowMonth].push(value);
        }
        if (rowYear === currentYear) {
          currentYearByMonth[rowMonth] = value;
        }
      }
    });
    
    const historicalAvg = historicalByMonth.map(values => 
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
    );
    
    return {
      currentMonth,
      currentYear,
      historicalByMonth,
      historicalAvg,
      currentYearByMonth
    };
  }, [data, kpis]);

  // YoY comparison data
  const yoyChartData = useMemo(() => {
    if (!data.length || !kpis) return [];
    
    const currentYear = kpis.latest.year;
    const currentMonth = kpis.latest.month;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const chartData = [];
    for (let month = 1; month <= currentMonth; month++) {
      const monthData = { month: monthNames[month - 1] };
      
      for (let yearOffset = 0; yearOffset <= 2; yearOffset++) {
        const year = currentYear - yearOffset;
        const row = data.find(d => d.year === year && d.month === month);
        monthData[year.toString()] = row?.Heildarúttekt || null;
      }
      
      chartData.push(monthData);
    }
    
    return chartData;
  }, [data, kpis]);

  const yoyYears = useMemo(() => {
    if (!kpis) return { current: 2025, prior1: 2024, prior2: 2023 };
    return { 
      current: kpis.latest.year, 
      prior1: kpis.latest.year - 1, 
      prior2: kpis.latest.year - 2 
    };
  }, [kpis]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500">Loading spending data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50" style={{
      background: `
        radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(5, 150, 105, 0.02) 0%, transparent 50%),
        #FAFAFA
      `
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{styles}</style>
      
      {/* ========== ELITE NAV BAR ========== */}
      <nav className="sticky top-0 z-50 nav-blur" style={{
        background: 'rgba(255, 255, 255, 0.72)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <div className="hidden sm:block">
                <span style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontSize: '17px',
                  fontWeight: '600',
                  color: '#111827',
                  letterSpacing: '-0.3px'
                }}>
                  Iceland Insights
                </span>
              </div>
            </a>
            
            {/* Nav Links */}
            <div className="flex items-center gap-1">
              <a href="/arrivals" className="nav-link">
                Arrivals
              </a>
              <a href="/spending" className="nav-link active">
                Card Spending
              </a>
              <a href="/hotels" className="nav-link" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                Hotels
                <span className="ml-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Soon</span>
              </a>
            </div>
            
            {/* Right side */}
            <div className="hidden md:flex items-center gap-2">
              <a 
                href="https://sedlabanki.is" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
              >
                Data: Central Bank of Iceland
              </a>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Page Header */}
      <div className="pt-10 pb-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827',
              letterSpacing: '-0.5px',
              margin: '0 0 8px 0'
            }}>
              Foreign Card Spending
            </h1>
            <p style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              fontSize: '15px',
              fontWeight: '400',
              color: '#6B7280',
              letterSpacing: '-0.1px',
              margin: 0
            }}>
              Debit & credit card turnover · Data from Central Bank of Iceland
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 pb-8 space-y-8 md:space-y-10">
        
        {/* Hero Stats Section */}
        {kpis && seasonalData && (
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
              
              {/* LEFT COLUMN - Current Month Stats */}
              <div className="space-y-6">
                {/* Main stat */}
                <div>
                  <div className="text-sm md:text-base text-neutral-500 mb-2">{kpis.currentMonth}</div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-5xl md:text-7xl font-bold text-neutral-900 tabular-nums tracking-tighter leading-none animate-number-pop">
                      <AnimatedNumber value={kpis.currentValue} duration={1400} suffix=" ISK" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-3">
                    <span className="text-sm md:text-base text-neutral-500">million in card turnover</span>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-semibold ${
                      kpis.yoyChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {kpis.yoyChange >= 0 ? <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <TrendingDown className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                      {kpis.yoyChange > 0 ? '+' : ''}{kpis.yoyChange.toFixed(1)}% YoY
                    </div>
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="pt-6 border-t border-neutral-100">
                  <div className="text-sm text-neutral-500 mb-4">Breakdown by Category</div>
                  <div className="space-y-3">
                    {kpis.categories.map((cat, idx) => {
                      const Icon = cat.icon;
                      const percent = kpis.currentValue > 0 ? (cat.value / kpis.currentValue * 100) : 0;
                      return (
                        <div key={cat.key} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-neutral-700">{cat.name}</span>
                              <span className="text-sm font-semibold text-neutral-900 tabular-nums">
                                {cat.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} M
                              </span>
                            </div>
                            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-neutral-500 w-12 text-right">{percent.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Chart */}
              <div>
                <div className="bg-neutral-50/50 rounded-2xl p-4 md:p-6">
                  <h3 className="text-sm font-medium text-neutral-700 mb-4">Monthly Card Turnover (ISK millions)</h3>
                  <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
                    <ComposedChart 
                      data={(() => {
                        const { currentMonth, historicalAvg, currentYearByMonth } = seasonalData;
                        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return monthLabels.map((label, i) => ({
                          month: label,
                          historical: historicalAvg[i],
                          current: i <= currentMonth ? currentYearByMonth[i] : null
                        }));
                      })()}
                      margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                      <XAxis 
                        dataKey="month"
                        tick={{ fontSize: isMobile ? 9 : 11, fill: '#737373' }}
                        axisLine={false}
                        tickLine={false}
                        interval={isMobile ? 1 : 0}
                      />
                      <YAxis 
                        tick={{ fontSize: isMobile ? 9 : 11, fill: '#737373' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${(value/1000).toFixed(0)}B`}
                        width={45}
                        domain={[0, 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '12px',
                          padding: '8px 12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value, name) => {
                          if (value === null) return ['N/A', name];
                          const label = name === 'Historical' ? 'Historical Avg' : seasonalData.currentYear;
                          return [`${(value/1000).toFixed(2)}B ISK`, label];
                        }}
                      />
                      <Bar 
                        dataKey="current"
                        name={String(seasonalData.currentYear)}
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line 
                        dataKey="historical"
                        name="Historical"
                        stroke="#525252"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={false}
                        activeDot={{ r: 4, fill: '#525252', stroke: '#fff', strokeWidth: 2 }}
                        connectNulls={true}
                        type="monotone"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-neutral-100">
                    <div 
                      className="flex items-center gap-2 cursor-help"
                      title="Average of 2017–2019 and 2023–2024 (excludes COVID years)"
                    >
                      <div className="w-6 h-0.5" style={{ background: 'repeating-linear-gradient(90deg, #525252 0, #525252 6px, transparent 6px, transparent 10px)', height: '2px' }}></div>
                      <span className="text-xs text-neutral-500 border-b border-dashed border-neutral-300">Historical Avg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-emerald-500"></div>
                      <span className="text-xs text-neutral-500">{seasonalData.currentYear}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insights Grid */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* TTM Performance */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm card-hover animate-fade-in-up">
              <h3 className="text-sm font-medium text-neutral-900 mb-1">Trailing 12 Months</h3>
              <p className="text-sm text-neutral-500 mb-4">Total card turnover</p>
              <div className="text-3xl font-bold text-neutral-900 mb-2 tabular-nums">
                {(kpis.ttmTotal / 1000).toFixed(1)}B ISK
              </div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                kpis.ttmChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {kpis.ttmChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpis.ttmChange > 0 ? '+' : ''}{kpis.ttmChange.toFixed(1)}% vs prior 12 months
              </div>
            </div>

            {/* Retail dominance */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm card-hover animate-fade-in-up">
              <h3 className="text-sm font-medium text-neutral-900 mb-1">Retail Spending</h3>
              <p className="text-sm text-neutral-500 mb-4">{kpis.currentMonth}</p>
              <div className="text-3xl font-bold text-neutral-900 mb-2 tabular-nums">
                {((kpis.categories[0]?.value / kpis.currentValue) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-neutral-500">
                of total card turnover goes to retail outlets
              </p>
            </div>

            {/* ATM withdrawals */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm card-hover animate-fade-in-up">
              <h3 className="text-sm font-medium text-neutral-900 mb-1">ATM Withdrawals</h3>
              <p className="text-sm text-neutral-500 mb-4">{kpis.currentMonth}</p>
              <div className="text-3xl font-bold text-neutral-900 mb-2 tabular-nums">
                {kpis.categories[1]?.value?.toLocaleString(undefined, { maximumFractionDigits: 1 })}M ISK
              </div>
              <p className="text-sm text-neutral-500">
                cash withdrawals from foreign cards
              </p>
            </div>
          </div>
        )}

        {/* Year-over-Year Comparison Chart */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm card-hover">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-neutral-900">
              Year-over-Year Comparison
            </h3>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            Monthly card turnover ({yoyYears.prior2} vs {yoyYears.prior1} vs {yoyYears.current})
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={yoyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis 
                dataKey="month"
                stroke="#8e8e93"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#8e8e93"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}B` : val}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
                }}
                formatter={(value) => [value ? `${(value/1000).toFixed(2)}B ISK` : 'N/A']}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
              />
              <Line 
                type="monotone" 
                dataKey={String(yoyYears.current)}
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ fill: '#fff', stroke: '#10B981', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
                name={String(yoyYears.current)}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey={String(yoyYears.prior1)}
                stroke="#6B7280"
                strokeWidth={2.5}
                strokeOpacity={0.5}
                dot={{ fill: '#fff', stroke: '#6B7280', strokeWidth: 2, r: 3, opacity: 0.5 }}
                activeDot={{ r: 5 }}
                name={String(yoyYears.prior1)}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey={String(yoyYears.prior2)}
                stroke="#D1D5DB"
                strokeWidth={2.5}
                strokeOpacity={0.5}
                dot={{ fill: '#fff', stroke: '#D1D5DB', strokeWidth: 2, r: 3, opacity: 0.5 }}
                activeDot={{ r: 5 }}
                name={String(yoyYears.prior2)}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Historical Annual Trend */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm card-hover">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-neutral-900">
              Annual Card Turnover
            </h3>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            Total foreign card spending by year (ISK billions)
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart 
              data={(() => {
                const yearTotals = {};
                data.forEach(row => {
                  if (row.year >= 2017) {
                    if (!yearTotals[row.year]) yearTotals[row.year] = { total: 0, months: 0 };
                    yearTotals[row.year].total += row.Heildarúttekt || 0;
                    yearTotals[row.year].months += 1;
                  }
                });
                
                const currentYear = kpis?.latest?.year || 2025;
                return Object.entries(yearTotals)
                  .map(([year, data]) => ({
                    year: year,
                    label: parseInt(year) === currentYear ? `${year} YTD` : year,
                    value: data.total,
                    isPartial: parseInt(year) === currentYear
                  }))
                  .sort((a, b) => parseInt(a.year) - parseInt(b.year));
              })()}
              margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis 
                dataKey="label"
                stroke="#8e8e93"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#8e8e93"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${(val/1000).toFixed(0)}B`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
                }}
                formatter={(value) => [`${(value/1000).toFixed(2)}B ISK`]}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Bar 
                dataKey="value"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
                label={{ 
                  position: 'top', 
                  formatter: (value) => `${(value/1000).toFixed(1)}B`,
                  fontSize: 9,
                  fill: '#737373'
                }}
              >
                {(() => {
                  const yearTotals = {};
                  data.forEach(row => {
                    if (row.year >= 2017) {
                      if (!yearTotals[row.year]) yearTotals[row.year] = 0;
                      yearTotals[row.year] += row.Heildarúttekt || 0;
                    }
                  });
                  const currentYear = kpis?.latest?.year || 2025;
                  return Object.keys(yearTotals)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map((year, i) => {
                      const isPartial = parseInt(year) === currentYear;
                      const isCovid = ['2020', '2021', '2022'].includes(year);
                      let fill = '#10B981';
                      if (isCovid) fill = '#D1D5DB';
                      else if (isPartial) fill = '#34D399';
                      return <Cell key={`cell-${i}`} fill={fill} />;
                    });
                })()}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500"></div>
              <span className="text-xs text-neutral-500">Full Year</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-300"></div>
              <span className="text-xs text-neutral-500">Year to Date</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-neutral-300"></div>
              <span className="text-xs text-neutral-500">COVID Years</span>
            </div>
          </div>
        </div>

        {/* Seasonality Table */}
        {seasonalData && (
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm">
            <h3 className="text-sm font-medium text-neutral-900 mb-1">Typical Spending by Season</h3>
            <p className="text-xs text-neutral-500 mb-4">Based on historical averages (2017-2019, 2023-2024)</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { name: 'Low Season', months: 'Nov – Apr', color: 'bg-emerald-100', textColor: 'text-emerald-700', indices: [10, 11, 0, 1, 2, 3] },
                { name: 'Shoulder', months: 'May, Sep-Oct', color: 'bg-emerald-200', textColor: 'text-emerald-800', indices: [4, 8, 9] },
                { name: 'High Season', months: 'Jun – Aug', color: 'bg-emerald-500', textColor: 'text-white', indices: [5, 6, 7] },
              ].map((season) => {
                const avgValues = season.indices.map(i => seasonalData.historicalAvg[i]).filter(v => v);
                const avgValue = avgValues.length > 0 ? avgValues.reduce((a, b) => a + b, 0) / avgValues.length : 0;
                
                return (
                  <div key={season.name} className={`${season.color} rounded-xl p-4 text-center`}>
                    <div className={`text-xs font-medium ${season.textColor} opacity-80 mb-1`}>{season.name}</div>
                    <div className={`text-2xl font-bold ${season.textColor} tabular-nums`}>
                      {(avgValue / 1000).toFixed(1)}B
                    </div>
                    <div className={`text-xs ${season.textColor} opacity-70 mt-1`}>{season.months}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Data methodology note */}
        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl p-5 md:p-6 border border-neutral-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">About This Data</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                This dashboard tracks foreign-issued debit and credit card spending in Iceland, 
                including purchases at retail outlets, ATM withdrawals, and bank transactions. 
                Data is published monthly by the Central Bank of Iceland and provides a proxy 
                for tourist spending patterns.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-neutral-600 shadow-sm">
                  <Store className="w-3.5 h-3.5" /> Retail Purchases
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-neutral-600 shadow-sm">
                  <Banknote className="w-3.5 h-3.5" /> ATM Withdrawals
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-neutral-600 shadow-sm">
                  <Building2 className="w-3.5 h-3.5" /> Bank Transactions
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-sm border border-neutral-100">
            <span className="text-xs text-neutral-500">Data: Central Bank of Iceland</span>
            <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
            <span className="text-xs text-neutral-500">Updated: {metadata?.lastUpdated}</span>
            <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
            <span className="text-xs text-neutral-500">Unit: ISK millions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingDashboard;
