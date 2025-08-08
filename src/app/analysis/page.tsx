/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// app/analysis/page.tsx
"use client";

import { useState, useMemo } from "react";
import { AppHeader } from "~/components/app-header";
import { useAccountingState } from "~/store/use-acccounting";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DateRange, type Range } from "react-date-range";
import { parseISO, isAfter, isBefore } from "date-fns";
import { ProtectedRoute } from "~/components/protected-routes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

type GraphType =
  | "revenue"
  | "profit"
  | "costBreakdown"
  | "salesByProduct"
  | "revenueVsProfit";
type ChartStyle = "line" | "bar" | "pie" | "doughnut";

type StrictRange = {
  startDate: Date;
  endDate: Date;
  key: string;
};

export default function AnalysisPage() {
  const { state } = useAccountingState();
  const [graphType, setGraphType] = useState<GraphType>("revenue");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("line");
  const [dateRange, setDateRange] = useState<StrictRange>({
    startDate: new Date("2000-01-01"),
    endDate: new Date(),
    key: "selection",
  });

  const filteredSales = useMemo(() => {
    return state.sales.filter((s) => {
      const saleDate = parseISO(s.soldAt);
      return (
        !isBefore(saleDate, dateRange.startDate) &&
        !isAfter(saleDate, dateRange.endDate)
      );
    });
  }, [state.sales, dateRange]);

  const chartData = useMemo(() => {
    switch (graphType) {
      case "revenue":
      case "profit":
      case "revenueVsProfit": {
        const byDate: Record<string, { revenue: number; profit: number }> = {};
        filteredSales.forEach((s) => {
          if (!s.soldAt) return;
          const date = s.soldAt.split("T")[0]!;
          const product = state.products.find((p) => p.id === s.productId);
          if (!product) return;
          const unitCost = product.rawCosts.reduce(
            (sum, rc) => sum + rc.amount,
            0,
          );
          const revenue = s.quantitySold * product.pricePerItem;
          const profit = s.quantitySold * (product.pricePerItem - unitCost);
          byDate[date] ??= { revenue: 0, profit: 0 };
          byDate[date].revenue += revenue;
          byDate[date].profit += profit;
        });
        const labels = Object.keys(byDate).sort();
        const datasets = [];
        if (graphType === "revenue" || graphType === "revenueVsProfit") {
          datasets.push({
            label: "Revenue",
            data: labels.map((d) => byDate[d]!.revenue),
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 2,
          });
        }
        if (graphType === "profit" || graphType === "revenueVsProfit") {
          datasets.push({
            label: "Profit",
            data: labels.map((d) => byDate[d]!.profit),
            backgroundColor: "rgba(16, 185, 129, 0.5)",
            borderColor: "rgb(16, 185, 129)",
            borderWidth: 2,
          });
        }
        return { labels, datasets };
      }
      case "costBreakdown": {
        const byCost: Record<string, number> = {};
        state.products.forEach((p) => {
          p.rawCosts.forEach((rc) => {
            byCost[rc.label] = (byCost[rc.label] ?? 0) + rc.amount;
          });
        });
        const labels = Object.keys(byCost);
        return {
          labels,
          datasets: [
            {
              label: "Cost Breakdown",
              data: labels.map((l) => byCost[l]),
              backgroundColor: [
                "rgba(239, 68, 68, 0.5)",
                "rgba(59, 130, 246, 0.5)",
                "rgba(234, 179, 8, 0.5)",
                "rgba(16, 185, 129, 0.5)",
                "rgba(139, 92, 246, 0.5)",
              ],
              borderColor: [
                "rgb(239, 68, 68)",
                "rgb(59, 130, 246)",
                "rgb(234, 179, 8)",
                "rgb(16, 185, 129)",
                "rgb(139, 92, 246)",
              ],
              borderWidth: 1,
            },
          ],
        };
      }
      case "salesByProduct": {
        const byProduct: Record<string, number> = {};
        filteredSales.forEach((s) => {
          const product = state.products.find((p) => p.id === s.productId);
          if (!product) return;
          byProduct[product.title] =
            (byProduct[product.title] ?? 0) + s.quantitySold;
        });
        const labels = Object.keys(byProduct);
        return {
          labels,
          datasets: [
            {
              label: "Sales by Product",
              data: labels.map((l) => byProduct[l]),
              backgroundColor: [
                "rgba(59, 130, 246, 0.5)",
                "rgba(16, 185, 129, 0.5)",
                "rgba(234, 179, 8, 0.5)",
                "rgba(239, 68, 68, 0.5)",
                "rgba(139, 92, 246, 0.5)",
              ],
              borderColor: [
                "rgb(59, 130, 246)",
                "rgb(16, 185, 129)",
                "rgb(234, 179, 8)",
                "rgb(239, 68, 68)",
                "rgb(139, 92, 246)",
              ],
              borderWidth: 1,
            },
          ],
        };
      }
    }
  }, [graphType, state, filteredSales]);

  const ChartComponent = useMemo(() => {
    switch (chartStyle) {
      case "line":
        return Line;
      case "bar":
        return Bar;
      case "pie":
        return Pie;
      case "doughnut":
        return Doughnut;
    }
  }, [chartStyle]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[hsl(var(--bg))] text-zinc-100">
        <AppHeader />
        <main className="mx-auto max-w-6xl p-4">
          <h1 className="mb-6 text-2xl font-semibold">Analysis</h1>

          <div className="mb-6 flex flex-wrap gap-4">
            <Select
              value={graphType}
              onValueChange={(v: GraphType) => setGraphType(v)}
            >
              <SelectTrigger className="w-56 bg-[hsl(var(--panel))] text-zinc-100">
                <SelectValue placeholder="Select Graph Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue Over Time</SelectItem>
                <SelectItem value="profit">Profit Over Time</SelectItem>
                <SelectItem value="revenueVsProfit">
                  Revenue vs Profit
                </SelectItem>
                <SelectItem value="costBreakdown">Cost Breakdown</SelectItem>
                <SelectItem value="salesByProduct">Sales by Product</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={chartStyle}
              onValueChange={(v: ChartStyle) => setChartStyle(v)}
            >
              <SelectTrigger className="w-40 bg-[hsl(var(--panel))] text-zinc-100">
                <SelectValue placeholder="Chart Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
                <SelectItem value="doughnut">Doughnut</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="relaxed-card border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-zinc-100">
            <CardHeader>
              <CardTitle>
                {graphType === "revenue" && "Revenue Over Time"}
                {graphType === "profit" && "Profit Over Time"}
                {graphType === "revenueVsProfit" && "Revenue vs Profit"}
                {graphType === "costBreakdown" && "Cost Breakdown"}
                {graphType === "salesByProduct" && "Sales by Product"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData && ChartComponent && (
                <ChartComponent
                  data={chartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { labels: { color: "#e5e7eb" } },
                      title: { display: false },
                    },
                    scales:
                      chartStyle === "pie" || chartStyle === "doughnut"
                        ? {}
                        : {
                            x: { ticks: { color: "#e5e7eb" } },
                            y: { ticks: { color: "#e5e7eb" } },
                          },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
