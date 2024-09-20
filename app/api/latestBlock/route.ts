import { NextResponse } from 'next/server';
import axios from 'axios';

const indexerApi = axios.create({
  baseURL: process.env.INDEXER_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, params } = body;

    const response = await indexerApi.post('', {
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching block data:', error);
    return NextResponse.json({ error: 'Failed to fetch block data' }, { status: 500 });
  }
}
