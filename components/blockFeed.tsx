import React from 'react';
import { ChevronDown, ChevronUp, Copy, Clock, Hash, Layers } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Block } from '@/utils/api';

interface BlockTableProps {
  blocks: Block[];
  isLoading: boolean;
  expandedRows: Set<number>;
  toggleRowExpansion: (height: number) => void;
  copyToClipboard: (text: string, field: string) => void;
  copiedField: string | null;
}

const BlockTable: React.FC<BlockTableProps> = ({
  blocks,
  isLoading,
  expandedRows,
  toggleRowExpansion,
  copyToClipboard,
  copiedField,
}) => {
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

  return (
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
  );
};

export default BlockTable;