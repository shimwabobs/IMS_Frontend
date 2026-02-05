"use client"
import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import useFetch from "../hooks/useFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, FilterIcon, PlusIcon, Trash2Icon, FileTextIcon, DownloadIcon, BarChart3Icon, TrendingUpIcon } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { LogOutIcon } from "lucide-react";

type Inventory = { quantity: number };

type Product = {
  product_id: number | string;
  product_name: string;
  price: number | string;
  inventory: Inventory;
  quantity?: number;
};

type Shop = {
  shop_id: number;
  shop_name: string;
  products: Product[];
};

type Sale = {
  sale_id?: number;
  productId: number | string;
  buyer: string;
  description: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  product?: {
    name: string;
    price: number;
  };
};

type DashboardResponse = {
  message: string;
  dashboard: {
    user_id: number;
    email: string;
    Fullname: string;
    shops: Shop[];
  };
};

type SalesResponse = {
  success: boolean;
  count: number;
  data: Sale[];
};

// Add these types to your existing types section
type StockEntry = {
  entry_id: string;
  supplier: string;
  description: string;
  quantity: number;
  productId?: number | string;
  shopId?: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    product_name: string;
    price: number;
  };
  shop?: {
    shop_name: string;
  };
};

type StockEntryResponse = {
  success: boolean;
  message: string;
  data: StockEntry[];
  count?: number;
  totalQuantity?: number;
  totalEntries?: number;
  recentEntries?: StockEntry[];
};

const PIE_COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#e0f2fe"];

// ShopSidebar Component
const ShopSidebar = ({ 
  shops, 
  selectedShop, 
  onSelectShop, 
  activePage,
  tempStartDate,
  setTempStartDate,
  tempEndDate,
  setTempEndDate,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  fetchSales
}: {
  shops: Shop[];
  selectedShop: number | null;
  onSelectShop: (shopId: number) => void;
  activePage: string;
  tempStartDate: string;
  setTempStartDate: (date: string) => void;
  tempEndDate: string;
  setTempEndDate: (date: string) => void;
  filterStartDate: string;
  setFilterStartDate: (date: string) => void;
  filterEndDate: string;
  setFilterEndDate: (date: string) => void;
  fetchSales: (shopId?: number) => Promise<void>;
}) => {
  if (activePage !== "sales") return null;
  
  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 p-4">
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <FilterIcon className="w-4 h-4" />
          Shop Selection
        </h3>
        <p className="text-sm text-gray-600 mb-4">Select a shop to view its sales</p>
      </div>
      
      <div className="space-y-2">
        {shops.map((shop) => (
          <button
            key={shop.shop_id}
            onClick={() => onSelectShop(shop.shop_id)}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
              selectedShop === shop.shop_id
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <div className="font-medium text-gray-800">{shop.shop_name}</div>
            <div className="text-sm text-gray-500 mt-1">
              {shop.products?.length || 0} products
            </div>
            {selectedShop === shop.shop_id && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-blue-600 font-medium">Selected</span>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Date Range Filter */}
      <div className="mt-8">
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          Date Range Filter
        </h4>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="start-date" className="text-sm">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="end-date" className="text-sm">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => {
                setFilterStartDate(tempStartDate);
                setFilterEndDate(tempEndDate);
                fetchSales(selectedShop || undefined);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              Apply Dates
            </Button>
            <Button
              onClick={() => {
                setTempStartDate("");
                setTempEndDate("");
                setFilterStartDate("");
                setFilterEndDate("");
                fetchSales(selectedShop || undefined);
              }}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          </div>
        </div>
        
        {/* Active filters display */}
        {(filterStartDate || filterEndDate) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-blue-800 font-medium mb-1">Active Filters:</div>
            {filterStartDate && (
              <div className="text-xs text-blue-700">From: {new Date(filterStartDate).toLocaleDateString()}</div>
            )}
            {filterEndDate && (
              <div className="text-xs text-blue-700">To: {new Date(filterEndDate).toLocaleDateString()}</div>
            )}
          </div>
        )}
      </div>
      
      {/* Shop Stats */}
      {selectedShop && (
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Shop Info</div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Selected: {shops.find(s => s.shop_id === selectedShop)?.shop_name}</div>
            <div>Total Products: {shops.find(s => s.shop_id === selectedShop)?.products.length || 0}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// StockEntrySidebar Component
const StockEntrySidebar = ({ 
  shops, 
  selectedShop, 
  onSelectShop, 
  activePage,
  tempStockEntryStartDate,
  setTempStockEntryStartDate,
  tempStockEntryEndDate,
  setTempStockEntryEndDate,
  stockEntryFilterStartDate,
  setStockEntryFilterStartDate,
  stockEntryFilterEndDate,
  setStockEntryFilterEndDate,
  stockEntrySearchTerm,
  setStockEntrySearchTerm,
  fetchStockEntries
}: {
  shops: Shop[];
  selectedShop: number | null;
  onSelectShop: (shopId: number) => void;
  activePage: string;
  tempStockEntryStartDate: string;
  setTempStockEntryStartDate: (date: string) => void;
  tempStockEntryEndDate: string;
  setTempStockEntryEndDate: (date: string) => void;
  stockEntryFilterStartDate: string;
  setStockEntryFilterStartDate: (date: string) => void;
  stockEntryFilterEndDate: string;
  setStockEntryFilterEndDate: (date: string) => void;
  stockEntrySearchTerm: string;
  setStockEntrySearchTerm: (term: string) => void;
  fetchStockEntries: (shopId?: number) => Promise<void>;
}) => {
  if (activePage !== "entry") return null;
  
  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 p-4">
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <FilterIcon className="w-4 h-4" />
          Shop Selection
        </h3>
        <p className="text-sm text-gray-600 mb-4">Select a shop to manage stock entries</p>
      </div>
      
      <div className="space-y-2">
        {shops.map((shop) => (
          <button
            key={shop.shop_id}
            onClick={() => onSelectShop(shop.shop_id)}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
              selectedShop === shop.shop_id
                ? 'bg-green-50 border border-green-200'
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <div className="font-medium text-gray-800">{shop.shop_name}</div>
            <div className="text-sm text-gray-500 mt-1">
              {shop.products?.length || 0} products in inventory
            </div>
            {selectedShop === shop.shop_id && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-green-600 font-medium">Selected</span>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Date Range Filter */}
      <div className="mt-8">
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          Date Range Filter
        </h4>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="stock-start-date" className="text-sm">Start Date</Label>
            <Input
              id="stock-start-date"
              type="date"
              value={tempStockEntryStartDate}
              onChange={(e) => setTempStockEntryStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="stock-end-date" className="text-sm">End Date</Label>
            <Input
              id="stock-end-date"
              type="date"
              value={tempStockEntryEndDate}
              onChange={(e) => setTempStockEntryEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => {
                setStockEntryFilterStartDate(tempStockEntryStartDate);
                setStockEntryFilterEndDate(tempStockEntryEndDate);
                if (selectedShop) {
                  fetchStockEntries(selectedShop);
                }
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              Apply Dates
            </Button>
            <Button
              onClick={() => {
                setTempStockEntryStartDate("");
                setTempStockEntryEndDate("");
                setStockEntryFilterStartDate("");
                setStockEntryFilterEndDate("");
                if (selectedShop) {
                  fetchStockEntries(selectedShop);
                }
              }}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          </div>
        </div>
        
        {/* Active filters display */}
        {(stockEntryFilterStartDate || stockEntryFilterEndDate) && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="text-xs text-green-800 font-medium mb-1">Active Filters:</div>
            {stockEntryFilterStartDate && (
              <div className="text-xs text-green-700">From: {new Date(stockEntryFilterStartDate).toLocaleDateString()}</div>
            )}
            {stockEntryFilterEndDate && (
              <div className="text-xs text-green-700">To: {new Date(stockEntryFilterEndDate).toLocaleDateString()}</div>
            )}
          </div>
        )}
      </div>
      
      {/* Search */}
      <div className="mt-6">
        <Label htmlFor="stock-search" className="text-sm mb-2 block">Search Entries</Label>
        <Input
          id="stock-search"
          placeholder="Search supplier or description..."
          value={stockEntrySearchTerm}
          onChange={(e) => setStockEntrySearchTerm(e.target.value)}
          className="text-sm"
        />
        <Button
          onClick={() => {
            if (selectedShop) {
              fetchStockEntries(selectedShop);
            }
          }}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          Search
        </Button>
      </div>
    </div>
  );
};

// ReportsSidebar Component
const ReportsSidebar = ({ 
  shops, 
  selectedShop, 
  onSelectShop, 
  activePage,
  reportStartDate,
  setReportStartDate,
  reportEndDate,
  setReportEndDate,
  reportType,
  setReportType,
  fetchReportData,
  loadingReport
}: {
  shops: Shop[];
  selectedShop: number | null;
  onSelectShop: (shopId: number) => void;
  activePage: string;
  reportStartDate: string;
  setReportStartDate: (date: string) => void;
  reportEndDate: string;
  setReportEndDate: (date: string) => void;
  reportType: string;
  setReportType: (type: "summary" | "detailed" | "financial") => void;
  fetchReportData: () => Promise<void>;
  loadingReport: boolean;
}) => {
  if (activePage !== "reports") return null;
  
  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 p-4">
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <FileTextIcon className="w-4 h-4" />
          Report Configuration
        </h3>
        <p className="text-sm text-gray-600 mb-4">Select parameters for your report</p>
      </div>
      
      {/* Shop Selection */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-2 block">Select Shop</Label>
        <div className="space-y-2">
          {shops.map((shop) => (
            <button
              key={shop.shop_id}
              onClick={() => onSelectShop(shop.shop_id)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                selectedShop === shop.shop_id
                  ? 'bg-purple-50 border border-purple-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="font-medium text-gray-800">{shop.shop_name}</div>
              <div className="text-sm text-gray-500 mt-1">
                {shop.products?.length || 0} products
              </div>
              {selectedShop === shop.shop_id && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-purple-600 font-medium">Selected</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Date Range */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-2 block">Date Range</Label>
        <div className="space-y-3">
          <div>
            <Label htmlFor="report-start" className="text-xs">Start Date</Label>
            <Input
              id="report-start"
              type="date"
              value={reportStartDate}
              onChange={(e) => setReportStartDate(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="report-end" className="text-xs">End Date</Label>
            <Input
              id="report-end"
              type="date"
              value={reportEndDate}
              onChange={(e) => setReportEndDate(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Report Type */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-2 block">Report Type</Label>
        <div className="space-y-2">
          <button
            onClick={() => setReportType("summary")}
            className={`w-full text-left p-2 rounded text-sm ${
              reportType === "summary" 
                ? "bg-purple-100 text-purple-700 border border-purple-300" 
                : "hover:bg-gray-50"
            }`}
          >
            📊 Summary Report
          </button>
          <button
            onClick={() => setReportType("detailed")}
            className={`w-full text-left p-2 rounded text-sm ${
              reportType === "detailed" 
                ? "bg-purple-100 text-purple-700 border border-purple-300" 
                : "hover:bg-gray-50"
            }`}
          >
            📄 Detailed Report
          </button>
          <button
            onClick={() => setReportType("financial")}
            className={`w-full text-left p-2 rounded text-sm ${
              reportType === "financial" 
                ? "bg-purple-100 text-purple-700 border border-purple-300" 
                : "hover:bg-gray-50"
            }`}
          >
            💰 Financial Report
          </button>
        </div>
      </div>
      
      <div className="mt-8">
        <Button
          onClick={fetchReportData}
          disabled={!selectedShop || !reportStartDate || !reportEndDate || loadingReport}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loadingReport ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <BarChart3Icon className="w-4 h-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
        
        {selectedShop && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs font-medium text-gray-700 mb-1">Selected Shop</div>
            <div className="text-sm text-gray-800">
              {shops.find(s => s.shop_id === selectedShop)?.shop_name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Period: {reportStartDate || "?"} to {reportEndDate || "?"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function DashboardApp() {
  // State variables
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [shopName, setShopName] = useState("");
  const [location, setLocation] = useState("");
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingShopId, setDeletingShopId] = useState<number | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | string | null>(null);
  const [activePage, setActivePage] = useState<"dashboard" | "inventory" | "sales" | "entry" | "reports" | "settings">("dashboard");
  
  // Add to your existing state variables at the top
const [loggingOut, setLoggingOut] = useState(false);

// Add the logout function
const handleLogout = async () => {
  if (!confirm("Are you sure you want to logout?")) return;
  
  setLoggingOut(true);
  
  try {
    const response = await fetch("http://localhost:8000/api/v1/user/logout", {
      method: "POST",
      credentials: "include", // Include cookies for session-based auth
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (response.ok) {
      // Clear any local state if needed
      localStorage.removeItem("token"); // if you use localStorage
      sessionStorage.removeItem("token"); // if you use sessionStorage
      
      // Redirect to login page or home
      window.location.href = "/"; // Change to your login page URL
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || "Logout failed");
    }
  } catch (error:any) {
    console.error("Logout error:", error);
    alert(`Logout failed: ${error.message}`);
    
    // Still redirect to login page even if logout API fails
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  } finally {
    setLoggingOut(false);
  }
};
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleBuyer, setSaleBuyer] = useState("");
  const [saleDescription, setSaleDescription] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const [selectedShopForSales, setSelectedShopForSales] = useState<number | null>(null);
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [tempStartDate, setTempStartDate] = useState<string>("");
  const [tempEndDate, setTempEndDate] = useState<string>("");
  
  // Stock Entry state
  const [showStockEntryModal, setShowStockEntryModal] = useState(false);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loadingStockEntries, setLoadingStockEntries] = useState(false);
  const [stockEntrySupplier, setStockEntrySupplier] = useState("");
  const [stockEntryDescription, setStockEntryDescription] = useState("");
  const [stockEntryQuantity, setStockEntryQuantity] = useState("1");
  const [selectedStockEntryProductId, setSelectedStockEntryProductId] = useState<string>("");
  const [stockEntryFilterStartDate, setStockEntryFilterStartDate] = useState<string>("");
  const [stockEntryFilterEndDate, setStockEntryFilterEndDate] = useState<string>("");
  const [tempStockEntryStartDate, setTempStockEntryStartDate] = useState<string>("");
  const [tempStockEntryEndDate, setTempStockEntryEndDate] = useState<string>("");
  const [stockEntrySearchTerm, setStockEntrySearchTerm] = useState("");
  const [selectedShopForStock, setSelectedShopForStock] = useState<number | null>(null);
  const [stockStats, setStockStats] = useState({
    totalEntries: 0,
    totalQuantity: 0,
    averageQuantity: 0,
    recentEntries: [] as StockEntry[]
  });

  // Reports state
  const [selectedShopForReports, setSelectedShopForReports] = useState<number | null>(null);
  const [reportStartDate, setReportStartDate] = useState<string>("");
  const [reportEndDate, setReportEndDate] = useState<string>("");
  const [reportType, setReportType] = useState<"summary" | "detailed" | "financial">("summary");
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [reportData, setReportData] = useState<{
    sales: Sale[];
    stockEntries: StockEntry[];
    salesSummary: {
      totalRevenue: number;
      totalTransactions: number;
      averageSale: number;
      bestSellingProduct?: { name: string; quantity: number; revenue: number };
    };
    stockSummary: {
      totalEntries: number;
      totalQuantityAdded: number;
      topSuppliers: Array<{ name: string; quantity: number }>;
    };
    timePeriod: string;
  } | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // API hooks
  const {
    result: dashboardResult,
    error: dashboardError,
    loading: dashboardLoading,
    fetchData: fetchDashboard,
  } = useFetch<DashboardResponse>("http://localhost:8000/api/v1/dashboard/dashboard/", "GET");

  const { fetchData: addShop } = useFetch("http://localhost:8000/api/v1/shop/new-shop", "POST");
  const { fetchData: addProduct } = useFetch("http://localhost:8000/api/v1/product/addProduct", "POST");
  const { fetchData: addSale, loading: addingSale } = useFetch("http://localhost:8000/api/v1/sales/newSale", "POST");

  // Memoized values
  const shops: Shop[] = dashboardResult?.dashboard?.shops ?? [];
  
  const allProducts = useMemo(() => {
    return shops.flatMap(shop => 
      shop.products.map(product => ({
        ...product,
        shop_name: shop.shop_name
      }))
    );
  }, [shops]);
  const totalProducts = useMemo(() => 
  shops.reduce((sum, s) => sum + (s.products?.length ?? 0), 0), [shops]);

const totalQuantity = useMemo(() => 
  shops.reduce((sum, s) => 
    sum + (s.products?.reduce((pSum, p) => pSum + (Number(p.inventory?.quantity ?? 0)), 0) ?? 0), 0), [shops]);

const totalInventoryValue = useMemo(() => 
  shops.reduce((total, shop) => {
    return total + shop.products.reduce((sum, product) => {
      const quantity = product.inventory?.quantity || 0;
      const price = Number(product.price) || 0;
      return sum + (quantity * price);
    }, 0);
  }, 0), [shops]);

// Calculate data for graphs - always call these hooks
const pieChartData = useMemo(() => {
  if (shops.length === 0) return [];
  
  return shops.map(shop => ({
    name: shop.shop_name,
    value: shop.products?.length || 0,
    color: PIE_COLORS[shops.indexOf(shop) % PIE_COLORS.length]
  }));
}, [shops]);

const lineChartData = useMemo(() => {
  if (shops.length === 0) return [];
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  // Get last 6 months
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    last6Months.push(months[monthIndex]);
  }
  
  // Generate trend data (starting lower and growing to current value)
  return last6Months.map((month, index) => {
    const percentage = 60 + (index * 8); // 60%, 68%, 76%, 84%, 92%, 100%
    const value = Math.round((totalInventoryValue * percentage) / 100);
    return { month, value };
  });
}, [shops, totalInventoryValue]);

  // Fetch dashboard on mount only
  useEffect(() => {
    fetchDashboard();
  }, []);

  // Sales functions
  const fetchSales = async (shopId?: number) => {
    setLoadingSales(true);
    try {
      let url = "http://localhost:8000/api/v1/sales/allSales";
      const params = new URLSearchParams();
      
      const targetShopId = shopId || selectedShopForSales || (shops.length > 0 ? shops[0].shop_id : null);
      
      if (!targetShopId) {
        setLoadingSales(false);
        return;
      }
      
      params.append("shopId", targetShopId.toString());
      
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        credentials: "include",
      });
      const data: SalesResponse = await response.json();
      
      if (data.success) {
        setSalesData(data.data);
        setTotalSalesCount(data.count);
        const revenue = data.data.reduce((sum, sale) => sum + sale.totalPrice, 0);
        setTotalRevenue(revenue);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoadingSales(false);
    }
  };

  const handleAddSale = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!selectedProductId || !saleBuyer.trim()) {
      alert("Please select a product and enter buyer name");
      return;
    }
    
    const selectedProduct = allProducts.find(p => p.product_id.toString() === selectedProductId);
    if (!selectedProduct) {
      alert("Product not found");
      return;
    }
    
    const productShop = shops.find(shop => 
      shop.products.some(p => p.product_id.toString() === selectedProductId)
    );
    
    if (!productShop) {
      alert("Cannot determine product shop");
      return;
    }
    
    const requestedQuantity = parseInt(saleQuantity, 10);
    const availableQuantity = Number(selectedProduct.inventory?.quantity || 0);
    
    if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }
    
    if (requestedQuantity > availableQuantity) {
      alert(`Insufficient stock! Available: ${availableQuantity}`);
      return;
    }
    
    try {
      const unitPrice = Number(selectedProduct.price);
      const totalPrice = unitPrice * requestedQuantity;
      
      const saleData = {
        productId: selectedProductId,
        buyer: saleBuyer.trim(),
        description: saleDescription.trim(),
        quantity: requestedQuantity,
        totalPrice: totalPrice,
        shopId: productShop.shop_id,
        productName: selectedProduct.product_name,
        price: unitPrice
      };
      
      console.log("Sending sale data:", saleData);
      
      await addSale(saleData);
      
      setSaleBuyer("");
      setSaleDescription("");
      setSaleQuantity("1");
      setSelectedProductId("");
      setShowSaleModal(false);

      setTimeout(() => {
        fetchDashboard();
        if (selectedShopForSales === productShop.shop_id) {
          fetchSales(productShop.shop_id);
        } else {
          setSelectedShopForSales(productShop.shop_id);
          fetchSales(productShop.shop_id);
        }
      }, 1000);
      
      alert("Sale recorded successfully!");
      
    } catch (error: any) {
      console.error("Error adding sale:", error);
      alert(`Error adding sale: ${error.message || "Please try again."}`);
    }
  };

  const handleDeleteSale = async (saleId: number) => {
    if (!confirm("Are you sure you want to delete this sale record?")) return;
    
    try {
      await fetch(`http://localhost:8000/api/v1/sales/${saleId}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchSales(selectedShopForSales || undefined);
    } catch (error) {
      console.error("Error deleting sale:", error);
    }
  };

  const applyDateFilter = () => {
    setFilterStartDate(startDate);
    setFilterEndDate(endDate);
    fetchSales(selectedShopForSales || undefined);
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilterStartDate("");
    setFilterEndDate("");
    fetchSales(selectedShopForSales || undefined);
  };

  // Stock Entry functions
  const fetchStockEntries = async (shopId?: number) => {
    setLoadingStockEntries(true);
    try {
      let url = "http://localhost:8000/api/v1/stock/allEntries";
      const params = new URLSearchParams();
      
      const targetShopId = shopId || selectedShopForStock || (shops.length > 0 ? shops[0].shop_id : null);
      
      if (targetShopId) {
        params.append("shopId", targetShopId.toString());
      }
      
      if (stockEntryFilterStartDate) params.append("startDate", stockEntryFilterStartDate);
      if (stockEntryFilterEndDate) params.append("endDate", stockEntryFilterEndDate);
      if (stockEntrySearchTerm) params.append("search", stockEntrySearchTerm);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        credentials: "include",
      });
      const data: StockEntryResponse = await response.json();
      
      if (data.success) {
        setStockEntries(data.data);
        
        const totalQty = data.data.reduce((sum, entry) => sum + entry.quantity, 0);
        const avgQty = data.data.length > 0 ? totalQty / data.data.length : 0;
        
        setStockStats({
          totalEntries: data.data.length,
          totalQuantity: totalQty,
          averageQuantity: Math.round(avgQty * 100) / 100,
          recentEntries: data.data.slice(0, 5)
        });
      }
    } catch (error) {
      console.error("Error fetching stock entries:", error);
    } finally {
      setLoadingStockEntries(false);
    }
  };

  const handleAddStockEntry = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!selectedStockEntryProductId || !stockEntrySupplier.trim()) {
      alert("Please select a product and enter supplier name");
      return;
    }
    
    const selectedProduct = allProducts.find(p => p.product_id.toString() === selectedStockEntryProductId);
    if (!selectedProduct) {
      alert("Product not found");
      return;
    }
    
    const productShop = shops.find(shop => 
      shop.products.some(p => p.product_id.toString() === selectedStockEntryProductId)
    );
    
    if (!productShop) {
      alert("Cannot determine product shop");
      return;
    }
    
    const quantity = parseInt(stockEntryQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }
    
    try {
      const response = await fetch("http://localhost:8000/api/v1/stock/newStock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId: selectedStockEntryProductId,
          shopId: productShop.shop_id,
          supplier: stockEntrySupplier.trim(),
          description: stockEntryDescription.trim(),
          quantity: quantity
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStockEntrySupplier("");
        setStockEntryDescription("");
        setStockEntryQuantity("1");
        setSelectedStockEntryProductId("");
        setShowStockEntryModal(false);
        
        setTimeout(() => {
          fetchDashboard();
          if (selectedShopForStock === productShop.shop_id) {
            fetchStockEntries(productShop.shop_id);
          } else {
            setSelectedShopForStock(productShop.shop_id);
            fetchStockEntries(productShop.shop_id);
          }
        }, 500);
        
        alert("Stock entry added successfully!");
      } else {
        throw new Error(result.message);
      }
      
    } catch (error: any) {
      console.error("Error adding stock entry:", error);
      alert(`Error: ${error.message || "Failed to add stock entry"}`);
    }
  };

  const handleDeleteStockEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this stock entry? This will adjust inventory quantities.")) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/stock/${entryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert("Stock entry deleted successfully");
        if (selectedShopForStock) {
          fetchStockEntries(selectedShopForStock);
          fetchDashboard();
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("Error deleting stock entry:", error);
      alert(`Error: ${error.message || "Failed to delete stock entry"}`);
    }
  };

  // Reports functions
  const fetchReportData = async () => {
    if (!selectedShopForReports) {
      alert("Please select a shop to generate report");
      return;
    }

    if (!reportStartDate || !reportEndDate) {
      alert("Please select a date range for the report");
      return;
    }

    setLoadingReport(true);
    try {
      // Fetch sales data
      const salesUrl = `http://localhost:8000/api/v1/sales/allSales?shopId=${selectedShopForReports}&startDate=${reportStartDate}&endDate=${reportEndDate}`;
      const salesResponse = await fetch(salesUrl, { credentials: "include" });
      const salesData: SalesResponse = await salesResponse.json();

      // Fetch stock entries data
      const stockUrl = `http://localhost:8000/api/v1/stock/allEntries?shopId=${selectedShopForReports}&startDate=${reportStartDate}&endDate=${reportEndDate}`;
      const stockResponse = await fetch(stockUrl, { credentials: "include" });
      const stockData: StockEntryResponse = await stockResponse.json();

      if (salesData.success && stockData.success) {
        // Calculate sales summary
        const totalRevenue = salesData.data.reduce((sum, sale) => sum + sale.totalPrice, 0);
        const totalTransactions = salesData.data.length;
        const averageSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        // Find best selling product
        const productSales = salesData.data.reduce((acc, sale) => {
          const productName = sale.product?.name || `Product ID: ${sale.productId}`;
          if (!acc[productName]) {
            acc[productName] = { quantity: 0, revenue: 0 };
          }
          acc[productName].quantity += sale.quantity;
          acc[productName].revenue += sale.totalPrice;
          return acc;
        }, {} as Record<string, { quantity: number; revenue: number }>);

        let bestSellingProduct: { name: string; quantity: number; revenue: number } | undefined;
        if (Object.keys(productSales).length > 0) {
          const best = Object.entries(productSales).reduce((max, [name, data]) => {
            return data.quantity > max.data.quantity ? { name, data } : max;
          }, { name: '', data: { quantity: 0, revenue: 0 } });
          
          bestSellingProduct = {
            name: best.name,
            quantity: best.data.quantity,
            revenue: best.data.revenue
          };
        }

        // Calculate stock summary
        const topSuppliers = stockData.data.reduce((acc, entry) => {
          if (!acc[entry.supplier]) {
            acc[entry.supplier] = 0;
          }
          acc[entry.supplier] += entry.quantity;
          return acc;
        }, {} as Record<string, number>);

        const topSuppliersArray = Object.entries(topSuppliers)
          .map(([name, quantity]) => ({ name, quantity }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);

        setReportData({
          sales: salesData.data,
          stockEntries: stockData.data,
          salesSummary: {
            totalRevenue,
            totalTransactions,
            averageSale,
            bestSellingProduct
          },
          stockSummary: {
            totalEntries: stockData.data.length,
            totalQuantityAdded: stockData.data.reduce((sum, entry) => sum + entry.quantity, 0),
            topSuppliers: topSuppliersArray
          },
          timePeriod: `${reportStartDate} to ${reportEndDate}`
        });
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      alert("Error fetching report data. Please try again.");
    } finally {
      setLoadingReport(false);
    }
  };

  const generatePDFReport = async () => {
    if (!reportData) {
      alert("Please generate a report first");
      return;
    }

    setGeneratingPDF(true);
    
    try {
      const doc = new jsPDF();
      const shopName = shops.find(s => s.shop_id === selectedShopForReports)?.shop_name || "Unknown Shop";
      
      // Report Header
      doc.setFontSize(20);
      doc.text("Inventory Management System Report", 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Shop: ${shopName}`, 20, 30);
      doc.text(`Period: ${reportStartDate} to ${reportEndDate}`, 20, 37);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 44);
      
      // Summary Section
      doc.setFontSize(16);
      doc.text("Executive Summary", 20, 60);
      
      doc.setFontSize(10);
      let yPos = 70;
      
      // Sales Summary
      doc.setFont("helvetica", "bold");
      doc.text("Sales Summary:", 20, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 7;
      doc.text(`• Total Revenue: ${reportData.salesSummary.totalRevenue.toLocaleString()} RWF`, 25, yPos);
      yPos += 7;
      doc.text(`• Total Transactions: ${reportData.salesSummary.totalTransactions}`, 25, yPos);
      yPos += 7;
      doc.text(`• Average Sale: ${Math.round(reportData.salesSummary.averageSale).toLocaleString()} RWF`, 25, yPos);
      yPos += 7;
      
      if (reportData.salesSummary.bestSellingProduct) {
        doc.text(`• Best Selling Product: ${reportData.salesSummary.bestSellingProduct.name}`, 25, yPos);
        yPos += 7;
        doc.text(`  Quantity Sold: ${reportData.salesSummary.bestSellingProduct.quantity}`, 30, yPos);
        yPos += 7;
        doc.text(`  Revenue Generated: ${reportData.salesSummary.bestSellingProduct.revenue.toLocaleString()} RWF`, 30, yPos);
        yPos += 7;
      }
      
      // Stock Summary
      yPos += 3;
      doc.setFont("helvetica", "bold");
      doc.text("Stock Summary:", 20, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 7;
      doc.text(`• Total Stock Entries: ${reportData.stockSummary.totalEntries}`, 25, yPos);
      yPos += 7;
      doc.text(`• Total Quantity Added: ${reportData.stockSummary.totalQuantityAdded} units`, 25, yPos);
      yPos += 7;
      
      // Top Suppliers
      if (reportData.stockSummary.topSuppliers.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Top Suppliers:", 20, yPos);
        doc.setFont("helvetica", "normal");
        yPos += 7;
        
        reportData.stockSummary.topSuppliers.forEach((supplier, index) => {
          doc.text(`${index + 1}. ${supplier.name}: ${supplier.quantity} units`, 25, yPos);
          yPos += 7;
        });
      }
      
      // Sales Details Table
      yPos += 10;
      doc.addPage();
      doc.setFontSize(16);
      doc.text("Sales Details", 20, 20);
      
      if (reportData.sales.length > 0) {
        const salesTableData = reportData.sales.map(sale => [
          sale.sale_id?.toString() || "",
          sale.product?.name || `Product ID: ${sale.productId}`,
          sale.buyer,
          sale.quantity.toString(),
          `${sale.totalPrice.toLocaleString()} RWF`,
          new Date(sale.createdAt).toLocaleDateString()
        ]);
        
        autoTable(doc, {
          startY: 30,
          head: [['ID', 'Product', 'Buyer', 'Quantity', 'Total', 'Date']],
          body: salesTableData,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30 },
            3: { cellWidth: 20 },
            4: { cellWidth: 30 },
            5: { cellWidth: 25 }
          }
        });
      } else {
        doc.setFontSize(12);
        doc.text("No sales data available for this period", 20, 40);
      }
      
      // Stock Entries Table
      doc.addPage();
      doc.setFontSize(16);
      doc.text("Stock Entries Details", 20, 20);
      
      if (reportData.stockEntries.length > 0) {
        const stockTableData = reportData.stockEntries.map(entry => [
          entry.entry_id.substring(0, 8),
          entry.product?.product_name || `Product ID: ${entry.productId}`,
          entry.supplier,
          entry.quantity.toString(),
          new Date(entry.createdAt).toLocaleDateString(),
          entry.description || "-"
        ]);
        
        autoTable(doc, {
          startY: 30,
          head: [['Entry ID', 'Product', 'Supplier', 'Quantity', 'Date', 'Description']],
          body: stockTableData,
          theme: 'grid',
          headStyles: { fillColor: [39, 174, 96] },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 40 },
            2: { cellWidth: 35 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 45 }
          }
        });
      } else {
        doc.setFontSize(12);
        doc.text("No stock entries available for this period", 20, 40);
      }
      
      // Save the PDF
      const fileName = `IMS_Report_${shopName.replace(/\s+/g, '_')}_${reportStartDate}_to_${reportEndDate}.pdf`;
      doc.save(fileName);
      
      alert("PDF report generated successfully!");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF report. Please try again.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop);
  };

  const handleAddShop = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await addShop({ shop_name: shopName, location });
    setShopName("");
    setLocation("");
    setShowShopModal(false);
    fetchDashboard();
  };

  const handleAddProduct = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedShop) return;
    await addProduct({
      shop_id: selectedShop.shop_id,
      product_name: productName,
      price: Number(price),
      quantity: Number(quantity),
    });
    setProductName("");
    setPrice("");
    setQuantity("");
    setShowProductModal(false);
    fetchDashboard();
  };

  const confirmDeleteShop = (shopId: number) => {
    setDeletingShopId(shopId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteShop = async () => {
    if (!deletingShopId) return;
    await fetch(`http://localhost:8000/api/v1/shop/${deletingShopId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDeleteConfirmOpen(false);
    setDeletingShopId(null);
    setSelectedShop(null);
    fetchDashboard();
  };

  const handleDeleteProduct = async (productId: number | string) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`http://localhost:8000/api/v1/product/${productId}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchDashboard();
  };

  // Auto-select shops when shops load
  useEffect(() => {
    if (shops.length > 0) {
      if (!selectedShopForSales && activePage === "sales") {
        setSelectedShopForSales(shops[0].shop_id);
        fetchSales(shops[0].shop_id);
      }
      if (!selectedShopForStock && activePage === "entry") {
        setSelectedShopForStock(shops[0].shop_id);
        fetchStockEntries(shops[0].shop_id);
      }
      if (!selectedShopForReports && activePage === "reports") {
        setSelectedShopForReports(shops[0].shop_id);
      }
    }
  }, [shops, activePage]);

  // Render content based on active page
  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <div className="text-sm text-slate-500">Products across all shops</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalQuantity}
            </div>
            <div className="text-sm text-slate-500">Units in stock</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalInventoryValue.toLocaleString()} RWF
            </div>
            <div className="text-sm text-slate-500">Total stock value</div>
          </CardContent>
        </Card>
      </div>

      {/* Graphs Section - only show when there's data */}
      {(shops.length > 0 || totalProducts > 0) && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Pie Chart Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Product Distribution by Shop</CardTitle>
            </CardHeader>
            <CardContent>
              {totalProducts === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No products available. Add products to shops.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} products`, 'Count']}
                        labelFormatter={(name) => `Shop: ${name}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Chart Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Inventory Value Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {totalInventoryValue === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No inventory value data available.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={lineChartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value.toLocaleString()} RWF`, 'Value']}
                        labelFormatter={(month) => `Month: ${month}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  
                  {/* Summary */}
                  <div className="mt-4 text-center">
                    <div className="text-sm text-gray-600">
                      Current:{" "}
                      <span className="font-bold text-blue-600">
                        {totalInventoryValue.toLocaleString()} RWF
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
      
      case "inventory":
        return (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowShopModal(true)}>Add Shop</Button>
                    <Button onClick={() => setShowProductModal(true)} variant={"ghost" as any}>Add Product</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
           
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <div className="bg-white shadow rounded p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Shops</h3>
                    <div className="text-sm text-slate-500">{shops.length}</div>
                  </div>

                  <ul className="space-y-2">
                    {shops.map((s) => (
                      <li
                        key={s.shop_id}
                        className={`flex justify-between items-center p-2 rounded ${selectedShop?.shop_id === s.shop_id ? "bg-slate-100" : "hover:bg-slate-50"}`}
                        onClick={() => handleSelectShop(s)}
                      >
                        <div>
                          <div className="font-medium">{s.shop_name}</div>
                          <div className="text-xs text-slate-500">{s.products.length} products</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteShop(s.shop_id);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="col-span-2">
                <div className="bg-white shadow rounded p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-semibold">Products</h3>
                      <div className="text-sm text-slate-500">Showing products for: {selectedShop?.shop_name ?? "(select a shop)"}</div>
                    </div>
                    <div>
                      <Button onClick={() => setShowProductModal(true)} variant={"ghost" as any}>Add Product</Button>
                      <input placeholder="Search product" className="border rounded p-2 text-sm" />
                    </div>
                  </div>

                  {selectedShop ? (
                    <table className="w-full table-auto border-collapse">
                      <thead>
                        <tr className="text-left text-sm text-slate-600">
                          <th className="py-2">Name</th>
                          <th className="py-2">Price</th>
                          <th className="py-2">Quantity</th>
                          <th className="py-2">Total</th>
                          <th className="py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedShop.products.map((p) => (
                          <tr key={p.product_id} className="border-t">
                            <td className="py-3">{p.product_name}</td>
                            <td className="py-3">{p.price} RWF</td>
                            <td className="py-3">{p.inventory?.quantity ?? 0}</td>
                            <td className="py-3">{Number(p.price) * Number(p.inventory?.quantity ?? 0)} RWF</td>
                            <td className="py-3">
                              <div className="flex gap-3 items-center">
                                <button className="text-blue-600 text-sm">Edit</button>
                                <button
                                  className="text-red-600 text-sm"
                                  onClick={() => handleDeleteProduct(p.product_id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-slate-500">Select a shop to view products</div>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      
      case "sales":
        return (
          <div className="flex h-screen">
            <ShopSidebar
              shops={shops}
              selectedShop={selectedShopForSales}
              onSelectShop={(shopId) => {
                setSelectedShopForSales(shopId);
                fetchSales(shopId);
              }}
              activePage={activePage}
              tempStartDate={tempStartDate}
              setTempStartDate={setTempStartDate}
              tempEndDate={tempEndDate}
              setTempEndDate={setTempEndDate}
              filterStartDate={filterStartDate}
              setFilterStartDate={setFilterStartDate}
              filterEndDate={filterEndDate}
              setFilterEndDate={setFilterEndDate}
              fetchSales={fetchSales}
            />
            
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Sales Management</h2>
                  {selectedShopForSales && (
                    <p className="text-sm text-gray-600 mt-1">
                      Viewing sales for: <span className="font-semibold">
                        {shops.find(s => s.shop_id === selectedShopForSales)?.shop_name}
                      </span>
                    </p>
                  )}
                </div>
                <Button 
                  onClick={() => setShowSaleModal(true)} 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedShopForSales}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Record New Sale
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {Math.round(totalRevenue).toLocaleString()} RWF
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {filterStartDate || filterEndDate ? 'Filtered period' : 'All time'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{totalSalesCount}</div>
                    <p className="text-sm text-gray-500 mt-1">Transactions</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Average Sale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount).toLocaleString() : 0} RWF
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Average per transaction</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sales Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedShopForSales ? (
                    <div className="text-center py-8 text-gray-500">
                      Please select a shop from the sidebar to view sales
                    </div>
                  ) : loadingSales ? (
                    <div className="text-center py-8">Loading sales data...</div>
                  ) : salesData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No sales records found for this shop.
                      {filterStartDate || filterEndDate ? ' Try changing date filters.' : ''}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Buyer</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salesData.map((sale) => (
                            <TableRow key={sale.sale_id}>
                              <TableCell>{formatDate(sale.createdAt)}</TableCell>
                              <TableCell className="font-medium">
                                {sale.product?.name || `Product ID: ${sale.productId}`}
                              </TableCell>
                              <TableCell>{sale.buyer}</TableCell>
                              <TableCell>{sale.quantity}</TableCell>
                              <TableCell>
                                {sale.product?.price 
                                  ? `${sale.product.price.toLocaleString()} RWF`
                                  : `${Math.round(sale.totalPrice / sale.quantity).toLocaleString()} RWF`
                                }
                              </TableCell>
                              <TableCell className="font-bold text-green-600">
                                {sale.totalPrice.toLocaleString()} RWF
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {sale.description || "-"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSale(sale.sale_id!)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2Icon className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      case "entry":
        return (
          <div className="flex h-full">
            <StockEntrySidebar
              shops={shops}
              selectedShop={selectedShopForStock}
              onSelectShop={(shopId) => {
                setSelectedShopForStock(shopId);
                fetchStockEntries(shopId);
              }}
              activePage={activePage}
              tempStockEntryStartDate={tempStockEntryStartDate}
              setTempStockEntryStartDate={setTempStockEntryStartDate}
              tempStockEntryEndDate={tempStockEntryEndDate}
              setTempStockEntryEndDate={setTempStockEntryEndDate}
              stockEntryFilterStartDate={stockEntryFilterStartDate}
              setStockEntryFilterStartDate={setStockEntryFilterStartDate}
              stockEntryFilterEndDate={stockEntryFilterEndDate}
              setStockEntryFilterEndDate={setStockEntryFilterEndDate}
              stockEntrySearchTerm={stockEntrySearchTerm}
              setStockEntrySearchTerm={setStockEntrySearchTerm}
              fetchStockEntries={fetchStockEntries}
            />
            
            <div className="flex-1 space-y-6 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Stock Entry Management</h2>
                  {selectedShopForStock && (
                    <p className="text-sm text-gray-600 mt-1">
                      Managing stock for: <span className="font-semibold">
                        {shops.find(s => s.shop_id === selectedShopForStock)?.shop_name}
                      </span>
                    </p>
                  )}
                </div>
                <Button 
                  onClick={() => setShowStockEntryModal(true)} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!selectedShopForStock}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Stock Entry
                </Button>
              </div>
              
              <div className="grid grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{stockStats.totalEntries}</div>
                    <p className="text-sm text-gray-500 mt-1">All stock entries</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Quantity Added</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {stockStats.totalQuantity.toLocaleString()} units
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Total stock added</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Average Quantity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {stockStats.averageQuantity.toLocaleString()} units
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Average per entry</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Selected Shop</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-gray-800">
                      {selectedShopForStock 
                        ? shops.find(s => s.shop_id === selectedShopForStock)?.shop_name 
                        : "Select a shop"}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedShopForStock 
                        ? `${shops.find(s => s.shop_id === selectedShopForStock)?.products.length || 0} products` 
                        : "No shop selected"}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {stockStats.recentEntries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Stock Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stockStats.recentEntries.map((entry) => (
                        <div key={entry.entry_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{entry.product?.product_name || `Product ID: ${entry.productId}`}</div>
                            <div className="text-sm text-gray-500">Supplier: {entry.supplier}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">+{entry.quantity} units</div>
                            <div className="text-xs text-gray-500">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

    
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>Stock Entries History</CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedShopForStock ? (
                    <div className="text-center py-8 text-gray-500">
                      Please select a shop from the sidebar to view stock entries
                    </div>
                  ) : loadingStockEntries ? (
                    <div className="text-center py-8">Loading stock entries...</div>
                  ) : stockEntries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No stock entries found for this shop.
                      {stockEntryFilterStartDate || stockEntryFilterEndDate || stockEntrySearchTerm 
                        ? ' Try changing your filters.' 
                        : ' Add your first stock entry!'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Shop</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stockEntries.map((entry) => (
                            <TableRow key={entry.entry_id}>
                              <TableCell>{formatDate(entry.createdAt)}</TableCell>
                              <TableCell className="font-medium">
                                {entry.product?.product_name || `Product ID: ${entry.productId}`}
                              </TableCell>
                              <TableCell>{entry.supplier}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  +{entry.quantity}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {entry.description || "-"}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {entry.shop?.shop_name || `Shop ID: ${entry.shopId}`}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteStockEntry(entry.entry_id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2Icon className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      case "reports":
        return (
          <div className="flex h-full">
            <ReportsSidebar
              shops={shops}
              selectedShop={selectedShopForReports}
              onSelectShop={(shopId) => setSelectedShopForReports(shopId)}
              activePage={activePage}
              reportStartDate={reportStartDate}
              setReportStartDate={setReportStartDate}
              reportEndDate={reportEndDate}
              setReportEndDate={setReportEndDate}
              reportType={reportType}
              setReportType={setReportType}
              fetchReportData={fetchReportData}
              loadingReport={loadingReport}
            />
            
            <div className="flex-1 p-6 overflow-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Generate comprehensive reports for inventory, sales, and financial analysis
                  </p>
                </div>
                
                {reportData && (
                  <Button 
                    onClick={generatePDFReport}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                    disabled={generatingPDF || !reportData}
                  >
                    {generatingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <FileTextIcon className="w-4 h-4" />
                        Download Full Report (PDF)
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Report Content */}
              <div id="report-content" className="space-y-6">
                {!reportData ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                      <FileTextIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Report Generated</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Select a shop, choose a date range, and click "Generate Report" to view analytics and export data.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Report Header */}
                    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">
                              {shops.find(s => s.shop_id === selectedShopForReports)?.shop_name} - Performance Report
                            </h3>
                            <p className="text-sm text-gray-600">
                              Period: {reportStartDate} to {reportEndDate} | Generated on {new Date().toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Report Type</div>
                            <div className="font-semibold text-blue-600 capitalize">{reportType} Report</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">
                            {reportData.salesSummary.totalRevenue.toLocaleString()} RWF
                          </div>
                          <div className="text-xs text-gray-500 mt-1">from {reportData.salesSummary.totalTransactions} transactions</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-500">Average Sale</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(reportData.salesSummary.averageSale).toLocaleString()} RWF
                          </div>
                          <div className="text-xs text-gray-500 mt-1">per transaction</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-500">Stock Added</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">
                            {reportData.stockSummary.totalQuantityAdded.toLocaleString()} units
                          </div>
                          <div className="text-xs text-gray-500 mt-1">across {reportData.stockSummary.totalEntries} entries</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-500">Top Supplier</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg font-bold text-blue-600 truncate">
                            {reportData.stockSummary.topSuppliers[0]?.name || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {reportData.stockSummary.topSuppliers[0]?.quantity || 0} units supplied
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Detailed Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Sales Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUpIcon className="w-5 h-5 text-green-600" />
                            Sales Transactions ({reportData.sales.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {reportData.sales.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">No sales in this period</div>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Buyer</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {reportData.sales.slice(0, 10).map((sale) => (
                                    <TableRow key={sale.sale_id}>
                                      <TableCell className="text-xs">
                                        {new Date(sale.createdAt).toLocaleDateString()}
                                      </TableCell>
                                      <TableCell className="font-medium text-sm">
                                        {sale.product?.name || `Product ID: ${sale.productId}`}
                                      </TableCell>
                                      <TableCell className="text-sm">{sale.buyer}</TableCell>
                                      <TableCell>{sale.quantity}</TableCell>
                                      <TableCell className="font-bold text-green-600">
                                        {sale.totalPrice.toLocaleString()} RWF
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              {reportData.sales.length > 10 && (
                                <div className="text-center text-xs text-gray-500 mt-2">
                                  Showing 10 of {reportData.sales.length} transactions
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      {/* Stock Entries Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUpIcon className="w-5 h-5 text-blue-600" />
                            Stock Entries ({reportData.stockEntries.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {reportData.stockEntries.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">No stock entries in this period</div>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Qty</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {reportData.stockEntries.slice(0, 10).map((entry) => (
                                    <TableRow key={entry.entry_id}>
                                      <TableCell className="text-xs">
                                        {new Date(entry.createdAt).toLocaleDateString()}
                                      </TableCell>
                                      <TableCell className="font-medium text-sm">
                                        {entry.product?.product_name || `Product ID: ${entry.productId}`}
                                      </TableCell>
                                      <TableCell className="text-sm">{entry.supplier}</TableCell>
                                      <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          +{entry.quantity}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              {reportData.stockEntries.length > 10 && (
                                <div className="text-center text-xs text-gray-500 mt-2">
                                  Showing 10 of {reportData.stockEntries.length} entries
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Additional Analytics */}
                    {reportType === "detailed" && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Products */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Top Selling Products</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {reportData.sales.length === 0 ? (
                              <div className="text-gray-500 text-center py-4">No sales data</div>
                            ) : (
                              <div className="space-y-3">
                                {Object.entries(
                                  reportData.sales.reduce((acc, sale) => {
                                    const productName = sale.product?.name || `Product ID: ${sale.productId}`;
                                    if (!acc[productName]) acc[productName] = { quantity: 0, revenue: 0 };
                                    acc[productName].quantity += sale.quantity;
                                    acc[productName].revenue += sale.totalPrice;
                                    return acc;
                                  }, {} as Record<string, { quantity: number; revenue: number }>)
                                )
                                  .sort(([, a], [, b]) => b.quantity - a.quantity)
                                  .slice(0, 5)
                                  .map(([product, data], index) => (
                                    <div key={product} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                                          {index + 1}
                                        </div>
                                        <div>
                                          <div className="font-medium">{product}</div>
                                          <div className="text-xs text-gray-500">{data.quantity} units sold</div>
                                        </div>
                                      </div>
                                      <div className="font-bold text-green-600">
                                        {data.revenue.toLocaleString()} RWF
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        {/* Top Suppliers */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Top Suppliers</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {reportData.stockSummary.topSuppliers.length === 0 ? (
                              <div className="text-gray-500 text-center py-4">No stock entries</div>
                            ) : (
                              <div className="space-y-3">
                                {reportData.stockSummary.topSuppliers.map((supplier, index) => (
                                  <div key={supplier.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <div className="font-medium">{supplier.name}</div>
                                        <div className="text-xs text-gray-500">{supplier.quantity} units supplied</div>
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {Math.round((supplier.quantity / reportData.stockSummary.totalQuantityAdded) * 100)}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    {/* Financial Summary for Financial Report */}
                    {reportType === "financial" && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Financial Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-50 p-4 rounded">
                              <h4 className="font-semibold text-gray-700 mb-2">Revenue Analysis</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Gross Revenue:</span>
                                  <span className="font-bold">{reportData.salesSummary.totalRevenue.toLocaleString()} RWF</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Number of Sales:</span>
                                  <span>{reportData.salesSummary.totalTransactions}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Average Sale Value:</span>
                                  <span>{Math.round(reportData.salesSummary.averageSale).toLocaleString()} RWF</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded">
                              <h4 className="font-semibold text-gray-700 mb-2">Inventory Analysis</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Total Stock Added:</span>
                                  <span>{reportData.stockSummary.totalQuantityAdded} units</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Number of Entries:</span>
                                  <span>{reportData.stockSummary.totalEntries}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Avg per Entry:</span>
                                  <span>{Math.round(reportData.stockSummary.totalQuantityAdded / (reportData.stockSummary.totalEntries || 1))} units</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded">
                              <h4 className="font-semibold text-gray-700 mb-2">Performance Metrics</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Daily Avg Revenue:</span>
                                  <span>{
                                    (() => {
                                      const days = Math.max(1, Math.ceil(
                                        (new Date(reportEndDate).getTime() - new Date(reportStartDate).getTime()) / (1000 * 60 * 60 * 24)
                                      ));
                                      return Math.round(reportData.salesSummary.totalRevenue / days).toLocaleString();
                                    })()
                                  } RWF/day</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Transactions/Day:</span>
                                  <span>{
                                    (() => {
                                      const days = Math.max(1, Math.ceil(
                                        (new Date(reportEndDate).getTime() - new Date(reportStartDate).getTime()) / (1000 * 60 * 60 * 24)
                                      ));
                                      return (reportData.salesSummary.totalTransactions / days).toFixed(1);
                                    })()
                                  }</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Footer Note */}
                    <div className="text-center text-sm text-gray-500 border-t pt-4">
                      <p>Report generated by 3B Traders IMS • {new Date().toLocaleString()}</p>
                      <p className="mt-1">This report contains {reportData.sales.length} sales transactions and {reportData.stockEntries.length} stock entries</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      
      case "settings":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <div className="bg-white shadow rounded p-4">
              <p>Settings page content goes here.</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">


<aside className="w-72 bg-white shadow-lg border-r flex flex-col">
  <div className="p-6 flex items-center gap-3">
    <div className="w-10 h-10 rounded-md bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center text-white font-bold">IMS</div>
    <div>
      <div className="font-semibold">3B Traders IMS</div>
      <div className="text-xs text-slate-500">Inventory Dashboard</div>
    </div>
  </div>

  <nav className="px-4 py-2 flex-1">
    <button
      onClick={() => setActivePage("dashboard")}
      className={`flex items-center gap-3 w-full py-2 px-3 rounded mb-1 
        ${activePage === "dashboard" ? "bg-slate-200" : "hover:bg-slate-100"}`}
    >
       <span>Dashboard</span>
    </button>

    <button
      onClick={() => setActivePage("inventory")}
      className={`flex items-center gap-3 w-full py-2 px-3 rounded mb-1 
        ${activePage === "inventory" ? "bg-slate-200" : "hover:bg-slate-100"}`}
    >
       <span>Inventory</span>
    </button>

    <button
      onClick={() => setActivePage("sales")}
      className={`flex items-center gap-3 w-full py-2 px-3 rounded mb-1 
        ${activePage === "sales" ? "bg-slate-200" : "hover:bg-slate-100"}`}
    >
       <span>Sales</span>
    </button>

    <button
      onClick={() => setActivePage("entry")}
      className={`flex items-center gap-3 w-full py-2 px-3 rounded mb-1 
        ${activePage === "entry" ? "bg-slate-200" : "hover:bg-slate-100"}`}
    >
       <span>Stock Entry</span>
    </button>

    <button
      onClick={() => setActivePage("reports")}
      className={`flex items-center gap-3 w-full py-2 px-3 rounded mb-1 
        ${activePage === "reports" ? "bg-slate-200" : "hover:bg-slate-100"}`}
    >
       <span>Reports</span>
    </button>

    
  </nav>

  {/* User Info and Logout */}
  <div className="border-t p-4">
    <div className="text-sm text-slate-500 mb-2">Logged in as</div>
    <div className="font-medium mb-4">{dashboardResult?.dashboard?.Fullname ?? "—"}</div>
    
    <Button 
      onClick={handleLogout}
      variant="outline"
      className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 flex items-center justify-center gap-2"
      disabled={loggingOut}
    >
      {loggingOut ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
          Logging out...
        </>
      ) : (
        <>
          <LogOutIcon className="w-4 h-4" />
          Logout
        </>
      )}
    </Button>
  </div>
</aside>
      <main className="flex-1 p-6">
        {renderContent()}

        {/* Stock Entry Modal */}
        <Dialog open={showStockEntryModal} onOpenChange={setShowStockEntryModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-black">Add Stock Entry</DialogTitle>
              {selectedShopForStock && (
                <p className="text-sm text-gray-500">
                  Adding stock for: <span className="font-semibold">{shops.find(s => s.shop_id === selectedShopForStock)?.shop_name}</span>
                </p>
              )}
            </DialogHeader>
            
            <form onSubmit={handleAddStockEntry} className="space-y-4">
              <div>
                <Label htmlFor="stockProduct">Product *</Label>
                <Select 
                  value={selectedStockEntryProductId} 
                  onValueChange={setSelectedStockEntryProductId} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProducts
                      .filter(product => {
                        const productShop = shops.find(shop => 
                          shop.products.some(p => p.product_id.toString() === product.product_id.toString())
                        );
                        return productShop && productShop.shop_id === selectedShopForStock;
                      })
                      .map((product) => (
                        <SelectItem 
                          key={product.product_id} 
                          value={product.product_id.toString()}
                        >
                          <div className="flex justify-between w-full">
                            <span>{product.product_name}</span>
                            <span className="text-gray-500 text-sm">
                              Current: {product.inventory?.quantity || 0}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="supplier" className="text-black">Supplier Name</Label>
                <Input
                  id="supplier"
                  value={stockEntrySupplier}
                  onChange={(e) => setStockEntrySupplier(e.target.value)}
                  placeholder="Enter supplier name"
                  required
                  className="text-black"
                />
              </div>

              <div>
                <Label htmlFor="stockQuantity" className="text-black">Quantity</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      const current = parseInt(stockEntryQuantity) || 1;
                      if (current > 1) setStockEntryQuantity((current - 1).toString());
                    }}
                    className="px-3 text-black"
                    variant="outline"
                  >
                    -
                  </Button>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="1"
                    value={stockEntryQuantity}
                    onChange={(e) => setStockEntryQuantity(e.target.value)}
                    required
                    className="text-center text-black"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const current = parseInt(stockEntryQuantity) || 1;
                      setStockEntryQuantity((current + 1).toString());
                    }}
                    className="px-3 text-black"
                    variant="outline"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="stockDescription" className="text-black">Description (Optional)</Label>
                <textarea
                  id="stockDescription"
                  value={stockEntryDescription}
                  onChange={(e) => setStockEntryDescription(e.target.value)}
                  placeholder="Any notes about this stock entry..."
                  className="w-full border rounded p-2 min-h-[80px] text-sm text-black"
                  rows={3}
                />
              </div>

              {selectedStockEntryProductId && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-green-800">
                  <h4 className="font-semibold text-green-800 mb-2">Stock Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Product:</div>
                    <div className="font-medium text-green-800">
                      {allProducts.find(p => p.product_id.toString() === selectedStockEntryProductId)?.product_name}
                    </div>
                    
                    <div>Current Stock:</div>
                    <div className="font-semibold text-green-800">
                      {allProducts.find(p => p.product_id.toString() === selectedStockEntryProductId)?.inventory?.quantity || 0} units
                    </div>
                    
                    <div>Adding:</div>
                    <div className="font-semibold text-green-800">{stockEntryQuantity} units</div>
                    
                    <div className="col-span-2 border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>New Total Stock:</span>
                        <span className="text-green-600">
                          {(
                            (allProducts.find(p => p.product_id.toString() === selectedStockEntryProductId)?.inventory?.quantity || 0) +
                            parseInt(stockEntryQuantity)
                          ).toLocaleString()} units
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowStockEntryModal(false)}
                  className="text-black"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!selectedStockEntryProductId || !stockEntrySupplier.trim()}
                >
                  Add Stock Entry
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Existing Modals */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete shop</DialogTitle>
            </DialogHeader>
            <div className="py-2">Are you sure you want to delete this shop? This action cannot be undone.</div>
            <DialogFooter>
              <Button variant={"ghost" as any} onClick={() => setDeleteConfirmOpen(false)} className="bg-blue-600">Cancel</Button>
              <Button onClick={handleDeleteShop} className="bg-red-600 text-white">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showShopModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow w-96">
              <h3 className="font-semibold mb-3">Add Shop</h3>
              <form onSubmit={handleAddShop} className="space-y-3">
                <input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Shop name" className="w-full border p-2 rounded" required />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full border p-2 rounded" required />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowShopModal(false)} className="px-3 py-1">Cancel</button>
                  <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showProductModal && selectedShop && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow w-96">
              <h3 className="font-semibold mb-3">Add Product to {selectedShop.shop_name}</h3>
              <form onSubmit={handleAddProduct} className="space-y-3">
                <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Product name" className="w-full border p-2 rounded" required />
                <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" className="w-full border p-2 rounded" required />
                <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" className="w-full border p-2 rounded" required />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowProductModal(false)} className="px-3 py-1">Cancel</button>
                  <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Dialog open={showSaleModal} onOpenChange={setShowSaleModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle><h1 className="text-black">Record New Sale</h1></DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSale} className="space-y-4">
              <div>
                <Label htmlFor="product">Product *</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProducts.map((product) => (
                      <SelectItem key={product.product_id} value={product.product_id.toString()}>
                        {product.product_name} - {product.shop_name} (Stock: {product.inventory?.quantity || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="buyer">Buyer Name *</Label>
                <Input
                  id="buyer"
                  value={saleBuyer}
                  onChange={(e) => setSaleBuyer(e.target.value)}
                  placeholder="Enter buyer name"
                  required
                  className="text-black"
                />
              </div>

              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={saleQuantity}
                  onChange={(e) => setSaleQuantity(e.target.value)}
                  required
                  className="text-black"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={saleDescription}
                  onChange={(e) => setSaleDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>

              {selectedProductId && (
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-800">
                    <div>Selected Product: {allProducts.find(p => p.product_id.toString() === selectedProductId)?.product_name}</div>
                    <div>Unit Price: {allProducts.find(p => p.product_id.toString() === selectedProductId)?.price} RWF</div>
                    <div className="font-bold">
                      Total: {Number(saleQuantity) * Number(allProducts.find(p => p.product_id.toString() === selectedProductId)?.price || 0)} RWF
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline"  onClick={() => setShowSaleModal(false)} className="text-black"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={addingSale}>
                  {addingSale ? "Processing..." : "Record Sale"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}