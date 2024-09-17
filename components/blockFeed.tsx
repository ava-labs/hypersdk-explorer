'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLatestBlock, getBlockByHeight, Block } from '@/utils/api';

const PAGE_SIZE = 25;

const truncateString = (str: string, startLength: number = 10, endLength: number = 6) => {
  if (str.length <= startLength + endLength) return str;
  return `${str.slice(0, startLength)}...${str.slice(-endLength)}`;
};

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

  const totalPages = latestBlock ? Math.ceil(latestBlock.height / PAGE_SIZE) : 1;

  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Blockchain Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Height</TableHead>
                    <TableHead>Parent Block</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead>State Root</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : (
                    blocks.map((block) => (
                      <TableRow key={block.height}>
                        <TableCell className="font-medium">{block.height}</TableCell>
                        <TableCell className="font-mono text-sm">{truncateString(block.parent)}</TableCell>
                        <TableCell>{new Date(block.timestamp).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{block.txs.length}</TableCell>
                        <TableCell className="font-mono text-sm">{truncateString(block.stateRoot)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between items-center">
              <Button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockExplorer;