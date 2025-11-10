import React, { useState } from 'react';
// FIX: Removed the conflicting `Set` interface import to allow using the native JavaScript `Set` collection.
import { Namespace, SetsByNamespace, Set as SetType } from '../types';
import Spinner from './Spinner';

interface NamespaceTreeProps {
  namespaces: Namespace[];
  setsByNamespace: SetsByNamespace;
  onSelectNamespace: (namespace: Namespace) => void;
  onSelectSet: (namespace: Namespace, set: SetType) => void;
  selectedNamespace: Namespace | null;
  selectedSet: SetType | null;
  loadingSets: Namespace | null;
}

const NamespaceIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const SetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 ml-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
);

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0';
  const sizes = ['', 'K', 'M', 'G', 'T'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i === 0) return `${bytes}B`;
  return `${(bytes / (1024 ** i)).toFixed(1)}${sizes[i]}`;
};

const NamespaceTree: React.FC<NamespaceTreeProps> = ({
  namespaces,
  setsByNamespace,
  onSelectNamespace,
  onSelectSet,
  selectedNamespace,
  selectedSet,
  loadingSets,
}) => {
  const [openNamespaces, setOpenNamespaces] = useState<Set<Namespace>>(new Set());
  const [isTreeOpen, setIsTreeOpen] = useState<boolean>(true);

  const toggleNamespace = (namespace: Namespace) => {
    const newOpenNamespaces = new Set(openNamespaces);
    if (newOpenNamespaces.has(namespace)) {
      newOpenNamespaces.delete(namespace);
    } else {
      newOpenNamespaces.add(namespace);
      onSelectNamespace(namespace);
    }
    setOpenNamespaces(newOpenNamespaces);
  };

  const toggleTree = () => {
    setIsTreeOpen(!isTreeOpen);
  };

  return (
    <div className="w-full md:w-64 lg:w-80 bg-gray-900 p-4 overflow-y-auto">
      <div
        onClick={toggleTree}
        className="flex items-center p-2 rounded-md cursor-pointer transition-colors hover:bg-gray-800 text-white"
      >
        <NamespaceIcon isOpen={isTreeOpen} />
        <h2 className="text-lg font-semibold text-white">Namespaces</h2>
      </div>
      {isTreeOpen && (
        <ul className="pl-4">
          {namespaces.map((ns) => {
            const isOpen = openNamespaces.has(ns);
            return (
              <li key={ns.name} className="mb-1">
                <div
                  onClick={() => toggleNamespace(ns)}
                  className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${selectedNamespace?.name === ns.name 
                    ? 'bg-blue-600 bg-opacity-30 text-white' : 'hover:bg-gray-800 text-gray-300'}`}
                    >                  <NamespaceIcon isOpen={isOpen} />
                  <span className="font-medium text-gray-300">{ns.name}</span>
                  {loadingSets?.name === ns.name && <Spinner size="4" className="ml-auto" />}
                </div>
                {isOpen && setsByNamespace[ns.name] && (
                  <ul className="mt-1">
                    {setsByNamespace[ns.name].map((s) => (
                      <li
                        key={s.name}
                        onClick={() => onSelectSet(s.namespace, s)}
                        className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${selectedSet?.name === s.name 
                          && selectedNamespace?.name === s.namespace.name ? 'bg-blue-500 text-white' : 'hover:bg-gray-800'}`}
                      >
                        <SetIcon />
                        <span className="text-gray-300">{s.name} ({s.objects}): {formatBytes(s.data_used_bytes)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default NamespaceTree;