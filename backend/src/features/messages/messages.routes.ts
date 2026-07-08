import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { asyncHandler } from '../../shared/middleware/asyncHandler.js';
import { messagesController } from './messages.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', asyncHandler(messagesController.getConversations));
router.post('/start', asyncHandler(messagesController.startConversation));
router.get('/:conversationId', asyncHandler(messagesController.getMessages));
router.post('/:conversationId', asyncHandler(messagesController.sendMessage));
router.put('/:conversationId/messages/:messageId', asyncHandler(messagesController.editMessage));
router.delete('/:conversationId/messages/:messageId', asyncHandler(messagesController.deleteMessage));
router.post('/:conversationId/messages/:messageId/pin', asyncHandler(messagesController.pinMessage));
router.delete('/:conversationId/messages/:messageId/pin', asyncHandler(messagesController.unpinMessage));
router.get('/:conversationId/pinned', asyncHandler(messagesController.getPinnedMessages));

export const messagesRouter = router;
export default router;
