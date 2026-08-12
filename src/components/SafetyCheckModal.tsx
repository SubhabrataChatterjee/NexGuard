import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface SafetyCheckModalProps {
  onRespondSafe: () => Promise<void>;
  onRespondNeedHelp: () => Promise<void>;
}

export const SafetyCheckModal: React.FC<SafetyCheckModalProps> = ({
  onRespondSafe,
  onRespondNeedHelp,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes countdown
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto trigger need help if countdown reaches 0
          onRespondNeedHelp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRespondNeedHelp]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSafe = async () => {
    setLoading(true);
    try {
      await onRespondSafe();
    } finally {
      setLoading(false);
    }
  };

  const handleHelp = async () => {
    setLoading(true);
    try {
      await onRespondNeedHelp();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl overflow-hidden text-center p-8 space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 animate-bounce">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-[#191c1e]">Safety Check-In</h2>
          <p className="text-sm text-[#484555] mt-1">
            Your estimated arrival time has passed. Please confirm that you are safe.
          </p>
        </div>

        {/* Countdown timer */}
        <div className="bg-[#f8f9fc] rounded-2xl p-4 border border-[#e1e2e5]">
          <p className="text-xs uppercase tracking-wider font-bold text-[#797586] mb-1">
            Grace Period Timer
          </p>
          <p className="text-4xl font-extrabold text-[#532dcf] font-mono tracking-tight">
            {formatTimer(secondsLeft)}
          </p>
          <p className="text-[11px] text-[#797586] mt-1">
            If unconfirmed, trusted contacts will automatically be alerted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleSafe}
            disabled={loading}
            className="w-full bg-[#008a00] hover:bg-[#006e00] text-white font-extrabold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base active:scale-95 disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" />
            <span>I'M SAFE & OKAY</span>
          </button>

          <button
            onClick={handleHelp}
            disabled={loading}
            className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold py-3.5 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-50"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>I NEED HELP (SEND SOS)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
