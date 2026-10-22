'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '../lib/socket';

interface BroadcastMsg {
  sender: string;
  message: string;
  timestamp: string;
}

interface NotificationItem {
  id: string;
  message: string;
  timestamp: string;
  level: 'info' | 'warning' | 'success';
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  isStaffAuthenticated: boolean;
  latency: number | null;
  notifications: NotificationItem[];
  broadcasts: BroadcastMsg[];
  stats: { connectedClients: number; uptimeSeconds: number } | null;
  sendPing: () => void;
  sendBroadcast: (message: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastMsg[]>([]);
  const [stats, setStats] = useState<{ connectedClients: number; uptimeSeconds: number } | null>(null);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);
    s.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => {
      setConnected(false);
      setIsStaffAuthenticated(false);
    };

    const onStaffAuth = () => {
      setIsStaffAuthenticated(true);
    };

    const onPong = (data: { timestamp: number; latencyEstimate?: number }) => {
      if (typeof data.latencyEstimate === 'number') {
        setLatency(data.latencyEstimate);
      }
    };

    const onNotification = (data: NotificationItem) => {
      setNotifications((prev) => [data, ...prev.slice(0, 9)]);
    };

    const onBroadcast = (data: BroadcastMsg) => {
      setBroadcasts((prev) => [data, ...prev.slice(0, 9)]);
    };

    const onStats = (data: { connectedClients: number; uptimeSeconds: number }) => {
      setStats(data);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('staff:authenticated', onStaffAuth);
    s.on('server:pong', onPong);
    s.on('server:notification', onNotification);
    s.on('server:broadcast', onBroadcast);
    s.on('server:stats', onStats);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('staff:authenticated', onStaffAuth);
      s.off('server:pong', onPong);
      s.off('server:notification', onNotification);
      s.off('server:broadcast', onBroadcast);
      s.off('server:stats', onStats);
      s.disconnect();
    };
  }, []);

  const sendPing = () => {
    if (socket && connected) {
      socket.emit('client:ping', { timestamp: Date.now() });
    }
  };

  const sendBroadcast = (message: string) => {
    if (socket && connected && message.trim()) {
      socket.emit('client:broadcast', { message });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        isStaffAuthenticated,
        latency,
        notifications,
        broadcasts,
        stats,
        sendPing,
        sendBroadcast,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
