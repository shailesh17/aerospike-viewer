import React, { useMemo } from 'react';
import { Namespace, Record, Set as SetType } from '../types';
import JsonViewer from './JsonViewer';
import Spinner from './Spinner';

interface RecordTableProps {
  records: Record[];
  isLoading: boolean;
  selectedSet: SetType | null;
  selectedNamespace: Namespace | null;
}

const RecordTable: React.FC<RecordTableProps> = ({ records, isLoading, selectedSet, selectedNamespace }) => {
  const headers = useMemo(() => {
    if (records.length === 0) return [];
    const headerSet = new Set<string>();
    records.forEach(record => {
      Object.keys(record.bins).forEach(bin => headerSet.add(bin));
    });
    return Array.from(headerSet);
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
        Records for <span className="text-blue-400">{selectedNamespace?.name}/{selectedSet?.name}</span> ({records.length} shown)
      </h2>
      <div className="overflow-x-auto bg-gray-900 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
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
              <tr key={record.key} className="hover:bg-gray-800/50 transition-colors">
                {headers.map((header) => {
                  // FIX: Assign bin value to a constant to allow TypeScript's control flow analysis
                  // to correctly narrow the type for the conditional rendering below. This resolves
                  // the issue where properties of objects with index signatures are not narrowed.
                  const binValue = record.bins[header];
                  return (
                    <td key={`${record.key}-${header}`} className="px-6 py-4 whitespace-nowrap align-top">
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
    </div>
  );
};

export default RecordTable;