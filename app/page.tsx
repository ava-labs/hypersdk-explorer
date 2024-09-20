'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Box } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BlockTable from '@/components/blockFeed';
import SearchTransactionHash from '@/components/ui/SearchTxnHash';
import { getLatestBlock, getBlockByHeight, Block } from '@/utils/api';

const PAGE_SIZE = 25;

export default function Home() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [latestBlock, setLatestBlock] = useState<Block | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const latestBlockRef = useRef<Block | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
      setTimeout(() => setIsLoading(false), 1000);
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

  const handlePages = useCallback(() => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    const totalPages = latestBlock ? Math.ceil(latestBlock.height / PAGE_SIZE) : 1;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('ellipsis');
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push('ellipsis');
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  }, [currentPage, latestBlock]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    const totalPages = latestBlock ? Math.ceil(latestBlock.height / PAGE_SIZE) : 1;
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, latestBlock]);

  const toggleRowExpansion = (height: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(height)) {
      newExpandedRows.delete(height);
    } else {
      newExpandedRows.add(height);
    }
    setExpandedRows(newExpandedRows);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center space-x-2">
            <Box className="h-6 w-6 text-primary" />
            <span>HyperSDK Explorer</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SearchTransactionHash />
        </CardContent>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <BlockTable
                blocks={blocks}
                isLoading={isLoading}
                expandedRows={expandedRows}
                toggleRowExpansion={toggleRowExpansion}
                copyToClipboard={copyToClipboard}
                copiedField={copiedField}
              />
            </div>
            <div className="flex justify-between items-center">
              <Button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="hidden sm:inline-flex"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="sm:hidden"
                size="icon"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="hidden sm:block">
                <Pagination>
                  <PaginationContent>
                    {handlePages().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => setCurrentPage(page as number)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                  </PaginationContent>
                </Pagination>
              </div>
              <div className="sm:hidden">
                <Pagination>
                  <PaginationContent>
                    {handlePages().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => setCurrentPage(page as number)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                  </PaginationContent>
                </Pagination>
              </div>
              <Button
                onClick={handleNextPage}
                disabled={
                  currentPage ===
                  (latestBlock ? Math.ceil(latestBlock.height / PAGE_SIZE) : 1)
                }
                aria-label="Next page"
                className="hidden sm:inline-flex"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                onClick={handleNextPage}
                disabled={
                  currentPage ===
                  (latestBlock ? Math.ceil(latestBlock.height / PAGE_SIZE) : 1)
                }
                aria-label="Next page"
                className="sm:hidden"
                size="icon"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}