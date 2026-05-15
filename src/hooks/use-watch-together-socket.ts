'use client';
import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  useWatchTogether,
  type ChatMessage,
  type Room,
} from '@/stores/watch-together';
import { env } from '@/env.mjs';

export function useWatchTogetherSocket() {
  const socketRef = useRef<Socket | null>(null);
  const store = useWatchTogether();

  useEffect(() => {
    if (socketRef.current) return;

    const socket = io(env.NEXT_PUBLIC_WATCH_TOGETHER_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;
    store.setSocket(socket);

    socket.on('connect', () => store.setConnected(true));
    socket.on('disconnect', () => store.setConnected(false));
    socket.on('error', ({ message }: { message: string }) => store.setError(message));

    socket.on('room-created', ({ room }: { room: Room }) => store.setRoom(room));
    socket.on('room-joined', ({ room }: { room: Room }) => store.setRoom(room));
    socket.on('room-updated', ({ room }: { room: Room }) => store.setRoom(room));
    socket.on('member-joined', ({ room }: { room: Room }) => store.setRoom(room));
    socket.on('member-left', ({ room }: { room: Room }) => store.setRoom(room));
    socket.on('chat-message', (msg: ChatMessage) => store.addMessage(msg));
    socket.on('kicked', () => {
      store.clearRoom();
      store.setError('You were removed from the room');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef.current;
}
