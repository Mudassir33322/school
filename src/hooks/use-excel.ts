'use client';

import { useState, useCallback } from 'react';

export function useExcelData<T>(filename: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/data/${filename}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setData(json as T[]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filename]);

  return { data, loading, error, refetch };
}

export function useCreate<T>(filename: string) {
  const [creating, setCreating] = useState(false);

  const create = useCallback(
    async (payload: Partial<T>) => {
      setCreating(true);
      try {
        const res = await fetch(`/api/data/${filename}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create record');
        return (await res.json()) as T;
      } finally {
        setCreating(false);
      }
    },
    [filename]
  );

  return { create, creating };
}

export function useUpdate<T>(filename: string) {
  const [updating, setUpdating] = useState(false);

  const update = useCallback(
    async (id: string, payload: Partial<T>) => {
      setUpdating(true);
      try {
        const res = await fetch(`/api/data/${filename}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update record');
        return (await res.json()) as T;
      } finally {
        setUpdating(false);
      }
    },
    [filename]
  );

  return { update, updating };
}

export function useDelete(filename: string) {
  const [removing, setRemoving] = useState(false);

  const remove = useCallback(
    async (id: string) => {
      setRemoving(true);
      try {
        const res = await fetch(`/api/data/${filename}/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete record');
        return true;
      } finally {
        setRemoving(false);
      }
    },
    [filename]
  );

  return { remove, removing };
}
