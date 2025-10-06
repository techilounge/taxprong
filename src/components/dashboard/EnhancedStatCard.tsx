import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCounter } from "@/components/ui/stats-counter";
import { LucideIcon } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

interface EnhancedStatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  trend?: number[];
  prefix?: string;
  suffix?: string;
  animated?: boolean;
}

export const EnhancedStatCard = ({
  title,
  value,
  description,
  icon: Icon,
  color,
  bgColor,
  trend,
  prefix = "",
  suffix = "",
  animated = false,
}: EnhancedStatCardProps) => {
  const numericValue = typeof value === "number" ? value : parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
  
  const trendData = trend || Array.from({ length: 7 }, (_, i) => ({
    value: numericValue * (0.8 + Math.random() * 0.4),
  }));

  return (
    <Card className="hover-scale animate-fade-in overflow-hidden relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {animated && typeof value === "number" ? (
            <StatsCounter
              end={numericValue}
              prefix={prefix}
              suffix={suffix}
              decimals={0}
            />
          ) : (
            <span>{typeof value === "string" ? value : `${prefix}${value}${suffix}`}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        
        {/* Mini Sparkline */}
        <div className="mt-4 h-12 -mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color.replace('text-', 'hsl(var(--') + ')'}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 pointer-events-none" />
    </Card>
  );
};
