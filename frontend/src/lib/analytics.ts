"use client";
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

type ViewContext = {
  categoryId?: string | null;
  commerceId?: string | null;
  path?: string;
};

const getToken = (): string | null => {
  try {
    const t = localStorage.getItem('token');
    return t && t.trim().length > 0 ? t : null;
  } catch {
    return null;
  }
};

const getSessionId = () => {
  try {
    const key = 'analytics_session_id';
    let sid = localStorage.getItem(key);
    if (!sid) {
      sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

const sendEvent = async (payload: any) => {
  const token = getToken();
  if (!token) return;
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/events`;

  const type = payload?.eventType as string | undefined;
  const canBeacon = typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function';

  if (canBeacon && (type === 'VIEW_END' || type === 'VIEW_PAUSE')) {
    try {
      const beaconUrl = `${url}?token=${encodeURIComponent(token)}`;
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(beaconUrl, blob);
      return;
    } catch {}
  }

  try {
    await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {}
};

export const useAnalyticsView = (ctx: ViewContext) => {
  let socket: Socket | null = null;
  const sessionId = getSessionId();
  let start = Date.now();
  let lastResume = start;
  let accumulated = 0;
  let paused = false;
  let visibilityHandler: (() => void) | null = null;
  let tickInterval: any = null;
  const progressInterval = Number(process.env.NEXT_PUBLIC_ANALYTICS_PROGRESS_INTERVAL_MS) || 15000;
  const progressSampleRate = Number(process.env.NEXT_PUBLIC_ANALYTICS_PROGRESS_SAMPLE_RATE) || 0.5;

  const base = {
    sessionId,
    categoryId: ctx.categoryId || undefined,
    commerceId: ctx.commerceId || undefined,
    path: ctx.path || (typeof window !== 'undefined' ? window.location.pathname : undefined),
  };

  const onHide = () => {
    if (!paused) {
      const now = Date.now();
      const delta = now - lastResume;
      accumulated += delta;
      paused = true;
      if (socket) socket.emit('analytics_pause', { sessionId, deltaMs: delta, commerceId: base.commerceId, categoryId: base.categoryId });
      else sendEvent({ ...base, eventType: 'VIEW_PAUSE', durationMs: delta });
    }
  };

  const onShow = () => {
    if (paused) {
      paused = false;
      lastResume = Date.now();
      // no enviar resume
    }
  };

  const onEnd = () => {
    const now = Date.now();
    const delta = paused ? 0 : now - lastResume;
    const total = accumulated + delta;
    if (socket) socket.emit('analytics_end', { sessionId, deltaMs: total, commerceId: base.commerceId, categoryId: base.categoryId });
    else sendEvent({ ...base, eventType: 'VIEW_END', durationMs: total });
  };

  const init = () => {
    const token = getToken();
    if (token) {
      socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        transports: ['websocket'],
        auth: { token },
      });
      socket.emit('analytics_start', { sessionId, commerceId: base.commerceId, categoryId: base.categoryId });
    } else {
      sendEvent({ ...base, eventType: 'VIEW_START' });
    }
    visibilityHandler = () => {
      if (document.visibilityState === 'hidden') onHide();
      else if (document.visibilityState === 'visible') onShow();
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    window.addEventListener('beforeunload', onEnd);
    window.addEventListener('pagehide', onEnd);
    window.addEventListener('blur', onHide);
    window.addEventListener('focus', onShow);
    tickInterval = setInterval(() => {
      const now = Date.now();
      if (!paused) {
        const delta = now - lastResume;
        accumulated += delta;
        lastResume = now;
        if (Math.random() < progressSampleRate) {
          if (socket) socket.emit('analytics_progress', { sessionId, deltaMs: delta, commerceId: base.commerceId, categoryId: base.categoryId });
          else sendEvent({ ...base, eventType: 'VIEW_PROGRESS', durationMs: delta });
        }
      }
    }, progressInterval);
  };

  const cleanup = () => {
    onEnd();
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    window.removeEventListener('beforeunload', onEnd);
    window.removeEventListener('pagehide', onEnd);
    window.removeEventListener('blur', onHide);
    window.removeEventListener('focus', onShow);
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    if (socket) {
      try { socket.disconnect(); } catch {}
      socket = null;
    }
  };

  return { init, cleanup };
};

export const createAnalyticsView = (ctx: ViewContext) => {
  let socket: Socket | null = null;
  const sessionId = getSessionId();
  let start = Date.now();
  let lastResume = start;
  let accumulated = 0;
  let paused = false;
  let visibilityHandler: (() => void) | null = null;
  let tickInterval: any = null;
  const progressInterval = Number(process.env.NEXT_PUBLIC_ANALYTICS_PROGRESS_INTERVAL_MS) || 15000;
  const progressSampleRate = Number(process.env.NEXT_PUBLIC_ANALYTICS_PROGRESS_SAMPLE_RATE) || 0.5;

  const base = {
    sessionId,
    categoryId: ctx.categoryId || undefined,
    commerceId: ctx.commerceId || undefined,
    path: ctx.path || (typeof window !== 'undefined' ? window.location.pathname : undefined),
  };

  const onHide = () => {
    if (!paused) {
      const now = Date.now();
      const delta = now - lastResume;
      accumulated += delta;
      paused = true;
      if (socket) socket.emit('analytics_pause', { sessionId, deltaMs: delta, commerceId: base.commerceId, categoryId: base.categoryId });
      else sendEvent({ ...base, eventType: 'VIEW_PAUSE', durationMs: delta });
    }
  };

  const onShow = () => {
    if (paused) {
      paused = false;
      lastResume = Date.now();
    }
  };

  const onEnd = () => {
    const now = Date.now();
    const delta = paused ? 0 : now - lastResume;
    const total = accumulated + delta;
    if (socket) socket.emit('analytics_end', { sessionId, deltaMs: total, commerceId: base.commerceId, categoryId: base.categoryId });
    else sendEvent({ ...base, eventType: 'VIEW_END', durationMs: total });
  };

  const init = () => {
    const token = getToken();
    if (token) {
      socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        transports: ['websocket'],
        auth: { token },
      });
      socket.emit('analytics_start', { sessionId, commerceId: base.commerceId, categoryId: base.categoryId });
    } else {
      sendEvent({ ...base, eventType: 'VIEW_START' });
    }
    visibilityHandler = () => {
      if (document.visibilityState === 'hidden') onHide();
      else if (document.visibilityState === 'visible') onShow();
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    window.addEventListener('beforeunload', onEnd);
    window.addEventListener('pagehide', onEnd);
    window.addEventListener('blur', onHide);
    window.addEventListener('focus', onShow);
    tickInterval = setInterval(() => {
      const now = Date.now();
      if (!paused) {
        const delta = now - lastResume;
        accumulated += delta;
        lastResume = now;
        if (Math.random() < progressSampleRate) {
          if (socket) socket.emit('analytics_progress', { sessionId, deltaMs: delta, commerceId: base.commerceId, categoryId: base.categoryId });
          else sendEvent({ ...base, eventType: 'VIEW_PROGRESS', durationMs: delta });
        }
      }
    }, progressInterval);
  };

  const cleanup = () => {
    onEnd();
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    window.removeEventListener('beforeunload', onEnd);
    window.removeEventListener('pagehide', onEnd);
    window.removeEventListener('blur', onHide);
    window.removeEventListener('focus', onShow);
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    if (socket) {
      try { socket.disconnect(); } catch {}
      socket = null;
    }
  };

  return { init, cleanup };
};

export const trackSocialClick = (platform: 'facebook' | 'instagram' | 'whatsapp') => {
  const sessionId = getSessionId();
  sendEvent({ sessionId, eventType: 'CLICK_SOCIAL', meta: { platform } });
};

export const trackMapClick = () => {
  const sessionId = getSessionId();
  sendEvent({ sessionId, eventType: 'CLICK_MAP' });
};

export const trackContactClick = (type: 'phone' | 'email' | 'website') => {
  const sessionId = getSessionId();
  sendEvent({ sessionId, eventType: 'CLICK_CONTACT', meta: { type } });
};