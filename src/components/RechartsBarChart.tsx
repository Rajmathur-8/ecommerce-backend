import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartData {
  date: string;
  revenue?: number;
  orders?: number;
  activeUsers?: number;
  newUsers?: number;
  formattedDate?: string;
}

interface RechartsBarChartProps {
  data: ChartData[];
  type: 'revenue' | 'orders' | 'users';
  height?: number;
  color?: string;
}

export default function RechartsBarChart({ data, type, height = 400, color = '#3B82F6' }: RechartsBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  // Format data for Recharts
  const chartData = data.map(item => {
    const formattedDate = item.formattedDate || new Date(item.date).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short' 
    });
    
    if (type === 'users') {
      return {
        date: formattedDate,
        activeUsers: item.activeUsers || 0,
        newUsers: item.newUsers || 0,
        fullDate: item.date
      };
    }
    
    return {
      date: formattedDate,
      value: type === 'revenue' ? (item.revenue || 0) : (item.orders || 0),
      fullDate: item.date
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded shadow-lg">
          <p className="font-medium mb-1">{label}</p>
          {type === 'users' ? (
            <>
              <p className="text-green-300">
                Active Users: {payload[0]?.value || 0}
              </p>
              {payload[1] && (
                <p className="text-purple-300">
                  New Users: {payload[1]?.value || 0}
                </p>
              )}
            </>
          ) : (
            <p className="text-blue-300">
              {type === 'revenue' 
                ? `₹${(payload[0]?.value || 0).toLocaleString()}`
                : `${payload[0]?.value || 0} orders`
              }
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom tick formatter for Y-axis
  const formatYAxisTick = (value: number) => {
    if (type === 'revenue') {
      return `₹${value.toLocaleString()}`;
    }
    return value.toString();
  };

  return (
    <div style={{ width: '100%', height: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={formatYAxisTick}
          />
          <Tooltip content={<CustomTooltip />} />
          {type === 'users' ? (
            <>
              <Bar 
                dataKey="activeUsers" 
                fill="#10B981"
                name="Active Users"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar 
                dataKey="newUsers" 
                fill="#8B5CF6"
                name="New Users"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </>
          ) : (
            <Bar 
              dataKey="value" 
              fill={color}
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
