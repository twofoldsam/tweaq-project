import express, { Express } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { SessionManager } from './SessionManager';
import { v4 as uuidv4 } from 'uuid';

const app: Express = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

// Get Anthropic API key from environment
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const sessionManager = new SessionManager(httpServer, anthropicApiKey);

// REST API endpoints

// Create session
app.post('/api/sessions', (req, res) => {
  const { ownerId, homeUrl } = req.body;
  
  if (!homeUrl) {
    return res.status(400).json({ error: 'homeUrl is required' });
  }

  const ownerIdFinal = ownerId || uuidv4();
  const session = sessionManager.createSession(ownerIdFinal, homeUrl);

  res.json({
    success: true,
    session: {
      id: session.id,
      ownerId: session.ownerId,
      homeUrl: session.homeUrl,
      shareLink: `tweaq://session/${session.id}`
    }
  });
});

// Get session info
app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    success: true,
    session: {
      id: session.id,
      homeUrl: session.homeUrl,
      currentUrl: session.currentUrl,
      status: session.status,
      participantCount: session.participants.size,
      commentCount: session.comments.length,
      createdAt: session.createdAt,
      endedAt: session.endedAt,
      comments: session.comments,
      participants: Array.from(session.participants.values())
    }
  });
});

// Get completed sessions (for owner)
app.get('/api/sessions', (req, res) => {
  const { ownerId } = req.query;
  
  // Get all completed sessions
  const completedSessions = Array.from(sessionManager.getAllSessions().values())
    .filter(session => session.status === 'ended')
    .map(session => ({
      id: session.id,
      homeUrl: session.homeUrl,
      createdAt: session.createdAt,
      endedAt: session.endedAt,
      commentCount: session.comments.length,
      participantCount: session.participants.size,
      ownerId: session.ownerId
    }))
    .sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0)); // Most recent first

  res.json({
    success: true,
    sessions: completedSessions
  });
});

// Get session report
app.get('/api/sessions/:sessionId/report', async (req, res) => {
  const { sessionId } = req.params;
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    const report = await sessionManager.generateReport(session);
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Session Manager server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
});

export default app;

