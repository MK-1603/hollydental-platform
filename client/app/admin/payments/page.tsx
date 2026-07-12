"use client";

import { useState } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { CreditCard, ArrowUpRight, ArrowDownRight, Download, Filter, Search, Activity, Calendar, AlertCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import { useEffect } from "react";

export default function PaymentsPage() {
  const [search, setSearch] = useState("");

  const { data: transactions, loading, error } = useLiveData<any[]>("/payments", {
    initialData: [],
    intervalMs: 60000
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load payment transactions.");
    }
  }, [error]);

  const filteredTransactions = transactions?.filter(t => 
    t.id.toLowerCase().includes(search.toLowerCase()) || 
    t.patient.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const totalRevenue = transactions?.filter(t => t.type === "income" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0) || 0;
  
  const pendingRevenue = transactions?.filter(t => t.type === "income" && t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0) || 0;
    
  const totalExpenses = transactions?.filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <div className="flex flex-col h-full bg-gray-50 relative overflow-x-hidden p-6 w-full max-w-[100vw]">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900 font-serif">Payments & Revenue</h1>
          <p className="text-[12px] text-gray-500 mt-1">Track financial transactions, refunds, and daily revenue.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[12px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Calendar className="w-3.5 h-3.5" /> All Time
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-[8px] text-[12px] font-bold hover:bg-blue-700 transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-6 w-full">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="bg-white border border-gray-200 p-4 rounded-[12px] shadow-sm w-full">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
            <div className="flex items-end gap-3">
              <h2 className="text-[24px] font-bold text-gray-900 leading-none">€{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-4 rounded-[12px] shadow-sm w-full">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Expenses</p>
            <div className="flex items-end gap-3">
              <h2 className="text-[24px] font-bold text-gray-900 leading-none">€{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-4 rounded-[12px] shadow-sm w-full">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Payments</p>
            <div className="flex items-end gap-3">
              <h2 className="text-[24px] font-bold text-gray-900 leading-none">€{pendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>
          </div>
        </div>

        {/* Transactions Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
           <h3 className="text-[14px] font-bold text-gray-900">Recent Transactions</h3>
           <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search ID or Name..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-[8px] text-[12px] w-[200px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" 
                />
              </div>
              <button className="p-2 border border-gray-200 bg-white rounded-[8px] text-gray-500 hover:text-gray-900 transition-colors shadow-sm">
                <Filter className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Responsive Transaction Cards Grid */}
        <div className="w-full">
           {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                 {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-[12px] p-4 h-32 animate-pulse shadow-sm">
                       <div className="h-4 bg-gray-100 rounded w-1/3 mb-4"></div>
                       <div className="h-4 bg-gray-100 rounded w-2/3 mb-2"></div>
                       <div className="h-8 bg-gray-100 rounded w-1/2 mt-4"></div>
                    </div>
                 ))}
              </div>
           ) : filteredTransactions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                 {filteredTransactions.map((tx) => (
                    <div key={tx.id} className="bg-white border border-gray-200 rounded-[12px] shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden h-full">
                       <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                          <div>
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Transaction ID</span>
                             <span className="font-mono text-[12px] font-bold text-gray-500">{tx.id}</span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider border ${
                             tx.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                             {tx.status}
                          </span>
                       </div>
                       <div className="p-4 flex-1 space-y-3">
                          <div className="flex justify-between items-start">
                             <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Entity</span>
                                <span className="text-[13px] font-bold text-gray-900">{tx.patient}</span>
                             </div>
                             <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Date</span>
                                <span className="text-[12px] font-medium text-gray-500">{tx.date}</span>
                             </div>
                          </div>

                          <div className="bg-gray-50 border border-gray-100 rounded-[8px] p-2.5 flex items-center justify-between mt-2">
                             <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Method</span>
                                <span className="text-[12px] font-bold text-gray-900 capitalize">{tx.method}</span>
                             </div>
                             <div className="flex flex-col items-end">
                                <span className={`text-[16px] font-bold ${tx.type === 'income' ? 'text-gray-900' : 'text-gray-500'}`}>
                                   {tx.type === 'income' ? '+' : ''}€{Math.abs(tx.amount).toFixed(2)}
                                </span>
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           ) : (
              <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 rounded-[12px] shadow-sm w-full">
                 <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                 <p className="text-[13px] font-bold text-gray-900">No transactions found.</p>
                 <p className="text-[12px] mt-1 text-gray-500">Try adjusting your filters or search term.</p>
              </div>
           )}
        </div>

      </div>
    </div>
  );
}
