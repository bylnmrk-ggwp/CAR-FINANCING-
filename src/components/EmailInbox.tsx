import React, { useState, useEffect } from 'react';
import { SimulatedEmail } from '../types';
import { Mail, Trash2, Clock, AlertCircle, RefreshCw, X } from 'lucide-react';

interface EmailInboxProps {
  onClose: () => void;
  authToken: string;
}

export default function EmailInbox({ onClose, authToken }: EmailInboxProps) {
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const headers = { 'Content-Type': 'application/json', 'x-auth-token': authToken };

  // Load emails
  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/emails?limit=100', { headers });
      if (res.ok) {
        const body = await res.json();
        setEmails(body.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Clear email history log
  const clearEmails = async () => {
    try {
      const res = await fetch('/api/emails/clear', { method: 'POST', headers });
      if (res.ok) {
        setEmails([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmails();
    // Auto polling simulated emails logs to make it feel super responsive when they click update!
    const interval = setInterval(fetchEmails, 2500);
    return () => clearInterval(interval);
  }, [authToken]);

  return (
    <div className="fixed inset-y-0 right-0 max-w-md w-full bg-neutral-900 light:bg-white border-l border-neutral-800 light:border-neutral-200 shadow-2xl z-50 flex flex-col justify-between text-white light:text-neutral-900 font-display">
      
      {/* Drawer Header */}
      <div className="p-5 border-b border-neutral-800 light:border-neutral-200 flex justify-between items-center bg-neutral-950 light:bg-neutral-100 text-left">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-red-500" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Automated Notification Inbox</h3>
            <p className="text-[10px] text-neutral-400 font-mono">Simulated email transaction console</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-neutral-400 light:text-neutral-600 hover:text-white light:hover:text-neutral-900 rounded border border-neutral-800 light:border-neutral-300 hover:border-neutral-700 light:hover:border-neutral-400 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Drawer Body - list */}
      <div className="grow overflow-y-auto p-4 space-y-4">
        {loading && emails.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 font-mono text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />
            Scanning simulated mail channels...
          </div>
        ) : emails.length > 0 ? (
          emails.map((email) => (
            <div 
              key={email.id} 
              className="bg-neutral-950 light:bg-neutral-100 border border-neutral-850 light:border-neutral-200 rounded-xl p-4 text-left relative group overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
              
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-mono text-neutral-400 light:text-neutral-600">To: <span className="text-red-400">{email.to}</span></span>
                <span className="text-[9px] text-neutral-500 light:text-neutral-600 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(email.sentAt).toLocaleTimeString()}
                </span>
              </div>

              <h4 className="text-xs font-bold text-white light:text-neutral-900 mb-2 leading-snug">{email.subject}</h4>
              <p className="text-[11px] text-neutral-300 light:text-neutral-700 font-sans whitespace-pre-line leading-relaxed bg-neutral-900/60 light:bg-neutral-200 p-2.5 rounded border border-neutral-800/40 light:border-neutral-300">
                {email.body}
              </p>
              
              <div className="text-right mt-2">
                <span className="text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 light:bg-neutral-200 border border-neutral-850 light:border-neutral-300 px-1.5 py-0.5 rounded">
                  {email.id}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 text-neutral-500 light:text-neutral-600">
            <AlertCircle className="w-8 h-8 text-neutral-500/50 mx-auto mb-2" />
            <p className="text-xs">No email notifications sent yet.</p>
            <p className="text-[10px] text-neutral-500 light:text-neutral-600 mt-1">Submit a loan application or advance client status to trigger triggers.</p>
          </div>
        )}
      </div>

      {/* Drawer Footer controls */}
      <div className="p-4 border-t border-neutral-800 light:border-neutral-200 bg-neutral-950 light:bg-neutral-100 flex justify-between gap-3 font-sans">
        <button
          onClick={fetchEmails}
          className="text-xs font-medium py-2 px-4 border border-neutral-800 light:border-neutral-300 rounded-lg hover:border-neutral-700 light:hover:border-neutral-400 hover:bg-neutral-900 light:hover:bg-neutral-200 text-neutral-300 light:text-neutral-600 transition flex items-center gap-1.5 grow justify-center"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Force Sync
        </button>

        {emails.length > 0 && (
          <button
            onClick={clearEmails}
            className="text-xs font-medium py-2 px-3 bg-neutral-900 light:bg-neutral-200 border border-neutral-800 light:border-neutral-300 hover:bg-red-950/20 light:hover:bg-red-100 text-neutral-300 light:text-neutral-700 hover:text-red-500 light:hover:text-red-600 rounded-lg transition flex items-center gap-1.5 justify-center"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Logs
          </button>
        )}
      </div>

    </div>
  );
}
