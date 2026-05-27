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

export const useInteligence = () => {
    const { data, isLoading, error } = useSWR<Signal>('/api/inteligence', () => fetcher("http:/192.168.227.58:8000/signals"));
    return { data, isLoading, error };
}

export const useInteligenceById  = (id:  string) => {
    const  { data, isLoading, error } = useSWR<IntelligenceSignal>(id ? `/api/inteligence/${id}` : null, () => fetcher(`http://192.168.227.58:8000/signals/${id}`));
    return { data, isLoading, error };
}

export const useRelatedInteligenceById  = (id:  string) => {
    const  { data, isLoading, error } = useSWR<IntelligenceSignal>(id ? `/api/${id}/related` : null, () => fetcher(`http://192.168.227.58:8000/signals/${id}/related`));
    return { data, isLoading, error };
}

