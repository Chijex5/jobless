const baseUrl = "http:/192.168.227.58:8000";

// create an easy to use API wrapper around fetch
export const api = {
    get: async (endpoint: string) => {
        const res = await fetch(`${baseUrl}${endpoint}`);
        if (!res.ok) {
            throw new Error('Failed to fetch data');
        }
        return res.json();
    },
    post: async (endpoint: string, data: any) => {
        const res = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            throw new Error('Failed to post data');
        }
        return res.json();
    },
    put: async (endpoint: string, data: any) => {
        const res = await fetch(`${baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            throw new Error('Failed to put data');
        }
        return res.json();
    },
    delete: async (endpoint: string) => {
        const res = await fetch(`${baseUrl}${endpoint}`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            throw new Error('Failed to delete data');
        }
        return res.json();
    },
    patch: async (endpoint: string, data: any) => {
        const res = await fetch(`${baseUrl}${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            throw new Error('Failed to patch data');
        }
        return res.json();
    },
}