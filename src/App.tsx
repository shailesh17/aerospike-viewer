import React, { useState, useCallback, useEffect } from 'react';
import { Namespace, Record, SetsByNamespace, Set as SetType } from './types';
import { aerospikeService } from './services/aerospikeService';
import { getSchemaSummary } from './services/geminiService';
import NamespaceTree from './components/NamespaceTree';
import RecordTable from './components/RecordTable';
import Spinner from './components/Spinner';
import Modal from './components/Modal';

const App: React.FC = () => {
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [host, setHost] = useState<string>('localhost');
    const [port, setPort] = useState<string>('3101');
    const [useAlternate, setUseAlternate] = useState<boolean>(true);

    const [namespaces, setNamespaces] = useState<Namespace[]>([]);
    const [setsByNamespace, setSetsByNamespace] = useState<SetsByNamespace>({});
    const [records, setRecords] = useState<Record[]>([]);

    const [selectedNamespace, setSelectedNamespace] = useState<Namespace | null>(null);
    const [selectedSet, setSelectedSet] = useState<SetType | null>(null);

    const [loadingNamespaces, setLoadingNamespaces] = useState<boolean>(false);
    const [loadingSets, setLoadingSets] = useState<Namespace | null>(null);
    const [loadingRecords, setLoadingRecords] = useState<boolean>(false);

    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
    const [schemaSummary, setSchemaSummary] = useState<string>('');
    const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
    
    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsConnecting(true);
        setError(null);
        try {
            await aerospikeService.connect(host, parseInt(port, 10), useAlternate);
            setIsConnected(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await aerospikeService.disconnect();
        } catch (err: any) {
            console.error("Failed to disconnect:", err.message);
        } finally {
            setIsConnected(false);
            setError(null);
            setNamespaces([]);
            setSetsByNamespace({});
            setRecords([]);
            setSelectedNamespace(null);
            setSelectedSet(null);
        }
    };
    
    useEffect(() => {
        if (isConnected) {
            setLoadingNamespaces(true);
            aerospikeService.getNamespaces()
                .then(setNamespaces)
                .catch(err => setError(err.message))
                .finally(() => setLoadingNamespaces(false));
        }
    }, [isConnected]);

    const handleSelectNamespace = useCallback((namespace: Namespace) => {
        setSelectedNamespace(namespace);
        setLoadingSets(namespace);
        aerospikeService.getSets(namespace)
            .then(sets => {
                setSetsByNamespace(prev => ({ ...prev, [namespace.name]: sets }));
            })
            .catch(err => setError(err.message))
            .finally(() => setLoadingSets(null));
    }, [setSetsByNamespace, setSelectedNamespace, setLoadingSets, setError]);

    const handleSelectSet = useCallback(async (namespace: Namespace, set: SetType) => {
        setSelectedNamespace(namespace);
        setSelectedSet(set);
        setLoadingRecords(true);
        setLoadingSummary(true);
        setRecords([]);
        setError(null);
        try {
            const fetchedRecords = await aerospikeService.getRecords(namespace, set);
            setRecords(fetchedRecords);
            
            setIsSummaryModalOpen(true); 
            const summary = await getSchemaSummary(fetchedRecords, set.name);
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
                        <h1 className="text-3xl font-bold text-white mb-2 text-center">Aerospike Viewer</h1>
                        <p className="text-gray-400 mb-6 text-center">Connect to a local database cluster.</p>
                        
                        <form onSubmit={handleConnect}>
                            <div className="mb-4">
                                <label htmlFor="host" className="block text-sm font-medium text-gray-300 mb-1">Host</label>
                                <input 
                                    type="text" 
                                    id="host" 
                                    value={host}
                                    onChange={e => setHost(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="port" className="block text-sm font-medium text-gray-300 mb-1">Port</label>
                                <input 
                                    type="number" 
                                    id="port"
                                    value={port}
                                    onChange={e => setPort(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="mb-6 flex items-center">
                                <input
                                    type="checkbox"
                                    id="useAlternate"
                                    checked={useAlternate}
                                    onChange={e => setUseAlternate(e.target.checked)}
                                    className="h-4 w-4 bg-gray-800 border-gray-700 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="useAlternate" className="ml-2 block text-sm text-gray-300">
                                    Use Alternate Addresses
                                </label>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isConnecting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isConnecting ? <Spinner size="5" /> : 'Connect'}
                            </button>
                        </form>
                        
                        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                    </div>
                </div>
            );
        }
        
        if(loadingNamespaces) {
            return <div className="flex-1 flex items-center justify-center"><Spinner size="12" /></div>
        }

        return (
            <>
                <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 shrink-0">
                    <h1 className="text-xl font-bold text-white">Aerospike Viewer</h1>
                    <div className="flex items-center gap-4">
                         <span className="text-sm text-gray-400">
                            Connected to: <span className="font-semibold text-gray-200">{host}:{port}</span>
                        </span>
                        <button
                            onClick={handleDisconnect}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 rounded-md transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>
                </header>
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
            </>
        );
    };

    return (
        <main className="h-screen w-screen bg-gray-950 flex flex-col">
            {renderContent()}
            <Modal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                title={`AI Schema Summary for '${selectedSet?.name}'`}
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
