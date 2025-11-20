import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import {
  Session,
  Participant,
  Comment,
  CursorPosition,
  SessionReport,
  JoinSessionPayload,
  AddCommentPayload,
  EditCommentPayload,
  DeleteCommentPayload,
  CursorMovePayload,
  UrlChangePayload
} from './types';

// Participant colors for visual distinction
const PARTICIPANT_COLORS = [
  '#0A84FF', '#FF3B30', '#34C759', '#FF9500',
  '#AF52DE', '#FF2D55', '#5AC8FA', '#FFCC00'
];

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private socketToParticipant: Map<string, { sessionId: string; participantId: string }> = new Map();
  private io: SocketIOServer;
  private anthropic: Anthropic | null = null;

  constructor(httpServer: HTTPServer, anthropicApiKey?: string) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Initialize Anthropic client if API key is provided
    if (anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
      console.log('✅ Anthropic client initialized for LLM report generation');
    } else {
      console.warn('⚠️ No Anthropic API key provided. LLM report generation will be disabled.');
    }

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Join session
      socket.on('join-session', (payload: JoinSessionPayload) => {
        this.handleJoinSession(socket, payload);
      });

      // Leave session
      socket.on('leave-session', () => {
        this.handleLeaveSession(socket);
      });

      // Cursor movement
      socket.on('cursor-move', (payload: CursorMovePayload) => {
        this.handleCursorMove(socket, payload);
      });

      // Add comment
      socket.on('comment-add', (payload: AddCommentPayload) => {
        this.handleAddComment(socket, payload);
      });

      // Edit comment
      socket.on('comment-edit', (payload: EditCommentPayload) => {
        this.handleEditComment(socket, payload);
      });

      // Delete comment
      socket.on('comment-delete', (payload: DeleteCommentPayload) => {
        this.handleDeleteComment(socket, payload);
      });

      // URL change (owner only)
      socket.on('url-change', (payload: UrlChangePayload) => {
        this.handleUrlChange(socket, payload);
      });

      // End session (owner only)
      socket.on('end-session', (sessionId: string) => {
        console.log(`📥 Received end-session event for session: ${sessionId}`);
        this.handleEndSession(socket, sessionId);
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinSession(socket: Socket, payload: JoinSessionPayload) {
    const { sessionId, name } = payload;
    const session = this.sessions.get(sessionId);

    console.log(`🔍 JOIN SESSION REQUEST:`);
    console.log(`   - Session ID: ${sessionId}`);
    console.log(`   - Name: "${name}"`);
    console.log(`   - Session exists: ${!!session}`);

    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    if (session.status === 'ended') {
      socket.emit('error', { message: 'Session has ended' });
      return;
    }

    console.log(`📊 OWNERSHIP CHECK:`);
    console.log(`   - Current participants: ${session.participants.size}`);
    console.log(`   - Session ownerId: "${session.ownerId}"`);
    console.log(`   - Join name: "${name}"`);
    console.log(`   - Names match: ${name === session.ownerId}`);
    console.log(`   - Is first participant: ${session.participants.size === 0}`);

    // Create participant
    const participantId = uuidv4();
    const colorIndex = session.participants.size % PARTICIPANT_COLORS.length;
    const now = Date.now();
    const participant: Participant = {
      id: participantId,
      sessionId,
      name: name || `User ${session.participants.size + 1}`,
      color: PARTICIPANT_COLORS[colorIndex],
      status: 'active',
      lastActivityAt: now,
      joinedAt: Date.now(),
      socketId: socket.id
    };

    // If this is the owner joining (first participant and name matches ownerId), set ownerParticipantId
    const isOwner = session.participants.size === 0 && name === session.ownerId;
    console.log(`🎯 OWNERSHIP RESULT: ${isOwner}`);
    
    if (isOwner) {
      // Store the participantId as the owner's ID for ownership checks
      session.ownerParticipantId = participantId;
      console.log(`👑 Owner joining session ${sessionId}:`);
      console.log(`   - Owner name: ${name}`);
      console.log(`   - Session ownerId: ${session.ownerId}`);
      console.log(`   - Owner participantId: ${participantId}`);
    } else {
      console.log(`👤 Non-owner joining session ${sessionId}:`);
      console.log(`   - Name: ${name}`);
      console.log(`   - Session ownerId: ${session.ownerId}`);
      console.log(`   - Participants count: ${session.participants.size}`);
    }

    session.participants.set(participantId, participant);
    socket.join(sessionId);
    this.socketToParticipant.set(socket.id, { sessionId, participantId });

    console.log(`📤 SENDING session-joined with isOwner: ${isOwner}`);

    // Send session data to new participant
    socket.emit('session-joined', {
      sessionId,
      participantId,
      isOwner: isOwner, // Send ownership status to client
      session: {
        id: session.id,
        homeUrl: session.homeUrl,
        currentUrl: session.currentUrl,
        participants: Array.from(session.participants.values()),
        comments: session.comments
      }
    });

    // Notify other participants
    socket.to(sessionId).emit('participant-joined', {
      participant
    });

    console.log(`✅ ${participant.name} joined session ${sessionId}${isOwner ? ' (OWNER)' : ''}`);
  }

  private handleLeaveSession(socket: Socket) {
    const mapping = this.socketToParticipant.get(socket.id);
    if (!mapping) return;

    const { sessionId, participantId } = mapping;
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(participantId);
    if (participant) {
      // Mark participant as left instead of removing them
      participant.status = 'left';
      participant.lastActivityAt = Date.now();
      
      // Leave socket room
      socket.leave(sessionId);
      
      // Remove socket mapping
      this.socketToParticipant.delete(socket.id);

      // Notify other participants
      this.io.to(sessionId).emit('participant-left', {
        participantId
      });

      console.log(`👋 ${participant.name} left session ${sessionId}`);
    }
  }

  private handleCursorMove(socket: Socket, payload: CursorMovePayload) {
    const mapping = this.socketToParticipant.get(socket.id);
    if (!mapping) return;

    const { sessionId, participantId } = mapping;
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(participantId);
    if (participant) {
      participant.cursor = payload.cursor;
      participant.lastActivityAt = Date.now();
      
      // Update status to active if it was inactive
      if (participant.status === 'inactive') {
        participant.status = 'active';
      }
      
      // Broadcast to other participants
      socket.to(sessionId).emit('cursor-update', {
        participantId,
        cursor: payload.cursor
      });
    }
  }

  private handleAddComment(socket: Socket, payload: AddCommentPayload) {
    const mapping = this.socketToParticipant.get(socket.id);
    if (!mapping) return;

    const { sessionId, participantId } = mapping;
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(participantId);
    if (!participant) return;

    // Update participant activity
    participant.lastActivityAt = Date.now();
    if (participant.status === 'inactive') {
      participant.status = 'active';
    }

    const comment: Comment = {
      id: uuidv4(),
      sessionId,
      authorId: participantId,
      authorName: participant.name,
      authorColor: participant.color, // Include participant's assigned color
      elementSelector: payload.elementSelector,
      elementName: payload.elementName,
      text: payload.text,
      url: payload.url, // Store the URL where the comment was added
      position: payload.position,
      textContent: payload.textContent, // Store optional element text content
      createdAt: Date.now()
    };

    session.comments.push(comment);

    // Broadcast to all participants including sender
    this.io.to(sessionId).emit('comment-added', {
      comment
    });

    console.log(`💬 Comment added by ${participant.name} on ${payload.url} in session ${sessionId}`);
  }

  private handleEditComment(socket: Socket, payload: EditCommentPayload) {
    const mapping = this.socketToParticipant.get(socket.id);
    if (!mapping) return;

    const { sessionId, participantId } = mapping;
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const comment = session.comments.find(c => c.id === payload.commentId);
    if (!comment) {
      socket.emit('error', { message: 'Comment not found' });
      return;
    }

    // Only author can edit
    if (comment.authorId !== participantId) {
      socket.emit('error', { message: 'Not authorized to edit this comment' });
      return;
    }

    comment.text = payload.text;
    comment.editedAt = Date.now();

    // Broadcast to all participants
    this.io.to(sessionId).emit('comment-edited', {
      comment
    });

    console.log(`✏️ Comment edited by ${comment.authorName} in session ${sessionId}`);
  }

  private handleDeleteComment(socket: Socket, payload: DeleteCommentPayload) {
    const mapping = this.socketToParticipant.get(socket.id);
    if (!mapping) return;

    const { sessionId, participantId } = mapping;
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const commentIndex = session.comments.findIndex(c => c.id === payload.commentId);
    if (commentIndex === -1) {
      socket.emit('error', { message: 'Comment not found' });
      return;
    }

    const comment = session.comments[commentIndex];

    // Only author can delete
    if (comment.authorId !== participantId) {
      socket.emit('error', { message: 'Not authorized to delete this comment' });
      return;
    }

    session.comments.splice(commentIndex, 1);

    // Broadcast to all participants
    this.io.to(sessionId).emit('comment-deleted', {
      commentId: payload.commentId
    });

    console.log(`🗑️ Comment deleted by ${comment.authorName} in session ${sessionId}`);
  }

  private handleUrlChange(socket: Socket, payload: UrlChangePayload) {
    const mapping = this.socketToParticipant.get(socket.id);
    if (!mapping) return;

    const { sessionId, participantId } = mapping;
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Only owner can change URL
    if (session.ownerId !== participantId) {
      socket.emit('error', { message: 'Only session owner can change URL' });
      return;
    }

    session.currentUrl = payload.url;

    // Broadcast to all participants
    this.io.to(sessionId).emit('url-changed', {
      url: payload.url
    });

    console.log(`🌐 URL changed to ${payload.url} in session ${sessionId}`);
  }

  private handleEndSession(socket: Socket, sessionId: string) {
    const mapping = this.socketToParticipant.get(socket.id);
    if (!mapping) {
      console.error(`❌ No mapping found for socket ${socket.id}`);
      return;
    }

    const { participantId } = mapping;
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`❌ Session ${sessionId} not found`);
      return;
    }

    console.log(`🔍 Checking ownership for session ${sessionId}:`);
    console.log(`   - Session ownerId: ${session.ownerId}`);
    console.log(`   - Session ownerParticipantId: ${session.ownerParticipantId}`);
    console.log(`   - Participant ID: ${participantId}`);
    console.log(`   - Match (using ownerParticipantId): ${session.ownerParticipantId === participantId}`);

    // Only owner can end session - check using ownerParticipantId if available, otherwise fall back to ownerId
    const isOwner = session.ownerParticipantId 
      ? session.ownerParticipantId === participantId 
      : session.ownerId === participantId;
    
    if (!isOwner) {
      console.error(`❌ Ownership check failed: ownerParticipantId=${session.ownerParticipantId}, participantId=${participantId}`);
      socket.emit('error', { message: 'Only session owner can end session' });
      return;
    }

    session.status = 'ended';
    session.endedAt = Date.now();

    console.log(`🏁 Session ${sessionId} ended by owner`);
    console.log(`📊 Session stats: ${session.comments.length} comments, ${session.participants.size} participants`);

    // Notify all participants that session ended (without generating report)
    this.io.to(sessionId).emit('session-ended', {
      sessionId: session.id,
      homeUrl: session.homeUrl,
      comments: session.comments,
      participants: Array.from(session.participants.values())
    });

    console.log(`📤 Emitted session-ended event to all clients in room ${sessionId}`);

    // Disconnect all participants AFTER a delay to ensure they receive the event
    setTimeout(() => {
      console.log(`🔌 Disconnecting all sockets from session ${sessionId}`);
      this.io.in(sessionId).disconnectSockets(true);
    }, 1000); // 1 second delay to ensure event is received

    // Keep session in memory for viewing completed sessions
    // Sessions will be cleaned up after a longer delay (1 hour)
    setTimeout(() => {
      this.sessions.delete(sessionId);
      console.log(`🗑️ Cleaned up completed session ${sessionId}`);
    }, 3600000); // Keep for 1 hour
  }

  private handleDisconnect(socket: Socket) {
    this.handleLeaveSession(socket);
  }

  // Public API methods

  createSession(ownerId: string, homeUrl: string): Session {
    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      ownerId,
      homeUrl,
      currentUrl: homeUrl,
      participants: new Map(),
      comments: [],
      createdAt: Date.now(),
      status: 'active'
    };

    this.sessions.set(sessionId, session);
    console.log(`✨ Session created: ${sessionId} by ${ownerId}`);
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): Map<string, Session> {
    return this.sessions;
  }

  generateReport(session: Session): Promise<SessionReport> {
    // Generate basic report structure
    const basicReport = this.generateBasicReport(session);

    // If Anthropic client is available, generate LLM report
    if (this.anthropic && session.comments.length > 0) {
      return this.generateLLMReport(session, basicReport);
    }

    // Return basic report if no LLM available
    return Promise.resolve(basicReport);
  }

  private generateBasicReport(session: Session): SessionReport {
    // Group comments by element
    const commentsByElement = new Map<string, {
      elementSelector: string;
      elementName: string;
      comments: Comment[];
    }>();

    session.comments.forEach(comment => {
      const key = comment.elementSelector;
      if (!commentsByElement.has(key)) {
        commentsByElement.set(key, {
          elementSelector: comment.elementSelector,
          elementName: comment.elementName,
          comments: []
        });
      }
      commentsByElement.get(key)!.comments.push(comment);
    });

    // Count comments by participant
    const commentsByParticipant: Record<string, number> = {};
    session.comments.forEach(comment => {
      commentsByParticipant[comment.authorId] = (commentsByParticipant[comment.authorId] || 0) + 1;
    });

    const duration = (session.endedAt || Date.now()) - session.createdAt;

    return {
      sessionId: session.id,
      homeUrl: session.homeUrl,
      duration,
      participants: Array.from(session.participants.values()),
      commentsByElement: Array.from(commentsByElement.values()),
      summary: {
        totalComments: session.comments.length,
        totalParticipants: session.participants.size,
        commentsByParticipant
      }
    };
  }

  private async generateLLMReport(session: Session, basicReport: SessionReport): Promise<SessionReport> {
    if (!this.anthropic) {
      console.log('⚠️ Anthropic client not available, skipping LLM report');
      return basicReport;
    }

    try {
      console.log(`🤖 Generating LLM report for session ${session.id}...`);
      console.log(`📝 Preparing prompt with ${session.comments.length} comments...`);

      // Build comprehensive prompt with all session data
      const prompt = this.buildReportPrompt(session, basicReport);
      console.log(`📤 Sending prompt to Claude API (${prompt.length} characters)...`);

      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      console.log(`📥 Received response from Claude API`);

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      console.log(`🔍 Parsing LLM response (${content.text.length} characters)...`);

      // Parse the LLM response
      const llmReport = this.parseLLMResponse(content.text);

      console.log(`✅ LLM report parsed successfully`);
      if (llmReport) {
        console.log(`   - Executive summary: ${llmReport.executiveSummary.length} chars`);
        console.log(`   - Key findings: ${llmReport.keyFindings.length}`);
        console.log(`   - Recommendations: ${llmReport.recommendations.length}`);
        console.log(`   - Themes: ${llmReport.themes.length}`);
      }

      // Merge LLM report with basic report
      return {
        ...basicReport,
        llmReport
      };
    } catch (error) {
      console.error('❌ Error generating LLM report:', error);
      console.error('Error details:', error instanceof Error ? error.stack : String(error));
      // Return basic report if LLM fails
      return basicReport;
    }
  }

  private buildReportPrompt(session: Session, basicReport: SessionReport): string {
    const durationMinutes = Math.round(basicReport.duration / 60000);
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;
    const durationStr = durationHours > 0 
      ? `${durationHours} hour${durationHours > 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
      : `${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}`;

    // Build participant information
    const participantsInfo = Array.from(session.participants.values())
      .map(p => {
        const commentCount = basicReport.summary.commentsByParticipant[p.id] || 0;
        const joinedTime = new Date(p.joinedAt).toLocaleTimeString();
        return `- ${p.name} (joined at ${joinedTime}, contributed ${commentCount} comment${commentCount !== 1 ? 's' : ''})`;
      })
      .join('\n');

    // Build detailed comment information grouped by element
    const commentsByElementInfo = basicReport.commentsByElement.map(group => {
      const elementInfo = `Element: ${group.elementName} (Selector: ${group.elementSelector})`;
      const commentsInfo = group.comments.map(comment => {
        const timeStr = new Date(comment.createdAt).toLocaleTimeString();
        const editedStr = comment.editedAt ? ` (edited at ${new Date(comment.editedAt).toLocaleTimeString()})` : '';
        return `  - ${comment.authorName} at ${timeStr}${editedStr}: "${comment.text}"`;
      }).join('\n');
      return `${elementInfo}\n${commentsInfo}`;
    }).join('\n\n');

    // Build comment timeline
    const sortedComments = [...session.comments].sort((a, b) => a.createdAt - b.createdAt);
    const timelineInfo = sortedComments.map((comment, index) => {
      const timeStr = new Date(comment.createdAt).toLocaleTimeString();
      return `${index + 1}. [${timeStr}] ${comment.authorName} on ${comment.elementName}: "${comment.text}"`;
    }).join('\n');

    return `You are analyzing a collaborative feedback session for a webpage. Generate a comprehensive, structured report based on the following session data.

# Session Overview
- Session URL: ${session.homeUrl}
- Duration: ${durationStr}
- Total Participants: ${basicReport.summary.totalParticipants}
- Total Comments: ${basicReport.summary.totalComments}

# Participants
${participantsInfo}

# Comments by Element
${commentsByElementInfo}

# Comment Timeline
${timelineInfo}

# Your Task
Generate a structured report in JSON format with the following structure:
{
  "executiveSummary": "A 2-3 sentence overview of the session and key insights",
  "keyFindings": [
    "Finding 1 - specific insight from the comments",
    "Finding 2 - another insight",
    ...
  ],
  "recommendations": [
    "Recommendation 1 - actionable suggestion based on feedback",
    "Recommendation 2 - another suggestion",
    ...
  ],
  "detailedAnalysis": "A comprehensive paragraph analyzing patterns, themes, and insights from all comments. Be specific and reference particular elements and feedback.",
  "themes": [
    {
      "theme": "Theme name (e.g., 'Navigation Issues', 'Visual Design Concerns')",
      "description": "Description of this theme and why it emerged",
      "relatedComments": ["Comment text 1", "Comment text 2", ...]
    },
    ...
  ]
}

Important guidelines:
- Be specific and reference actual comments and elements
- Identify patterns and common concerns across multiple participants
- Provide actionable recommendations
- Group related comments into meaningful themes
- Focus on insights that would help improve the webpage
- Ensure all JSON is valid and properly formatted

Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  private parseLLMResponse(responseText: string): SessionReport['llmReport'] {
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      let jsonText = responseText.trim();
      
      // Remove markdown code blocks if present
      const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      // Parse JSON
      const parsed = JSON.parse(jsonText);

      // Validate structure
      if (!parsed.executiveSummary || !Array.isArray(parsed.keyFindings) || !Array.isArray(parsed.recommendations)) {
        throw new Error('Invalid report structure');
      }

      return {
        executiveSummary: parsed.executiveSummary,
        keyFindings: parsed.keyFindings || [],
        recommendations: parsed.recommendations || [],
        detailedAnalysis: parsed.detailedAnalysis || '',
        themes: parsed.themes || []
      };
    } catch (error) {
      console.error('❌ Error parsing LLM response:', error);
      // Return a fallback report
      return {
        executiveSummary: 'Unable to generate automated analysis. Please review comments manually.',
        keyFindings: [],
        recommendations: [],
        detailedAnalysis: responseText.substring(0, 1000), // Use raw response as fallback
        themes: []
      };
    }
  }
}

