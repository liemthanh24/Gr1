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
export async function register(name: string, email: string, password: string) {
  return fetchAPI<{ token: string; user: { id: number; name: string; email: string; role: string } }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function login(email: string, password: string) {
  return fetchAPI<{ token: string; user: { id: number; name: string; email: string; role: string; phone?: string; cccd?: string; dob?: string; address?: string } }>('/auth/login', {
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
export async function bookTicket(eventId: number, seatCodes: string[], token: string) {
  return fetchAPI<{ order_ids: number[]; message: string }>('/tickets/book', {
    method: 'POST',
    body: JSON.stringify({ event_id: eventId, seat_codes: seatCodes }),
    token,
  });
}

// Orders
// Profile
export async function getProfile(token: string) {
  return fetchAPI<{ user: User }>('/auth/me', { token });
}

export async function updateProfile(data: Partial<User>, token: string) {
  return fetchAPI<User>('/auth/profile', {
    method: 'PUT', body: JSON.stringify(data), token
  });
}

export async function getOrderStatus(orderId: number, token: string) {
  return fetchAPI<{ order: Order }>(`/orders/${orderId}/status`, { token });
}

export async function getUserOrders(token: string) {
  return fetchAPI<{ orders: Order[] }>('/orders', { token });
}

// Admin
export async function adminGetEvents(token: string) {
  return fetchAPI<{ events: Event[] }>('/admin/events', { token });
}

export async function createEvent(data: Partial<Event>, token: string) {
  return fetchAPI<Event>('/admin/events', {
    method: 'POST', body: JSON.stringify(data), token
  });
}

export async function updateEvent(id: number, data: Partial<Event>, token: string) {
  return fetchAPI<Event>(`/admin/events/${id}`, {
    method: 'PUT', body: JSON.stringify(data), token
  });
}

export async function deleteEvent(id: number, token: string) {
  return fetchAPI<{ message: string }>(`/admin/events/${id}`, {
    method: 'DELETE', token
  });
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

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  cccd: string;
  dob: string;
  address: string;
  created_at: string;
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
