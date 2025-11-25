import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Loader2 } from "lucide-react";

export default function PieCard({
  title = "Chart Title",
  subtitle = "Subtitle goes here",
  icon: Icon,
  data = [],
  dataKey = "count",
  height = 200,
  innerRadius = 60,
  outerRadius = 90,
  isLoading = false,
  emptyMessage = "No data to show yet",
}) {
  return (
    <div className="card">
      {/* Header */}
      <div className="card-header flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-blue-500" />}
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-textcolor-secondary">{subtitle}</p>
        </div>
      </div>

      {/* Body */}
      <div className="card-body space-y-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading chart…
          </div>
        ) : null}

        {!isLoading && data.length === 0 ? (
          <div className="text-sm text-muted">{emptyMessage}</div>
        ) : null}

        {!isLoading && data.length > 0 && (
          <>
        {/* Pie Chart */}
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={6}
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        {/* Legends */}
        <div className="grid grid-cols-2 gap-4">
          {data.map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between p-3 rounded-xl bg-background-hover"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <div className="text-sm font-medium">{item.type}</div>
                  <div className="text-xs text-muted">
                    {item.percentage}%
                  </div>
                </div>
              </div>
              <div className="text-lg font-bold">{item.count}</div>
            </div>
          ))}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
