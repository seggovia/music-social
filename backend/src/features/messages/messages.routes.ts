import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { messagesController } from './messages.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', messagesController.getConversations);
router.post('/start', messagesController.startConversation);
router.get('/:conversationId', messagesController.getMessages);
router.post('/:conversationId', messagesController.sendMessage);
router.put('/:conversationId/messages/:messageId', messagesController.editMessage);
router.delete('/:conversationId/messages/:messageId', messagesController.deleteMessage);
router.post('/:conversationId/messages/:messageId/pin', messagesController.pinMessage);
router.delete('/:conversationId/messages/:messageId/pin', messagesController.unpinMessage);
router.get('/:conversationId/pinned', messagesController.getPinnedMessages);

export const messagesRouter = router;
export default router;
