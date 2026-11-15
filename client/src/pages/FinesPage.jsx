import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calculator, CheckCircle, ShieldAlert } from 'lucide-react';
import { finesApi } from '../api/endpoints';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function FinesPage() {
  const isAdmin = JSON.parse(localStorage.getItem('user') || 'null')?.designation === 'Admin';
  const queryClient = useQueryClient();
  const [calcDate, setCalcDate] = useState('');
  const [waiveModal, setWaiveModal] = useState({ open: false, fineId: null });
  const [waiveReason, setWaiveReason] = useState('');

  const { data: finesData, isLoading } = useQuery({
    queryKey: ['fines'],
    queryFn: () => finesApi.list()
  });

  const calcMutation = useMutation({
    mutationFn: () => finesApi.calculate(calcDate || undefined, 2),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      alert('Stored procedure sp_calculate_fines executed successfully!');
    },
    onError: (err) => alert(err.message)
  });

  const payMutation = useMutation({
    mutationFn: (id) => finesApi.pay(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      alert('Fine marked as Paid in PostgreSQL!');
    },
    onError: (err) => alert(err.message)
  });

  const waiveMutation = useMutation({
    mutationFn: ({ id, reason }) => finesApi.waive(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      setWaiveModal({ open: false, fineId: null });
      setWaiveReason('');
      alert('Fine waived by Administrator.');
    },
    onError: (err) => alert(err.message)
  });

  const fines = finesData?.data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Fines & Penalties</h2>
          <p className="text-sm text-slate-500">Assess overdue fines and record payments. Fine waivers are restricted to Administrators.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={calcDate}
            onChange={(e) => setCalcDate(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm bg-white"
          />
          <button
            onClick={() => calcMutation.mutate()}
            disabled={calcMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Calculator className="w-4 h-4" />
            {calcMutation.isPending ? 'Calculating...' : 'Run sp_calculate_fines'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <th className="p-4">Fine ID</th>
              <th className="p-4">Member</th>
              <th className="p-4">Book</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Reason</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan="7" className="p-6 text-center text-slate-400">Loading fine records...</td></tr>
            ) : fines.length === 0 ? (
              <tr><td colSpan="7" className="p-6 text-center text-slate-400">No fines currently recorded.</td></tr>
            ) : fines.map((f) => (
              <tr key={f.fineId} className="hover:bg-slate-50">
                <td className="p-4 font-mono font-medium">#{f.fineId}</td>
                <td className="p-4">
                  <p className="font-semibold text-slate-900">{f.member?.fullName}</p>
                  <p className="text-xs text-slate-500">ID: {f.memberId}</p>
                </td>
                <td className="p-4 text-slate-700">{f.txn?.book?.title || `Txn #${f.txnId}`}</td>
                <td className="p-4 font-bold text-slate-900">Rs. {Number(f.fineAmount).toFixed(2)}</td>
                <td className="p-4">
                  <Badge variant={f.paidStatus === 'Paid' ? 'success' : f.paidStatus === 'Waived' ? 'info' : 'danger'}>
                    {f.paidStatus}
                  </Badge>
                </td>
                <td className="p-4 text-xs text-slate-600 max-w-xs truncate">{f.reason}</td>
                <td className="p-4 text-right space-x-2">
                  {f.paidStatus === 'Unpaid' && (
                    <>
                      <button
                        onClick={() => payMutation.mutate(f.fineId)}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-medium"
                      >
                        Record Payment
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setWaiveModal({ open: true, fineId: f.fineId })}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-medium"
                        >
                          Waive fine
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && <Modal isOpen={waiveModal.open} onClose={() => setWaiveModal({ open: false, fineId: null })} title="Waive Fine (Admin Only)">
        <form onSubmit={(e) => { e.preventDefault(); waiveMutation.mutate({ id: waiveModal.fineId, reason: waiveReason }); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Reason for Administrative Waiver</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Verified university campus closure or medical excuse..."
              value={waiveReason}
              onChange={(e) => setWaiveReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setWaiveModal({ open: false, fineId: null })} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium">Confirm Waiver</button>
          </div>
        </form>
      </Modal>}
    </div>
  );
}
