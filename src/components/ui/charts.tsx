'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './card'

const COLORS = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#0284c7', '#8b5cf6', '#ec4899', '#14b8a6']

interface ChartCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface BarChartComponentProps {
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  color?: string
  height?: number
}

export function BarChartComponent({ data, xKey, yKey, color = '#4f46e5', height = 300 }: BarChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface PieChartComponentProps {
  data: { name: string; value: number }[]
  height?: number
}

export function PieChartComponent({ data, height = 300 }: PieChartComponentProps) {
  const renderLabel = (entry: { name?: string; percent?: number }) => {
    return `${entry.name || ''} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          label={renderLabel}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface LineChartComponentProps {
  data: Record<string, unknown>[]
  xKey: string
  lines: { key: string; color: string; name: string }[]
  height?: number
}

export function LineChartComponent({ data, xKey, lines, height = 300 }: LineChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            name={line.name}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

interface AreaChartComponentProps {
  data: Record<string, unknown>[]
  xKey: string
  areas: { key: string; color: string; name: string }[]
  height?: number
}

export function AreaChartComponent({ data, xKey, areas, height = 300 }: AreaChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend />
        {areas.map((area) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            stroke={area.color}
            fill={area.color}
            fillOpacity={0.15}
            name={area.name}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
