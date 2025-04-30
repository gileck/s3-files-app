import { useState, useEffect, useCallback } from 'react';
import { getAllUsage } from '@/apis/monitoring/aiUsage/client';
import { AIUsageRecord, AIUsageSummary } from '@/server/ai-usage-monitoring/types';

export const useAIMonitoring = () => {
  const [usageData, setUsageData] = useState<AIUsageRecord[]>([]);
  const [summary, setSummary] = useState<AIUsageSummary>({
    totalCost: 0,
    totalTokens: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    usageByModel: {},
    usageByDay: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);

  // Format helpers
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Data processing functions
  const getDailyUsageData = useCallback(() => {
    const dailyData: Record<string, number> = {};
    
    usageData.forEach(record => {
      const date = new Date(record.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      if (!dailyData[date]) {
        dailyData[date] = 0;
      }
      
      dailyData[date] += record.cost;
    });
    
    return Object.entries(dailyData)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [usageData]);

  const getModelDistributionData = useCallback(() => {
    const modelData: Record<string, number> = {};
    
    usageData.forEach(record => {
      if (!modelData[record.modelId]) {
        modelData[record.modelId] = 0;
      }
      
      modelData[record.modelId] += record.cost;
    });
    
    return Object.entries(modelData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [usageData]);

  // Fetch usage data
  const fetchUsageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAllUsage();
      
      if (response.data) {
        setUsageData(response.data.records || []);
        if (response.data.summary) {
          setSummary(response.data.summary);
        }
        setTotalRequests(response.data.records?.length || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI usage data');
      console.error('Error fetching AI usage data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  return {
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
    handleTabChange,
    fetchUsageData
  };
};
