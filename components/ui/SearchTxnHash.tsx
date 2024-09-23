import React, { useState, useEffect, KeyboardEvent } from 'react';
import { Search, X, Clock, CheckCircle, ChevronUp, ChevronDown, XCircle, Cpu, Coins } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTx, Transaction } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from "next-themes";

const SearchTransactionHash: React.FC = () => {
  const { theme } = useTheme();
  const [searchHash, setsearchHash] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (transaction) {
      setIsMinimized(false);
      console.log('Txn:', transaction);
    }
  }, [transaction]);

  const handleSearch = async () => {
    if (!searchHash.trim()) return;
    setIsLoading(true);
    setError(null);
    setTransaction(null);
    try {
      const result = await getTx(searchHash);
      if (result) {
        setTransaction(result);
      } else {
        setError('Your search did not match any records.');
      }
    } catch (err) {
      setError('Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClose = () => {
    setTransaction(null);
    setError(null);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Search by Transaction Hash..."
          value={searchHash}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setsearchHash(e.target.value)
          }
          onKeyDown={handleEnter}
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "Searching..." : <Search className="h-4 w-4" />}
        </Button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <AnimatePresence>
        {transaction && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="w-full bg-white dark:bg-[#1F2937] text-black dark:text-white border border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between py-2">
                <CardTitle className="text-lg">Transaction Details</CardTitle>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMinimize}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800"
                  >
                    {isMinimized ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                            <Coins className="mr-2 h-4 w-4" />
                            Fee
                          </p>
                          <p className="text-black dark:text-white">
                            {transaction.fee ?? "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                            {transaction.success ? (
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                            )}
                            Success
                          </p>
                          <p className={transaction.success ? "text-green-500" : "text-red-500"}>
                            {transaction.success ? "Yes" : "No"}
                          </p>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                            <Clock className="mr-2 h-4 w-4" />
                            Timestamp
                          </p>
                          <p className="text-black dark:text-white">
                            {transaction.timestamp
                              ? new Date(Number(transaction.timestamp)).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                            <Cpu className="mr-2 h-4 w-4" />
                            Units
                          </p>
                          <p className="text-black dark:text-white">
                            {transaction.units
                              ? `[${transaction.units.join(", ")}]`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchTransactionHash;