# BlissFlix — Full Upgrade Plan for Gemini CLI
> **Project**: BlissFlix (Next.js 14 streaming UI)  
> **Goal**: Modern UI overhaul + real-time Watch Together (max 15 users, 2 admins)  
> **Stack**: Next.js 14 · TypeScript · Tailwind CSS · tRPC · Zustand · Radix UI · Framer Motion  
> **AI Context**: Read this entire file before touching a single line of code.

---

## 0. BEFORE YOU START — TMDB Token Setup

The project uses a **TMDB Read Access Token (v4 auth Bearer token)**, NOT the older API key.  
The current token lives in `.env` as `NEXT_PUBLIC_TMDB_TOKEN` and is injected via `BaseService.ts` as a Bearer header on every request to `api.themoviedb.org`.

**⚠️ CREDENTIAL TO USE — set this exact value in `.env`:**

```env
# .env
NEXT_PUBLIC_TMDB_TOKEN="eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5MDljMjZkNmQ2YWYzOTQxYjU1ZDEyZjJiMGU0YTY2MyIsIm5iZiI6MTc3ODg0MzEzNC4xNDIwMDAyLCJzdWIiOiI2YTA2ZmRmZTQ3MzczM2JkMDE3MzRkMmUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.5RSiGGwQS3aeJLnqjZRWr1TNEhsg9xWbI3og_Khbq1Y"
```

This single variable is all that needs updating. Do NOT change `BaseService.ts` — it already reads from `env.NEXT_PUBLIC_TMDB_TOKEN` correctly.

---

## 1. Project Structure (Current — Read Before Editing)

```
blissflix-main/
├── src/
│   ├── app/
│   │   ├── (front)/          ← all public pages (home, movies, tv-shows, anime, search)
│   │   ├── watch/            ← watch pages (movie/[slug], tv/[slug], anime/[slug])
│   │   └── api/trpc/         ← tRPC API route
│   ├── components/
│   │   ├── watch/embed-player.tsx   ← THE iframe player (vidsrc.cc)
│   │   ├── navigation/              ← main-nav + mobile-nav
│   │   ├── ui/                      ← shadcn/ui primitives
│   │   ├── hero.tsx
│   │   ├── shows-carousel.tsx
│   │   └── shows-modal.tsx
│   ├── services/
│   │   ├── BaseService/BaseService.ts   ← axios instance factory + TMDB auth interceptor
│   │   └── MovieService/MovieService.ts ← all TMDB API calls
│   ├── stores/               ← zustand: modal.ts, search.ts
│   ├── lib/
│   │   ├── apiClient.ts      ← pre-built tmdbClient axios instance
│   │   └── utils.ts
│   ├── env.mjs               ← t3-oss env validation (add new vars here too)
│   └── styles/globals.css    ← CSS variables (shadcn theme tokens)
├── .env                      ← credentials file
├── tailwind.config.ts
└── package.json
```

**Key facts:**
- TMDB auth: Bearer token in `Authorization` header, set by `BaseService.axios()` interceptor
- Video embed: `vidsrc.cc` iframes inside `EmbedPlayer` (`src/components/watch/embed-player.tsx`)
- State: Zustand for modal + search state; React Query (TanStack v4) for server data
- No auth system exists — Watch Together needs to be built from scratch

---

## 2. UI Modernization — Complete Spec

### 2.1 Design Direction
Adopt a **"Dark Cinematic Glass"** aesthetic:
- Deep near-black backgrounds (`#080B14`) with subtle blue-tinted card surfaces
- Glassmorphism panels with `backdrop-filter: blur(20px)` and `border: 1px solid rgba(255,255,255,0.08)`
- Accent: electric violet-to-blue gradient (`#7C3AED → #2563EB`) for CTAs and active states
- Typography: `Clash Display` (headings, via CDN or @font-face) + `Geist` (body)
- All transitions: `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like ease-out)

### 2.2 Global CSS Changes (`src/styles/globals.css`)

Replace the existing `:root` and `.dark` CSS variable blocks entirely:

```css
:root {
  --background: 222 47% 4%;
  --foreground: 210 40% 96%;
  --card: 224 42% 7%;
  --card-foreground: 210 40% 96%;
  --popover: 224 42% 7%;
  --popover-foreground: 210 40% 96%;
  --primary: 263 70% 58%;
  --primary-foreground: 210 40% 98%;
  --secondary: 224 32% 12%;
  --secondary-foreground: 210 40% 96%;
  --muted: 224 32% 12%;
  --muted-foreground: 215 20% 55%;
  --accent: 224 32% 14%;
  --accent-foreground: 210 40% 96%;
  --destructive: 0 62% 45%;
  --destructive-foreground: 210 40% 98%;
  --border: 224 32% 14%;
  --input: 224 32% 14%;
  --ring: 263 70% 58%;
  --radius: 0.75rem;

  /* Custom BlissFlix tokens */
  --glass-bg: rgba(12, 16, 32, 0.7);
  --glass-border: rgba(255, 255, 255, 0.07);
  --gradient-primary: linear-gradient(135deg, #7C3AED, #2563EB);
  --gradient-hero: linear-gradient(180deg, transparent 0%, #080B14 100%);
  --shadow-card: 0 8px 40px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 30px rgba(124, 58, 237, 0.25);
}
```

Add these utility classes:

```css
.glass-panel {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-hover {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.card-hover:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-card), var(--shadow-glow);
}
```

### 2.3 Navigation (`src/components/navigation/main-nav.tsx`)

Full rewrite — key changes:
- Remove existing nav markup entirely
- New: sticky frosted-glass nav bar with `position: sticky; top: 0; z-index: 50`
- Logo: gradient text "BlissFlix" using `Clash Display` font
- Nav links: pill-style active indicator with gradient underline animation
- Right side: Search icon (opens inline search overlay) + "Watch Together" button (gradient pill)
- On scroll > 20px, add `box-shadow: 0 1px 0 var(--glass-border)` to nav

```tsx
// Structure sketch — implement fully:
<nav className="glass-panel sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between">
  <Logo />                          {/* Clash Display, gradient-text */}
  <NavLinks />                      {/* pill active state */}
  <div className="flex gap-3">
    <SearchButton />
    <WatchTogetherButton />         {/* gradient pill — opens room modal */}
    <ThemeToggle />
  </div>
</nav>
```

### 2.4 Hero Component (`src/components/hero.tsx`)

- Backdrop: full-bleed poster image with `object-fit: cover` + dark gradient overlay (`var(--gradient-hero)`)
- Add a subtle animated radial gradient pulse behind the title (CSS keyframe, 4s ease-in-out infinite)
- Title: `Clash Display`, 5xl–7xl responsive
- Subtitle badges: genre tags as frosted glass pills
- CTA buttons: primary "Watch Now" (gradient fill) + secondary "More Info" (glass outline)
- Add `framer-motion` `initial/animate` fade+slide-up on mount (staggered: title → subtitle → buttons)

### 2.5 Shows Carousel (`src/components/shows-carousel.tsx`)

- Cards: 16:9 ratio thumbnails with rounded-xl corners
- Hover state: scale(1.05) + reveal overlay with title, rating stars, and "Watch" button
- Overlay: glass-panel with gradient fade from bottom
- Carousel arrows: glass circles, only visible on hover of the container
- Add `IntersectionObserver`-based lazy loading for poster images

### 2.6 Shows Modal (`src/components/shows-modal.tsx`)

- Dialog backdrop: `rgba(0,0,0,0.85)` + blur(4px)
- Modal container: glass-panel, max-w-2xl, rounded-2xl
- Hero area: banner image at top, gradient overlay at bottom merging into modal body
- Rating display: star icons + vote count in a pill
- Genre chips: frosted glass badges
- "Watch Now" button: full-width gradient CTA at the bottom
- Add smooth slide-up + fade enter animation via Framer Motion

### 2.7 Watch Page Layout (`src/app/watch/`)

All three watch pages (`movie/[slug]`, `tv/[slug]`, `anime/[slug]`) share `EmbedPlayer`. Update layout:

- Player area: 16:9 aspect ratio, rounded-xl overflow-hidden, dark shadow
- Below player: tabbed panel — "Info" | "Related" | "Watch Together"
- "Watch Together" tab: if user is in a room, shows the room panel (see Section 4)
- Season/episode picker (anime): redesign as a horizontal scrollable pill list for seasons + grid for episodes

---

## 3. New Dependencies to Install

Run this before making any code changes:

```bash
npm install socket.io-client@^4.7.5
npm install uuid@^9.0.1
npm install @types/uuid --save-dev
```

Also add to `package.json` scripts (devDependency):
```bash
npm install socket.io@^4.7.5 --save-dev
```

For the Watch Together real-time backend, add a standalone Socket.IO server (see Section 4).

---

## 4. Watch Together — Full Implementation Spec

### 4.1 Architecture Overview

```
User Browser ──► Next.js App (port 3000)
                     │
                     ▼
              Socket.IO Server (port 3001, standalone)
                     │
              In-memory Room Store
              {
                roomId: {
                  url: string,          // current vidsrc embed URL
                  playing: boolean,
                  currentTime: number,
                  members: Member[],    // max 15
                  admins: string[],     // max 2 userIds
                  createdAt: Date
                }
              }
```

The Socket.IO server is a **separate Node.js file** (`server/watch-together.ts`) that runs alongside Next.js in dev (via `concurrently`) and as a separate process in production.

### 4.2 Socket.IO Server (`server/watch-together.ts`)

Create this file from scratch:

```typescript
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

// Events the server handles:
// CLIENT → SERVER:
//   create-room    { userId, displayName, embedUrl }
//   join-room      { roomId, userId, displayName }
//   leave-room     { roomId, userId }
//   sync-play      { roomId, currentTime }   ← admin only
//   sync-pause     { roomId, currentTime }   ← admin only
//   sync-seek      { roomId, currentTime }   ← admin only
//   change-url     { roomId, embedUrl }      ← admin only
//   promote-admin  { roomId, targetUserId }  ← admin only
//   kick-member    { roomId, targetUserId }  ← admin only
//   chat-message   { roomId, userId, displayName, text }

// SERVER → CLIENT:
//   room-created   { room }
//   room-joined    { room }
//   room-updated   { room }
//   member-joined  { member, room }
//   member-left    { userId, room }
//   play           { currentTime }
//   pause          { currentTime }
//   seek           { currentTime }
//   url-changed    { embedUrl }
//   chat-message   { userId, displayName, text, timestamp }
//   error          { message }
//   kicked         {}

io.on('connection', (socket) => {
  socket.on('create-room', ({ userId, displayName, embedUrl }) => {
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
  });

  socket.on('join-room', ({ roomId, userId, displayName }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error', { message: 'Room not found' });
    if (room.members.length >= room.maxMembers)
      return socket.emit('error', { message: 'Room is full (max 15)' });
    if (room.members.find((m) => m.userId === userId))
      return socket.emit('error', { message: 'Already in room' });

    const isAdmin = room.adminIds.length < 2 && false; // only creator + promoted are admins
    const member: Member = { userId, displayName, isAdmin, joinedAt: Date.now() };
    room.members.push(member);
    void socket.join(roomId);
    socket.emit('room-joined', { room });
    io.to(roomId).emit('member-joined', { member, room });
  });

  socket.on('leave-room', ({ roomId, userId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.members = room.members.filter((m) => m.userId !== userId);
    room.adminIds = room.adminIds.filter((id) => id !== userId);
    void socket.leave(roomId);
    if (room.members.length === 0) {
      rooms.delete(roomId);
    } else {
      // if no admins left, promote oldest member
      if (room.adminIds.length === 0 && room.members.length > 0) {
        const newAdmin = room.members[0];
        newAdmin.isAdmin = true;
        room.adminIds.push(newAdmin.userId);
      }
      io.to(roomId).emit('member-left', { userId, room });
    }
  });

  const requireAdmin = (roomId: string, userId: string): Room | null => {
    const room = rooms.get(roomId);
    if (!room || !room.adminIds.includes(userId)) return null;
    return room;
  };

  socket.on('sync-play', ({ roomId, userId, currentTime }) => {
    const room = requireAdmin(roomId, userId);
    if (!room) return;
    room.playing = true;
    room.currentTime = currentTime;
    io.to(roomId).emit('play', { currentTime });
  });

  socket.on('sync-pause', ({ roomId, userId, currentTime }) => {
    const room = requireAdmin(roomId, userId);
    if (!room) return;
    room.playing = false;
    room.currentTime = currentTime;
    io.to(roomId).emit('pause', { currentTime });
  });

  socket.on('sync-seek', ({ roomId, userId, currentTime }) => {
    const room = requireAdmin(roomId, userId);
    if (!room) return;
    room.currentTime = currentTime;
    io.to(roomId).emit('seek', { currentTime });
  });

  socket.on('change-url', ({ roomId, userId, embedUrl }) => {
    const room = requireAdmin(roomId, userId);
    if (!room) return;
    room.embedUrl = embedUrl;
    room.playing = false;
    room.currentTime = 0;
    io.to(roomId).emit('url-changed', { embedUrl });
  });

  socket.on('promote-admin', ({ roomId, userId, targetUserId }) => {
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

  socket.on('kick-member', ({ roomId, userId, targetUserId }) => {
    const room = requireAdmin(roomId, userId);
    if (!room) return;
    if (room.adminIds.includes(targetUserId))
      return socket.emit('error', { message: 'Cannot kick another admin' });
    room.members = room.members.filter((m) => m.userId !== targetUserId);
    io.to(roomId).emit('room-updated', { room });
    io.to(roomId).emit('kicked', {}); // target filters by their own userId client-side
  });

  socket.on('chat-message', ({ roomId, userId, displayName, text }) => {
    if (!text?.trim() || text.length > 300) return;
    io.to(roomId).emit('chat-message', {
      userId,
      displayName,
      text: text.trim(),
      timestamp: Date.now(),
    });
  });

  // cleanup on disconnect
  socket.on('disconnect', () => {
    // rooms are cleaned up via leave-room events; 
    // optionally scan rooms here for orphaned sockets (advanced)
  });
});

const PORT = process.env.WATCH_TOGETHER_PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`[WatchTogether] Socket.IO server running on port ${PORT}`);
});
```

### 4.3 Environment Variables — Add to `.env` and `env.mjs`

Add to `.env`:
```env
NEXT_PUBLIC_WATCH_TOGETHER_URL="http://localhost:3001"
WATCH_TOGETHER_PORT="3001"
```

Add to `env.mjs` client schema:
```typescript
NEXT_PUBLIC_WATCH_TOGETHER_URL: z.string().url(),
```

Add to `runtimeEnv`:
```typescript
NEXT_PUBLIC_WATCH_TOGETHER_URL: process.env.NEXT_PUBLIC_WATCH_TOGETHER_URL,
```

### 4.4 Update `package.json` Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"next dev\" \"npx ts-node --esm server/watch-together.ts\"",
    "dev:next": "next dev",
    "dev:ws": "npx ts-node --esm server/watch-together.ts",
    "build": "next build",
    "start": "next start"
  }
}
```

Install `concurrently`:
```bash
npm install concurrently --save-dev
```

### 4.5 Zustand Store — Watch Together (`src/stores/watch-together.ts`)

Create this file:

```typescript
import { create } from 'zustand';
import type { Socket } from 'socket.io-client';

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
  adminIds: string[];
  maxMembers: number;
}

interface ChatMessage {
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
```

### 4.6 Socket Hook (`src/hooks/use-watch-together-socket.ts`)

Create this hook to manage the Socket.IO connection lifecycle:

```typescript
'use client';
import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useWatchTogether } from '@/stores/watch-together';
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

    socket.on('room-created', ({ room }) => store.setRoom(room));
    socket.on('room-joined', ({ room }) => store.setRoom(room));
    socket.on('room-updated', ({ room }) => store.setRoom(room));
    socket.on('member-joined', ({ room }) => store.setRoom(room));
    socket.on('member-left', ({ room }) => store.setRoom(room));
    socket.on('chat-message', (msg) => store.addMessage(msg));
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
```

### 4.7 Watch Together UI Components

#### 4.7.1 Room Setup Modal (`src/components/watch-together/room-setup-modal.tsx`)

This modal appears when clicking "Watch Together" from the nav or watch page:

```
┌─────────────────────────────────────┐
│  🎬 Watch Together                  │
│                                     │
│  Your Name: [___________________]   │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🆕 Create a Room           │    │  ← gradient button
│  └─────────────────────────────┘    │
│                                     │
│  ─────────── or join ────────────   │
│                                     │
│  Room Code: [__ __ __ __ __ __ __] │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🔗 Join Room               │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

- Name is stored in `localStorage` and pre-filled on next visit
- Auto-generates a random `userId` with `crypto.randomUUID()` stored in `sessionStorage`
- "Create Room" emits `create-room` with the current page's embed URL
- "Join Room" emits `join-room` with the entered room code
- Show error messages from the store inline

#### 4.7.2 Watch Together Panel (`src/components/watch-together/watch-together-panel.tsx`)

This panel appears below the video player (or as a slide-in sidebar on wide screens). It has three tabs:

**Tab 1 — Members**
```
┌──────────────────────────────────────────┐
│  Room: AB12XY78        [Copy Link] [Leave]│
│  👥 4 / 15 watching                       │
│                                           │
│  👑 Alex (you) · Admin                    │
│  👑 Jordan · Admin                        │  ← max 2 admins shown with crown
│  ● Taylor                      [Promote] [Kick]│
│  ● Sam                         [Promote] [Kick]│
│                                           │
│  [Promote to Admin] only if <2 admins     │
└──────────────────────────────────────────┘
```

**Tab 2 — Controls (Admins Only)**
```
┌──────────────────────────────────────────┐
│  Playback Controls                        │
│                                           │
│  [▶ Play for Everyone]  [⏸ Pause]        │
│                                           │
│  Seek to: [00:00:00] [→ Sync]            │
│                                           │
│  ──────────────────────────────           │
│  Switch Content                           │
│  [Paste new vidsrc URL] [Apply]           │
└──────────────────────────────────────────┘
```

Non-admins see: "Only admins can control playback. Syncing automatically..."

**Tab 3 — Chat**
```
┌──────────────────────────────────────────┐
│  💬 Room Chat                             │
│                                           │
│  [scrollable message area]                │
│  Alex: let's gooo 🍿                     │
│  Taylor: finally watching this!!          │
│  Sam: 🔥🔥🔥                             │
│                                           │
│  ──────────────────────────────           │
│  [Type a message...]           [Send →]   │
└──────────────────────────────────────────┘
```

- Messages auto-scroll to bottom on new message
- Max 300 chars, trim on send
- Show "system" messages (join/leave) in muted italic

#### 4.7.3 Room Invite Link
When a room is created, auto-copy `?room=ROOMCODE` query param to clipboard and show a toast.
On page load, check for `?room=` param and auto-open the join modal.

### 4.8 Player Sync Integration (`src/components/watch/embed-player.tsx`)

The embed player uses an `<iframe>` pointing to `vidsrc.cc`. Since we **cannot** directly control iframe playback via JS (cross-origin), the sync model works differently:

**Strategy: URL-based sync**
- When admin changes URL via `change-url` event, all clients reload the iframe `src`
- Play/Pause/Seek emit visual UI state but do NOT control the iframe directly
- Instead, admins control a **shared timestamp** — when a viewer joins late, the server sends `currentTime` and the viewer sees "Admin is at 01:23:45 — sync to this time?" with a button
- A shared status bar shows "● LIVE — following [Admin Name]" below the player for non-admins

**Why this approach:** vidsrc.cc iframes are cross-origin sandboxed. Direct `postMessage` control is not guaranteed. URL + timestamp tracking is the reliable approach.

Show a prominent banner for non-admins:
```
┌──────────────────────────────────────────────────────┐
│  🔴 Watching with 4 others · Admin: Alex              │
│  If playback drifts, click [Resync] to reload stream   │
└──────────────────────────────────────────────────────┘
```

---

## 5. Step-by-Step Implementation Order

Follow this exact order to avoid breaking the app:

### Step 1 — Environment & Dependencies
1. Update `.env` with new TMDB token + Watch Together URL
2. Update `src/env.mjs` with new env var schema
3. Install: `npm install socket.io-client uuid concurrently`
4. Install dev: `npm install --save-dev @types/uuid socket.io ts-node`

### Step 2 — Global Styles & Theme
1. Replace CSS variables in `src/styles/globals.css` (Section 2.2)
2. Add `.glass-panel`, `.gradient-text`, `.card-hover` utilities

### Step 3 — Navigation
1. Rewrite `src/components/navigation/main-nav.tsx` (Section 2.3)
2. Rewrite `src/components/navigation/mobile-nav.tsx` (matching glass aesthetic)

### Step 4 — Hero & Cards
1. Update `src/components/hero.tsx` (Section 2.4)
2. Update `src/components/shows-carousel.tsx` (Section 2.5)
3. Update `src/components/shows-modal.tsx` (Section 2.6)

### Step 5 — Watch Page Layout
1. Update all watch page layouts under `src/app/watch/` (Section 2.7)
2. Update `src/components/watch/embed-player.tsx` — add room banner slot

### Step 6 — Watch Together Backend
1. Create `server/watch-together.ts` (Section 4.2)
2. Update `package.json` dev script to use `concurrently` (Section 4.4)

### Step 7 — Watch Together Frontend
1. Create `src/stores/watch-together.ts` (Section 4.5)
2. Create `src/hooks/use-watch-together-socket.ts` (Section 4.6)
3. Create `src/components/watch-together/room-setup-modal.tsx` (Section 4.7.1)
4. Create `src/components/watch-together/watch-together-panel.tsx` (Section 4.7.2, 4.7.3)
5. Add `WatchTogetherButton` to nav (opens `room-setup-modal`)
6. Add `WatchTogetherPanel` below player in all watch pages
7. Integrate socket events into `embed-player.tsx` (Section 4.8)

### Step 8 — Polish & QA
1. Test TMDB API calls (check network tab for 401 → token issue)
2. Test room creation → join flow with two browser tabs
3. Test member limit (reject at 16th join)
4. Test admin promotion (max 2)
5. Test kick flow
6. Verify mobile responsive for all new components
7. Check `framer-motion` animations don't break SSR (wrap in `<AnimatePresence>` where needed)

---

## 6. Constraints & Rules — Do Not Break These

- **Never** remove `BaseService.ts` auth interceptor — it's what injects the TMDB Bearer token
- **Never** hardcode the TMDB token anywhere except `.env`
- **Never** add auth/login — this app has no user accounts, Watch Together uses ephemeral session IDs only
- **Never** import server-side `socket.io` in Next.js client components — only `socket.io-client`
- **Keep** all existing TMDB service methods in `MovieService.ts` — only add new ones if needed
- **Keep** `vidsrc.cc` as the embed URL source — do not change the embed domain
- **Keep** tRPC setup intact — don't remove `@trpc` packages or the `/api/trpc` route
- The Watch Together store (`use-watch-together-socket`) must only be mounted in Client Components (`'use client'`)
- Room state is **in-memory only** on the server — rooms are lost on server restart (acceptable for MVP)
- Max members is **15**, max admins is **2** — enforce on BOTH server and client

---

## 7. File Checklist — Every File to Create or Modify

### Create (new files)
- `server/watch-together.ts`
- `src/stores/watch-together.ts`
- `src/hooks/use-watch-together-socket.ts`
- `src/components/watch-together/room-setup-modal.tsx`
- `src/components/watch-together/watch-together-panel.tsx`
- `src/components/watch-together/member-list.tsx`
- `src/components/watch-together/admin-controls.tsx`
- `src/components/watch-together/room-chat.tsx`

### Modify (existing files)
- `.env` — add TMDB token + Watch Together URL
- `src/env.mjs` — add `NEXT_PUBLIC_WATCH_TOGETHER_URL` schema
- `package.json` — add `concurrently` dev script
- `src/styles/globals.css` — full CSS variable replacement + utility classes
- `src/components/navigation/main-nav.tsx` — full rewrite
- `src/components/navigation/mobile-nav.tsx` — full rewrite
- `src/components/hero.tsx` — cinematic design update
- `src/components/shows-carousel.tsx` — card hover + glass overlay
- `src/components/shows-modal.tsx` — glass panel redesign
- `src/components/watch/embed-player.tsx` — add room sync banner + socket integration
- `src/app/watch/movie/[slug]/page.tsx` — add WatchTogetherPanel below player
- `src/app/watch/tv/[slug]/page.tsx` — add WatchTogetherPanel below player
- `src/app/watch/anime/[slug]/page.tsx` — add WatchTogetherPanel below player
- `tailwind.config.ts` — update color palette to match new CSS vars

---

## 8. Getting the TMDB Token — Instructions for the User

Tell the user exactly this before they hand you the token:

> **How to get your TMDB Read Access Token:**
> 1. Go to [https://www.themoviedb.org](https://www.themoviedb.org) and log in (or create a free account)
> 2. Click your avatar → **Settings** → **API** (in the left sidebar)
> 3. Under **"API Read Access Token"**, click **"Request an API key"** if you haven't already (it's free, just fill in the form)
> 4. Once approved, scroll to **"API Read Access Token (v4 auth)"** — it's a long JWT string starting with `eyJ...`
> 5. Copy that entire token and paste it here — NOT the shorter "API Key (v3 auth)"

The token format looks like:
```
eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI...LONG_STRING...
```

Once provided, put it in `.env` as:
```env
NEXT_PUBLIC_TMDB_TOKEN="eyJhbGciOiJIUzI1NiJ9.eyJhd..."
```

---

*End of plan. Start with Step 1 and work sequentially. Do not skip steps.*