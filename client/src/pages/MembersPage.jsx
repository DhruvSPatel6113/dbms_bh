import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import { membersApi } from '../api/endpoints';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

const blankMember = { fullName: '', email: '', phone: '', membershipType: 'Student', status: 'Active', paymentAmount: '0' };

export default function MembersPage() {
  const queryClient = useQueryClient();
  const isAdmin = JSON.parse(localStorage.getItem('user') || 'null')?.designation === 'Admin';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [renewingMember, setRenewingMember] = useState(null);
  const [formData, setFormData] = useState(blankMember);
  const [renewalPayment, setRenewalPayment] = useState('0');

  const { data: membersData, isLoading, error } = useQuery({
    queryKey: ['members', search, page],
    queryFn: () => membersApi.list({ q: search || undefined, page, limit: 20 })
  });
  const refreshMembers = () => queryClient.invalidateQueries({ queryKey: ['members'] });

  const createMutation = useMutation({
    mutationFn: membersApi.create,
    onSuccess: () => { refreshMembers(); setModalOpen(false); setFormData(blankMember); },
    onError: (err) => alert(err.message)
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => membersApi.update(id, data),
    onSuccess: () => { refreshMembers(); setModalOpen(false); setEditingMember(null); },
    onError: (err) => alert(err.message)
  });
  const renewMutation = useMutation({
    mutationFn: ({ id, paymentAmount }) => membersApi.renew(id, { paymentAmount: Number(paymentAmount) }),
    onSuccess: () => { refreshMembers(); setRenewingMember(null); setRenewalPayment('0'); },
    onError: (err) => alert(err.message)
  });
  const deleteMutation = useMutation({
    mutationFn: membersApi.delete,
    onSuccess: refreshMembers,
    onError: (err) => alert(err.message)
  });

  const items = membersData?.data?.items || [];
  const pagination = membersData?.data?.pagination;
  const openCreate = () => {
    setEditingMember(null);
    setFormData(blankMember);
    setModalOpen(true);
  };
  const openEdit = (member) => {
    setEditingMember(member);
    setFormData({
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      membershipType: member.membershipType,
      status: member.status,
      paymentAmount: '0'
    });
    setModalOpen(true);
  };
  const saveMember = (event) => {
    event.preventDefault();
    if (editingMember) {
      updateMutation.mutate({
        id: editingMember.memberId,
        data: { fullName: formData.fullName, email: formData.email, phone: formData.phone, membershipType: formData.membershipType, status: formData.status }
      });
    } else {
      createMutation.mutate({ ...formData, paymentAmount: Number(formData.paymentAmount) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Member Directory</h2>
          <p className="text-sm text-slate-500">Search, update contact and membership details, and record renewals.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Register member
        </button>
      </div>

      <label className="relative block max-w-lg">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name, email, or phone…" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
      </label>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error.message}</p>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <th className="p-4">Member</th><th className="p-4">Contact</th><th className="p-4">Membership</th><th className="p-4">Status</th><th className="p-4">Renewal date</th><th className="p-4 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading directory…</td></tr>
                : items.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-slate-400">No matching members found.</td></tr>
                  : items.map((member) => <tr key={member.memberId} className="hover:bg-slate-50">
                    <td className="p-4"><p className="font-semibold text-slate-900">{member.fullName}</p><p className="text-xs text-slate-500">Member #{member.memberId}</p></td>
                    <td className="p-4 text-xs text-slate-600"><div className="flex items-center gap-1"><Mail className="h-3 w-3" />{member.email}</div><div className="mt-1 flex items-center gap-1"><Phone className="h-3 w-3" />{member.phone}</div></td>
                    <td className="p-4"><Badge variant={member.membershipType === 'Premium' ? 'info' : 'default'}>{member.membershipType}</Badge></td>
                    <td className="p-4"><Badge variant={member.status === 'Active' ? 'success' : member.status === 'Suspended' ? 'danger' : 'warning'}>{member.status}</Badge></td>
                    <td className="p-4 font-mono text-xs">{new Date(member.renewDate).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(member)} className="rounded-md border px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"><Pencil className="mr-1 inline h-3.5 w-3.5" />Edit</button>
                        <button onClick={() => { setRenewingMember(member); setRenewalPayment('0'); }} className="rounded-md border border-indigo-200 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50">Renew membership</button>
                        {isAdmin && <button aria-label={`Delete ${member.fullName}`} onClick={() => { if (confirm(`Delete member ${member.fullName}?`)) deleteMutation.mutate(member.memberId); }} className="rounded-md border border-rose-200 px-2 py-1.5 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
          <span className="text-slate-500">Page {pagination.page} of {pagination.totalPages} · {pagination.total} members</span>
          <div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Previous</button><button disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button></div>
        </div>}
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingMember(null); }} title={editingMember ? 'Edit member details' : 'Register member'}>
        <form onSubmit={saveMember} className="space-y-4">
          <label className="block text-xs font-semibold text-slate-700">Full name<input required value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label>
          <label className="block text-xs font-semibold text-slate-700">Email address<input required type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label>
          <label className="block text-xs font-semibold text-slate-700">Phone<input required minLength="5" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label>
          <label className="block text-xs font-semibold text-slate-700">Membership tier<select value={formData.membershipType} onChange={(event) => setFormData({ ...formData, membershipType: event.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm"><option>Student</option><option>Regular</option><option>Premium</option></select></label>
          {editingMember && <label className="block text-xs font-semibold text-slate-700">Member status<select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm"><option>Active</option><option>Suspended</option><option>Expired</option></select></label>}
          {!editingMember && <label className="block text-xs font-semibold text-slate-700">Membership payment collected now (Rs.; optional)<input type="number" min="0" max="99999999.99" step="0.01" value={formData.paymentAmount} onChange={(event) => setFormData({ ...formData, paymentAmount: event.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /><span className="mt-1 block font-normal text-slate-500">No fee is assumed; enter only the amount actually collected.</span></label>}
          <div className="flex justify-end gap-2 border-t pt-3"><button type="button" onClick={() => { setModalOpen(false); setEditingMember(null); }} className="rounded-md border px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{editingMember ? 'Save changes' : 'Register member'}</button></div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(renewingMember)} onClose={() => setRenewingMember(null)} title="Renew membership">
        <form onSubmit={(event) => { event.preventDefault(); renewMutation.mutate({ id: renewingMember.memberId, paymentAmount: renewalPayment }); }} className="space-y-4">
          <p className="text-sm text-slate-600">Extend <strong>{renewingMember?.fullName}</strong> by one year. Enter a payment only if money is collected now.</p>
          <label className="block text-xs font-semibold text-slate-700">Amount collected (Rs.; optional)<input type="number" min="0" max="99999999.99" step="0.01" value={renewalPayment} onChange={(event) => setRenewalPayment(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label>
          <div className="flex justify-end gap-2 border-t pt-3"><button type="button" onClick={() => setRenewingMember(null)} className="rounded-md border px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={renewMutation.isPending} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Confirm renewal</button></div>
        </form>
      </Modal>
    </div>
  );
}
