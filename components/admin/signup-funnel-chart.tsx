// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 5 > Admin Dashboard
// Signup funnel chart component

"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SignupFunnelData } from "@/lib/actions/admin";

type SignupFunnelChartProps = {
  data: SignupFunnelData;
};

export function SignupFunnelChart({ data }: SignupFunnelChartProps) {
  const chartData = [
    { name: "Page Views", value: data.pageViews },
    { name: "Started", value: data.signupStarted },
    { name: "Completed", value: data.signupCompleted },
    { name: "Failed", value: data.signupFailed },
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#9333ea" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
