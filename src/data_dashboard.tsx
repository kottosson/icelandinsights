import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, TrendingUp, TrendingDown, Minus, Share2 } from 'lucide-react';

export default function DataDashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Farþegar alls');
  const [selectedCategories, setSelectedCategories] = useState(['Farþegar alls']);
  const [categories, setCategories] = useState([]);
  const [insights, setInsights] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Country name translations and continent mapping - ALL 32 countries
  const countryInfo = {
    // Totals
    'Farþegar alls': { name: 'All Passengers', continent: 'Total', color: '#007AFF' },
    'Útlendingar alls': { name: 'Foreign Passengers', continent: 'Total', color: '#FF375F' },
    'Ísland': { name: 'Iceland', continent: 'Europe', color: '#003897' },
    
    // North America
    'Bandaríkin': { name: 'United States', continent: 'North America', color: '#B22234' },
    'Kanada': { name: 'Canada', continent: 'North America', color: '#FF0000' },
    
    // Europe
    'Austurríki': { name: 'Austria', continent: 'Europe', color: '#ED2939' },
    'Belgía': { name: 'Belgium', continent: 'Europe', color: '#FDDA24' },
    'Bretland': { name: 'United Kingdom', continent: 'Europe', color: '#012169' },
    'Danmörk': { name: 'Denmark', continent: 'Europe', color: '#C60C30' },
    'Eistland / Lettland / Litháen': { name: 'Baltics', continent: 'Europe', color: '#0072CE' },
    'Finnland': { name: 'Finland', continent: 'Europe', color: '#003580' },
    'Frakkland': { name: 'France', continent: 'Europe', color: '#0055A4' },
    'Holland': { name: 'Netherlands', continent: 'Europe', color: '#FF4F00' },
    'Írland': { name: 'Ireland', continent: 'Europe', color: '#169B62' },
    'Ítalía': { name: 'Italy', continent: 'Europe', color: '#009246' },
    'Noregur': { name: 'Norway', continent: 'Europe', color: '#BA0C2F' },
    'Pólland': { name: 'Poland', continent: 'Europe', color: '#DC143C' },
    'Rússland': { name: 'Russia', continent: 'Europe', color: '#0039A6' },
    'Spánn': { name: 'Spain', continent: 'Europe', color: '#C60B1E' },
    'Sviss': { name: 'Switzerland', continent: 'Europe', color: '#FF0000' },
    'Svíþjóð': { name: 'Sweden', continent: 'Europe', color: '#006AA7' },
    'Þýskaland': { name: 'Germany', continent: 'Europe', color: '#000000' },
    
    // Asia
    'Hong Kong': { name: 'Hong Kong', continent: 'Asia', color: '#DE2910' },
    'Indland': { name: 'India', continent: 'Asia', color: '#FF9933' },
    'Japan': { name: 'Japan', continent: 'Asia', color: '#BC002D' },
    'Kína': { name: 'China', continent: 'Asia', color: '#DE2910' },
    'Singapúr': { name: 'Singapore', continent: 'Asia', color: '#ED2939' },
    'Suður-Kórea': { name: 'South Korea', continent: 'Asia', color: '#003478' },
    'Taívan': { name: 'Taiwan', continent: 'Asia', color: '#FE0000' },
    'Ísrael': { name: 'Israel', continent: 'Asia', color: '#0038B8' },
    
    // Oceania
    'Ástralía / Nýja-Sjáland': { name: 'Australia / NZ', continent: 'Oceania', color: '#012169' },
    
    // Other
    'Önnur þjóðerni': { name: 'Other Nationalities', continent: 'Other', color: '#8E8E93' }
  };

  const getCountryName = (icelandic) => countryInfo[icelandic]?.name || icelandic;
  const getCountryColor = (icelandic) => countryInfo[icelandic]?.color || '#007AFF';
  const getContinent = (icelandic) => countryInfo[icelandic]?.continent || 'Other';

  useEffect(() => {
    // Load data from JSON file
    const loadData = async () => {
      try {
        const response = await fetch('/data.json');
        const jsonData = await response.json();
        
        const fullData = [];
        
        // Load ALL countries from the data dynamically
        Object.entries(jsonData.monthlyData).forEach(([dateStr, values]) => {
          const [year, month] = dateStr.split('-').map(Number);
          
          // Load all countries that have data
          Object.entries(values).forEach(([country, value]) => {
            if (value > 0) {
              fullData.push({
                date: `${year}-${String(month).padStart(2, '0')}-01`,
                year,
                month,
                flokkur: country,
                fjöldi: value
              });
            }
          });
        });
        
        setData(fullData);
        const uniqueCategories = [...new Set(fullData.map(row => row.flokkur))];
        setCategories(uniqueCategories);
        setSelectedCategory('Farþegar alls');
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);


  useEffect(() => {
    if (data.length > 0 && selectedCategories.length > 0) {
      const filtered = data
        .filter(row => selectedCategories.includes(row.flokkur))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setFilteredData(filtered);
      
      if (selectedCategories.includes('Farþegar alls')) {
        const foreignPassengers = data.filter(row => row.flokkur === 'Útlendingar alls');
        generateInsightsAndKPIs(data, foreignPassengers);
      }
    }
  }, [selectedCategories, data]);

  const generateInsightsAndKPIs = async (allData, filteredData) => {
    setLoading(true);
    
    const currentMonth = filteredData[filteredData.length - 1];
    const lastYearSameMonth = filteredData[filteredData.length - 13];
    const yoyChange = lastYearSameMonth ? 
      ((currentMonth.fjöldi - lastYearSameMonth.fjöldi) / lastYearSameMonth.fjöldi * 100) : 0;
    
    const ttmData = filteredData.slice(-12);
    const ttmTotal = ttmData.reduce((sum, r) => sum + r.fjöldi, 0);
    const lastTtmData = filteredData.slice(-24, -12);
    const lastTtmTotal = lastTtmData.reduce((sum, r) => sum + r.fjöldi, 0);
    const ttmChange = lastTtmTotal ? ((ttmTotal - lastTtmTotal) / lastTtmTotal * 100) : 0;
    
    const ltmData = allData.filter(row => {
      const date = new Date(row.date);
      const cutoff = new Date(currentMonth.date);
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      return date > cutoff;
    });
    
    const nationalityTotals = {};
    ltmData.forEach(row => {
      if (row.flokkur !== 'Farþegar alls' && row.flokkur !== 'Ísland' && row.flokkur !== 'Útlendingar alls') {
        nationalityTotals[row.flokkur] = (nationalityTotals[row.flokkur] || 0) + row.fjöldi;
      }
    });
    
    const foreignTotal = Object.values(nationalityTotals).reduce((a, b) => a + b, 0);
    
    // Calculate biggest gainers and losers FIRST (moved up)
    const nationalityChanges = {};
    
    Object.keys(nationalityTotals).forEach(nat => {
      const currentTtmData = ltmData.filter(row => row.flokkur === nat);
      const priorTtmData = allData.filter(row => {
        const date = new Date(row.date);
        const startCutoff = new Date(currentMonth.date);
        startCutoff.setFullYear(startCutoff.getFullYear() - 2);
        const endCutoff = new Date(currentMonth.date);
        endCutoff.setFullYear(endCutoff.getFullYear() - 1);
        return date > startCutoff && date <= endCutoff && row.flokkur === nat;
      });
      
      const currentTotal = currentTtmData.reduce((sum, r) => sum + r.fjöldi, 0);
      const priorTotal = priorTtmData.reduce((sum, r) => sum + r.fjöldi, 0);
      const absoluteChange = currentTotal - priorTotal;
      const percentChange = priorTotal > 0 ? (absoluteChange / priorTotal * 100) : 0;
      
      nationalityChanges[nat] = { absoluteChange, percentChange, current: currentTotal, prior: priorTotal };
    });
    
    // Now create top10 using absolute change from nationalityChanges
    const top10 = Object.entries(nationalityTotals)
      .map(([nat, total]) => {
        const changes = nationalityChanges[nat] || { absoluteChange: 0, percentChange: 0 };
        const ratio = (total / foreignTotal * 100);
        return { 
          nat, 
          total, 
          absoluteChange: changes.absoluteChange,
          yoy: changes.percentChange,
          ratio 
        };
      })
      .sort((a, b) => b.ratio - a.ratio)  // Sort by % of Total
      .slice(0, 10);
    
    const top10WithYoY = top10;  // Already has all the data we need
    
    const sortedByGrowth = Object.entries(nationalityChanges)
      .sort((a, b) => b[1].absoluteChange - a[1].absoluteChange);
    
    const topGrower = sortedByGrowth[0];
    
    // Find largest decline (most negative absolute change)
    const decliners = Object.entries(nationalityChanges)
      .filter(([_, data]) => data.absoluteChange < 0)
      .sort((a, b) => a[1].absoluteChange - b[1].absoluteChange); // Sort ascending (most negative first)
    
    const topDecliner = decliners.length > 0 ? decliners[0] : sortedByGrowth[sortedByGrowth.length - 1];
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthName = monthNames[currentMonth.month - 1];
    const lastYearMonthName = monthNames[lastYearSameMonth.month - 1];
    
    const ttmStart = new Date(ttmData[0].date);
    const ttmEnd = new Date(ttmData[ttmData.length - 1].date);
    const ttmPeriod = `${monthNames[ttmStart.getMonth()]} ${ttmStart.getFullYear()} - ${monthNames[ttmEnd.getMonth()]} ${ttmEnd.getFullYear()}`;
    
    // Calculate prior TTM period (one year earlier)
    const priorTtmStart = new Date(ttmStart);
    priorTtmStart.setFullYear(priorTtmStart.getFullYear() - 1);
    const priorTtmEnd = new Date(ttmEnd);
    priorTtmEnd.setFullYear(priorTtmEnd.getFullYear() - 1);
    const priorTtmPeriod = `${monthNames[priorTtmStart.getMonth()]} ${priorTtmStart.getFullYear()} - ${monthNames[priorTtmEnd.getMonth()]} ${priorTtmEnd.getFullYear()}`;
    
    // Calculate continent breakdown
    const continentTotals = {};
    const continentPriorTotals = {};
    
    Object.entries(nationalityTotals).forEach(([nat, total]) => {
      const continent = getContinent(nat);
      continentTotals[continent] = (continentTotals[continent] || 0) + total;
    });
    
    // Calculate prior TTM for continents
    Object.keys(continentTotals).forEach(continent => {
      const continentCountries = Object.keys(nationalityTotals).filter(nat => getContinent(nat) === continent);
      const priorTotal = continentCountries.reduce((sum, nat) => {
        const priorData = allData.filter(row => {
          const date = new Date(row.date);
          const startCutoff = new Date(currentMonth.date);
          startCutoff.setFullYear(startCutoff.getFullYear() - 2);
          const endCutoff = new Date(currentMonth.date);
          endCutoff.setFullYear(endCutoff.getFullYear() - 1);
          return date > startCutoff && date <= endCutoff && row.flokkur === nat;
        });
        return sum + priorData.reduce((s, r) => s + r.fjöldi, 0);
      }, 0);
      continentPriorTotals[continent] = priorTotal;
    });
    
    const continentData = Object.entries(continentTotals)
      .map(([continent, total]) => ({
        continent,
        total,
        prior: continentPriorTotals[continent] || 0,
        change: total - (continentPriorTotals[continent] || 0),
        yoy: continentPriorTotals[continent] > 0 ? ((total - continentPriorTotals[continent]) / continentPriorTotals[continent] * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
    
    setKpis({
      currentMonth: currentMonth.fjöldi.toLocaleString(),
      currentMonthName: `${currentMonthName} ${currentMonth.year}`,
      lastYearMonth: lastYearSameMonth.fjöldi.toLocaleString(),
      lastYearMonthName: `${lastYearMonthName} ${lastYearSameMonth.year}`,
      yoyChange,
      ttmTotal: ttmTotal.toLocaleString(),
      ttmPeriod,
      priorTtmPeriod,
      lastTtmTotal: lastTtmTotal.toLocaleString(),
      ttmChange,
      topGrower: {
        name: topGrower[0],
        change: topGrower[1].absoluteChange.toLocaleString(),
        percent: topGrower[1].percentChange,
        current: topGrower[1].current,
        prior: topGrower[1].prior
      },
      topDecliner: {
        name: topDecliner[0],
        change: Math.abs(topDecliner[1].absoluteChange).toLocaleString(),
        percent: topDecliner[1].percentChange,
        current: topDecliner[1].current,
        prior: topDecliner[1].prior
      },
      top10: top10WithYoY,
      continents: continentData
    });
    
    // Load insights from JSON file
    try {
      const insightsResponse = await fetch('/insights.json');
      const insightsData = await insightsResponse.json();
      
      const parsedInsights = insightsData.insights.map(insight => ({
        category: insight.title,
        text: insight.text
      }));
      
      setInsights(parsedInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
      setInsights([
        { category: 'Main Trends Over Time', text: 'Data loading...' },
        { category: 'Seasonal Patterns', text: 'Data loading...' },
        { category: 'Market Evolution', text: 'Data loading...' },
        { category: 'Change Drivers', text: 'Data loading...' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (cat) => {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) {
        return prev.length > 1 ? prev.filter(c => c !== cat) : prev;
      } else {
        return prev.length < 2 ? [...prev, cat] : [prev[1], cat];
      }
    });
  };

  const shareKPI = async (kpiName, kpiData) => {
    const shareText = `KEF Airport - ${kpiName}\n${kpiData}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `KEF Airport - ${kpiName}`,
          text: shareText,
        });
      } catch (err) {
        // User cancelled or share failed, copy to clipboard instead
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(shareText);
          alert('Copied to clipboard!');
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Copied to clipboard!');
    }
  };

  const exportToExcel = () => {
    // Create CSV content from filtered data
    const headers = ['Date', 'Category', 'Passengers'];
    const rows = filteredData.map(row => [
      new Date(row.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      getCountryName(row.flokkur),
      row.fjöldi
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kef_passenger_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare data for charts - create merged dataset with all selected categories
  const prepareChartData = () => {
    if (selectedCategories.length === 0) return [];
    
    const last24Dates = [...new Set(filteredData.slice(-24).map(d => d.date))].sort();
    
    return last24Dates.map(date => {
      const row = { date };
      selectedCategories.forEach(cat => {
        const dataPoint = filteredData.find(d => d.date === date && d.flokkur === cat);
        row[cat] = dataPoint ? dataPoint.fjöldi : null;
      });
      return row;
    });
  };

  const chartData = prepareChartData();
  const chartColors = selectedCategories.map(cat => getCountryColor(cat));

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="mb-20">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h1 className="text-5xl lg:text-6xl font-semibold text-neutral-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                Iceland Insights
              </h1>
              <p className="text-base lg:text-lg text-neutral-500 font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                Keflavík Airport Passenger Analytics
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-neutral-400 font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                Source: <a href="https://www.statice.is/" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-neutral-600 transition-colors">Statistics Iceland</a>
              </p>
            </div>
          </div>
        </div>

        {kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm relative">
              <button 
                onClick={() => shareKPI('Monthly Passengers', `${kpis.currentMonth} passengers in ${kpis.currentMonthName}\n${kpis.yoyChange > 0 ? '+' : ''}${kpis.yoyChange.toFixed(1)}% YoY vs ${kpis.lastYearMonthName}`)}
                className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
              </button>
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1 font-semibold">Monthly Passengers</p>
              <p className="text-[9px] text-neutral-400 mb-2">{kpis.currentMonthName}</p>
              <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                <p className="text-2xl lg:text-3xl font-semibold text-neutral-900" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                  {kpis.currentMonth}
                </p>
              </div>
              <p className="text-xs text-neutral-600 mb-3">
                vs {kpis.lastYearMonth} in {kpis.lastYearMonthName}
              </p>
              <div className="flex items-center gap-2">
                {kpis.yoyChange >= 0.5 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : 
                 kpis.yoyChange <= -0.5 ? <TrendingDown className="w-4 h-4 text-rose-600" /> :
                 <Minus className="w-4 h-4 text-neutral-400" />}
                <span className={`text-sm font-semibold ${
                  kpis.yoyChange >= 0.5 ? 'text-emerald-600' : 
                  kpis.yoyChange <= -0.5 ? 'text-rose-600' : 'text-neutral-500'
                }`}>
                  {kpis.yoyChange > 0 ? '+' : ''}{kpis.yoyChange.toFixed(1)}% YoY
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm relative">
              <button 
                onClick={() => shareKPI('TTM - Foreign Passengers', `${kpis.ttmTotal} passengers (${kpis.ttmPeriod})\n${kpis.ttmChange > 0 ? '+' : ''}${kpis.ttmChange.toFixed(1)}% vs prior TTM`)}
                className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
              </button>
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1 font-semibold">TTM - Foreign Passengers</p>
              <p className="text-[9px] text-neutral-400 mb-2">{kpis.ttmPeriod}</p>
              <p className="text-2xl lg:text-3xl font-semibold text-neutral-900 mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                {kpis.ttmTotal}
              </p>
              <p className="text-xs text-neutral-600 mb-3">
                vs {kpis.lastTtmTotal} {kpis.priorTtmPeriod}
              </p>
              <div className="flex items-center gap-2">
                {kpis.ttmChange >= 0.5 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : 
                 kpis.ttmChange <= -0.5 ? <TrendingDown className="w-4 h-4 text-rose-600" /> :
                 <Minus className="w-4 h-4 text-neutral-400" />}
                <span className={`text-sm font-semibold ${
                  kpis.ttmChange >= 0.5 ? 'text-emerald-600' : 
                  kpis.ttmChange <= -0.5 ? 'text-rose-600' : 'text-neutral-500'
                }`}>
                  {kpis.ttmChange > 0 ? '+' : ''}{kpis.ttmChange.toFixed(1)}% vs prior TTM
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm relative">
              <button 
                onClick={() => shareKPI('TTM - Largest Gain', `${getCountryName(kpis.topGrower.name)}\n${kpis.topGrower.current.toLocaleString()} vs ${kpis.topGrower.prior.toLocaleString()} prior TTM\n+${kpis.topGrower.change} (+${kpis.topGrower.percent.toFixed(1)}%)`)}
                className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
              </button>
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1 font-semibold">TTM - Largest Gain</p>
              <p className="text-[9px] text-neutral-400 mb-2">{kpis.ttmPeriod}</p>
              <p className="text-xl lg:text-2xl font-semibold text-neutral-900 mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                {getCountryName(kpis.topGrower.name)}
              </p>
              <p className="text-xs text-neutral-600 mb-3">
                {kpis.topGrower.current.toLocaleString()} vs {kpis.topGrower.prior.toLocaleString()} {kpis.priorTtmPeriod}
              </p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-600">
                  +{kpis.topGrower.change} (+{kpis.topGrower.percent.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm relative">
              <button 
                onClick={() => shareKPI('TTM - Largest Decline', `${getCountryName(kpis.topDecliner.name)}\n${kpis.topDecliner.current.toLocaleString()} vs ${kpis.topDecliner.prior.toLocaleString()} prior TTM\n-${kpis.topDecliner.change} (${kpis.topDecliner.percent.toFixed(1)}%)`)}
                className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
              </button>
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1 font-semibold">TTM - Largest Decline</p>
              <p className="text-[9px] text-neutral-400 mb-2">{kpis.ttmPeriod}</p>
              <p className="text-xl lg:text-2xl font-semibold text-neutral-900 mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                {getCountryName(kpis.topDecliner.name)}
              </p>
              <p className="text-xs text-neutral-600 mb-3">
                {kpis.topDecliner.current.toLocaleString()} vs {kpis.topDecliner.prior.toLocaleString()} {kpis.priorTtmPeriod}
              </p>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-semibold text-rose-600">
                  -{kpis.topDecliner.change} ({kpis.topDecliner.percent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-neutral-900" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
              Key Insights
            </h2>
            {loading && <Sparkles className="w-4 h-4 text-neutral-400 animate-pulse" />}
          </div>
          {insights.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
              {insights.map((insight, i) => (
                <div key={i}>
                  <p className="text-xs font-semibold text-neutral-900 mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {insight.category}
                  </p>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400">Generating insights...</p>
          )}
        </div>

        {kpis && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-neutral-900 mb-5" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                Top 10 Markets (TTM)
              </h3>
              <div className="grid grid-cols-6 gap-2 mb-3 pb-2 border-b border-neutral-200">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium col-span-2">Nationality</p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium text-right">Passengers</p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium text-right">Change</p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium text-right">% Total</p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium text-right">YoY %</p>
              </div>
              <div className="space-y-1">
                {kpis.top10.map((item, i) => (
                  <div key={i} className="grid grid-cols-6 gap-2 py-1.5">
                    <div className="flex items-center gap-2 col-span-2">
                      <span className="text-[10px] text-neutral-400 w-4">{i + 1}</span>
                      <span className="text-xs text-neutral-700">{getCountryName(item.nat)}</span>
                    </div>
                    <span className="text-xs text-neutral-500 font-mono text-right">{item.total.toLocaleString()}</span>
                    <span className={`text-xs font-medium text-right ${
                      item.absoluteChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {item.absoluteChange >= 0 ? '+' : ''}{item.absoluteChange.toLocaleString()}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono text-right">{item.ratio.toFixed(1)}%</span>
                    <span className={`text-xs font-medium text-right ${
                      item.yoy >= 0.5 ? 'text-emerald-600' : 
                      item.yoy <= -0.5 ? 'text-rose-600' : 'text-neutral-400'
                    }`}>
                      {item.yoy > 0 ? '+' : ''}{item.yoy.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-1 bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-neutral-900 mb-5" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                By Continent (TTM)
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-3 pb-2 border-b border-neutral-200">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Region</p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium text-right">Passengers</p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium text-right">YoY %</p>
              </div>
              <div className="space-y-3">
                {kpis.continents.map((continent, i) => (
                  <div key={i} className="pb-3 border-b border-neutral-100 last:border-0">
                    <div className="grid grid-cols-3 gap-2 items-baseline">
                      <span className="text-xs font-semibold text-neutral-900">{continent.continent}</span>
                      <span className="text-xs text-neutral-700 font-mono text-right">
                        {continent.total.toLocaleString()}
                      </span>
                      <span className={`text-xs font-semibold text-right ${
                        continent.yoy >= 0.5 ? 'text-emerald-600' : 
                        continent.yoy <= -0.5 ? 'text-rose-600' : 'text-neutral-400'
                      }`}>
                        {continent.yoy > 0 ? '+' : ''}{continent.yoy.toFixed(1)}%
                      </span>
                    </div>
                    <div className={`text-[10px] font-mono mt-1 ${
                      continent.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {continent.change >= 0 ? '+' : ''}{continent.change.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryToggle(cat)}
              className={`px-3 py-1.5 rounded text-xs font-light transition-all ${
                selectedCategories.includes(cat)
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {getCountryName(cat)}
            </button>
          ))}
          <p className="text-xs text-neutral-400 self-center ml-2">Select up to 2</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="date"
                  stroke="#8e8e93" 
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
                    return `${monthNames[d.getMonth()]}${d.getMonth() === 0 ? `'${d.getFullYear().toString().slice(2)}` : ''}`;
                  }}
                />
                <YAxis 
                  stroke="#8e8e93" 
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
                  }}
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                />
                {selectedCategories.map((cat, idx) => (
                  <Bar 
                    key={cat}
                    dataKey={cat}
                    fill={chartColors[idx % chartColors.length]}
                    radius={[4, 4, 0, 0]}
                    name={cat}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="date"
                  stroke="#8e8e93"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
                    return `${monthNames[d.getMonth()]}${d.getMonth() === 0 ? `'${d.getFullYear().toString().slice(2)}` : ''}`;
                  }}
                />
                <YAxis 
                  stroke="#8e8e93"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
                  }}
                  cursor={{ stroke: '#e5e5e5', strokeWidth: 1 }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                />
                {selectedCategories.map((cat, idx) => (
                  <Line 
                    key={cat}
                    type="monotone" 
                    dataKey={cat}
                    stroke={chartColors[idx % chartColors.length]}
                    strokeWidth={2.5}
                    dot={{ fill: '#fff', stroke: chartColors[idx % chartColors.length], strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                    name={cat}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded border border-neutral-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-neutral-900">Data Table</h3>
            <button
              onClick={exportToExcel}
              className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-4 py-2 text-[10px] font-medium text-neutral-500 tracking-widest uppercase">Date</th>
                  <th className="text-left px-4 py-2 text-[10px] font-medium text-neutral-500 tracking-widest uppercase">Category</th>
                  <th className="text-right px-4 py-2 text-[10px] font-medium text-neutral-500 tracking-widest uppercase">Passengers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredData.slice(-12).reverse().map((row, i) => (
                  <tr key={i} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-2 text-xs text-neutral-700">
                      {new Date(row.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-2 text-xs text-neutral-600">{getCountryName(row.flokkur)}</td>
                    <td className="px-4 py-2 text-xs text-neutral-700 text-right font-mono">
                      {row.fjöldi?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}