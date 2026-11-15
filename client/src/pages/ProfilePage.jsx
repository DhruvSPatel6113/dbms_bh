import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, BadgeCheck, BriefcaseBusiness, Check, KeyRound, Mail, MapPin,
  Pencil, Phone, Save, ShieldCheck, UserRound, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/endpoints';

const emptyProfile = { staffName: '', email: '', phoneNo: '', address: '', shift: '', qualification: '', designation: '' };

function ProfileField({ label, name, value, onChange, icon: Icon, disabled = false, ...props }) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <span className="relative block">
        {Icon && <Icon aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input
          className={`input-field ${Icon ? 'pl-10' : ''} ${disabled ? 'bg-slate-50 text-slate-500' : ''}`}
          name={name}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
      </span>
    </label>
  );
}

export default function ProfilePage({ user, onUserUpdate }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyProfile);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notice, setNotice] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-profile'],
    queryFn: authApi.profile
  });
  const profile = data?.data || user || emptyProfile;

  useEffect(() => {
    setForm({
      staffName: profile.name || profile.staffName || '',
      email: profile.email || '',
      phoneNo: profile.phoneNo || '',
      address: profile.address || '',
      shift: profile.shift || 'Morning',
      qualification: profile.qualification || '',
      designation: profile.designation || ''
    });
  }, [profile.name, profile.staffName, profile.email, profile.phoneNo, profile.address, profile.shift, profile.qualification, profile.designation]);

  const updateMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (result) => {
      const updatedProfile = result.data;
      onUserUpdate(updatedProfile);
      queryClient.setQueryData(['my-profile'], result);
      setCurrentPassword('');
      setNewPassword('');
      setEditing(false);
      setNotice({ type: 'success', text: 'Your profile has been updated.' });
    },
    onError: (requestError) => setNotice({ type: 'error', text: requestError.message || 'Could not update your profile.' })
  });

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const cancelEdit = () => {
    setEditing(false);
    setCurrentPassword('');
    setNewPassword('');
    setNotice(null);
  };

  const submit = (event) => {
    event.preventDefault();
    setNotice(null);
    const payload = {
      staffName: form.staffName,
      phoneNo: form.phoneNo,
      address: form.address,
    };
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }
    updateMutation.mutate(payload);
  };

  const displayName = profile.name || profile.staffName || 'Staff member';
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  if (isLoading) {
    return <div className="surface-card p-8 text-sm text-slate-500">Loading your profile…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/books" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-brand-600">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to workspace
          </Link>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Your profile</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your staff details and sign-in security.</p>
        </div>
        {!editing && (
          <button onClick={() => { setEditing(true); setNotice(null); }} className="primary-button">
            <Pencil className="h-4 w-4" /> Edit profile
          </button>
        )}
      </div>

      {notice && (
        <div role={notice.type === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${
          notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>{notice.text}</div>
      )}
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error.message}</div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        <div className="relative overflow-hidden bg-[#17243a] px-6 py-7 sm:px-9 sm:py-9">
          <div className="absolute -right-10 -top-32 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-2 -top-20 h-52 w-52 rounded-full border border-white/10" />
          <div className="relative flex flex-wrap items-center gap-5">
            <span className="flex h-[76px] w-[76px] items-center justify-center rounded-[24px] bg-indigo-200 text-2xl font-extrabold text-brand-700 ring-4 ring-white/10">{initials}</span>
            <div className="min-w-0 flex-1 text-white">
              <p className="font-display truncate text-2xl font-extrabold tracking-tight">{displayName}</p>
              <p className="mt-1 truncate text-sm text-slate-300">{profile.email}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-indigo-100">
              <BadgeCheck className="h-4 w-4" /> {profile.designation || 'Librarian'}
            </span>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="grid gap-x-8 gap-y-5 px-6 py-7 sm:grid-cols-2 sm:px-9">
            <ProfileField label="Full name" name="staffName" value={form.staffName} onChange={updateField} icon={UserRound} disabled={!editing} required />
            <ProfileField label="Email address" name="email" value={form.email} icon={Mail} disabled readOnly />
            <ProfileField label="Phone number" name="phoneNo" value={form.phoneNo} onChange={updateField} icon={Phone} disabled={!editing} required minLength={5} />
            <label>
              <span className="field-label">Shift</span>
              <select className="input-field bg-slate-50 text-slate-500" name="shift" value={form.shift} disabled>
                <option>Morning</option><option>Evening</option><option>Night</option>
              </select>
            </label>
            <ProfileField label="Address" name="address" value={form.address} onChange={updateField} icon={MapPin} disabled={!editing} required />
            <ProfileField label="Qualification" name="qualification" value={form.qualification} icon={BriefcaseBusiness} disabled readOnly />
            <div className="sm:col-span-2">
              <span className="field-label">Account access</span>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <ShieldCheck className="h-5 w-5 text-brand-600" />
                <div><p className="text-sm font-bold text-slate-700">{profile.designation || 'Librarian'}</p><p className="text-xs text-slate-500">Contact an administrator if your access level needs to change.</p></div>
              </div>
            </div>
          </div>

          {editing && (
            <>
              <div className="mx-6 border-t border-slate-100 sm:mx-9" />
              <div className="px-6 py-6 sm:px-9">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><KeyRound className="h-4 w-4" /></span>
                  <div><h3 className="text-sm font-bold text-slate-800">Change password <span className="font-medium text-slate-400">(optional)</span></h3><p className="mt-1 text-xs text-slate-500">Leave these fields blank to keep your current password.</p></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField label="Current password" name="currentPassword" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" />
                  <ProfileField label="New password" name="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={10} autoComplete="new-password" />
                </div>
                {newPassword && <p className="mt-2 text-xs text-slate-500">Use at least 10 characters.</p>}
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end sm:px-9">
                <button type="button" onClick={cancelEdit} className="secondary-button"><X className="h-4 w-4" /> Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="primary-button"><Save className="h-4 w-4" /> {updateMutation.isPending ? 'Saving…' : 'Save changes'}</button>
              </div>
            </>
          )}
        </form>
      </section>

      {!editing && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm"><Check className="h-4 w-4" /></span>
          <p className="text-sm text-emerald-800"><span className="font-bold">Your account is secure.</span> Your password is stored as a one-way hash.</p>
        </div>
      )}
    </div>
  );
}
