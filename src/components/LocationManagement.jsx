import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createLocation,
  updateLocation,
  deleteLocation,
  fetchLocations,
} from "../redux/slices/locationSlice";
import { createPlot, fetchPlots } from "../redux/slices/plotSlice";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaLayerGroup,
  FaSync,
} from "react-icons/fa";
import toast from "react-hot-toast";

const LocationManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [expandedLocations, setExpandedLocations] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
  });
  const [plotFormData, setPlotFormData] = useState({
    name: "",
    expectedAmount: 0,
    expenses: 0,
  });

  const dispatch = useDispatch();
  const { locations, loading } = useSelector((state) => state.locations);
  const { plots } = useSelector((state) => state.plots);

  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchLocations()).unwrap(),
        dispatch(fetchPlots()).unwrap(),
      ]);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllData();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  const filteredLocations = locations.filter(
    (location) =>
      location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await dispatch(
          updateLocation({ id: editingLocation._id, data: formData }),
        ).unwrap();
        toast.success("Location updated successfully!");
      } else {
        await dispatch(createLocation(formData)).unwrap();
        toast.success("Location created successfully!");
      }
      await refreshAllData();
      setIsModalOpen(false);
      setEditingLocation(null);
      setFormData({ name: "", address: "" });
    } catch (error) {
      toast.error(error.message || "Operation failed");
    }
  };

  const handleAddPlot = (location) => {
    setSelectedLocation(location);
    setPlotFormData({ name: "", expectedAmount: 0, expenses: 0 });
    setIsPlotModalOpen(true);
  };

  const handlePlotSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        createPlot({
          name: plotFormData.name,
          locationId: selectedLocation._id,
          expectedAmount: plotFormData.expectedAmount,
          expenses: plotFormData.expenses,
          paidAmount: 0,
        }),
      ).unwrap();
      toast.success("Plot added successfully!");
      await refreshAllData();
      setIsPlotModalOpen(false);
      setSelectedLocation(null);
      setPlotFormData({ name: "", expectedAmount: 0, expenses: 0 });
    } catch (error) {
      toast.error(error.message || "Failed to add plot");
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this location? This will also delete all plots in this location.",
      )
    ) {
      try {
        await dispatch(deleteLocation(id)).unwrap();
        toast.success("Location deleted successfully!");
        await refreshAllData();
      } catch (error) {
        toast.error(error.message || "Failed to delete location");
      }
    }
  };

  const toggleLocation = (locationId) => {
    setExpandedLocations((prev) => ({
      ...prev,
      [locationId]: !prev[locationId],
    }));
  };

  const getPlotsForLocation = (locationId) => {
    return plots.filter(
      (plot) =>
        plot.locationId?._id === locationId || plot.locationId === locationId,
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Location Management
        </h1>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search locations..."
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
            <FaPlus className="mr-2" /> Add Location
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      )}

      <div className="space-y-4">
        {filteredLocations.map((location) => (
          <div key={location._id} className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleLocation(location._id)}
                      className="mr-2 text-gray-500 hover:text-gray-700"
                    >
                      {expandedLocations[location._id] ? (
                        <FaChevronUp />
                      ) : (
                        <FaChevronDown />
                      )}
                    </button>
                    <div>
                      <h3 className="text-xl font-semibold">{location.name}</h3>
                      <p className="text-gray-600">{location.address}</p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddPlot(location)}
                    className="text-purple-500 hover:text-purple-600 p-2"
                    title="Add Plot"
                  >
                    <FaLayerGroup />
                  </button>
                  <button
                    onClick={() => handleEdit(location)}
                    className="text-blue-500 hover:text-blue-600 p-2"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(location._id)}
                    className="text-red-500 hover:text-red-600 p-2"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-500">Expected Amount</p>
                  <p className="text-lg font-bold text-gray-800">
                    KSh {location.totalExpectedAmount || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-500">Paid Amount</p>
                  <p className="text-lg font-bold text-green-600">
                    KSh {location.totalPaidAmount || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-500">Expenses</p>
                  <p className="text-lg font-bold text-red-600">
                    KSh {location.totalExpenses || 0}
                  </p>
                </div>
              </div>
            </div>

            {expandedLocations[location._id] && (
              <div className="p-6 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">
                    Plots in this Location (
                    {getPlotsForLocation(location._id).length})
                  </h4>
                  <button
                    onClick={() => handleAddPlot(location)}
                    className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition flex items-center"
                  >
                    <FaPlus className="mr-1 text-xs" /> Add Plot
                  </button>
                </div>
                {getPlotsForLocation(location._id).length > 0 ? (
                  <div className="space-y-2">
                    {getPlotsForLocation(location._id).map((plot) => (
                      <div
                        key={plot._id}
                        className="bg-white rounded p-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{plot.name}</p>
                          <p className="text-sm text-gray-500">
                            Users: {plot.users?.length || 0} | Expected: KSh{" "}
                            {plot.expectedAmount || 0} | Paid: KSh{" "}
                            {plot.paidAmount || 0}
                          </p>
                        </div>
                        <div className="text-sm">
                          <span className="text-green-600 font-semibold">
                            {plot.expectedAmount > 0
                              ? Math.round(
                                  (plot.paidAmount / plot.expectedAmount) * 100,
                                )
                              : 0}
                            % collected
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No plots in this location yet. Click "Add Plot" to create
                    one.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Location Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingLocation ? "Edit Location" : "Add New Location"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Location Name
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

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                  rows="3"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingLocation(null);
                    setFormData({ name: "", address: "" });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  {editingLocation ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Plot Modal */}
      {isPlotModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              Add Plot to {selectedLocation?.name}
            </h2>
            <form onSubmit={handlePlotSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Plot Name
                </label>
                <input
                  type="text"
                  value={plotFormData.name}
                  onChange={(e) =>
                    setPlotFormData({ ...plotFormData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Expected Amount (KSh)
                </label>
                <input
                  type="number"
                  value={plotFormData.expectedAmount}
                  onChange={(e) =>
                    setPlotFormData({
                      ...plotFormData,
                      expectedAmount: parseFloat(e.target.value),
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
                  value={plotFormData.expenses}
                  onChange={(e) =>
                    setPlotFormData({
                      ...plotFormData,
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
                    setIsPlotModalOpen(false);
                    setSelectedLocation(null);
                    setPlotFormData({
                      name: "",
                      expectedAmount: 0,
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
                  Add Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationManagement;
