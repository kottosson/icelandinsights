import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sparkles, TrendingUp, TrendingDown, Minus, Share2 } from 'lucide-react';

export default function DataDashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Útlendingar alls');
  const [selectedCategories, setSelectedCategories] = useState(['Útlendingar alls']);
  const [categories, setCategories] = useState([]);
  const [insights, setInsights] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [staticTop10, setStaticTop10] = useState(null); // Static Top 10 that never changes

  // Country name translations and continent mapping - ALL 32 countries
  const countryInfo = {
    // Totals
    'Farþegar alls': { name: 'All Passengers', continent: 'Total', color: '#1C1C1E' },
    'Útlendingar alls': { name: 'Foreign Passengers', continent: 'Total', color: '#6B7C8C' },
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
  const getCountryColor = (icelandic) => countryInfo[icelandic]?.color || '#6B7C8C';
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
        setSelectedCategory('Útlendingar alls');
        
        // Calculate static Top 10 once - never changes after this
        calculateStaticTop10(fullData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  // Calculate Top 10 ONCE - completely independent of filters
  const calculateStaticTop10 = (allData) => {
    const foreignPassengerData = allData.filter(row => 
      row.flokkur !== 'Farþegar alls' && 
      row.flokkur !== 'Ísland' && 
      row.flokkur !== 'Útlendingar alls'
    );
    
    // Get last month's date for TTM calculation
    const sortedData = [...foreignPassengerData].sort((a, b) => new Date(b.date) - new Date(a.date));
    const currentMonth = sortedData[0];
    
    const ltmData = foreignPassengerData.filter(row => {
      const date = new Date(row.date);
      const cutoff = new Date(currentMonth.date);
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      return date > cutoff;
    });
    
    const nationalityTotals = {};
    ltmData.forEach(row => {
      nationalityTotals[row.flokkur] = (nationalityTotals[row.flokkur] || 0) + row.fjöldi;
    });
    
    const foreignTotal = Object.values(nationalityTotals).reduce((a, b) => a + b, 0);
    
    // Calculate prior TTM foreign total for "Other" calculation
    const priorLtmData = foreignPassengerData.filter(row => {
      const date = new Date(row.date);
      const startCutoff = new Date(currentMonth.date);
      startCutoff.setFullYear(startCutoff.getFullYear() - 2);
      const endCutoff = new Date(currentMonth.date);
      endCutoff.setFullYear(endCutoff.getFullYear() - 1);
      return date > startCutoff && date <= endCutoff;
    });
    
    const priorForeignTotal = priorLtmData.reduce((sum, r) => sum + r.fjöldi, 0);
    
    // Calculate YoY changes
    const nationalityChanges = {};
    
    Object.keys(nationalityTotals).forEach(nat => {
      const currentTtmData = ltmData.filter(row => row.flokkur === nat);
      const priorTtmData = foreignPassengerData.filter(row => {
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
    
    // Create Top 10
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
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 10);
    
    const sortedByGrowth = Object.entries(nationalityChanges)
      .sort((a, b) => b[1].absoluteChange - a[1].absoluteChange);
    
    const topGrower = sortedByGrowth[0];
    
    const decliners = Object.entries(nationalityChanges)
      .filter(([_, data]) => data.absoluteChange < 0)
      .sort((a, b) => a[1].absoluteChange - b[1].absoluteChange);
    
    const topDecliner = decliners.length > 0 ? decliners[0] : sortedByGrowth[sortedByGrowth.length - 1];
    
    setStaticTop10({
      top10,
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
      ttmTotal: foreignTotal,
      priorTtmTotal: priorForeignTotal
    });
  };



  useEffect(() => {
    if (data.length > 0 && selectedCategories.length > 0 && staticTop10) {
      const filtered = data
        .filter(row => selectedCategories.includes(row.flokkur))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setFilteredData(filtered);
      
      if (selectedCategories.includes('Farþegar alls')) {
        const foreignPassengers = data.filter(row => row.flokkur === 'Útlendingar alls');
        generateInsightsAndKPIs(data, foreignPassengers, selectedCategories);
      } else if (selectedCategories.includes('Útlendingar alls')) {
        generateInsightsAndKPIs(data, filtered, selectedCategories);
      } else {
        generateInsightsAndKPIs(data, filtered, selectedCategories);
      }
    }
  }, [selectedCategories, data, staticTop10]);

  const generateInsightsAndKPIs = async (allData, filteredData, selectedCats = selectedCategories) => {
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
    
    // Top 10 is now completely separate - never recalculated here
    // But we still need nationality totals for continent breakdown
    const foreignPassengerData = allData.filter(row => 
      row.flokkur !== 'Farþegar alls' && 
      row.flokkur !== 'Ísland' && 
      row.flokkur !== 'Útlendingar alls'
    );
    
    const ltmData = foreignPassengerData.filter(row => {
      const date = new Date(row.date);
      const cutoff = new Date(currentMonth.date);
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      return date > cutoff;
    });
    
    const nationalityTotals = {};
    ltmData.forEach(row => {
      nationalityTotals[row.flokkur] = (nationalityTotals[row.flokkur] || 0) + row.fjöldi;
    });
    
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
    
    // Calculate yearly totals for Annual + YTD chart (2017 onwards) - based on selected categories
    const currentYearMonth = currentMonth.month; // e.g., 10 for October (1-indexed)
    
    // Calculate full year totals for 2017-2024 - support multiple series
    const annualData = [];
    
    // Years 2017-2024 (full years)
    for (let year = 2017; year <= 2024; year++) {
      const yearData = { year: year.toString(), label: year.toString() };
      
      selectedCats.forEach(cat => {
        const yearTotal = data.filter(row => {
          const date = new Date(row.date);
          return date.getFullYear() === year && row.flokkur === cat;
        }).reduce((sum, r) => sum + r.fjöldi, 0);
        
        yearData[cat] = yearTotal;
      });
      
      annualData.push(yearData);
    }
    
    // YTD 2025 (Jan to current month inclusive) - support multiple series
    const ytd2025Data = { year: '2025', label: '2025 YTD' };
    selectedCats.forEach(cat => {
      const ytd2025 = data.filter(row => {
        const date = new Date(row.date);
        return date.getFullYear() === 2025 && date.getMonth() + 1 <= currentYearMonth && row.flokkur === cat;
      }).reduce((sum, r) => sum + r.fjöldi, 0);
      
      ytd2025Data[cat] = ytd2025;
    });
    annualData.push(ytd2025Data);
    
    // Calculate YTD comparison for 2017-2025 - support multiple series
    const ytdComparisonData = [];
    
    for (let year = 2017; year <= 2025; year++) {
      const ytdData = { year: year.toString(), label: `${year}` };
      
      selectedCats.forEach(cat => {
        const ytdValue = data.filter(row => {
          const date = new Date(row.date);
          return date.getFullYear() === year && date.getMonth() + 1 <= currentYearMonth && row.flokkur === cat;
        }).reduce((sum, r) => sum + r.fjöldi, 0);
        
        ytdData[cat] = ytdValue;
      });
      
      ytdComparisonData.push(ytdData);
    }
    
    // Calculate 6-month YoY % sparkline data for executive snapshot
    const sixMonthsAgo = new Date(currentMonth.date);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // -5 to include current month = 6 total
    
    // Overall 6-month YoY % trend
    const overallSparkline = [];
    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(sixMonthsAgo);
      targetDate.setMonth(targetDate.getMonth() + i);
      
      // Current year data
      const currentYearData = allData.filter(row => {
        const rowDate = new Date(row.date);
        return rowDate.getMonth() === targetDate.getMonth() && 
               rowDate.getFullYear() === targetDate.getFullYear();
      });
      const currentTotal = currentYearData.reduce((sum, r) => sum + r.fjöldi, 0);
      
      // Prior year data (same month, one year earlier)
      const priorYearData = allData.filter(row => {
        const rowDate = new Date(row.date);
        return rowDate.getMonth() === targetDate.getMonth() && 
               rowDate.getFullYear() === targetDate.getFullYear() - 1;
      });
      const priorTotal = priorYearData.reduce((sum, r) => sum + r.fjöldi, 0);
      
      // Calculate YoY %
      const yoyPercent = priorTotal > 0 ? ((currentTotal - priorTotal) / priorTotal * 100) : 0;
      overallSparkline.push({ value: yoyPercent, month: targetDate.getMonth() + 1 });
    }
    
    // Top grower 6-month YoY % trend
    const topGrowerSparkline = staticTop10?.topGrower ? (() => {
      const sparkline = [];
      for (let i = 0; i < 6; i++) {
        const targetDate = new Date(sixMonthsAgo);
        targetDate.setMonth(targetDate.getMonth() + i);
        
        // Current year data
        const currentYearData = allData.filter(row => {
          const rowDate = new Date(row.date);
          return rowDate.getMonth() === targetDate.getMonth() && 
                 rowDate.getFullYear() === targetDate.getFullYear() &&
                 row.flokkur === staticTop10.topGrower.name;
        });
        const currentTotal = currentYearData.reduce((sum, r) => sum + r.fjöldi, 0);
        
        // Prior year data
        const priorYearData = allData.filter(row => {
          const rowDate = new Date(row.date);
          return rowDate.getMonth() === targetDate.getMonth() && 
                 rowDate.getFullYear() === targetDate.getFullYear() - 1 &&
                 row.flokkur === staticTop10.topGrower.name;
        });
        const priorTotal = priorYearData.reduce((sum, r) => sum + r.fjöldi, 0);
        
        // Calculate YoY %
        const yoyPercent = priorTotal > 0 ? ((currentTotal - priorTotal) / priorTotal * 100) : 0;
        sparkline.push({ value: yoyPercent, month: targetDate.getMonth() + 1 });
      }
      return sparkline;
    })() : [];
    
    // Top decliner 6-month YoY % trend
    const topDeclinerSparkline = staticTop10?.topDecliner ? (() => {
      const sparkline = [];
      for (let i = 0; i < 6; i++) {
        const targetDate = new Date(sixMonthsAgo);
        targetDate.setMonth(targetDate.getMonth() + i);
        
        // Current year data
        const currentYearData = allData.filter(row => {
          const rowDate = new Date(row.date);
          return rowDate.getMonth() === targetDate.getMonth() && 
                 rowDate.getFullYear() === targetDate.getFullYear() &&
                 row.flokkur === staticTop10.topDecliner.name;
        });
        const currentTotal = currentYearData.reduce((sum, r) => sum + r.fjöldi, 0);
        
        // Prior year data
        const priorYearData = allData.filter(row => {
          const rowDate = new Date(row.date);
          return rowDate.getMonth() === targetDate.getMonth() && 
                 rowDate.getFullYear() === targetDate.getFullYear() - 1 &&
                 row.flokkur === staticTop10.topDecliner.name;
        });
        const priorTotal = priorYearData.reduce((sum, r) => sum + r.fjöldi, 0);
        
        // Calculate YoY %
        const yoyPercent = priorTotal > 0 ? ((currentTotal - priorTotal) / priorTotal * 100) : 0;
        sparkline.push({ value: yoyPercent, month: targetDate.getMonth() + 1 });
      }
      return sparkline;
    })() : [];
    
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
      annualData,
      ytdComparisonData,
      // Use static Top 10 that never changes
      topGrower: staticTop10?.topGrower || null,
      topDecliner: staticTop10?.topDecliner || null,
      top10: staticTop10?.top10 || [],
      continents: continentData,
      // Executive snapshot sparklines
      overallSparkline,
      topGrowerSparkline,
      topDeclinerSparkline
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

  // Get date range for monthly charts (last 24 months)
  const monthlyChartPeriod = chartData.length > 0 
    ? `${new Date(chartData[0].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${new Date(chartData[chartData.length - 1].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    : 'Jan 2023 - Oct 2025';

  // Prepare Year-over-Year comparison data for line chart
  const prepareYoYChartData = () => {
    if (selectedCategories.length === 0 || !data.length) return [];
    
    const currentYear = 2025;
    const currentMonth = data.length > 0 ? new Date(data[data.length - 1].date).getMonth() + 1 : 10; // e.g., 10 for October
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yoyData = [];
    
    // For each month from January to current month
    for (let month = 1; month <= currentMonth; month++) {
      const monthData = { month: monthNames[month - 1] };
      
      // Get data for current year (2025)
      const current = data.filter(row => {
        const date = new Date(row.date);
        return date.getFullYear() === currentYear && 
               date.getMonth() + 1 === month && 
               selectedCategories.includes(row.flokkur);
      }).reduce((sum, r) => sum + r.fjöldi, 0);
      monthData['2025'] = current > 0 ? current : null;
      
      // Get data for previous year (2024)
      const prev1 = data.filter(row => {
        const date = new Date(row.date);
        return date.getFullYear() === currentYear - 1 && 
               date.getMonth() + 1 === month && 
               selectedCategories.includes(row.flokkur);
      }).reduce((sum, r) => sum + r.fjöldi, 0);
      monthData['2024'] = prev1 > 0 ? prev1 : null;
      
      // Get data for year before that (2023)
      const prev2 = data.filter(row => {
        const date = new Date(row.date);
        return date.getFullYear() === currentYear - 2 && 
               date.getMonth() + 1 === month && 
               selectedCategories.includes(row.flokkur);
      }).reduce((sum, r) => sum + r.fjöldi, 0);
      monthData['2023'] = prev2 > 0 ? prev2 : null;
      
      yoyData.push(monthData);
    }
    
    return yoyData;
  };

  const yoyChartData = prepareYoYChartData();
  
  // Get current month name for YoY chart subtitle
  const yoyCurrentMonth = yoyChartData.length > 0 ? yoyChartData[yoyChartData.length - 1].month : 'Oct';

  return (
    <div className="min-h-screen bg-neutral-50">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      {/* Custom Elegant Neutral Palette */}
      <style>{`
        .text-sage-600 { color: #6E8B74; }
        .text-sage-700 { color: #5D7A63; }
        .bg-sage-50 { background-color: #F5F8F6; }
        .bg-sage-100 { background-color: #EDF2EF; }
        .text-terracotta-600 { color: #B8847D; }
        .bg-terracotta-50 { background-color: #FBF7F6; }
        .bg-terracotta-100 { background-color: #F7EFED; }
        .border-sage-200 { border-color: #D4E2D8; }
        .border-terracotta-200 { border-color: #E8D7D4; }
        .bg-slate-50 { background-color: #F8F9FA; }
      `}</style>
      
      {/* Subtle gradient border - soft charcoal */}
      <div style={{ 
        height: '1px', 
        background: 'linear-gradient(90deg, rgba(107, 124, 140, 0.25) 0%, rgba(139, 149, 165, 0.25) 100%)' 
      }}></div>
      
      {/* Hero Header - Refined spacing and alignment */}
      <div className="pt-12 pb-8 px-6" style={{
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(249, 249, 251, 0) 100%)'
      }}>
        <div className="max-w-7xl mx-auto">
          {/* Logo - Properly sized */}
          <div className="mb-4 flex justify-center">
            <img 
              src="/iceland-insights-logo.png" 
              alt="Iceland Insights Logo" 
              style={{
                height: '120px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
          
          {/* Subtitle - Centered and properly spaced */}
          <div className="text-center space-y-1">
            <p style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              fontSize: '16px',
              fontWeight: '500',
              color: '#6B7280',
              letterSpacing: '-0.2px',
              margin: 0
            }}>
              Keflavík Airport Passenger Analytics
            </p>
            <p style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: '400',
              color: '#A1A1A6',
              letterSpacing: '-0.1px',
              margin: 0
            }}>
              Data from <a 
                href="https://www.statice.is/" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{
                  color: '#6B7C8C',
                  textDecoration: 'none'
                }}
                onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.target.style.textDecoration = 'none'}
              >
                Statistics Iceland
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-6 space-y-4">


        {kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-neutral-200 p-4 shadow-sm relative" style={{
              background: kpis.yoyChange >= 0.5 ? 'linear-gradient(135deg, #ffffff 0%, #F9FBF9 100%)' : 
                          kpis.yoyChange <= -0.5 ? 'linear-gradient(135deg, #ffffff 0%, #FEFAF9 100%)' : 
                          '#ffffff'
            }}>
              <button 
                onClick={() => shareKPI('Monthly Passengers', `${kpis.currentMonth} passengers in ${kpis.currentMonthName}\n${kpis.yoyChange > 0 ? '+' : ''}${kpis.yoyChange.toFixed(1)}% YoY vs ${kpis.lastYearMonthName}`)}
                className="absolute top-3 right-3 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
              </button>
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1 font-semibold">Monthly Passengers</p>
              <p className="text-[9px] text-neutral-400 mb-1.5">{kpis.currentMonthName}</p>
              <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                <p className="text-2xl lg:text-3xl font-semibold text-neutral-900" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                  {kpis.currentMonth}
                </p>
              </div>
              <p className="text-xs text-neutral-600 mb-2">
                vs {kpis.lastYearMonth} in {kpis.lastYearMonthName}
              </p>
              <div className="flex items-center gap-2">
                {kpis.yoyChange >= 0.5 ? <TrendingUp className="w-4 h-4 text-sage-600" /> : 
                 kpis.yoyChange <= -0.5 ? <TrendingDown className="w-4 h-4 text-terracotta-600" /> :
                 <Minus className="w-4 h-4 text-neutral-400" />}
                <span className={`text-sm font-semibold ${
                  kpis.yoyChange >= 0.5 ? 'text-sage-600' : 
                  kpis.yoyChange <= -0.5 ? 'text-terracotta-600' : 'text-neutral-500'
                }`}>
                  {kpis.yoyChange > 0 ? '+' : ''}{kpis.yoyChange.toFixed(1)}% YoY
                </span>
              </div>
            </div>
            
            <div className="rounded-xl border border-neutral-200 p-4 shadow-sm relative" style={{
              background: kpis.ttmChange >= 0.5 ? 'linear-gradient(135deg, #ffffff 0%, #F9FBF9 100%)' : 
                          kpis.ttmChange <= -0.5 ? 'linear-gradient(135deg, #ffffff 0%, #FEFAF9 100%)' : 
                          '#ffffff'
            }}>
              <button 
                onClick={() => shareKPI('TTM - Foreign Passengers', `${kpis.ttmTotal} passengers (${kpis.ttmPeriod})\n${kpis.ttmChange > 0 ? '+' : ''}${kpis.ttmChange.toFixed(1)}% vs prior TTM`)}
                className="absolute top-3 right-3 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
              </button>
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1 font-semibold">TTM - Foreign Passengers</p>
              <p className="text-[9px] text-neutral-400 mb-1.5">{kpis.ttmPeriod}</p>
              <p className="text-2xl lg:text-3xl font-semibold text-neutral-900 mb-1.5" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                {kpis.ttmTotal}
              </p>
              <p className="text-xs text-neutral-600 mb-2">
                vs {kpis.lastTtmTotal} {kpis.priorTtmPeriod}
              </p>
              <div className="flex items-center gap-2">
                {kpis.ttmChange >= 0.5 ? <TrendingUp className="w-4 h-4 text-sage-600" /> : 
                 kpis.ttmChange <= -0.5 ? <TrendingDown className="w-4 h-4 text-terracotta-600" /> :
                 <Minus className="w-4 h-4 text-neutral-400" />}
                <span className={`text-sm font-semibold ${
                  kpis.ttmChange >= 0.5 ? 'text-sage-600' : 
                  kpis.ttmChange <= -0.5 ? 'text-terracotta-600' : 'text-neutral-500'
                }`}>
                  {kpis.ttmChange > 0 ? '+' : ''}{kpis.ttmChange.toFixed(1)}% vs prior TTM
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 p-4 shadow-sm relative" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #F9FBF9 100%)'
            }}>
              <button 
                onClick={() => shareKPI('TTM - Largest Gain', `${getCountryName(kpis.topGrower?.name)}\n${kpis.topGrower?.current.toLocaleString()} vs ${kpis.topGrower?.prior.toLocaleString()} prior TTM\n+${kpis.topGrower?.change} (+${kpis.topGrower?.percent.toFixed(1)}%)`)}
                className="absolute top-3 right-3 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
              </button>
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1 font-semibold">TTM - Largest Gain</p>
              <p className="text-[9px] text-neutral-400 mb-1.5">{kpis.ttmPeriod}</p>
              <p className="text-xl lg:text-2xl font-semibold text-neutral-900 mb-1.5" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                {kpis.topGrower && getCountryName(kpis.topGrower.name)}
              </p>
              <p className="text-xs text-neutral-600 mb-2">
                {kpis.topGrower?.current.toLocaleString()} vs {kpis.topGrower?.prior.toLocaleString()} {kpis.priorTtmPeriod}
              </p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sage-600" />
                <span className="text-sm font-semibold text-sage-600">
                  +{kpis.topGrower?.change} (+{kpis.topGrower?.percent.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 p-4 shadow-sm relative" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #FEFAF9 100%)'
            }}>
              <button 
                onClick={() => shareKPI('TTM - Largest Decline', `${getCountryName(kpis.topDecliner?.name)}\n${kpis.topDecliner?.current.toLocaleString()} vs ${kpis.topDecliner?.prior.toLocaleString()} prior TTM\n-${kpis.topDecliner?.change} (${kpis.topDecliner?.percent.toFixed(1)}%)`)}
                className="absolute top-3 right-3 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
              </button>
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1 font-semibold">TTM - Largest Decline</p>
              <p className="text-[9px] text-neutral-400 mb-1.5">{kpis.ttmPeriod}</p>
              <p className="text-xl lg:text-2xl font-semibold text-neutral-900 mb-1.5" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                {kpis.topDecliner && getCountryName(kpis.topDecliner.name)}
              </p>
              <p className="text-xs text-neutral-600 mb-2">
                {kpis.topDecliner?.current.toLocaleString()} vs {kpis.topDecliner?.prior.toLocaleString()} {kpis.priorTtmPeriod}
              </p>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-terracotta-600" />
                <span className="text-sm font-semibold text-terracotta-600">
                  -{kpis.topDecliner?.change} ({kpis.topDecliner?.percent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Executive Summary - Key Insights with Visual Support */}
        {kpis && (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl border-2 border-neutral-300 p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-sage-600 animate-pulse"></div>
                <h2 className="text-xl font-bold text-neutral-900" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                  Executive Summary
                </h2>
              </div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Last 6 months trend</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Insight 1: Current Month Performance */}
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-neutral-900 mb-2">Current Month Performance</h3>
                    <p className="text-xs text-neutral-700 leading-relaxed mb-3">
                      {kpis.currentMonthName} recorded <span className="font-semibold">{kpis.currentMonth} passengers</span>, 
                      {kpis.yoyChange >= 0 ? ' up ' : ' down '}
                      <span className={`font-semibold ${kpis.yoyChange >= 0 ? 'text-sage-600' : 'text-terracotta-600'}`}>
                        {Math.abs(kpis.yoyChange).toFixed(1)}% YoY
                      </span>
                      {kpis.yoyChange < 0 ? '. However, TTM trend remains positive at +' + kpis.ttmChange.toFixed(1) + '%.' : '.'}
                    </p>
                  </div>
                </div>
                {/* 6-month YoY % trend with proper axes */}
                {kpis.overallSparkline && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-medium text-neutral-600">YoY % Growth (Last 6 Months)</p>
                      <p className="text-[9px] text-neutral-500">Current Month: 
                        <span className={`font-semibold ml-1 ${
                          kpis.yoyChange >= 0 
                            ? 'text-sage-600' : 'text-terracotta-600'
                        }`}>
                          {kpis.yoyChange > 0 ? '+' : ''}{kpis.yoyChange.toFixed(1)}%
                        </span>
                      </p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <div className="relative">
                        <svg width="100%" height="120" viewBox="0 0 280 120" className="overflow-visible">
                          {/* Calculate scale */}
                          {(() => {
                            const maxVal = Math.max(...kpis.overallSparkline.map(p => Math.abs(p.value)));
                            const scale = Math.ceil(maxVal / 5) * 5; // Round to nearest 5
                            const chartLeft = 35;
                            const chartRight = 270;
                            const chartTop = 10;
                            const chartBottom = 90;
                            const chartMiddle = (chartTop + chartBottom) / 2;
                            
                            return (
                              <>
                                {/* Y-axis labels */}
                                <text x="30" y={chartTop + 5} textAnchor="end" className="text-[9px]" fill="#999">+{scale}%</text>
                                <text x="30" y={chartMiddle + 3} textAnchor="end" className="text-[9px]" fill="#666">0%</text>
                                <text x="30" y={chartBottom + 5} textAnchor="end" className="text-[9px]" fill="#999">-{scale}%</text>
                                
                                {/* Horizontal grid lines */}
                                <line x1={chartLeft} y1={chartTop} x2={chartRight} y2={chartTop} stroke="#e5e5e5" strokeWidth="0.5" />
                                <line x1={chartLeft} y1={chartMiddle} x2={chartRight} y2={chartMiddle} stroke="#333" strokeWidth="1" strokeDasharray="3,3" />
                                <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke="#e5e5e5" strokeWidth="0.5" />
                                
                                {/* Vertical grid lines */}
                                {kpis.overallSparkline.map((point, i) => {
                                  const x = chartLeft + (i / (kpis.overallSparkline.length - 1)) * (chartRight - chartLeft);
                                  return (
                                    <line key={`vgrid-${i}`} x1={x} y1={chartTop} x2={x} y2={chartBottom} stroke="#f0f0f0" strokeWidth="0.5" />
                                  );
                                })}
                                
                                {/* Data line */}
                                {kpis.overallSparkline.map((point, i) => {
                                  if (i === 0) return null;
                                  const prevPoint = kpis.overallSparkline[i - 1];
                                  
                                  const x1 = chartLeft + ((i - 1) / (kpis.overallSparkline.length - 1)) * (chartRight - chartLeft);
                                  const x2 = chartLeft + (i / (kpis.overallSparkline.length - 1)) * (chartRight - chartLeft);
                                  const y1 = chartMiddle - (prevPoint.value / scale) * (chartMiddle - chartTop);
                                  const y2 = chartMiddle - (point.value / scale) * (chartMiddle - chartTop);
                                  
                                  return (
                                    <line
                                      key={i}
                                      x1={x1}
                                      y1={y1}
                                      x2={x2}
                                      y2={y2}
                                      stroke="#6B7C8C"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                  );
                                })}
                                
                                {/* Data points */}
                                {kpis.overallSparkline.map((point, i) => {
                                  const x = chartLeft + (i / (kpis.overallSparkline.length - 1)) * (chartRight - chartLeft);
                                  const y = chartMiddle - (point.value / scale) * (chartMiddle - chartTop);
                                  
                                  return (
                                    <circle
                                      key={`dot-${i}`}
                                      cx={x}
                                      cy={y}
                                      r="3"
                                      fill={point.value >= 0 ? '#6E8B74' : '#B8847D'}
                                      stroke="#fff"
                                      strokeWidth="1.5"
                                    />
                                  );
                                })}
                                
                                {/* X-axis month labels */}
                                {kpis.overallSparkline.map((point, i) => {
                                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                  const x = chartLeft + (i / (kpis.overallSparkline.length - 1)) * (chartRight - chartLeft);
                                  return (
                                    <text key={`month-${i}`} x={x} y={chartBottom + 15} textAnchor="middle" className="text-[9px]" fill="#999">
                                      {monthNames[point.month - 1]}
                                    </text>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Insight 2: Top Growth Market */}
              {kpis.topGrower && (
                <div className="rounded-lg p-4 border-2 border-sage-200" style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #F9FBF9 100%)'
                }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-sage-700 mb-2">Leading Growth Market</h3>
                      <p className="text-xs text-neutral-700 leading-relaxed mb-3">
                        <span className="font-semibold">{getCountryName(kpis.topGrower.name)}</span> leads with 
                        <span className="font-semibold text-sage-600"> +{kpis.topGrower.change} passengers</span>
                        , representing a <span className="font-semibold text-sage-600">+{kpis.topGrower.percent.toFixed(1)}%</span> increase. 
                        Growth trajectory shows sustained momentum.
                      </p>
                    </div>
                  </div>
                  {/* 6-month YoY % trend with proper axes */}
                  {kpis.topGrowerSparkline && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-medium text-sage-700">YoY % Growth (Last 6 Months)</p>
                        <p className="text-[9px] text-neutral-600">TTM YoY: 
                          <span className="font-semibold ml-1 text-sage-600">
                            +{kpis.topGrower.percent.toFixed(1)}%
                          </span>
                        </p>
                      </div>
                      <div className="bg-sage-50 rounded-lg p-3">
                        <div className="relative">
                          <svg width="100%" height="120" viewBox="0 0 280 120" className="overflow-visible">
                            {(() => {
                              const maxVal = Math.max(...kpis.topGrowerSparkline.map(p => Math.abs(p.value)));
                              const scale = Math.ceil(maxVal / 5) * 5;
                              const chartLeft = 35;
                              const chartRight = 270;
                              const chartTop = 10;
                              const chartBottom = 90;
                              const chartMiddle = (chartTop + chartBottom) / 2;
                              
                              return (
                                <>
                                  {/* Y-axis labels */}
                                  <text x="30" y={chartTop + 5} textAnchor="end" className="text-[9px]" fill="#5D7A63">+{scale}%</text>
                                  <text x="30" y={chartMiddle + 3} textAnchor="end" className="text-[9px]" fill="#666">0%</text>
                                  <text x="30" y={chartBottom + 5} textAnchor="end" className="text-[9px]" fill="#999">-{scale}%</text>
                                  
                                  {/* Grid lines */}
                                  <line x1={chartLeft} y1={chartTop} x2={chartRight} y2={chartTop} stroke="#D4E2D8" strokeWidth="0.5" />
                                  <line x1={chartLeft} y1={chartMiddle} x2={chartRight} y2={chartMiddle} stroke="#6E8B74" strokeWidth="1" strokeDasharray="3,3" />
                                  <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke="#D4E2D8" strokeWidth="0.5" />
                                  
                                  {kpis.topGrowerSparkline.map((point, i) => {
                                    const x = chartLeft + (i / (kpis.topGrowerSparkline.length - 1)) * (chartRight - chartLeft);
                                    return (
                                      <line key={`vgrid-${i}`} x1={x} y1={chartTop} x2={x} y2={chartBottom} stroke="#EDF2EF" strokeWidth="0.5" />
                                    );
                                  })}
                                  
                                  {/* Data line */}
                                  {kpis.topGrowerSparkline.map((point, i) => {
                                    if (i === 0) return null;
                                    const prevPoint = kpis.topGrowerSparkline[i - 1];
                                    
                                    const x1 = chartLeft + ((i - 1) / (kpis.topGrowerSparkline.length - 1)) * (chartRight - chartLeft);
                                    const x2 = chartLeft + (i / (kpis.topGrowerSparkline.length - 1)) * (chartRight - chartLeft);
                                    const y1 = chartMiddle - (prevPoint.value / scale) * (chartMiddle - chartTop);
                                    const y2 = chartMiddle - (point.value / scale) * (chartMiddle - chartTop);
                                    
                                    return (
                                      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6E8B74" strokeWidth="2" strokeLinecap="round" />
                                    );
                                  })}
                                  
                                  {/* Data points */}
                                  {kpis.topGrowerSparkline.map((point, i) => {
                                    const x = chartLeft + (i / (kpis.topGrowerSparkline.length - 1)) * (chartRight - chartLeft);
                                    const y = chartMiddle - (point.value / scale) * (chartMiddle - chartTop);
                                    
                                    return (
                                      <circle key={`dot-${i}`} cx={x} cy={y} r="3" fill="#6E8B74" stroke="#fff" strokeWidth="1.5" />
                                    );
                                  })}
                                  
                                  {/* X-axis labels */}
                                  {kpis.topGrowerSparkline.map((point, i) => {
                                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    const x = chartLeft + (i / (kpis.topGrowerSparkline.length - 1)) * (chartRight - chartLeft);
                                    return (
                                      <text key={`month-${i}`} x={x} y={chartBottom + 15} textAnchor="middle" className="text-[9px]" fill="#999">
                                        {monthNames[point.month - 1]}
                                      </text>
                                    );
                                  })}
                                </>
                              );
                            })()}
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Insight 3: Attention Market */}
              {kpis.topDecliner && (
                <div className="rounded-lg p-4 border-2 border-terracotta-200" style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #FEFAF9 100%)'
                }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-terracotta-600 mb-2">Market Requiring Attention</h3>
                      <p className="text-xs text-neutral-700 leading-relaxed mb-3">
                        <span className="font-semibold">{getCountryName(kpis.topDecliner.name)}</span> declined by 
                        <span className="font-semibold text-terracotta-600"> -{kpis.topDecliner.change} passengers</span>
                        , a <span className="font-semibold text-terracotta-600">{kpis.topDecliner.percent.toFixed(1)}%</span> decrease. 
                        Strategic review recommended.
                      </p>
                    </div>
                  </div>
                  {/* 6-month YoY % trend with proper axes */}
                  {kpis.topDeclinerSparkline && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-medium text-terracotta-600">YoY % Change (Last 6 Months)</p>
                        <p className="text-[9px] text-neutral-600">TTM YoY: 
                          <span className="font-semibold ml-1 text-terracotta-600">
                            {kpis.topDecliner.percent.toFixed(1)}%
                          </span>
                        </p>
                      </div>
                      <div className="bg-terracotta-50 rounded-lg p-3">
                        <div className="relative">
                          <svg width="100%" height="120" viewBox="0 0 280 120" className="overflow-visible">
                            {(() => {
                              const maxVal = Math.max(...kpis.topDeclinerSparkline.map(p => Math.abs(p.value)));
                              const scale = Math.ceil(maxVal / 5) * 5;
                              const chartLeft = 35;
                              const chartRight = 270;
                              const chartTop = 10;
                              const chartBottom = 90;
                              const chartMiddle = (chartTop + chartBottom) / 2;
                              
                              return (
                                <>
                                  {/* Y-axis labels */}
                                  <text x="30" y={chartTop + 5} textAnchor="end" className="text-[9px]" fill="#999">+{scale}%</text>
                                  <text x="30" y={chartMiddle + 3} textAnchor="end" className="text-[9px]" fill="#666">0%</text>
                                  <text x="30" y={chartBottom + 5} textAnchor="end" className="text-[9px]" fill="#B8847D">-{scale}%</text>
                                  
                                  {/* Grid lines */}
                                  <line x1={chartLeft} y1={chartTop} x2={chartRight} y2={chartTop} stroke="#E8D7D4" strokeWidth="0.5" />
                                  <line x1={chartLeft} y1={chartMiddle} x2={chartRight} y2={chartMiddle} stroke="#B8847D" strokeWidth="1" strokeDasharray="3,3" />
                                  <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke="#E8D7D4" strokeWidth="0.5" />
                                  
                                  {kpis.topDeclinerSparkline.map((point, i) => {
                                    const x = chartLeft + (i / (kpis.topDeclinerSparkline.length - 1)) * (chartRight - chartLeft);
                                    return (
                                      <line key={`vgrid-${i}`} x1={x} y1={chartTop} x2={x} y2={chartBottom} stroke="#F7EFED" strokeWidth="0.5" />
                                    );
                                  })}
                                  
                                  {/* Data line */}
                                  {kpis.topDeclinerSparkline.map((point, i) => {
                                    if (i === 0) return null;
                                    const prevPoint = kpis.topDeclinerSparkline[i - 1];
                                    
                                    const x1 = chartLeft + ((i - 1) / (kpis.topDeclinerSparkline.length - 1)) * (chartRight - chartLeft);
                                    const x2 = chartLeft + (i / (kpis.topDeclinerSparkline.length - 1)) * (chartRight - chartLeft);
                                    const y1 = chartMiddle - (prevPoint.value / scale) * (chartMiddle - chartTop);
                                    const y2 = chartMiddle - (point.value / scale) * (chartMiddle - chartTop);
                                    
                                    return (
                                      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#B8847D" strokeWidth="2" strokeLinecap="round" />
                                    );
                                  })}
                                  
                                  {/* Data points */}
                                  {kpis.topDeclinerSparkline.map((point, i) => {
                                    const x = chartLeft + (i / (kpis.topDeclinerSparkline.length - 1)) * (chartRight - chartLeft);
                                    const y = chartMiddle - (point.value / scale) * (chartMiddle - chartTop);
                                    
                                    return (
                                      <circle key={`dot-${i}`} cx={x} cy={y} r="3" fill="#B8847D" stroke="#fff" strokeWidth="1.5" />
                                    );
                                  })}
                                  
                                  {/* X-axis labels */}
                                  {kpis.topDeclinerSparkline.map((point, i) => {
                                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    const x = chartLeft + (i / (kpis.topDeclinerSparkline.length - 1)) * (chartRight - chartLeft);
                                    return (
                                      <text key={`month-${i}`} x={x} y={chartBottom + 15} textAnchor="middle" className="text-[9px]" fill="#999">
                                        {monthNames[point.month - 1]}
                                      </text>
                                    );
                                  })}
                                </>
                              );
                            })()}
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* Top 10 Markets - Completely Static, Never Affected by Filters */}
        {staticTop10 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900 mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                Top 10 Markets (TTM)
              </h3>
              <p className="text-xs text-neutral-500 mb-3">Nov 2024 - Oct 2025</p>
              <div className="grid grid-cols-6 gap-2 mb-2 pb-1.5 border-b border-neutral-200">
                <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-medium col-span-2">Nationality</p>
                <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-medium text-right">Passengers</p>
                <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-medium text-right">Abs Change</p>
                <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-medium text-right">% Total</p>
                <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-medium text-right">YoY %</p>
              </div>
              <div className="space-y-0.5">
                {staticTop10.top10.map((item, i) => (
                  <div key={i} className="grid grid-cols-6 gap-2 py-1 px-2 rounded" style={{
                    backgroundColor: i % 2 === 0 ? '#ffffff' : '#F8FAFB'
                  }}>
                    <div className="flex items-center gap-2 col-span-2">
                      <span className="text-[9px] text-neutral-400 w-3">{i + 1}</span>
                      <span className="text-[11px] text-neutral-700">{getCountryName(item.nat)}</span>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono text-right">{item.total.toLocaleString()}</span>
                    <span className={`text-[11px] font-medium text-right ${
                      item.absoluteChange >= 0 ? 'text-sage-600' : 'text-terracotta-600'
                    }`}>
                      {item.absoluteChange >= 0 ? '+' : ''}{item.absoluteChange.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono text-right">{item.ratio.toFixed(1)}%</span>
                    <span className={`text-[11px] font-medium text-right ${
                      item.yoy >= 0.5 ? 'text-sage-600' : 
                      item.yoy <= -0.5 ? 'text-terracotta-600' : 'text-neutral-400'
                    }`}>
                      {item.yoy > 0 ? '+' : ''}{item.yoy.toFixed(1)}%
                    </span>
                  </div>
                ))}
                {/* Total row */}
                <div className="grid grid-cols-6 gap-2 py-1.5 mt-1.5 pt-2.5 border-t-2 border-neutral-300">
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="text-xs font-bold text-neutral-900">Total (Top 10)</span>
                  </div>
                  <span className="text-xs text-neutral-900 font-bold font-mono text-right">
                    {staticTop10.top10.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                  </span>
                  <span className={`text-xs font-bold text-right ${
                    staticTop10.top10.reduce((sum, item) => sum + item.absoluteChange, 0) >= 0 ? 'text-sage-600' : 'text-terracotta-600'
                  }`}>
                    {staticTop10.top10.reduce((sum, item) => sum + item.absoluteChange, 0) >= 0 ? '+' : ''}
                    {staticTop10.top10.reduce((sum, item) => sum + item.absoluteChange, 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-neutral-900 font-bold font-mono text-right">
                    {staticTop10.top10.reduce((sum, item) => sum + item.ratio, 0).toFixed(1)}%
                  </span>
                  <span className={`text-xs font-bold text-right ${
                    (() => {
                      const currentTotal = staticTop10.top10.reduce((sum, item) => sum + item.total, 0);
                      const absChange = staticTop10.top10.reduce((sum, item) => sum + item.absoluteChange, 0);
                      const priorTotal = currentTotal - absChange;
                      const yoy = priorTotal > 0 ? (absChange / priorTotal * 100) : 0;
                      return yoy >= 0.5 ? 'text-sage-600' : yoy <= -0.5 ? 'text-terracotta-600' : 'text-neutral-500';
                    })()
                  }`}>
                    {(() => {
                      const currentTotal = staticTop10.top10.reduce((sum, item) => sum + item.total, 0);
                      const absChange = staticTop10.top10.reduce((sum, item) => sum + item.absoluteChange, 0);
                      const priorTotal = currentTotal - absChange;
                      const yoy = priorTotal > 0 ? (absChange / priorTotal * 100) : 0;
                      return (yoy > 0 ? '+' : '') + yoy.toFixed(1) + '%';
                    })()}
                  </span>
                </div>
                {/* Other row */}
                <div className="grid grid-cols-6 gap-2 py-1.5">
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="text-xs text-neutral-600">Other Nationalities</span>
                  </div>
                  <span className="text-xs text-neutral-500 font-mono text-right">
                    {(staticTop10.ttmTotal - staticTop10.top10.reduce((sum, item) => sum + item.total, 0)).toLocaleString()}
                  </span>
                  <span className={`text-xs font-medium text-right ${
                    (() => {
                      const currentOther = staticTop10.ttmTotal - staticTop10.top10.reduce((sum, item) => sum + item.total, 0);
                      const priorOther = staticTop10.priorTtmTotal - staticTop10.top10.reduce((sum, item) => sum + item.total - item.absoluteChange, 0);
                      const otherAbsChange = currentOther - priorOther;
                      return otherAbsChange >= 0 ? 'text-sage-600' : 'text-terracotta-600';
                    })()
                  }`}>
                    {(() => {
                      const currentOther = staticTop10.ttmTotal - staticTop10.top10.reduce((sum, item) => sum + item.total, 0);
                      const priorOther = staticTop10.priorTtmTotal - staticTop10.top10.reduce((sum, item) => sum + item.total - item.absoluteChange, 0);
                      const otherAbsChange = currentOther - priorOther;
                      return (otherAbsChange >= 0 ? '+' : '') + otherAbsChange.toLocaleString();
                    })()}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono text-right">
                    {(100 - staticTop10.top10.reduce((sum, item) => sum + item.ratio, 0)).toFixed(1)}%
                  </span>
                  <span className={`text-xs font-medium text-right ${
                    (() => {
                      const currentOther = staticTop10.ttmTotal - staticTop10.top10.reduce((sum, item) => sum + item.total, 0);
                      const priorOther = staticTop10.priorTtmTotal - staticTop10.top10.reduce((sum, item) => sum + item.total - item.absoluteChange, 0);
                      const otherYoy = priorOther > 0 ? ((currentOther - priorOther) / priorOther * 100) : 0;
                      return otherYoy >= 0.5 ? 'text-sage-600' : otherYoy <= -0.5 ? 'text-terracotta-600' : 'text-neutral-400';
                    })()
                  }`}>
                    {(() => {
                      const currentOther = staticTop10.ttmTotal - staticTop10.top10.reduce((sum, item) => sum + item.total, 0);
                      const priorOther = staticTop10.priorTtmTotal - staticTop10.top10.reduce((sum, item) => sum + item.total - item.absoluteChange, 0);
                      const otherYoy = priorOther > 0 ? ((currentOther - priorOther) / priorOther * 100) : 0;
                      return (otherYoy > 0 ? '+' : '') + otherYoy.toFixed(1) + '%';
                    })()}
                  </span>
                </div>
              </div>
            </div>
            
            {kpis && (
            <div className="lg:col-span-1 bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900 mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                By Continent (TTM)
              </h3>
              <p className="text-xs text-neutral-500 mb-3">{kpis.ttmPeriod}</p>
              <div className="grid grid-cols-3 gap-2 mb-2 pb-1.5 border-b border-neutral-200">
                <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-medium">Region</p>
                <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-medium text-right">Passengers</p>
                <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-medium text-right">YoY %</p>
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
                        continent.yoy >= 0.5 ? 'text-sage-600' : 
                        continent.yoy <= -0.5 ? 'text-terracotta-600' : 'text-neutral-400'
                      }`}>
                        {continent.yoy > 0 ? '+' : ''}{continent.yoy.toFixed(1)}%
                      </span>
                    </div>
                    <div className={`text-[10px] font-mono mt-1 ${
                      continent.change >= 0 ? 'text-sage-600' : 'text-terracotta-600'
                    }`}>
                      {continent.change >= 0 ? '+' : ''}{continent.change.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        )}

        {/* Enhanced Filter Section with Visual State */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-neutral-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                Filter by Nationality
              </h3>
              <div className="flex items-center gap-2">
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  selectedCategories.length === 2 
                    ? 'bg-sage-100 text-sage-700' 
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {selectedCategories.length}/2 selected
                </div>
              </div>
            </div>
            {selectedCategories.length > 0 && !selectedCategories.includes('Farþegar alls') && !selectedCategories.includes('Útlendingar alls') && (
              <button
                onClick={() => setSelectedCategories(['Útlendingar alls'])}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Active Filters Display */}
          {selectedCategories.length > 0 && !selectedCategories.includes('Farþegar alls') && !selectedCategories.includes('Útlendingar alls') && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-500">Active filters:</span>
              {selectedCategories.map(cat => (
                <div 
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full"
                >
                  <span className="text-xs font-medium text-blue-700">{getCountryName(cat)}</span>
                  <button
                    onClick={() => handleCategoryToggle(cat)}
                    className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => {
              const isSelected = selectedCategories.includes(cat);
              const isDisabled = !isSelected && selectedCategories.length >= 2;
              
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  disabled={isDisabled}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : isDisabled
                      ? 'bg-neutral-50 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-50'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400 hover:shadow-sm'
                  }`}
                >
                  {getCountryName(cat)}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-neutral-400 mt-3">
            💡 Select up to 2 nationalities to compare their passenger trends in the charts below
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
              Monthly Trends
            </h3>
            <p className="text-[10px] text-neutral-500 mb-3">{monthlyChartPeriod}</p>
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
                  formatter={(value, name) => [value.toLocaleString(), getCountryName(name)]}
                />
                {selectedCategories.map((cat, idx) => (
                  <Bar 
                    key={cat}
                    dataKey={cat}
                    fill={chartColors[idx % chartColors.length]}
                    radius={[4, 4, 0, 0]}
                    name={getCountryName(cat)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
              Year-over-Year Comparison
            </h3>
            <p className="text-[10px] text-neutral-500 mb-3">Jan - {yoyCurrentMonth} (2023 vs 2024 vs 2025)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={yoyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="month"
                  stroke="#8e8e93"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
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
                  formatter={(value, name) => [value?.toLocaleString() || 'N/A', name]}
                />
                <Line 
                  type="monotone" 
                  dataKey="2025"
                  stroke="#6B7C8C"
                  strokeWidth={2.5}
                  dot={{ fill: '#fff', stroke: '#6B7C8C', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                  name="2025"
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey="2024"
                  stroke="#FF375F"
                  strokeWidth={2.5}
                  strokeOpacity={0.5}
                  dot={{ fill: '#fff', stroke: '#FF375F', strokeWidth: 2, r: 3, opacity: 0.5 }}
                  activeDot={{ r: 5 }}
                  name="2024"
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey="2023"
                  stroke="#8E8E93"
                  strokeWidth={2.5}
                  strokeOpacity={0.3}
                  dot={{ fill: '#fff', stroke: '#8E8E93', strokeWidth: 2, r: 3, opacity: 0.3 }}
                  activeDot={{ r: 5 }}
                  name="2023"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Annual Overview & YTD Comparison - Grid Layout */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Annual + YTD Bar Chart */}
          {kpis && kpis.annualData && (
            <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-900 mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                Annual Overview
              </h3>
              <p className="text-[10px] text-neutral-500 mb-3">2017-2025 YTD</p>
              <ResponsiveContainer width="100%" height={selectedCategories.length > 1 ? 240 : 200}>
                <BarChart data={kpis.annualData} margin={{ top: 5, right: 5, left: -20, bottom: selectedCategories.length > 1 ? 25 : 5 }} barGap={2} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#8e8e93" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#8e8e93" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
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
                    formatter={(value, name) => [value.toLocaleString(), getCountryName(name)]}
                  />
                  {selectedCategories.length > 1 && (
                    <Legend 
                      wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                      formatter={(value) => getCountryName(value)}
                    />
                  )}
                  {selectedCategories.map((cat, idx) => (
                    <Bar 
                      key={cat}
                      dataKey={cat}
                      fill={chartColors[idx] || '#6B7C8C'}
                      radius={[4, 4, 0, 0]}
                      name={cat}
                      maxBarSize={selectedCategories.length > 1 ? 35 : 50}
                      label={selectedCategories.length === 1 ? { 
                        position: 'top', 
                        formatter: (value) => value > 0 ? `${(value/1000000).toFixed(2)}M` : '',
                        fontSize: 9,
                        fill: '#737373'
                      } : undefined}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* YTD Comparison Bar Chart */}
          {kpis && kpis.ytdComparisonData && (
            <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-900 mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                YTD Comparison
              </h3>
              <p className="text-[10px] text-neutral-500 mb-3">Jan - {kpis.currentMonthName.split(' ')[0]} (2017-2025)</p>
              <ResponsiveContainer width="100%" height={selectedCategories.length > 1 ? 240 : 200}>
                <BarChart data={kpis.ytdComparisonData} margin={{ top: 5, right: 5, left: -20, bottom: selectedCategories.length > 1 ? 25 : 5 }} barGap={2} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="year" 
                    stroke="#8e8e93" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#8e8e93" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
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
                    formatter={(value, name) => [value.toLocaleString(), getCountryName(name)]}
                  />
                  {selectedCategories.length > 1 && (
                    <Legend 
                      wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                      formatter={(value) => getCountryName(value)}
                    />
                  )}
                  {selectedCategories.map((cat, idx) => (
                    <Bar 
                      key={cat}
                      dataKey={cat}
                      fill={chartColors[idx] || '#FF375F'}
                      radius={[4, 4, 0, 0]}
                      name={cat}
                      maxBarSize={selectedCategories.length > 1 ? 35 : 50}
                      label={selectedCategories.length === 1 ? { 
                        position: 'top', 
                        formatter: (value) => value > 0 ? `${(value/1000000).toFixed(2)}M` : '',
                        fontSize: 9,
                        fill: '#737373'
                      } : undefined}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
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