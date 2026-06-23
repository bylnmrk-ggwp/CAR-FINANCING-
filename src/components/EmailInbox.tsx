import React, { useState, useEffect } from 'react';
import { SimulatedEmail } from '../types';
import { Mail, Trash2, Clock, AlertCircle, RefreshCw, X } from 'lucide-react';

interface EmailInboxProps {
  onClose: () => void;
}

export default function EmailInbox({ onClose }: EmailInboxProps) {
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Load emails
  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/emails');
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
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
      const res = await fetch('/api/emails/clear', { method: 'POST' });
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
  }, []);

  return (
    <div className="fixed inset-y-0 right-0 max-w-md w-full bg-neutral-900 border-l border-neutral-800 shadow-2xl z-50 flex flex-col justify-between text-white font-display">
      
      {/* Drawer Header */}
      <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-950 text-left">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-red-500" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Automated Notification Inbox</h3>
            <p className="text-[10px] text-neutral-400 font-mono">Simulated email transaction console</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-white rounded border border-neutral-800 hover:border-neutral-700 transition"
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
              className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 text-left relative group overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
              
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-mono text-neutral-400">To: <span className="text-red-400">{email.to}</span></span>
                <span className="text-[9px] text-neutral-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(email.sentAt).toLocaleTimeString()}
                </span>
              </div>

              <h4 className="text-xs font-bold text-white mb-2 leading-snug">{email.subject}</h4>
              <p className="text-[11px] text-neutral-300 font-sans whitespace-pre-line leading-relaxed bg-neutral-900/60 p-2.5 rounded border border-neutral-800/40">
                {email.body}
              </p>
              
              <div className="text-right mt-2">
                <span className="text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 border border-neutral-850 px-1.5 py-0.5 rounded">
                  {email.id}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 text-neutral-500">
            <AlertCircle className="w-8 h-8 text-neutral-500/50 mx-auto mb-2" />
            <p className="text-xs">No email notifications sent yet.</p>
            <p className="text-[10px] text-neutral-500 mt-1">Submit a loan application or advance client status to trigger triggers.</p>
          </div>
        )}
      </div>

      {/* Drawer Footer controls */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-between gap-3 font-sans">
        <button
          onClick={fetchEmails}
          className="text-xs font-medium py-2 px-4 border border-neutral-800 rounded-lg hover:border-neutral-700 hover:bg-neutral-900 transition flex items-center gap-1.5 grow justify-center"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Force Sync
        </button>

        {emails.length > 0 && (
          <button
            onClick={clearEmails}
            className="text-xs font-medium py-2 px-3 bg-neutral-900 border border-neutral-800 hover:bg-red-950/20 text-neutral-300 hover:text-red-500 rounded-lg transition flex items-center gap-1.5 justify-center"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Logs
          </button>
        )}
      </div>

    </div>
  );
}
