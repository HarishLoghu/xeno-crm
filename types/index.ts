export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  healthScore: number;
  healthLabel: string;
  engagementProfile: Record<string, unknown>;
  _count?: {
    orders: number;
    communications: number;
  };
  orders?: Order[];
  communications?: Communication[];
  lastMessaged?: string | null;
  bestChannel?: string;
  totalOrders?: number;
}

export interface Order {
  id: string;
  customerId: string;
  amount: number;
  productName: string;
  category: string | null;
  orderedAt: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  goal: string;
  status: string;
  channel: string;
  messageTemplate: string;
  segmentRule: Record<string, unknown>;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  autopsy: string | null;
  createdAt: string;
  updatedAt: string;
  communications?: Communication[];
}

export interface Communication {
  id: string;
  campaignId: string;
  customerId: string;
  channel: string;
  message: string;
  status: string;
  receiptId: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  convertedAt: string | null;
  failedAt: string | null;
  failReason: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  campaign?: Campaign;
}

export interface InsightCardData {
  id: string;
  type: 'win_back' | 'churn_risk' | 'cross_sell' | 'over_messaging';
  title: string;
  description: string;
  segmentData: Record<string, unknown>;
  dismissed: boolean;
  createdAt: string;
}

export interface CampaignFunnelStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
}

export interface SegmentResponse {
  rule: Record<string, unknown>;
  explanation: string;
  customerCount: number;
  customers: Customer[];
}

export interface MessageResponse {
  message: string;
}

export interface SuppressResponse {
  suppressedCount: number;
  reason: string;
}
