/**
 * @file /src/components/PushNotificationBanner.tsx
 * In-game real-time push notification toasts with retro aesthetic.
 */

import React, { useEffect, useState } from 'react';
import { notify } from '../engine/NotificationSystem';
import { InGameNotification } from '../types/game';
import { AlertTriangle, Award, CheckCircle, Heart, Info, X } from 'lucide-react';

export const PushNotificationBanner: React.FC = () => {
  const [notifications, setNotifications] = useState<InGameNotification[]>([]);

  useEffect(() => {
    const unsub = notify.subscribe((items) => {
      setNotifications(items);
    });
    return unsub;
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-auto">
      {notifications.map((n) => {
        const isAchievement = n.type === 'achievement';
        const isWarning = n.type === 'warning';
        const isCalm = n.type === 'calm';

        let borderColor = 'border-cyan-500';
        let bgColor = 'bg-stone-900/95';
        let icon = <Info className="w-4 h-4 text-cyan-400" />;

        if (isAchievement) {
          borderColor = 'border-amber-400';
          icon = <Award className="w-4 h-4 text-amber-400" />;
        } else if (isWarning) {
          borderColor = 'border-red-500';
          icon = <AlertTriangle className="w-4 h-4 text-red-400" />;
        } else if (isCalm) {
          borderColor = 'border-emerald-400';
          icon = <Heart className="w-4 h-4 text-emerald-400" />;
        }

        return (
          <div
            key={n.id}
            className={`flex items-start gap-3 p-3 rounded border-2 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${borderColor} ${bgColor}`}
          >
            <div className="p-1 rounded bg-black/40 mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-stone-100 font-pixel tracking-wide truncate">
                {n.title}
              </h4>
              <p className="text-xs text-stone-300 font-tech mt-0.5 leading-tight">
                {n.message}
              </p>
            </div>
            <button
              onClick={() => notify.dismiss(n.id)}
              className="text-stone-400 hover:text-stone-100 transition-colors p-1"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
