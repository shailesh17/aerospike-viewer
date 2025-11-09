
import { Namespace, Set, Record } from '../types';

// This is a mock Aerospike client to simulate a real connection for this frontend-only example.
// In a real application, this would be a backend service.

class MockAerospikeClient {
  private connected: boolean = false;

  connect(connectionString: string): Promise<void> {
    console.log(`Attempting to connect to ${connectionString}...`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (connectionString.includes('fail')) {
          this.connected = false;
          reject(new Error('Failed to connect to the cluster.'));
        } else {
          this.connected = true;
          console.log('Successfully connected to mock Aerospike cluster.');
          resolve();
        }
      }, 1000);
    });
  }

  getNamespaces(): Promise<Namespace[]> {
    if (!this.connected) return Promise.reject('Not connected');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { name: 'test' },
          { name: 'users' },
          { name: 'inventory' },
        ]);
      }, 500);
    });
  }

  getSets(namespace: string): Promise<Set[]> {
    if (!this.connected) return Promise.reject('Not connected');
    return new Promise((resolve) => {
      setTimeout(() => {
        let sets: Set[] = [];
        if (namespace === 'test') {
          sets = [{ name: 'test_set', namespace }];
        } else if (namespace === 'users') {
          sets = [{ name: 'profiles', namespace }, { name: 'activity_log', namespace }];
        } else if (namespace === 'inventory') {
          sets = [{ name: 'products', namespace }, { name: 'warehouses', namespace }];
        }
        resolve(sets);
      }, 700);
    });
  }

  getRecords(namespace: string, set: string): Promise<Record[]> {
    if (!this.connected) return Promise.reject('Not connected');
    return new Promise((resolve) => {
      setTimeout(() => {
        const records: Record[] = [];
        const recordCount = Math.floor(Math.random() * 500) + 500; // between 500 and 1000
        for (let i = 0; i < recordCount; i++) {
            let bins: Record['bins'] = {};
            if (namespace === 'users' && set === 'profiles') {
                bins = {
                    userId: `user_${i}`,
                    username: `user${i}`,
                    email: `user${i}@example.com`,
                    age: Math.floor(Math.random() * 50) + 20,
                    isActive: Math.random() > 0.2,
                    lastLogin: new Date(Date.now() - Math.random() * 1e10).toISOString(),
                    metadata: { theme: 'dark', notifications: { email: true, sms: false } },
                    tags: ['beta', 'subscriber']
                };
            } else if (namespace === 'inventory' && set === 'products') {
                bins = {
                    productId: `prod_${i}`,
                    name: `Product ${i}`,
                    price: parseFloat((Math.random() * 100).toFixed(2)),
                    inStock: Math.floor(Math.random() * 100),
                    specs: {
                        weight: `${Math.random().toFixed(2)}kg`,
                        dimensions: { w: 10, h: 20, d: 5 }
                    }
                };
            } else {
                 bins = {
                    id: i,
                    name: `record_${i}`,
                    value: Math.random(),
                    details: {
                        timestamp: Date.now(),
                        source: 'mock'
                    }
                };
            }
          records.push({ key: `key_${i}`, bins });
        }
        resolve(records);
      }, 1500);
    });
  }
}

export const aerospikeService = new MockAerospikeClient();
