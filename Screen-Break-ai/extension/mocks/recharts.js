// __mocks__/recharts.js
import React from 'react';

// Mocking the components from recharts that are used in the project
export const ResponsiveContainer = ({ children }) => React.createElement('div', { className: 'responsive-container' }, children);
export const BarChart = ({ children, data }) => React.createElement('div', { 'data-testid': 'bar-chart', 'data-chart-data': JSON.stringify(data) }, children);
export const CartesianGrid = () => React.createElement('div', { className: 'cartesian-grid' });
export const XAxis = ({ dataKey }) => React.createElement('div', { className: 'x-axis', 'data-datakey': dataKey });
export const YAxis = () => React.createElement('div', { className: 'y-axis' });
export const Tooltip = () => React.createElement('div', { className: 'tooltip' });
export const Bar = ({ dataKey }) => React.createElement('div', { className: 'bar', 'data-datakey': dataKey });
export const LineChart = ({ children, data }) => React.createElement('div', { 'data-testid': 'line-chart', 'data-chart-data': JSON.stringify(data) }, children);
export const Line = ({ dataKey }) => React.createElement('div', { className: 'line', 'data-datakey': dataKey });
export const Legend = () => React.createElement('div', { className: 'legend' });
export const PieChart = ({ children, data }) => React.createElement('div', { 'data-testid': 'pie-chart', 'data-chart-data': JSON.stringify(data) }, children);
export const Pie = ({ dataKey }) => React.createElement('div', { className: 'pie', 'data-datakey': dataKey });
export const Cell = () => React.createElement('div', { className: 'cell' });
