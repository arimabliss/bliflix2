'use client';

import React from 'react';
import { useWatchTogether } from '@/stores/watch-together';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RoomSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmbedUrl: string;
}

export function RoomSetupModal({ open, onOpenChange, currentEmbedUrl }: RoomSetupModalProps) {
  const store = useWatchTogether();
  const [name, setName] = React.useState('');
  const [roomCode, setRoomCode] = React.useState('');

  React.useEffect(() => {
    const savedName = localStorage.getItem('watch-together-name');
    if (savedName) setName(savedName);
    
    if (!store.userId) {
      let id = sessionStorage.getItem('watch-together-id');
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem('watch-together-id', id);
      }
      store.setUserId(id);
    }
  }, []);

  const handleCreateRoom = () => {
    if (!name.trim()) return store.setError('Please enter a name');
    localStorage.setItem('watch-together-name', name);
    store.setDisplayName(name);
    
    store.socket?.emit('create-room', {
      userId: store.userId,
      displayName: name,
      embedUrl: currentEmbedUrl
    });
    onOpenChange(false);
  };

  const handleJoinRoom = () => {
    if (!name.trim()) return store.setError('Please enter a name');
    if (!roomCode.trim()) return store.setError('Please enter a room code');
    
    localStorage.setItem('watch-together-name', name);
    store.setDisplayName(name);
    
    store.socket?.emit('join-room', {
      roomId: roomCode.toUpperCase(),
      userId: store.userId,
      displayName: name
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text font-clash">
            Watch Together
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Your Name</label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="bg-white/5 border-white/10"
            />
          </div>

          <Button 
            className="w-full rounded-xl bg-[image:var(--gradient-primary)] py-6 font-bold text-slate-950 hover:opacity-95"
            onClick={handleCreateRoom}
          >
            Create a New Room
          </Button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-white/20 text-xs uppercase tracking-widest">or join</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Room Code</label>
              <Input 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Enter 8-digit code..."
                className="bg-white/5 border-white/10 font-mono text-center uppercase tracking-widest"
              />
            </div>
            <Button 
              variant="outline"
              className="w-full rounded-xl border-white/10 hover:bg-white/5 font-bold"
              onClick={handleJoinRoom}
            >
              Join Room
            </Button>
          </div>

          {store.error && (
            <p className="text-center text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">
              {store.error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
