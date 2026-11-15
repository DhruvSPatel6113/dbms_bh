import React, { useState } from 'react';
import {
  ArrowRight, BookOpen, Check, Eye, EyeOff, KeyRound, LibraryBig, Mail,
  MapPin, Phone, ShieldCheck, Sparkles, UserRound
} from 'lucide-react';
import { authApi } from '../api/endpoints';

const initialSignup = {
  staffName: '',
  email: '',
  phoneNo: '',
  address: '',
  shift: 'Morning',
  qualification: '',
  password: '',
  confirmPassword: ''
};

function Field({ label, icon: Icon, className = '', ...props }) {
  return (
    <label className={className}>
      <span className="field-label">{label}</span>
      <span className="relative block">
        {Icon && <Icon aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input className={`input-field ${Icon ? 'pl-10' : ''}`} {...props} />
      </span>
    </label>
  );
}

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [values, setValues] = useState(initialSignup);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignup = mode === 'signup';

  const update = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    setError('');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setShowPassword(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (isSignup && values.password !== values.confirmPassword) {
      setError('Those passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const result = isSignup
        ? await authApi.signup({
          staffName: values.staffName,
          email: values.email,
          phoneNo: values.phoneNo,
          address: values.address,
          shift: values.shift,
          qualification: values.qualification,
          password: values.password
        })
        : await authApi.login(login.email, login.password);
      onLogin(result.token, result.user);
    } catch (requestError) {
      setError(requestError.message || (isSignup ? 'Could not create your account' : 'Could not sign in'));
    } finally {
      setLoading(false);
    }
  };

  const passwordInput = (value, onChange, label) => (
    <label>
      <span className="field-label">{label}</span>
      <span className="relative block">
        <KeyRound aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          minLength={isSignup ? 10 : 6}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          className="input-field pl-10 pr-11"
          placeholder={isSignup ? 'At least 10 characters' : 'Enter your password'}
        />
        <button
          type="button"
          onClick={() => setShowPassword((shown) => !shown)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );

  return (
    <main className="auth-page min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto grid min-h-[min(820px,calc(100vh-3rem))] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-float lg:grid-cols-[0.94fr_1.06fr]">
        <aside className="auth-showcase relative hidden flex-col justify-between overflow-hidden bg-[#17243a] p-10 text-white lg:flex xl:p-14">
          <div className="absolute -right-32 -top-20 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute -right-16 top-0 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-48 -left-20 h-[30rem] w-[30rem] rounded-full bg-brand-600/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <BookOpen className="h-5 w-5 text-indigo-200" />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold tracking-tight">Stacks</p>
                <p className="text-xs text-slate-400">Library workspace</p>
              </div>
            </div>
            <div className="mt-24 max-w-md">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-indigo-100">
                <Sparkles className="h-3.5 w-3.5" /> Your library, in one place
              </span>
              <h1 className="font-display text-4xl font-extrabold leading-[1.13] tracking-tight xl:text-5xl">
                Make room for <span className="text-indigo-300">better</span> library days.
              </h1>
              <p className="mt-5 max-w-sm text-base leading-7 text-slate-300">
                A calmer way to manage your collection, keep circulation moving, and look after your members.
              </p>
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-3">
            {[
              ['01', 'Catalog & inventory'],
              ['02', 'Loans & returns'],
              ['03', 'Members & fines'],
              ['04', 'Reports & insights']
            ].map(([number, label]) => (
              <div key={number} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <span className="text-xs font-bold tracking-wider text-indigo-300">{number}</span>
                <span className="text-sm font-medium text-slate-200">{label}</span>
              </div>
            ))}
            <p className="col-span-2 mt-4 text-xs text-slate-500">A thoughtful workspace for the people who keep knowledge in motion.</p>
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <LibraryBig className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold">Stacks</p>
                <p className="text-xs text-slate-500">Library workspace</p>
              </div>
            </div>
            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
                {isSignup ? 'Join your library team' : 'Welcome back'}
              </p>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink">
                {isSignup ? 'Create your account' : 'Sign in to Stacks'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isSignup ? 'Set up your staff profile to get started.' : 'Enter your staff credentials to continue.'}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${!isSignup ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${isSignup ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Create account
              </button>
            </div>

            {error && (
              <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup ? (
                <>
                  <Field label="Full name" icon={UserRound} value={values.staffName} onChange={update('staffName')} required autoComplete="name" placeholder="Your name" />
                  <Field label="Work email" icon={Mail} type="email" value={values.email} onChange={update('email')} required autoComplete="email" placeholder="you@library.org" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Phone" icon={Phone} type="tel" value={values.phoneNo} onChange={update('phoneNo')} required autoComplete="tel" placeholder="Phone number" />
                    <label>
                      <span className="field-label">Shift</span>
                      <select className="input-field" value={values.shift} onChange={update('shift')}>
                        <option>Morning</option><option>Evening</option><option>Night</option>
                      </select>
                    </label>
                  </div>
                  <Field label="Address" icon={MapPin} value={values.address} onChange={update('address')} required autoComplete="street-address" placeholder="Street, city" />
                  <Field label="Qualification" value={values.qualification} onChange={update('qualification')} required placeholder="e.g. Library science" />
                  {passwordInput(values.password, update('password'), 'Create password')}
                  {passwordInput(values.confirmPassword, update('confirmPassword'), 'Confirm password')}
                  <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-3 text-xs leading-5 text-brand-700">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    New accounts are created with librarian access. An administrator can update staff permissions.
                  </div>
                </>
              ) : (
                <>
                  <Field
                    label="Email address"
                    icon={Mail}
                    type="email"
                    value={login.email}
                    onChange={(event) => { setLogin((current) => ({ ...current, email: event.target.value })); setError(''); }}
                    required
                    autoComplete="email"
                    placeholder="you@library.org"
                  />
                  {passwordInput(login.password, (event) => { setLogin((current) => ({ ...current, password: event.target.value })); setError(''); }, 'Password')}
                </>
              )}
              <button type="submit" disabled={loading} className="primary-button mt-2 w-full !py-3.5">
                {loading ? (isSignup ? 'Creating account…' : 'Signing you in…') : (
                  <>{isSignup ? 'Create account' : 'Sign in'} <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Secure staff access · Your account details stay private
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
