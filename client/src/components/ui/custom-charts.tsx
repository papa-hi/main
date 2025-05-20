import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Chart data type
type ChartData = {
  name: string;
  value: number;
}[];

// Common chart props
interface ChartProps {
  data: ChartData;
  height?: number;
  width?: number;
}

// Chart props with axes
interface AxesChartProps extends ChartProps {
  xLabel?: string;
  yLabel?: string;
}

// Color palette for charts
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', 
  '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
];

// Helper for formatting percentages
const formatAsPercent = (value: number) => `${Math.round(value)}%`;

// Helper for formatting large numbers with K/M suffix
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Helper to format tooltip values
const customTooltipFormatter = (value: number, name: string) => {
  return [formatNumber(value), name];
};

/**
 * Pie Chart Component
 */
export const PieChart: React.FC<ChartProps> = ({ data, height = 300, width }) => {
  const processedData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <ResponsiveContainer width={width || '100%'} height={height}>
      <RechartsPieChart>
        <Pie
          data={processedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${formatAsPercent(percent * 100)}`}
        >
          {processedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={customTooltipFormatter} />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

/**
 * Bar Chart Component
 */
export const BarChart: React.FC<AxesChartProps> = ({ 
  data, 
  height = 300, 
  width,
  xLabel,
  yLabel
}) => {
  return (
    <ResponsiveContainer width={width || '100%'} height={height}>
      <RechartsBarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 30,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -10 } : undefined} 
        />
        <YAxis 
          tickFormatter={(value: number) => formatNumber(value)}
          label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
        <Tooltip formatter={customTooltipFormatter} />
        <Legend />
        <Bar dataKey="value" fill="#8884d8" />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

/**
 * Line Chart Component
 */
export const LineChart: React.FC<AxesChartProps> = ({ 
  data, 
  height = 300, 
  width,
  xLabel,
  yLabel
}) => {
  return (
    <ResponsiveContainer width={width || '100%'} height={height}>
      <RechartsLineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 30,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -10 } : undefined}
        />
        <YAxis 
          tickFormatter={(value: number) => formatNumber(value)}
          label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
        <Tooltip formatter={customTooltipFormatter} />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};