import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createPlot,
  updatePlot,
  deletePlot,
  addUserToPlot,
  removeUserFromPlot,
  fetchPlots,
} from "../redux/slices/plotSlice";
import { fetchUsers, markUserPaid } from "../redux/slices/userSlice";
import { fetchLocations } from "../redux/slices/locationSlice";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaUserPlus,
  FaUserMinus,
  FaMoneyBillWave,
  FaSync,
} from "react-icons/fa";
import toast from "react-hot-toast";

const PlotManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    locationId: "",
    expectedAmount: 0,
    paidAmount: 0,
    expenses: 0,
  });

  const dispatch = useDispatch();
  const { plots, loading } = useSelector((state) => state.plots);
  const { locations } = useSelector((state) => state.locations);
  const { users } = useSelector((state) => state.users);

  // Function to refresh all data
  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchPlots()).unwrap(),
        dispatch(fetchUsers()).unwrap(),
        dispatch(fetchLocations()).unwrap(),
      ]);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  // Initial data fetch
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Set up polling for real-time updates (optional - every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshAllData]);

  const filteredPlots = plots.filter((plot) =>
    plot.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlot) {
        await dispatch(
          updatePlot({ id: editingPlot._id, data: formData }),
        ).unwrap();
        toast.success("Plot updated successfully!");
      } else {
        await dispatch(createPlot(formData)).unwrap();
        toast.success("Plot created successfully!");
      }
      await refreshAllData(); // Refresh after operation
      setIsModalOpen(false);
      setEditingPlot(null);
      setFormData({
        name: "",
        locationId: "",
        expectedAmount: 0,
        paidAmount: 0,
        expenses: 0,
      });
    } catch (error) {
      toast.error(error.message || "Operation failed");
    }
  };

  const handleEdit = (plot) => {
    setEditingPlot(plot);
    setFormData({
      name: plot.name,
      locationId: plot.locationId?._id || plot.locationId,
      expectedAmount: plot.expectedAmount || 0,
      paidAmount: plot.paidAmount || 0,
      expenses: plot.expenses || 0,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this plot?")) {
      try {
        await dispatch(deletePlot(id)).unwrap();
        toast.success("Plot deleted successfully!");
        await refreshAllData(); // Refresh after operation
      } catch (error) {
        toast.error(error.message || "Failed to delete plot");
      }
    }
  };

  const handleAddUser = (plot) => {
    setSelectedPlot(plot);
    setShowAddUserModal(true);
  };

  const handleMarkPaid = (user, plot) => {
    setSelectedUser(user);
    setSelectedPlot(plot);
    setPaymentAmount(0);
    setShowPaymentModal(true);
  };

  const handleRemoveUser = async (plotId, userId) => {
    if (
      window.confirm("Are you sure you want to remove this user from the plot?")
    ) {
      try {
        await dispatch(removeUserFromPlot({ plotId, userId })).unwrap();
        toast.success("User removed from plot successfully!");
        await refreshAllData(); // Refresh after operation
      } catch (error) {
        toast.error(error.message || "Failed to remove user");
      }
    }
  };

  const handleAddUserToPlot = async (userId) => {
    try {
      await dispatch(
        addUserToPlot({ plotId: selectedPlot._id, userId }),
      ).unwrap();
      toast.success("User added to plot successfully!");
      await refreshAllData(); // Refresh after operation
      setShowAddUserModal(false);
      setSelectedPlot(null);
    } catch (error) {
      toast.error(error.message || "Failed to add user");
    }
  };

  const handlePaymentSubmit = async () => {
    if (paymentAmount > 0) {
      try {
        await dispatch(
          markUserPaid({ id: selectedUser._id, amount: paymentAmount }),
        ).unwrap();
        toast.success(`Payment of KSh ${paymentAmount} added successfully!`);
        await refreshAllData(); // Refresh after payment
        setShowPaymentModal(false);
        setSelectedUser(null);
        setSelectedPlot(null);
        setPaymentAmount(0);
      } catch (error) {
        toast.error(error.message || "Failed to add payment");
      }
    } else {
      toast.error("Please enter a valid amount");
    }
  };

  const getUsersNotInPlot = () => {
    if (!selectedPlot) return [];
    return users.filter(
      (user) =>
        user.role === "user" &&
        (!selectedPlot.users ||
          !selectedPlot.users.some((u) => u._id === user._id)),
    );
  };

  const getLocationName = (locationId) => {
    if (!locationId) return "Unknown";
    const location = locations.find(
      (l) => l._id === (locationId._id || locationId),
    );
    return location ? location.name : "Unknown";
  };

  const getPaymentColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-red-100 text-red-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Plot Management</h1>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search plots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
          />
          <button
            onClick={refreshAllData}
            disabled={isRefreshing}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center disabled:opacity-50"
          >
            <FaSync className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center"
          >
            <FaPlus className="mr-2" /> Add Plot
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlots.map((plot) => (
          <div
            key={plot._id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{plot.name}</h3>
                  <p className="text-sm text-gray-600">
                    Location: {getLocationName(plot.locationId)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddUser(plot)}
                    className="text-green-500 hover:text-green-600"
                    title="Add User"
                  >
                    <FaUserPlus />
                  </button>
                  <button
                    onClick={() => handleEdit(plot)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(plot._id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Amount:</span>
                  <span className="font-semibold">
                    KSh {plot.expectedAmount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-semibold text-green-600">
                    KSh {plot.paidAmount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expenses:</span>
                  <span className="font-semibold text-red-600">
                    KSh {plot.expenses || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collection Rate:</span>
                  <span className="font-semibold">
                    {plot.expectedAmount > 0
                      ? Math.round(
                          (plot.paidAmount / plot.expectedAmount) * 100,
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">
                  Users in Plot ({plot.users?.length || 0})
                </h4>
                {plot.users && plot.users.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {plot.users.map((user) => (
                      <div
                        key={user._id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getPaymentColor(user.paymentStatus)}`}
                            >
                              {user.paymentStatus}
                            </span>
                            <span className="text-xs text-gray-600">
                              Paid: KSh {user.paidAmount || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleMarkPaid(user, plot)}
                            className="text-green-500 hover:text-green-600"
                            title="Mark as Paid"
                          >
                            <FaMoneyBillWave />
                          </button>
                          <button
                            onClick={() => handleRemoveUser(plot._id, user._id)}
                            className="text-red-500 hover:text-red-600"
                            title="Remove User"
                          >
                            <FaUserMinus />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No users in this plot yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plot Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingPlot ? "Edit Plot" : "Add New Plot"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Plot Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Location
                </label>
                <select
                  value={formData.locationId}
                  onChange={(e) =>
                    setFormData({ ...formData, locationId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Expected Amount (KSh)
                </label>
                <input
                  type="number"
                  value={formData.expectedAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedAmount: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Paid Amount (KSh)
                </label>
                <input
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paidAmount: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Expenses (KSh)
                </label>
                <input
                  type="number"
                  value={formData.expenses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expenses: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPlot(null);
                    setFormData({
                      name: "",
                      locationId: "",
                      expectedAmount: 0,
                      paidAmount: 0,
                      expenses: 0,
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  {editingPlot ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              Add User to {selectedPlot?.name}
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getUsersNotInPlot().map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleAddUserToPlot(user._id)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    Status: {user.paymentStatus}
                  </p>
                </button>
              ))}
              {getUsersNotInPlot().length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No users available to add
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setSelectedPlot(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Payment</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                User: {selectedUser?.name}
              </label>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Plot: {selectedPlot?.name}
              </label>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Amount (KSh)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="Enter amount"
                min="0"
                step="0.01"
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                Current paid: KSh {selectedUser?.paidAmount || 0}
              </p>
              <p className="text-sm text-gray-500">
                Status: {selectedUser?.paymentStatus}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedUser(null);
                  setSelectedPlot(null);
                  setPaymentAmount(0);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotManagement;
