import React, { useState } from 'react';
// FIX: Removed the conflicting `Set` interface import to allow using the native JavaScript `Set` collection.
import { Namespace, SetsByNamespace } from '../types';
import Spinner from './Spinner';

interface NamespaceTreeProps {
  namespaces: Namespace[];
  setsByNamespace: SetsByNamespace;
  onSelectNamespace: (namespace: string) => void;
  onSelectSet: (namespace: string, set: string) => void;
  selectedNamespace: string | null;
  selectedSet: string | null;
  loadingSets: string | null;
}

const NamespaceIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const SetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 ml-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
);


const NamespaceTree: React.FC<NamespaceTreeProps> = ({
  namespaces,
  setsByNamespace,
  onSelectNamespace,
  onSelectSet,
  selectedNamespace,
  selectedSet,
  loadingSets,
}) => {
  const [openNamespaces, setOpenNamespaces] = useState<Set<string>>(new Set());

  const toggleNamespace = (name: string) => {
    const newOpenNamespaces = new Set(openNamespaces);
    if (newOpenNamespaces.has(name)) {
      newOpenNamespaces.delete(name);
    } else {
      newOpenNamespaces.add(name);
      onSelectNamespace(name);
    }
    setOpenNamespaces(newOpenNamespaces);
  };

  return (
    <div className="w-full md:w-64 lg:w-80 bg-gray-900 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-white mb-4">Namespaces</h2>
      <ul>
        {namespaces.map((ns) => {
          const isOpen = openNamespaces.has(ns.name);
          return (
            <li key={ns.name} className="mb-1">
              <div
                onClick={() => toggleNamespace(ns.name)}
                className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${selectedNamespace === ns.name ? 'bg-blue-600 bg-opacity-30' : 'hover:bg-gray-800'}`}
              >
                <NamespaceIcon isOpen={isOpen} />
                <span className="font-medium">{ns.name}</span>
                {loadingSets === ns.name && <Spinner size="4" className="ml-auto" />}
              </div>
              {isOpen && setsByNamespace[ns.name] && (
                <ul className="mt-1">
                  {setsByNamespace[ns.name].map((s) => (
                    <li
                      key={s.name}
                      onClick={() => onSelectSet(s.namespace, s.name)}
                      className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${selectedSet === s.name && selectedNamespace === s.namespace ? 'bg-blue-500 text-white' : 'hover:bg-gray-800'}`}
                    >
                      <SetIcon />
                      <span>{s.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default NamespaceTree;