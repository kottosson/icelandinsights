import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Building2, CreditCard, ChevronLeft, BarChart3, ArrowUpRight, Calendar, Globe } from 'lucide-react';
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

  // Parse month/year from slug: "iceland-tourism-november-2025"
  const parsedSlug = useMemo(() => {
    if (!slug) return null;
    const match = slug.match(/iceland-tourism-(\w+)-(\d{4})/);
    if (!match) return null;
    const monthName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    const monthIndex = MONTHS.findIndex(m => m.toLowerCase() === match[1].toLowerCase());
    return { month: monthIndex + 1, year: parseInt(match[2]), monthName };
  }, [slug]);

  useEffect(() => {
    const load = async () => {
      try {
        const [nRes, oRes, rRes, sRes] = await Promise.all([
          fetch('/hotel_nights_hotels_only.json'),
          fetch('/hotel_occupancy.json'),
          fetch('/hotel_occupancy_regional.json'),
          fetch('/spending_data.json')
        ]);
        setNightsData(await nRes.json());
        setOccupancyData(await oRes.json());
        setRegionalOccData(await rRes.json());
        const sJson = await sRes.json();
        setSpendingData(sJson.monthlyData || {});
      } catch (e) {
        console.error('Load error:', e);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Report not found</p>
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
      <nav className="sticky top-0 z-50 nav-blur" style={{ background: 'rgba(255,255,255,0.72)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2.5" style={{ minWidth: 160 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-[15px] text-neutral-900">Iceland Insights</span>
            </a>
            <div className="flex items-center gap-1">
              <a href="/arrivals" className="nav-link">Arrivals</a>
              <a href="/hotels" className="nav-link">Hotels</a>
              <a href="/spending" className="nav-link">Card Spending</a>
              <a href="/blog" className="nav-link">Reports</a>
            </div>
            <div className="hidden md:flex items-center" style={{ minWidth: 160, justifyContent: 'flex-end' }}>
              <span className="text-xs text-neutral-500">Data: Statistics Iceland</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <a href="/blog" className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 mb-4">
            <ChevronLeft className="w-4 h-4" /> All Reports
          </a>
          
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

        {/* Back link */}
        <div className="mt-8 pt-8 border-t border-neutral-200">
          <a href="/blog" className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium">
            <ChevronLeft className="w-4 h-4" /> Back to all reports
          </a>
        </div>
      </main>

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
