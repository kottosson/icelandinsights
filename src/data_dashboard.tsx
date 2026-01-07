import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart } from 'recharts';
import { Sparkles, TrendingUp, TrendingDown, Minus, Share2, ArrowUpDown, ChevronUp, ChevronDown, Code, FileDown, Link2, Twitter, Linkedin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// Rich animations for premium feel
const styles = `
  /* Premium shimmer effect for loading */
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  .shimmer {
    background: linear-gradient(
      90deg,
      #f0f0f0 25%,
      #e0e0e0 37%,
      #f0f0f0 63%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }
  
  .shimmer-dark {
    background: linear-gradient(
      90deg,
      #e5e7eb 25%,
      #d1d5db 37%,
      #e5e7eb 63%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }
  
  /* Pulse for loading dots */
  @keyframes loadingPulse {
    0%, 80%, 100% { 
      transform: scale(0.6);
      opacity: 0.4;
    }
    40% { 
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .loading-dot {
    animation: loadingPulse 1.4s ease-in-out infinite;
  }
  .loading-dot:nth-child(1) { animation-delay: 0s; }
  .loading-dot:nth-child(2) { animation-delay: 0.16s; }
  .loading-dot:nth-child(3) { animation-delay: 0.32s; }
  
  .skeleton {
    background: #e5e7eb;
    border-radius: 4px;
  }
  
  .skeleton-text {
    height: 1em;
    margin-bottom: 0.5em;
  }
  
  .skeleton-circle {
    border-radius: 50%;
  }
  
  /* Card hover lift effect */
  .card-hover {
    transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
  }
  .card-hover:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);
  }
  
  /* Fade in and slide up animation */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out forwards;
    opacity: 0;
  }
  
  /* Stagger delays for children */
  .stagger-1 { animation-delay: 0.05s; }
  .stagger-2 { animation-delay: 0.1s; }
  .stagger-3 { animation-delay: 0.15s; }
  .stagger-4 { animation-delay: 0.2s; }
  .stagger-5 { animation-delay: 0.25s; }
  .stagger-6 { animation-delay: 0.3s; }
  
  /* Range marker slide animation */
  @keyframes markerSlide {
    0% { 
      left: 50%;
      opacity: 0;
      transform: translateX(-50%) scale(0.5);
    }
    50% {
      opacity: 1;
      transform: translateX(-50%) scale(1.2);
    }
    100% { 
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }
  }
  
  .animate-marker {
    animation: markerSlide 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    animation-delay: 0.6s;
  }
  
  /* Number count-up pulse */
  @keyframes numberPop {
    0% { transform: scale(0.95); opacity: 0.7; }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .animate-number-pop {
    animation: numberPop 0.4s ease-out forwards;
  }
  
  /* Hero number special entrance */
  @keyframes heroEntrance {
    0% { 
      opacity: 0; 
      transform: translateY(20px) scale(0.9);
      filter: blur(4px);
    }
    100% { 
      opacity: 1; 
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }
  
  .animate-hero {
    animation: heroEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  /* Chart bar grow animation */
  @keyframes barGrow {
    from { transform: scaleY(0); }
    to { transform: scaleY(1); }
  }
  
  .animate-bar {
    transform-origin: bottom;
    animation: barGrow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  
  /* Subtle pulse for status indicators */
  @keyframes subtlePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  .animate-pulse-subtle {
    animation: subtlePulse 2s ease-in-out infinite;
  }
  
  /* Scroll reveal - elements start hidden */
  .reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }
  
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  /* Smooth number transitions */
  .tabular-nums {
    font-variant-numeric: tabular-nums;
    transition: color 0.3s ease;
  }
`;

// Animated counter component - counts up from 0 with easing
const AnimatedNumber = ({ value, duration = 1200, formatFn = (n) => n.toLocaleString() }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);
  
  // Parse the numeric value from string like "141,100"
  const targetValue = useMemo(() => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/,/g, ''), 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }, [value]);
  
  useEffect(() => {
    if (targetValue === 0) return;
    
    // Fade in quickly at start
    setOpacity(1);
    
    // Easing function - fast start, slow end (ease-out cubic)
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    
    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      setDisplayValue(Math.round(easedProgress * targetValue));
      
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Small delay before starting count to let fade-in begin
    const timeout = setTimeout(() => {
      rafRef.current = requestAnimationFrame(animate);
    }, 100);
    
    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetValue, duration]);
  
  return (
    <span style={{ 
      opacity, 
      transition: 'opacity 0.3s ease-out',
      display: 'inline-block'
    }}>
      {formatFn(displayValue)}
    </span>
  );
};

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

  // Detect mobile device safely (iPhone, iPad, Android)
  const [isMobile, setIsMobile] = useState(false);
  
  // Pre-indexed data for O(1) lookups (avoid repeated filtering)
  const [dataIndex, setDataIndex] = useState(null);
  
  // Scroll reveal effect - progressive reveal on scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    
    // Observe all elements with .reveal class
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    
    return () => observer.disconnect();
  }, [kpis, initialLoading]); // Re-run when data loads

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

  // Date range filtering helper - OPTIMIZED to use row.year/row.month instead of Date parsing
  const getFilteredDataByDateRange = (fullData) => {
    if (!fullData || fullData.length === 0) return [];
    
    // Sort data by year then month (no Date parsing needed)
    const sortedData = [...fullData].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    // Get latest date from sorted data
    const latest = sortedData[sortedData.length - 1];
    const latestYear = latest.year;
    const latestMonth = latest.month;
    
    // Helper to compare year-month
    const compareYearMonth = (row, year, month) => {
      if (row.year < year) return -1;
      if (row.year > year) return 1;
      if (row.month < month) return -1;
      if (row.month > month) return 1;
      return 0;
    };
    
    let startYear, startMonth, endYear, endMonth;
    
    switch (dateRangePreset) {
      case 'last6months':
        endYear = latestYear;
        endMonth = latestMonth;
        startMonth = latestMonth - 6;
        startYear = latestYear;
        while (startMonth <= 0) { startMonth += 12; startYear--; }
        break;
        
      case 'last12months':
        endYear = latestYear;
        endMonth = latestMonth;
        startMonth = latestMonth - 12;
        startYear = latestYear;
        while (startMonth <= 0) { startMonth += 12; startYear--; }
        break;
        
      case 'ytd':
        startYear = latestYear;
        startMonth = 1;
        endYear = latestYear;
        endMonth = latestMonth;
        break;
        
      case 'last2years':
        startYear = latestYear - 2;
        startMonth = latestMonth;
        endYear = latestYear;
        endMonth = latestMonth;
        break;
        
      case 'specificYear':
        if (selectedYear) {
          startYear = selectedYear;
          startMonth = 1;
          endYear = selectedYear;
          endMonth = 12;
        } else {
          return sortedData;
        }
        break;
        
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          startYear = start.getFullYear();
          startMonth = start.getMonth() + 1;
          endYear = end.getFullYear();
          endMonth = end.getMonth() + 1;
        } else {
          return sortedData;
        }
        break;
        
      default:
        return sortedData;
    }
    
    return sortedData.filter(row => {
      return compareYearMonth(row, startYear, startMonth) >= 0 && 
             compareYearMonth(row, endYear, endMonth) <= 0;
    });
  };

  // Calculate seasonal data ONCE using useMemo (performance fix for iPhone)
  const seasonalData = useMemo(() => {
    if (!kpis || !filteredData || filteredData.length === 0) {
      return null;
    }

    // OPTIMIZED: Parse month from kpis.currentMonthName string instead of Date
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = kpis.currentMonthName.split(' ')[0];
    const currentMonth = monthNames.indexOf(monthStr);
    const currentValue = parseInt(kpis.currentMonth.replace(/,/g, ''));
    
    // Detect current year dynamically from data
    const foreignPassengers = filteredData.filter(row => row.flokkur === 'Útlendingar alls');
    const currentYear = Math.max(...foreignPassengers.map(row => row.year));
    
    const historicalByMonth = Array(12).fill(0).map(() => []);
    const currentYearByMonth = Array(12).fill(null);
    
    // OPTIMIZED: Use row.year and row.month directly (no Date parsing)
    foreignPassengers.forEach(row => {
      const rowYear = row.year;
      const rowMonth = row.month - 1; // Convert 1-indexed to 0-indexed for array
      const value = row.fjöldi;
      
      if (!isNaN(value) && value > 0) {
        // Historical: 2017-2019 and 2023 onwards (exclude COVID years 2020-2022 and current year)
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
      currentValue,
      currentYear,
      historicalByMonth,
      historicalAvg,
      currentYearByMonth
    };
  }, [filteredData, kpis]);

  // Safely detect mobile device after component mounts
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }
  }, []);

  useEffect(() => {
    // Load data from JSON file
    const loadData = async () => {
      try {
        const response = await fetch('/data.json');
        const jsonData = await response.json();
        
        const fullData = [];
        const years = new Set();
        
        // Build index for O(1) lookups: { "2024-10": { "country": value, ... }, ... }
        // and { "country": { "2024-10": value, ... }, ... }
        const byYearMonth = {};
        const byCountryYearMonth = {};
        
        // Load ALL countries from the data dynamically
        Object.entries(jsonData.monthlyData).forEach(([dateStr, values]) => {
          const [year, month] = dateStr.split('-').map(Number);
          years.add(year);
          const key = `${year}-${String(month).padStart(2, '0')}`;
          
          byYearMonth[key] = values;
          
          // Load all countries that have data
          Object.entries(values).forEach(([country, value]) => {
            if (value > 0) {
              // Build country index
              if (!byCountryYearMonth[country]) {
                byCountryYearMonth[country] = {};
              }
              byCountryYearMonth[country][key] = value;
              
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
        
        // Store the index for fast lookups in calculations
        setDataIndex({ byYearMonth, byCountryYearMonth });
        
        setData(fullData);
        setAvailableYears([...years].sort((a, b) => b - a)); // Descending order
        setSelectedYear(Math.max(...years)); // Set to latest year
        
        const uniqueCategories = [...new Set(fullData.map(row => row.flokkur))];
        setCategories(uniqueCategories);
        setSelectedCategory('Útlendingar alls');
        
        // Give browser time to render skeleton before heavy calculations
        setTimeout(() => {
          setInitialLoading(false);
        }, 100);
        
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
      // OPTIMIZED: Sort by year/month instead of parsing dates
      const sortedData = [...data].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
      
      const filtered = sortedData
        .filter(row => selectedCategories.includes(row.flokkur));
      // Already sorted, no need to sort again
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
      // Apply user's date range filter (already optimized)
      const dateFiltered = getFilteredDataByDateRange(data);
      const userFiltered = dateFiltered
        .filter(row => selectedCategories.includes(row.flokkur));
      // Already sorted by getFilteredDataByDateRange
      setUserFilteredData(userFiltered);
    }
  }, [selectedCategories, data, dateRangePreset, selectedYear, customStartDate, customEndDate]);

  const generateInsightsAndKPIs = async (allData, filteredData, selectedCats = selectedCategories) => {
    setLoading(true);
    
    // Defer heavy calculations to prevent blocking UI (critical for mobile)
    await new Promise(resolve => setTimeout(resolve, 50));
    
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
    
    // OPTIMIZED: Use year/month comparisons instead of Date parsing
    // Calculate cutoff as 1 year before current month
    const cutoffYear = currentMonth.year - 1;
    const cutoffMonth = currentMonth.month;
    
    const ltmData = foreignPassengerData.filter(row => {
      // row is after cutoff if year is greater, or same year and month is greater
      if (row.year > cutoffYear) return true;
      if (row.year === cutoffYear && row.month > cutoffMonth) return true;
      return false;
    });
    
    const nationalityTotals = {};
    ltmData.forEach(row => {
      nationalityTotals[row.flokkur] = (nationalityTotals[row.flokkur] || 0) + row.fjöldi;
    });
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthName = monthNames[currentMonth.month - 1];
    const lastYearMonthName = monthNames[lastYearSameMonth.month - 1];
    
    // Calculate TTM period labels using year/month math (no Date objects needed)
    let ttmStartMonth = currentMonth.month + 1;
    let ttmStartYear = currentMonth.year - 1;
    if (ttmStartMonth > 12) { ttmStartMonth -= 12; ttmStartYear++; }
    const ttmPeriod = `${monthNames[ttmStartMonth - 1]} ${ttmStartYear} - ${monthNames[currentMonth.month - 1]} ${currentMonth.year}`;
    
    // Calculate prior TTM period (one year earlier)
    const priorTtmPeriod = `${monthNames[ttmStartMonth - 1]} ${ttmStartYear - 1} - ${monthNames[currentMonth.month - 1]} ${currentMonth.year - 1}`;
    
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
    
    // OPTIMIZED: Pre-calculate prior period data using year/month comparisons
    // Prior period: 2 years ago to 1 year ago from current month
    const priorStartYear = currentMonth.year - 2;
    const priorStartMonth = currentMonth.month;
    const priorEndYear = currentMonth.year - 1;
    const priorEndMonth = currentMonth.month;
    
    const priorPeriodByNationality = {};
    allData.forEach(row => {
      // Check if row is in prior period: after priorStart and <= priorEnd
      const afterStart = row.year > priorStartYear || (row.year === priorStartYear && row.month > priorStartMonth);
      const beforeEnd = row.year < priorEndYear || (row.year === priorEndYear && row.month <= priorEndMonth);
      
      if (afterStart && beforeEnd) {
        if (!priorPeriodByNationality[row.flokkur]) {
          priorPeriodByNationality[row.flokkur] = 0;
        }
        priorPeriodByNationality[row.flokkur] += row.fjöldi;
      }
    });
    
    // Calculate prior TTM for continents
    Object.keys(continentTotals).forEach(continent => {
      const continentCountries = Object.keys(nationalityTotals).filter(nat => getContinent(nat) === continent);
      const priorTotal = continentCountries.reduce((sum, nat) => {
        return sum + (priorPeriodByNationality[nat] || 0);
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
    
    // OPTIMIZED: Get last month using year/month comparison (no Date parsing)
    const sortedAllData = [...foreignDataForTop10].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });
    const currentMonthForTop10 = sortedAllData[0];
    
    // OPTIMIZED: Filter using year/month instead of Date
    const top10CutoffYear = currentMonthForTop10.year - 1;
    const top10CutoffMonth = currentMonthForTop10.month;
    
    const ltmDataForTop10 = foreignDataForTop10.filter(row => {
      if (row.year > top10CutoffYear) return true;
      if (row.year === top10CutoffYear && row.month > top10CutoffMonth) return true;
      return false;
    });
    
    const nationalityTotalsForTop10 = {};
    ltmDataForTop10.forEach(row => {
      nationalityTotalsForTop10[row.flokkur] = (nationalityTotalsForTop10[row.flokkur] || 0) + row.fjöldi;
    });
    
    const foreignTotal = Object.values(nationalityTotalsForTop10).reduce((a, b) => a + b, 0);
    
    // OPTIMIZED: Calculate prior TTM using year/month comparisons
    const top10PriorStartYear = currentMonthForTop10.year - 2;
    const top10PriorStartMonth = currentMonthForTop10.month;
    const top10PriorEndYear = currentMonthForTop10.year - 1;
    const top10PriorEndMonth = currentMonthForTop10.month;
    
    const priorLtmData = foreignDataForTop10.filter(row => {
      const afterStart = row.year > top10PriorStartYear || (row.year === top10PriorStartYear && row.month > top10PriorStartMonth);
      const beforeEnd = row.year < top10PriorEndYear || (row.year === top10PriorEndYear && row.month <= top10PriorEndMonth);
      return afterStart && beforeEnd;
    });
    
    const priorForeignTotal = priorLtmData.reduce((sum, r) => sum + r.fjöldi, 0);
    
    // Pre-group prior period data by nationality (avoid filtering in loop)
    const priorDataByNationality = {};
    priorLtmData.forEach(row => {
      if (!priorDataByNationality[row.flokkur]) {
        priorDataByNationality[row.flokkur] = [];
      }
      priorDataByNationality[row.flokkur].push(row);
    });
    
    // Calculate YoY changes
    const nationalityChanges = {};
    
    Object.keys(nationalityTotalsForTop10).forEach(nat => {
      const currentTtmData = ltmDataForTop10.filter(row => row.flokkur === nat);
      const priorTtmData = priorDataByNationality[nat] || [];
      
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
    
    // Calculate 6-month YoY % sparkline data for executive snapshot
    // OPTIMIZED: Use row.year and row.month directly (no Date parsing in loops)
    const currentYear = currentMonth.year;
    const currentMonthNum = currentMonth.month;
    
    // Build a quick lookup map: { "2024-10": { total: X, byCountry: { ... } } }
    const monthlyTotals = {};
    allData.forEach(row => {
      const key = `${row.year}-${row.month}`;
      if (!monthlyTotals[key]) {
        monthlyTotals[key] = { total: 0, byCountry: {} };
      }
      monthlyTotals[key].total += row.fjöldi;
      monthlyTotals[key].byCountry[row.flokkur] = (monthlyTotals[key].byCountry[row.flokkur] || 0) + row.fjöldi;
    });
    
    // Generate 6 months of sparkline data using the lookup map (O(1) per month)
    const overallSparkline = [];
    for (let i = 0; i < 6; i++) {
      // Calculate target month (going back 5 months from current)
      let targetMonth = currentMonthNum - 5 + i;
      let targetYear = currentYear;
      while (targetMonth <= 0) { targetMonth += 12; targetYear--; }
      while (targetMonth > 12) { targetMonth -= 12; targetYear++; }
      
      const currentKey = `${targetYear}-${targetMonth}`;
      const priorKey = `${targetYear - 1}-${targetMonth}`;
      
      const currentTotal = monthlyTotals[currentKey]?.total || 0;
      const priorTotal = monthlyTotals[priorKey]?.total || 0;
      
      const yoyPercent = priorTotal > 0 ? ((currentTotal - priorTotal) / priorTotal * 100) : 0;
      overallSparkline.push({ value: yoyPercent, month: targetMonth });
    }
    
    // Top grower sparkline using lookup map (O(1) per month)
    const topGrowerSparkline = calculatedTop10.topGrower ? (() => {
      const countryName = calculatedTop10.topGrower.name;
      const sparkline = [];
      
      for (let i = 0; i < 6; i++) {
        let targetMonth = currentMonthNum - 5 + i;
        let targetYear = currentYear;
        while (targetMonth <= 0) { targetMonth += 12; targetYear--; }
        while (targetMonth > 12) { targetMonth -= 12; targetYear++; }
        
        const currentKey = `${targetYear}-${targetMonth}`;
        const priorKey = `${targetYear - 1}-${targetMonth}`;
        
        const currentTotal = monthlyTotals[currentKey]?.byCountry[countryName] || 0;
        const priorTotal = monthlyTotals[priorKey]?.byCountry[countryName] || 0;
        
        const yoyPercent = priorTotal > 0 ? ((currentTotal - priorTotal) / priorTotal * 100) : 0;
        sparkline.push({ value: yoyPercent, month: targetMonth });
      }
      return sparkline;
    })() : [];
    
    // Top decliner sparkline using lookup map (O(1) per month)
    const topDeclinerSparkline = calculatedTop10.topDecliner ? (() => {
      const countryName = calculatedTop10.topDecliner.name;
      const sparkline = [];
      
      for (let i = 0; i < 6; i++) {
        let targetMonth = currentMonthNum - 5 + i;
        let targetYear = currentYear;
        while (targetMonth <= 0) { targetMonth += 12; targetYear--; }
        while (targetMonth > 12) { targetMonth -= 12; targetYear++; }
        
        const currentKey = `${targetYear}-${targetMonth}`;
        const priorKey = `${targetYear - 1}-${targetMonth}`;
        
        const currentTotal = monthlyTotals[currentKey]?.byCountry[countryName] || 0;
        const priorTotal = monthlyTotals[priorKey]?.byCountry[countryName] || 0;
        
        const yoyPercent = priorTotal > 0 ? ((currentTotal - priorTotal) / priorTotal * 100) : 0;
        sparkline.push({ value: yoyPercent, month: targetMonth });
      }
      return sparkline;
    })() : [];
    
    // Calculate yearly totals for Annual + YTD chart (2017 onwards) - based on selected categories
    const currentYearMonth = currentMonth.month; // e.g., 10 for October (1-indexed)
    
    // Calculate full year totals for 2017-2024 - support multiple series
    const annualData = [];
    
    // Pre-group data by year using row.year directly (no Date parsing)
    const dataByYear = {};
    data.forEach(row => {
      if (!dataByYear[row.year]) {
        dataByYear[row.year] = [];
      }
      dataByYear[row.year].push(row);
    });
    
    // Get the max year from data dynamically
    const maxYear = Math.max(...Object.keys(dataByYear).map(Number));
    const fullYearEnd = maxYear - 1; // All years except current are "full years"
    
    // Years 2017 to fullYearEnd (full years)
    for (let year = 2017; year <= fullYearEnd; year++) {
      const yearData = { year: year.toString(), label: year.toString() };
      const yearRows = dataByYear[year] || [];
      
      selectedCats.forEach(cat => {
        const yearTotal = yearRows
          .filter(row => row.flokkur === cat)
          .reduce((sum, r) => sum + r.fjöldi, 0);
        
        yearData[cat] = yearTotal;
      });
      
      annualData.push(yearData);
    }
    
    // YTD for current year (Jan to current month inclusive) - support multiple series
    // OPTIMIZED: Use row.month directly instead of Date parsing
    const ytdCurrentYearData = { year: String(maxYear), label: `${maxYear} YTD` };
    const currentYearRows = dataByYear[maxYear] || [];
    selectedCats.forEach(cat => {
      const ytdValue = currentYearRows
        .filter(row => row.month <= currentYearMonth && row.flokkur === cat)
        .reduce((sum, r) => sum + r.fjöldi, 0);
      
      ytdCurrentYearData[cat] = ytdValue;
    });
    annualData.push(ytdCurrentYearData);
    
    // Calculate YTD comparison for 2017 to current year - support multiple series
    // OPTIMIZED: Use row.month directly instead of Date parsing
    const ytdComparisonData = [];
    
    for (let year = 2017; year <= maxYear; year++) {
      const ytdData = { year: year.toString(), label: `${year}` };
      const yearRows = dataByYear[year] || [];
      
      selectedCats.forEach(cat => {
        const ytdValue = yearRows
          .filter(row => row.month <= currentYearMonth && row.flokkur === cat)
          .reduce((sum, r) => sum + r.fjöldi, 0);
        
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
    
    // On mobile, show every other month to reduce rendering load
    const datesToShow = isMobile 
      ? last24Dates.filter((_, index) => index % 2 === 0)
      : last24Dates;
    
    // Pre-group data by date for efficiency
    const dataByDate = {};
    userFilteredData.forEach(row => {
      if (!dataByDate[row.date]) {
        dataByDate[row.date] = {};
      }
      dataByDate[row.date][row.flokkur] = row.fjöldi;
    });
    
    return datesToShow.map(date => {
      const row = { date };
      selectedCategories.forEach(cat => {
        row[cat] = dataByDate[date]?.[cat] || null;
      });
      return row;
    });
  };

  const chartData = useMemo(() => prepareChartData(), [userFilteredData, selectedCategories, isMobile]);
  const chartColors = selectedCategories.map(cat => getCountryColor(cat));

  // Get date range for monthly charts (last 24 months)
  // OPTIMIZED: Build period string without Date parsing (data already has year/month)
  const monthlyChartPeriod = useMemo(() => {
    if (chartData.length === 0) return 'Jan 2023 - Oct 2025';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    // Parse year-month from date string (format: YYYY-MM-DD)
    const [firstYear, firstMonth] = first.date.split('-').map(Number);
    const [lastYear, lastMonth] = last.date.split('-').map(Number);
    return `${monthNames[firstMonth - 1]} ${firstYear} - ${monthNames[lastMonth - 1]} ${lastYear}`;
  }, [chartData]);

  // Prepare Year-over-Year comparison data for line chart
  const prepareYoYChartData = () => {
    if (selectedCategories.length === 0 || !data.length) return [];
    
    // OPTIMIZED: Get current year and month from data using row.year and row.month instead of hardcoding
    const sortedData = [...data].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    const currentYear = sortedData[0]?.year || new Date().getFullYear();
    const currentMonth = sortedData[0]?.month || 10;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yoyData = [];
    
    // OPTIMIZED: Pre-group data by year and month using row.year and row.month
    const dataByYearMonth = {};
    data.forEach(row => {
      const key = `${row.year}-${row.month}`;
      
      if (!dataByYearMonth[key]) {
        dataByYearMonth[key] = [];
      }
      dataByYearMonth[key].push(row);
    });
    
    // For each month from January to current month
    for (let month = 1; month <= currentMonth; month++) {
      const monthData = { month: monthNames[month - 1] };
      
      // Get data for each year
      for (let yearOffset = 0; yearOffset <= 2; yearOffset++) {
        const year = currentYear - yearOffset;
        const key = `${year}-${month}`;
        const monthRows = dataByYearMonth[key] || [];
        
        const total = monthRows
          .filter(row => selectedCategories.includes(row.flokkur))
          .reduce((sum, r) => sum + r.fjöldi, 0);
        
        monthData[year.toString()] = total > 0 ? total : null;
      }
      
      yoyData.push(monthData);
    }
    
    // On mobile, show every other month to reduce rendering load
    return isMobile 
      ? yoyData.filter((_, index) => index % 2 === 0)
      : yoyData;
  };

  const yoyChartData = useMemo(() => prepareYoYChartData(), [data, selectedCategories, isMobile]);
  
  // Get current month name for YoY chart subtitle
  const yoyCurrentMonth = yoyChartData.length > 0 ? yoyChartData[yoyChartData.length - 1].month : 'Oct';
  
  // Get the years for YoY chart dynamically
  const yoyYears = useMemo(() => {
    if (!data.length) return { current: 2025, prior1: 2024, prior2: 2023 };
    const maxYear = Math.max(...data.map(row => row.year));
    return { current: maxYear, prior1: maxYear - 1, prior2: maxYear - 2 };
  }, [data]);

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
      
      {/* Nav Bar Styles */}
      <style>{`
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
          background: linear-gradient(90deg, #3B82F6, #2563EB);
          border-radius: 2px;
        }
        .nav-blur {
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
        }
      `}</style>
      
      {/* Custom Elegant Neutral Palette */}
      <style>{`
        .text-emerald-600 { color: #d4d4d4; }
        .text-emerald-600 { color: #10b981; }
        .bg-neutral-50/70 { background-color: #F5F8F6; }
        .bg-sage-100 { background-color: #f5f5f5; }
        .bg-sage-600 { background-color: #d4d4d4; }
        .text-red-500 { color: #C67B5C; }
        .text-rose-600 { color: #DC6B5F; }
        .bg-neutral-50/70 { background-color: #FFF5F2; }
        .bg-rose-100 { background-color: #FFE5E0; }
        .border-sage-200 { border-color: #e5e5e5; }
        .border-terracotta-200 { border-color: #F4D5C8; }
        .bg-slate-50 { background-color: #F8F9FA; }
      `}</style>
      
      {/* ========== ELITE NAV BAR ========== */}
      <nav className="sticky top-0 z-50 nav-blur" style={{
        background: 'rgba(255, 255, 255, 0.72)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <a href="/" className="flex items-center gap-2.5 group">
              <div style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
              }}>
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M18 9l-5 5-4-4-3 3" />
                </svg>
              </div>
              <span style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: '600',
                fontSize: '15px',
                color: '#111827',
                letterSpacing: '-0.3px',
                whiteSpace: 'nowrap'
              }}>Iceland Insights</span>
            </a>
            
            {/* Nav Links */}
            <div className="flex items-center gap-1">
              <a href="/arrivals" className="nav-link active">
                Arrivals
              </a>
              <a href="/spending" className="nav-link">
                Card Spending
              </a>
              <a href="/hotels" className="nav-link" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                Hotels
                <span className="ml-1.5 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Soon</span>
              </a>
            </div>
            
            {/* Right side - could add search, theme toggle, etc */}
            <div className="hidden md:flex items-center gap-2">
              <a 
                href="https://statice.is" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
              >
                Data: Statistics Iceland
              </a>
            </div>
          </div>
        </div>
      </nav>
      
      {/* NORMAL DASHBOARD */}
      <>
      
      {/* Page Header - Arrivals specific */}
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
              Foreign Passenger Arrivals
            </h1>
            <p style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              fontSize: '15px',
              fontWeight: '400',
              color: '#6B7280',
              letterSpacing: '-0.1px',
              margin: 0
            }}>
              Keflavík Airport · Monthly statistics from Statistics Iceland
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 pb-8 space-y-8 md:space-y-10">

        {initialLoading ? (
          // PREMIUM SKELETON LOADING
          <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            {/* Hero skeleton */}
            <div className="bg-white rounded-2xl shadow-sm p-5 md:p-8">
              <div className="h-5 w-40 shimmer rounded mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                <div className="space-y-6">
                  {/* Big number skeleton */}
                  <div>
                    <div className="h-3 w-20 shimmer rounded mb-3"></div>
                    <div className="h-16 md:h-20 w-48 shimmer rounded-lg mb-2"></div>
                    <div className="h-3 w-28 shimmer rounded"></div>
                  </div>
                  {/* Stats row skeleton */}
                  <div className="flex gap-8 pt-6">
                    <div>
                      <div className="h-2 w-16 shimmer rounded mb-2"></div>
                      <div className="h-6 w-14 shimmer rounded"></div>
                    </div>
                    <div>
                      <div className="h-2 w-12 shimmer rounded mb-2"></div>
                      <div className="h-6 w-12 shimmer rounded"></div>
                    </div>
                    <div>
                      <div className="h-2 w-14 shimmer rounded mb-2"></div>
                      <div className="h-6 w-20 shimmer rounded"></div>
                    </div>
                  </div>
                </div>
                {/* Chart skeleton */}
                <div className="bg-neutral-50/50 rounded-2xl p-4 md:p-6">
                  <div className="h-3 w-24 shimmer rounded mb-6"></div>
                  <div className="h-48 md:h-64 shimmer rounded-xl"></div>
                </div>
              </div>
            </div>
            
            {/* Insight cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 md:p-6 shadow-sm" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="h-4 w-32 shimmer rounded mb-3"></div>
                  <div className="h-3 w-full shimmer rounded mb-2"></div>
                  <div className="h-3 w-3/4 shimmer rounded mb-4"></div>
                  <div className="h-24 shimmer rounded-xl"></div>
                </div>
              ))}
            </div>
            
            {/* KPI cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="h-3 w-20 shimmer rounded mb-2"></div>
                  <div className="h-2 w-16 shimmer rounded mb-4"></div>
                  <div className="h-8 w-28 shimmer rounded mb-3"></div>
                  <div className="h-6 w-16 shimmer rounded-full"></div>
                </div>
              ))}
            </div>
            
            {/* Loading indicator */}
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 loading-dot"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 loading-dot"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 loading-dot"></div>
                </div>
                <span className="text-sm text-neutral-500">Loading dashboard</span>
              </div>
            </div>
          </div>
        ) : (
          // ACTUAL CONTENT
          <>
        {/* Hero Stats Section */}
        {kpis && seasonalData && (
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
              {/* LEFT COLUMN - Current Month Stats - Flattened for mobile */}
              <div className="space-y-4">
                {(() => {
                  const { currentMonth: month, currentValue, historicalByMonth } = seasonalData;
                  const currentMonthData = historicalByMonth[month];
                  
                  // Calculate average
                  const avg = currentMonthData.length > 0 
                    ? currentMonthData.reduce((a, b) => a + b, 0) / currentMonthData.length 
                    : 0;
                  
                  // Use ACTUAL historical min/max (2020-2022 already excluded in data)
                  const historicalMin = currentMonthData.length > 0 ? Math.min(...currentMonthData) : 0;
                  const historicalMax = currentMonthData.length > 0 ? Math.max(...currentMonthData) : 0;
                  
                  const rangeMin = Math.round(historicalMin / 1000);
                  const rangeMax = Math.round(historicalMax / 1000);
                  const avgK = Math.round(avg / 1000);
                  const actualK = currentValue / 1000;
                    
                    // Calculate position percentage (0-100) within the range
                    const rangeSpan = rangeMax - rangeMin;
                    const position = rangeSpan > 0 
                      ? Math.max(0, Math.min(100, ((actualK - rangeMin) / rangeSpan) * 100))
                      : 50;
                    
                    // Status: Normal if within historical range, Unusual if outside
                    let status = 'Normal';
                    let statusColor = 'text-emerald-600';
                    let markerColor = '#10b981'; // emerald-500
                    let glowColor = 'rgba(16, 185, 129, 0.4)';
                    
                    if (actualK < rangeMin || actualK > rangeMax) {
                      status = 'Unusual';
                      statusColor = 'text-red-600';
                      markerColor = '#ef4444'; // red-500
                      glowColor = 'rgba(239, 68, 68, 0.5)';
                    }
                    
                    let season = 'Low Season';
                    let pillBg = 'bg-blue-50';
                    let pillText = 'text-blue-400';
                    if (month >= 5 && month <= 7) {
                      season = 'High Season';
                      pillBg = 'bg-blue-100';
                      pillText = 'text-blue-700';
                    } else if (month >= 8 && month <= 9) {
                      season = 'Shoulder Season';
                      pillBg = 'bg-blue-50';
                      pillText = 'text-blue-500';
                    }
                    
                    const diff = currentValue - avg;
                    const diffPercent = ((diff / avg) * 100).toFixed(1);
                    const isUp = diff > 0;
                    
                    return (
                      <>
                        {/* Main stat row */}
                        <div>
                          <div className="text-sm md:text-base text-neutral-500 mb-2 animate-fade-in-up">{kpis.currentMonthName}</div>
                          <div className="text-5xl md:text-7xl font-bold text-neutral-900 tabular-nums tracking-tighter leading-none">
                            <AnimatedNumber value={kpis.currentMonth} duration={1400} />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-3 animate-fade-in-up stagger-2">
                            <span className="text-sm md:text-base text-neutral-500">foreign passengers</span>
                            <div className={`inline-flex items-center px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-semibold ${pillBg} ${pillText}`}>
                              {season}
                            </div>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-semibold ${
                              isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {isUp ? <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <TrendingDown className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                              {isUp ? '+' : ''}{diffPercent}% YoY
                            </div>
                          </div>
                        </div>
                        
                        {/* Visual Range Indicator */}
                        <div className="pt-8 animate-fade-in-up stagger-2">
                          <div className="relative h-8 flex items-center">
                            {/* Background track */}
                            <div className="absolute inset-x-0 h-1.5 bg-neutral-200 rounded-full"></div>
                            
                            {/* Historical average marker */}
                            <div 
                              className="absolute w-0.5 h-4 bg-neutral-400 rounded-full"
                              style={{ 
                                left: `${((avgK - rangeMin) / rangeSpan) * 100}%`, 
                                transform: 'translateX(-50%)' 
                              }}
                            ></div>
                            
                            {/* Current value marker */}
                            <div 
                              className="absolute flex flex-col items-center"
                              style={{ 
                                left: `${position}%`, 
                                transform: 'translateX(-50%)',
                                transition: 'left 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
                              }}
                            >
                              {/* Glow effect for unusual */}
                              {status === 'Unusual' && (
                                <div 
                                  className="absolute w-6 h-6 rounded-full animate-pulse-subtle"
                                  style={{ backgroundColor: glowColor, top: '-6px' }}
                                ></div>
                              )}
                              {/* Marker dot */}
                              <div 
                                className="relative w-3.5 h-3.5 rounded-full border-2 border-white shadow-md z-10"
                                style={{ backgroundColor: markerColor }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* Range labels with tooltip */}
                          <div className="flex justify-between mt-1.5">
                            <span className="text-sm text-neutral-500 tabular-nums">{rangeMin}k</span>
                            <span 
                              className="text-sm text-neutral-400 tabular-nums cursor-help border-b border-dashed border-neutral-300"
                              title="Based on 2017–2019, 2023–2024 (excludes COVID years)"
                            >{avgK}k avg</span>
                            <span className="text-sm text-neutral-500 tabular-nums">{rangeMax}k</span>
                          </div>
                        </div>
                        
                        {/* Typical Volume Ranges */}
                        <div className="pt-6 mt-6 border-t border-neutral-100 animate-fade-in-up stagger-6">
                          <div className="text-sm text-neutral-500 mb-3">Typical Range by Season</div>
                          <div className="space-y-3">
                            {(() => {
                              const highSeasonMonths = [5, 6, 7];
                              const shoulderMonths = [8, 9];
                              const lowSeasonMonths = [0, 1, 2, 3, 4, 10, 11];
                              
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
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                                      <span className="text-sm text-neutral-600">High</span>
                                    </div>
                                    <span className="text-sm font-semibold text-neutral-900 tabular-nums">{highRange.min}k – {highRange.max}k</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                                      <span className="text-sm text-neutral-600">Shoulder</span>
                                    </div>
                                    <span className="text-sm font-semibold text-neutral-900 tabular-nums">{shoulderRange.min}k – {shoulderRange.max}k</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full bg-blue-200"></div>
                                      <span className="text-sm text-neutral-600">Low</span>
                                    </div>
                                    <span className="text-sm font-semibold text-neutral-900 tabular-nums">{lowRange.min}k – {lowRange.max}k</span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* RIGHT COLUMN - Chart */}
                <div>
                  {/* Chart - cleaner Apple-style with single color family */}
                  <div className="bg-neutral-50/50 rounded-2xl p-4 md:p-6">
                    <h3 className="text-sm font-medium text-neutral-700 mb-4">Monthly Foreign Passenger Arrivals</h3>
                    <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
                    <ComposedChart 
                      data={(() => {
                        const { currentMonth, historicalAvg, currentYearByMonth } = seasonalData;
                        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return monthLabels.map((label, i) => ({
                          month: label,
                          monthIndex: i,
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
                        tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
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
                          const label = name === 'Historical' ? 'Historical Avg' : name;
                          return [`${(value/1000).toFixed(0)}k`, label];
                        }}
                        labelFormatter={(label) => label}
                      />
                      {/* Current year bars - blue color family encoding seasonality via intensity */}
                      <Bar 
                        dataKey="current"
                        name={String(seasonalData.currentYear)}
                        radius={[4, 4, 0, 0]}
                      >
                        {(() => {
                          const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return monthLabels.map((label, index) => {
                            // Blue color family: intensity = seasonality
                            let fill = '#bfdbfe'; // Low season - light blue
                            if (index >= 5 && index <= 7) fill = '#2563eb'; // High season - saturated blue
                            else if (index >= 8 && index <= 9) fill = '#60a5fa'; // Shoulder - medium blue
                            return <Cell key={`cell-${index}`} fill={fill} />;
                          });
                        })()}
                      </Bar>
                      {/* Historical average line - neutral gray, not red */}
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
                      title="Average of 2017–2019 and 2023–2024 (excludes COVID years 2020–2022)"
                    >
                      <div className="w-6 h-0.5" style={{ background: 'repeating-linear-gradient(90deg, #525252 0, #525252 6px, transparent 6px, transparent 10px)', height: '2px' }}></div>
                      <span className="text-xs text-neutral-500 border-b border-dashed border-neutral-300">Historical Avg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-500"></div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Insight 1: Current Month Performance */}
              <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm card-hover relative group animate-fade-in-up stagger-1">
                {/* Buttons - Top Right (show on hover) */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button 
                    onClick={() => generateEmbedCode('insight', 'Current Month Performance')}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
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
                    <h3 className="text-sm font-medium text-neutral-900 mb-1">Current Month</h3>
                    <p className="text-sm text-neutral-500 mb-2">{kpis.currentMonthName}</p>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      <span className="font-semibold">{kpis.currentMonth} passengers</span>, 
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
                      <p className="text-sm text-neutral-500">YoY % Change (Last 6 Months)</p>
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
                                <text x="30" y={chartTop + 5} textAnchor="end" className="text-xs" fill="#999">+{scale}%</text>
                                <text x="30" y={chartMiddle + 3} textAnchor="end" className="text-xs" fill="#666">0%</text>
                                <text x="30" y={chartBottom + 5} textAnchor="end" className="text-xs" fill="#999">-{scale}%</text>
                                
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
                                    <text key={`month-${i}`} x={x} y={chartBottom + 15} textAnchor="middle" className="text-xs" fill="#999">
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
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm card-hover relative group animate-fade-in-up stagger-2">
                  {/* Buttons - Top Right (show on hover) */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => generateEmbedCode('insight', 'Leading Growth Market')}
                      className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                      title="Get embed code"
                    >
                      <Code className="w-3.5 h-3.5 text-neutral-500" />
                    </button>
                    <button 
                      onClick={() => shareKPI('Leading Growth Market', `${getCountryName(kpis.topGrower.name)} leads with +${kpis.topGrower.change} passengers, representing a +${kpis.topGrower.percent.toFixed(1)}% increase`)}
                      className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                      title="Share on Twitter"
                    >
                      <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                    </button>
                  </div>
                  
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-h-[80px]">
                      <h3 className="text-sm font-medium text-neutral-900 mb-1">Top Grower</h3>
                      <p className="text-sm text-neutral-500 mb-2">Trailing Twelve Months</p>
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        <span className="font-semibold text-neutral-900">{getCountryName(kpis.topGrower.name)}</span> leads with 
                        <span className="font-semibold text-emerald-600"> +{kpis.topGrower.change}</span>
                        <span className="text-emerald-600"> (+{kpis.topGrower.percent.toFixed(1)}%)</span>
                      </p>
                    </div>
                  </div>
                  {/* 6-month YoY % trend with proper axes */}
                  {kpis.topGrowerSparkline && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-neutral-500">YoY % Change (Last 6 Months)</p>
                      </div>
                      <div className="bg-neutral-50/70 rounded-xl p-3">
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
                                  <text x="30" y={chartTop + 5} textAnchor="end" className="text-xs" fill="#10b981">+{scale}%</text>
                                  <text x="30" y={chartMiddle + 3} textAnchor="end" className="text-xs" fill="#666">0%</text>
                                  <text x="30" y={chartBottom + 5} textAnchor="end" className="text-xs" fill="#999">-{scale}%</text>
                                  
                                  {/* Grid lines */}
                                  <line x1={chartLeft} y1={chartTop} x2={chartRight} y2={chartTop} stroke="#e5e5e5" strokeWidth="0.5" />
                                  <line x1={chartLeft} y1={chartMiddle} x2={chartRight} y2={chartMiddle} stroke="#d4d4d4" strokeWidth="1" strokeDasharray="3,3" />
                                  <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke="#e5e5e5" strokeWidth="0.5" />
                                  
                                  {kpis.topGrowerSparkline.map((point, i) => {
                                    const x = chartLeft + (i / (kpis.topGrowerSparkline.length - 1)) * (chartRight - chartLeft);
                                    return (
                                      <line key={`vgrid-${i}`} x1={x} y1={chartTop} x2={x} y2={chartBottom} stroke="#f5f5f5" strokeWidth="0.5" />
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
                                      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d4d4d4" strokeWidth="2" strokeLinecap="round" />
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
                                      <text key={`month-${i}`} x={x} y={chartBottom + 15} textAnchor="middle" className="text-xs" fill="#999">
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
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm card-hover relative group animate-fade-in-up stagger-3">
                  {/* Buttons - Top Right (show on hover) */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => generateEmbedCode('insight', 'Market Under Pressure')}
                      className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                      title="Get embed code"
                    >
                      <Code className="w-3.5 h-3.5 text-neutral-500" />
                    </button>
                    <button 
                      onClick={() => shareKPI('Market Under Pressure', `${getCountryName(kpis.topDecliner.name)} declined by -${kpis.topDecliner.change} passengers, a ${kpis.topDecliner.percent.toFixed(1)}% decrease`)}
                      className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                      title="Share on Twitter"
                    >
                      <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                    </button>
                  </div>
                  
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-h-[80px]">
                      <h3 className="text-sm font-medium text-neutral-900 mb-1">Top Decliner</h3>
                      <p className="text-sm text-neutral-500 mb-2">Trailing Twelve Months</p>
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        <span className="font-semibold text-neutral-900">{getCountryName(kpis.topDecliner.name)}</span> declined by 
                        <span className="font-semibold text-red-600"> -{kpis.topDecliner.change}</span>
                        <span className="text-red-600"> ({kpis.topDecliner.percent.toFixed(1)}%)</span>
                      </p>
                    </div>
                  </div>
                  {/* 6-month YoY % trend with proper axes */}
                  {kpis.topDeclinerSparkline && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-neutral-500">YoY % Change (Last 6 Months)</p>
                      </div>
                      <div className="bg-neutral-50/70 rounded-xl p-3">
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
                                  <text x="30" y={chartTop + 5} textAnchor="end" className="text-xs" fill="#999">+{scale}%</text>
                                  <text x="30" y={chartMiddle + 3} textAnchor="end" className="text-xs" fill="#666">0%</text>
                                  <text x="30" y={chartBottom + 5} textAnchor="end" className="text-xs" fill="#ef4444">-{scale}%</text>
                                  
                                  {/* Grid lines */}
                                  <line x1={chartLeft} y1={chartTop} x2={chartRight} y2={chartTop} stroke="#e5e5e5" strokeWidth="0.5" />
                                  <line x1={chartLeft} y1={chartMiddle} x2={chartRight} y2={chartMiddle} stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                                  <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke="#e5e5e5" strokeWidth="0.5" />
                                  
                                  {kpis.topDeclinerSparkline.map((point, i) => {
                                    const x = chartLeft + (i / (kpis.topDeclinerSparkline.length - 1)) * (chartRight - chartLeft);
                                    return (
                                      <line key={`vgrid-${i}`} x1={x} y1={chartTop} x2={x} y2={chartBottom} stroke="#f5f5f5" strokeWidth="0.5" />
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
                                      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
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
                                      <text key={`month-${i}`} x={x} y={chartBottom + 15} textAnchor="middle" className="text-xs" fill="#999">
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
          )}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Monthly Passengers */}
            <div className="group rounded-2xl bg-white p-5 shadow-sm card-hover relative animate-fade-in-up stagger-1">
              <div className="relative">
                {/* Buttons - Top Right (show on hover) */}
                <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <button 
                    onClick={() => generateEmbedCode('kpi', 'Monthly Passengers')}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Get embed code"
                  >
                    <Code className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                  <button 
                    onClick={() => shareKPI('Monthly Passengers', `${kpis.currentMonth} passengers in ${kpis.currentMonthName}\n${kpis.yoyChange > 0 ? '+' : ''}${kpis.yoyChange.toFixed(1)}% YoY vs ${kpis.lastYearMonthName}`)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Share on Twitter"
                  >
                    <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>
                
                <p className="text-sm font-medium text-neutral-900 mb-1">Monthly</p>
                <p className="text-sm text-neutral-500 mb-3">{kpis.currentMonthName}</p>
                
                <p className="text-3xl font-bold text-neutral-900 mb-3 animate-number-pop" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                  {kpis.currentMonth}
                </p>
                
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                  kpis.yoyChange >= 0.5 ? 'bg-emerald-50' : 
                  kpis.yoyChange <= -0.5 ? 'bg-red-50' : 
                  'bg-neutral-100'
                }`}>
                  {kpis.yoyChange >= 0.5 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : 
                   kpis.yoyChange <= -0.5 ? <TrendingDown className="w-3.5 h-3.5 text-red-600" /> :
                   <Minus className="w-3.5 h-3.5 text-neutral-500" />}
                  <span className={`text-xs font-semibold ${
                    kpis.yoyChange >= 0.5 ? 'text-emerald-600' : 
                    kpis.yoyChange <= -0.5 ? 'text-red-600' : 
                    'text-neutral-600'
                  }`}>
                    {kpis.yoyChange > 0 ? '+' : ''}{kpis.yoyChange.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Card 2: TTM Passengers */}
            <div 
              className="group rounded-2xl bg-white p-5 shadow-sm card-hover relative animate-fade-in-up stagger-2"            >
              <div className="relative">
                <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <button 
                    onClick={() => generateEmbedCode('kpi', 'TTM - Foreign Passengers')}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Get embed code"
                  >
                    <Code className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                  <button 
                    onClick={() => shareKPI('TTM - Foreign Passengers', `${kpis.ttmTotal} passengers (${kpis.ttmPeriod})\n${kpis.ttmChange > 0 ? '+' : ''}${kpis.ttmChange.toFixed(1)}% vs prior TTM`)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Share on Twitter"
                  >
                    <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                </div>
                
                <p className="text-sm font-medium text-neutral-900 mb-1">TTM Passengers</p>
                <p className="text-sm text-neutral-500 mb-3">{kpis.ttmPeriod}</p>
                
                <p className="text-3xl font-bold text-neutral-900 mb-3 animate-number-pop" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                  {kpis.ttmTotal}
                </p>
                
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                  kpis.ttmChange >= 0.5 ? 'bg-emerald-50' : 
                  kpis.ttmChange <= -0.5 ? 'bg-red-50' : 
                  'bg-neutral-100'
                }`}>
                  {kpis.ttmChange >= 0.5 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : 
                   kpis.ttmChange <= -0.5 ? <TrendingDown className="w-3.5 h-3.5 text-red-600" /> :
                   <Minus className="w-3.5 h-3.5 text-neutral-500" />}
                  <span className={`text-xs font-semibold ${
                    kpis.ttmChange >= 0.5 ? 'text-emerald-600' : 
                    kpis.ttmChange <= -0.5 ? 'text-red-600' : 
                    'text-neutral-600'
                  }`}>
                    {kpis.ttmChange > 0 ? '+' : ''}{kpis.ttmChange.toFixed(1)}%
                  </span>
                </div>
                
              </div>
            </div>

            {/* Card 3: Largest Gain */}
            <div 
              className="group rounded-2xl bg-white p-5 shadow-sm card-hover relative animate-fade-in-up stagger-3"            >
              <div className="relative">
                <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <button 
                    onClick={() => generateEmbedCode('kpi', 'TTM - Largest Gain')}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Get embed code"
                  >
                    <Code className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                  <button 
                    onClick={() => shareKPI('TTM - Largest Gain', `${getCountryName(kpis.topGrower?.name)}\n${kpis.topGrower?.current.toLocaleString()} vs ${kpis.topGrower?.prior.toLocaleString()} prior TTM\n+${kpis.topGrower?.change} (+${kpis.topGrower?.percent.toFixed(1)}%)`)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Share on Twitter"
                  >
                    <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                </div>
                
                <p className="text-sm font-medium text-neutral-900 mb-1">Top Gainer</p>
                <p className="text-sm text-neutral-500 mb-3">{kpis.ttmPeriod}</p>
                
                <p className="text-3xl font-bold text-neutral-900 mb-3 animate-number-pop" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                  {kpis.topGrower && getCountryName(kpis.topGrower.name)}
                </p>
                
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-600">
                    +{kpis.topGrower?.percent.toFixed(1)}%
                  </span>
                </div>
                
              </div>
            </div>

            {/* Card 4: Largest Decline */}
            <div 
              className="group rounded-2xl bg-white p-5 shadow-sm card-hover relative animate-fade-in-up stagger-4"            >
              <div className="relative">
                <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <button 
                    onClick={() => generateEmbedCode('kpi', 'TTM - Largest Decline')}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Get embed code"
                  >
                    <Code className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                  <button 
                    onClick={() => shareKPI('TTM - Largest Decline', `${getCountryName(kpis.topDecliner?.name)}\n${kpis.topDecliner?.current.toLocaleString()} vs ${kpis.topDecliner?.prior.toLocaleString()} prior TTM\n-${kpis.topDecliner?.change} (${kpis.topDecliner?.percent.toFixed(1)}%)`)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Share on Twitter"
                  >
                    <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                  </button>
                </div>
                
                <p className="text-sm font-medium text-neutral-900 mb-1">Top Decliner</p>
                <p className="text-sm text-neutral-500 mb-3">{kpis.ttmPeriod}</p>
                
                <p className="text-3xl font-bold text-neutral-900 mb-3 animate-number-pop" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                  {kpis.topDecliner && getCountryName(kpis.topDecliner.name)}
                </p>
                
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50">
                  <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-xs font-semibold text-red-600">
                    {kpis.topDecliner?.percent.toFixed(1)}%
                  </span>
                </div>
                
              </div>
            </div>
            
          </div>
        )}
        {/* Top 10 Markets - Completely Static, Never Affected by Filters */}
        {kpis && kpis.top10 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 md:p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900 tracking-tight mb-1">
                Top 10 Markets
              </h3>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-neutral-500">{kpis.ttmPeriod}</p>
                <p className="text-xs text-neutral-400 italic">Click row to filter</p>
              </div>
              
              {/* Sortable column headers */}
              <div className="grid grid-cols-6 gap-1.5 md:gap-3 mb-2 pb-2 px-2 md:px-3 border-b-2 border-neutral-200">
                <p className="text-xs uppercase tracking-wider text-neutral-600 font-semibold col-span-2">Nationality</p>
                
                <button 
                  onClick={() => {
                    setSortConfig({
                      key: 'total',
                      direction: sortConfig.key === 'total' && sortConfig.direction === 'desc' ? 'asc' : 'desc'
                    });
                  }}
                  className="text-xs uppercase tracking-wider text-neutral-600 font-semibold text-right hover:text-neutral-900 flex items-center justify-end gap-1 transition-colors"
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
                  className="text-xs uppercase tracking-wider text-neutral-600 font-semibold text-right hover:text-neutral-900 flex items-center justify-end gap-1 transition-colors"
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
                  className="text-xs uppercase tracking-wider text-neutral-600 font-semibold text-right hover:text-neutral-900 flex items-center justify-end gap-1 transition-colors"
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
                  className="text-xs uppercase tracking-wider text-neutral-600 font-semibold text-right hover:text-neutral-900 flex items-center justify-end gap-1 transition-colors"
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
                    className={`grid grid-cols-6 gap-1.5 md:gap-3 py-2.5 px-2 md:px-3 rounded-lg cursor-pointer hover:shadow-sm transition-all ${
                      isSelected ? 'ring-2 ring-blue-400' : ''
                    }`}
                    style={{
                      animationDelay: `${i * 50}ms`,
                      backgroundColor: isSelected ? '#EFF6FF' : (i % 2 === 0 ? '#FFFFFF' : '#F9FAFB')
                    }}
                  >
                    <div className="flex items-center gap-1.5 md:gap-2.5 col-span-2">
                      <span className="text-xs md:text-xs font-medium text-neutral-400 w-3 md:w-4 text-center tabular-nums">{i + 1}</span>
                      <span className={`text-xs md:text-xs ${isSelected ? 'font-semibold text-blue-700' : 'font-medium text-neutral-800'} truncate`}>
                        {getCountryName(item.nat)}
                      </span>
                    </div>
                    <span className="text-xs md:text-xs text-neutral-700 font-mono text-right tabular-nums">{item.total.toLocaleString()}</span>
                    <span className={`text-xs md:text-xs font-semibold text-right tabular-nums ${
                      item.absoluteChange >= 0 ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {item.absoluteChange >= 0 ? '+' : ''}{item.absoluteChange.toLocaleString()}
                    </span>
                    <span className="text-xs md:text-xs text-neutral-600 font-mono text-right tabular-nums">{item.ratio.toFixed(1)}%</span>
                    <span className={`text-xs md:text-xs font-semibold text-right tabular-nums ${
                      item.yoy >= 0.5 ? 'text-emerald-600' : 
                      item.yoy <= -0.5 ? 'text-red-500' : 'text-neutral-400'
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
                    kpis.top10.reduce((sum, item) => sum + item.absoluteChange, 0) >= 0 ? 'text-emerald-600' : 'text-red-500'
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
                      return yoy >= 0.5 ? 'text-emerald-600' : yoy <= -0.5 ? 'text-red-500' : 'text-neutral-500';
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
                      return otherAbsChange >= 0 ? 'text-emerald-600' : 'text-red-500';
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
                      return otherYoy >= 0.5 ? 'text-emerald-600' : otherYoy <= -0.5 ? 'text-red-500' : 'text-neutral-400';
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
            <div className="lg:col-span-1 bg-white rounded-2xl p-5 md:p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900 tracking-tight mb-1">
                By Continent
              </h3>
              <p className="text-xs text-neutral-500 mb-4">{kpis.ttmPeriod}</p>
              
              <div className="space-y-3">
                {kpis.continents.map((continent, i) => {
                  return (
                    <div key={i} className="pb-3 border-b border-neutral-100 last:border-0" style={{ animationDelay: `${i * 50}ms` }}>
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
                          continent.yoy >= 0.5 ? 'bg-emerald-50' : 
                          continent.yoy <= -0.5 ? 'bg-red-50' : 
                          'bg-neutral-100'
                        }`}>
                          {continent.yoy >= 0.5 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : 
                           continent.yoy <= -0.5 ? <TrendingDown className="w-3 h-3 text-red-600" /> :
                           <Minus className="w-3 h-3 text-neutral-500" />}
                          <span className={`text-xs font-semibold whitespace-nowrap ${
                            continent.yoy >= 0.5 ? 'text-emerald-600' : 
                            continent.yoy <= -0.5 ? 'text-red-600' : 
                            'text-neutral-600'
                          }`}>
                            {continent.yoy > 0 ? '+' : ''}{continent.yoy.toFixed(1)}% YoY
                          </span>
                        </div>
                      </div>
                      
                      {/* Footer row with absolute number and percentage */}
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-neutral-700 font-mono">{continent.total.toLocaleString()}</span>
                        <span className="text-xs text-neutral-500 font-medium">{continent.percentOfForeign.toFixed(1)}% of foreign passengers</span>
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
                <h3 className="text-lg font-semibold text-neutral-900 tracking-tight">
                  Filters
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Affects charts and data below
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
                    ? 'bg-emerald-50 text-emerald-600' 
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

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-4 reveal">
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm card-hover" id="monthly-trends-chart">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-neutral-900">
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
              <p className="text-xs text-neutral-500">{monthlyChartPeriod}</p>
              {!selectedCategories.includes('Farþegar alls') && !selectedCategories.includes('Útlendingar alls') && (
                <p className="text-xs text-neutral-400 italic">Click bar to filter</p>
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

          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm card-hover" id="yoy-comparison-chart">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-neutral-900">
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
            <p className="text-xs text-neutral-500 mb-3">Jan - {yoyCurrentMonth} ({yoyYears.prior2} vs {yoyYears.prior1} vs {yoyYears.current})</p>
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
                  dataKey={String(yoyYears.current)}
                  stroke="#6B7C8C"
                  strokeWidth={2.5}
                  dot={{ fill: '#fff', stroke: '#6B7C8C', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                  name={String(yoyYears.current)}
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey={String(yoyYears.prior1)}
                  stroke="#FF375F"
                  strokeWidth={2.5}
                  strokeOpacity={0.5}
                  dot={{ fill: '#fff', stroke: '#FF375F', strokeWidth: 2, r: 3, opacity: 0.5 }}
                  activeDot={{ r: 5 }}
                  name={String(yoyYears.prior1)}
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey={String(yoyYears.prior2)}
                  stroke="#8E8E93"
                  strokeWidth={2.5}
                  strokeOpacity={0.3}
                  dot={{ fill: '#fff', stroke: '#8E8E93', strokeWidth: 2, r: 3, opacity: 0.3 }}
                  activeDot={{ r: 5 }}
                  name={String(yoyYears.prior2)}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Annual Overview & YTD Comparison - Grid Layout */}
        <div className="grid md:grid-cols-2 gap-4 reveal">
          {/* Annual + YTD Bar Chart */}
          {kpis && kpis.annualData && (
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm card-hover" id="annual-overview-chart">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-neutral-900">
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
              <p className="text-xs text-neutral-500 mb-3">2017-{yoyYears.current} YTD</p>
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
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm card-hover" id="ytd-comparison-chart">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-neutral-900">
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
              <p className="text-xs text-neutral-500 mb-3">Jan - {kpis.currentMonthName.split(' ')[0]} (2017-{yoyYears.current})</p>
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
            <h3 className="text-sm font-medium text-neutral-900">Data Table</h3>
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
                  <th className="text-left px-4 py-2 text-xs font-medium text-neutral-500 tracking-widest uppercase">Date</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-neutral-500 tracking-widest uppercase">Category</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-neutral-500 tracking-widest uppercase">Passengers</th>
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