import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Building2, CreditCard, ChevronRight, Search, BarChart3, ArrowUpRight, Menu, X } from 'lucide-react';

const styles = `
  html { overflow-y: scroll; }
  * { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif; }
  
  .nav-blur { backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px); }
  
  .nav-link {
    position: relative; padding: 8px 16px; font-size: 14px; font-weight: 500;
    color: #6B7280; border-radius: 8px; transition: all 0.2s ease;
  }
  .nav-link:hover { color: #111827; background: rgba(0, 0, 0, 0.04); }
  .nav-link.active { color: #111827; background: rgba(0, 0, 0, 0.06); }
  .nav-link.active::after {
    content: ''; position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%);
    width: 20px; height: 2px; background: linear-gradient(90deg, #F59E0B, #D97706); border-radius: 2px;
  }
  
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-in { animation: fadeInUp 0.5s ease-out forwards; }
  .delay-1 { animation-delay: 0.1s; opacity: 0; }
  .delay-2 { animation-delay: 0.2s; opacity: 0; }
  
  .card {
    background: white; border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
    transition: all 0.2s ease;
  }
  .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-2px); }
  
  .tag { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; }
  .tabular-nums { font-variant-numeric: tabular-nums; }
`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthlyReport {
  month: number;
  year: number;
  slug: string;
  // Hotel nights (foreigners)
  nights: number;
  nightsPrior: number;
  nightsYoY: number;
  // Occupancy
  occupancy: number;
  occupancyPrior: number;
  occupancyChange: number;
  // Spending
  spending: number;
  spendingPrior: number;
  spendingYoY: number;
  // Top markets for this month
  topMarkets: { country: string; nights: number; share: number }[];
}

const formatNum = (n: number): string => {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
  return n.toLocaleString();
};

const formatPct = (v: number, showPlus = true): string => {
  const sign = showPlus && v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
};

const BlogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [nightsData, setNightsData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [spendingData, setSpendingData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = 'Iceland Tourism Statistics Reports | Monthly Data Analysis | Iceland Data';
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [nRes, oRes, sRes] = await Promise.all([
          fetch('/hotel_nights_hotels_only.json'),
          fetch('/hotel_occupancy.json'),
          fetch('/spending_data.json')
        ]);
        setNightsData(await nRes.json());
        setOccupancyData(await oRes.json());
        const sJson = await sRes.json();
        setSpendingData(sJson.monthlyData || {});
      } catch (e) {
        console.error('Load error:', e);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Build reports from actual data
  const reports: MonthlyReport[] = useMemo(() => {
    if (!nightsData.length) return [];
    
    const results: MonthlyReport[] = [];
    const currentYear = 2025;
    const priorYear = 2024;
    
    for (let month = 1; month <= 12; month++) {
      // Foreign hotel nights
      const nights = nightsData.find(d => d.year === currentYear && d.month === month && d.nationality === 'Foreigners')?.nights;
      const nightsPrior = nightsData.find(d => d.year === priorYear && d.month === month && d.nationality === 'Foreigners')?.nights;
      
      if (!nights) continue; // Skip months without 2025 data
      
      // Top markets for this month
      const monthMarkets = nightsData
        .filter(d => d.year === currentYear && d.month === month && d.nationality !== 'Foreigners' && d.nationality !== 'Iceland' && d.nationality !== 'Total')
        .sort((a, b) => b.nights - a.nights)
        .slice(0, 5)
        .map(d => ({ country: d.nationality, nights: d.nights, share: (d.nights / nights) * 100 }));
      
      // Occupancy
      const occ = occupancyData.find(d => d.year === currentYear && d.month === month && d.period === 'monthly')?.occupancy_rate || 0;
      const occPrior = occupancyData.find(d => d.year === priorYear && d.month === month && d.period === 'monthly')?.occupancy_rate || 0;
      
      // Spending
      const spend = spendingData[`${currentYear}-${String(month).padStart(2, '0')}`]?.Heildarúttekt || 0;
      const spendPrior = spendingData[`${priorYear}-${String(month).padStart(2, '0')}`]?.Heildarúttekt || 0;
      
      results.push({
        month,
        year: currentYear,
        slug: `iceland-tourism-${MONTHS[month - 1].toLowerCase()}-${currentYear}`,
        nights,
        nightsPrior: nightsPrior || 0,
        nightsYoY: nightsPrior ? ((nights - nightsPrior) / nightsPrior) * 100 : 0,
        occupancy: occ,
        occupancyPrior: occPrior,
        occupancyChange: occ - occPrior,
        spending: spend,
        spendingPrior: spendPrior,
        spendingYoY: spendPrior ? ((spend - spendPrior) / spendPrior) * 100 : 0,
        topMarkets: monthMarkets
      });
    }
    
    return results.sort((a, b) => b.month - a.month);
  }, [nightsData, occupancyData, spendingData]);

  const filtered = reports.filter(r => 
    !searchTerm || MONTHS[r.month - 1].toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-500">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
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
              <a href="/blog" className="nav-link active">Reports</a>
              <a href="/about" className="nav-link">About</a>
            </div>
            <div className="hidden md:flex items-center" style={{ minWidth: 240, justifyContent: 'flex-end' }}>
              <span className="text-xs text-transparent">Source: Central Bank & Statistics Iceland</span>
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
              <a href="/blog" className="nav-link block active" style={{ padding: '12px 16px', fontSize: '15px' }}>Reports</a>
              <a href="/about" className="nav-link block" style={{ padding: '12px 16px', fontSize: '15px' }}>About</a>
            </div>
          </div>
        )}
      </nav>

      {/* Header */}
      <header className="pt-10 pb-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">Iceland Tourism Monthly Reports</h1>
          <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
            Data-driven monthly analysis. All figures from Statistics Iceland and Central Bank of Iceland.
          </p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="search"
              placeholder="Search by month..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        
        {/* Latest Report - Featured */}
        {filtered.length > 0 && (() => {
          const r = filtered[0];
          const trend = r.nightsYoY >= 0 ? 'up' : 'down';
          
          return (
            <a href={`/blog/${r.slug}`} className="block">
              <article className="card p-6 md:p-8 mb-8 animate-fade-in">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="tag bg-amber-100 text-amber-700">Latest</span>
                      <span className="text-xs text-neutral-500">{MONTHS[r.month - 1]} {r.year}</span>
                    </div>
                    
                    <h2 className="text-xl md:text-2xl font-bold text-neutral-900 mb-4">
                      {MONTHS[r.month - 1]} {r.year}: Foreign Hotel Nights {trend === 'up' ? 'Up' : 'Down'} {Math.abs(r.nightsYoY).toFixed(1)}%
                    </h2>
                    
                    <div className="text-neutral-600 text-sm leading-relaxed space-y-2 mb-4">
                      <p>
                        <strong>{r.nights.toLocaleString()}</strong> foreign hotel nights recorded in {MONTHS[r.month - 1]} {r.year}, 
                        {r.nightsYoY >= 0 ? ' an increase of ' : ' a decrease of '}
                        <strong>{Math.abs(r.nightsYoY).toFixed(1)}%</strong> compared to {r.nightsPrior.toLocaleString()} in {MONTHS[r.month - 1]} {r.year - 1}.
                      </p>
                      <p>
                        National hotel occupancy stood at <strong>{r.occupancy.toFixed(1)}%</strong>
                        {r.occupancyChange !== 0 && ` (${r.occupancyChange >= 0 ? '+' : ''}${r.occupancyChange.toFixed(1)} percentage points YoY)`}.
                        Foreign card spending totaled <strong>{(r.spending / 1000).toFixed(1)}B ISK</strong>
                        {r.spendingYoY !== 0 && ` (${formatPct(r.spendingYoY)} YoY)`}.
                      </p>
                      {r.topMarkets.length > 0 && (
                        <p>
                          Top source markets: {r.topMarkets.slice(0, 3).map(m => `${m.country} (${m.share.toFixed(0)}%)`).join(', ')}.
                        </p>
                      )}
                    </div>
                    
                    <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-medium">
                      Full report <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 lg:w-72 flex-shrink-0">
                    <div className="bg-violet-50 rounded-xl p-4">
                      <Building2 className="w-4 h-4 text-violet-600 mb-1" />
                      <div className="text-xl font-bold text-violet-900 tabular-nums">{formatNum(r.nights)}</div>
                      <div className="text-[10px] text-violet-600 uppercase">Foreign Nights</div>
                      <div className={`text-xs font-bold mt-1 tabular-nums ${r.nightsYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatPct(r.nightsYoY)} YoY
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="text-[10px] text-blue-600 uppercase mb-1">Occupancy</div>
                      <div className="text-xl font-bold text-blue-900 tabular-nums">{r.occupancy.toFixed(1)}%</div>
                      <div className={`text-xs font-bold mt-1 tabular-nums ${r.occupancyChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {r.occupancyChange >= 0 ? '+' : ''}{r.occupancyChange.toFixed(1)} pp
                      </div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <CreditCard className="w-4 h-4 text-emerald-600 mb-1" />
                      <div className="text-xl font-bold text-emerald-900 tabular-nums">{(r.spending / 1000).toFixed(1)}B</div>
                      <div className="text-[10px] text-emerald-600 uppercase">Spending ISK</div>
                      <div className={`text-xs font-bold mt-1 tabular-nums ${r.spendingYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatPct(r.spendingYoY)} YoY
                      </div>
                    </div>
                    <div className={`${r.nightsYoY >= 0 ? 'bg-emerald-50' : 'bg-red-50'} rounded-xl p-4 flex flex-col justify-center items-center`}>
                      {r.nightsYoY >= 0 ? (
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      )}
                      <div className={`text-sm font-bold mt-1 ${r.nightsYoY >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {r.nightsYoY >= 0 ? 'Growth' : 'Decline'}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </a>
          );
        })()}

        {/* Other Reports Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {filtered.slice(1).map((r, i) => (
            <a key={r.slug} href={`/blog/${r.slug}`} className="block">
              <article className={`card p-5 h-full animate-fade-in delay-${Math.min(i % 2 + 1, 2)}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="tag bg-neutral-100 text-neutral-600">{MONTHS_SHORT[r.month - 1]} {r.year}</span>
                  <span className={`tag ${r.nightsYoY >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {formatPct(r.nightsYoY)}
                  </span>
                </div>
                
                <h3 className="font-semibold text-neutral-900 mb-2">{MONTHS[r.month - 1]} {r.year} Report</h3>
                
                <p className="text-sm text-neutral-500 mb-3">
                  {formatNum(r.nights)} foreign nights · {r.occupancy.toFixed(1)}% occ · {(r.spending / 1000).toFixed(1)}B ISK
                </p>
                
                <div className="flex gap-4 pt-3 border-t border-neutral-100 text-xs">
                  <div>
                    <span className="text-neutral-400">Nights:</span>
                    <span className={`ml-1 font-semibold tabular-nums ${r.nightsYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatPct(r.nightsYoY)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Spend:</span>
                    <span className={`ml-1 font-semibold tabular-nums ${r.spendingYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatPct(r.spendingYoY)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Occ:</span>
                    <span className={`ml-1 font-semibold tabular-nums ${r.occupancyChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {r.occupancyChange >= 0 ? '+' : ''}{r.occupancyChange.toFixed(1)}pp
                    </span>
                  </div>
                </div>
              </article>
            </a>
          ))}
        </div>

        {/* Summary Table */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">2025 Data Summary</h2>
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-neutral-700">Month</th>
                    <th className="text-right py-3 px-4 font-semibold text-neutral-700">Foreign Nights</th>
                    <th className="text-right py-3 px-4 font-semibold text-neutral-700">YoY</th>
                    <th className="text-right py-3 px-4 font-semibold text-neutral-700">Occupancy</th>
                    <th className="text-right py-3 px-4 font-semibold text-neutral-700">vs 2024</th>
                    <th className="text-right py-3 px-4 font-semibold text-neutral-700">Spending</th>
                    <th className="text-right py-3 px-4 font-semibold text-neutral-700">YoY</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.sort((a, b) => a.month - b.month).map(r => (
                    <tr key={r.month} className="border-t border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4 font-medium">{MONTHS_SHORT[r.month - 1]}</td>
                      <td className="py-3 px-4 text-right tabular-nums">{r.nights.toLocaleString()}</td>
                      <td className={`py-3 px-4 text-right tabular-nums font-medium ${r.nightsYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatPct(r.nightsYoY)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">{r.occupancy.toFixed(1)}%</td>
                      <td className={`py-3 px-4 text-right tabular-nums font-medium ${r.occupancyChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {r.occupancyChange >= 0 ? '+' : ''}{r.occupancyChange.toFixed(1)}pp
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">{(r.spending / 1000).toFixed(1)}B</td>
                      <td className={`py-3 px-4 text-right tabular-nums font-medium ${r.spendingYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatPct(r.spendingYoY)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Foreign nights = hotel guests with non-Icelandic nationality. Spending = foreign card turnover (millions ISK).
          </p>
        </section>

        {/* Dashboard Links */}
        <section className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
          <h3 className="font-semibold text-neutral-900 mb-2">Explore Interactive Dashboards</h3>
          <p className="text-sm text-neutral-600 mb-4">Dive deeper with real-time charts and filtering:</p>
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
        </section>

        {/* Data Sources */}
        <section className="mt-12 pt-8 border-t border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">Data Sources</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <Building2 className="w-5 h-5 text-violet-600 mb-2" />
              <h3 className="font-semibold">Hotel Nights</h3>
              <p className="text-neutral-500 text-xs mt-1">Statistics Iceland. Foreign guest nights in hotels only (excludes guesthouses, hostels).</p>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-xs mb-2">%</div>
              <h3 className="font-semibold">Occupancy Rate</h3>
              <p className="text-neutral-500 text-xs mt-1">Statistics Iceland. National room occupancy as percentage of available hotel rooms.</p>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <CreditCard className="w-5 h-5 text-emerald-600 mb-2" />
              <h3 className="font-semibold">Card Spending</h3>
              <p className="text-neutral-500 text-xs mt-1">Central Bank of Iceland. Total foreign debit/credit card turnover in ISK.</p>
            </div>
          </div>
        </section>

        {/* SEO: FAQ Section */}
        <section className="mt-12 pt-8 border-t border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">Frequently Asked Questions About Iceland Tourism</h2>
          <div className="space-y-3">
            {[
              { 
                q: "How many tourists visit Iceland each year?", 
                a: "Iceland receives approximately 2 million foreign visitors annually through Keflavík Airport. Monthly arrivals range from around 65,000 in winter months to over 250,000 in peak summer (July-August)." 
              },
              { 
                q: "What is the best time to visit Iceland?", 
                a: "Summer (June-August) offers midnight sun and best weather with highest visitor numbers. Winter (November-March) is ideal for northern lights and ice caves. Shoulder seasons (May, September-October) balance good conditions with fewer crowds." 
              },
              { 
                q: "Where do most Iceland tourists come from?", 
                a: "The United States is Iceland's largest source market (typically 20-25% of visitors), followed by United Kingdom (12-15%), Germany (10-13%), France (6-8%), and Canada (4-6%)." 
              },
              { 
                q: "How much do tourists spend in Iceland?", 
                a: "Foreign card spending in Iceland totals 350-450 billion ISK annually. Monthly spending ranges from around 15-20 billion ISK in winter to 50+ billion ISK in peak summer months." 
              },
              { 
                q: "What is Iceland's hotel occupancy rate?", 
                a: "National hotel occupancy averages 60-70% annually, peaking at 85-90% in July-August and dropping to 45-55% in January-February. The Capital Region typically runs 5-10 percentage points above the national average." 
              },
              { 
                q: "When is northern lights season in Iceland?", 
                a: "Northern lights (aurora borealis) are visible from late August through mid-April, with peak viewing from September to March when nights are darkest and skies are often clear." 
              }
            ].map((faq, i) => (
              <details key={i} className="group bg-white rounded-lg border border-neutral-200">
                <summary className="cursor-pointer p-4 text-sm font-medium text-neutral-800 hover:text-amber-600">{faq.q}</summary>
                <p className="px-4 pb-4 text-sm text-neutral-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* SEO: Static descriptive content for crawlers */}
        <section className="mt-12 pt-8 border-t border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">About These Tourism Reports</h2>
          <div className="text-sm text-neutral-600 space-y-3">
            <p>
              Iceland Data publishes monthly tourism statistics reports analyzing foreign visitor data for Iceland. 
              Each report covers three key metrics: foreign hotel nights (from Statistics Iceland), national and regional 
              hotel occupancy rates, and foreign card spending (from the Central Bank of Iceland).
            </p>
            <p>
              Our reports break down hotel nights by source market, showing which countries contribute most visitors. 
              We track year-over-year changes to identify growth trends and seasonal patterns in Iceland's tourism industry.
            </p>
            <p>
              Data is updated monthly as official statistics become available, typically with a 4-6 week lag from the 
              reporting period. All figures are sourced directly from Hagstofa Íslands (Statistics Iceland) and 
              Seðlabanki Íslands (Central Bank of Iceland).
            </p>
          </div>
        </section>
      </main>

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Iceland Data - Tourism Statistics",
        "url": "https://icelandinsights.com",
        "description": "Monthly reports on Iceland tourism statistics including foreign visitor hotel nights, occupancy rates, and card spending data.",
        "publisher": {
          "@type": "Organization",
          "name": "Iceland Data"
        }
      })}} />
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How many tourists visit Iceland each year?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Iceland receives approximately 2 million foreign visitors annually through Keflavík Airport. Monthly arrivals range from around 65,000 in winter months to over 250,000 in peak summer (July-August)."
            }
          },
          {
            "@type": "Question",
            "name": "What is the best time to visit Iceland?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Summer (June-August) offers midnight sun and best weather with highest visitor numbers. Winter (November-March) is ideal for northern lights and ice caves. Shoulder seasons (May, September-October) balance good conditions with fewer crowds."
            }
          },
          {
            "@type": "Question",
            "name": "Where do most Iceland tourists come from?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The United States is Iceland's largest source market (typically 20-25% of visitors), followed by United Kingdom (12-15%), Germany (10-13%), France (6-8%), and Canada (4-6%)."
            }
          },
          {
            "@type": "Question",
            "name": "How much do tourists spend in Iceland?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Foreign card spending in Iceland totals 350-450 billion ISK annually. Monthly spending ranges from around 15-20 billion ISK in winter to 50+ billion ISK in peak summer months."
            }
          },
          {
            "@type": "Question",
            "name": "What is Iceland's hotel occupancy rate?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "National hotel occupancy averages 60-70% annually, peaking at 85-90% in July-August and dropping to 45-55% in January-February. The Capital Region typically runs 5-10 percentage points above the national average."
            }
          },
          {
            "@type": "Question",
            "name": "When is northern lights season in Iceland?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Northern lights (aurora borealis) are visible from late August through mid-April, with peak viewing from September to March when nights are darkest and skies are often clear."
            }
          }
        ]
      })}} />

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-6 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <p className="text-xs text-neutral-400">
            Data: Statistics Iceland (Hagstofa Íslands) & Central Bank of Iceland (Seðlabanki Íslands)
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BlogPage;
