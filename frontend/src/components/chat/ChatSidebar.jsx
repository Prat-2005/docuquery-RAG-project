import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Settings,
  LogOut,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
};

export const ChatSidebar = ({
  conversations = [],
  selectedId,
  search = '',
  onSearchChange,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  isLoading = false,
  isOpen = false,
  onClose,
}) => {
  const { user, logout } = useAuth();

  const filtered = conversations.filter((c) =>
    (c.title || 'Untitled').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close menu"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') onClose();
          }}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Branding */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <Link to="/" className="flex items-center gap-2.5 text-indigo-600 transition hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 shadow-xs">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-base tracking-tight">DocuQuery AI</span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                RAG Studio
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Buttons & Search */}
        <div className="space-y-3 p-4">
          <button
            type="button"
            onClick={onCreateConversation}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-indigo-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New conversation
          </button>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-10 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Conversations
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8 text-indigo-600">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-slate-400">
              <MessageSquare className="mx-auto mb-2 h-7 w-7 text-slate-300 opacity-60" />
              {search ? 'No matching conversations.' : 'No conversations yet.'}
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = selectedId === c.id;
              return (
                <div
                  key={c.id}
                  className={`group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-all duration-150 ${
                    isSelected
                      ? 'theme-item-active text-indigo-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectConversation(c.id);
                      onClose?.();
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-xs font-semibold leading-tight">
                      {c.title || 'Untitled'}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {formatDate(c.updated_at || c.created_at)}
                    </p>
                  </button>

                  {onDeleteConversation && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(c.id);
                      }}
                      className="rounded-lg p-1 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* User Account / Settings / Theme / Logout Footer */}
        <div className="border-t border-slate-100 p-3 bg-slate-50">
          <div className="flex items-center justify-between rounded-xl p-1.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white uppercase shadow-xs">
                {user?.email ? user.email.slice(0, 2) : 'DQ'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {user?.email || 'Logged in'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Link
                to="/settings"
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 shadow-xs transition"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
