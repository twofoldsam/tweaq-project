# Session Manager

Multiplayer commenting session management service with WebSocket support for real-time collaboration.

## Features

- **Session Management**: Create, join, and end sessions
- **Real-time Synchronization**: Comments and cursors sync across all participants
- **URL Synchronization**: Owner can navigate all participants to a new URL
- **Comment Ownership**: Track who created each comment, allow edit/delete by author
- **Structured Reports**: Generate comprehensive session reports

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Server runs on `http://localhost:3001` by default.

## API Endpoints

### Create Session
```
POST /api/sessions
Body: { ownerId?: string, homeUrl: string }
Response: { success: true, session: { id, ownerId, homeUrl, shareLink } }
```

### Get Session Info
```
GET /api/sessions/:sessionId
Response: { success: true, session: { ... } }
```

### Get Session Report
```
GET /api/sessions/:sessionId/report
Response: { success: true, report: { ... } }
```

## WebSocket Events

### Client → Server
- `join-session`: Join a session
- `leave-session`: Leave current session
- `cursor-move`: Update cursor position
- `comment-add`: Add new comment
- `comment-edit`: Edit existing comment
- `comment-delete`: Delete comment
- `url-change`: Change URL (owner only)
- `end-session`: End session (owner only)

### Server → Client
- `session-joined`: Confirmation of joining
- `participant-joined`: New participant joined
- `participant-left`: Participant left
- `cursor-update`: Cursor position update
- `comment-added`: New comment added
- `comment-edited`: Comment edited
- `comment-deleted`: Comment deleted
- `url-changed`: URL changed (navigate all)
- `session-ended`: Session ended with report

## Usage Example

```typescript
import { SessionManager } from '@smart-qa/session-manager';

const sessionManager = new SessionManager(httpServer);

// Create session
const session = sessionManager.createSession('owner-id', 'https://example.com');

// Get session
const session = sessionManager.getSession(sessionId);

// Generate report
const report = sessionManager.generateReport(session);
```

