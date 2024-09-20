import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Transaction {
  base: {
    timestamp: number;
    chainId: string;
    maxFee: number;
  };
  actions: {
    to: string;
    value: number;
    memo: string;
  }[];
  auth: {
    signer: string[];
    signature: string[];
  };
}

export interface Block {
  parent: string;
  timestamp: number;
  height: number;
  txs: Transaction[];
  stateRoot: string;
}

export const getLatestBlock = async (): Promise<Block> => {
  const response = await api.post('/latestBlock', {
    jsonrpc: '2.0',
    id: 1,
    method: 'indexer.getLatestBlock',
    params: {},
  });
  // Log for now
  console.log('Block res:', JSON.stringify(response.data, null, 2));
  return response.data.result.block;
};

export const getBlockByHeight = async (height: number): Promise<Block> => {
  const response = await api.post('/latestBlock', {
    jsonrpc: '2.0',
    id: 1,
    method: 'indexer.getBlockByHeight',
    params: { height },
  });
  return response.data.result.block;
};

export const getBlock = async (blockID: string): Promise<Block> => {
  const response = await api.post('/latestBlock', {
    jsonrpc: '2.0',
    id: 1,
    method: 'indexer.getBlock',
    params: { blockID },
  });
  return response.data.result.block;
};

export const getTx = async (txID: string): Promise<Transaction> => {
  try {
    const response = await api.post('/latestBlock', {
      jsonrpc: '2.0',
      id: 1,
      method: 'indexer.getTx',
      params: { txID },
    });
    return response.data.result;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
};
