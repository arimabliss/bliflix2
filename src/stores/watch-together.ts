import { create } from 'zustand';
import type { Socket } from 'socket.io-client';

export interface Member {
  userId: string;
  displayName: string;
  isAdmin: boolean;
  joinedAt: number;
}

export interface Room {
  roomId: string;
  embedUrl: string;
  playing: boolean;
  currentTime: number;
  members: Member[];
  adminIds: string[];
  maxMembers: number;
}

export interface ChatMessage {
  userId: string;
  displayName: string;
  text: string;
  timestamp: number;
}

interface WatchTogetherStore {
  socket: Socket | null;
  room: Room | null;
  userId: string;
  displayName: string;
  messages: ChatMessage[];
  isConnected: boolean;
  error: string | null;
  
  setSocket: (socket: Socket) => void;
  setRoom: (room: Room | null) => void;
  setUserId: (id: string) => void;
  setDisplayName: (name: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setConnected: (v: boolean) => void;
  setError: (msg: string | null) => void;
  clearRoom: () => void;
}

export const useWatchTogether = create<WatchTogetherStore>((set) => ({
  socket: null,
  room: null,
  userId: '',
  displayName: '',
  messages: [],
  isConnected: false,
  error: null,

  setSocket: (socket) => set({ socket }),
  setRoom: (room) => set({ room }),
  setUserId: (userId) => set({ userId }),
  setDisplayName: (displayName) => set({ displayName }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages.slice(-100), msg] })),
  setConnected: (isConnected) => set({ isConnected }),
  setError: (error) => set({ error }),
  clearRoom: () => set({ room: null, messages: [] }),
}));
