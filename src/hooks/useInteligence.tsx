import useSWR from 'swr';
import { IntelligenceSignal } from '@/data/mock';

export interface Signal {
    signals: IntelligenceSignal[]
    total:   number
    page:    number
    pages:   number
    limit:   number
}

export const fetcher = async (url: string) => {
    const res  = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    return res.json();
}

export const useInteligence = (querys?: string[]) => {
  const queryString = querys?.length
    ? `?${querys.join('&')}`
    : '';

  const {
    data,
    isLoading,
    error,
    mutate,
  } = useSWR<Signal>(
    '/api/inteligence' + queryString,
    () =>
      fetcher(
        `https://ai-scraper-tb7n.onrender.com/signals${queryString}`
      )
  );

  // Force refetch manually
  const forcedRefetch = async () => {
    return await mutate();
  };

  return {
    data,
    isLoading,
    error,
    forcedRefetch,
  };
};

export const useInteligenceById  = (id:  string) => {
    const  { data, isLoading, error } = useSWR<IntelligenceSignal>(id ? `/api/inteligence/${id}` : null, () => fetcher(`https://ai-scraper-tb7n.onrender.com/signals/${id}`));
    return { data, isLoading, error };
}

export const useRelatedInteligenceById  = (id:  string) => {
    const  { data, isLoading, error } = useSWR<IntelligenceSignal>(id ? `/api/${id}/related` : null, () => fetcher(`https://ai-scraper-tb7n.onrender.com/signals/${id}/related`));
    return { data, isLoading, error };
}

