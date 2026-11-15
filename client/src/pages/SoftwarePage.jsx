import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Monitor, AlertTriangle, Trash2 } from 'lucide-react';
import { softwareApi, dealersApi } from '../api/endpoints';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function SoftwarePage() {
  const isAdmin = JSON.parse(localStorage.getItem('user') || 'null')?.designation === 'Admin';
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    softwareName: '',
    version: '1.0',
    licenseType: 'Campus Subscription',
    totalLicense: 50,
    dealerId: 1,
    expiryDate: '2027-01-01'
  });

  const { data: softwareList, isLoading } = useQuery({
    queryKey: ['software'],
    queryFn: () => softwareApi.list()
  });

  const { data: expiringList } = useQuery({
    queryKey: ['softwareExpiring'],
    queryFn: () => softwareApi.getExpiring(30)
  });

  const { data: dealersList } = useQuery({
    queryKey: ['dealers'],
    queryFn: () => dealersApi.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => softwareApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['software'] });
      queryClient.invalidateQueries({ queryKey: ['softwareExpiring'] });
      setIsModalOpen(false);
    },
    onError: (err) => alert(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => softwareApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['software'] });
      queryClient.invalidateQueries({ queryKey: ['softwareExpiring'] });
    },
    onError: (err) => alert(err.message)
  });

  const software = softwareList?.data || [];
  const expiring = expiringList?.data || [];
  const dealers = dealersList?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Software Licenses</h2>
          <p className="text-sm text-slate-500">Track vendor subscriptions, seat allocations, and renewal alerts</p>
        </div>
        {isAdmin && <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Software License
        </button>}
      </div>

      {/* Expiring Soon Banner */}
      {expiring.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">Licenses Expiring Within 30 Days ({expiring.length})</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Contact suppliers immediately to renew before access lapses: {expiring.map(e => `${e.softwareName} (${e.daysUntilExpiry} days)`).join(', ')}.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <th className="p-4">Software Name & Version</th>
              <th className="p-4">License Type</th>
              <th className="p-4">Total Seats</th>
              <th className="p-4">Supplier</th>
              <th className="p-4">Expiry Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan="7" className="p-6 text-center text-slate-400">Loading licenses...</td></tr>
            ) : software.map((s) => (
              <tr key={s.softwareId} className="hover:bg-slate-50">
                <td className="p-4">
                  <p className="font-semibold text-slate-900">{s.softwareName}</p>
                  <p className="text-xs text-slate-400">Version {s.version}</p>
                </td>
                <td className="p-4 text-slate-700">{s.licenseType}</td>
                <td className="p-4 font-mono font-medium">{s.totalLicense} Seats</td>
                <td className="p-4 text-slate-600">{s.dealer?.companyName || `Dealer #${s.dealerId}`}</td>
                <td className="p-4 font-mono text-xs">{new Date(s.expiryDate).toLocaleDateString()}</td>
                <td className="p-4">
                  <Badge variant={s.calculatedStatus === 'Active' ? 'success' : s.calculatedStatus === 'ExpiringSoon' ? 'warning' : 'danger'}>
                    {s.calculatedStatus}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  {isAdmin && <button
                    onClick={() => { if (confirm(`Remove software license ${s.softwareName}?`)) deleteMutation.mutate(s.softwareId); }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Software Package">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Software Name</label>
            <input type="text" required value={formData.softwareName} onChange={(e) => setFormData({ ...formData, softwareName: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Version</label>
              <input type="text" required value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Total License Seats</label>
              <input type="number" min="1" max="2147483647" step="1" required value={formData.totalLicense} onChange={(e) => setFormData({ ...formData, totalLicense: Number(e.target.value) })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">License Type</label>
            <input type="text" required value={formData.licenseType} onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Dealer / Supplier</label>
            <select value={formData.dealerId} onChange={(e) => setFormData({ ...formData, dealerId: Number(e.target.value) })} className="w-full px-3 py-1.5 border rounded-md text-sm">
              {dealers.map(d => (
                <option key={d.dealerId} value={d.dealerId}>{d.companyName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Expiration Date</label>
            <input type="date" required value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium">Save</button>
          </div>
        </form>
      </Modal>}
    </div>
  );
}
