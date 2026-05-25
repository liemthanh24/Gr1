const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Auth
export async function register(email: string, password: string) {
  return fetchAPI<{ token: string; user: { id: number; email: string } }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  return fetchAPI<{ token: string; user: { id: number; email: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Events
export async function getEvents(token?: string) {
  return fetchAPI<{ events: Event[] }>('/events', { token });
}

export async function getEvent(id: number, token?: string) {
  return fetchAPI<{ event: Event; tickets: Ticket[] }>(`/events/${id}`, { token });
}

// Booking
export async function bookTicket(eventId: number, seatCode: string, token: string) {
  return fetchAPI<{ order_id: number; message: string }>('/tickets/book', {
    method: 'POST',
    body: JSON.stringify({ event_id: eventId, seat_code: seatCode }),
    token,
  });
}

// Orders
export async function getOrderStatus(orderId: number, token: string) {
  return fetchAPI<{ order: Order }>(`/orders/${orderId}/status`, { token });
}

export async function getUserOrders(token: string) {
  return fetchAPI<{ orders: Order[] }>('/orders', { token });
}

// Types
export interface Event {
  id: number;
  name: string;
  description: string;
  venue: string;
  image_url: string;
  total_tickets: number;
  available_tickets: number;
  price: number;
  event_date: string;
}

export interface Ticket {
  id: number;
  event_id: number;
  seat_code: string;
  is_locked: boolean;
}

export interface Order {
  id: number;
  user_id: number;
  event_id: number;
  ticket_id: number | null;
  seat_code: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  event_name: string;
}
