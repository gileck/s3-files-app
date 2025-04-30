import React from 'react';
import { 
  Typography, 
  Paper, 
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface OverviewChartsProps {
  formatCurrency: (value: number) => string;
  getDailyUsageData: () => Array<{ date: string; cost: number }>;
  getModelDistributionData: () => Array<{ name: string; value: number }>;
}

export const OverviewCharts = ({
  formatCurrency,
  getDailyUsageData,
  getModelDistributionData
}: OverviewChartsProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2, md: 4 }}>
      {/* Daily Usage Chart */}
      <Paper sx={{ p: { xs: 1, sm: 2 }, height: { xs: 300, sm: 400 }, flex: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Daily Cost
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
            data={getDailyUsageData()}
            margin={{ 
              top: 20, 
              right: isMobile ? 10 : 30, 
              left: isMobile ? 0 : 20, 
              bottom: isMobile ? 50 : 70 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end"
              height={isMobile ? 50 : 70}
              tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
            <Bar dataKey="cost" fill="#8884d8" name="Cost ($)" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
      
      {/* Model Distribution Chart */}
      <Paper sx={{ p: { xs: 1, sm: 2 }, height: { xs: 300, sm: 400 }, flex: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Usage by Model
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={getModelDistributionData()}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={isMobile ? 80 : 120}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {getModelDistributionData().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
    </Stack>
  );
};
