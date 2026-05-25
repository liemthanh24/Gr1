'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getOrderStatus, Order } from '@/lib/api';

interface UsePollingResult {
  order: Order | null;
  isPolling: boolean;
  error: string | null;
  startPolling: (orderId: number) => void;
  stopPolling: () => void;
}

export function usePolling(interval: number = 2000): UsePollingResult {
  const [order, setOrder] = useState<Order | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const orderIdRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const startPolling = useCallback((orderId: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated');
      return;
    }

    orderIdRef.current = orderId;
    setIsPolling(true);
    setError(null);
    setOrder(null);

    // Immediately fetch once
    const fetchStatus = async () => {
      try {
        const data = await getOrderStatus(orderId, token);
        setOrder(data.order);

        // Stop polling if order is finalized
        if (data.order.status === 'confirmed' || data.order.status === 'cancelled') {
          stopPolling();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
        stopPolling();
      }
    };

    fetchStatus();

    // Set up interval
    intervalRef.current = setInterval(fetchStatus, interval);
  }, [interval, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { order, isPolling, error, startPolling, stopPolling };
}
