
import React from 'react';

interface JsonViewerProps {
  data: object | any[];
}

const bytesToHexString = (bytes: number[]): string => {
  return bytes
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const replacer = (key: string, value: any) => {
    if (
      value &&
      typeof value === 'object' &&
      'type' in value &&
      value.type === 'Buffer' &&
      'data' in value &&
      Array.isArray(value.data)
    ) {
      return `0x${bytesToHexString(value.data)}`;
    }
    return value;
  };

  const jsonString = JSON.stringify(data, replacer, 2);

  const syntaxHighlight = (json: string) => {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'text-green-400'; // string
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-blue-400'; // key
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-400'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-gray-500'; // null
      } else {
        cls = 'text-orange-400'; // number
      }
      return `<span class="${cls}">${match}</span>`;
    });
  };

  return (
    <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded-md overflow-x-auto">
      <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(jsonString) }} />
    </pre>
  );
};

export default JsonViewer;
