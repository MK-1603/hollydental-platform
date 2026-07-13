"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { TrendingUp, RefreshCw, BarChart3, Users } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/analytics/overview")
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const COLORS = ["#0A1628", "#C9A96E", "#059669", "#DC2626"];

  const topTreatments = [
    { name: "Whitening", value: 120 },
    { name: "Cleaning", value: 340 },
    { name: "Invisalign", value: 85 },
    { name: "Bonding", value: 150 },
    { name: "Veneers", value: 45 },
  ];

  const bookingSources = [
    { name: "Website", value: 650 },
    { name: "Phone", value: 250 },
    { name: "Walk-in", value: 100 },
  ];

  return (
    <div className="pb-10 w-full">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 py-4 px-4 md:px-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy">Analytics & Metrics</h1>
          <p className="text-gray-500 text-xs mt-1">Review clinical statistics, transaction rates, and booking conversion metrics</p>
        </div>
      </div>

      <div className="px-4 md:px-6 pt-6 space-y-6">
      {loading ? (
        <div className="h-[400px] shimmer rounded-2xl" />
      ) : !data ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500">Failed to load analytics data.</div>
      ) : (
        <div className="space-y-6">
          
          {/* Financials & Growth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Revenue Line Plot */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-serif text-sm font-bold text-navy flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-gold" /> 12-Month Financial Revenue Flow
              </h3>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.revenueHistory}>
                    <XAxis dataKey="name" fontSize={10} stroke="#9CA3AF" />
                    <YAxis fontSize={10} stroke="#9CA3AF" />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#C9A96E" strokeWidth={3} dot={{ fill: "#0A1628" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Patient Growth Bar Plot */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-serif text-sm font-bold text-navy flex items-center gap-1.5">
                <Users className="w-5 h-5 text-navy" /> Quarterly Patient Account Registrations
              </h3>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.patientHistory}>
                    <XAxis dataKey="name" fontSize={10} stroke="#9CA3AF" />
                    <YAxis fontSize={10} stroke="#9CA3AF" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0A1628" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Treatments & Source */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top treatments bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-serif text-sm font-bold text-navy flex items-center gap-1.5">
                <BarChart3 className="w-5 h-5 text-gold" /> Top Procedures Volume
              </h3>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTreatments} layout="vertical">
                    <XAxis type="number" fontSize={10} stroke="#9CA3AF" />
                    <YAxis dataKey="name" type="category" fontSize={10} stroke="#9CA3AF" width={70} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#C9A96E" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Booking source Pie */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-serif text-sm font-bold text-navy">Acquisition Booking Channels</h3>
              <div className="h-[200px] flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={bookingSources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                      {bookingSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}
      </div>

    </div>
  );
}
