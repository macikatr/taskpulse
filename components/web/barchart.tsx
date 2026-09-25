"use client";
import { ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts"
import z from "zod";

const chartItemSchema = z.object({
  label: z.string(),
  color: z.string(),
})


const BarChartProps= z.object({
    
    data: z.array(z.object({month: z.string()})),
    config: z.record(z.string(), chartItemSchema),
    colKey: z.string()
})
  

const AppBarChart = (props: z.infer<typeof BarChartProps>) => {
  
  const data = props.data
  const config = props.config
  const colKey = props.colKey
 
  return (
    <ChartContainer config={config} className="max-h-50 min-h-40 w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} stroke="gray" strokeDasharray="3 3" />
        <XAxis dataKey={colKey} tickLine={false} />
        {Object.keys(config).map((key) => (
          
            <Bar key={key} dataKey={key} fill={config[key].color} radius={4} />
          
        ))}
        
        
      </BarChart>
    </ChartContainer>
  )
}

export default AppBarChart