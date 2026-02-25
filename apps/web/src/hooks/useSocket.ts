import { useEffect, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/lib/auth';
import type { Socket } from 'socket.io-client';

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = connectSocket(accessToken ?? undefined);

    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      disconnectSocket();
    };
  }, [accessToken]);

  const subscribe = useCallback(
    <T>(event: string, handler: (data: T) => void) => {
      const socket: Socket | null = getSocket();
      if (!socket) return () => {};
      socket.on(event, handler as (...args: unknown[]) => void);
      return () => {
        socket.off(event, handler as (...args: unknown[]) => void);
      };
    },
    []
  );

  return { isConnected, subscribe };
}
