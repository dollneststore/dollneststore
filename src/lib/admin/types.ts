import type { OrderChannel, OrderStatus } from "@/lib/types";

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  channel: OrderChannel;
  customerName: string;
  totalPence: number;
  createdAt: string;
};

export type AdminOrderItem = {
  id: string;
  productId: string | null;
  title: string;
  unitPricePence: number;
  quantity: number;
  imageUrl: string | null;
};

export type AdminOrder = AdminOrderListItem & {
  customerEmail: string | null;
  customerPhone: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingCounty: string | null;
  shippingPostcode: string | null;
  shippingCountry: string;
  subtotalPence: number;
  shippingPence: number;
  discountPence: number;
  carrier: string | null;
  trackingNumber: string | null;
  notes: string | null;
  paidAt: string | null;
  dispatchedAt: string | null;
  items: AdminOrderItem[];
};

export type ProductOption = {
  id: string;
  title: string;
  pricePence: number;
  stockQty: number;
};

export type ProductFilters = {
  q?: string;
  status?: string;
  collection?: string;
  stock?: string;
};

export type DashboardStats = {
  activeProducts: number;
  openOrders: number;
  orders30d: number;
  revenue30dPence: number;
  subscribers: number;
  recentOrders: AdminOrderListItem[];
  todo: {
    toDispatch: AdminOrderListItem[];
    toDispatchCount: number;
    awaitingPayment: number;
    activeOutOfStock: number;
    draftProducts: number;
    draftGuides: number;
    unlinkedReviews: number;
  };
};
