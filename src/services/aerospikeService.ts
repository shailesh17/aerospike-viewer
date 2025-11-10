import { Namespace, Set as SetType, Record as RecordType, ServerStats } from '../types';

// The backend server is expected to be running on this port
const API_BASE_URL = 'http://localhost:8080/api';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
}

class AerospikeApiService {
    async connect(host: string, port: number, useAlternate?: boolean): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ host, port, useAlternate }),
        });
        return handleResponse(response);
    }

    async disconnect(): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/disconnect`, {
            method: 'POST',
        });
        return handleResponse(response);
    }

    async getStats(): Promise<ServerStats> {
        const response = await fetch(`${API_BASE_URL}/stats`);
        return handleResponse(response);
    }

    async getNamespaces(): Promise<Namespace[]> {
        const response = await fetch(`${API_BASE_URL}/namespaces`);
        const data = await handleResponse(response);
        return data.namespaces.map((name: string) => ({ name }));
    }

    async getSets(namespace: Namespace): Promise<SetType[]> {
        const response = await fetch(`${API_BASE_URL}/namespaces/${namespace.name}/sets`);
        const data = await handleResponse(response);
        return data.sets.map((set: { name: string, objects: number, data_used_bytes: number }) => 
            ({ ...set, namespace: namespace }));
    }

    async getRecords(namespace: Namespace, set: SetType, nextToken: string | null = null): Promise<{records: RecordType[], nextToken: string | null}> {
        let url = `${API_BASE_URL}/namespaces/${namespace.name}/sets/${set.name}/records`;
        if (nextToken) {
            url += `?nextToken=${encodeURIComponent(nextToken)}`;
        }
        const response = await fetch(url);
        return handleResponse(response);
    }
}

export const aerospikeService = new AerospikeApiService();
