import React, { useState } from 'react';
import { BarChart3, Building2, CreditCard, Database, ExternalLink, Mail, Menu, X } from 'lucide-react';

const styles = `
  html { overflow-y: scroll; }
  * { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif; }
  
  .nav-blur { backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px); }
  
  .nav-link {
    position: relative;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #6B7280;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  .nav-link:hover { color: #111827; background: rgba(0, 0, 0, 0.04); }
  .nav-link.active { color: #7C3AED; background: rgba(124, 58, 237, 0.08); }
  
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
  
  .stagger-1 { animation-delay: 0.05s; }
  .stagger-2 { animation-delay: 0.1s; }
  .stagger-3 { animation-delay: 0.15s; }
  .stagger-4 { animation-delay: 0.2s; }
  .stagger-5 { animation-delay: 0.25s; }
  .stagger-6 { animation-delay: 0.3s; }
`;

export default function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <a href="/blog" className="nav-link">Reports</a>
              <a href="/about" className="nav-link active">About</a>
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
              <a href="/blog" className="nav-link block" style={{ padding: '12px 16px', fontSize: '15px' }}>Reports</a>
              <a href="/about" className="nav-link block active" style={{ padding: '12px 16px', fontSize: '15px' }}>About</a>
            </div>
          </div>
        )}
      </nav>

      {/* Page Header */}
      <div className="pt-10 pb-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center animate-fade-in-up">
            <h1 style={{ 
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827',
              letterSpacing: '-0.5px',
              margin: '0 0 8px 0'
            }}>
              About Iceland Data
            </h1>
            <p style={{ 
              fontSize: '15px',
              fontWeight: '400',
              color: '#6B7280',
              letterSpacing: '-0.1px',
              margin: 0,
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Making Iceland's tourism statistics accessible, visual, and useful.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8">
          
          {/* About Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200/60 mb-6 animate-fade-in-up stagger-1">
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>About</h2>
            <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '1.7', marginBottom: '16px' }}>
              Iceland Data transforms raw tourism statistics from Statistics Iceland (Hagstofa Íslands) and the Central Bank of Iceland (Seðlabanki Íslands) into interactive dashboards and monthly reports.
            </p>
            <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.6' }}>
              Disclaimer: Iceland Data is an independent informational resource and is not affiliated with any government agency. While all data is sourced from official public sources, no guarantee is made regarding its accuracy, completeness, or reliability. Any calculations, analyses, or interpretations presented are for informational purposes only and should not be used as the basis for business, investment, or policy decisions. Users assume full responsibility for how they use this information.
            </p>
          </div>

          {/* What We Track */}
          <div className="grid md:grid-cols-3 gap-4 mb-6 animate-fade-in-up stagger-2">
            <a href="/arrivals" className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200/60 hover:shadow-md hover:border-violet-200 transition-all">
              <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-violet-600" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Visitor Arrivals</h3>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.5' }}>
                Monthly arrivals by nationality, seasonal trends, and year-over-year growth analysis.
              </p>
            </a>
            
            <a href="/hotels" className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200/60 hover:shadow-md hover:border-fuchsia-200 transition-all">
              <div className="w-11 h-11 rounded-xl bg-fuchsia-100 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5 text-fuchsia-600" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Hotel Statistics</h3>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.5' }}>
                Occupancy rates by region, room nights, capacity growth, and average length of stay.
              </p>
            </a>
            
            <a href="/spending" className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200/60 hover:shadow-md hover:border-emerald-200 transition-all">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Tourist Spending</h3>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.5' }}>
                Economic impact data including spending by category, nationality, and seasonal patterns.
              </p>
            </a>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-4 mb-6 animate-fade-in-up stagger-3">
            {/* Data Sources */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200/60">
              <div className="flex items-center gap-2.5 mb-4">
                <Database className="w-5 h-5 text-violet-600" />
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Data Sources</h2>
              </div>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
                All data comes from official Icelandic government sources:
              </p>
              <div className="space-y-3">
                <a 
                  href="https://statice.is" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>Statistics Iceland</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Hagstofa Íslands</div>
                  </div>
                </a>
                
                <a 
                  href="https://www.cb.is" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>Central Bank of Iceland</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Seðlabanki Íslands</div>
                  </div>
                </a>
                
                <a 
                  href="https://www.ferdamalastofa.is" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>Icelandic Tourist Board</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>Ferðamálastofa</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200/60">
              <div className="flex items-center gap-2.5 mb-4">
                <Mail className="w-5 h-5 text-violet-600" />
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Contact</h2>
              </div>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
                Questions or feedback?
              </p>
              <a 
                href="mailto:contact@icelanddata.is"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md"
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)' }}
              >
                <Mail className="w-4 h-4" />
                contact@icelanddata.is
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-neutral-200 animate-fade-in-up stagger-4">
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
              © {new Date().getFullYear()} Iceland Data · Built with care in Iceland 🇮🇸
            </p>
          </div>
      </div>
    </div>
  );
}
