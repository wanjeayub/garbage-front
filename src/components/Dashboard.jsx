import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchLocations } from "../redux/slices/locationSlice";
import { fetchPlots } from "../redux/slices/plotSlice";
import { fetchUsers } from "../redux/slices/userSlice";
import { FaSync } from "react-icons/fa";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [view, setView] = useState("monthly");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dispatch = useDispatch();
  const { locations } = useSelector((state) => state.locations);
  const { plots } = useSelector((state) => state.plots);
  const { users } = useSelector((state) => state.users);

  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchLocations()).unwrap(),
        dispatch(fetchPlots()).unwrap(),
        dispatch(fetchUsers()).unwrap(),
      ]);
      toast.success("Dashboard refreshed!");
    } catch (error) {
      console.error("Refresh failed:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllData();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  const totalExpected = plots.reduce(
    (sum, plot) => sum + (plot.expectedAmount || 0),
    0,
  );
  const totalPaid = plots.reduce(
    (sum, plot) => sum + (plot.paidAmount || 0),
    0,
  );
  const totalExpenses = plots.reduce(
    (sum, plot) => sum + (plot.expenses || 0),
    0,
  );

  const paidUsers = users.filter((u) => u.paymentStatus === "paid").length;
  const pendingUsers = users.filter(
    (u) => u.paymentStatus === "pending",
  ).length;
  const partialUsers = users.filter(
    (u) => u.paymentStatus === "partial",
  ).length;

  const generateMonthlyData = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months.map((month) => ({
      name: month,
      paid: Math.floor(Math.random() * 5000) + 3000,
      expected: 8000,
    }));
  };

  const generateYearlyData = () => {
    const years = ["2021", "2022", "2023", "2024"];
    return years.map((year) => ({
      name: year,
      paid: Math.floor(Math.random() * 50000) + 45000,
      expected: 96000,
    }));
  };

  const monthlyData = generateMonthlyData();
  const yearlyData = generateYearlyData();
  const chartData = view === "monthly" ? monthlyData : yearlyData;

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={refreshAllData}
            disabled={isRefreshing}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center disabled:opacity-50"
          >
            <FaSync className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setView("monthly")}
            className={`px-4 py-2 rounded ${view === "monthly" ? "bg-green-500 text-white" : "bg-gray-200"}`}
          >
            Monthly View
          </button>
          <button
            onClick={() => setView("annually")}
            className={`px-4 py-2 rounded ${view === "annually" ? "bg-green-500 text-white" : "bg-gray-200"}`}
          >
            Annual View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm mb-2">Total Locations</h3>
          <p className="text-3xl font-bold text-gray-800">{locations.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm mb-2">Total Plots</h3>
          <p className="text-3xl font-bold text-gray-800">{plots.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-gray-800">{users.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm mb-2">Collection Rate</h3>
          <p className="text-3xl font-bold text-green-600">
            {totalExpected > 0
              ? Math.round((totalPaid / totalExpected) * 100)
              : 0}
            %
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Payment Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `KSh ${value}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="paid"
                stroke="#10B981"
                name="Paid Amount"
              />
              <Line
                type="monotone"
                dataKey="expected"
                stroke="#EF4444"
                name="Expected Amount"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">User Payment Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { status: "Paid", count: paidUsers },
                { status: "Pending", count: pendingUsers },
                { status: "Partial", count: partialUsers },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" name="Number of Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Location Summary</h2>
          <div className="space-y-4">
            {locations.map((location) => (
              <div key={location._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">{location.name}</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Expected</p>
                    <p className="font-semibold">
                      KSh {location.totalExpectedAmount || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Paid</p>
                    <p className="font-semibold text-green-600">
                      KSh {location.totalPaidAmount || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Expenses</p>
                    <p className="font-semibold text-red-600">
                      KSh {location.totalExpenses || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
