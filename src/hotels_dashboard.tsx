import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, ReferenceLine, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Building2, BedDouble, Users, Calendar, Percent } from 'lucide-react';

const styles = `
  html { overflow-y: scroll; }
  * { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif; }
  
  .nav-blur {
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
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
    background: linear-gradient(90deg, #8B5CF6, #7C3AED);
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
  .badge-purple { background: #F3E8FF; color: #7C3AED; }
`;

const formatPct = (value: number, showPlus = true): string => {
  if (Math.abs(value) < 0.05) return '0.0';
  const formatted = value.toFixed(1);
  if (showPlus && value > 0) return '+' + formatted;
  return formatted;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
  return num.toString();
};

// Animated counter component - counts up from 0 with easing
const AnimatedNumber = ({ value, duration = 1200, formatFn = (n: number) => n.toLocaleString(), suffix = '' }: {
  value: number | string;
  duration?: number;
  formatFn?: (n: number) => string;
  suffix?: string;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  
  const targetValue = useMemo(() => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/,/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }, [value]);
  
  useEffect(() => {
    if (targetValue === 0) return;
    
    setOpacity(1);
    startTimeRef.current = null;
    
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      setDisplayValue(easedProgress * targetValue);
      
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    
    const timeout = setTimeout(() => {
      rafRef.current = requestAnimationFrame(animate);
    }, 100);
    
    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetValue, duration]);
  
  return (
    <span style={{ opacity, transition: 'opacity 0.3s ease-out', display: 'inline-block' }}>
      {formatFn(displayValue)}{suffix}
    </span>
  );
};

const HotelsDashboard = () => {
  const [nightsData, setNightsData] = useState<any[]>([]);
  const [capacityData, setCapacityData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [regionalOccupancy, setRegionalOccupancy] = useState<any[]>([]);
  const [arrivalsData, setArrivalsData] = useState<Record<string, number>>({});
  const [arrivalsByNationality, setArrivalsByNationality] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [nightsRes, capacityRes, occupancyRes, regionalRes, arrivalsRes] = await Promise.all([
          fetch('/hotel_nights_hotels_only.json'),
          fetch('/hotel_capacity.json'),
          fetch('/hotel_occupancy.json'),
          fetch('/hotel_occupancy_regional.json'),
          fetch('/data.json')
        ]);
        
        setNightsData(await nightsRes.json());
        setCapacityData(await capacityRes.json());
        setOccupancyData(await occupancyRes.json());
        setRegionalOccupancy(await regionalRes.json());
        
        // Build arrivals lookup
        const arrivalsJson = await arrivalsRes.json();
        const arrivalsLookup: Record<string, number> = {};
        const nationalityArrivals: Record<string, Record<string, number>> = {};
        
        Object.entries(arrivalsJson.monthlyData).forEach(([dateStr, values]: [string, any]) => {
          arrivalsLookup[dateStr] = values['Útlendingar alls'] || 0;
          
          // Build nationality arrivals: { "USA": { "2024-01": 5000, ... }, ... }
          Object.entries(values).forEach(([nationality, count]: [string, any]) => {
            if (typeof count === 'number' && count > 0 && 
                nationality !== 'Útlendingar alls' && 
                nationality !== 'Íslendingar') {
              if (!nationalityArrivals[nationality]) {
                nationalityArrivals[nationality] = {};
              }
              nationalityArrivals[nationality][dateStr] = count;
            }
          });
        });
        setArrivalsData(arrivalsLookup);
        setArrivalsByNationality(nationalityArrivals);
        
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
    if (!nightsData.length || !capacityData.length || !occupancyData.length) return null;

    // Find latest month with data
    const latestCapacity = capacityData.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })[0];

    const latestYear = latestCapacity.year;
    const latestMonth = latestCapacity.month;
    const priorYear = latestYear - 1;

    // Get nights for latest month (Foreigners only)
    const latestNights = nightsData.find(d => 
      d.year === latestYear && d.month === latestMonth && d.nationality === 'Foreigners'
    );
    const priorNights = nightsData.find(d => 
      d.year === priorYear && d.month === latestMonth && d.nationality === 'Foreigners'
    );

    // TTM nights (Foreigners only)
    const ttmNights = nightsData
      .filter(d => d.nationality === 'Foreigners')
      .filter(d => {
        const latestDate = new Date(latestYear, latestMonth - 1);
        const rowDate = new Date(d.year, d.month - 1);
        const monthsDiff = (latestDate.getFullYear() - rowDate.getFullYear()) * 12 + 
                          (latestDate.getMonth() - rowDate.getMonth());
        return monthsDiff >= 0 && monthsDiff < 12;
      })
      .reduce((sum, d) => sum + d.nights, 0);

    const lastTtmNights = nightsData
      .filter(d => d.nationality === 'Foreigners')
      .filter(d => {
        const latestDate = new Date(priorYear, latestMonth - 1);
        const rowDate = new Date(d.year, d.month - 1);
        const monthsDiff = (latestDate.getFullYear() - rowDate.getFullYear()) * 12 + 
                          (latestDate.getMonth() - rowDate.getMonth());
        return monthsDiff >= 0 && monthsDiff < 12;
      })
      .reduce((sum, d) => sum + d.nights, 0);

    // Occupancy for latest month
    const latestOccupancy = occupancyData.find(d => 
      d.year === latestYear && d.month === latestMonth && d.period === 'monthly'
    );
    const priorOccupancy = occupancyData.find(d => 
      d.year === priorYear && d.month === latestMonth && d.period === 'monthly'
    );

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Calculate nights per visitor
    const monthStr = latestMonth.toString().padStart(2, '0');
    const currentArrivals = arrivalsData[`${latestYear}-${monthStr}`];
    const priorArrivalsVal = arrivalsData[`${priorYear}-${monthStr}`];
    
    const nightsPerVisitor = latestNights?.nights && currentArrivals 
      ? latestNights.nights / currentArrivals 
      : 0;
    const priorNpv = priorNights?.nights && priorArrivalsVal 
      ? priorNights.nights / priorArrivalsVal 
      : 0;

    return {
      latestMonth: `${monthNames[latestMonth - 1]} ${latestYear}`,
      latestYear,
      latestMonthNum: latestMonth,
      priorYear,
      
      // Nights
      monthNights: latestNights?.nights || 0,
      monthNightsYoY: priorNights?.nights 
        ? ((latestNights?.nights - priorNights.nights) / priorNights.nights) * 100 
        : 0,
      ttmNights,
      ttmNightsYoY: lastTtmNights > 0 ? ((ttmNights - lastTtmNights) / lastTtmNights) * 100 : 0,
      
      // Nights per visitor
      nightsPerVisitor,
      nightsPerVisitorYoY: priorNpv > 0 ? ((nightsPerVisitor - priorNpv) / priorNpv) * 100 : 0,
      
      // Capacity
      hotels: latestCapacity.hotels,
      rooms: latestCapacity.rooms,
      
      // Occupancy
      occupancy: latestOccupancy?.occupancy_rate || 0,
      occupancyYoY: priorOccupancy?.occupancy_rate 
        ? latestOccupancy?.occupancy_rate - priorOccupancy.occupancy_rate 
        : 0,
    };
  }, [nightsData, capacityData, occupancyData, arrivalsData]);

  // Monthly nights chart data
  const monthlyChartData = useMemo(() => {
    if (!nightsData.length || !kpis) return [];
    
    const currentYear = kpis.latestYear;
    const priorYear = kpis.priorYear;
    const currentMonth = kpis.latestMonthNum - 1;
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return monthLabels.map((label, i) => {
      const month = i + 1;
      const currentRow = nightsData.find(d => d.year === currentYear && d.month === month && d.nationality === 'Foreigners');
      const priorRow = nightsData.find(d => d.year === priorYear && d.month === month && d.nationality === 'Foreigners');
      
      const yoyChange = (currentRow?.nights && priorRow?.nights && priorRow.nights > 0)
        ? ((currentRow.nights - priorRow.nights) / priorRow.nights) * 100
        : null;
      
      return {
        month: label,
        [priorYear]: i <= currentMonth ? priorRow?.nights : null,
        [currentYear]: i <= currentMonth ? currentRow?.nights : null,
        yoyChange: i <= currentMonth ? yoyChange : null,
      };
    });
  }, [nightsData, kpis]);

  // Nights per visitor chart data
  const nightsPerVisitorData = useMemo(() => {
    if (!nightsData.length || !kpis || !Object.keys(arrivalsData).length) return [];
    
    const currentYear = kpis.latestYear;
    const priorYear = kpis.priorYear;
    const currentMonth = kpis.latestMonthNum - 1;
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return monthLabels.map((label, i) => {
      const month = i + 1;
      const monthStr = month.toString().padStart(2, '0');
      
      // Get foreign nights
      const currentNights = nightsData.find(d => d.year === currentYear && d.month === month && d.nationality === 'Foreigners')?.nights;
      const priorNights = nightsData.find(d => d.year === priorYear && d.month === month && d.nationality === 'Foreigners')?.nights;
      
      // Get foreign arrivals
      const currentArrivals = arrivalsData[`${currentYear}-${monthStr}`];
      const priorArrivals = arrivalsData[`${priorYear}-${monthStr}`];
      
      // Calculate nights per visitor
      const currentNpv = currentNights && currentArrivals ? currentNights / currentArrivals : null;
      const priorNpv = priorNights && priorArrivals ? priorNights / priorArrivals : null;
      
      const yoyChange = (currentNpv && priorNpv && priorNpv > 0)
        ? ((currentNpv - priorNpv) / priorNpv) * 100
        : null;
      
      return {
        month: label,
        [priorYear]: i <= currentMonth ? priorNpv : null,
        [currentYear]: i <= currentMonth ? currentNpv : null,
        yoyChange: i <= currentMonth ? yoyChange : null,
      };
    });
  }, [nightsData, arrivalsData, kpis]);

  // Regional occupancy data for latest month
  const regionalChartData = useMemo(() => {
    if (!regionalOccupancy.length || !kpis) return [];
    
    const regions = ['Capital Region', 'South', 'Reykjanes', 'North', 'West & Westfjords', 'East'];
    
    return regions.map(region => {
      const current = regionalOccupancy.find(d => 
        d.year === kpis.latestYear && 
        d.month === kpis.latestMonthNum && 
        d.region === region
      );
      const prior = regionalOccupancy.find(d => 
        d.year === kpis.priorYear && 
        d.month === kpis.latestMonthNum && 
        d.region === region
      );
      
      return {
        region: region.replace(' & Westfjords', '').replace(' Region', ''),
        occupancy: current?.occupancy_rate || 0,
        priorOccupancy: prior?.occupancy_rate || 0,
        change: current && prior ? current.occupancy_rate - prior.occupancy_rate : 0
      };
    }).sort((a, b) => b.occupancy - a.occupancy);
  }, [regionalOccupancy, kpis]);

  // Nationality stay length analysis - nights per visitor
  const nationalityAnalysis = useMemo(() => {
    if (!nightsData.length || !Object.keys(arrivalsByNationality).length || !kpis) return [];
    
    // Country flags
    const flags: Record<string, string> = {
      'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Germany': '🇩🇪', 'France': '🇫🇷',
      'Netherlands': '🇳🇱', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Canada': '🇨🇦',
      'China': '🇨🇳', 'Switzerland': '🇨🇭', 'Denmark': '🇩🇰', 'Sweden': '🇸🇪',
      'Norway': '🇳🇴', 'Finland': '🇫🇮', 'Australia': '🇦🇺', 'Japan': '🇯🇵',
      'Belgium': '🇧🇪', 'Austria': '🇦🇹', 'Ireland': '🇮🇪', 'Poland': '🇵🇱',
      'Portugal': '🇵🇹', 'Greece': '🇬🇷', 'Czech Republic': '🇨🇿', 'Russia': '🇷🇺',
      'India': '🇮🇳', 'Brazil': '🇧🇷', 'Mexico': '🇲🇽', 'South Korea': '🇰🇷',
      'Taiwan': '🇹🇼', 'Singapore': '🇸🇬'
    };
    
    // English names for Icelandic nationality names (using full names)
    const englishNames: Record<string, string> = {
      'Bandaríkin': 'United States', 'Bretland': 'United Kingdom', 'Þýskaland': 'Germany', 
      'Frakkland': 'France', 'Holland': 'Netherlands', 'Spánn': 'Spain', 
      'Ítalía': 'Italy', 'Kanada': 'Canada', 'Kína': 'China', 
      'Sviss': 'Switzerland', 'Danmörk': 'Denmark', 'Svíþjóð': 'Sweden',
      'Noregur': 'Norway', 'Finnland': 'Finland', 'Ástralía': 'Australia',
      'Japan': 'Japan', 'Belgía': 'Belgium', 'Austurríki': 'Austria',
      'Írland': 'Ireland', 'Pólland': 'Poland', 'Portúgal': 'Portugal',
      'Grikkland': 'Greece', 'Tékkland': 'Czech Republic', 'Rússland': 'Russia',
      'Indland': 'India', 'Brasilía': 'Brazil', 'Mexíkó': 'Mexico',
      'Suður-Kórea': 'South Korea', 'Taívan': 'Taiwan', 'Singapúr': 'Singapore',
      // Also handle if arrivals uses English names directly
      'USA': 'United States', 'UK': 'United Kingdom', 'Germany': 'Germany', 'France': 'France',
      'Netherlands': 'Netherlands', 'Spain': 'Spain', 'Italy': 'Italy',
      'Canada': 'Canada', 'China': 'China', 'Switzerland': 'Switzerland',
      'Denmark': 'Denmark', 'Sweden': 'Sweden', 'Norway': 'Norway',
      'Finland': 'Finland', 'Australia': 'Australia', 'Belgium': 'Belgium',
      'Austria': 'Austria', 'Ireland': 'Ireland', 'Poland': 'Poland'
    };
    
    // Calculate TTM arrivals for each nationality from arrivals data
    const arrivalsTotals: Record<string, number> = {};
    
    Object.entries(arrivalsByNationality).forEach(([nationality, monthlyData]) => {
      // Sum last 12 months
      let total = 0;
      for (let i = 0; i < 12; i++) {
        let m = kpis.latestMonthNum - i;
        let y = kpis.latestYear;
        if (m <= 0) { m += 12; y -= 1; }
        
        const key = `${y}-${String(m).padStart(2, '0')}`;
        total += monthlyData[key] || 0;
      }
      arrivalsTotals[nationality] = total;
    });
    
    // Get top 12 by arrivals (take more to ensure we get 6 after filtering)
    const topNationalities = Object.entries(arrivalsTotals)
      .filter(([nat]) => nat !== 'Útlendingar alls' && nat !== 'Íslendingar')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
    
    // For each top nationality, find matching hotel nights
    const results = topNationalities.map(([arrivalsNat, ttmArrivals]) => {
      const englishName = englishNames[arrivalsNat] || arrivalsNat;
      
      // Get TTM hotel nights for this nationality (matching by English name)
      let ttmNights = 0;
      for (let i = 0; i < 12; i++) {
        let m = kpis.latestMonthNum - i;
        let y = kpis.latestYear;
        if (m <= 0) { m += 12; y -= 1; }
        
        const nightsEntry = nightsData.find(d => 
          d.year === y && d.month === m && d.nationality === englishName
        );
        if (nightsEntry) ttmNights += nightsEntry.nights;
      }
      
      const nightsPerVisitor = ttmArrivals > 0 ? ttmNights / ttmArrivals : 0;
      
      return {
        nationality: englishName,
        flag: flags[englishName] || flags[arrivalsNat] || '🏳️',
        nightsPerVisitor,
        ttmNights,
        ttmArrivals
      };
    }).filter(r => r.nightsPerVisitor > 0 && r.nightsPerVisitor < 15); // Sanity check
    
    return results.slice(0, 6);
  }, [nightsData, arrivalsByNationality, kpis]);

  // Capacity trend data
  const capacityChartData = useMemo(() => {
    if (!capacityData.length) return [];
    
    // Get December data for each year, or latest month for current year
    const years = [...new Set(capacityData.map(d => d.year))].sort();
    
    return years.map(year => {
      const yearData = capacityData.filter(d => d.year === year);
      const latest = yearData.sort((a, b) => b.month - a.month)[0];
      return {
        year: `'${String(year).slice(-2)}`,
        fullYear: year,
        rooms: latest?.rooms || 0,
        hotels: latest?.hotels || 0
      };
    });
  }, [capacityData]);

  // Guest nationality breakdown
  const nationalityData = useMemo(() => {
    if (!nightsData.length || !kpis) return [];
    
    const latestMonthData = nightsData.filter(d => 
      d.year === kpis.latestYear && 
      d.month === kpis.latestMonthNum &&
      !['Total', 'Iceland', 'Foreigners'].includes(d.nationality)
    );
    
    const sorted = latestMonthData.sort((a, b) => b.nights - a.nights).slice(0, 8);
    const total = sorted.reduce((sum, d) => sum + d.nights, 0);
    
    const colors = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE', '#F5F3FF', '#FAFAF9', '#F3F4F6'];
    
    return sorted.map((d, i) => ({
      name: d.nationality,
      value: d.nights,
      percentage: (d.nights / total * 100).toFixed(1),
      fill: colors[i]
    }));
  }, [nightsData, kpis]);

  // Icelandic hotel nights by year
  const icelandicNightsByYear = useMemo(() => {
    if (!nightsData.length) return [];
    
    const yearTotals: Record<number, number> = {};
    
    nightsData
      .filter(d => d.nationality === 'Iceland')
      .forEach(d => {
        if (!yearTotals[d.year]) yearTotals[d.year] = 0;
        yearTotals[d.year] += d.nights;
      });
    
    return Object.entries(yearTotals)
      .map(([year, nights]) => ({
        year: `'${String(year).slice(-2)}`,
        fullYear: parseInt(year),
        nights,
        isCovid: parseInt(year) >= 2020 && parseInt(year) <= 2022,
        isPartial: parseInt(year) === (kpis?.latestYear || 2025)
      }))
      .filter(d => d.fullYear >= 2010)
      .sort((a, b) => a.fullYear - b.fullYear);
  }, [nightsData, kpis]);

  const currentYear = kpis?.latestYear || 2025;
  const priorYear = kpis?.priorYear || 2024;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-neutral-500">Loading hotel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: `
        radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.02) 0%, transparent 50%),
        #FAFAFA
      `
    }}>
      <style>{styles}</style>

      {/* ========== NAV BAR ========== */}
      <nav className="sticky top-0 z-50 nav-blur" style={{
        background: 'rgba(255, 255, 255, 0.72)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2.5 group" style={{ minWidth: '160px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
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
            
            <div className="flex items-center gap-1">
              <a href="/arrivals" className="nav-link">Arrivals</a>
              <a href="/hotels" className="nav-link active">Hotels</a>
              <a href="/spending" className="nav-link">Card Spending</a>
              <a href="/blog" className="nav-link">Reports</a>
            </div>
            
            <div className="hidden md:flex items-center gap-2" style={{ minWidth: '160px', justifyContent: 'flex-end' }}>
              <a 
                href="https://statice.is" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                Data: Statistics Iceland
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
              Hotel Accommodation
            </h1>
            <p style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              fontSize: '15px',
              fontWeight: '400',
              color: '#6B7280',
              letterSpacing: '-0.1px',
              margin: 0
            }}>
              Nights, capacity & occupancy rates across Iceland
            </p>
          </div>
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8">

        {kpis && (
          <>
            {/* ========== KEY METRICS ROW ========== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              
              {/* TTM Foreign Nights */}
              <div className="card p-5 animate-fade-in delay-1">
                <div className="metric-label mb-1">Hotel Nights</div>
                <div className="text-[11px] text-neutral-400 mb-2">Foreigners · TTM</div>
                <div className="metric-value">
                  <AnimatedNumber 
                    value={kpis.ttmNights / 1000000} 
                    formatFn={(n) => n.toFixed(1)} 
                    suffix="M"
                    duration={1400}
                  />
                </div>
                <div className="flex flex-col gap-1.5 mt-3">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${kpis.ttmNightsYoY >= 0.5 ? 'badge-success' : kpis.ttmNightsYoY <= -0.5 ? 'badge-danger' : 'badge-neutral'}`}>
                      {kpis.ttmNightsYoY >= 0.5 ? <TrendingUp className="w-3 h-3" /> : 
                       kpis.ttmNightsYoY <= -0.5 ? <TrendingDown className="w-3 h-3" /> : 
                       <Minus className="w-3 h-3" />}
                      {formatPct(kpis.ttmNightsYoY)}%
                    </span>
                    <span className="text-[10px] text-neutral-400">YoY</span>
                  </div>
                </div>
              </div>
              
              {/* Current Month Foreign Nights */}
              <div className="card p-5 animate-fade-in delay-1">
                <div className="metric-label mb-1">Hotel Nights</div>
                <div className="text-[11px] text-neutral-400 mb-2">Foreigners · {kpis.latestMonth}</div>
                <div className="metric-value">
                  <AnimatedNumber 
                    value={kpis.monthNights / 1000} 
                    formatFn={(n) => Math.round(n).toLocaleString()} 
                    suffix="k"
                    duration={1200}
                  />
                </div>
                <div className="flex flex-col gap-1.5 mt-3">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${kpis.monthNightsYoY >= 0.5 ? 'badge-success' : kpis.monthNightsYoY <= -0.5 ? 'badge-danger' : 'badge-neutral'}`}>
                      {kpis.monthNightsYoY >= 0.5 ? <TrendingUp className="w-3 h-3" /> : 
                       kpis.monthNightsYoY <= -0.5 ? <TrendingDown className="w-3 h-3" /> : 
                       <Minus className="w-3 h-3" />}
                      {formatPct(kpis.monthNightsYoY)}%
                    </span>
                    <span className="text-[10px] text-neutral-400">YoY</span>
                  </div>
                </div>
              </div>
              
              {/* Occupancy Rate */}
              <div className="card p-5 animate-fade-in delay-2">
                <div className="metric-label mb-1">Occupancy Rate</div>
                <div className="text-[11px] text-neutral-400 mb-2">{kpis.latestMonth}</div>
                <div className="metric-value">
                  <AnimatedNumber 
                    value={kpis.occupancy} 
                    formatFn={(n) => n.toFixed(1)} 
                    suffix="%"
                    duration={1000}
                  />
                </div>
                <div className="flex flex-col gap-1.5 mt-3">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${kpis.occupancyYoY >= 0.5 ? 'badge-success' : kpis.occupancyYoY <= -0.5 ? 'badge-danger' : 'badge-neutral'}`}>
                      {kpis.occupancyYoY >= 0.5 ? <TrendingUp className="w-3 h-3" /> : 
                       kpis.occupancyYoY <= -0.5 ? <TrendingDown className="w-3 h-3" /> : 
                       <Minus className="w-3 h-3" />}
                      {formatPct(kpis.occupancyYoY)} pp
                    </span>
                    <span className="text-[10px] text-neutral-400">vs {priorYear}</span>
                  </div>
                </div>
              </div>
              
              {/* Room Capacity */}
              <div className="card p-5 animate-fade-in delay-2">
                <div className="metric-label mb-1">Hotel Rooms</div>
                <div className="text-[11px] text-neutral-400 mb-2">{kpis.hotels} hotels</div>
                <div className="metric-value">
                  <AnimatedNumber 
                    value={kpis.rooms} 
                    formatFn={(n) => Math.round(n).toLocaleString()} 
                    duration={1300}
                  />
                </div>
                <div className="flex flex-col gap-1.5 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-purple">
                      <Building2 className="w-3 h-3" />
                      Capacity
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========== PRIMARY CHART: Monthly Nights ========== */}
            <div className="card p-4 md:p-6 mb-6 animate-fade-in delay-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
                <div>
                  <h2 className="section-title">Monthly Hotel Nights</h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    <span className="md:hidden">Last 6 months · </span>Foreigners · {priorYear} vs {currentYear}
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-neutral-300"></div>
                    <span className="text-xs text-neutral-500">{priorYear}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-violet-500"></div>
                    <span className="text-xs text-neutral-500">{currentYear}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-amber-500 rounded"></div>
                    <span className="text-xs text-neutral-500">YoY %</span>
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={isMobile ? 260 : 320}>
                <ComposedChart 
                  data={isMobile ? monthlyChartData.slice(-6) : monthlyChartData} 
                  margin={{ top: 10, right: isMobile ? 5 : 10, left: isMobile ? -5 : 0, bottom: 5 }} 
                  barGap={2} 
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: isMobile ? 10 : 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                    width={isMobile ? 35 : 45}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: isMobile ? 9 : 10, fill: '#F59E0B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`}
                    width={isMobile ? 35 : 45}
                    domain={[-20, 20]}
                    ticks={[-20, -10, 0, 10, 20]}
                  />
                  <ReferenceLine 
                    yAxisId="right" 
                    y={0} 
                    stroke="#F59E0B" 
                    strokeWidth={1.5} 
                    strokeDasharray="4 4"
                  />
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
                      return [`${(value/1000).toFixed(0)}k nights`, name];
                    }}
                  />
                  <Bar yAxisId="left" dataKey={String(priorYear)} fill="#D1D5DB" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar yAxisId="left" dataKey={String(currentYear)} fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line 
                    yAxisId="right"
                    type="monotone"
                    dataKey="yoyChange"
                    name="YoY Change"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={{ fill: '#F59E0B', stroke: '#fff', strokeWidth: 2, r: 4 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
              
              {/* Mobile legend */}
              <div className="flex md:hidden items-center justify-center gap-4 mt-3 pt-3 border-t border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-neutral-300"></div>
                  <span className="text-[10px] text-neutral-500">{priorYear}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-violet-500"></div>
                  <span className="text-[10px] text-neutral-500">{currentYear}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-amber-500 rounded"></div>
                  <span className="text-[10px] text-neutral-500">YoY</span>
                </div>
              </div>
            </div>

            {/* ========== REGIONAL OCCUPANCY (Full Width) ========== */}
            <div className="card p-4 md:p-6 mb-6 animate-fade-in delay-3" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 100%)' }}>
              <div className="mb-4 md:mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="section-title">Regional Occupancy</h2>
                  <span className="badge badge-purple text-[10px]">{kpis.latestMonth}</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Room utilization by region · Year-over-year change in percentage points
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {regionalChartData.map((region, i) => (
                  <div key={region.region} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-neutral-700 font-medium">{region.region}</div>
                    <div className="flex-1 h-7 bg-violet-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ 
                          width: `${region.occupancy}%`,
                          background: `linear-gradient(90deg, #8B5CF6, #7C3AED)`
                        }}
                      >
                        <span className="text-[11px] font-bold text-white">{region.occupancy.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-14 text-right">
                      <span className={`text-xs font-semibold ${region.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {region.change >= 0 ? '+' : ''}{region.change.toFixed(1)}pp
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-violet-200/50 text-xs text-violet-600">
                💡 Capital region leads with highest occupancy rates
              </div>
            </div>

            {/* ========== SOURCE MARKETS ROW ========== */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              
              {/* Top Source Markets */}
              <div className="card p-4 md:p-6 animate-fade-in delay-3">
                <div className="mb-4 md:mb-6">
                  <h2 className="section-title">Top Source Markets</h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Hotel nights by nationality · {kpis.latestMonth}
                  </p>
                </div>
                
                <div className="space-y-2">
                  {nationalityData.slice(0, 6).map((country, i) => (
                    <div key={country.name} className="flex items-center gap-3 h-14 px-3 rounded-lg bg-neutral-50">
                      <div 
                        className="w-2 h-7 rounded-full flex-shrink-0"
                        style={{ background: country.fill }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-800 truncate">{country.name}</div>
                        <div className="text-[10px] text-neutral-500">{formatNumber(country.value)} nights</div>
                      </div>
                      <div className="text-sm font-semibold text-neutral-700 tabular-nums">{country.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Average Stay by Market */}
              {nationalityAnalysis.length > 0 && (
                <div className="card p-4 md:p-6 animate-fade-in delay-3 overflow-hidden" 
                     style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)' }}>
                  <div className="mb-4 md:mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="section-title">Average Stay Length</h2>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-800 text-[10px] font-semibold">TTM</span>
                    </div>
                    <p className="text-xs text-amber-700/70">
                      Hotel nights per visitor · Top 6 source markets
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {nationalityAnalysis.map((nat, index) => {
                      const maxNights = Math.max(...nationalityAnalysis.map(n => n.nightsPerVisitor));
                      const barWidth = (nat.nightsPerVisitor / maxNights) * 100;
                      const isTop = index === 0;
                      
                      return (
                        <div 
                          key={nat.nationality}
                          className={`flex items-center gap-3 h-14 px-3 rounded-lg transition-all ${
                            isTop 
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                              : 'bg-white/60'
                          }`}
                        >
                          <span className="text-lg flex-shrink-0 w-6 text-center">{nat.flag}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium truncate ${isTop ? 'text-white' : 'text-neutral-800'}`}>
                              {nat.nationality}
                            </div>
                            <div className={`h-1 rounded-full mt-1.5 overflow-hidden ${isTop ? 'bg-white/30' : 'bg-amber-200'}`}>
                              <div 
                                className={`h-full rounded-full ${isTop ? 'bg-white' : 'bg-amber-400'}`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                          <div className={`text-base font-bold tabular-nums flex-shrink-0 ${isTop ? 'text-white' : 'text-neutral-900'}`}>
                            {nat.nightsPerVisitor.toFixed(1)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ========== NIGHTS PER VISITOR CHART ========== */}
            <div className="card p-4 md:p-6 mb-6 animate-fade-in delay-3" style={{ background: 'linear-gradient(135deg, #FDF4FF 0%, #FAF5FF 100%)' }}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="section-title">Hotel Nights per Visitor</h2>
                    <span className="badge badge-purple text-[10px]">Trend</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    <span className="md:hidden">Last 6 months · </span>Average hotel nights per foreign arrival
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-neutral-300"></div>
                    <span className="text-xs text-neutral-500">{priorYear}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-fuchsia-500"></div>
                    <span className="text-xs text-neutral-500">{currentYear}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-amber-500 rounded"></div>
                    <span className="text-xs text-neutral-500">YoY %</span>
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
                <ComposedChart 
                  data={isMobile ? nightsPerVisitorData.slice(-6) : nightsPerVisitorData} 
                  margin={{ top: 10, right: isMobile ? 5 : 10, left: isMobile ? -5 : 0, bottom: 5 }} 
                  barGap={2} 
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3E8FF" vertical={false} />
                  <XAxis 
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: isMobile ? 10 : 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value.toFixed(1)}
                    width={isMobile ? 30 : 35}
                    domain={[0, 'auto']}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: isMobile ? 9 : 10, fill: '#F59E0B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`}
                    width={isMobile ? 35 : 45}
                    domain={[-20, 20]}
                    ticks={[-20, -10, 0, 10, 20]}
                  />
                  <ReferenceLine 
                    yAxisId="right" 
                    y={0} 
                    stroke="#F59E0B" 
                    strokeWidth={1.5} 
                    strokeDasharray="4 4"
                  />
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
                      return [`${value.toFixed(2)} nights`, name];
                    }}
                  />
                  <Bar yAxisId="left" dataKey={String(priorYear)} fill="#D1D5DB" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar yAxisId="left" dataKey={String(currentYear)} fill="#D946EF" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line 
                    yAxisId="right"
                    type="monotone"
                    dataKey="yoyChange"
                    name="YoY Change"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={{ fill: '#F59E0B', stroke: '#fff', strokeWidth: 2, r: 4 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
              
              {/* Mobile legend */}
              <div className="flex md:hidden items-center justify-center gap-4 mt-3 pt-3 border-t border-fuchsia-200/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-neutral-300"></div>
                  <span className="text-[10px] text-neutral-500">{priorYear}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-fuchsia-500"></div>
                  <span className="text-[10px] text-neutral-500">{currentYear}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-amber-500 rounded"></div>
                  <span className="text-[10px] text-neutral-500">YoY</span>
                </div>
              </div>
            </div>

            {/* ========== INFRASTRUCTURE ROW ========== */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              
              {/* Room Capacity Trend */}
              <div className="card p-4 md:p-6 animate-fade-in delay-3">
                <div className="mb-4 md:mb-6">
                  <h2 className="section-title">Room Capacity Growth</h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Total hotel rooms by year
                  </p>
                </div>
                
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart 
                    data={capacityChartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis 
                      dataKey="year"
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
                      width={35}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any, name: string) => [`${value.toLocaleString()} rooms`, 'Rooms']}
                      labelFormatter={(label) => `Year: 20${label.replace("'", "")}`}
                    />
                    <Bar 
                      dataKey="rooms" 
                      fill="#8B5CF6" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">2015 → {currentYear}</span>
                  <span className="text-xs font-medium text-violet-600">
                    +{((capacityChartData[capacityChartData.length - 1]?.rooms / capacityChartData[0]?.rooms - 1) * 100).toFixed(0)}% growth
                  </span>
                </div>
              </div>

              {/* Domestic Hotel Nights */}
              <div className="card p-4 md:p-6 animate-fade-in delay-3">
                <div className="mb-4 md:mb-6">
                  <h2 className="section-title">Domestic Hotel Nights</h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Icelandic guests · Annual totals
                  </p>
                </div>
                
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart 
                    data={icelandicNightsByYear}
                    margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis 
                      dataKey="year"
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `${(val/1000000).toFixed(1)}M`}
                      width={35}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any) => [`${(value/1000000).toFixed(2)}M nights`]}
                      labelFormatter={(label) => `Year: 20${label.replace("'", "")}`}
                    />
                    <Bar 
                      dataKey="nights" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                    >
                      {icelandicNightsByYear.map((entry, index) => {
                        let fill = '#8B5CF6';
                        if (entry.isCovid) fill = '#C4B5FD';
                        if (entry.isPartial) fill = '#DDD6FE';
                        return <Cell key={`cell-${index}`} fill={fill} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded" style={{ background: '#8B5CF6' }}></div>
                    <span className="text-[10px] text-neutral-500">Normal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded" style={{ background: '#C4B5FD' }}></div>
                    <span className="text-[10px] text-neutral-500">COVID</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded" style={{ background: '#DDD6FE' }}></div>
                    <span className="text-[10px] text-neutral-500">YTD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========== METHODOLOGY NOTE ========== */}
            <div className="card p-5 animate-fade-in delay-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">Data Notes</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Hotel data includes only traditional hotels that are open year-round. 
                    Occupancy rates measure room utilization as a percentage of available capacity.
                    2025 figures are preliminary.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 mt-8 py-6 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <p className="text-xs text-neutral-400">
            Data sourced from Statistics Iceland · Updated monthly
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HotelsDashboard;
