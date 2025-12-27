import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart } from 'recharts';
import { Sparkles, TrendingUp, TrendingDown, Minus, Share2, ArrowUpDown, ChevronUp, ChevronDown, Code, FileDown, Link2, Twitter, Linkedin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// Add custom animations
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes countUp {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes pulse-subtle {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
  
  @keyframes pulse-strong {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.1;
    }
  }
  
  @keyframes skeleton-loading {
    0%, 100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
    opacity: 0;
  }
  
  .animate-count-up {
    animation: countUp 0.3s ease-out;
  }
  
  .pulse-subtle {
    animation: pulse-subtle 2s ease-in-out infinite;
  }
  
  .pulse-strong {
    animation: pulse-strong 2s ease-in-out infinite;
  }
  
  .skeleton {
    background: #e5e7eb;
    animation: skeleton-loading 1.5s ease-in-out infinite;
    border-radius: 4px;
  }
  
  .skeleton-text {
    height: 1em;
    margin-bottom: 0.5em;
  }
  
  .skeleton-circle {
    border-radius: 50%;
  }
`;

export default function DataDashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // This will now be for sections ABOVE filters (always full data)
  const [userFilteredData, setUserFilteredData] = useState([]); // This is for sections BELOW filters
  const [selectedCategory, setSelectedCategory] = useState('Útlendingar alls');
  const [selectedCategories, setSelectedCategories] = useState(['Útlendingar alls']);
  const [categories, setCategories] = useState([]);
  const [insights, setInsights] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // NEW: Track initial page load
  const [sortConfig, setSortConfig] = useState({ key: 'ratio', direction: 'desc' }); // Default sort by % Total descending

  // Date range selector state (for user filters only)
  const [dateRangePreset, setDateRangePreset] = useState('last6months');
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [showAdditional12Months, setShowAdditional12Months] = useState(false);

  // Detect mobile device (iPhone, iPad, Android)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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

  // Date range filtering helper
  const getFilteredDataByDateRange = (fullData) => {
    if (!fullData || fullData.length === 0) return [];
    
    // Sort data by date
    const sortedData = [...fullData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let startDate, endDate;
    const latestDate = new Date(sortedData[sortedData.length - 1].date);
    
    switch (dateRangePreset) {
      case 'last6months':
        startDate = new Date(latestDate);
        startDate.setMonth(startDate.getMonth() - 6);
        endDate = latestDate;
        break;
        
      case 'last12months':
        startDate = new Date(latestDate);
        startDate.setMonth(startDate.getMonth() - 12);
        endDate = latestDate;
        break;
        
      case 'ytd':
        startDate = new Date(latestDate.getFullYear(), 0, 1);
        endDate = latestDate;
        break;
        
      case 'last2years':
        startDate = new Date(latestDate);
        startDate.setFullYear(startDate.getFullYear() - 2);
        endDate = latestDate;
        break;
        
      case 'specificYear':
        if (selectedYear) {
          startDate = new Date(selectedYear, 0, 1);
          endDate = new Date(selectedYear, 11, 31);
        } else {
          return sortedData;
        }
        break;
        
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          return sortedData;
        }
        break;
        
      default:
        return sortedData;
    }
    
    return sortedData.filter(row => {
      const rowDate = new Date(row.date);
      return rowDate >= startDate && rowDate <= endDate;
    });
  };

  // Calculate seasonal data ONCE using useMemo (performance fix for iPhone)
  const seasonalData = useMemo(() => {
    if (!kpis || !filteredData || filteredData.length === 0) {
      return null;
    }

    const currentDate = new Date(kpis.currentMonthName);
    const currentMonth = currentDate.getMonth();
    const currentValue = parseInt(kpis.currentMonth.replace(/,/g, ''));
    
    const historicalByMonth = Array(12).fill(0).map(() => []);
    const ytd2025ByMonth = Array(12).fill(null);
    
    // Filter once, use multiple times
    const foreignPassengers = filteredData.filter(row => row.flokkur === 'Útlendingar alls');
    
    foreignPassengers.forEach(row => {
      const rowDate = new Date(row.date);
      const rowYear = rowDate.getFullYear();
      const rowMonth = rowDate.getMonth();
      const value = row.fjöldi;
      
      if (!isNaN(value) && value > 0) {
        if (rowYear >= 2017 && rowYear <= 2024 && rowYear !== 2020 && rowYear !== 2021 && rowYear !== 2022) {
          historicalByMonth[rowMonth].push(value);
        }
        if (rowYear === 2025) {
          ytd2025ByMonth[rowMonth] = value;
        }
      }
    });
    
    const historicalAvg = historicalByMonth.map(values => 
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
    );
    
    return {
      currentMonth,
      currentValue,
      historicalByMonth,
      historicalAvg,
      ytd2025ByMonth
    };
  }, [filteredData, kpis]);

  useEffect(() => {
    // Load data from JSON file
    const loadData = async () => {
      try {
        const response = await fetch('/data.json');
        const jsonData = await response.json();
        
        const fullData = [];
        const years = new Set();
        
        // Load ALL countries from the data dynamically
        Object.entries(jsonData.monthlyData).forEach(([dateStr, values]) => {
          const [year, month] = dateStr.split('-').map(Number);
          years.add(year);
          
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
        setAvailableYears([...years].sort((a, b) => b - a)); // Descending order
        setSelectedYear(Math.max(...years)); // Set to latest year
        
        const uniqueCategories = [...new Set(fullData.map(row => row.flokkur))];
        setCategories(uniqueCategories);
        setSelectedCategory('Útlendingar alls');
        
        // Small delay to ensure smooth transition from skeleton
        setTimeout(() => {
          setInitialLoading(false);
        }, 300);
        
        // No longer calculating static Top 10 here - will be dynamic
      } catch (error) {
        console.error('Error loading data:', error);
        setInitialLoading(false); // Stop loading even on error
      }
    };
    
    loadData();
  }, []);



  useEffect(() => {
    if (data.length > 0 && selectedCategories.length > 0) {
      // For sections ABOVE filters (Executive Summary, KPIs, Top 10, Continent)
      // Always use full data for calculations, but display focuses on last 6 months
      const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const filtered = sortedData
        .filter(row => selectedCategories.includes(row.flokkur))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setFilteredData(filtered);
      
      // Generate KPIs and insights using FULL dataset (needs 24+ months for YoY/TTM)
      if (selectedCategories.includes('Farþegar alls')) {
        const foreignPassengers = sortedData.filter(row => row.flokkur === 'Útlendingar alls');
        generateInsightsAndKPIs(sortedData, foreignPassengers, selectedCategories);
      } else if (selectedCategories.includes('Útlendingar alls')) {
        generateInsightsAndKPIs(sortedData, filtered, selectedCategories);
      } else {
        generateInsightsAndKPIs(sortedData, filtered, selectedCategories);
      }
      
      // For sections BELOW filters (charts, detailed tables)
      // Apply user's date range filter
      const dateFiltered = getFilteredDataByDateRange(data);
      const userFiltered = dateFiltered
        .filter(row => selectedCategories.includes(row.flokkur))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setUserFilteredData(userFiltered);
    }
  }, [selectedCategories, data, dateRangePreset, selectedYear, customStartDate, customEndDate]);

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
    
    // Calculate TTM period from current month (not from filtered data to avoid multi-category issues)
    const ttmEnd = new Date(currentMonth.date);
    const ttmStart = new Date(currentMonth.date);
    ttmStart.setFullYear(ttmStart.getFullYear() - 1);
    ttmStart.setMonth(ttmStart.getMonth() + 1); // Add 1 to get the start of TTM period
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
    
    // Calculate total foreign passengers from all continents (excludes "Total" continent)
    const foreignTotalFromContinents = Object.entries(continentTotals)
      .filter(([continent]) => continent !== 'Total')
      .reduce((sum, [_, total]) => sum + total, 0);
    
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
      .filter(([continent]) => continent !== 'Total') // Exclude "Total" continent from display
      .map(([continent, total]) => ({
        continent,
        total,
        prior: continentPriorTotals[continent] || 0,
        change: total - (continentPriorTotals[continent] || 0),
        yoy: continentPriorTotals[continent] > 0 ? ((total - continentPriorTotals[continent]) / continentPriorTotals[continent] * 100) : 0,
        percentOfForeign: foreignTotalFromContinents > 0 ? (total / foreignTotalFromContinents * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
    
    // Calculate Top 10 Markets (ALWAYS uses ALL foreign passengers, never filtered)
    const foreignDataForTop10 = allData.filter(row => 
      row.flokkur !== 'Farþegar alls' && 
      row.flokkur !== 'Ísland' && 
      row.flokkur !== 'Útlendingar alls'
    );
    
    // Get last month's date from ALL data (not filtered)
    const sortedAllData = [...foreignDataForTop10].sort((a, b) => new Date(b.date) - new Date(a.date));
    const currentMonthForTop10 = sortedAllData[0];
    
    const ltmDataForTop10 = foreignDataForTop10.filter(row => {
      const date = new Date(row.date);
      const cutoff = new Date(currentMonthForTop10.date);
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      return date > cutoff;
    });
    
    const nationalityTotalsForTop10 = {};
    ltmDataForTop10.forEach(row => {
      nationalityTotalsForTop10[row.flokkur] = (nationalityTotalsForTop10[row.flokkur] || 0) + row.fjöldi;
    });
    
    const foreignTotal = Object.values(nationalityTotalsForTop10).reduce((a, b) => a + b, 0);
    
    // Calculate prior TTM foreign total for "Other" calculation
    const priorLtmData = foreignDataForTop10.filter(row => {
      const date = new Date(row.date);
      const startCutoff = new Date(currentMonthForTop10.date);
      startCutoff.setFullYear(startCutoff.getFullYear() - 2);
      const endCutoff = new Date(currentMonthForTop10.date);
      endCutoff.setFullYear(endCutoff.getFullYear() - 1);
      return date > startCutoff && date <= endCutoff;
    });
    
    const priorForeignTotal = priorLtmData.reduce((sum, r) => sum + r.fjöldi, 0);
    
    // Calculate YoY changes
    const nationalityChanges = {};
    
    Object.keys(nationalityTotalsForTop10).forEach(nat => {
      const currentTtmData = ltmDataForTop10.filter(row => row.flokkur === nat);
      const priorTtmData = foreignDataForTop10.filter(row => {
        const date = new Date(row.date);
        const startCutoff = new Date(currentMonthForTop10.date);
        startCutoff.setFullYear(startCutoff.getFullYear() - 2);
        const endCutoff = new Date(currentMonthForTop10.date);
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
    const top10 = Object.entries(nationalityTotalsForTop10)
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
    
    const calculatedTop10 = {
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
    };
    
    // Calculate 6-month YoY % sparkline data for executive snapshot (moved after Top 10 calculation)
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
    const topGrowerSparkline = calculatedTop10.topGrower ? (() => {
      const sparkline = [];
      for (let i = 0; i < 6; i++) {
        const targetDate = new Date(sixMonthsAgo);
        targetDate.setMonth(targetDate.getMonth() + i);
        
        // Current year data
        const currentYearData = allData.filter(row => {
          const rowDate = new Date(row.date);
          return rowDate.getMonth() === targetDate.getMonth() && 
                 rowDate.getFullYear() === targetDate.getFullYear() &&
                 row.flokkur === calculatedTop10.topGrower.name;
        });
        const currentTotal = currentYearData.reduce((sum, r) => sum + r.fjöldi, 0);
        
        // Prior year data
        const priorYearData = allData.filter(row => {
          const rowDate = new Date(row.date);
          return rowDate.getMonth() === targetDate.getMonth() && 
                 rowDate.getFullYear() === targetDate.getFullYear() - 1 &&
                 row.flokkur === calculatedTop10.topGrower.name;
        });
        const priorTotal = priorYearData.reduce((sum, r) => sum + r.fjöldi, 0);
        
        // Calculate YoY %
        const yoyPercent = priorTotal > 0 ? ((currentTotal - priorTotal) / priorTotal * 100) : 0;
        sparkline.push({ value: yoyPercent, month: targetDate.getMonth() + 1 });
      }
      return sparkline;
    })() : [];
    
    // Top decliner 6-month YoY % trend
    const topDeclinerSparkline = calculatedTop10.topDecliner ? (() => {
      const sparkline = [];
      for (let i = 0; i < 6; i++) {
        const targetDate = new Date(sixMonthsAgo);
        targetDate.setMonth(targetDate.getMonth() + i);
        
        // Current year data
        const currentYearData = allData.filter(row => {
          const rowDate = new Date(row.date);
          return rowDate.getMonth() === targetDate.getMonth() && 
                 rowDate.getFullYear() === targetDate.getFullYear() &&
                 row.flokkur === calculatedTop10.topDecliner.name;
        });
        const currentTotal = currentYearData.reduce((sum, r) => sum + r.fjöldi, 0);
        
        // Prior year data
        const priorYearData = allData.filter(row => {
          const rowDate = new Date(row.date);
          return rowDate.getMonth() === targetDate.getMonth() && 
                 rowDate.getFullYear() === targetDate.getFullYear() - 1 &&
                 row.flokkur === calculatedTop10.topDecliner.name;
        });
        const priorTotal = priorYearData.reduce((sum, r) => sum + r.fjöldi, 0);
        
        // Calculate YoY %
        const yoyPercent = priorTotal > 0 ? ((currentTotal - priorTotal) / priorTotal * 100) : 0;
        sparkline.push({ value: yoyPercent, month: targetDate.getMonth() + 1 });
      }
      return sparkline;
    })() : [];
    
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
      // Dynamic Top 10 - recalculates with latest data
      topGrower: calculatedTop10.topGrower,
      topDecliner: calculatedTop10.topDecliner,
      top10: calculatedTop10.top10,
      top10TtmTotal: calculatedTop10.ttmTotal,
      top10PriorTtmTotal: calculatedTop10.priorTtmTotal,
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
    const shareText = `🇮🇸 ${kpiName}\n${kpiData}\n\nvia IcelandInsights`;
    const url = window.location.href;
    
    // Open Twitter with pre-filled tweet
    const tweetText = encodeURIComponent(shareText);
    const tweetUrl = encodeURIComponent(url);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}&hashtags=Iceland,Tourism,KEF`;
    
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const exportToExcel = () => {
    // Create CSV content from filtered data
    const headers = ['Date', 'Category', 'Passengers'];
    const rows = userFilteredData.map(row => [
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
    link.setAttribute('download', `iceland-tourism-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateEmbedCode = (type, title) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    
    // Add current filters to embed
    if (selectedCategories.length > 0 && !selectedCategories.includes('Útlendingar alls')) {
      params.set('countries', selectedCategories.join(','));
    }
    
    const embedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    
    const embedCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" title="${title} - Iceland Tourism Data"></iframe>`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(embedCode).then(() => {
      alert(`✓ Embed code copied!\n\nPaste this into your website:\n\n${embedCode}`);
    }).catch(() => {
      // Fallback: show in prompt
      prompt('Copy this embed code:', embedCode);
    });
  };

  const shareInsight = async (platform, text, url = window.location.href) => {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=Iceland,Tourism,Data`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      copy: null // Handle separately
    };

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        alert('✓ Copied to clipboard!');
      } catch (err) {
        alert('Failed to copy to clipboard');
      }
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };


  // Prepare data for charts - create merged dataset with all selected categories
  const prepareChartData = () => {
    if (selectedCategories.length === 0) return [];
    
    const last24Dates = [...new Set(userFilteredData.slice(-24).map(d => d.date))].sort();
    
    return last24Dates.map(date => {
      const row = { date };
      selectedCategories.forEach(cat => {
        const dataPoint = userFilteredData.find(d => d.date === date && d.flokkur === cat);
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
    <div className="min-h-screen bg-neutral-50" style={{
      background: `
        radial-gradient(circle at 20% 50%, rgba(110, 139, 116, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(184, 132, 125, 0.02) 0%, transparent 50%),
        #FAFAFA
      `
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      {/* Custom Styles */}
      <style>{styles}</style>
      
      {/* Custom Elegant Neutral Palette */}
      <style>{`
        .text-sage-600 { color: #6E8B74; }
        .text-sage-700 { color: #5D7A63; }
        .bg-sage-50 { background-color: #F5F8F6; }
        .bg-sage-100 { background-color: #EDF2EF; }
        .bg-sage-600 { background-color: #6E8B74; }
        .text-terracotta-600 { color: #C67B5C; }
        .text-rose-600 { color: #DC6B5F; }
        .bg-terracotta-50 { background-color: #FFF5F2; }
        .bg-rose-100 { background-color: #FFE5E0; }
        .border-sage-200 { border-color: #D4E2D8; }
        .border-terracotta-200 { border-color: #F4D5C8; }
        .bg-slate-50 { background-color: #F8F9FA; }
      `}</style>
      
      {/* NORMAL DASHBOARD */}
      <>
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

        {initialLoading ? (
          // SKELETON LOADING SCREENS
          <>
            {/* Executive Summary Skeleton */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl border-2 border-neutral-300 p-6 shadow-md animate-fade-in-up" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-neutral-300"></div>
                  <div className="skeleton h-8 w-64"></div>
                </div>
                <div className="skeleton h-3 w-32"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg p-4 border-2 border-neutral-200 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="skeleton h-4 w-40 mb-3"></div>
                    <div className="skeleton h-32 w-full mb-3"></div>
                    <div className="skeleton h-3 w-full mb-2"></div>
                    <div className="skeleton h-3 w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* KPI Boxes Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-xl bg-white border-r border-t border-b border-neutral-200 p-4 shadow-sm animate-fade-in-up" style={{ borderLeft: '4px solid #E5E7EB', animationDelay: `${i * 100}ms` }}>
                  <div className="skeleton h-3 w-32 mb-2"></div>
                  <div className="skeleton h-2 w-20 mb-4"></div>
                  <div className="skeleton h-10 w-full mb-3"></div>
                  <div className="flex items-center gap-2">
                    <div className="skeleton h-3 w-16"></div>
                    <div className="skeleton h-6 w-24 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top 10 Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-4 shadow-sm animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <div className="skeleton h-5 w-48 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: `${500 + i * 50}ms` }}>
                      <div className="skeleton h-4 w-32"></div>
                      <div className="skeleton h-4 w-24"></div>
                      <div className="skeleton h-4 w-16"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <div className="skeleton h-5 w-40 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${600 + i * 50}ms` }}>
                      <div className="skeleton h-4 w-full mb-1"></div>
                      <div className="skeleton h-3 w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filters Skeleton */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-5 shadow-md animate-fade-in-up" style={{ animationDelay: '800ms' }}>
              <div className="skeleton h-6 w-56 mb-4"></div>
              <div className="bg-white rounded-lg border border-blue-200 p-4 mb-4">
                <div className="skeleton h-4 w-32 mb-3"></div>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton h-8 w-32 rounded-lg"></div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-blue-200 p-4">
                <div className="skeleton h-4 w-40 mb-3"></div>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="skeleton h-8 w-24 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          // ACTUAL CONTENT
          <>
        {/* Executive Summary - Key Insights with Visual Support */}
        {kpis && (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl border-2 border-neutral-300 p-6 shadow-md animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 pulse-strong"></div>
                <h2 className="text-2xl font-bold text-neutral-900" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.03em' }}>
                  Executive Summary
                </h2>
              </div>
            </div>
            
            {/* Seasonal Context Box - Mobile Optimized */}
            {seasonalData && (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mb-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">Seasonal Performance</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN - Current Month Stats */}
                <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
                  <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-200">
                    <div className="text-sm font-bold text-neutral-900">
                      {(() => {
                        const currentDate = new Date(kpis.currentMonthName);
                        const month = currentDate.toLocaleString('en-US', { month: 'long' });
                        return month;
                      })()} 2025
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {(() => {
                      const { currentMonth: month, currentValue, historicalByMonth } = seasonalData;
                      const currentMonthData = historicalByMonth[month];
                      const avg = currentMonthData.length > 0 
                        ? currentMonthData.reduce((a, b) => a + b, 0) / currentMonthData.length 
                        : 0;
                      const variance = currentMonthData.length > 0
                        ? currentMonthData.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / currentMonthData.length
                        : 0;
                      const stdDev = Math.sqrt(variance);
                      const expectedMin = Math.round((avg - stdDev) / 1000);
                      const expectedMax = Math.round((avg + stdDev) / 1000);
                      const actualK = currentValue / 1000;
                      
                      let status = 'Normal';
                      let statusColor = 'text-emerald-600';
                      let statusDot = 'bg-emerald-500';
                      if (actualK < (avg - 1.5 * stdDev) / 1000 || actualK > (avg + 1.5 * stdDev) / 1000) {
                        status = 'Unusual';
                        statusColor = 'text-red-600';
                        statusDot = 'bg-red-500';
                      } else if (actualK < expectedMin || actualK > expectedMax) {
                        status = 'Watch';
                        statusColor = 'text-amber-600';
                        statusDot = 'bg-amber-500';
                      }
                      
                      let season = 'LOW SEASON';
                      let pillBg = 'bg-neutral-100';
                      let pillText = 'text-neutral-700';
                      let pillBorder = 'border-neutral-300';
                      if (month >= 5 && month <= 7) {
                        season = 'HIGH SEASON';
                        pillBg = 'bg-emerald-50';
                        pillText = 'text-emerald-700';
                        pillBorder = 'border-emerald-300';
                      } else if (month >= 8 && month <= 9) {
                        season = 'SHOULDER';
                        pillBg = 'bg-amber-50';
                        pillText = 'text-amber-700';
                        pillBorder = 'border-amber-300';
                      }
                      
                      return (
                        <>
                          <div className="flex items-center justify-between mb-8">
                            <div className={`inline-flex items-center px-3 py-1.5 rounded-full border ${pillBg} ${pillText} ${pillBorder}`}>
                              <span className="text-xs font-semibold tracking-wide uppercase">{season}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${statusDot}`}></div>
                              <span className={`text-xs font-semibold ${statusColor}`}>{status}</span>
                            </div>
                          </div>
                          
                          <div className="mb-8">
                            <div className="text-5xl font-bold text-neutral-900 tabular-nums tracking-tight mb-2">
                              {kpis.currentMonth.replace(/,/g, ',')}
                            </div>
                            <div className="text-sm text-neutral-600">foreign passengers</div>
                          </div>
                          
                          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-2">
                              Historical Average (2017-2019, 2023-2024)
                            </div>
                            <div className="text-2xl font-bold text-blue-900 tabular-nums">
                              {Math.round(avg / 1000)}k
                            </div>
                            <div className="text-xs text-blue-700 mt-1">
                              passengers per month
                            </div>
                          </div>
                          
                          <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-neutral-600">vs Historical</span>
                              {(() => {
                                const diff = currentValue - avg;
                                const diffPercent = ((diff / avg) * 100).toFixed(1);
                                const isUp = diff > 0;
                                return (
                                  <div className={`flex items-center gap-1 ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {isUp ? '↑' : '↓'}
                                    <span className="text-sm font-bold">{Math.abs(diffPercent)}%</span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          
                          <div className="pt-5 border-t border-neutral-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-neutral-500 font-medium">Expected range</span>
                              <span className="text-lg font-bold text-neutral-900 tabular-nums">
                                {expectedMin}k - {expectedMax}k
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* RIGHT COLUMN - Chart and Volume */}
                <div className="space-y-6">
                  {/* Chart */}
                  <div className="border border-neutral-200 rounded-lg p-5 bg-white">
                    <div className="text-[10px] text-neutral-800 uppercase tracking-wider font-semibold mb-4">MONTHLY PATTERN (2017-2025)</div>
                    <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart 
                      data={(() => {
                        const { currentMonth, historicalAvg, ytd2025ByMonth } = seasonalData;
                        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return monthLabels.map((label, i) => ({
                          month: label,
                          monthIndex: i,
                          historical: historicalAvg[i],
                          current: i <= currentMonth ? ytd2025ByMonth[i] : null
                        }));
                      })()}
                      margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                      <XAxis 
                        dataKey="month"
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e5e5' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e5e5' }}
                        tickLine={false}
                        tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px',
                          fontSize: '12px',
                          padding: '8px 12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value, name) => {
                          if (value === null) return ['N/A', name];
                          return [`${(value/1000).toFixed(0)}k`, name];
                        }}
                      />
                      {/* 2025 bars - render first (background) */}
                      <Bar 
                        dataKey="current"
                        name="2025 YTD"
                        radius={[4, 4, 0, 0]}
                        fillOpacity={0.9}
                      >
                        {(() => {
                          const { currentMonth } = seasonalData;
                          const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return monthLabels.map((label, index) => {
                            let fill = '#a3a3a3';
                            if (index >= 5 && index <= 7) fill = '#10b981';
                            else if (index >= 8 && index <= 9) fill = '#f59e0b';
                            return <Cell key={`cell-${index}`} fill={fill} />;
                          });
                        })()}
                      </Bar>
                      {/* Historical average line - render second (on top) */}
                      <Line 
                        dataKey="historical"
                        name="Historical Average"
                        stroke="#dc2626"
                        strokeWidth={4}
                        strokeDasharray="8 4"
                        dot={false}
                        activeDot={{ r: 5, fill: '#dc2626' }}
                        connectNulls={true}
                        type="monotone"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-neutral-200">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-[3px] border-t-[3px] border-dashed" style={{ borderColor: '#dc2626' }}></div>
                      </div>
                      <span className="text-[10px] text-neutral-600 font-medium">Historical Average</span>
                      <span className="text-[9px] text-neutral-400">(2017-2019, 2023-2024, excl. 2020-2022)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-3 rounded-sm bg-emerald-500"></div>
                        <div className="w-2 h-3 rounded-sm bg-amber-500"></div>
                        <div className="w-2 h-3 rounded-sm bg-neutral-400"></div>
                      </div>
                      <span className="text-[10px] text-neutral-600 font-medium">2025 YTD</span>
                    </div>
                  </div>
                </div>
                
                  {/* Volume Bars */}
                  <div className="border border-neutral-200 rounded-lg p-5">
                    <div className="text-[10px] text-neutral-800 uppercase tracking-wider font-semibold mb-4">TYPICAL MONTHLY VOLUME</div>
                    <div className="space-y-4">
                      {(() => {
                        const { historicalByMonth } = seasonalData;
                        const highSeasonMonths = [5, 6, 7];
                        const shoulderMonths = [8, 9];
                        const lowSeasonMonths = [0, 1, 2, 3, 4, 10, 11];
                        
                        const calcAvg = (months) => {
                          const allValues = months.flatMap(m => historicalByMonth[m]);
                          return allValues.length > 0 
                            ? allValues.reduce((a, b) => a + b, 0) / allValues.length 
                            : 0;
                        };
                        
                        const highAvg = calcAvg(highSeasonMonths);
                        const shoulderAvg = calcAvg(shoulderMonths);
                        const lowAvg = calcAvg(lowSeasonMonths);
                        const maxAvg = Math.max(highAvg, shoulderAvg, lowAvg);
                        
                        const calcRange = (months) => {
                          const allValues = months.flatMap(m => historicalByMonth[m]);
                          if (allValues.length === 0) return { min: 0, max: 0 };
                          return {
                            min: Math.round(Math.min(...allValues) / 1000),
                            max: Math.round(Math.max(...allValues) / 1000)
                          };
                        };
                        
                        const highRange = calcRange(highSeasonMonths);
                        const shoulderRange = calcRange(shoulderMonths);
                        const lowRange = calcRange(lowSeasonMonths);
                        
                        return (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 w-36 flex-shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                <span className="text-xs font-medium text-neutral-700">High Season</span>
                              </div>
                              <div className="flex-1 bg-neutral-100 rounded-sm h-6 relative overflow-hidden">
                                <div className="bg-emerald-500 h-6" style={{ width: `${(highAvg / maxAvg) * 100}%` }}></div>
                              </div>
                              <span className="text-xs font-mono text-neutral-600 w-20 text-right tabular-nums">{highRange.min}-{highRange.max}k</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 w-36 flex-shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                <span className="text-xs font-medium text-neutral-700">Shoulder</span>
                              </div>
                              <div className="flex-1 bg-neutral-100 rounded-sm h-6 relative overflow-hidden">
                                <div className="bg-amber-500 h-6" style={{ width: `${(shoulderAvg / maxAvg) * 100}%` }}></div>
                              </div>
                              <span className="text-xs font-mono text-neutral-600 w-20 text-right tabular-nums">{shoulderRange.min}-{shoulderRange.max}k</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 w-36 flex-shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-neutral-400"></div>
                                <span className="text-xs font-medium text-neutral-700">Low Season</span>
                              </div>
                              <div className="flex-1 bg-neutral-100 rounded-sm h-6 relative overflow-hidden">
                                <div className="bg-neutral-400 h-6" style={{ width: `${(lowAvg / maxAvg) * 100}%` }}></div>
                              </div>
                              <span className="text-xs font-mono text-neutral-600 w-20 text-right tabular-nums">{lowRange.min}-{lowRange.max}k</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Insight 1: Current Month Performance */}
              <div className="bg-white rounded-lg p-4 border-2 border-neutral-200 relative group hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0ms', willChange: 'box-shadow' }}>
                {/* Buttons - Top Right (show on hover) */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button 
                    onClick={() => generateEmbedCode('insight', 'Current Month Performance')}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors shadow-sm"
                    title="Get embed code"
                  >
                    <Code className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                  <button 
                    onClick={() => shareKPI('Current Month Performance', `${kpis.currentMonthName} recorded ${kpis.currentMonth} passengers, ${kpis.yoyChange >= 0 ? 'up' : 'down'} ${Math.abs(kpis.yoyChange).toFixed(1)}% YoY`)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors shadow-sm"
                    title="Share on Twitter"
                  >
                    <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                </div>
                
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-h-[80px]">
                    <h3 className="text-[13px] font-bold text-neutral-800 mb-2.5" style={{ letterSpacing: '-0.01em' }}>Current Month Performance</h3>
                    <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">
                      {kpis.currentMonthName} recorded <span className="font-semibold">{kpis.currentMonth} passengers</span>, 
                      {kpis.yoyChange >= 0 ? ' up ' : ' down '}
                      <span className={`font-semibold ${kpis.yoyChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {Math.abs(kpis.yoyChange).toFixed(1)}% YoY
                      </span>
                      {kpis.yoyChange < 0 && kpis.ttmChange >= 0 
                        ? '. However, TTM trend remains positive at +' + kpis.ttmChange.toFixed(1) + '%.' 
                        : kpis.yoyChange < 0 && kpis.ttmChange < 0 
                        ? '. TTM trend is also negative at ' + kpis.ttmChange.toFixed(1) + '%.'
                        : '.'}
                    </p>
                  </div>
                </div>
                {/* 6-month YoY % trend with proper axes */}
                {kpis.overallSparkline && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-medium text-neutral-600">YoY % Change (Last 6 Months)</p>
                      <p className="text-[9px] text-neutral-500">Current Month: 
                        <span className={`font-semibold ml-1 ${
                          kpis.yoyChange >= 0 
                            ? 'text-emerald-600' : 'text-red-600'
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
                                <text x="30" y={chartTop + 5} textAnchor="end" className="text-[10px]" fill="#999">+{scale}%</text>
                                <text x="30" y={chartMiddle + 3} textAnchor="end" className="text-[10px]" fill="#666">0%</text>
                                <text x="30" y={chartBottom + 5} textAnchor="end" className="text-[10px]" fill="#999">-{scale}%</text>
                                
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
                                  const isLast = i === kpis.overallSparkline.length - 1;
                                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                  
                                  return (
                                    <g key={`dot-${i}`}>
                                      {isLast && (
                                        <circle
                                          cx={x}
                                          cy={y}
                                          r="8"
                                          fill={point.value >= 0 ? '#10B981' : '#EF4444'}
                                          opacity="0.2"
                                          className="pulse-subtle"
                                        />
                                      )}
                                      <circle
                                        cx={x}
                                        cy={y}
                                        r={isLast ? "5" : "3"}
                                        fill={point.value >= 0 ? '#10B981' : '#EF4444'}
                                        stroke="#fff"
                                        strokeWidth="2"
                                        opacity={isLast ? "1" : "0.9"}
                                        style={isLast ? { filter: `drop-shadow(0 0 3px ${point.value >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'})` } : {}}
                                        className="cursor-pointer hover:r-6 transition-all"
                                      >
                                        <title>{monthNames[point.month - 1]}: {point.value > 0 ? '+' : ''}{point.value.toFixed(1)}%</title>
                                      </circle>
                                    </g>
                                  );
                                })}
                                
                                {/* X-axis month labels */}
                                {kpis.overallSparkline.map((point, i) => {
                                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                  const x = chartLeft + (i / (kpis.overallSparkline.length - 1)) * (chartRight - chartLeft);
                                  return (
                                    <text key={`month-${i}`} x={x} y={chartBottom + 15} textAnchor="middle" className="text-[10px]" fill="#999">
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
                <div className="rounded-lg p-4 border-2 border-sage-200 relative group hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #F9FBF9 100%)',
                  animationDelay: '100ms',
                  willChange: 'box-shadow'
                }}>
                  {/* Buttons - Top Right (show on hover) */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => generateEmbedCode('insight', 'Leading Growth Market')}
                      className="p-1.5 hover:bg-white/80 rounded-lg transition-colors shadow-sm"
                      title="Get embed code"
                    >
                      <Code className="w-3.5 h-3.5 text-neutral-500" />
                    </button>
                    <button 
                      onClick={() => shareKPI('Leading Growth Market', `${getCountryName(kpis.topGrower.name)} leads with +${kpis.topGrower.change} passengers, representing a +${kpis.topGrower.percent.toFixed(1)}% increase`)}
                      className="p-1.5 hover:bg-white/80 rounded-lg transition-colors shadow-sm"
                      title="Share on Twitter"
                    >
                      <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                    </button>
                  </div>
                  
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-h-[80px]">
                      <h3 className="text-[13px] font-bold text-sage-700 mb-2.5" style={{ letterSpacing: '-0.01em' }}>Leading Growth Market - Trailing Twelve Months</h3>
                      <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">
                        <span className="font-semibold">{getCountryName(kpis.topGrower.name)}</span> leads with 
                        <span className="font-semibold text-sage-600"> +{kpis.topGrower.change} passengers</span>
                        , representing a <span className="font-semibold text-sage-600">+{kpis.topGrower.percent.toFixed(1)}%</span> increase.
                      </p>
                    </div>
                  </div>
                  {/* 6-month YoY % trend with proper axes */}
                  {kpis.topGrowerSparkline && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-medium text-sage-700">YoY % Change (Last 6 Months)</p>
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
                                  <text x="30" y={chartTop + 5} textAnchor="end" className="text-[10px]" fill="#5D7A63">+{scale}%</text>
                                  <text x="30" y={chartMiddle + 3} textAnchor="end" className="text-[10px]" fill="#666">0%</text>
                                  <text x="30" y={chartBottom + 5} textAnchor="end" className="text-[10px]" fill="#999">-{scale}%</text>
                                  
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
                                    const isLast = i === kpis.topGrowerSparkline.length - 1;
                                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    
                                    return (
                                      <g key={`dot-${i}`}>
                                        {isLast && (
                                          <circle
                                            cx={x}
                                            cy={y}
                                            r="8"
                                            fill={point.value >= 0 ? '#10B981' : '#EF4444'}
                                            opacity="0.2"
                                            className="pulse-subtle"
                                          />
                                        )}
                                        <circle 
                                          cx={x} 
                                          cy={y} 
                                          r={isLast ? "5" : "3"} 
                                          fill={point.value >= 0 ? '#10B981' : '#EF4444'}
                                          stroke="#fff" 
                                          strokeWidth="2"
                                          opacity={isLast ? "1" : "0.9"}
                                          style={isLast ? { filter: `drop-shadow(0 0 3px ${point.value >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'})` } : {}}
                                          className="cursor-pointer hover:r-6 transition-all"
                                        >
                                          <title>{monthNames[point.month - 1]}: {point.value > 0 ? '+' : ''}{point.value.toFixed(1)}%</title>
                                        </circle>
                                      </g>
                                    );
                                  })}
                                  
                                  {/* X-axis labels */}
                                  {kpis.topGrowerSparkline.map((point, i) => {
                                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    const x = chartLeft + (i / (kpis.topGrowerSparkline.length - 1)) * (chartRight - chartLeft);
                                    return (
                                      <text key={`month-${i}`} x={x} y={chartBottom + 15} textAnchor="middle" className="text-[10px]" fill="#999">
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
                <div className="rounded-lg p-4 border-2 border-terracotta-200 relative group hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #FEFAF9 100%)',
                  animationDelay: '200ms',
                  willChange: 'box-shadow'
                }}>
                  {/* Buttons - Top Right (show on hover) */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => generateEmbedCode('insight', 'Market Under Pressure')}
                      className="p-1.5 hover:bg-white/80 rounded-lg transition-colors shadow-sm"
                      title="Get embed code"
                    >
                      <Code className="w-3.5 h-3.5 text-neutral-500" />
                    </button>
                    <button 
                      onClick={() => shareKPI('Market Under Pressure', `${getCountryName(kpis.topDecliner.name)} declined by -${kpis.topDecliner.change} passengers, a ${kpis.topDecliner.percent.toFixed(1)}% decrease`)}
                      className="p-1.5 hover:bg-white/80 rounded-lg transition-colors shadow-sm"
                      title="Share on Twitter"
                    >
                      <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                    </button>
                  </div>
                  
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-h-[80px]">
                      <h3 className="text-[13px] font-bold text-terracotta-600 mb-2.5" style={{ letterSpacing: '-0.01em' }}>Market Under Pressure - Trailing Twelve Months</h3>
                      <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">
                        <span className="font-semibold">{getCountryName(kpis.topDecliner.name)}</span> declined by 
                        <span className="font-semibold text-terracotta-600"> -{kpis.topDecliner.change} passengers</span>
                        , a <span className="font-semibold text-terracotta-600">{kpis.topDecliner.percent.toFixed(1)}%</span> decrease.
                      </p>
                    </div>
                  </div>
                  {/* 6-month YoY % trend with proper axes */}
                  {kpis.topDeclinerSparkline && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-medium text-terracotta-600">YoY % Change (Last 6 Months)</p>
                        <p className="text-[9px] text-neutral-600">TTM YoY: <span className="font-semibold ml-1 text-terracotta-600">{kpis.topDecliner.percent.toFixed(1)}%</span>
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
                                  <text x="30" y={chartTop + 5} textAnchor="end" className="text-[10px]" fill="#999">+{scale}%</text>
                                  <text x="30" y={chartMiddle + 3} textAnchor="end" className="text-[10px]" fill="#666">0%</text>
                                  <text x="30" y={chartBottom + 5} textAnchor="end" className="text-[10px]" fill="#B8847D">-{scale}%</text>
                                  
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
                                    const isLast = i === kpis.topDeclinerSparkline.length - 1;
                                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    
                                    return (
                                      <g key={`dot-${i}`}>
                                        {isLast && (
                                          <circle
                                            cx={x}
                                            cy={y}
                                            r="8"
                                            fill={point.value >= 0 ? '#10B981' : '#EF4444'}
                                            opacity="0.2"
                                            className="pulse-subtle"
                                          />
                                        )}
                                        <circle 
                                          cx={x} 
                                          cy={y} 
                                          r={isLast ? "5" : "3"} 
                                          fill={point.value >= 0 ? '#10B981' : '#EF4444'}
                                          stroke="#fff" 
                                          strokeWidth="2"
                                          opacity={isLast ? "1" : "0.9"}
                                          style={isLast ? { filter: `drop-shadow(0 0 3px ${point.value >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'})` } : {}}
                                          className="cursor-pointer hover:r-6 transition-all"
                                        >
                                          <title>{monthNames[point.month - 1]}: {point.value > 0 ? '+' : ''}{point.value.toFixed(1)}%</title>
                                        </circle>
                                      </g>
                                    );
                                  })}
                                  
                                  {/* X-axis labels */}
                                  {kpis.topDeclinerSparkline.map((point, i) => {
                                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    const x = chartLeft + (i / (kpis.topDeclinerSparkline.length - 1)) * (chartRight - chartLeft);
                                    return (
                                      <text key={`month-${i}`} x={x} y={chartBottom + 15} textAnchor="middle" className="text-[10px]" fill="#999">
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


        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Monthly Passengers */}
            <div 
              className="group rounded-xl bg-white border-r border-t border-b border-neutral-200 p-4 shadow-sm hover:shadow-2xl transition-all duration-300 relative animate-fade-in-up"
              style={{ 
                animationDelay: '0ms',
                borderLeft: `4px solid #3B82F6`,
                willChange: 'box-shadow'
              }}
            >
              
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50/0 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative">
                {/* Buttons - Top Right (show on hover) */}
                <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <button 
                    onClick={() => generateEmbedCode('kpi', 'Monthly Passengers')}
                    className="p-1.5 hover:bg-white/80 rounded-lg transition-colors shadow-sm"
                    title="Get embed code"
                  >
                    <Code className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                  <button 
                    onClick={() => shareKPI('Monthly Passengers', `${kpis.currentMonth} passengers in ${kpis.currentMonthName}\n${kpis.yoyChange > 0 ? '+' : ''}${kpis.yoyChange.toFixed(1)}% YoY vs ${kpis.lastYearMonthName}`)}
                    className="p-1.5 hover:bg-white/80 rounded-lg transition-colors shadow-sm"
                    title="Share on Twitter"
                  >
                    <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                </div>
                
                <p className="text-xs font-semibold text-neutral-800 tracking-tight mb-1">Monthly Passengers</p>
                <p className="text-[9px] text-neutral-500 mb-2.5">{kpis.currentMonthName}</p>
                
                <div className="mb-2 h-12 flex items-center">
                  <p className="text-3xl font-bold text-neutral-900 leading-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                    {kpis.currentMonth}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-[10px] text-neutral-500">vs {kpis.lastYearMonth}</span>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
                    kpis.yoyChange >= 0.5 ? 'bg-emerald-50 border border-emerald-200' : 
                    kpis.yoyChange <= -0.5 ? 'bg-red-50 border border-red-200' : 
                    'bg-neutral-100 border border-neutral-200'
                  }`}>
                    {kpis.yoyChange >= 0.5 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : 
                     kpis.yoyChange <= -0.5 ? <TrendingDown className="w-3.5 h-3.5 text-red-600" /> :
                     <Minus className="w-3.5 h-3.5 text-neutral-500" />}
                    <span className={`text-xs font-semibold ${
                      kpis.yoyChange >= 0.5 ? 'text-emerald-700' : 
                      kpis.yoyChange <= -0.5 ? 'text-red-700' : 
                      'text-neutral-600'
                    }`}>
                      {kpis.yoyChange > 0 ? '+' : ''}{kpis.yoyChange.toFixed(1)}% YoY
                    </span>
                  </div>
                </div>
                
                {/* Clean Footer */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <img src="/iceland-insights-logo - text.png" alt="IcelandInsights" className="h-3.5 opacity-50" />
                  <span className="text-[9px] text-neutral-400 uppercase tracking-wider">KEF Airport</span>
                </div>
              </div>
            </div>
            
            {/* Card 2: TTM Passengers */}
            <div 
              className="group rounded-xl bg-white border-r border-t border-b border-neutral-200 p-4 shadow-sm hover:shadow-2xl transition-all duration-300 relative animate-fade-in-up"
              style={{ 
                animationDelay: '100ms',
                borderLeft: `4px solid #3B82F6`,
                willChange: 'box-shadow'
              }}
            >
              
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50/0 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative">
                <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <button 
                    onClick={() => generateEmbedCode('kpi', 'TTM - Foreign Passengers')}
                    className="p-1.5 hover:bg-white/80 rounded-lg transition-colors shadow-sm"
                    title="Get embed code"
                  >
                    <Code className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                  <button 
                    onClick={() => shareKPI('TTM - Foreign Passengers', `${kpis.ttmTotal} passengers (${kpis.ttmPeriod})\n${kpis.ttmChange > 0 ? '+' : ''}${kpis.ttmChange.toFixed(1)}% vs prior TTM`)}
                    className="p-1.5 hover:bg-white/80 rounded-lg transition-colors shadow-sm"
                    title="Share on Twitter"
                  >
                    <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                </div>
                
                <p className="text-xs font-semibold text-neutral-800 tracking-tight mb-1">TTM Passengers</p>
                <p className="text-[9px] text-neutral-500 mb-2.5">{kpis.ttmPeriod}</p>
                
                <div className="mb-2 h-12 flex items-center">
                  <p className="text-3xl font-bold text-neutral-900 leading-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                    {kpis.ttmTotal}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-[10px] text-neutral-500">vs {kpis.lastTtmTotal}</span>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
                    kpis.ttmChange >= 0.5 ? 'bg-emerald-50 border border-emerald-200' : 
                    kpis.ttmChange <= -0.5 ? 'bg-red-50 border border-red-200' : 
                    'bg-neutral-100 border border-neutral-200'
                  }`}>
                    {kpis.ttmChange >= 0.5 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : 
                     kpis.ttmChange <= -0.5 ? <TrendingDown className="w-3.5 h-3.5 text-red-600" /> :
                     <Minus className="w-3.5 h-3.5 text-neutral-500" />}
                    <span className={`text-xs font-semibold ${
                      kpis.ttmChange >= 0.5 ? 'text-emerald-700' : 
                      kpis.ttmChange <= -0.5 ? 'text-red-700' : 
                      'text-neutral-600'
                    }`}>
                      {kpis.ttmChange > 0 ? '+' : ''}{kpis.ttmChange.toFixed(1)}% YoY
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <img src="/iceland-insights-logo - text.png" alt="IcelandInsights" className="h-3.5 opacity-50" />
                  <span className="text-[9px] text-neutral-400 uppercase tracking-wider">KEF Airport</span>
                </div>
              </div>
            </div>

            {/* Card 3: Largest Gain */}
            <div 
              className="group rounded-xl bg-white border-r border-t border-b border-neutral-200 p-4 shadow-sm hover:shadow-2xl transition-all duration-300 relative animate-fade-in-up"
              style={{ 
                animationDelay: '200ms',
                borderLeft: `4px solid #3B82F6`,
                willChange: 'box-shadow'
              }}
            >
              
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50/0 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative">
                <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <button 
                    onClick={() => generateEmbedCode('kpi', 'TTM - Largest Gain')}
                    className="p-1.5 hover:bg-white/80 rounded-lg transition-colors shadow-sm"
                    title="Get embed code"
                  >
                    <Code className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                  <button 
                    onClick={() => shareKPI('TTM - Largest Gain', `${getCountryName(kpis.topGrower?.name)}\n${kpis.topGrower?.current.toLocaleString()} vs ${kpis.topGrower?.prior.toLocaleString()} prior TTM\n+${kpis.topGrower?.change} (+${kpis.topGrower?.percent.toFixed(1)}%)`)}
                    className="p-1.5 hover:bg-white/80 rounded-lg transition-colors shadow-sm"
                    title="Share on Twitter"
                  >
                    <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                </div>
                
                <p className="text-xs font-semibold text-neutral-800 tracking-tight mb-1">Largest Gain</p>
                <p className="text-[9px] text-neutral-500 mb-2.5">{kpis.ttmPeriod}</p>
                
                <div className="mb-2 h-12 flex items-center">
                  <p className="text-3xl font-bold text-neutral-900 leading-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                    {kpis.topGrower && getCountryName(kpis.topGrower.name)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-[10px] text-neutral-500">+{kpis.topGrower?.change}</span>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">
                      +{kpis.topGrower?.percent.toFixed(1)}% YoY
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <img src="/iceland-insights-logo - text.png" alt="IcelandInsights" className="h-3.5 opacity-50" />
                  <span className="text-[9px] text-neutral-400 uppercase tracking-wider">KEF Airport</span>
                </div>
              </div>
            </div>

            {/* Card 4: Largest Decline */}
            <div 
              className="group rounded-xl bg-white border-r border-t border-b border-neutral-200 p-4 shadow-sm hover:shadow-2xl transition-all duration-300 relative animate-fade-in-up"
              style={{ 
                animationDelay: '300ms',
                borderLeft: `4px solid #3B82F6`,
                willChange: 'box-shadow'
              }}
            >
              
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50/0 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="relative">
                <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <button 
                    onClick={() => generateEmbedCode('kpi', 'TTM - Largest Decline')}
                    className="p-1.5 hover:bg-white/80 rounded-lg transition-colors shadow-sm"
                    title="Get embed code"
                  >
                    <Code className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                  <button 
                    onClick={() => shareKPI('TTM - Largest Decline', `${getCountryName(kpis.topDecliner?.name)}\n${kpis.topDecliner?.current.toLocaleString()} vs ${kpis.topDecliner?.prior.toLocaleString()} prior TTM\n-${kpis.topDecliner?.change} (${kpis.topDecliner?.percent.toFixed(1)}%)`)}
                    className="p-1.5 hover:bg-white/80 rounded-lg transition-colors shadow-sm"
                    title="Share on Twitter"
                  >
                    <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                </div>
                
                <p className="text-xs font-semibold text-neutral-800 tracking-tight mb-1">Largest Decline</p>
                <p className="text-[9px] text-neutral-500 mb-2.5">{kpis.ttmPeriod}</p>
                
                <div className="mb-2 h-12 flex items-center">
                  <p className="text-3xl font-bold text-neutral-900 leading-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                    {kpis.topDecliner && getCountryName(kpis.topDecliner.name)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-[10px] text-neutral-500">-{kpis.topDecliner?.change}</span>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
                    <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-xs font-semibold text-red-700">
                      {kpis.topDecliner?.percent.toFixed(1)}% YoY
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <img src="/iceland-insights-logo - text.png" alt="IcelandInsights" className="h-3.5 opacity-50" />
                  <span className="text-[9px] text-neutral-400 uppercase tracking-wider">KEF Airport</span>
                </div>
              </div>
            </div>
            
          </div>
        )}
        {/* Top 10 Markets - Completely Static, Never Affected by Filters */}
        {kpis && kpis.top10 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-4 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h3 className="text-lg font-semibold text-neutral-900 mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                Top 10 Markets (TTM)
              </h3>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-neutral-500">{kpis.ttmPeriod}</p>
                <p className="text-[9px] text-neutral-400 italic">Click row to filter</p>
              </div>
              
              {/* Sortable column headers */}
              <div className="grid grid-cols-6 gap-1.5 md:gap-3 mb-2 pb-2 px-2 md:px-3 border-b-2 border-neutral-200">
                <p className="text-[11px] uppercase tracking-wider text-neutral-600 font-semibold col-span-2">Nationality</p>
                
                <button 
                  onClick={() => {
                    setSortConfig({
                      key: 'total',
                      direction: sortConfig.key === 'total' && sortConfig.direction === 'desc' ? 'asc' : 'desc'
                    });
                  }}
                  className="text-[11px] uppercase tracking-wider text-neutral-600 font-semibold text-right hover:text-neutral-900 flex items-center justify-end gap-1 transition-colors"
                >
                  Passengers
                  {sortConfig.key === 'total' ? (
                    sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
                
                <button 
                  onClick={() => {
                    setSortConfig({
                      key: 'absoluteChange',
                      direction: sortConfig.key === 'absoluteChange' && sortConfig.direction === 'desc' ? 'asc' : 'desc'
                    });
                  }}
                  className="text-[11px] uppercase tracking-wider text-neutral-600 font-semibold text-right hover:text-neutral-900 flex items-center justify-end gap-1 transition-colors"
                >
                  Abs Change
                  {sortConfig.key === 'absoluteChange' ? (
                    sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
                
                <button 
                  onClick={() => {
                    setSortConfig({
                      key: 'ratio',
                      direction: sortConfig.key === 'ratio' && sortConfig.direction === 'desc' ? 'asc' : 'desc'
                    });
                  }}
                  className="text-[11px] uppercase tracking-wider text-neutral-600 font-semibold text-right hover:text-neutral-900 flex items-center justify-end gap-1 transition-colors"
                >
                  % Total
                  {sortConfig.key === 'ratio' ? (
                    sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
                
                <button 
                  onClick={() => {
                    setSortConfig({
                      key: 'yoy',
                      direction: sortConfig.key === 'yoy' && sortConfig.direction === 'desc' ? 'asc' : 'desc'
                    });
                  }}
                  className="text-[11px] uppercase tracking-wider text-neutral-600 font-semibold text-right hover:text-neutral-900 flex items-center justify-end gap-1 transition-colors"
                >
                  YoY %
                  {sortConfig.key === 'yoy' ? (
                    sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                  ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </div>
              
              <div className="space-y-1">
                {(() => {
                  // Sort the top10 array based on sortConfig
                  const sorted = [...kpis.top10].sort((a, b) => {
                    const aVal = a[sortConfig.key];
                    const bVal = b[sortConfig.key];
                    if (sortConfig.direction === 'asc') {
                      return aVal > bVal ? 1 : -1;
                    } else {
                      return aVal < bVal ? 1 : -1;
                    }
                  });
                  
                  return sorted.map((item, i) => {
                    const isSelected = selectedCategories.includes(item.nat) && selectedCategories.length === 1;
                    return (
                  <div 
                    key={i} 
                    onClick={() => {
                      // If this nationality is already selected, reset to Foreign Passengers
                      if (selectedCategories.length === 1 && selectedCategories[0] === item.nat) {
                        setSelectedCategories(['Útlendingar alls']);
                      } else {
                        // Filter to this nationality
                        setSelectedCategories([item.nat]);
                      }
                    }}
                    className={`grid grid-cols-6 gap-1.5 md:gap-3 py-2.5 px-2 md:px-3 rounded-lg cursor-pointer hover:shadow-sm transition-all animate-fade-in-up ${
                      isSelected ? 'ring-2 ring-blue-400' : ''
                    }`}
                    style={{
                      animationDelay: `${i * 50}ms`,
                      backgroundColor: isSelected ? '#EFF6FF' : (i % 2 === 0 ? '#FFFFFF' : '#F9FAFB')
                    }}
                  >
                    <div className="flex items-center gap-1.5 md:gap-2.5 col-span-2">
                      <span className="text-[10px] md:text-[11px] font-medium text-neutral-400 w-3 md:w-4 text-center tabular-nums">{i + 1}</span>
                      <span className={`text-[11px] md:text-xs ${isSelected ? 'font-semibold text-blue-700' : 'font-medium text-neutral-800'} truncate`}>
                        {getCountryName(item.nat)}
                      </span>
                    </div>
                    <span className="text-[11px] md:text-xs text-neutral-700 font-mono text-right tabular-nums">{item.total.toLocaleString()}</span>
                    <span className={`text-[11px] md:text-xs font-semibold text-right tabular-nums ${
                      item.absoluteChange >= 0 ? 'text-sage-600' : 'text-terracotta-600'
                    }`}>
                      {item.absoluteChange >= 0 ? '+' : ''}{item.absoluteChange.toLocaleString()}
                    </span>
                    <span className="text-[11px] md:text-xs text-neutral-600 font-mono text-right tabular-nums">{item.ratio.toFixed(1)}%</span>
                    <span className={`text-[11px] md:text-xs font-semibold text-right tabular-nums ${
                      item.yoy >= 0.5 ? 'text-sage-600' : 
                      item.yoy <= -0.5 ? 'text-terracotta-600' : 'text-neutral-400'
                    }`}>
                      {item.yoy > 0 ? '+' : ''}{item.yoy.toFixed(1)}%
                    </span>
                  </div>
                  );
                  });
                })()}
                {/* Total row */}
                <div className="grid grid-cols-6 gap-2 py-1.5 mt-1.5 pt-2.5 border-t-2 border-neutral-300">
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="text-xs font-bold text-neutral-900">Total (Top 10)</span>
                  </div>
                  <span className="text-xs text-neutral-900 font-bold font-mono text-right">
                    {kpis.top10.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                  </span>
                  <span className={`text-xs font-bold text-right ${
                    kpis.top10.reduce((sum, item) => sum + item.absoluteChange, 0) >= 0 ? 'text-sage-600' : 'text-terracotta-600'
                  }`}>
                    {kpis.top10.reduce((sum, item) => sum + item.absoluteChange, 0) >= 0 ? '+' : ''}
                    {kpis.top10.reduce((sum, item) => sum + item.absoluteChange, 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-neutral-900 font-bold font-mono text-right">
                    {kpis.top10.reduce((sum, item) => sum + item.ratio, 0).toFixed(1)}%
                  </span>
                  <span className={`text-xs font-bold text-right ${
                    (() => {
                      const currentTotal = kpis.top10.reduce((sum, item) => sum + item.total, 0);
                      const absChange = kpis.top10.reduce((sum, item) => sum + item.absoluteChange, 0);
                      const priorTotal = currentTotal - absChange;
                      const yoy = priorTotal > 0 ? (absChange / priorTotal * 100) : 0;
                      return yoy >= 0.5 ? 'text-sage-600' : yoy <= -0.5 ? 'text-terracotta-600' : 'text-neutral-500';
                    })()
                  }`}>
                    {(() => {
                      const currentTotal = kpis.top10.reduce((sum, item) => sum + item.total, 0);
                      const absChange = kpis.top10.reduce((sum, item) => sum + item.absoluteChange, 0);
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
                    {(kpis.top10TtmTotal - kpis.top10.reduce((sum, item) => sum + item.total, 0)).toLocaleString()}
                  </span>
                  <span className={`text-xs font-medium text-right ${
                    (() => {
                      const currentOther = kpis.top10TtmTotal - kpis.top10.reduce((sum, item) => sum + item.total, 0);
                      const priorOther = kpis.top10PriorTtmTotal - kpis.top10.reduce((sum, item) => sum + item.total - item.absoluteChange, 0);
                      const otherAbsChange = currentOther - priorOther;
                      return otherAbsChange >= 0 ? 'text-sage-600' : 'text-terracotta-600';
                    })()
                  }`}>
                    {(() => {
                      const currentOther = kpis.top10TtmTotal - kpis.top10.reduce((sum, item) => sum + item.total, 0);
                      const priorOther = kpis.top10PriorTtmTotal - kpis.top10.reduce((sum, item) => sum + item.total - item.absoluteChange, 0);
                      const otherAbsChange = currentOther - priorOther;
                      return (otherAbsChange >= 0 ? '+' : '') + otherAbsChange.toLocaleString();
                    })()}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono text-right">
                    {(100 - kpis.top10.reduce((sum, item) => sum + item.ratio, 0)).toFixed(1)}%
                  </span>
                  <span className={`text-xs font-medium text-right ${
                    (() => {
                      const currentOther = kpis.top10TtmTotal - kpis.top10.reduce((sum, item) => sum + item.total, 0);
                      const priorOther = kpis.top10PriorTtmTotal - kpis.top10.reduce((sum, item) => sum + item.total - item.absoluteChange, 0);
                      const otherYoy = priorOther > 0 ? ((currentOther - priorOther) / priorOther * 100) : 0;
                      return otherYoy >= 0.5 ? 'text-sage-600' : otherYoy <= -0.5 ? 'text-terracotta-600' : 'text-neutral-400';
                    })()
                  }`}>
                    {(() => {
                      const currentOther = kpis.top10TtmTotal - kpis.top10.reduce((sum, item) => sum + item.total, 0);
                      const priorOther = kpis.top10PriorTtmTotal - kpis.top10.reduce((sum, item) => sum + item.total - item.absoluteChange, 0);
                      const otherYoy = priorOther > 0 ? ((currentOther - priorOther) / priorOther * 100) : 0;
                      return (otherYoy > 0 ? '+' : '') + otherYoy.toFixed(1) + '%';
                    })()}
                  </span>
                </div>
              </div>
            </div>
            
            {kpis && (
            <div className="lg:col-span-1 bg-white rounded-xl border border-neutral-200 p-4 shadow-sm animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <h3 className="text-lg font-semibold text-neutral-900 mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                By Continent (TTM)
              </h3>
              <p className="text-xs text-neutral-500 mb-3">{kpis.ttmPeriod}</p>
              
              <div className="space-y-3">
                {kpis.continents.map((continent, i) => {
                  return (
                    <div key={i} className="pb-3 border-b border-neutral-100 last:border-0 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                      {/* Continent name */}
                      <div className="mb-1.5">
                        <span className="text-xs font-semibold text-neutral-900">{continent.continent}</span>
                      </div>
                      
                      {/* Bar and YoY pill side by side */}
                      <div className="flex items-center gap-2 mb-1.5">
                        {/* Horizontal bar - takes most space */}
                        <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${continent.percentOfForeign}%` }}
                          />
                        </div>
                        {/* YoY pill inline beside bar */}
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                          continent.yoy >= 0.5 ? 'bg-emerald-50 border border-emerald-200' : 
                          continent.yoy <= -0.5 ? 'bg-red-50 border border-red-200' : 
                          'bg-neutral-100 border border-neutral-200'
                        }`}>
                          {continent.yoy >= 0.5 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : 
                           continent.yoy <= -0.5 ? <TrendingDown className="w-3 h-3 text-red-600" /> :
                           <Minus className="w-3 h-3 text-neutral-500" />}
                          <span className={`text-[10px] font-semibold whitespace-nowrap ${
                            continent.yoy >= 0.5 ? 'text-emerald-700' : 
                            continent.yoy <= -0.5 ? 'text-red-700' : 
                            'text-neutral-600'
                          }`}>
                            {continent.yoy > 0 ? '+' : ''}{continent.yoy.toFixed(1)}% YoY
                          </span>
                        </div>
                      </div>
                      
                      {/* Footer row with absolute number and percentage */}
                      <div className="flex justify-between items-baseline">
                        <span className="text-[11px] text-neutral-700 font-mono">{continent.total.toLocaleString()}</span>
                        <span className="text-[11px] text-neutral-500 font-medium">{continent.percentOfForeign.toFixed(1)}% of foreign</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* COMBINED FILTERS SECTION                */}
        {/* Date Range + Nationality                */}
        {/* These filters ONLY affect data below    */}
        {/* ========================================= */}
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-5 shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Customize Your Analysis
                </h3>
                <p className="text-xs text-neutral-600 mt-0.5">
                  These filters affect charts and detailed data below
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 rounded-lg transition-all border border-neutral-300 shadow-sm"
                title="Export filtered data as CSV"
              >
                <FileDown className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="bg-white rounded-lg border border-blue-200 p-4 mb-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-neutral-800">Time Period</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Preset Buttons */}
              <button
                onClick={() => setDateRangePreset('last6months')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangePreset === 'last6months'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Last 6 Months
              </button>
              
              <button
                onClick={() => setDateRangePreset('last12months')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangePreset === 'last12months'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Last 12 Months
              </button>
              
              <button
                onClick={() => setDateRangePreset('ytd')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangePreset === 'ytd'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Year to Date
              </button>
              
              <button
                onClick={() => setDateRangePreset('last2years')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangePreset === 'last2years'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Last 2 Years
              </button>
              
              {/* Divider */}
              <div className="h-6 w-px bg-neutral-300 mx-1"></div>
              
              {/* Specific Year */}
              <button
                onClick={() => setDateRangePreset('specificYear')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangePreset === 'specificYear'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Specific Year
              </button>
              
              {dateRangePreset === 'specificYear' && (
                <select
                  value={selectedYear || ''}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
              
              {/* Custom Range */}
              <button
                onClick={() => {
                  setDateRangePreset('custom');
                  setShowCustomDatePicker(!showCustomDatePicker);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangePreset === 'custom'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Custom Range
              </button>
            </div>
            
            {/* Custom Date Picker */}
            {showCustomDatePicker && dateRangePreset === 'custom' && (
              <div className="mt-3 pt-3 border-t border-neutral-200 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-neutral-700">From:</label>
                  <input
                    type="month"
                    value={customStartDate || ''}
                    onChange={(e) => setCustomStartDate(e.target.value + '-01')}
                    className="px-2 py-1 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-neutral-700">To:</label>
                  <input
                    type="month"
                    value={customEndDate || ''}
                    onChange={(e) => setCustomEndDate(e.target.value + '-01')}
                    className="px-2 py-1 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {customStartDate && customEndDate && (
                  <span className="text-xs text-emerald-600 font-semibold">
                    ✓ Range selected
                  </span>
                )}
              </div>
            )}
            
            {/* Active Range Display */}
            {userFilteredData.length > 0 && (
              <div className="mt-3 pt-3 border-t border-neutral-200 flex items-center gap-2 text-xs text-neutral-600">
                <span className="font-medium">Viewing:</span>
                <span className="font-semibold text-blue-700">
                  {new Date(userFilteredData[0]?.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  {' → '}
                  {new Date(userFilteredData[userFilteredData.length - 1]?.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <span className="text-neutral-400">•</span>
                <span className="font-semibold text-blue-700">
                  {[...new Set(userFilteredData.map(d => `${d.year}-${d.month}`))].length} months
                </span>
              </div>
            )}
          </div>

          {/* Nationality Filter */}
          <div className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-neutral-800">Nationality Filter</span>
                <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  selectedCategories.length === 2 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {selectedCategories.length}/2 selected
                </div>
              </div>
              
              {selectedCategories.length > 0 && !selectedCategories.includes('Farþegar alls') && !selectedCategories.includes('Útlendingar alls') && (
                <button
                  onClick={() => setSelectedCategories(['Útlendingar alls'])}
                  className="px-3 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Active Filters Display */}
            {selectedCategories.length > 0 && !selectedCategories.includes('Farþegar alls') && !selectedCategories.includes('Útlendingar alls') && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-500">Active:</span>
                {selectedCategories.map(cat => (
                  <div 
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full"
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
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isDisabled
                        ? 'bg-neutral-50 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-50'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:border-blue-400 hover:shadow-sm'
                    }`}
                  >
                    {getCountryName(cat)}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-neutral-500 mt-3 flex items-center gap-1.5">
              <span>💡</span>
              <span>Select up to 2 nationalities to compare in the charts below</span>
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm" id="monthly-trends-chart">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-neutral-900" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                Monthly Trends
              </h3>
              <button
                onClick={() => generateEmbedCode('chart', 'Monthly Trends')}
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Get embed code"
              >
                <Code className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-neutral-500">{monthlyChartPeriod}</p>
              {!selectedCategories.includes('Farþegar alls') && !selectedCategories.includes('Útlendingar alls') && (
                <p className="text-[9px] text-neutral-400 italic">Click bar to filter</p>
              )}
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={chartData} margin={{ top: 20, right: 5, left: -20, bottom: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="date"
                  stroke="#8e8e93" 
                  fontSize={10}
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
                  fontSize={10}
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
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '8px', paddingBottom: '0px' }}
                  formatter={(value) => getCountryName(value)}
                />
                {selectedCategories.map((cat, idx) => (
                  <Bar 
                    key={cat}
                    dataKey={cat}
                    fill={chartColors[idx % chartColors.length]}
                    radius={[4, 4, 0, 0]}
                    name={getCountryName(cat)}
                    cursor="pointer"
                    maxBarSize={selectedCategories.length > 1 ? 35 : 50}
                    label={selectedCategories.length === 1 ? { 
                      position: 'top', 
                      formatter: (value) => value > 0 ? `${(value/1000).toFixed(0)}k` : '',
                      fontSize: 9,
                      fill: '#737373'
                    } : undefined}
                    onClick={() => {
                      // Don't filter on "All Passengers" or "Foreign Passengers"
                      if (cat === 'Farþegar alls' || cat === 'Útlendingar alls') return;
                      
                      // If this category is already the only one selected, reset to Foreign Passengers
                      if (selectedCategories.length === 1 && selectedCategories[0] === cat) {
                        setSelectedCategories(['Útlendingar alls']);
                      } else {
                        // Otherwise, filter to just this category
                        setSelectedCategories([cat]);
                      }
                    }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm" id="yoy-comparison-chart">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-neutral-900" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                Year-over-Year Comparison
              </h3>
              <button
                onClick={() => generateEmbedCode('chart', 'Year-over-Year Comparison')}
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Get embed code"
              >
                <Code className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <p className="text-[10px] text-neutral-500 mb-3">Jan - {yoyCurrentMonth} (2023 vs 2024 vs 2025)</p>
            <ResponsiveContainer width="100%" height={230}>
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
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '8px', paddingBottom: '0px' }}
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
            <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm" id="annual-overview-chart">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-neutral-900" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                  Annual Overview
                </h3>
                <button
                  onClick={() => generateEmbedCode('chart', 'Annual Overview')}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Get embed code"
                >
                  <Code className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 mb-3">2017-2025 YTD</p>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={kpis.annualData} margin={{ top: 20, right: 5, left: -20, bottom: 18 }} barGap={2} barCategoryGap="20%">
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
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', paddingTop: '8px', paddingBottom: '0px' }}
                    formatter={(value) => getCountryName(value)}
                  />
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
            <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm" id="ytd-comparison-chart">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-neutral-900" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                  YTD Comparison
                </h3>
                <button
                  onClick={() => generateEmbedCode('chart', 'YTD Comparison')}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Get embed code"
                >
                  <Code className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 mb-3">Jan - {kpis.currentMonthName.split(' ')[0]} (2017-2025)</p>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={kpis.ytdComparisonData} margin={{ top: 20, right: 5, left: -20, bottom: 18 }} barGap={2} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="year" 
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
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', paddingTop: '8px', paddingBottom: '0px' }}
                    formatter={(value) => getCountryName(value)}
                  />
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
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-neutral-500 tracking-widest uppercase">Date</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-neutral-500 tracking-widest uppercase">Category</th>
                  <th className="text-right px-4 py-2 text-[11px] font-medium text-neutral-500 tracking-widest uppercase">Passengers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {/* Last 12 months */}
                {userFilteredData.slice(-12).reverse().map((row, i) => (
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
                
                {/* Additional 12 months - collapsible */}
                {showAdditional12Months && userFilteredData.slice(-24, -12).reverse().map((row, i) => (
                  <tr key={`additional-${i}`} className="hover:bg-neutral-50 transition-colors bg-blue-50/30">
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
          
          {/* Show Additional 12 Months Button */}
          {(() => {
            // Get unique dates from the data
            const uniqueDates = [...new Set(userFilteredData.map(row => row.date))];
            return uniqueDates.length > 12;
          })() && (
            <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50">
              <button
                onClick={() => setShowAdditional12Months(!showAdditional12Months)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-700 text-xs font-medium rounded hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
              >
                {showAdditional12Months ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Hide Additional 12 Months
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Show Additional 12 Months
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        </>
        )}
        {/* End loading conditional */}

      </div>
      {/* End max-w-7xl container */}

      </>
      {/* End normal dashboard */}

    </div>
  );
}