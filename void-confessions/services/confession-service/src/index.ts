import express from 'express';
import { ConfessionService } from './services/ConfessionService';
import { InMemoryConfessionRepository } from './repositories/InMemoryConfessionRepository';

const app = express();
app.use(express.json());

const repository = new InMemoryConfessionRepository();
const confessionService = new ConfessionService(repository);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'confession-service',
  });
});

// Get all confessions
app.get('/confessions', async (req, res) => {
  const { status, page = '1', limit = '20' } = req.query;
  const confessions = await confessionService.getConfessions({
    status: status as string | undefined,
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
  });
  res.json({ success: true, data: confessions });
});

// Get single confession
app.get('/confessions/:id', async (req, res) => {
  const confession = await confessionService.getConfessionById(req.params.id);
  if (!confession) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Confession not found' },
    });
  }
  res.json({ success: true, data: confession });
});

// Create confession
app.post('/confessions', async (req, res) => {
  const { content, tags } = req.body;
  const confession = await confessionService.createConfession({ content, tags });
  res.status(201).json({ success: true, data: confession });
});

// Update confession status (for moderation)
app.patch('/confessions/:id/status', async (req, res) => {
  const { status, moderatorId, notes } = req.body;
  const confession = await confessionService.updateStatus(
    req.params.id,
    status,
    moderatorId,
    notes
  );
  if (!confession) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Confession not found' },
    });
  }
  res.json({ success: true, data: confession });
});

// Get moderation stats
app.get('/moderation/stats', async (_req, res) => {
  const stats = await confessionService.getModerationStats();
  res.json({ success: true, data: stats });
});

// Get moderation queue
app.get('/moderation/queue', async (_req, res) => {
  const queue = await confessionService.getModerationQueue();
  res.json({ success: true, data: queue });
});

const port = parseInt(process.env.PORT || '3001', 10);
app.listen(port, () => {
  console.log(`Confession service running on port ${port}`);
});
