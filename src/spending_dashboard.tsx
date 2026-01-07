import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, ReferenceLine, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus, CreditCard, Users, Calendar, ArrowRight } from 'lucide-react';

const styles = `
  * { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif; }
  
  .nav-blur {
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
  }
  
  .nav-link {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #6B7280;
    border-radius: 8px;
    transition: all 0.2s ease;
    text-decoration: none;
  }
  
  .nav-link:hover { color: #111827; background: rgba(0,0,0,0.04); }
  
  .nav-link.active {
    color: #059669;
    position: relative;
  }
  
  .nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 16px;
    right: 16px;
    height: 2px;
    background: linear-gradient(90deg, #10B981, #059669);
    border-radius: 2px;
  }
  
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in { animation: fadeInUp 0.5s ease-out forwards; }
  .delay-1 { animation-delay: 0.1s; opacity: 0; }
  .delay-2 { animation-delay: 0.2s; opacity: 0; }
  .delay-3 { animation-delay: 0.3s; opacity: 0; }
  
  .card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
    transition: box-shadow 0.2s ease;
  }
  
  .card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
  }
  
  .metric-label {
    font-size: 12px;
    font-weight: 500;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .metric-value {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.5px;
    font-variant-numeric: tabular-nums;
  }
  
  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    letter-spacing: -0.1px;
  }
  
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .badge-success { background: #ECFDF5; color: #059669; }
  .badge-danger { background: #FEF2F2; color: #DC2626; }
  .badge-neutral { background: #F3F4F6; color: #6B7280; }
  .badge-info { background: #EEF2FF; color: #4F46E5; }
`;

// Helper to format percentages cleanly
const formatPct = (value: number, showPlus = true): string => {
  if (Math.abs(value) < 0.05) return '0.0';
  const formatted = value.toFixed(1);
  if (showPlus && value > 0) return '+' + formatted;
  return formatted;
};

const SpendingDashboard = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<any>(null);
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
        const [spendingResponse, cpiResponse, arrivalsResponse] = await Promise.all([
          fetch('/spending_data.json'),
          fetch('/cpi_data.json'),
          fetch('/data.json')
        ]);
        
        const spendingJson = await spendingResponse.json();
        const cpiJson = await cpiResponse.json();
        const arrivalsJson = await arrivalsResponse.json();
        
        setMetadata(spendingJson.metadata);
        
        // Build arrivals lookup
        const arrivalsLookup: Record<string, number> = {};
        Object.entries(arrivalsJson.monthlyData).forEach(([dateStr, values]: [string, any]) => {
          arrivalsLookup[dateStr] = values['Útlendingar alls'] || 0;
        });
        
        const processedData: any[] = [];
        Object.entries(spendingJson.monthlyData).forEach(([dateStr, values]: [string, any]) => {
          const [year, month] = dateStr.split('-').map(Number);
          const cpiKey = `${year}-${String(month).padStart(2, '0')}`;
          const cpi = cpiJson.monthlyData[cpiKey]?.CPI || null;
          const arrivals = arrivalsLookup[`${year}-${month}`] || arrivalsLookup[cpiKey] || null;
          
          const spendingPerVisitor = arrivals && arrivals > 0 && values.Heildarúttekt
            ? (values.Heildarúttekt * 1000000) / arrivals / 1000
            : null;
          
          processedData.push({
            date: dateStr,
            year,
            month,
            cpi,
            arrivals,
            spendingPerVisitor,
            ...values
          });
        });
        
        processedData.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
        setData(processedData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calculate all KPIs
  const kpis = useMemo(() => {
    if (!data.length) return null;
    
    const latest = data[data.length - 1];
    const lastYear = data.find(d => d.year === latest.year - 1 && d.month === latest.month);
    const baseCpi = lastYear?.cpi || 634.7;
    
    // Current month stats
    const currentValue = latest.Heildarúttekt || 0;
    const lastYearValue = lastYear?.Heildarúttekt || 0;
    const nominalYoyChange = lastYearValue > 0 ? ((currentValue - lastYearValue) / lastYearValue * 100) : 0;
    
    // Real YoY change for current month
    const currentCpi = latest.cpi;
    const lastYearCpi = lastYear?.cpi;
    let realYoyChange = nominalYoyChange;
    let inflationRate = 0;
    
    if (currentCpi && lastYearCpi && lastYearValue > 0) {
      const nominalRatio = currentValue / lastYearValue;
      const cpiRatio = lastYearCpi / currentCpi;
      realYoyChange = (nominalRatio * cpiRatio - 1) * 100;
      inflationRate = ((currentCpi - lastYearCpi) / lastYearCpi) * 100;
    }
    
    // TTM calculations with month-by-month deflation
    const ttmData = data.filter(d => {
      const latestDate = new Date(latest.year, latest.month - 1);
      const rowDate = new Date(d.year, d.month - 1);
      const monthsDiff = (latestDate.getFullYear() - rowDate.getFullYear()) * 12 + 
                        (latestDate.getMonth() - rowDate.getMonth());
      return monthsDiff >= 0 && monthsDiff < 12;
    });
    
    const lastTtmData = data.filter(d => {
      const latestDate = new Date(latest.year - 1, latest.month - 1);
      const rowDate = new Date(d.year, d.month - 1);
      const monthsDiff = (latestDate.getFullYear() - rowDate.getFullYear()) * 12 + 
                        (latestDate.getMonth() - rowDate.getMonth());
      return monthsDiff >= 0 && monthsDiff < 12;
    });
    
    const ttmTotal = ttmData.reduce((sum, d) => sum + (d.Heildarúttekt || 0), 0);
    const lastTtmTotal = lastTtmData.reduce((sum, d) => sum + (d.Heildarúttekt || 0), 0);
    const ttmNominalChange = lastTtmTotal > 0 ? ((ttmTotal - lastTtmTotal) / lastTtmTotal * 100) : 0;
    
    // Real TTM with month-by-month deflation
    const ttmRealTotal = ttmData.reduce((sum, d) => {
      if (d.Heildarúttekt && d.cpi && d.cpi > 0) {
        return sum + (d.Heildarúttekt * (baseCpi / d.cpi));
      }
      return sum + (d.Heildarúttekt || 0);
    }, 0);
    
    const lastTtmRealTotal = lastTtmData.reduce((sum, d) => {
      if (d.Heildarúttekt && d.cpi && d.cpi > 0) {
        return sum + (d.Heildarúttekt * (baseCpi / d.cpi));
      }
      return sum + (d.Heildarúttekt || 0);
    }, 0);
    
    const ttmRealChange = lastTtmRealTotal > 0 ? ((ttmRealTotal - lastTtmRealTotal) / lastTtmRealTotal) * 100 : 0;
    
    // Spending per visitor
    const currentSpv = latest.spendingPerVisitor;
    const lastYearSpv = lastYear?.spendingPerVisitor;
    let spvRealChange = 0;
    
    if (currentSpv && lastYearSpv && currentCpi && lastYearCpi) {
      const realCurrentSpv = currentSpv * (lastYearCpi / currentCpi);
      spvRealChange = ((realCurrentSpv - lastYearSpv) / lastYearSpv) * 100;
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      currentMonth: `${monthNames[latest.month - 1]} ${latest.year}`,
      currentValue,
      nominalYoyChange,
      realYoyChange,
      inflationRate,
      ttmTotal,
      ttmNominalChange,
      ttmRealChange,
      currentSpv,
      spvRealChange,
      arrivals: latest.arrivals,
      lastYearArrivals: lastYear?.arrivals,
      latest,
      baseCpi
    };
  }, [data]);

  // Chart data: Monthly inflation-adjusted comparison
  const monthlyChartData = useMemo(() => {
    if (!data.length || !kpis) return [];
    
    const currentYear = kpis.latest.year;
    const priorYear = currentYear - 1;
    const currentMonth = kpis.latest.month - 1;
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseCpi = kpis.baseCpi;
    
    return monthLabels.map((label, i) => {
      const month = i + 1;
      const currentRow = data.find(d => d.year === currentYear && d.month === month);
      const priorRow = data.find(d => d.year === priorYear && d.month === month);
      
      const currentReal = currentRow?.Heildarúttekt && currentRow?.cpi
        ? currentRow.Heildarúttekt * (baseCpi / currentRow.cpi)
        : null;
      const priorReal = priorRow?.Heildarúttekt && priorRow?.cpi
        ? priorRow.Heildarúttekt * (baseCpi / priorRow.cpi)
        : null;
      
      const yoyChange = (currentReal && priorReal && priorReal > 0)
        ? ((currentReal - priorReal) / priorReal) * 100
        : null;
      
      return {
        month: label,
        [priorYear]: i <= currentMonth ? priorReal : null,
        [currentYear]: i <= currentMonth ? currentReal : null,
        yoyChange: i <= currentMonth ? yoyChange : null,
      };
    });
  }, [data, kpis]);

  // Spending per visitor chart data
  const spvChartData = useMemo(() => {
    if (!data.length || !kpis) return [];
    
    const currentYear = kpis.latest.year;
    const priorYear = currentYear - 1;
    const currentMonth = kpis.latest.month;
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseCpi = kpis.baseCpi;
    
    return monthLabels.slice(0, currentMonth).map((label, i) => {
      const month = i + 1;
      const currentRow = data.find(d => d.year === currentYear && d.month === month);
      const priorRow = data.find(d => d.year === priorYear && d.month === month);
      
      const currentReal = currentRow?.spendingPerVisitor && currentRow?.cpi
        ? currentRow.spendingPerVisitor * (baseCpi / currentRow.cpi)
        : null;
      const priorReal = priorRow?.spendingPerVisitor && priorRow?.cpi
        ? priorRow.spendingPerVisitor * (baseCpi / priorRow.cpi)
        : null;
      
      // Calculate YoY% change
      const yoyChange = (currentReal && priorReal && priorReal > 0)
        ? ((currentReal - priorReal) / priorReal) * 100
        : null;
      
      return {
        month: label,
        [priorYear]: priorReal,
        [currentYear]: currentReal,
        yoyChange,
      };
    });
  }, [data, kpis]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500 text-sm">Loading spending data...</p>
        </div>
      </div>
    );
  }

  const currentYear = kpis?.latest?.year || 2025;
  const priorYear = currentYear - 1;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <style>{styles}</style>
      
      {/* ========== NAV BAR ========== */}
      <nav className="sticky top-0 z-50 nav-blur" style={{
        background: 'rgba(255, 255, 255, 0.72)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14">
            <a href="/" className="flex items-center gap-3">
              <img 
                src="/iceland-insights-logo.png" 
                alt="Iceland Insights" 
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              />
            </a>
            
            <div className="flex items-center gap-1">
              <a href="/arrivals" className="nav-link">Arrivals</a>
              <a href="/spending" className="nav-link active">Card Spending</a>
              <a href="/hotels" className="nav-link" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                Hotels
                <span className="ml-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Soon</span>
              </a>
            </div>
            
            <div className="hidden md:block">
              <span className="text-xs text-neutral-400">
                Data: Central Bank of Iceland
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* ========== MAIN CONTENT ========== */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        
        {/* Page Title */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Foreign Card Spending</h1>
          <p className="text-sm text-neutral-500 mt-1">Debit & credit card turnover from foreign visitors · Inflation-adjusted analysis</p>
        </div>

        {kpis && (
          <>
            {/* ========== KEY METRICS ROW ========== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              
              {/* TTM Total */}
              <div className="card p-5 animate-fade-in delay-1">
                <div className="metric-label mb-2">Trailing 12 Months</div>
                <div className="metric-value">{(kpis.ttmTotal / 1000).toFixed(1)}B</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`badge ${kpis.ttmRealChange >= 0.05 ? 'badge-success' : kpis.ttmRealChange <= -0.05 ? 'badge-danger' : 'badge-neutral'}`}>
                    {kpis.ttmRealChange >= 0.05 ? <TrendingUp className="w-3 h-3" /> : 
                     kpis.ttmRealChange <= -0.05 ? <TrendingDown className="w-3 h-3" /> : 
                     <Minus className="w-3 h-3" />}
                    {formatPct(kpis.ttmRealChange)}%
                  </span>
                  <span className="text-xs text-neutral-400">real</span>
                </div>
              </div>
              
              {/* Current Month */}
              <div className="card p-5 animate-fade-in delay-1">
                <div className="metric-label mb-2">{kpis.currentMonth}</div>
                <div className="metric-value">{(kpis.currentValue / 1000).toFixed(1)}B</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`badge ${kpis.realYoyChange >= 0.05 ? 'badge-success' : kpis.realYoyChange <= -0.05 ? 'badge-danger' : 'badge-neutral'}`}>
                    {kpis.realYoyChange >= 0.05 ? <TrendingUp className="w-3 h-3" /> : 
                     kpis.realYoyChange <= -0.05 ? <TrendingDown className="w-3 h-3" /> : 
                     <Minus className="w-3 h-3" />}
                    {formatPct(kpis.realYoyChange)}%
                  </span>
                  <span className="text-xs text-neutral-400">YoY real</span>
                </div>
              </div>
              
              {/* Spend per Visitor */}
              <div className="card p-5 animate-fade-in delay-2">
                <div className="metric-label mb-2">Per Visitor</div>
                <div className="metric-value">{kpis.currentSpv ? `${Math.round(kpis.currentSpv)}k` : '—'}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`badge ${kpis.spvRealChange >= 0.05 ? 'badge-success' : kpis.spvRealChange <= -0.05 ? 'badge-danger' : 'badge-neutral'}`}>
                    {kpis.spvRealChange >= 0.05 ? <TrendingUp className="w-3 h-3" /> : 
                     kpis.spvRealChange <= -0.05 ? <TrendingDown className="w-3 h-3" /> : 
                     <Minus className="w-3 h-3" />}
                    {formatPct(kpis.spvRealChange)}%
                  </span>
                  <span className="text-xs text-neutral-400">real</span>
                </div>
              </div>
              
              {/* Visitors */}
              <div className="card p-5 animate-fade-in delay-2">
                <div className="metric-label mb-2">Visitors</div>
                <div className="metric-value">{kpis.arrivals ? `${(kpis.arrivals / 1000).toFixed(0)}k` : '—'}</div>
                <div className="flex items-center gap-2 mt-2">
                  {kpis.lastYearArrivals && (
                    <>
                      <span className={`badge ${
                        kpis.arrivals >= kpis.lastYearArrivals ? 'badge-success' : 'badge-danger'
                      }`}>
                        {kpis.arrivals >= kpis.lastYearArrivals ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatPct(((kpis.arrivals - kpis.lastYearArrivals) / kpis.lastYearArrivals) * 100)}%
                      </span>
                      <span className="text-xs text-neutral-400">YoY</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ========== PRIMARY CHART: Monthly Comparison ========== */}
            <div className="card p-6 mb-6 animate-fade-in delay-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div>
                  <h2 className="section-title">Monthly Card Turnover</h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    {priorYear} vs {currentYear} · Inflation-adjusted to {priorYear} ISK
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-neutral-300"></div>
                    <span className="text-xs text-neutral-500">{priorYear}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500"></div>
                    <span className="text-xs text-neutral-500">{currentYear}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-indigo-500 rounded"></div>
                    <span className="text-xs text-neutral-500">YoY %</span>
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={monthlyChartData} margin={{ top: 10, right: 50, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${(value/1000).toFixed(0)}B`}
                    width={45}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#6366F1' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`}
                    width={45}
                    domain={[-20, 20]}
                  />
                  <ReferenceLine yAxisId="right" y={0} stroke="#6366F1" strokeWidth={2} strokeOpacity={0.7} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                    formatter={(value: any, name: string) => {
                      if (value === null) return ['—', name];
                      if (name === 'YoY Change') return [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, 'YoY Change'];
                      return [`${(value/1000).toFixed(2)}B ISK`, name];
                    }}
                  />
                  <Bar yAxisId="left" dataKey={String(priorYear)} fill="#D1D5DB" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar yAxisId="left" dataKey={String(currentYear)} fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line 
                    yAxisId="right"
                    type="monotone"
                    dataKey="yoyChange"
                    name="YoY Change"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366F1', stroke: '#fff', strokeWidth: 2, r: 4 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* ========== SECONDARY CHART: Spending per Visitor ========== */}
            <div className="card p-6 mb-6 animate-fade-in delay-3" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDFA 100%)' }}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="section-title">Spending per Visitor</h2>
                    <span className="badge badge-success text-[10px]">Key Metric</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Real ISK per foreign visitor · Adjusted to {priorYear} prices
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-neutral-300"></div>
                    <span className="text-xs text-neutral-500">{priorYear}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-600"></div>
                    <span className="text-xs text-neutral-500">{currentYear}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-indigo-500 rounded"></div>
                    <span className="text-xs text-neutral-500">YoY %</span>
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={spvChartData} margin={{ top: 10, right: 50, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" vertical={false} />
                  <XAxis 
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${Math.round(value)}k`}
                    width={45}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#6366F1' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`}
                    width={45}
                    domain={[-25, 25]}
                  />
                  <ReferenceLine yAxisId="right" y={0} stroke="#6366F1" strokeWidth={2} strokeOpacity={0.7} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #D1FAE5',
                      borderRadius: '10px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                    formatter={(value: any, name: string) => {
                      if (!value) return ['—', name];
                      if (name === 'YoY Change') return [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, 'YoY Change'];
                      return [`${Math.round(value).toLocaleString()}k ISK`, name];
                    }}
                  />
                  <Bar yAxisId="left" dataKey={String(priorYear)} fill="#9CA3AF" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar yAxisId="left" dataKey={String(currentYear)} fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line 
                    yAxisId="right"
                    type="monotone"
                    dataKey="yoyChange"
                    name="YoY Change"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366F1', stroke: '#fff', strokeWidth: 2, r: 4 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
              
              <div className="mt-4 pt-4 border-t border-emerald-200/50 flex items-start gap-2">
                <span className="text-emerald-600">💡</span>
                <p className="text-xs text-emerald-700">
                  This metric controls for both visitor volume and inflation — showing how much each tourist actually spends in real purchasing power.
                </p>
              </div>
            </div>

            {/* ========== ANNUAL TOTALS CHART ========== */}
            <div className="card p-6 mb-6 animate-fade-in delay-3">
              <div className="mb-6">
                <h2 className="section-title">Annual Card Turnover</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Total foreign card spending by year (nominal ISK billions)
                </p>
              </div>
              
              <ResponsiveContainer width="100%" height={260}>
                <BarChart 
                  data={(() => {
                    const yearTotals: Record<number, { total: number; months: number }> = {};
                    data.forEach(row => {
                      if (row.year >= 2017) {
                        if (!yearTotals[row.year]) yearTotals[row.year] = { total: 0, months: 0 };
                        yearTotals[row.year].total += row.Heildarúttekt || 0;
                        yearTotals[row.year].months += 1;
                      }
                    });
                    
                    return Object.entries(yearTotals)
                      .map(([year, d]) => ({
                        year: year,
                        label: parseInt(year) === currentYear ? `${year} YTD` : year,
                        value: d.total,
                        isCovid: parseInt(year) >= 2020 && parseInt(year) <= 2022,
                        isPartial: parseInt(year) === currentYear
                      }))
                      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
                  })()}
                  margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${(val/1000).toFixed(0)}B`}
                    width={45}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                    formatter={(value: any) => [`${(value/1000).toFixed(1)}B ISK`]}
                    labelFormatter={(label) => `Year: ${label}`}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  >
                    {(() => {
                      const yearTotals: Record<number, { total: number; months: number }> = {};
                      data.forEach(row => {
                        if (row.year >= 2017) {
                          if (!yearTotals[row.year]) yearTotals[row.year] = { total: 0, months: 0 };
                          yearTotals[row.year].total += row.Heildarúttekt || 0;
                          yearTotals[row.year].months += 1;
                        }
                      });
                      
                      return Object.keys(yearTotals)
                        .sort((a, b) => parseInt(a) - parseInt(b))
                        .map((year, index) => {
                          const y = parseInt(year);
                          const isCovid = y >= 2020 && y <= 2022;
                          const isPartial = y === currentYear;
                          let fill = '#10B981';
                          if (isCovid) fill = '#D1D5DB';
                          if (isPartial) fill = '#6EE7B7';
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        });
                    })()}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500"></div>
                  <span className="text-xs text-neutral-500">Normal years</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-neutral-300"></div>
                  <span className="text-xs text-neutral-500">COVID years</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-300"></div>
                  <span className="text-xs text-neutral-500">Year to date</span>
                </div>
              </div>
            </div>

            {/* ========== METHODOLOGY NOTE ========== */}
            <div className="card p-5 animate-fade-in delay-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-neutral-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">Methodology</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    All values are inflation-adjusted using month-by-month CPI deflation from Statistics Iceland. 
                    This converts nominal ISK to constant {priorYear} ISK, enabling accurate year-over-year comparisons 
                    that reflect real purchasing power rather than nominal currency amounts.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-neutral-200 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-xs text-neutral-400">
              Data sources: Central Bank of Iceland (spending) · Statistics Iceland (CPI, arrivals)
            </div>
            <div className="text-xs text-neutral-400">
              Last updated: {metadata?.lastUpdated || '—'}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SpendingDashboard;
