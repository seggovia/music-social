import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { messagesController } from './messages.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', messagesController.getConversations);
router.post('/start', messagesController.startConversation);
router.get('/:conversationId', messagesController.getMessages);
router.post('/:conversationId', messagesController.sendMessage);

export const messagesRouter = router;
export default router;
