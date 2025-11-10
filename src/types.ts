
export interface Namespace {
  name: string;
}

export interface Set {
  name: string;
  objects: number;
  data_used_bytes: number;
  namespace: Namespace;
}

export type BinValue = string | number | boolean | null | object | any[];

export interface Record {
  key: string;
  bins: {
    [key: string]: BinValue;
  };
}

export interface SetsByNamespace {
    [namespaceName: string]: Set[];
}
