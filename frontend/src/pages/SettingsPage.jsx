import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import ChangePasswordForm from '../components/settings/ChangePasswordForm';

const initialSettings = {
  llm_provider: 'openai',
  llm_model: '',
  api_base_url: '',
  chunk_size: 1000,
  chunk_overlap: 200,
  top_k: 3,
  theme: 'system',
};

const SettingsPage = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [settings, setSettings] = useState(initialSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([authService.getProfile(), authService.getSettings()])
      .then(([profileData, settingsData]) => {
        if (!active) return;
        setProfile({ name: profileData.name || '', email: profileData.email || '' });
        setSettings({
          ...initialSettings,
          ...settingsData,
          llm_model: settingsData.llm_model || '',
          api_base_url: settingsData.api_base_url || '',
        });
        setUser(profileData);
      })
      .catch(() => {
        if (active) setError('Unable to load your settings. Please try again.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      root.classList.toggle(
        'dark',
        settings.theme === 'dark' || (settings.theme === 'system' && prefersDark.matches),
      );
    };

    applyTheme();
    localStorage.setItem('theme', settings.theme);
    if (settings.theme === 'system') {
      prefersDark.addEventListener('change', applyTheme);
      return () => prefersDark.removeEventListener('change', applyTheme);
    }
  }, [settings.theme]);

  const updateSetting = (event) => {
    const { name, value } = event.target;
    setSettings((current) => ({
      ...current,
      [name]: ['chunk_size', 'chunk_overlap', 'top_k'].includes(name) ? Number(value) : value,
    }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingSection('profile');
    setError('');
    setSuccess('');
    try {
      const updatedProfile = await authService.updateProfile(profile);
      setUser(updatedProfile);
      setSuccess('Profile settings saved.');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to save profile settings.');
    } finally {
      setSavingSection('');
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSavingSection('preferences');
    setError('');
    setSuccess('');
    try {
      const updatedSettings = await authService.updateSettings(settings);
      setSettings((current) => ({ ...current, ...updatedSettings }));
      setSuccess('Workspace settings saved.');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to save workspace settings.');
    } finally {
      setSavingSection('');
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        </div>
        <p className="text-slate-500">Manage your profile and document-query workspace.</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Profile</h2>
          <p className="mb-5 text-sm text-slate-500">Update the name and email shown on your account.</p>
          <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Name
              <input
                value={profile.name}
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={profile.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </label>
            <div className="sm:col-span-2">
              <SaveButton isSaving={savingSection === 'profile'} />
            </div>
          </form>
          <ChangePasswordForm
            onError={(message) => {
              setError(message);
              setSuccess('');
            }}
            onSuccess={(message) => {
              setSuccess(message);
              setError('');
            }}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">LLM provider</h2>
          <p className="mb-5 text-sm text-slate-500">Configure the provider values supported by your backend.</p>
          <form onSubmit={saveSettings} className="grid gap-4 sm:grid-cols-2">
            <Field label="Provider">
              <input
                name="llm_provider"
                value={settings.llm_provider}
                onChange={updateSetting}
                className={inputClass}
                placeholder="e.g. OpenAI, Ollama, or Anthropic"
              />
            </Field>
            <Field label="Model">
              <input name="llm_model" value={settings.llm_model} onChange={updateSetting} className={inputClass} placeholder="e.g. gpt-4o-mini" />
            </Field>
            <Field label="API base URL" wide>
              <input name="api_base_url" value={settings.api_base_url} onChange={updateSetting} className={inputClass} placeholder="https://api.example.com/v1" />
            </Field>
            <p className="sm:col-span-2 text-xs text-slate-400">
              API keys stay on the backend and are loaded from your server environment. They are never sent to the browser or stored in this form.
            </p>
            <div className="sm:col-span-2">
              <SaveButton isSaving={savingSection === 'preferences'} />
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Retrieval and appearance</h2>
          <p className="mb-5 text-sm text-slate-500">Control document chunking, retrieval depth, and your saved theme preference.</p>
          <form onSubmit={saveSettings} className="max-w-2xl space-y-5">
            <RangeField label="Chunk size" name="chunk_size" min="100" max="4000" step="100" value={settings.chunk_size} onChange={updateSetting} />
            <RangeField label="Chunk overlap" name="chunk_overlap" min="0" max="1000" step="50" value={settings.chunk_overlap} onChange={updateSetting} />
            <RangeField label="Results (top K)" name="top_k" min="1" max="50" step="1" value={settings.top_k} onChange={updateSetting} />
            <Field label="Theme">
              <select name="theme" value={settings.theme} onChange={updateSetting} className={inputClass}>
                <option value="system">System</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </Field>
            <div>
              <SaveButton isSaving={savingSection === 'preferences'} />
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};

const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

const Field = ({ label, children, wide = false }) => (
  <label className={`text-sm font-medium text-slate-700 ${wide ? 'sm:col-span-2' : ''}`}>
    {label}
    {children}
  </label>
);

const RangeField = ({ label, name, min, max, step, value, onChange }) => (
  <label className="text-sm font-medium text-slate-700">
    <span className="flex items-center justify-between">
      <span>{label}</span>
      <output className="font-semibold text-indigo-600">{value}</output>
    </span>
    <input
      type="range"
      name={name}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className="mt-3 h-2 w-full cursor-pointer accent-indigo-600"
    />
    <span className="mt-1 flex justify-between text-[11px] font-normal text-slate-400">
      <span>{min}</span>
      <span>{max}</span>
    </span>
  </label>
);

const SaveButton = ({ isSaving }) => (
  <button type="submit" disabled={isSaving} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
    {isSaving ? 'Saving...' : 'Save changes'}
  </button>
);

export default SettingsPage;
