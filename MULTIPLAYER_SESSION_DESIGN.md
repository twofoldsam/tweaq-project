# Multiplayer Commenting Session Design

## Overview
Enable multiple users to collaborate in real-time on webpage comments, with session management, real-time synchronization, and structured reporting.

## User Flow

### 1. Session Creation
- Owner clicks "Create Session" button
- System generates unique session ID
- Owner sets initial URL (home URL for session)
- Owner gets shareable link: `tweaq://session/{sessionId}`
- Session persists until owner ends it

### 2. Joining Sessions
- User clicks shareable link
- App opens and connects to session
- User sees same webpage as session home URL
- User can see all existing comments
- User can see other participants' cursors

### 3. Real-time Collaboration
- Comments sync in real-time across all users
- Cursor positions broadcast to all participants
- Comment ownership tracked (creator can edit/delete)
- URL changes by owner auto-navigate all participants

### 4. Session Management
- Owner can end session at any time
- Ending session triggers structured report generation
- Report includes all comments organized by element

## Technical Architecture

### Backend Service
**New Service**: `packages/session-manager/`
- WebSocket server (Socket.io)
- Session storage (in-memory + optional persistence)
- Real-time event broadcasting
- Session state management

### Data Models

#### Session
```typescript
interface Session {
  id: string;                    // Unique session ID
  ownerId: string;               // Owner's user ID
  homeUrl: string;               // Initial URL for session
  currentUrl: string;            // Current URL (synced)
  participants: Participant[];   // Active participants
  comments: Comment[];           // All comments in session
  createdAt: number;             // Timestamp
  endedAt?: number;              // Timestamp when ended
  status: 'active' | 'ended';    // Session status
}
```

#### Participant
```typescript
interface Participant {
  id: string;                    // Unique participant ID
  sessionId: string;             // Session they're in
  name: string;                  // Display name
  color: string;                 // Color for cursor/comments
  cursor: CursorPosition;         // Current cursor position
  joinedAt: number;              // Timestamp
}
```

#### Comment
```typescript
interface Comment {
  id: string;                    // Unique comment ID
  sessionId: string;             // Session it belongs to
  authorId: string;              // Participant who created it
  elementSelector: string;      // CSS selector for element
  text: string;                  // Comment text
  position: { x: number; y: number }; // Position on page
  createdAt: number;             // Timestamp
  editedAt?: number;             // Timestamp if edited
}
```

#### CursorPosition
```typescript
interface CursorPosition {
  x: number;                     // X coordinate
  y: number;                     // Y coordinate
  elementSelector?: string;      // Element under cursor
}
```

### WebSocket Events

#### Client → Server
- `join-session`: Join a session
- `leave-session`: Leave a session
- `cursor-move`: Update cursor position
- `comment-add`: Add new comment
- `comment-edit`: Edit existing comment
- `comment-delete`: Delete comment
- `url-change`: Change URL (owner only)
- `end-session`: End session (owner only)

#### Server → Client
- `session-joined`: Confirmation of joining
- `participant-joined`: New participant joined
- `participant-left`: Participant left
- `cursor-update`: Cursor position update
- `comment-added`: New comment added
- `comment-edited`: Comment edited
- `comment-deleted`: Comment deleted
- `url-changed`: URL changed (navigate all)
- `session-ended`: Session ended

### Electron App Integration

#### IPC Handlers
- `session-create`: Create new session
- `session-join`: Join existing session
- `session-leave`: Leave current session
- `session-end`: End session (owner only)
- `session-get-report`: Get structured report

#### UI Components
- Session creation modal
- Session status indicator
- Participant list
- Share link button
- End session button (owner only)

### Structured Report Format

```typescript
interface SessionReport {
  sessionId: string;
  homeUrl: string;
  duration: number;              // Duration in ms
  participants: Participant[];
  commentsByElement: {
    elementSelector: string;
    elementName: string;
    comments: Comment[];
  }[];
  summary: {
    totalComments: number;
    totalParticipants: number;
    commentsByParticipant: Record<string, number>;
  };
}
```

## Implementation Plan

### Phase 1: Backend Service
1. Create WebSocket server with Socket.io
2. Implement session management (create, join, leave, end)
3. Implement real-time event broadcasting
4. Add session persistence (in-memory for now)

### Phase 2: Electron Integration
1. Add WebSocket client connection
2. Create IPC handlers for session operations
3. Add session UI components
4. Integrate with existing comment system

### Phase 3: Real-time Features
1. Comment synchronization
2. Cursor tracking and display
3. URL synchronization
4. Participant management

### Phase 4: Reporting
1. Structured report generation
2. Export functionality
3. Session history

