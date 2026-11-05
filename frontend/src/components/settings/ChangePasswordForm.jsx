import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { authService } from '../../services/authService';

const inputClass = 'mt-1.5 w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 font-normal outline-none focus:border-indigo-500';

const ChangePasswordForm = ({ onError, onSuccess }) => {
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const [isSaving, setIsSaving] = useState(false);

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      onError('New password and confirmation do not match.');
      return;
    }
    if (
      passwords.newPassword.length < 8
      || !/[A-Za-z]/.test(passwords.newPassword)
      || !/\d/.test(passwords.newPassword)
    ) {
      onError('Password must be at least 8 characters and contain a letter and a number.');
      return;
    }

    setIsSaving(true);
    onError('');
    try {
      await authService.changePassword({ new_password: passwords.newPassword });
      setPasswords({ newPassword: '', confirmPassword: '' });
      onSuccess('Password changed successfully.');
    } catch (requestError) {
      onError(requestError.response?.data?.detail || 'Unable to change your password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={changePassword} className="mt-5 grid gap-4 sm:grid-cols-2 pt-5 border-t border-slate-200/60">
      {[
        ['New Password', 'newPassword', 'new'],
        ['Confirm Password', 'confirmPassword', 'confirm'],
      ].map(([label, name, visibilityKey]) => (
        <label key={name} className="text-sm font-semibold text-slate-700">
          {label}
          <span className="relative mt-1.5 block">
            <input
              name={name}
              type={showPasswords[visibilityKey] ? 'text' : 'password'}
              value={passwords[name]}
              onChange={(event) => setPasswords({ ...passwords, [name]: event.target.value })}
              className={`${inputClass} pr-10`}
              minLength="8"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords({
                ...showPasswords,
                [visibilityKey]: !showPasswords[visibilityKey],
              })}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-indigo-600"
              aria-label={showPasswords[visibilityKey] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            >
              {showPasswords[visibilityKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>
      ))}
      <div className="sm:col-span-2">
        <button type="submit" disabled={isSaving} className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition-all shadow-md hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Change password'}
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
