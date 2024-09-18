'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Copy, Box, Clock, Hash, Layers } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
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

const BlockExplorer: React.FC = () => {
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

  const TruncateWithTooltip: React.FC<{ content: string; maxLength?: number }> = ({ content, maxLength = 20 }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">
            {content.length > maxLength ? `${content.slice(0, maxLength)}...` : content}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs break-all">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const totalPages = latestBlock ? Math.ceil(latestBlock.height / PAGE_SIZE) : 1;

  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center space-x-2">
            <Box className="h-6 w-6 text-primary" />
            <span>Blockchain Explorer</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px]">Height</TableHead>
                    <TableHead>Parent Block</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>State Root</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {isLoading && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <TableCell colSpan={6}>
                          <div className="flex items-center justify-center py-4">
                            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                            <span className="ml-2 text-sm text-muted-foreground">Loading new block...</span>
                          </div>
                        </TableCell>
                      </motion.tr>
                    )}
                    {blocks.map((block) => (
                      <React.Fragment key={block.height}>
                        <motion.tr
                          initial={{ opacity: 0, backgroundColor: "var(--primary)" }}
                          animate={{ opacity: 1, backgroundColor: "transparent" }}
                          transition={{ duration: 0.5 }}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <Layers className="h-4 w-4 text-primary" />
                              <span>{block.height}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono relative group">
                            <TruncateWithTooltip content={block.parent} />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyToClipboard(block.parent, `parent-${block.height}`)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {copiedField === `parent-${block.height}` && (
                              <span className="absolute right-8 top-1/2 transform -translate-y-1/2 text-sm text-green-500">
                                Copied!
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(block.timestamp).toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{block.txs.length}</Badge>
                          </TableCell>
                          <TableCell className="font-mono relative group">
                            <TruncateWithTooltip content={block.stateRoot} />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyToClipboard(block.stateRoot, `state-${block.height}`)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {copiedField === `state-${block.height}` && (
                              <span className="absolute right-8 top-1/2 transform -translate-y-1/2 text-sm text-green-500">
                                Copied!
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(block.height)}
                            >
                              {expandedRows.has(block.height) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </motion.tr>
                        <AnimatePresence>
                          {expandedRows.has(block.height) && (
                            <motion.tr
                              key={`expanded-${block.height}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <TableCell colSpan={6}>
                                <Card className="bg-muted/30 border-none shadow-none">
                                  <CardContent className="p-4">
                                    <h3 className="font-semibold mb-2 flex items-center space-x-2">
                                      <Hash className="h-4 w-4 text-primary" />
                                      <span>Block Details</span>
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p><strong>Chain ID:</strong> {block.txs[0]?.base.chainId || 'N/A'}</p>
                                        <p><strong>Max Fee:</strong> {block.txs[0]?.base.maxFee || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold mb-1">Transactions:</h4>
                                        {block.txs.map((tx, index) => (
                                          <div key={index} className="mb-2 p-2 bg-background rounded-md">
                                            <p><strong>To:</strong> <TruncateWithTooltip content={tx.actions[0]?.to || 'N/A'} maxLength={30} /></p>
                                            <p><strong>Value:</strong> {tx.actions[0]?.value || 'N/A'}</p>
                                            <p><strong>Memo:</strong> {tx.actions[0]?.memo || 'N/A'}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </TableCell>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </AnimatePresence>
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