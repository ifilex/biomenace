/**
 * @file /src/engine/NotificationSystem.ts
 * Real-time In-Game Push & Browser Web Notification System for game events.
 */

import { InGameNotification } from '../types/game';
import { sound } from './AudioEngine';

export class NotificationSystem {
  private notifications: InGameNotification[] = [];
  private listeners: Array<(items: InGameNotification[]) => void> = [];
  private browserPushSupported: boolean = false;
  private browserPushGranted: boolean = false;

  constructor() {
    this.checkBrowserNotificationSupport();
  }

  private checkBrowserNotificationSupport() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.browserPushSupported = true;
      this.browserPushGranted = Notification.permission === 'granted';
    }
  }

  public async requestBrowserPermission(): Promise<boolean> {
    if (!this.browserPushSupported) return false;
    try {
      const perm = await Notification.requestPermission();
      this.browserPushGranted = perm === 'granted';
      return this.browserPushGranted;
    } catch {
      return false;
    }
  }

  public isPushGranted(): boolean {
    return this.browserPushGranted;
  }

  public push(title: string, message: string, type: 'info' | 'achievement' | 'warning' | 'calm' | 'item' = 'info', durationMs: number = 4000) {
    const notif: InGameNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      durationMs,
      timestamp: Date.now()
    };

    this.notifications.unshift(notif);
    // Keep max 4 concurrent visible toasts
    if (this.notifications.length > 4) {
      this.notifications.pop();
    }

    // Play subtle audio cue
    if (type === 'achievement' || type === 'item') {
      sound.playPickup();
    } else if (type === 'warning' || type === 'calm') {
      sound.playBlaster('blaster');
    }

    this.notifyListeners();

    // Trigger Native Browser Web Notification if allowed and requested
    if (this.browserPushGranted && document.visibilityState === 'hidden') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: notif.id
        });
      } catch {}
    }

    // Auto dismiss after duration
    setTimeout(() => {
      this.dismiss(notif.id);
    }, durationMs);
  }

  public dismiss(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notifyListeners();
  }

  public subscribe(listener: (items: InGameNotification[]) => void) {
    this.listeners.push(listener);
    listener([...this.notifications]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l([...this.notifications]));
  }
}

export const notify = new NotificationSystem();
