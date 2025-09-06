export interface FacebookConnection {
  id: string;
  tenantId: string;
  pageId: string;
  pageName: string;
  connectedByUserId: string | null;
  status: string;
  connectedAt: string | null;
}

export interface Conversation {
  id: string;
  tenantId: string;
  pageId: string;
  psid: string;
  lastMessageAt: string;
  unreadCount: number;
  assigneeUserId: string | null;
  status: string;
  name?: string;
  profilePic?: string;
}

export type MessageDirection = "inbound" | "outbound";

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

export interface MessageAttachment {
  type: string;
  payload?: {
    url?: string;
    sticker_id?: string;
    animated_url?: string;
  };
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  data: T;
}
