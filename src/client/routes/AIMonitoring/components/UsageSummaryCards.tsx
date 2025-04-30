import React from 'react';
import { 
  Typography, 
  Stack,
  Card, 
  CardContent
} from '@mui/material';
import { AIUsageSummary } from '@/server/ai-usage-monitoring/types';

interface UsageSummaryCardsProps {
  summary: AIUsageSummary;
  totalRequests: number;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
}

export const UsageSummaryCards = ({
  summary,
  totalRequests,
  formatCurrency,
  formatNumber
}: UsageSummaryCardsProps) => {
  return (
    <Stack 
      direction={{ xs: 'column', sm: 'row' }} 
      spacing={2} 
      sx={{ mb: 3 }}
      justifyContent="space-between"
    >
      <Card sx={{ flex: 1, bgcolor: 'primary.light' }}>
        <CardContent>
          <Typography color="primary.contrastText" variant="overline">
            Total Cost
          </Typography>
          <Typography 
            color="primary.contrastText" 
            variant="h4" 
            sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
          >
            {formatCurrency(summary.totalCost)}
          </Typography>
        </CardContent>
      </Card>
      
      <Card sx={{ flex: 1, bgcolor: 'secondary.light' }}>
        <CardContent>
          <Typography color="secondary.contrastText" variant="overline">
            Total Tokens
          </Typography>
          <Typography 
            color="secondary.contrastText" 
            variant="h4" 
            sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
          >
            {formatNumber(summary.totalTokens)}
          </Typography>
        </CardContent>
      </Card>
      
      <Card sx={{ flex: 1, bgcolor: 'info.light' }}>
        <CardContent>
          <Typography color="info.contrastText" variant="overline">
            Total Requests
          </Typography>
          <Typography 
            color="info.contrastText" 
            variant="h4" 
            sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
          >
            {formatNumber(totalRequests)}
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
};
