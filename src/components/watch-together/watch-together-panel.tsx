'use client';

import React from 'react';
import { useWatchTogether } from '@/stores/watch-together';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function WatchTogetherPanel() {
  const store = useWatchTogether();
  const [activeTab, setActiveTab] = React.useState<'members' | 'controls' | 'chat'>('members');
  const [chatInput, setChatInput] = React.useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.messages]);

  if (!store.room) return null;

  const isAdmin = store.room.adminIds.includes(store.userId);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    store.socket?.emit('chat-message', {
      roomId: store.room?.roomId,
      userId: store.userId,
      displayName: store.displayName,
      text: chatInput
    });
    setChatInput('');
  };

  const copyInviteLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', store.room?.roomId ?? '');
    void navigator.clipboard.writeText(url.toString());
    // In a real app we'd show a toast here
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono font-bold text-white uppercase tracking-widest">
            {store.room.roomId}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={copyInviteLink} className="text-white/60 hover:text-white">
            Invite
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => store.socket?.emit('leave-room', { roomId: store.room?.roomId, userId: store.userId })}
          >
            Leave
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['members', 'controls', 'chat'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative",
              activeTab === tab ? "text-primary" : "text-white/40 hover:text-white"
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="wt-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'members' && (
            <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
                {store.room.members.length} / {store.room.maxMembers} Watching
              </p>
              <div className="space-y-2">
                {store.room.members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {member.displayName[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">
                          {member.displayName} {member.userId === store.userId && "(You)"}
                        </span>
                        {member.isAdmin && (
                          <span className="text-[10px] text-primary flex items-center gap-1">
                            <Icons.logo className="h-2 w-2 fill-primary" /> Admin
                          </span>
                        )}
                      </div>
                    </div>
                    {isAdmin && member.userId !== store.userId && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!member.isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary"
                            onClick={() => store.socket?.emit('promote-admin', { roomId: store.room?.roomId, userId: store.userId, targetUserId: member.userId })}
                          >
                            <Icons.info className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => store.socket?.emit('kick-member', { roomId: store.room?.roomId, userId: store.userId, targetUserId: member.userId })}
                        >
                          <Icons.close className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'controls' && (
            <motion.div key="controls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {isAdmin ? (
                <>
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Playback Controls</p>
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-white text-black hover:bg-white/90 font-bold" onClick={() => store.socket?.emit('sync-play', { roomId: store.room?.roomId, userId: store.userId, currentTime: 0 })}>
                        <Icons.play className="mr-2 h-4 w-4 fill-current" /> Play
                      </Button>
                      <Button variant="outline" className="flex-1 border-white/10 font-bold" onClick={() => store.socket?.emit('sync-pause', { roomId: store.room?.roomId, userId: store.userId, currentTime: 0 })}>
                        <Icons.pause className="mr-2 h-4 w-4" /> Pause
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-white/40 italic">Note: Player sync uses URL timestamps. Play/Pause buttons show UI states.</p>
                </>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-white/5 mx-auto flex items-center justify-center">
                    <Icons.info className="text-white/20" />
                  </div>
                  <p className="text-sm text-white/60">Following admin&apos;s playback. Re-sync automatically...</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full -m-4">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {store.messages.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col", msg.userId === store.userId ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-white/40">{msg.displayName}</span>
                      <span className="text-[10px] text-white/20">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={cn(
                      "px-3 py-2 rounded-2xl text-sm max-w-[80%]",
                      msg.userId === store.userId 
                        ? "bg-primary text-white rounded-tr-none" 
                        : "bg-white/5 text-white/80 rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-2">
                <Input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-white/5 border-none h-10 rounded-xl"
                />
                <Button size="icon" type="submit" className="h-10 w-10 shrink-0 rounded-xl bg-primary">
                  <Icons.chevronRight className="h-5 w-5" />
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
