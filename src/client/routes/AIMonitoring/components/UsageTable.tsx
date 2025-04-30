import React from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { AIUsageRecord } from '@/server/ai-usage-monitoring/types';

interface UsageTableProps {
  usageData: AIUsageRecord[];
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
  formatDate: (dateString: string) => string;
}

export const UsageTable = ({
  usageData,
  formatCurrency,
  formatNumber,
  formatDate
}: UsageTableProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <TableContainer component={Paper}>
      <Table size={isMobile ? "small" : "medium"}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Model</TableCell>
            <TableCell align="right">Tokens</TableCell>
            <TableCell align="right">Cost</TableCell>
            <TableCell>Endpoint</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {usageData.map((record, index) => (
            <TableRow key={index}>
              <TableCell>{formatDate(record.timestamp)}</TableCell>
              <TableCell>{record.modelId}</TableCell>
              <TableCell align="right">{formatNumber(record.usage?.totalTokens || 0)}</TableCell>
              <TableCell align="right">{formatCurrency(record.cost)}</TableCell>
              <TableCell>{record.endpoint}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
