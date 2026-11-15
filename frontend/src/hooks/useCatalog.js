import { useEffect, useState } from 'react';
import api from '../services/api';

// Categories and locations are shared by every page. Serve the cached copy at once,
// then refresh it in the background when it is older than STALE_MS so admin changes appear.
const STALE_MS = 60 * 1000;
const EMPTY_LOCATIONS = { divisions: [], districts: [], areas: [] };

let cache = null;
let loadedAt = 0;
let inflight = null;
const listeners = new Set();

function load() {
  if (!inflight) {
    inflight = Promise.all([api.get('/categories'), api.get('/locations')])
      .then(([catRes, locRes]) => {
        cache = {
          categories: catRes.data?.data || [],
          locations: locRes.data?.data || EMPTY_LOCATIONS,
        };
        loadedAt = Date.now();
        listeners.forEach((fn) => fn(cache));
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

// Flatten root categories and their children into one list
export function flattenCategories(categories = []) {
  const out = [];
  categories.forEach((c) => {
    out.push({ ...c, depth: 0 });
    (c.children || []).forEach((child) => out.push({ ...child, depth: 1, parentName: c.name }));
  });
  return out;
}

export function useCatalog() {
  const [state, setState] = useState({
    categories: cache?.categories || [],
    locations: cache?.locations || EMPTY_LOCATIONS,
    loading: !cache,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const onData = (data) => active && setState({ ...data, loading: false, error: null });
    listeners.add(onData);

    if (!cache || Date.now() - loadedAt > STALE_MS) {
      load().catch((error) => {
        if (active && !cache) setState((s) => ({ ...s, loading: false, error }));
      });
    }

    return () => {
      active = false;
      listeners.delete(onData);
    };
  }, []);

  return state;
}
