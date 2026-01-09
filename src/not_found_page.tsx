import React from 'react';
import { Link } from 'react-router-dom';
import { Home, BarChart3, Building2, CreditCard, FileText } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-slate-200 mb-2">404</div>
          <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 mx-auto rounded-full"></div>
        </div>
        
        {/* Message */}
        <h1 className="text-2xl font-bold text-slate-800 mb-3">
          Page not found
        </h1>
        <p className="text-slate-500 mb-8">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back to the data.
        </p>
        
        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link 
            to="/arrivals" 
            className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <div className="font-medium text-slate-800 text-sm">Arrivals</div>
              <div className="text-xs text-slate-500">Visitor data</div>
            </div>
          </Link>
          
          <Link 
            to="/hotels" 
            className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-fuchsia-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-fuchsia-600" />
            </div>
            <div>
              <div className="font-medium text-slate-800 text-sm">Hotels</div>
              <div className="text-xs text-slate-500">Occupancy rates</div>
            </div>
          </Link>
          
          <Link 
            to="/spending" 
            className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-medium text-slate-800 text-sm">Spending</div>
              <div className="text-xs text-slate-500">Economic impact</div>
            </div>
          </Link>
          
          <Link 
            to="/blog" 
            className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="font-medium text-slate-800 text-sm">Reports</div>
              <div className="text-xs text-slate-500">Monthly insights</div>
            </div>
          </Link>
        </div>
        
        {/* Home Button */}
        <Link 
          to="/arrivals"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-200 transition-all"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
        
        {/* Footer */}
        <p className="mt-8 text-xs text-slate-400">
          Iceland Data · icelanddata.is
        </p>
      </div>
    </div>
  );
}
