import { Card } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Palette pulled from the app's design tokens so charts match the theme. */
export const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--tech-cyan))",
  "hsl(var(--tech-orange))",
  "hsl(var(--accent))",
  "#22c55e",
  "#ef4444",
];

interface ChartCardProps {
  title: string;
  actions?: React.ReactNode;
  height?: number;
  children: React.ReactElement;
}

/** Titled container with a fixed-height responsive chart area. */
export const ChartCard = ({ title, actions, height = 240, children }: ChartCardProps) => (
  <Card className="p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-sm">{title}</h3>
      {actions}
    </div>
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </Card>
);

const axisProps = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  },
};

export interface SeriesConfig {
  key: string;
  label?: string;
  color?: string;
}

/** Single or multi-line time series. `xKey` defaults to "ts". */
export const LineChartCard = ({
  title,
  data,
  series,
  xKey = "ts",
  height,
  threshold,
  actions,
}: {
  title: string;
  data: Record<string, unknown>[];
  series: SeriesConfig[];
  xKey?: string;
  height?: number;
  threshold?: number;
  actions?: React.ReactNode;
}) => (
  <ChartCard title={title} height={height} actions={actions}>
    <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
      <XAxis dataKey={xKey} {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip {...tooltipStyle} />
      {series.length > 1 && <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />}
      {threshold != null && (
        <ReferenceLine y={threshold} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
      )}
      {series.map((s, i) => (
        <Line
          key={s.key}
          type="monotone"
          dataKey={s.key}
          name={s.label ?? s.key}
          stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
          strokeWidth={2}
          dot={false}
        />
      ))}
    </LineChart>
  </ChartCard>
);

/** Stacked bar chart (e.g. cost breakdown). */
export const StackedBarChartCard = ({
  title,
  data,
  series,
  xKey = "ts",
  height,
}: {
  title: string;
  data: Record<string, unknown>[];
  series: SeriesConfig[];
  xKey?: string;
  height?: number;
}) => (
  <ChartCard title={title} height={height}>
    <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
      <XAxis dataKey={xKey} {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip {...tooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      {series.map((s, i) => (
        <Bar
          key={s.key}
          dataKey={s.key}
          name={s.label ?? s.key}
          stackId="a"
          fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
          radius={i === series.length - 1 ? [4, 4, 0, 0] : undefined}
        />
      ))}
    </BarChart>
  </ChartCard>
);

/** Horizontal bar chart (e.g. feature importance). `data` = [{ name, value }]. */
export const HorizontalBarChartCard = ({
  title,
  data,
  height,
  color,
}: {
  title: string;
  data: { name: string; value: number }[];
  height?: number;
  color?: string;
}) => (
  <ChartCard title={title} height={height ?? Math.max(200, data.length * 28)}>
    <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
      <XAxis type="number" {...axisProps} />
      <YAxis type="category" dataKey="name" width={120} {...axisProps} />
      <Tooltip {...tooltipStyle} />
      <Bar dataKey="value" fill={color ?? CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
    </BarChart>
  </ChartCard>
);

/** Filled area chart for volume-style series. */
export const AreaChartCard = ({
  title,
  data,
  series,
  xKey = "ts",
  height,
}: {
  title: string;
  data: Record<string, unknown>[];
  series: SeriesConfig[];
  xKey?: string;
  height?: number;
}) => (
  <ChartCard title={title} height={height}>
    <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
      <XAxis dataKey={xKey} {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip {...tooltipStyle} />
      {series.map((s, i) => {
        const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length];
        return (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={color}
            fill={color}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        );
      })}
    </AreaChart>
  </ChartCard>
);
