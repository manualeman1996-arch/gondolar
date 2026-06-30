"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardBody } from "@/components/ui/card";

export function SearchesByDayChart({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  return (
    <Card>
      <CardBody>
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Búsquedas por día</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a5ef5" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1a5ef5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#1a5ef5"
                strokeWidth={2}
                fill="url(#g)"
                name="Búsquedas"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

export function FoundRatePie({
  found,
  notFound,
}: {
  found: number;
  notFound: number;
}) {
  const data = [
    { name: "Lo encontró", value: found, color: "#059669" },
    { name: "No lo encontró", value: notFound, color: "#ea7317" },
  ];
  const total = found + notFound;
  return (
    <Card>
      <CardBody>
        <h3 className="mb-4 text-sm font-semibold text-slate-800">
          Found vs. Not found
        </h3>
        {total === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Sin feedback aún.</p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function FeedbackByDayChart({
  data,
}: {
  data: { day: string; found: number; notFound: number }[];
}) {
  return (
    <Card>
      <CardBody>
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Feedback por día</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="found" stackId="a" fill="#059669" name="Encontró" radius={[2, 2, 0, 0]} />
              <Bar dataKey="notFound" stackId="a" fill="#ea7317" name="No encontró" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
