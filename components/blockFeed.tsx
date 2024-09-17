'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getLatestBlock, getBlockByHeight, Block } from '@/utils/api';

const PAGE_SIZE = 20;

const BlockExplorer: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [latestBlock, setLatestBlock] = useState<Block | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const latestBlockRef = useRef<Block | null>(null);

  const fetchLatestBlock = useCallback(async () => {
    try {
      const block = await getLatestBlock();
      if (!latestBlockRef.current || block.height > latestBlockRef.current.height) {
        setLatestBlock(block);
        latestBlockRef.current = block;
      }
      return block;
    } catch (err) {
      setError('Failed to fetch latest block');
      return null;
    }
  }, []);

  const fetchBlocks = useCallback(async (startHeight: number) => {
    setIsLoading(true);
    try {
      const blockPromises = [];
      for (let i = 0; i < PAGE_SIZE; i++) {
        const height = startHeight - i;
        if (height >= 0) {
          blockPromises.push(getBlockByHeight(height));
        }
      }
      const fetchedBlocks = await Promise.all(blockPromises);
      setBlocks(fetchedBlocks.filter((block): block is Block => block !== null));
      setError(null);
    } catch (err) {
      setError(`Failed to fetch blocks: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeBlocks = async () => {
      const latest = await fetchLatestBlock();
      if (latest) {
        fetchBlocks(latest.height);
      }
    };

    initializeBlocks();

    const intervalId = setInterval(async () => {
      if (currentPage === 1) {
        const latest = await fetchLatestBlock();
        if (latest && (!latestBlockRef.current || latest.height > latestBlockRef.current.height)) {
          fetchBlocks(latest.height);
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchLatestBlock, fetchBlocks, currentPage]);

  useEffect(() => {
    if (latestBlock) {
      const startHeight = latestBlock.height - (currentPage - 1) * PAGE_SIZE;
      fetchBlocks(startHeight);
    }
  }, [currentPage, latestBlock, fetchBlocks]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (latestBlock && (currentPage * PAGE_SIZE) < latestBlock.height) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, latestBlock]);

  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Blockchain Explorer</h2>
      {latestBlock && (
        <div className="mb-4 p-2 bg-blue-100 rounded">
          <h3 className="font-semibold">Latest Block</h3>
          <p>Height: {latestBlock.height}</p>
          <p>Timestamp: {new Date(latestBlock.timestamp).toLocaleString()}</p>
        </div>
      )}
      <div className="mb-4">
        <p>Current Page: {currentPage}</p>
        {currentPage === 1 && <p className="text-green-600">Live updates active</p>}
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul className="mb-4">
          {blocks.map(block => (
            <li key={block.height} className="mb-2 p-2 bg-gray-100 rounded">
              Height: {block.height}, Timestamp: {new Date(block.timestamp).toLocaleString()}, Txs: {block.txs.length}
            </li>
          ))}
        </ul>
      )}
      <div>
        <button 
          onClick={handlePrevPage} 
          disabled={currentPage === 1}
          className="mr-2 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Previous
        </button>
        <button 
          onClick={handleNextPage} 
          disabled={!latestBlock || ((currentPage * PAGE_SIZE) >= latestBlock.height)}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default BlockExplorer;