import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { useAIMonitoring } from './hooks';
import { 
  TabPanel, 
  OverviewCharts, 
  UsageSummaryCards, 
  UsageTable 
} from './components';

export const AIMonitoring = () => {
  const {
    usageData,
    summary,
    loading,
    error,
    tabValue,
    totalRequests,
    formatCurrency,
    formatNumber,
    formatDate,
    getDailyUsageData,
    getModelDistributionData,
    handleTabChange
  } = useAIMonitoring();

  return (
    <Container maxWidth="lg">
      <Paper elevation={2} sx={{ p: 3, mt: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI Usage Monitoring
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <UsageSummaryCards 
              summary={summary}
              totalRequests={totalRequests}
              formatCurrency={formatCurrency}
              formatNumber={formatNumber}
            />
            
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="AI monitoring tabs"
              >
                <Tab label="Overview" id="monitoring-tab-0" aria-controls="monitoring-tabpanel-0" />
                <Tab label="Detailed Usage" id="monitoring-tab-1" aria-controls="monitoring-tabpanel-1" />
              </Tabs>
            </Box>
            
            {/* Overview Tab */}
            <TabPanel value={tabValue} index={0}>
              <OverviewCharts 
                formatCurrency={formatCurrency}
                getDailyUsageData={getDailyUsageData}
                getModelDistributionData={getModelDistributionData}
              />
            </TabPanel>
            
            {/* Detailed Usage Tab */}
            <TabPanel value={tabValue} index={1}>
              <UsageTable 
                usageData={usageData}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                formatDate={formatDate}
              />
            </TabPanel>
          </>
        )}
      </Paper>
    </Container>
  );
};
