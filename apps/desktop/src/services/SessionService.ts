/**
 * Session Manager Service
 * 
 * Handles multiplayer commenting session management with WebSocket support
 * for real-time collaboration.
 */

import { io, Socket } from 'socket.io-client';

export interface SessionInfo {
  id: string;
  ownerId: string;
  homeUrl: string;
  currentUrl: string;
  shareLink: string;
  status: 'active' | 'ended';
  participantCount: number;
  commentCount: number;
  createdAt: number;
  endedAt?: number;
}

export interface Participant {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number; elementSelector?: string };
}

export interface Comment {
  id: string;
  sessionId: string;
  authorId: string;
  authorName: string;
  elementSelector: string;
  elementName: string;
  text: string;
  position: { x: number; y: number };
  createdAt: number;
  editedAt?: number;
}

export interface SessionReport {
  sessionId: string;
  homeUrl: string;
  duration: number;
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

export type SessionEventCallback = (data: any) => void;

class SessionService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private participantId: string | null = null;
  private isOwner: boolean = false;
  private serverUrl: string;
  private eventCallbacks: Map<string, SessionEventCallback[]> = new Map();

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  /**
   * Create a new session
   */
  async createSession(homeUrl: string, ownerName?: string): Promise<SessionInfo> {
    const response = await fetch(`${this.serverUrl}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeUrl,
        ownerId: ownerName || 'Owner'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const data = await response.json();
    const session = data.session;

    // Connect to session as owner
    await this.joinSession(session.id, ownerName || 'Owner', true); // true = isOwner

    return {
      id: session.id,
      ownerId: session.ownerId,
      homeUrl: session.homeUrl,
      currentUrl: session.homeUrl,
      shareLink: session.shareLink,
      status: 'active',
      participantCount: 1,
      commentCount: 0,
      createdAt: Date.now()
    };
  }

  /**
   * Join an existing session
   */
  async joinSession(sessionId: string, name: string, isOwner: boolean = false): Promise<void> {
    if (this.socket?.connected) {
      this.disconnect();
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket']
    });

    this.isOwner = isOwner;

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket initialization failed'));
        return;
      }

      this.socket.on('connect', () => {
        console.log('🔌 Connected to session server');
        this.socket!.emit('join-session', { sessionId, name });
      });

      this.socket.on('session-joined', (data: any) => {
        this.sessionId = data.sessionId;
        this.participantId = data.participantId;
        // Use server's ownership determination as source of truth
        this.isOwner = data.isOwner || false;
        console.log('✅ Joined session:', this.sessionId);
        console.log('👤 Participant ID:', this.participantId);
        console.log('👑 Is Owner (from server):', this.isOwner);
        resolve();
      });

      // Error handler for join errors only
      const joinErrorHandler = (error: any) => {
        console.error('❌ Session join error:', error);
        this.socket?.off('error', joinErrorHandler);
        reject(new Error(error.message || 'Failed to join session'));
      };
      this.socket.on('error', joinErrorHandler);

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from session server');
      });

      // Set up event listeners
      this.setupEventListeners();
    });
  }

  /**
   * Leave current session
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.emit('leave-session');
      this.socket.disconnect();
      this.socket = null;
    }
    this.sessionId = null;
    this.participantId = null;
    this.isOwner = false;
    this.eventCallbacks.clear();
  }

  /**
   * Set up WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Error handler - only log errors, don't reject (errors can happen after join)
    this.socket.on('error', (error: any) => {
      console.error('❌ Session error:', error);
      // Don't reject here - errors can happen after session is joined
      // The error will be handled by the specific action that triggered it
    });

    this.socket.on('participant-joined', (data: any) => {
      this.emit('participant-joined', data.participant);
    });

    this.socket.on('participant-left', (data: any) => {
      this.emit('participant-left', data.participantId);
    });

    this.socket.on('cursor-update', (data: any) => {
      this.emit('cursor-update', data);
    });

    this.socket.on('comment-added', (data: any) => {
      this.emit('comment-added', data.comment);
    });

    this.socket.on('comment-edited', (data: any) => {
      this.emit('comment-edited', data.comment);
    });

    this.socket.on('comment-deleted', (data: any) => {
      this.emit('comment-deleted', data.commentId);
    });

    this.socket.on('url-changed', (data: any) => {
      this.emit('url-changed', data.url);
    });

    this.socket.on('session-ended', (data: any) => {
      this.emit('session-ended', data); // Pass the whole data object (sessionId, homeUrl, comments, participants)
      this.disconnect();
    });
  }

  /**
   * Send cursor position update
   */
  updateCursor(cursor: { x: number; y: number; elementSelector?: string }): void {
    if (this.socket && this.sessionId) {
      this.socket.emit('cursor-move', {
        sessionId: this.sessionId,
        cursor
      });
    }
  }

  /**
   * Add a comment
   */
  addComment(comment: {
    elementSelector: string;
    elementName: string;
    text: string;
    url: string;
    position: { x: number; y: number };
    textContent?: string;
  }): void {
    if (this.socket && this.sessionId) {
      this.socket.emit('comment-add', {
        sessionId: this.sessionId,
        ...comment
      });
    }
  }

  /**
   * Edit a comment
   */
  editComment(commentId: string, text: string): void {
    if (this.socket && this.sessionId) {
      this.socket.emit('comment-edit', {
        sessionId: this.sessionId,
        commentId,
        text
      });
    }
  }

  /**
   * Delete a comment
   */
  deleteComment(commentId: string): void {
    if (this.socket && this.sessionId) {
      this.socket.emit('comment-delete', {
        sessionId: this.sessionId,
        commentId
      });
    }
  }

  /**
   * Change URL (owner only)
   */
  changeUrl(url: string): void {
    if (!this.isOwner) {
      throw new Error('Only session owner can change URL');
    }
    if (this.socket && this.sessionId) {
      this.socket.emit('url-change', {
        sessionId: this.sessionId,
        url
      });
    }
  }

  /**
   * End session (owner only)
   * Note: This should only be called by the owner, but server will verify
   */
  endSession(): void {
    if (this.socket && this.sessionId) {
      console.log(`📤 Emitting end-session event for session: ${this.sessionId}`);
      console.log(`🔌 Socket connected: ${this.socket.connected}`);
      console.log(`👑 Client thinks isOwner: ${this.isOwner}`);
      this.socket.emit('end-session', this.sessionId);
      console.log(`✅ End-session event emitted`);
    } else {
      console.error('❌ Cannot end session: socket or sessionId missing', {
        hasSocket: !!this.socket,
        sessionId: this.sessionId
      });
    }
  }

  /**
   * Get completed sessions
   */
  async getCompletedSessions(): Promise<Array<{
    id: string;
    homeUrl: string;
    createdAt: number;
    endedAt?: number;
    commentCount: number;
    participantCount: number;
    ownerId: string;
  }>> {
    const response = await fetch(`${this.serverUrl}/api/sessions`);
    if (!response.ok) {
      throw new Error(`Failed to get completed sessions: ${response.statusText}`);
    }
    const data = await response.json();
    return data.sessions || [];
  }

  /**
   * Get session info
   */
  async getSessionInfo(sessionId: string): Promise<SessionInfo> {
    const response = await fetch(`${this.serverUrl}/api/sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to get session info: ${response.statusText}`);
    }
    const data = await response.json();
    return data.session;
  }

  /**
   * Get session report
   */
  async getSessionReport(sessionId: string): Promise<SessionReport> {
    const response = await fetch(`${this.serverUrl}/api/sessions/${sessionId}/report`);
    if (!response.ok) {
      throw new Error(`Failed to get session report: ${response.statusText}`);
    }
    const data = await response.json();
    return data.report;
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: SessionEventCallback): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: SessionEventCallback): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to subscribers
   */
  private emit(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get current participant ID
   */
  getCurrentParticipantId(): string | null {
    return this.participantId;
  }

  /**
   * Check if current user is owner
   */
  isSessionOwner(): boolean {
    return this.isOwner;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
let sessionServiceInstance: SessionService | null = null;

export function getSessionService(serverUrl?: string): SessionService {
  if (!sessionServiceInstance) {
    sessionServiceInstance = new SessionService(serverUrl);
  }
  return sessionServiceInstance;
}

export default SessionService;

