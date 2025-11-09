
import React, { useState, useCallback, useEffect } from 'react';
import { Namespace, Set, Record, SetsByNamespace } from './types';
import { aerospikeService } from './services/aerospikeService';
import { getSchemaSummary } from './services/geminiService';
import NamespaceTree from './components/NamespaceTree';
import RecordTable from './components/RecordTable';
import Spinner from './components/Spinner';
import Modal from './components/Modal';

const App: React.FC = () => {
    const [connectionString, setConnectionString] = useState<string>('aerospike://127.0.0.1:3000');
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [namespaces, setNamespaces] = useState<Namespace[]>([]);
    const [setsByNamespace, setSetsByNamespace] = useState<SetsByNamespace>({});
    const [records, setRecords] = useState<Record[]>([]);

    const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
    const [selectedSet, setSelectedSet] = useState<string | null>(null);

    const [loadingNamespaces, setLoadingNamespaces] = useState<boolean>(false);
    const [loadingSets, setLoadingSets] = useState<string | null>(null);
    const [loadingRecords, setLoadingRecords] = useState<boolean>(false);

    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
    const [schemaSummary, setSchemaSummary] = useState<string>('');
    const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

    const handleConnect = useCallback(async () => {
        setIsConnecting(true);
        setError(null);
        try {
            await aerospikeService.connect(connectionString);
            setIsConnected(true);
        } catch (err: any) {
            setError(err.message || 'Failed to connect');
        } finally {
            setIsConnecting(false);
        }
    }, [connectionString]);
    
    useEffect(() => {
        if (isConnected) {
            setLoadingNamespaces(true);
            aerospikeService.getNamespaces()
                .then(setNamespaces)
                .catch(err => setError(err.message))
                .finally(() => setLoadingNamespaces(false));
        }
    }, [isConnected]);

    const handleSelectNamespace = useCallback((namespace: string) => {
        setSelectedNamespace(namespace);
        // Only fetch if not already fetched
        if (!setsByNamespace[namespace]) {
            setLoadingSets(namespace);
            aerospikeService.getSets(namespace)
                .then(sets => {
                    setSetsByNamespace(prev => ({ ...prev, [namespace]: sets }));
                })
                .catch(err => setError(err.message))
                .finally(() => setLoadingSets(null));
        }
    }, [setsByNamespace]);

    const handleSelectSet = useCallback(async (namespace: string, set: string) => {
        setSelectedNamespace(namespace);
        setSelectedSet(set);
        setLoadingRecords(true);
        setLoadingSummary(true);
        setRecords([]);
        setError(null);
        try {
            const fetchedRecords = await aerospikeService.getRecords(namespace, set);
            setRecords(fetchedRecords);
            
            // Open modal immediately to show loading state
            setIsSummaryModalOpen(true); 
            const summary = await getSchemaSummary(fetchedRecords, set);
            setSchemaSummary(summary);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingRecords(false);
            setLoadingSummary(false);
        }
    }, []);

    const renderContent = () => {
        if (!isConnected) {
            return (
                <div className="flex-1 flex flex-col justify-center items-center bg-gray-950 p-8">
                    <div className="w-full max-w-md bg-gray-900 p-8 rounded-lg shadow-2xl">
                        <h1 className="text-3xl font-bold text-center text-white mb-2">Aerospike Viewer</h1>
                        <p className="text-center text-gray-400 mb-6">Enter your cluster connection string to begin.</p>
                        <input
                            type="text"
                            value={connectionString}
                            onChange={(e) => setConnectionString(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                            placeholder="e.g., aerospike://127.0.0.1:3000"
                        />
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isConnecting ? <Spinner size="5" /> : 'Connect'}
                        </button>
                        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                    </div>
                </div>
            );
        }
        
        if(loadingNamespaces) {
            return <div className="flex-1 flex items-center justify-center"><Spinner size="12" /></div>
        }

        return (
            <div className="flex flex-1 overflow-hidden">
                <NamespaceTree
                    namespaces={namespaces}
                    setsByNamespace={setsByNamespace}
                    onSelectNamespace={handleSelectNamespace}
                    onSelectSet={handleSelectSet}
                    selectedNamespace={selectedNamespace}
                    selectedSet={selectedSet}
                    loadingSets={loadingSets}
                />
                <RecordTable
                    records={records}
                    isLoading={loadingRecords}
                    selectedSet={selectedSet}
                    selectedNamespace={selectedNamespace}
                />
            </div>
        );
    };

    return (
        <main className="h-screen w-screen bg-gray-950 flex flex-col">
            {renderContent()}
            <Modal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                title={`AI Schema Summary for '${selectedSet}'`}
            >
                {loadingSummary ? (
                     <div className="flex flex-col items-center justify-center h-48">
                        <Spinner size="8" />
                        <p className="mt-4 text-gray-400">AI is analyzing the schema...</p>
                    </div>
                ) : (
                    <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-strong:text-white prose-ul:text-gray-300">
                      <div dangerouslySetInnerHTML={{ __html: schemaSummary.replace(/\n/g, '<br />') }} />
                    </div>
                )}
            </Modal>
        </main>
    );
};

export default App;
