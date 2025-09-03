export interface Conversation {
  id: string;
  tenantId: string;
  pageId: string;
  psid: string;
  lastMessageAt: string;
  unreadCount: number;
  assigneeUserId: string | null;
  status: string;
  pageTokenEnc: string; // encrypted page access token
  name?: string;
  profilePic?: string;
}

export type MessageDirection = 'inbound' | 'outbound';

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  mid: string;
  text: string | null;
  attachmentsJson: string | null;
  timestamp: string;
  deliveryState: string | null;
  readAt: string | null;
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  data: T;
}
