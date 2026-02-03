// Barrel exports for chat services

export {
  sendMessage,
  getMessages,
  subscribeToMessages,
  getUserChats,
  getLastMessage,
  checkChatAccess,
} from './chatService';
export type { SendMessageResult, MessagesResult } from './chatService';
