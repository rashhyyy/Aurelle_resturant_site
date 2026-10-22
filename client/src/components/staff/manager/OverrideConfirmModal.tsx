'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle, ShieldAlert } from 'lucide-react';

interface OverrideConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actionName: string;
  description: string;
  recordSummary: string;
  onConfirm: (reason: string, extraData?: any) => Promise<void>;
  requireReason?: boolean;
}

export const OverrideConfirmModal: React.FC<OverrideConfirmModalProps> = ({
  isOpen,
  onClose,
  title,
  actionName,
  description,
  recordSummary,
  onConfirm,
  requireReason = true,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (requireReason && reason.trim().length < 5) {
      setError('Please provide a specific operational reason (at least 5 characters).');
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Override execution failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#141412] border border-[#B99A63]/30 rounded-xl shadow-2xl p-6 text-[#F6F1E8]">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 text-[#A5A198] hover:text-[#F6F1E8] transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-lg font-serif tracking-wide text-[#F6F1E8]">{title}</h3>
            <p className="text-xs font-mono text-[#B99A63] uppercase tracking-wider">{actionName}</p>
          </div>
        </div>

        {/* Description & Record Info */}
        <p className="text-sm text-[#A5A198] mb-4 leading-relaxed">{description}</p>

        <div className="bg-[#1C1B17] border border-[#2A2925] rounded-lg p-3 mb-4">
          <div className="text-xs font-mono text-[#A5A198] uppercase mb-1">Target Record</div>
          <div className="text-sm font-medium text-[#F6F1E8]">{recordSummary}</div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Reason form */}
        <form onSubmit={handleSubmit}>
          {requireReason && (
            <div className="mb-6">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A5A198] mb-2">
                Manager Justification / Override Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the operational justification for auditing purposes..."
                rows={3}
                required
                disabled={submitting}
                className="w-full bg-[#0D0D0C] border border-[#2A2925] focus:border-[#B99A63] rounded-lg px-3 py-2 text-sm text-[#F6F1E8] placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-[#B99A63] transition-all"
              />
              <span className="text-[11px] text-stone-500 font-mono">
                This action is permanently recorded in the system audit logs.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2A2925]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#A5A198] hover:text-[#F6F1E8] hover:bg-[#1E1D1A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-[#B99A63] hover:bg-[#A38652] text-black font-semibold transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Confirm Override</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
