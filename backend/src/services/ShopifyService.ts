import { config } from "../config/env";

export interface ShopifyOrder {
  id: string;
  orderNumber: number;
  totalPrice: string;
  subtotalPrice: string;
  totalTax: string;
  currency: string;
  customerId?: string;
  createdAt: string;
  lineItems: {
    productId: string;
    title: string;
    quantity: number;
    price: string;
  }[];
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  variants: {
    id: string;
    price: string;
    sku?: string;
  }[];
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  ordersCount: number;
  totalSpent: string;
  createdAt: string;
}

export class ShopifyService {
  private shop: string = "";
  private accessToken: string = "";

  /**
   * Initialize with shop credentials
   */
  init(shop: string, accessToken: string): void {
    this.shop = shop;
    this.accessToken = accessToken;
  }

  /**
   * Make authenticated request to Shopify Admin API
   */
  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: object
  ): Promise<T> {
    if (!this.shop || !this.accessToken) {
      throw new Error("ShopifyService not initialized - call init() first");
    }

    const url = `https://${this.shop}/admin/api/2024-01/${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get orders within date range
   */
  async getOrders(from: string, to: string, limit: number = 250): Promise<ShopifyOrder[]> {
    const data = await this.request<{ orders: any[] }>(
      `orders.json?status=any&created_at_min=${from}&created_at_max=${to}&limit=${limit}`
    );

    return data.orders.map((order) => ({
      id: order.id.toString(),
      orderNumber: order.order_number,
      totalPrice: order.total_price,
      subtotalPrice: order.subtotal_price,
      totalTax: order.total_tax,
      currency: order.currency,
      customerId: order.customer?.id?.toString(),
      createdAt: order.created_at,
      lineItems: order.line_items.map((item: any) => ({
        productId: item.product_id?.toString(),
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
    }));
  }

  /**
   * Get products
   */
  async getProducts(limit: number = 250): Promise<ShopifyProduct[]> {
    const data = await this.request<{ products: any[] }>(
      `products.json?limit=${limit}`
    );

    return data.products.map((product) => ({
      id: product.id.toString(),
      title: product.title,
      handle: product.handle,
      status: product.status,
      variants: product.variants.map((v: any) => ({
        id: v.id.toString(),
        price: v.price,
        sku: v.sku,
      })),
    }));
  }

  /**
   * Get customers
   */
  async getCustomers(from?: string, limit: number = 250): Promise<ShopifyCustomer[]> {
    let endpoint = `customers.json?limit=${limit}`;
    if (from) {
      endpoint += `&created_at_min=${from}`;
    }

    const data = await this.request<{ customers: any[] }>(endpoint);

    return data.customers.map((customer) => ({
      id: customer.id.toString(),
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      ordersCount: customer.orders_count,
      totalSpent: customer.total_spent,
      createdAt: customer.created_at,
    }));
  }

  /**
   * Get shop info
   */
  async getShopInfo(): Promise<{ name: string; domain: string; currency: string }> {
    const data = await this.request<{ shop: any }>("shop.json");
    
    return {
      name: data.shop.name,
      domain: data.shop.domain,
      currency: data.shop.currency,
    };
  }

  /**
   * Calculate revenue metrics from orders
   */
  calculateRevenueMetrics(orders: ShopifyOrder[]): {
    totalRevenue: number;
    orderCount: number;
    aov: number;
    uniqueCustomers: number;
  } {
    const totalRevenue = orders.reduce(
      (sum, order) => sum + parseFloat(order.totalPrice),
      0
    );
    const orderCount = orders.length;
    const aov = orderCount > 0 ? totalRevenue / orderCount : 0;
    const uniqueCustomers = new Set(
      orders.map((o) => o.customerId).filter(Boolean)
    ).size;

    return {
      totalRevenue,
      orderCount,
      aov,
      uniqueCustomers,
    };
  }
}
