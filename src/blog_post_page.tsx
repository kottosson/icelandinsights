import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Building2, CreditCard, ChevronLeft, BarChart3, ArrowUpRight, Calendar, Globe, Menu, X } from 'lucide-react';
import { useParams } from 'react-router-dom';

const styles = `
  html { overflow-y: scroll; }
  * { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif; }
  
  .nav-blur { backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px); }
  
  .nav-link {
    position: relative; padding: 8px 16px; font-size: 14px; font-weight: 500;
    color: #6B7280; border-radius: 8px; transition: all 0.2s ease;
  }
  .nav-link:hover { color: #111827; background: rgba(0, 0, 0, 0.04); }
  
  .prose h2 { font-size: 1.25rem; font-weight: 700; color: #111827; margin: 2rem 0 1rem; }
  .prose h3 { font-size: 1rem; font-weight: 600; color: #1F2937; margin: 1.5rem 0 0.75rem; }
  .prose p { color: #4B5563; line-height: 1.75; margin-bottom: 1rem; }
  .prose ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
  .prose li { color: #4B5563; line-height: 1.75; margin-bottom: 0.25rem; }
  .prose strong { color: #111827; font-weight: 600; }
  
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th { text-align: left; padding: 0.75rem; background: #F9FAFB; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; color: #6B7280; }
  .data-table td { padding: 0.75rem; border-top: 1px solid #E5E7EB; }
  .data-table tr:hover { background: #F9FAFB; }
  
  .tabular-nums { font-variant-numeric: tabular-nums; }
`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatPct = (v: number, showPlus = true): string => {
  const sign = showPlus && v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
};

const getSeasonDescription = (month: number): string => {
  if (month >= 6 && month <= 8) return 'peak summer season, characterized by midnight sun and maximum tourist activity';
  if (month === 5) return 'late spring, transitioning into high season as weather improves';
  if (month === 9) return 'early autumn shoulder season, with the first northern lights appearances';
  if (month === 10 || month === 11) return 'autumn/winter transition with increasing northern lights activity';
  if (month >= 1 && month <= 3) return 'winter season, prime time for northern lights and ice cave tours';
  if (month === 4) return 'spring shoulder season with Easter holiday travel';
  return 'shoulder season';
};

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [nightsData, setNightsData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [regionalOccData, setRegionalOccData] = useState<any[]>([]);
  const [spendingData, setSpendingData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Parse month/year from slug: "iceland-tourism-november-2025"
  const parsedSlug = useMemo(() => {
    if (!slug) return null;
    const match = slug.match(/iceland-tourism-(\w+)-(\d{4})/);
    if (!match) return null;
    const monthName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    const monthIndex = MONTHS.findIndex(m => m.toLowerCase() === match[1].toLowerCase());
    if (monthIndex === -1) return null; // Invalid month name
    return { month: monthIndex + 1, year: parseInt(match[2]), monthName };
  }, [slug]);

  useEffect(() => {
    const load = async () => {
      try {
        const [nRes, oRes, rRes, sRes] = await Promise.all([
          fetch('/hotel_nights_hotels_only.json'),
          fetch('/hotel_occupancy.json'),
          fetch('/hotel_occupancy_regional.json').catch(() => ({ ok: false, json: () => [] })),
          fetch('/spending_data.json')
        ]);
        
        if (!nRes.ok) throw new Error('Failed to load nights data');
        if (!oRes.ok) throw new Error('Failed to load occupancy data');
        if (!sRes.ok) throw new Error('Failed to load spending data');
        
        const nightsJson = await nRes.json();
        const occJson = await oRes.json();
        const regionalJson = rRes.ok ? await rRes.json() : [];
        const spendJson = await sRes.json();
        
        setNightsData(nightsJson || []);
        setOccupancyData(occJson || []);
        setRegionalOccData(regionalJson || []);
        setSpendingData(spendJson?.monthlyData || {});
      } catch (e) {
        console.error('Load error:', e);
        setError(e instanceof Error ? e.message : 'Unknown error loading data');
      }
      setLoading(false);
    };
    load();
  }, []);

  // Build report data
  const report = useMemo(() => {
    if (!parsedSlug || !nightsData.length) return null;
    
    const { month, year, monthName } = parsedSlug;
    const priorYear = year - 1;
    
    // Foreign hotel nights
    const nights = nightsData.find(d => d.year === year && d.month === month && d.nationality === 'Foreigners')?.nights;
    const nightsPrior = nightsData.find(d => d.year === priorYear && d.month === month && d.nationality === 'Foreigners')?.nights;
    
    if (!nights) return null;
    
    // All nationalities for this month
    const allMarkets = nightsData
      .filter(d => d.year === year && d.month === month && !['Foreigners', 'Iceland', 'Total'].includes(d.nationality))
      .sort((a, b) => b.nights - a.nights);
    
    const topMarkets = allMarkets.slice(0, 10).map(d => ({
      country: d.nationality,
      nights: d.nights,
      nightsPrior: nightsData.find(p => p.year === priorYear && p.month === month && p.nationality === d.nationality)?.nights || 0,
      share: (d.nights / nights) * 100
    }));
    
    // Occupancy
    const occ = occupancyData.find(d => d.year === year && d.month === month && d.period === 'monthly')?.occupancy_rate || 0;
    const occPrior = occupancyData.find(d => d.year === priorYear && d.month === month && d.period === 'monthly')?.occupancy_rate || 0;
    
    // Regional occupancy
    const regions = regionalOccData
      .filter(d => d.year === year && d.month === month)
      .map(d => ({
        region: d.region,
        occupancy: d.occupancy_rate,
        priorOcc: regionalOccData.find(p => p.year === priorYear && p.month === month && p.region === d.region)?.occupancy_rate || 0
      }))
      .sort((a, b) => b.occupancy - a.occupancy);
    
    // Spending
    const spend = spendingData[`${year}-${String(month).padStart(2, '0')}`]?.Heildarúttekt || 0;
    const spendPrior = spendingData[`${priorYear}-${String(month).padStart(2, '0')}`]?.Heildarúttekt || 0;
    
    // Icelandic (domestic) nights
    const domesticNights = nightsData.find(d => d.year === year && d.month === month && d.nationality === 'Iceland')?.nights || 0;
    const domesticPrior = nightsData.find(d => d.year === priorYear && d.month === month && d.nationality === 'Iceland')?.nights || 0;
    
    return {
      month, year, monthName,
      nights, nightsPrior,
      nightsYoY: nightsPrior ? ((nights - nightsPrior) / nightsPrior) * 100 : 0,
      occupancy: occ,
      occupancyPrior: occPrior,
      occupancyChange: occ - occPrior,
      spending: spend,
      spendingPrior: spendPrior,
      spendingYoY: spendPrior ? ((spend - spendPrior) / spendPrior) * 100 : 0,
      topMarkets,
      regions,
      domesticNights,
      domesticPrior,
      domesticYoY: domesticPrior ? ((domesticNights - domesticPrior) / domesticPrior) * 100 : 0
    };
  }, [parsedSlug, nightsData, occupancyData, regionalOccData, spendingData]);

  // Update document title and meta tags for SEO
  useEffect(() => {
    if (!report) return;
    
    const r = report;
    const title = `Iceland Tourism ${r.monthName} ${r.year}: Hotel Nights ${r.nightsYoY >= 0 ? 'Up' : 'Down'} ${Math.abs(r.nightsYoY).toFixed(1)}% | Iceland Data`;
    const description = `${r.monthName} ${r.year} Iceland tourism statistics: ${r.nights.toLocaleString()} foreign hotel nights (${r.nightsYoY >= 0 ? '+' : ''}${r.nightsYoY.toFixed(1)}% YoY), ${r.occupancy.toFixed(1)}% hotel occupancy, ${(r.spending / 1000).toFixed(1)}B ISK tourist card spending. Official data from Statistics Iceland.`;
    const url = `https://icelandinsights.com/blog/iceland-tourism-${r.monthName.toLowerCase()}-${r.year}`;
    const imageUrl = `https://icelandinsights.com/og-image-${r.monthName.toLowerCase()}-${r.year}.png`;
    
    // Document title
    document.title = title;
    
    // Helper to set or create meta tag
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };
    
    // Helper to set link tag
    const setLink = (rel: string, href: string) => {
      let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!tag) {
        tag = document.createElement('link');
        tag.rel = rel;
        document.head.appendChild(tag);
      }
      tag.href = href;
    };
    
    // Meta description
    setMeta('description', description);
    
    // Canonical URL
    setLink('canonical', url);
    
    // Open Graph tags
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:url', url, true);
    setMeta('og:type', 'article', true);
    setMeta('og:image', imageUrl, true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    setMeta('og:site_name', 'Iceland Data', true);
    setMeta('og:locale', 'en_US', true);
    
    // Twitter Card tags
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', imageUrl);
    setMeta('twitter:site', '@icelanddata');
    
    // Additional SEO meta
    setMeta('robots', 'index, follow, max-image-preview:large');
    setMeta('author', 'Iceland Data');
    setMeta('keywords', `Iceland tourism ${r.monthName} ${r.year}, Iceland visitor statistics, Iceland hotel occupancy, Iceland tourist spending, foreign visitors Iceland, ${r.monthName} travel Iceland, Iceland travel data, tourism statistics Iceland`);
    
    // Article-specific meta
    setMeta('article:published_time', `${r.year}-${String(r.month).padStart(2, '0')}-15T12:00:00Z`, true);
    setMeta('article:modified_time', `${r.month === 12 ? r.year + 1 : r.year}-${String(r.month === 12 ? 1 : r.month + 1).padStart(2, '0')}-01T12:00:00Z`, true);
    setMeta('article:section', 'Tourism Statistics', true);
    setMeta('article:tag', 'Iceland Tourism', true);
    
  }, [report]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading data</p>
          <p className="text-neutral-400 text-sm mb-4">{error}</p>
          <a href="/blog" className="text-amber-600 hover:underline">← Back to reports</a>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <p className="text-neutral-500 mb-2">Report not found</p>
          <p className="text-neutral-400 text-sm mb-4">
            {slug ? `Looking for: ${slug}` : 'No slug provided'}
          </p>
          <a href="/blog" className="text-amber-600 hover:underline">← Back to reports</a>
        </div>
      </div>
    );
  }

  const r = report;
  const isGrowth = r.nightsYoY >= 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <style>{styles}</style>

      {/* Nav */}
      <nav className="sticky top-0 z-50 nav-blur" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            <a href="/arrivals" className="flex items-center gap-2 flex-shrink-0">
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
              }}>
                <div style={{ width: '3px', height: '8px', background: 'white', borderRadius: '1px', marginTop: '6px' }} />
                <div style={{ width: '3px', height: '12px', background: 'white', borderRadius: '1px', marginTop: '2px' }} />
                <div style={{ width: '3px', height: '16px', background: 'white', borderRadius: '1px' }} />
              </div>
              <span style={{ fontWeight: '600', fontSize: '15px', color: '#0F172A', letterSpacing: '-0.3px' }}>
                Iceland<span style={{ color: '#7C3AED' }}>Data</span>
              </span>
            </a>
            <div className="hidden md:flex items-center gap-1">
              <a href="/arrivals" className="nav-link">Arrivals</a>
              <a href="/hotels" className="nav-link">Hotels</a>
              <a href="/spending" className="nav-link">Spending</a>
              <a href="/blog" className="nav-link">Reports</a>
              <a href="/about" className="nav-link">About</a>
            </div>
            <div className="hidden md:flex items-center" style={{ minWidth: 100, justifyContent: 'flex-end' }}>
              <span className="text-xs text-neutral-400">Source: Hagstofa</span>
            </div>
            <button className="md:hidden p-2 -mr-2 text-neutral-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              <a href="/arrivals" className="nav-link block" style={{ padding: '12px 16px', fontSize: '15px' }}>Arrivals</a>
              <a href="/hotels" className="nav-link block" style={{ padding: '12px 16px', fontSize: '15px' }}>Hotels</a>
              <a href="/spending" className="nav-link block" style={{ padding: '12px 16px', fontSize: '15px' }}>Spending</a>
              <a href="/blog" className="nav-link block" style={{ padding: '12px 16px', fontSize: '15px' }}>Reports</a>
              <a href="/about" className="nav-link block" style={{ padding: '12px 16px', fontSize: '15px' }}>About</a>
            </div>
          </div>
        )}
      </nav>

      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <a href="/" className="text-neutral-500 hover:text-amber-600 transition-colors">Home</a>
              </li>
              <li className="text-neutral-300">/</li>
              <li>
                <a href="/blog" className="text-neutral-500 hover:text-amber-600 transition-colors">Tourism Reports</a>
              </li>
              <li className="text-neutral-300">/</li>
              <li>
                <span className="text-neutral-900 font-medium">{r.monthName} {r.year}</span>
              </li>
            </ol>
          </nav>
          
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
              <Calendar className="w-3 h-3" /> {r.monthName} {r.year}
            </span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isGrowth ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {isGrowth ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatPct(r.nightsYoY)} YoY
            </span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
            Iceland Tourism: {r.monthName} {r.year}
          </h1>
          
          <p className="text-lg text-neutral-600">
            Foreign hotel nights {isGrowth ? 'increased' : 'decreased'} {Math.abs(r.nightsYoY).toFixed(1)}% year-over-year. 
            Full breakdown of hotel, spending, and market data.
          </p>
        </div>
      </header>

      {/* Key Stats Banner */}
      <div className={`${isGrowth ? 'bg-gradient-to-r from-emerald-50 to-teal-50' : 'bg-gradient-to-r from-red-50 to-orange-50'} border-b`}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-neutral-900 tabular-nums">{r.nights.toLocaleString()}</div>
              <div className="text-xs text-neutral-500">Foreign Hotel Nights</div>
              <div className={`text-xs font-semibold ${r.nightsYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatPct(r.nightsYoY)} vs {r.year - 1}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900 tabular-nums">{r.occupancy.toFixed(1)}%</div>
              <div className="text-xs text-neutral-500">Hotel Occupancy</div>
              <div className={`text-xs font-semibold ${r.occupancyChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {r.occupancyChange >= 0 ? '+' : ''}{r.occupancyChange.toFixed(1)} pp vs {r.year - 1}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900 tabular-nums">{(r.spending / 1000).toFixed(1)}B</div>
              <div className="text-xs text-neutral-500">Card Spending (ISK)</div>
              <div className={`text-xs font-semibold ${r.spendingYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatPct(r.spendingYoY)} vs {r.year - 1}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900 tabular-nums">{r.domesticNights.toLocaleString()}</div>
              <div className="text-xs text-neutral-500">Domestic Nights</div>
              <div className={`text-xs font-semibold ${r.domesticYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatPct(r.domesticYoY)} vs {r.year - 1}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <article className="prose max-w-none">
          
          <h2>Summary</h2>
          <p>
            {r.monthName} {r.year} was part of Iceland's {getSeasonDescription(r.month)}. Foreign guests recorded 
            <strong> {r.nights.toLocaleString()} hotel nights</strong>, compared to {r.nightsPrior.toLocaleString()} in {r.monthName} {r.year - 1}—a 
            <strong className={r.nightsYoY >= 0 ? ' text-emerald-600' : ' text-red-600'}> {formatPct(r.nightsYoY)}</strong> change year-over-year.
          </p>
          <p>
            National hotel occupancy stood at <strong>{r.occupancy.toFixed(1)}%</strong>, {r.occupancyChange >= 0 ? 'up' : 'down'} {Math.abs(r.occupancyChange).toFixed(1)} percentage points 
            from {r.occupancyPrior.toFixed(1)}% in {r.year - 1}. Foreign card spending totaled <strong>{(r.spending / 1000).toFixed(1)} billion ISK</strong> ({formatPct(r.spendingYoY)} YoY).
          </p>

          <h2>Foreign Hotel Nights by Source Market</h2>
          <p>
            The top source markets for {r.monthName} {r.year}, ranked by hotel nights:
          </p>
          
          <div className="overflow-x-auto my-6">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Market</th>
                  <th className="text-right">Nights {r.year}</th>
                  <th className="text-right">Nights {r.year - 1}</th>
                  <th className="text-right">Change</th>
                  <th className="text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {r.topMarkets.map((m, i) => {
                  const yoy = m.nightsPrior ? ((m.nights - m.nightsPrior) / m.nightsPrior) * 100 : 0;
                  return (
                    <tr key={m.country}>
                      <td className="font-medium">{i + 1}</td>
                      <td className="font-medium">{m.country}</td>
                      <td className="text-right tabular-nums">{m.nights.toLocaleString()}</td>
                      <td className="text-right tabular-nums text-neutral-500">{m.nightsPrior.toLocaleString()}</td>
                      <td className={`text-right tabular-nums font-medium ${yoy >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatPct(yoy)}
                      </td>
                      <td className="text-right tabular-nums">{m.share.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h2>Hotel Occupancy by Region</h2>
          <p>
            Regional hotel occupancy rates for {r.monthName} {r.year}:
          </p>
          
          {r.regions.length > 0 && (
            <div className="overflow-x-auto my-6">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th className="text-right">Occupancy {r.year}</th>
                    <th className="text-right">Occupancy {r.year - 1}</th>
                    <th className="text-right">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {r.regions.map(reg => {
                    const change = reg.occupancy - reg.priorOcc;
                    return (
                      <tr key={reg.region}>
                        <td className="font-medium">{reg.region}</td>
                        <td className="text-right tabular-nums">{reg.occupancy.toFixed(1)}%</td>
                        <td className="text-right tabular-nums text-neutral-500">{reg.priorOcc.toFixed(1)}%</td>
                        <td className={`text-right tabular-nums font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {change >= 0 ? '+' : ''}{change.toFixed(1)} pp
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <h2>Foreign Card Spending</h2>
          <p>
            Total foreign card turnover in {r.monthName} {r.year} was <strong>{r.spending.toLocaleString()} million ISK</strong> ({(r.spending / 1000).toFixed(2)} billion ISK), 
            compared to {r.spendingPrior.toLocaleString()} million ISK in {r.monthName} {r.year - 1}.
          </p>
          <p>
            This represents a <strong className={r.spendingYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}>{formatPct(r.spendingYoY)}</strong> year-over-year change.
            {r.spendingYoY < 0 && r.nightsYoY > 0 && ' Despite growth in hotel nights, spending declined—possibly reflecting lower per-visitor expenditure or shifts in spending patterns.'}
            {r.spendingYoY > 0 && r.nightsYoY < 0 && ' Spending increased even as hotel nights declined, suggesting higher per-visitor expenditure.'}
          </p>

          <h2>Domestic Tourism</h2>
          <p>
            Icelandic residents recorded <strong>{r.domesticNights.toLocaleString()} hotel nights</strong> in {r.monthName} {r.year}, 
            {r.domesticYoY >= 0 ? ' up ' : ' down '}{Math.abs(r.domesticYoY).toFixed(1)}% from {r.domesticPrior.toLocaleString()} in {r.year - 1}.
          </p>

          <h2>Data Sources</h2>
          <ul>
            <li><strong>Hotel Nights:</strong> Statistics Iceland (Hagstofa Íslands) — foreign and domestic guest nights in registered hotels</li>
            <li><strong>Occupancy Rates:</strong> Statistics Iceland — room occupancy as % of available hotel capacity</li>
            <li><strong>Card Spending:</strong> Central Bank of Iceland (Seðlabanki Íslands) — foreign debit/credit card turnover</li>
          </ul>
        </article>

        {/* Dashboard Links */}
        <div className="mt-12 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
          <h3 className="font-semibold text-neutral-900 mb-2">Explore Interactive Dashboards</h3>
          <p className="text-sm text-neutral-600 mb-4">See full time series and drill into the data:</p>
          <div className="flex flex-wrap gap-3">
            <a href="/arrivals" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Arrivals <ArrowUpRight className="w-3 h-3" />
            </a>
            <a href="/hotels" className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
              Hotels <ArrowUpRight className="w-3 h-3" />
            </a>
            <a href="/spending" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
              Spending <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Visible FAQ Section for SEO */}
        <div className="mt-12 p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-neutral-800 mb-2">
                How many tourists visited Iceland in {r.monthName} {r.year}?
              </h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Foreign visitors recorded <strong>{r.nights.toLocaleString()} hotel nights</strong> in Iceland during {r.monthName} {r.year}. 
                This represents a <strong>{r.nightsYoY >= 0 ? '+' : ''}{r.nightsYoY.toFixed(1)}% change</strong> compared to {r.monthName} {r.year - 1}, 
                when {r.nightsPrior?.toLocaleString() || 'N/A'} nights were recorded.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-neutral-800 mb-2">
                What was Iceland's hotel occupancy rate in {r.monthName} {r.year}?
              </h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                National hotel occupancy in Iceland was <strong>{r.occupancy.toFixed(1)}%</strong> in {r.monthName} {r.year}. 
                This is {r.occupancyChange >= 0 ? 'up' : 'down'} <strong>{Math.abs(r.occupancyChange).toFixed(1)} percentage points</strong> from 
                {' '}{r.occupancyPrior.toFixed(1)}% in {r.monthName} {r.year - 1}. {r.occupancy >= 80 ? 
                  'This high occupancy indicates strong demand during peak season.' : 
                  r.occupancy >= 60 ? 'This reflects healthy demand for the season.' : 
                  'Lower occupancy is typical for this time of year.'}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-neutral-800 mb-2">
                How much did tourists spend in Iceland in {r.monthName} {r.year}?
              </h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Foreign card spending totaled <strong>{(r.spending / 1000).toFixed(1)} billion ISK</strong> in {r.monthName} {r.year}, 
                a <strong>{r.spendingYoY >= 0 ? '+' : ''}{r.spendingYoY.toFixed(1)}% change</strong> year-over-year. 
                This data from the Central Bank of Iceland tracks all foreign debit and credit card transactions in the country.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-neutral-800 mb-2">
                Which countries send the most tourists to Iceland?
              </h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                In {r.monthName} {r.year}, the top source markets for Iceland tourism were: {' '}
                {r.topMarkets.slice(0, 5).map((m: any, i: number) => (
                  <span key={m.market}>
                    <strong>{m.market}</strong> ({m.share.toFixed(1)}%){i < 4 ? ', ' : ''}
                  </span>
                ))}. 
                The United States and United Kingdom consistently rank among Iceland's largest tourism markets.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-neutral-800 mb-2">
                What is the best time to visit Iceland?
              </h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Iceland offers unique experiences year-round. <strong>Summer (June-August)</strong> provides midnight sun, 
                warmer weather, and access to highland roads. <strong>Winter (November-March)</strong> offers northern lights, 
                ice caves, and snowy landscapes. {r.monthName} falls in the {getSeasonDescription(r.month)}, 
                making it {r.month >= 6 && r.month <= 8 ? 'ideal for outdoor activities and road trips' : 
                r.month >= 11 || r.month <= 2 ? 'perfect for aurora viewing and winter adventures' : 
                'a good balance of activities and smaller crowds'}.
              </p>
            </div>
          </div>
        </div>

        {/* Related Reports */}
        <div className="mt-8">
          <h3 className="font-semibold text-neutral-900 mb-4">Related Monthly Reports</h3>
          <div className="flex flex-wrap gap-2">
            {[-2, -1, 1, 2].map(offset => {
              let m = r.month + offset;
              let y = r.year;
              if (m <= 0) { m += 12; y -= 1; }
              if (m > 12) { m -= 12; y += 1; }
              const monthName = MONTHS[m - 1];
              return (
                <a 
                  key={`${y}-${m}`}
                  href={`/blog/iceland-tourism-${monthName.toLowerCase()}-${y}`}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm text-neutral-700 transition-colors"
                >
                  {monthName} {y}
                </a>
              );
            })}
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8 pt-8 border-t border-neutral-200">
          <a href="/blog" className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium">
            <ChevronLeft className="w-4 h-4" /> Back to all reports
          </a>
        </div>
      </main>

      {/* JSON-LD Article Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": `Iceland Tourism Statistics ${r.monthName} ${r.year}: Foreign Hotel Nights ${r.nightsYoY >= 0 ? 'Up' : 'Down'} ${Math.abs(r.nightsYoY).toFixed(1)}%`,
        "description": `${r.monthName} ${r.year} Iceland tourism report: ${r.nights.toLocaleString()} foreign hotel nights (${r.nightsYoY >= 0 ? '+' : ''}${r.nightsYoY.toFixed(1)}% YoY), ${r.occupancy.toFixed(1)}% occupancy, ${(r.spending / 1000).toFixed(1)}B ISK card spending.`,
        "datePublished": `${r.year}-${String(r.month).padStart(2, '0')}-15`,
        "dateModified": `${r.month === 12 ? r.year + 1 : r.year}-${String(r.month === 12 ? 1 : r.month + 1).padStart(2, '0')}-15`,
        "author": { "@type": "Organization", "name": "Iceland Data" },
        "publisher": { "@type": "Organization", "name": "Iceland Data" },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://icelandinsights.com/blog/iceland-tourism-${r.monthName.toLowerCase()}-${r.year}`
        },
        "about": [
          { "@type": "Thing", "name": "Iceland Tourism" },
          { "@type": "Thing", "name": "Hotel Statistics" },
          { "@type": "Thing", "name": "Tourism Data" }
        ],
        "keywords": `Iceland tourism ${r.monthName} ${r.year}, Iceland visitor statistics, Iceland hotel occupancy, Iceland tourist spending, foreign visitors Iceland, ${r.monthName} travel Iceland`
      })}} />
      
      {/* FAQ Schema for this specific month - matches visible FAQ */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `How many tourists visited Iceland in ${r.monthName} ${r.year}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Foreign visitors recorded ${r.nights.toLocaleString()} hotel nights in Iceland during ${r.monthName} ${r.year}, a ${r.nightsYoY >= 0 ? '+' : ''}${r.nightsYoY.toFixed(1)}% change compared to ${r.monthName} ${r.year - 1}.`
            }
          },
          {
            "@type": "Question",
            "name": `What was Iceland's hotel occupancy in ${r.monthName} ${r.year}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `National hotel occupancy in Iceland was ${r.occupancy.toFixed(1)}% in ${r.monthName} ${r.year}, ${r.occupancyChange >= 0 ? 'up' : 'down'} ${Math.abs(r.occupancyChange).toFixed(1)} percentage points from ${r.occupancyPrior.toFixed(1)}% in ${r.monthName} ${r.year - 1}.`
            }
          },
          {
            "@type": "Question",
            "name": `How much did tourists spend in Iceland in ${r.monthName} ${r.year}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Foreign card spending totaled ${(r.spending / 1000).toFixed(1)} billion ISK in ${r.monthName} ${r.year}, a ${r.spendingYoY >= 0 ? '+' : ''}${r.spendingYoY.toFixed(1)}% change year-over-year.`
            }
          },
          {
            "@type": "Question",
            "name": "Which countries send the most tourists to Iceland?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `In ${r.monthName} ${r.year}, the top source markets for Iceland tourism were ${r.topMarkets.slice(0, 5).map((m: any) => `${m.market} (${m.share.toFixed(1)}%)`).join(', ')}. The United States and United Kingdom consistently rank among Iceland's largest tourism markets.`
            }
          },
          {
            "@type": "Question",
            "name": "What is the best time to visit Iceland?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Iceland offers unique experiences year-round. Summer (June-August) provides midnight sun, warmer weather, and access to highland roads. Winter (November-March) offers northern lights, ice caves, and snowy landscapes. Spring and autumn offer a balance of activities and smaller crowds."
            }
          }
        ]
      })}} />

      {/* Breadcrumb Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://icelandinsights.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Tourism Reports",
            "item": "https://icelandinsights.com/blog"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": `${r.monthName} ${r.year} Report`,
            "item": `https://icelandinsights.com/blog/iceland-tourism-${r.monthName.toLowerCase()}-${r.year}`
          }
        ]
      })}} />

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-6 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <p className="text-xs text-neutral-400">
            Data: Statistics Iceland & Central Bank of Iceland
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BlogPostPage;
