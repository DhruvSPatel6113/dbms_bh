import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Users, Clock, Flame } from 'lucide-react';
import { reportsApi } from '../api/endpoints';

export default function ReportsPage() {
  const isAdmin = JSON.parse(localStorage.getItem('user') || 'null')?.designation === 'Admin';
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [financePeriod, setFinancePeriod] = useState(() => new Date().toISOString().substring(0, 7));
  const [financeYear, financeMonth] = financePeriod.split('-').map(Number);

  const { data: defaultersData, refetch: refetchDefaulters } = useQuery({
    queryKey: ['reportDefaulters', asOfDate],
    queryFn: () => reportsApi.defaulters(asOfDate)
  });

  const { data: expiriesData } = useQuery({
    queryKey: ['reportExpiries', asOfDate],
    queryFn: () => reportsApi.expiries(60, asOfDate)
  });

  const { data: circulationData } = useQuery({
    queryKey: ['reportCirculation'],
    queryFn: () => reportsApi.circulation()
  });

  const { data: popularData } = useQuery({
    queryKey: ['reportPopular'],
    queryFn: () => reportsApi.popular(5)
  });

  const { data: financialData, isLoading: financialLoading, error: financialError } = useQuery({
    queryKey: ['reportFinancial', financeYear, financeMonth],
    queryFn: () => reportsApi.financial(financeYear, financeMonth),
    enabled: isAdmin
  });

  const defaulters = defaultersData?.data || [];
  const expiries = expiriesData?.data || [];
  const circulation = circulationData?.data || { issuedCount: 0, returnedCount: 0, period: '' };
  const popular = popularData?.data || [];
  const financial = financialData?.data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
          <p className="text-sm text-slate-500">Cursor-driven batch database snapshots and circulation metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Report As Of:</label>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm bg-white"
          />
        </div>
      </div>

      {isAdmin && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Financial report</h3>
              <p className="text-xs text-slate-500">Recorded membership receipts and fines actually paid. No unrecorded or unpaid amounts are counted.</p>
            </div>
            <label className="text-xs font-semibold text-slate-600">
              Reporting month
              <input type="month" value={financePeriod} onChange={(event) => { if (event.target.value) setFinancePeriod(event.target.value); }} className="ml-2 rounded-lg border px-3 py-1.5 text-sm" />
            </label>
          </div>
          {financialError && <p role="alert" className="text-sm text-rose-700">{financialError.message}</p>}
          {financialLoading ? <p className="text-sm text-slate-500">Loading financial totals…</p> : financial && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-indigo-50 p-4"><p className="text-xs text-indigo-700">Membership receipts</p><p className="mt-1 text-xl font-bold text-indigo-950">Rs. {Number(financial.membershipRevenue).toFixed(2)}</p><p className="text-xs text-indigo-700">{financial.membershipPaymentCount} payments</p></div>
              <div className="rounded-lg bg-emerald-50 p-4"><p className="text-xs text-emerald-700">Paid fines</p><p className="mt-1 text-xl font-bold text-emerald-950">Rs. {Number(financial.fineRevenue).toFixed(2)}</p><p className="text-xs text-emerald-700">{financial.paidFineCount} payments</p></div>
              <div className="rounded-lg bg-slate-100 p-4"><p className="text-xs text-slate-600">Total collected ({financial.period})</p><p className="mt-1 text-xl font-bold text-slate-950">Rs. {Number(financial.totalRevenue).toFixed(2)}</p><p className="text-xs text-slate-600">Membership receipts + paid fines</p></div>
            </div>
          )}
        </section>
      )}

      {/* Circulation KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Monthly Issues ({circulation.period})</p>
            <h3 className="text-2xl font-bold text-slate-900">{circulation.issuedCount} Books</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Monthly Returns</p>
            <h3 className="text-2xl font-bold text-slate-900">{circulation.returnedCount} Books</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Defaulters Snapshot</p>
            <h3 className="text-2xl font-bold text-slate-900">{defaulters.length} Members</h3>
          </div>
        </div>
      </div>

      {/* Grid: Defaulters & Expiries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Defaulters Report Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-900 text-sm">Defaulters Summary (sp_generate_defaulter_report)</h3>
            <span className="text-xs text-slate-500">Cursor Generated</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 uppercase">
                <th className="p-3">Member</th>
                <th className="p-3">Overdue Books</th>
                <th className="p-3 text-right">Accumulated Fine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {defaulters.length === 0 ? (
                <tr><td colSpan="3" className="p-6 text-center text-slate-400">Zero defaulters as of this date.</td></tr>
              ) : defaulters.map((d) => (
                <tr key={d.memberId} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-900">{d.fullName}</td>
                  <td className="p-3">{d.overdueBooks}</td>
                  <td className="p-3 text-right font-bold text-rose-600">Rs. {Number(d.totalFine).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expiring Licenses & Memberships Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-900 text-sm">Expiring Within 60 Days (sp_expiry_report)</h3>
            <span className="text-xs text-slate-500">Cursor Generated</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 uppercase">
                <th className="p-3">Type</th>
                <th className="p-3">Entity Name</th>
                <th className="p-3">Days Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expiries.length === 0 ? (
                <tr><td colSpan="3" className="p-6 text-center text-slate-400">No expiring packages or renewals found.</td></tr>
              ) : expiries.map((e, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-600">{e.itemType}</td>
                  <td className="p-3 font-medium text-slate-900">{e.itemName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-medium ${e.daysRemaining <= 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                      {e.daysRemaining <= 0 ? 'Expired' : `${e.daysRemaining} days`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Most Popular Books Leaderboard */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-orange-600 font-semibold">
          <Flame className="w-5 h-5" />
          <h3>Most Popular Titles (Circulation Velocity)</h3>
        </div>
        <div className="space-y-3">
          {popular.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{item.book?.title}</h4>
                  <p className="text-xs text-slate-500">{item.book?.author} - {item.book?.category}</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                {item.borrowCount} Loans
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
