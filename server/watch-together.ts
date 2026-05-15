import { Server } from 'socket.io';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

interface Member {
  userId: string;
  displayName: string;
  isAdmin: boolean;
  joinedAt: number;
}

interface Room {
  roomId: string;
  embedUrl: string;
  playing: boolean;
  currentTime: number;
  members: Member[];
  adminIds: string[];        // max 2
  maxMembers: number;        // always 15
  createdAt: number;
}

const rooms = new Map<string, Room>();

io.on('connection', (socket) => {
  console.log(`[WatchTogether] User connected: ${socket.id}`);

  socket.on('create-room', ({ userId, displayName, embedUrl }: { userId: string, displayName: string, embedUrl: string }) => {
    const roomId = uuidv4().slice(0, 8).toUpperCase();
    const member: Member = { userId, displayName, isAdmin: true, joinedAt: Date.now() };
    const room: Room = {
      roomId,
      embedUrl,
      playing: false,
      currentTime: 0,
      members: [member],
      adminIds: [userId],
      maxMembers: 15,
      createdAt: Date.now(),
    };
    rooms.set(roomId, room);
    void socket.join(roomId);
    socket.emit('room-created', { room });
    console.log(`[WatchTogether] Room created: ${roomId} by ${displayName}`);
  });

  socket.on('join-room', ({ roomId, userId, displayName }: { roomId: string, userId: string, displayName: string }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error', { message: 'Room not found' });
    if (room.members.length >= room.maxMembers)
      return socket.emit('error', { message: 'Room is full (max 15)' });
    if (room.members.find((m) => m.userId === userId))
      return socket.emit('error', { message: 'Already in room' });

    const isAdmin = room.adminIds.length < 2 && false; 
    const member: Member = { userId, displayName, isAdmin, joinedAt: Date.now() };
    room.members.push(member);
    void socket.join(roomId);
    socket.emit('room-joined', { room });
    io.to(roomId).emit('member-joined', { member, room });
    console.log(`[WatchTogether] User ${displayName} joined room ${roomId}`);
  });

  socket.on('leave-room', ({ roomId, userId }: { roomId: string, userId: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.members = room.members.filter((m) => m.userId !== userId);
    room.adminIds = room.adminIds.filter((id) => id !== userId);
    void socket.leave(roomId);
    
    if (room.members.length === 0) {
      rooms.delete(roomId);
      console.log(`[WatchTogether] Room deleted: ${roomId}`);
    } else {
      if (room.adminIds.length === 0 && room.members.length > 0) {
        const newAdmin = room.members[0];
        newAdmin.isAdmin = true;
        room.adminIds.push(newAdmin.userId);
      }
      io.to(roomId).emit('member-left', { userId, room });
      console.log(`[WatchTogether] User ${userId} left room ${roomId}`);
    }
  });

  const requireAdmin = (roomId: string, userId: string): Room | null => {
    const room = rooms.get(roomId);
    if (!room || !room.adminIds.includes(userId)) return null;
    return room;
  };

  socket.on('sync-play', ({ roomId, userId, currentTime }: { roomId: string, userId: string, currentTime: number }) => {
    const room = requireAdmin(roomId, userId);
    if (!room) return;
    room.playing = true;
    room.currentTime = currentTime;
    io.to(roomId).emit('play', { currentTime });
  });

  socket.on('sync-pause', ({ roomId, userId, currentTime }: { roomId: string, userId: string, currentTime: number }) => {
    const room = requireAdmin(roomId, userId);
    if (!room) return;
    room.playing = false;
    room.currentTime = currentTime;
    io.to(roomId).emit('pause', { currentTime });
  });

  socket.on('sync-seek', ({ roomId, userId, currentTime }: { roomId: string, userId: string, currentTime: number }) => {
    const room = requireAdmin(roomId, userId);
    if (!room) return;
    room.currentTime = currentTime;
    io.to(roomId).emit('seek', { currentTime });
  });

  socket.on('change-url', ({ roomId, userId, embedUrl }: { roomId: string, userId: string, embedUrl: string }) => {
    const room = requireAdmin(roomId, userId);
    if (!room) return;
    room.embedUrl = embedUrl;
    room.playing = false;
    room.currentTime = 0;
    io.to(roomId).emit('url-changed', { embedUrl });
  });

  socket.on('promote-admin', ({ roomId, userId, targetUserId }: { roomId: string, userId: string, targetUserId: string }) => {
    const room = requireAdmin(roomId, userId);
    if (!room) return;
    if (room.adminIds.length >= 2)
      return socket.emit('error', { message: 'Max 2 admins allowed' });
    const target = room.members.find((m) => m.userId === targetUserId);
    if (!target) return;
    target.isAdmin = true;
    room.adminIds.push(targetUserId);
    io.to(roomId).emit('room-updated', { room });
  });

  socket.on('kick-member', ({ roomId, userId, targetUserId }: { roomId: string, userId: string, targetUserId: string }) => {
    const room = requireAdmin(roomId, userId);
    if (!room) return;
    if (room.adminIds.includes(targetUserId))
      return socket.emit('error', { message: 'Cannot kick another admin' });
    room.members = room.members.filter((m) => m.userId !== targetUserId);
    io.to(roomId).emit('room-updated', { room });
    io.to(roomId).emit('kicked', { targetUserId });
  });

  socket.on('chat-message', ({ roomId, userId, displayName, text }: { roomId: string, userId: string, displayName: string, text: string }) => {
    if (!text?.trim() || text.length > 300) return;
    io.to(roomId).emit('chat-message', {
      userId,
      displayName,
      text: text.trim(),
      timestamp: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`[WatchTogether] User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.WATCH_TOGETHER_PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`[WatchTogether] Socket.IO server running on port ${PORT}`);
});
