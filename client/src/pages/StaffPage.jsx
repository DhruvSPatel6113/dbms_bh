import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield, Clock, Trash2 } from 'lucide-react';
import { staffApi } from '../api/endpoints';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [shiftFilter, setShiftFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    staffName: '',
    email: '',
    phoneNo: '',
    address: '',
    shift: 'Morning',
    dateOfJoining: '2022-01-01',
    qualification: 'Bachelor of Library Science',
    designation: 'Librarian'
  });

  const { data: staffList, isLoading } = useQuery({
    queryKey: ['staff', shiftFilter],
    queryFn: () => staffApi.list(shiftFilter ? { shift: shiftFilter } : undefined)
  });

  const createMutation = useMutation({
    mutationFn: (data) => staffApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsModalOpen(false);
    },
    onError: (err) => alert(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => staffApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
    onError: (err) => alert(err.message)
  });

  const staff = staffList?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Staff & Duty Rosters</h2>
          <p className="text-sm text-slate-500">Manage librarians, administrators, and shift assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All Shifts</option>
            <option value="Morning">Morning Shift</option>
            <option value="Evening">Evening Shift</option>
            <option value="Night">Night Shift</option>
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <th className="p-4">Name & Designation</th>
              <th className="p-4">Shift</th>
              <th className="p-4">Email & Phone</th>
              <th className="p-4">Qualification</th>
              <th className="p-4">Date Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan="6" className="p-6 text-center text-slate-400">Loading staff...</td></tr>
            ) : staff.map((s) => (
              <tr key={s.staffId} className="hover:bg-slate-50">
                <td className="p-4">
                  <p className="font-semibold text-slate-900">{s.staffName}</p>
                  <p className="text-xs text-indigo-600 font-medium">{s.designation}</p>
                </td>
                <td className="p-4">
                  <Badge variant={s.shift === 'Morning' ? 'info' : s.shift === 'Evening' ? 'warning' : 'default'}>
                    <Clock className="w-3 h-3 mr-1" />
                    {s.shift}
                  </Badge>
                </td>
                <td className="p-4 text-xs text-slate-600">
                  <p>{s.email}</p>
                  <p className="text-slate-400">{s.phoneNo}</p>
                </td>
                <td className="p-4 text-slate-700">{s.qualification}</td>
                <td className="p-4 font-mono text-xs">{new Date(s.dateOfJoining).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => { if (confirm(`Remove staff ${s.staffName}?`)) deleteMutation.mutate(s.staffId); }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Staff Member">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Full Name</label>
            <input type="text" required value={formData.staffName} onChange={(e) => setFormData({ ...formData, staffName: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Phone</label>
              <input type="text" required value={formData.phoneNo} onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Shift</label>
              <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm">
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Designation</label>
              <select value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm">
                <option value="Librarian">Librarian</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Date of Joining</label>
              <input type="date" required value={formData.dateOfJoining} onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Qualification</label>
            <input type="text" required value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
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
      </Modal>
    </div>
  );
}
