import React, { useMemo } from 'react';
import { Namespace, Record, Set as SetType } from '../types';
import JsonViewer from './JsonViewer';
import Spinner from './Spinner';

interface RecordTableProps {
  records: Record[];
  isLoading: boolean;
  selectedSet: SetType | null;
  selectedNamespace: Namespace | null;
  currentPage: number;
  totalRecords: number;
  hasMorePages: boolean;
  onPageChange: (page: number) => void;
}

const RecordTable: React.FC<RecordTableProps> = ({ records, isLoading, selectedSet, selectedNamespace, currentPage, totalRecords, hasMorePages, onPageChange}) => {
  const headers = useMemo(() => {
    if (records.length === 0) return [];
    const headerSet = new Set<string>();
    records.forEach(record => {
      Object.keys(record.bins).forEach(bin => headerSet.add(bin));
    });
    return ['PK', ...Array.from(headerSet)];
  }, [records]);

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="text-center">
          <Spinner size="12" />
          <p className="mt-4 text-lg text-gray-400">Fetching records...</p>
        </div>
      </div>
    );
  }

  if (!selectedSet) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <p className="text-xl text-gray-500">Select a set to view its records</p>
      </div>
    );
  }

  if (records.length === 0 && selectedSet) {
     return (
      <div className="flex-1 flex justify-center items-center">
        <p className="text-xl text-gray-500">No records found in {selectedNamespace?.name}/{selectedSet?.name}</p>
      </div>
    );
  }


  return (
    <div className="flex-1 p-6 overflow-auto">
      <h2 className="text-2xl font-bold mb-4 text-white">
        Records for <span className="text-blue-400">{selectedNamespace?.name}/{selectedSet?.name}</span> 
        ({records.length} of {totalRecords > records.length ? `~${totalRecords}` : records.length} shown)
      </h2>
      <div className="overflow-x-auto bg-gray-900 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              {headers.map((header) => (
                <th
                  key={String(header)}
                  scope="col"
                  className="sticky top-0 bg-gray-800 px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-800">
            {records.map((record) => (
              <tr key={String(record.key)} className="hover:bg-gray-800/50 transition-colors">
                {headers.map((header) => {
                  if (header === 'PK') {
                    return (
                      <td key={`${String(record.key)}-PK`} className="px-6 py-4 whitespace-nowrap align-top font-mono text-sm text-cyan-400">
                        {typeof record.key === 'object' ? JSON.stringify(record.key) : String(record.key)}
                      </td>
                    );
                  }
                  // FIX: Assign bin value to a constant to allow TypeScript's control flow analysis
                  // to correctly narrow the type for the conditional rendering below. This resolves
                  // the issue where properties of objects with index signatures are not narrowed.
                  const binValue = record.bins[header];
                  return (
                    <td key={`${String(record.key)}-${header}`} className="px-6 py-4 whitespace-nowrap align-top">
                      {typeof binValue === 'object' && binValue !== null ? (
                        <JsonViewer data={binValue} />
                      ) : (
                        <span className="text-sm text-gray-300">{String(binValue ?? 'null')}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center items-center mt-4">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-l disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="px-4 text-white">Page {currentPage + 1}</span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasMorePages}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-r disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default RecordTable;