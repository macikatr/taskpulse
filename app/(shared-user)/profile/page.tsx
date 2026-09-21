import { type ChartConfig } from "@/components/ui/chart"
import AppBarChart from "@/components/web/barchart"

export default function ProfilePage() {
 

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig

  const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
      <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2"><AppBarChart data={chartData} config={chartConfig} colNames="month" /></div>
      <div className="bg-primary-foreground p-4 rounded-lg ">Test</div>
      <div className="bg-primary-foreground p-4 rounded-lg ">Test</div>
      <div className="bg-primary-foreground p-4 rounded-lg ">Test</div>
      <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">Test</div>
      <div className="bg-primary-foreground p-4 rounded-lg ">Test</div>
    </div>
  )}