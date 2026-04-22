import React, { useState, useEffect } from 'react';
import { AppUser } from '../types';
import { supabase } from '../lib/supabase';
import { ToastType } from './Toast';

export const SettingsPanel: React.FC<{
  user: AppUser;
  showToast: (msg: string, type?: ToastType) => void;
  onTelegramSettingsSaved: (token: string, chatId: string) => void;
}> = ({ user, showToast, onTelegramSettingsSaved }) => {
  const [token, setToken] = useState(user.telegramToken || '');
  const [chatId, setChatId] = useState(user.telegramChatId || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if user prop changes
  useEffect(() => {
    setToken(user.telegramToken || '');
    setChatId(user.telegramChatId || '');
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { telegram_token: token, telegram_chat_id: chatId }
    });
    
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Telegram settings saved!', 'success');
      onTelegramSettingsSaved(token, chatId);
    }
    setIsSaving(false);
  };

  const handleTestNotification = async () => {
    if (!token || !chatId) {
      showToast('Save your token and chat ID first', 'info');
      return;
    }
    try {
      const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: 'Hello from FocusFlow! 🚀\nYour reminders are set up correctly.' }),
      });
      const result = await resp.json();
      if (resp.ok) {
        showToast('Test message sent to Telegram!', 'success');
      } else {
        showToast(`Telegram Error: ${result.description || 'Unknown error'}`, 'error');
        if (result.description?.includes('bot can\'t initiate conversation')) {
          setTimeout(() => showToast('Please send a message to your bot on Telegram first!', 'error'), 2000);
        }
      }
    } catch (e) {
      showToast('Error connecting to Telegram. Check your internet connection.', 'error');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-6">Settings</h2>
      
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm mb-6">
        <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          Telegram Reminders
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Configure your Telegram bot to receive task reminders.
          <br/>
          1. Message <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-600">@BotFather</a> to create a bot & get a token.
          <br/>
          2. Message <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-600">@userinfobot</a> or talk to your own bot to get your Chat ID.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Bot Access Token</label>
            <input
              type="text"
              placeholder="e.g. 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Chat ID</label>
            <input
              type="text"
              placeholder="e.g. 123456789"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={handleTestNotification}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-zinc-500/40 transition-shadow"
            >
              Test Notification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
