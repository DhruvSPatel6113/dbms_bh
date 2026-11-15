import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Truck, Mail, Phone, Trash2 } from 'lucide-react';
import { dealersApi } from '../api/endpoints';
import Modal from '../components/Modal';

export default function DealersPage() {
  const isAdmin = JSON.parse(localStorage.getItem('user') || 'null')?.designation === 'Admin';
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    contactNum: '',
    email: '',
    address: ''
  });

  const { data: dealersList, isLoading } = useQuery({
    queryKey: ['dealers'],
    queryFn: () => dealersApi.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => dealersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      setIsModalOpen(false);
    },
    onError: (err) => alert(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => dealersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dealers'] }),
    onError: (err) => alert(err.message)
  });

  const dealers = dealersList?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dealers & Vendors</h2>
          <p className="text-sm text-slate-500">Suppliers of software, library systems, and electronic database licenses</p>
        </div>
        {isAdmin && <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Dealer
        </button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-slate-400">Loading vendor records...</p>
        ) : dealers.map((d) => (
          <div key={d.dealerId} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Truck className="w-5 h-5" />
                </span>
                {isAdmin && <button
                  onClick={() => { if (confirm(`Delete dealer ${d.companyName}?`)) deleteMutation.mutate(d.dealerId); }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>}
              </div>
              <h3 className="font-semibold text-lg text-slate-900">{d.companyName}</h3>
              <p className="text-xs text-slate-500 mb-4">Contact: {d.contactPerson}</p>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {d.email}</div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {d.contactNum}</div>
                <p className="text-slate-500 mt-2 italic">{d.address}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
              <span>Software Packages:</span>
              <span className="font-semibold text-slate-700">{d.software?.length || 0} active</span>
            </div>
          </div>
        ))}
      </div>

      {isAdmin && <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Software Dealer">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Company Name</label>
            <input type="text" required value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Contact Person</label>
            <input type="text" required value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Phone</label>
              <input type="text" required value={formData.contactNum} onChange={(e) => setFormData({ ...formData, contactNum: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Address</label>
            <input type="text" required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
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
