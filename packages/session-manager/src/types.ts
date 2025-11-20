// Session Manager Types

export interface Session {
  id: string;
  ownerId: string;
  ownerParticipantId?: string; // Store the participantId of the owner for ownership checks
  homeUrl: string;
  currentUrl: string;
  participants: Map<string, Participant>;
  comments: Comment[];
  createdAt: number;
  endedAt?: number;
  status: 'active' | 'ended';
}

export interface Participant {
  id: string;
  sessionId: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  joinedAt: number;
  socketId: string;
}

export interface Comment {
  id: string;
  sessionId: string;
  authorId: string;
  authorName: string;
  authorColor: string; // Color assigned to the author
  elementSelector: string;
  elementName: string;
  text: string;
  url: string; // URL where the comment was added
  position: { x: number; y: number };
  textContent?: string; // Optional text content of the element
  createdAt: number;
  editedAt?: number;
}

export interface CursorPosition {
  x: number;
  y: number;
  elementSelector?: string;
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
  llmReport?: {
    executiveSummary: string;
    keyFindings: string[];
    recommendations: string[];
    detailedAnalysis: string;
    themes: Array<{
      theme: string;
      description: string;
      relatedComments: string[];
    }>;
  };
}

// WebSocket Event Types

export interface JoinSessionPayload {
  sessionId: string;
  name: string;
}

export interface AddCommentPayload {
  sessionId: string;
  elementSelector: string;
  elementName: string;
  text: string;
  url: string;
  position: { x: number; y: number };
  textContent?: string;
}

export interface EditCommentPayload {
  sessionId: string;
  commentId: string;
  text: string;
}

export interface DeleteCommentPayload {
  sessionId: string;
  commentId: string;
}

export interface CursorMovePayload {
  sessionId: string;
  cursor: CursorPosition;
}

export interface UrlChangePayload {
  sessionId: string;
  url: string;
}

