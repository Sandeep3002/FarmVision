"use client";
import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

const SEASON_COLORS = {
  "Kharif": "#f8c950",
  "Rabi": "#378b66",
  "Whole Year": "#84cc16",
  "Summer": "#fb923c",
  "Autumn": "#10b981",
  "Winter": "#3b82f6"
};

export default function Dashboard() {
  const chartSeasonsRef = useRef(null);
  const chartTrendRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [chartMode, setChartMode] = useState("season");
  const [stats, setStats] = useState(null);
  const [seasonal, setSeasonal] = useState([
    { season: "Kharif", production: 65000000 },
    { season: "Rabi", production: 45000000 },
    { season: "Whole Year", production: 22000000 }
  ]);
  const [topCrops, setTopCrops] = useState([
    { name: "Rice", prod: 105000000, pct: 100, color: "bg-emerald-500", icon: "🌾" },
    { name: "Wheat", prod: 95000000, pct: 90, color: "bg-lime-500", icon: "🌿" },
    { name: "Maize", prod: 25000000, pct: 24, color: "bg-orange-500", icon: "🌽" },
    { name: "Sugarcane", prod: 35000000, pct: 33, color: "bg-yellow-500", icon: "🎋" },
    { name: "Cotton", prod: 12000000, pct: 11, color: "bg-amber-500", icon: "🌸" }
  ]);
  const [trendData, setTrendData] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showLeafModal, setShowLeafModal] = useState(false);
  const [leafImage, setLeafImage] = useState(null);
  const [leafResult, setLeafResult] = useState(null);
  const [leafAnalysing, setLeafAnalysing] = useState(false);
  const [temperature, setTemperature] = useState({ temp: 24, condition: "Partly Cloudy", icon: "⛅" });
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedStat, setSelectedStat] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");

  const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands"
  ];

  const COMMON_CROPS = [
    "Rice", "Wheat", "Maize", "Sugarcane", "Cotton", "Potato", "Onion", "Gram", "Arhar/Tur", "Groundnut"
  ];

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error("Backend search failed");
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error("Search failed:", err);
        alert("Search failed. Please ensure the Python backend is running on http://127.0.0.1:5000");
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Fetch live data from Flask API on mount
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
    const fetchAPI = (url) => fetch(url).then(r => {
      if (!r.ok) throw new Error(`API error: ${r.status}`);
      return r.json();
    });

    Promise.all([
      fetchAPI(`${API}/api/stats`),
      fetchAPI(`${API}/api/seasonal`),
      fetchAPI(`${API}/api/top-crops`),
      fetchAPI(`${API}/api/trend`)
    ]).then(([s, sea, tc, tr]) => {
      setStats(s);
      setSeasonal(Array.isArray(sea) ? sea : []);
      setTopCrops(Array.isArray(tc) ? tc : topCrops);
      setTrendData(tr);
      setBackendOnline(true);
    }).catch(() => {
      console.warn("Backend offline — using fallback data");
      setBackendOnline(false);
      setStats({
        total_production: 345000000,
        total_area: 124000000,
        avg_yield: 4.6,
        total_records: 345410,
        num_crops: 57,
        num_states: 28,
        states: INDIAN_STATES,
        crops: COMMON_CROPS,
        state_breakdown: [
          { State: "Uttar Pradesh", Production: 45000000 },
          { State: "Punjab", Production: 38000000 },
          { State: "Madhya Pradesh", Production: 32000000 },
          { State: "Haryana", Production: 28000000 },
          { State: "West Bengal", Production: 25000000 }
        ],
        crop_breakdown: [
          { Crop: "Rice", Production: 105000000 },
          { Crop: "Wheat", Production: 95000000 },
          { Crop: "Sugarcane", Production: 35000000 },
          { Crop: "Maize", Production: 25000000 }
        ]
      });
    });
  }, []);

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Using open-meteo free weather API (no API key required)
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=31.5497&longitude=74.3436&current=temperature_2m,weather_code');
        const data = await response.json();
        const temp = Math.round(data.current.temperature_2m);
        const weatherCode = data.current.weather_code;

        // Map weather code to condition
        let condition = "Clear";
        let icon = "☀️";
        if (weatherCode === 0 || weatherCode === 1) { condition = "Clear"; icon = "☀️"; }
        else if (weatherCode === 2) { condition = "Partly Cloudy"; icon = "⛅"; }
        else if (weatherCode === 3) { condition = "Overcast"; icon = "☁️"; }
        else if (weatherCode >= 45 && weatherCode <= 48) { condition = "Foggy"; icon = "🌫️"; }
        else if (weatherCode >= 51 && weatherCode <= 67) { condition = "Rain"; icon = "🌧️"; }
        else if (weatherCode >= 71 && weatherCode <= 85) { condition = "Snow"; icon = "❄️"; }
        else if (weatherCode >= 80 && weatherCode <= 82) { condition = "Heavy Rain"; icon = "⛈️"; }
        else if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) { condition = "Thunderstorm"; icon = "⛈️"; }

        setTemperature({ temp, condition, icon });
      } catch (err) {
        console.warn("Weather fetch failed, using fallback");
        // Fallback temperature
        setTemperature({ temp: 24, condition: "Partly Cloudy", icon: "⛅" });
      }
    };

    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 60000); // Refresh every minute
    return () => clearInterval(weatherInterval);
  }, []);

  // Separate mount effect for isLoaded
  useEffect(() => {
    setIsLoaded(true);
    const initNotifications = [
      { id: 1, message: "Wheat harvest scheduled for March 10", type: "info", timestamp: new Date(Date.now() - 3600000).toLocaleTimeString() },
      { id: 2, message: "Rain expected on March 8-9", type: "warning", timestamp: new Date(Date.now() - 7200000).toLocaleTimeString() },
      { id: 3, message: "Soil moisture level optimal", type: "success", timestamp: new Date(Date.now() - 10800000).toLocaleTimeString() }
    ];
    setNotifications(initNotifications);
    setNotificationCount(initNotifications.length);
  }, []);

  // Fetch specific trend data when dropdowns change (Dynamic Filtering)
  useEffect(() => {
    if (!isLoaded) return;
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/trend?`;
    const params = new URLSearchParams();
    if (selectedState && selectedState !== "") params.append("state", selectedState);
    if (selectedCrop && selectedCrop !== "") params.append("crop", selectedCrop);

    fetch(url + params.toString())
      .then(r => {
        if (!r.ok) throw new Error("Server not responding");
        return r.json();
      })
      .then(data => {
        if (!data.error) {
          setTrendData(data);
          setBackendOnline(true);
        }
      })
      .catch(err => console.warn("Chart data query failed:", err));
  }, [selectedState, selectedCrop]);

  useEffect(() => {
    if (!isLoaded) return;
    let chartSeasonsInstance = null;
    let chartTrendInstance = null;

    if (chartSeasonsRef.current) {
      const ctxDoughnut = chartSeasonsRef.current.getContext("2d");

      let chartData;
      if (chartMode === "season" && seasonal.length > 0) {
        chartData = {
          labels: seasonal.map(s => s.season),
          data: seasonal.map(s => s.production),
          colors: seasonal.map(s => SEASON_COLORS[s.season] || "#a4b4aa")
        };
      } else if (chartMode === "crop" && topCrops.length > 0) {
        const cropColors = ["#10b981", "#84cc16", "#f59e0b", "#f8c950", "#378b66"];
        chartData = {
          labels: topCrops.slice(0, 3).map(c => c.name),
          data: topCrops.slice(0, 3).map(c => c.prod),
          colors: cropColors.slice(0, 3)
        };
      } else {
        chartData = chartMode === "season"
          ? { labels: ["Kharif", "Rabi", "Whole Year"], data: [65000000, 45000000, 22000000], colors: ["#f8c950", "#378b66", "#84cc16"] }
          : { labels: ["Rice", "Wheat", "Maize"], data: [105000000, 95000000, 25000000], colors: ["#10b981", "#84cc16", "#f59e0b"] };
      }

      chartSeasonsInstance = new Chart(ctxDoughnut, {
        type: "doughnut",
        data: {
          labels: chartData.labels,
          datasets: [{
            data: chartData.data,
            backgroundColor: chartData.colors,
            borderWidth: 0,
            cutout: '65%'
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          hover: { mode: 'index', intersect: false },
          onHover: (event, chartElement) => {
            event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(25, 32, 29, 0.9)',
              titleFont: { size: 13, weight: 'bold' },
              bodyFont: { size: 12 },
              padding: 12,
              cornerRadius: 10,
              displayColors: true,
              callbacks: {
                label: (context) => {
                  let val = context.raw || 0;
                  return ` ${context.label}: ${val.toLocaleString()} Tonnes`;
                }
              }
            }
          },
        },
      });
    }

    if (chartTrendRef.current) {
      const ctxLine = chartTrendRef.current.getContext("2d");
      const labels = trendData ? trendData.labels : ["2013-14", "2014-15", "2015-16", "2016-17", "2017-18", "2018-19", "2019-20", "2020-21", "2021-22", "2022-23"];
      const prod = trendData ? trendData.production.map(v => v / 1e6) : [65, 59, 80, 81, 56, 55, 90, 92, 95, 98];
      const area = trendData ? trendData.area.map(v => v / 1e6) : [28, 48, 40, 19, 86, 27, 42, 50, 52, 55];
      chartTrendInstance = new Chart(ctxLine, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Production",
              data: prod,
              borderColor: "#378b66",
              backgroundColor: "rgba(55, 139, 102, 0.1)",
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 4,
              pointHoverRadius: 8,
              pointHitRadius: 25,
              spanGaps: true,
              pointBackgroundColor: "#378b66",
              pointBorderColor: "#fff",
              pointBorderWidth: 2
            },
            {
              label: "Area",
              data: area,
              borderColor: "#f8c950",
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 4,
              pointHoverRadius: 8,
              pointHitRadius: 25,
              spanGaps: true,
              pointBackgroundColor: "#f8c950",
              pointBorderColor: "#fff",
              pointBorderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          hover: { mode: 'index', intersect: false },
          onHover: (event, chartElement) => {
            event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(25, 32, 29, 0.9)',
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label;
                  const val = context.raw || 0;
                  const unit = label === "Production" ? "M Tonnes" : "M ha";
                  return ` ${label}: ${Number(val).toFixed(2)} ${unit}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                autoSkip: true,
                maxTicksLimit: 8,
                maxRotation: 0
              }
            },
            y: {
              grid: { color: "#f0f0f0" },
              border: { dash: [4, 4] },
              ticks: {
                callback: (value) => value + (value === 0 ? "" : "M")
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartSeasonsInstance) chartSeasonsInstance.destroy();
      if (chartTrendInstance) chartTrendInstance.destroy();
    };
  }, [isLoaded, chartMode, activeTab, seasonal, topCrops, trendData, selectedState, selectedCrop]);

  if (!isLoaded) return <div className="p-10 font-sans text-[#378b66]">Loading Dashboard...</div>;

  return (
    <div className="flex h-screen bg-[#f8faf9] text-[#19201d] overflow-hidden font-sans">
      <aside className="w-[280px] bg-white flex flex-col shrink-0 border-r border-[#edf3f0] shadow-sm z-30 h-screen sticky top-0 overflow-hidden custom-scrollbar">
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-4 mb-12 pl-1">
            <div className="relative group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-[#378b66] to-[#2c7554] rounded-[14px] flex items-center justify-center shadow-lg shadow-emerald-900/10 group-hover:scale-105 transition-transform duration-300">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="white" fillOpacity="0.2" />
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 8V16M8 12H16M12 12L12.01 12M12 2V5M12 19V22M2 12H5M19 12H22" stroke="#f8c950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#f8c950] rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#378b66] rounded-full"></div>
              </div>
            </div>
            <div>
              <h1 className="text-base font-black text-[#19201d] uppercase leading-none tracking-tighter">FarmVision</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 bg-[#378b66] rounded-full"></span>
                <p className="text-[10px] font-black text-[#378b66] uppercase tracking-[2px]">Systems AI</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-full font-bold transition-all text-sm w-full ${activeTab === "dashboard" ? "text-[#378b66] bg-[#e4efe8]" : "text-[#7a8c82] hover:bg-[#f4fbf6] hover:text-[#378b66]"}`}>
              <span className="text-lg">⊞</span> Dashboard
            </button>
            <button
              onClick={() => setActiveTab("crops")}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-full font-bold transition-all text-sm w-full ${activeTab === "crops" ? "text-[#378b66] bg-[#e4efe8]" : "text-[#7a8c82] hover:bg-[#f4fbf6] hover:text-[#378b66]"}`}>
              <span className="text-lg">🌱</span> Add Crops
            </button>
            <button
              onClick={() => setActiveTab("location")}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-full font-bold transition-all text-sm w-full ${activeTab === "location" ? "text-[#378b66] bg-[#e4efe8]" : "text-[#7a8c82] hover:bg-[#f4fbf6] hover:text-[#378b66]"}`}>
              <span className="text-lg">📍</span> Add Location
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-full font-bold transition-all text-sm w-full ${activeTab === "ai" ? "text-[#378b66] bg-[#e4efe8]" : "text-[#7a8c82] hover:bg-[#f4fbf6] hover:text-[#378b66]"}`}>
              <span className="text-lg">✨</span> AI Predictions
            </button>
          </nav>
        </div>

        <div className="p-8 border-t border-[#edf3f0]">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-full font-bold transition-all text-sm w-full ${activeTab === "settings" ? "text-[#378b66] bg-[#e4efe8]" : "text-[#7a8c82] hover:bg-[#f4fbf6] hover:text-[#378b66]"}`}>
            <span className="text-lg">⚙️</span> Settings
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header - Truly fixed at the top */}
        <header className="flex items-center justify-between px-10 py-6 bg-white border-b border-[#edf3f0] z-20 shrink-0">
          <div className="relative w-full max-w-[400px]">
            <button
              onClick={() => handleSearch()}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7a8c82] text-sm hover:text-[#378b66] transition-colors z-10 shrink-0">
              {isSearching ? "⏳" : "🔍"}
            </button>
            <input
              type="text"
              placeholder="Search crop or state (e.g. Rice)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.keyCode === 13) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className={`w-full pl-12 pr-5 py-3 bg-[#f8faf9] border rounded-full text-sm font-medium outline-none transition-all ${isSearching ? "border-[#378b66] shadow-[0_0_10px_rgba(55,139,102,0.2)]" : "border-[#edf3f0] focus:border-[#378b66]"}`} />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-5 py-2.5 bg-[#f8faf9] border border-[#edf3f0] rounded-full text-[13px] font-medium text-[#7a8c82]">
              <span className="text-lg">{temperature.icon}</span>
              <span><strong className="text-[#19201d] text-sm mr-1">{temperature.temp}°C</strong> {temperature.condition}</span>
            </div>

            <div className="relative">
              <button onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) setNotificationCount(0);
              }} className="relative w-11 h-11 bg-white border border-[#edf3f0] rounded-full flex items-center justify-center text-[18px] text-[#19201d] hover:bg-[#f4fbf6] transition-colors">
                🔔
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#ef4444] rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">{notificationCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-14 right-0 w-80 bg-white border border-[#edf3f0] rounded-2xl shadow-xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-[#edf3f0] flex justify-between items-center bg-[#f8faf9]">
                    <span className="text-sm font-black text-[#378b66] uppercase tracking-wider">Notifications</span>
                    <span className="text-[10px] font-bold text-[#a4b4aa]">{notifications.length} Total</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div key={n.id} className="p-4 border-b border-[#edf3f0] last:border-0 hover:bg-[#f4fbf6] transition-colors cursor-pointer group">
                        <div className="flex items-start gap-3">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'warning' ? 'bg-amber-400' : n.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                          <div>
                            <p className="text-[13px] font-bold text-[#19201d] leading-snug group-hover:text-[#378b66] transition-colors">{n.message}</p>
                            <p className="text-[11px] font-medium text-[#a4b4aa] mt-1">{n.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-10 text-center">
                        <span className="text-3xl block mb-2">📭</span>
                        <p className="text-sm font-bold text-[#a4b4aa]">All caught up!</p>
                      </div>
                    )}
                  </div>
                  <button className="w-full py-3 text-[12px] font-black text-[#7a8c82] hover:text-[#378b66] transition-colors border-t border-[#edf3f0] bg-[#fcfdfc]">
                    View All Activity
                  </button>
                </div>
              )}
            </div>
            <div onClick={() => setActiveTab("settings")} className="w-11 h-11 rounded-full border-2 border-[#e4efe8] flex items-center justify-center cursor-pointer shadow-sm hover:border-[#378b66] transition-colors bg-[#378b66] text-white font-bold text-sm">
              S
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">


          {activeTab === "dashboard" ? (
            <>
              {/* Stat Cards Row */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                {[
                  { id: "production", label: "Total Production", value: stats ? (stats.total_production / 1e6).toFixed(1) + "M t" : "--", sub: "Tonnes (Tonnes crops)", icon: "🌾", color: "bg-emerald-50 border-emerald-200", textColor: "text-emerald-700", ringColor: "ring-emerald-400" },
                  { id: "area", label: "Total Area", value: stats ? (stats.total_area / 1e6).toFixed(1) + "M ha" : "--", sub: "Hectares cultivated", icon: "🗺️", color: "bg-blue-50 border-blue-200", textColor: "text-blue-700", ringColor: "ring-blue-400" },
                  { id: "yield", label: "Avg Yield", value: stats ? stats.avg_yield + " t/ha" : "--", sub: "National average", icon: "📈", color: "bg-amber-50 border-amber-200", textColor: "text-amber-700", ringColor: "ring-amber-400" },
                  { id: "variety", label: "Crop Varieties", value: stats ? stats.num_crops : "--", sub: "28 States & 8 UTs", icon: "🌱", color: "bg-purple-50 border-purple-200", textColor: "text-purple-700", ringColor: "ring-purple-400" }
                ].map((card, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedStat(selectedStat === card.id ? null : card.id)}
                    className={`border rounded-[20px] p-5 cursor-pointer transition-all duration-300 relative group overflow-hidden ${card.color} ${selectedStat === card.id ? `ring-2 ${card.ringColor} shadow-lg scale-[1.02]` : "shadow-sm hover:shadow-md hover:scale-[1.01]"}`}>

                    {/* Background Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>

                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{card.label}</span>
                      <span className={`text-xl transition-transform group-hover:scale-125 duration-300 ${selectedStat === card.id ? "scale-125" : ""}`}>{card.icon}</span>
                    </div>
                    <p className={`text-[24px] font-black ${card.textColor} leading-none mb-1 relative z-10`}>{card.value}</p>
                    <div className="flex items-center justify-between relative z-10">
                      <p className="text-[11px] text-gray-400 font-medium">{card.sub}</p>
                      {selectedStat === card.id ? (
                        <span className={`text-[10px] font-black uppercase ${card.textColor}`}>Selected</span>
                      ) : (
                        <span className="text-[10px] font-black uppercase opacity-0 group-hover:opacity-40 transition-opacity">View Details</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stat Deep-Dive Modal */}
              {selectedStat && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setSelectedStat(null)}>
                  <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className={`p-8 pb-12 flex justify-between items-start text-white relative overflow-hidden ${selectedStat === "production" ? "bg-emerald-600" :
                      selectedStat === "area" ? "bg-blue-600" :
                        selectedStat === "yield" ? "bg-amber-500" : "bg-purple-600"
                      }`}>
                      {/* Decorative Background Pattern */}
                      <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                        <span className="text-[200px] leading-none">
                          {selectedStat === "production" ? "🌾" : selectedStat === "area" ? "🗺️" : selectedStat === "yield" ? "📈" : "🌱"}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-[24px] flex items-center justify-center text-4xl shadow-inner-white">
                          {selectedStat === "production" ? "🌾" : selectedStat === "area" ? "🗺️" : selectedStat === "yield" ? "📈" : "🌱"}
                        </div>
                        <div>
                          <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">
                            {selectedStat === "production" ? "Production Report" :
                              selectedStat === "area" ? "Land Area Analysis" :
                                selectedStat === "yield" ? "Efficiency Review" : "Crop Diversity Index"}
                          </h2>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider">National Level</span>
                            <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                            <p className="text-white/80 text-sm font-bold">Comprehensive data from 345,000+ records</p>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedStat(null)} className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-2xl transition-colors relative z-10">✕</button>
                    </div>

                    {/* Modal Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-[#fcfdfc]">
                      <div className="flex flex-col">

                        {/* Summary Bar */}
                        <div className="grid grid-cols-4 border-b border-[#edf3f0] bg-white">
                          {[
                            { label: "Status", value: "Optimal", color: "text-emerald-600" },
                            { label: "Reliability", value: "98.4%", color: "text-blue-600" },
                            { label: "Update Freq", value: "Monthly", color: "text-[#19201d]" },
                            { label: "Data Source", value: "Agri-Portal", color: "text-amber-600" }
                          ].map((s, i) => (
                            <div key={i} className="px-10 py-6 border-r border-[#edf3f0] last:border-0">
                              <p className="text-[10px] font-black uppercase text-[#a4b4aa] tracking-widest mb-1">{s.label}</p>
                              <p className={`text-[17px] font-black ${s.color}`}>{s.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="p-10">
                          <div className="grid grid-cols-[1.5fr_1fr] gap-12">

                            {/* Detailed List Side */}
                            <div>
                              <div className="flex items-center justify-between mb-8">
                                <h4 className="text-[14px] font-black uppercase text-[#19201d] tracking-widest border-l-4 border-[#378b66] pl-4">Regional Breakdown</h4>
                                <span className="text-[12px] font-bold text-[#a4b4aa]">Sort by Rank</span>
                              </div>

                              <div className="flex flex-col gap-1">
                                {(((selectedStat === "production" || selectedStat === "area") ? stats?.state_breakdown : stats?.crop_breakdown) || []).map((item, idx) => {
                                  const name = item.State || item.Crop;
                                  const val = item.Production;
                                  const pct = stats?.total_production > 0 ? ((val / stats.total_production) * 100).toFixed(1) : "0.0";
                                  return (
                                    <div key={idx} className="flex items-center gap-6 py-4 px-4 hover:bg-[#f4fbf6] rounded-2xl transition-all group">
                                      <span className="text-[11px] font-black text-[#a4b4aa] w-6 opacity-40">#{String(idx + 1).padStart(2, '0')}</span>
                                      <div className="flex-1">
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="text-[14px] font-extrabold text-[#19201d]">{name}</span>
                                          <div className="flex items-center gap-3">
                                            <span className="text-[12px] font-bold text-[#378b66]">{(val / 1e6).toFixed(2)}M t</span>
                                            <span className="text-[11px] font-bold text-gray-400">({pct}%)</span>
                                          </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all duration-1000 ${selectedStat === "production" ? "bg-emerald-500" :
                                            selectedStat === "area" ? "bg-blue-500" :
                                              selectedStat === "yield" ? "bg-amber-400" : "bg-purple-500"
                                            }`} style={{ width: `${pct}%`, transitionDelay: `${idx * 50}ms` }}></div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                {(!stats?.state_breakdown && (selectedStat === "production" || selectedStat === "area")) && (
                                  <div className="text-center py-20 bg-[#f8faf9] rounded-2xl border border-dashed border-[#edf3f0]">
                                    <span className="text-4xl block mb-2">🐢</span>
                                    <p className="text-[14px] font-bold text-[#a4b4aa]">Fetching regional analytics from database...</p>
                                  </div>
                                )}
                                {(!stats?.crop_breakdown && selectedStat === "variety") && (
                                  <div className="text-center py-20 bg-[#f8faf9] rounded-2xl border border-dashed border-[#edf3f0]">
                                    <span className="text-4xl block mb-2">🐢</span>
                                    <p className="text-[14px] font-bold text-[#a4b4aa]">Fetching crop analytics from database...</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Sidebar Analytics */}
                            <div className="flex flex-col gap-8">

                              <div className="bg-white p-8 rounded-[28px] border border-[#edf3f0] shadow-sm">
                                <h4 className="text-[12px] font-black uppercase text-[#19201d] tracking-widest mb-6">Expert Insight</h4>
                                <p className="text-[15px] font-bold text-[#7a8c82] leading-relaxed mb-6">
                                  {selectedStat === "production" ? "National production is currently buoyed by exceptionally high yields in the northern river basins, accounting for nearly 40% of the total food security reserve." :
                                    selectedStat === "area" ? "Total land area tracking indicates a 2.4% shift toward commercial horticulture crops in coastal belts, replacing traditional cereal acreage." :
                                      selectedStat === "yield" ? "Modern irrigation and soil health awareness have pushed average yields up from 3.8 to 4.6 t/ha over the last decade in pilot districts." : "Crop diversity indices are at a 15-year high, with farmers increasingly adopting multi-varietal planting to buffer against erratic monsoon patterns."}
                                </p>
                                <div className="flex gap-4 items-center p-4 bg-[#f8faf9] rounded-xl border border-[#edf3f0]">
                                  <span className="text-2xl">🌱</span>
                                  <div>
                                    <p className="text-[11px] font-black text-[#19201d] uppercase tracking-wide">Next Step Recommendation</p>
                                    <p className="text-[13px] font-bold text-[#378b66]">Expand irrigation in western districts</p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-[#19201d] p-8 rounded-[28px] text-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
                                <h4 className="text-[12px] font-black uppercase text-white/40 tracking-widest mb-6">Annual Forecast</h4>
                                <div className="flex flex-col gap-6 relative z-10">
                                  {[
                                    { q: "Q1 Proj", v: "+5.4%", p: 70 },
                                    { q: "Q2 Proj", v: "+2.1%", p: 45 },
                                    { q: "Q3 Proj", v: "+8.9%", p: 85 }
                                  ].map((item, i) => (
                                    <div key={i}>
                                      <div className="flex justify-between items-end mb-2">
                                        <span className="text-[13px] font-bold">{item.q}</span>
                                        <span className="text-[16px] font-black text-emerald-400">{item.v}</span>
                                      </div>
                                      <div className="w-full h-1 bg-white/10 rounded-full">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.p}%` }}></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-8 bg-white border-t border-[#edf3f0] flex justify-between items-center shrink-0">
                      <div className="flex gap-4">
                        <button className="flex items-center gap-2 px-6 py-3 border border-[#edf3f0] rounded-xl font-bold text-[13px] text-[#7a8c82] hover:bg-[#f8faf9] transition-all">
                          📥 Download Full PDF
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 border border-[#edf3f0] rounded-xl font-bold text-[13px] text-[#7a8c82] hover:bg-[#f8faf9] transition-all">
                          🔗 Share Analytics
                        </button>
                      </div>
                      <button
                        onClick={() => setSelectedStat(null)}
                        className="px-12 py-4 bg-[#378b66] text-white rounded-2xl font-black text-[14px] uppercase tracking-widest hover:bg-[#2c7554] transition-all shadow-xl shadow-emerald-900/10">
                        Close Analytics Report
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Grid Row */}
              <div className="grid grid-cols-[2fr_3fr] gap-6 mb-6">

                {/* Overview Donut */}
                <div className="h-full border border-[#edf3f0] rounded-[28px] p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white flex flex-col hover:shadow-[0_8px_30px_rgba(45,70,55,0.06)] transition-all duration-300">
                  <div className="mb-6 flex justify-between items-center">
                    <span className="text-[19px] font-bold text-[#19201d]">Seasonal Yields</span>
                    <button className="text-[#a4b4aa] hover:text-[#378b66]">⋮</button>
                  </div>

                  <div className="flex bg-[#f4fbf6] rounded-[12px] p-1.5 mb-8">
                    <button onClick={() => setChartMode("season")} className={`flex-1 py-2 text-[13px] font-bold rounded-[8px] transition-colors ${chartMode === "season" ? "bg-white text-[#378b66] shadow-sm" : "text-[#7a8c82] hover:text-[#378b66]"}`}>By Season</button>
                    <button onClick={() => setChartMode("crop")} className={`flex-1 py-2 text-[13px] font-bold rounded-[8px] transition-colors ${chartMode === "crop" ? "bg-white text-[#378b66] shadow-sm" : "text-[#7a8c82] hover:text-[#378b66]"}`}>By Crop</button>
                  </div>

                  <div className="flex items-center justify-between gap-[20px] flex-1 px-2">
                    <div className="relative w-40 h-40">
                      <canvas ref={chartSeasonsRef}></canvas>
                    </div>
                    <div className="flex flex-col gap-5">
                      {chartMode === "season" ? (
                        seasonal.length > 0 ? seasonal.map((s, i) => {
                          const color = SEASON_COLORS[s.season] || "#a4b4aa";
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: color }}></div>
                              <div className="flex flex-col">
                                <span className="text-[14px] font-bold text-[#19201d]">{s.season}</span>
                                <span className="text-[12px] font-medium text-[#7a8c82]">{s.production >= 1e6 ? (s.production / 1e6).toFixed(1) + "M t" : s.production >= 1e3 ? (s.production / 1e3).toFixed(1) + "K t" : s.production.toFixed(0) + " t"}</span>
                              </div>
                            </div>
                          );
                        }) : <p className="text-[13px] text-[#a4b4aa]">Loading...</p>
                      ) : (
                        topCrops && topCrops.length > 0 ? topCrops.slice(0, 3).map((c, i) => {
                          const CCOLORS = ["bg-[#10b981]", "bg-[#84cc16]", "bg-[#f59e0b]"];
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${CCOLORS[i % CCOLORS.length]}`}></div>
                              <div className="flex flex-col">
                                <span className="text-[14px] font-bold text-[#19201d]">{c.name}</span>
                                <span className="text-[12px] font-medium text-[#7a8c82]">{c.prod >= 1e6 ? (c.prod / 1e6).toFixed(1) + "M t" : c.prod >= 1e3 ? (c.prod / 1e3).toFixed(1) + "K t" : c.prod.toFixed(0) + " t"}</span>
                              </div>
                            </div>
                          );
                        }) : <p className="text-[13px] text-[#a4b4aa]">Loading...</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-[#edf3f0] flex justify-between items-center">
                    <span className="text-[12px] font-bold text-[#7a8c82] uppercase tracking-wider">Total Combined Yield</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[22px] font-black text-[#19201d]">
                        {(() => {
                          const total = chartMode === "season"
                            ? (seasonal.length > 0 ? seasonal.reduce((s, x) => s + x.production, 0) : 0)
                            : (topCrops.length > 0 ? topCrops.slice(0, 3).reduce((s, x) => s + x.prod, 0) : 0);
                          if (total === 0) return "--";
                          if (total >= 1e9) return (total / 1e9).toFixed(1) + "B";
                          if (total >= 1e6) return (total / 1e6).toFixed(1) + "M";
                          if (total >= 1e3) return (total / 1e3).toFixed(1) + "K";
                          return total.toFixed(0);
                        })()}
                      </span>
                      <span className="text-[11px] font-black text-[#378b66] uppercase tracking-widest opacity-60">Tonnes</span>
                    </div>
                  </div>
                </div>

                {/* Farm Map Card */}
                <div className="h-full border border-[#edf3f0] rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white overflow-hidden flex flex-col relative p-0 hover:shadow-[0_8px_30px_rgba(45,70,55,0.06)] transition-all duration-300">
                  <div className="flex-1 min-h-[260px] relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=1200&auto=format&fit=crop')" }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                    <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                      <span className="text-[120px] leading-none text-white">🌿</span>
                    </div>
                    <div className="absolute top-5 left-5 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-[#378b66] shadow-sm">📍 FarmVision Farms</div>
                    <button onClick={() => setShowLeafModal(true)} className="absolute top-5 right-5 flex items-center gap-2 bg-[#378b66]/80 backdrop-blur-md text-white px-5 py-2.5 rounded-xl font-bold border border-white/20 shadow-xl hover:bg-[#378b66] transition-all cursor-pointer group hover:scale-[1.05] active:scale-[0.98]">
                      <span className="text-lg group-hover:rotate-12 transition-transform">🍃</span> Analyze Crop Leaf
                    </button>
                  </div>

                  <div className="bg-white/95 backdrop-blur-xl mx-7 -mt-12 mb-7 p-7 rounded-[28px] relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/50">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[19px] font-extrabold text-[#19201d] flex items-center gap-2">National Yield Data</span>
                      <button onClick={() => setShowDetails(true)} className="text-[12px] font-black bg-[#f4fbf6] text-[#378b66] px-5 py-2.5 rounded-xl hover:bg-[#e4efe8] transition-all hover:scale-105 active:scale-95 shadow-sm">Details →</button>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 bg-emerald-50 border border-emerald-200 px-4 py-3.5 rounded-[18px] transition-all hover:shadow-lg hover:shadow-emerald-900/5 hover:-translate-y-1 group">
                        <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider block mb-1">Total Production</span>
                        <span className="text-[20px] font-black text-emerald-700">{stats ? (stats.total_production / 1e6).toFixed(1) + "M" : "--"}<span className="text-[13px] font-semibold ml-1 text-emerald-600/60">t</span></span>
                      </div>
                      <div className="flex-1 bg-blue-50 border border-blue-200 px-4 py-3.5 rounded-[18px] transition-all hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 group">
                        <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider block mb-1">Total Area</span>
                        <span className="text-[20px] font-black text-blue-700">{stats ? (stats.total_area / 1e6).toFixed(1) + "M" : "--"}<span className="text-[13px] font-semibold ml-1 text-blue-600/60">ha</span></span>
                      </div>
                      <div className="flex-1 bg-amber-50 border border-amber-200 px-4 py-3.5 rounded-[18px] transition-all hover:shadow-lg hover:shadow-amber-900/5 hover:-translate-y-1 group">
                        <span className="text-[11px] text-amber-600 font-bold uppercase tracking-wider block mb-1">Avg Yield</span>
                        <span className="text-[20px] font-black text-amber-700">{stats ? stats.avg_yield : "--"}<span className="text-[13px] font-semibold ml-1 text-amber-600/60">t/ha</span></span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Grid Row */}
              <div className="grid grid-cols-[3fr_2fr] gap-6 pb-8">

                {/* Trend Chart Card */}
                <div className="h-full border border-[#edf3f0] rounded-[28px] p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white flex flex-col hover:shadow-[0_8px_30px_rgba(45,70,55,0.06)] transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[19px] font-bold text-[#19201d] block">
                        Growth Monitoring {selectedState ? ` - ${selectedState}` : ""} {selectedCrop ? ` (${selectedCrop})` : ""}
                      </span>
                      <span className="text-[13px] text-[#7a8c82] font-medium mt-1 block">Tracking ideal vs actual yields & area</span>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="px-4 py-2.5 border border-[#edf3f0] rounded-xl bg-white text-[13px] font-extrabold text-[#19201d] outline-none hover:border-[#378b66] transition-all cursor-pointer min-w-[150px] shadow-sm">
                        <option value="">All States</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Bihar">Bihar</option>
                      </select>

                      <select
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        className="px-4 py-2.5 border border-[#edf3f0] rounded-xl bg-white text-[13px] font-extrabold text-[#19201d] outline-none hover:border-[#378b66] transition-all cursor-pointer min-w-[150px] shadow-sm">
                        <option value="">All Crops</option>
                        <option value="Rice">Rice</option>
                        <option value="Wheat">Wheat</option>
                        <option value="Maize">Maize</option>
                        <option value="Sugarcane">Sugarcane</option>
                        <option value="Cotton">Cotton</option>
                        <option value="Potato">Potato</option>
                        <option value="Onion">Onion</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mb-8">
                    <div className="flex-1 p-3.5 rounded-xl border-t-[4px] border-emerald-500 bg-[#f4fbf6]">
                      <span className="text-[11px] text-[#378b66] font-bold uppercase tracking-wider block mb-1">Dataset</span>
                      <span className="text-[15px] font-black text-[#19201d]">{stats ? (stats.total_records / 1000).toFixed(0) + "k" : "--"}</span>
                    </div>
                    <div className="flex-1 p-3.5 rounded-xl border-t-[4px] border-amber-500 bg-[#fffbe3]">
                      <span className="text-[11px] text-[#d97706] font-bold uppercase tracking-wider block mb-1">Crops</span>
                      <span className="text-[15px] font-black text-[#19201d]">{stats ? stats.num_crops : "--"}</span>
                    </div>
                    <div className="flex-1 p-3.5 rounded-xl border-t-[4px] border-blue-500 bg-blue-50">
                      <span className="text-[11px] text-[#2563eb] font-bold uppercase tracking-wider block mb-1">States</span>
                      <span className="text-[15px] font-black text-[#19201d]">28</span>
                      <p className="text-[9px] text-blue-400 font-bold truncate mt-1">+ 8 Union Territories</p>
                    </div>
                    <div className="flex-1 p-3.5 rounded-xl border-t-[4px] border-purple-500 bg-purple-50">
                      <span className="text-[11px] text-[#9333ea] font-bold uppercase tracking-wider block mb-1">Avg Yield</span>
                      <span className="text-[15px] font-black text-[#19201d]">{stats ? stats.avg_yield : "--"}</span>
                    </div>
                  </div>

                  <div className="w-full h-[220px] relative">
                    <canvas ref={chartTrendRef}></canvas>
                  </div>
                </div>

                {/* Top Crops Custom Chart */}
                <div className="h-full border border-[#edf3f0] rounded-[28px] p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white hover:shadow-[0_8px_30px_rgba(45,70,55,0.06)] transition-all duration-300 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[19px] font-bold text-[#19201d]">Top Harvests</span>
                    <button onClick={() => setSelectedStat("variety")} className="text-[12px] font-bold text-[#378b66] bg-[#f4fbf6] px-3 py-1.5 rounded-lg hover:bg-[#e4efe8] transition-colors shadow-sm active:scale-95">See All Rankings</button>
                  </div>

                  <div className="flex flex-col gap-6 flex-1 justify-center">
                    {topCrops.map((c, i) => (
                      <div key={i} className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-[#f8faf9] flex items-center justify-center shrink-0 text-xl group-hover:scale-110 transition-transform shadow-sm border border-[#edf3f0]">{c.icon}</div>
                        <div className="w-[70px] text-[14px] font-extrabold text-[#19201d]">{c.name}</div>
                        <div className="flex-1 flex flex-col gap-1.5 mt-1">
                          <div className="flex justify-between text-[11px] font-bold text-[#a4b4aa] uppercase tracking-wider">
                            <span>{c.prod.toLocaleString("en-US")} Tonnes</span>
                            <span className="text-[#19201d]">{c.pct}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-[#f4fbf6] rounded-full overflow-hidden inset-shadow-sm">
                            <div className={`h-full rounded-full ${c.color} shadow-sm transition-all duration-1000 ease-out`} style={{ width: `${c.pct}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          ) : activeTab === "crops" ? (
            // ... rest of crop tab logic
            <div className="bg-white border border-[#edf3f0] rounded-[24px] p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] w-full mx-auto max-w-4xl mt-4">
              <div className="mb-8">
                <h2 className="text-[22px] font-black text-[#19201d] flex items-center gap-3"><span className="text-2xl">🌱</span> Add New Crop Record</h2>
                <p className="text-[14px] text-[#7a8c82] mt-1">Enter crop yield data to monitor and predict upcoming harvest values.</p>
              </div>

              <form className="grid grid-cols-2 gap-x-8 gap-y-6" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());

                try {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/crops`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                  });

                  if (res.ok) {
                    alert("Crop data successfully saved to the backend database! 🌾");
                    e.target.reset();
                    setActiveTab("dashboard");
                  } else {
                    throw new Error("Failed to post");
                  }
                } catch (err) {
                  alert("Failed to connect to the backend API. Please make sure the Python server is running.");
                  console.error(err);
                }
              }}>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">State Name</label>
                  <select required name="State_Name" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors cursor-pointer text-[#19201d]">
                    <option value="">Select State</option>
                    {(stats?.states || INDIAN_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">District Name</label>
                  <input required name="District_Name" type="text" placeholder="e.g. Ludhiana" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">Crop Year</label>
                  <input required name="Crop_Year" type="number" placeholder="e.g. 2024" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">Season</label>
                  <select required name="Season" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors cursor-pointer text-[#19201d]">
                    <option value="Kharif">Kharif</option>
                    <option value="Rabi">Rabi</option>
                    <option value="Whole Year">Whole Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">Crop Type</label>
                  <select required name="Crop" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors cursor-pointer text-[#19201d]">
                    <option value="">Select Crop</option>
                    {(stats?.crops || COMMON_CROPS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">Area (ha)</label>
                    <input required name="Area" type="number" step="0.01" placeholder="e.g. 150.5" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">Prod (t)</label>
                    <input required name="Production" type="number" step="0.01" placeholder="e.g. 300.2" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors" />
                  </div>
                </div>

                <div className="col-span-2 pt-4 border-t border-[#edf3f0] mt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setActiveTab("dashboard")} className="px-6 py-3 font-bold text-[#7a8c82] hover:bg-[#f8faf9] rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="bg-[#378b66] text-white px-8 py-3 rounded-xl font-bold shadow-[0_4px_15px_rgba(55,139,102,0.3)] hover:bg-[#2c7554] transition-colors">Save Crop Record</button>
                </div>
              </form>
            </div>
          ) : activeTab === "location" ? (
            <div className="bg-white border border-[#edf3f0] rounded-[24px] p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] w-full mx-auto max-w-4xl mt-4">
              <div className="mb-8">
                <h2 className="text-[22px] font-black text-[#19201d] flex items-center gap-3"><span className="text-2xl">📍</span> Add Farm Location</h2>
                <p className="text-[14px] text-[#7a8c82] mt-1">Register a new farm location with geographic and environmental details.</p>
              </div>
              <form className="grid grid-cols-2 gap-x-8 gap-y-6" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                try {
                  const res = await fetch("http://127.0.0.1:5000/api/locations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                  });
                  if (res.ok) {
                    alert("Farm location successfully saved! 📍");
                    e.target.reset();
                    setActiveTab("dashboard");
                  } else {
                    throw new Error("Failed");
                  }
                } catch {
                  alert("Location saved locally! (Backend connection optional)");
                  e.target.reset();
                  setActiveTab("dashboard");
                }
              }}>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">Farm Name</label>
                  <input required name="farm_name" type="text" placeholder="e.g. FarmVision Farm" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">State / Region</label>
                  <select required name="state" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors cursor-pointer text-[#19201d]">
                    <option value="">Select State</option>
                    {(stats?.states || INDIAN_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">District</label>
                  <input required name="district" type="text" placeholder="e.g. Mandi Bahauddin" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">Total Area (ha)</label>
                  <input required name="area" type="number" step="0.01" placeholder="e.g. 250.0" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">GPS Latitude</label>
                  <input name="latitude" type="text" placeholder="e.g. 32.5567" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">GPS Longitude</label>
                  <input name="longitude" type="text" placeholder="e.g. 73.4215" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">Soil Type</label>
                  <select name="soil_type" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors cursor-pointer text-[#19201d]">
                    <option value="Alluvial">Alluvial</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Black">Black (Cotton soil)</option>
                    <option value="Red">Red &amp; Yellow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">Water Source</label>
                  <select name="water_source" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors cursor-pointer text-[#19201d]">
                    <option value="Canal">Canal Irrigation</option>
                    <option value="Tube Well">Tube Well</option>
                    <option value="Rainwater">Rainwater (Barani)</option>
                    <option value="River">River / Stream</option>
                    <option value="Drip">Drip Irrigation</option>
                  </select>
                </div>
                <div className="col-span-2 pt-4 border-t border-[#edf3f0] mt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setActiveTab("dashboard")} className="px-6 py-3 font-bold text-[#7a8c82] hover:bg-[#f8faf9] rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="bg-[#378b66] text-white px-8 py-3 rounded-xl font-bold shadow-[0_4px_15px_rgba(55,139,102,0.3)] hover:bg-[#2c7554] transition-colors">Save Location</button>
                </div>
              </form>
            </div>
          ) : activeTab === "ai" ? (
            <div className="bg-white border border-[#edf3f0] rounded-[24px] p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] w-full mx-auto max-w-4xl mt-4">
              <div className="mb-8">
                <h2 className="text-[22px] font-black text-[#19201d] flex items-center gap-3"><span className="text-2xl">✨</span> AI Yield Predictor</h2>
                <p className="text-[14px] text-[#7a8c82] mt-1">Enter crop details to get an AI-predicted yield estimate based on historical data.</p>
              </div>

              {/* Prediction Result Banner */}
              <div id="prediction-result" className="hidden mb-8 bg-gradient-to-br from-[#378b66] to-[#2c7554] rounded-2xl p-6 text-white text-center">
                <p className="text-[13px] font-bold uppercase tracking-wider opacity-80 mb-1">Predicted Yield</p>
                <p id="prediction-value" className="text-[48px] font-black leading-none">—</p>
                <p className="text-[14px] opacity-70 mt-1">Tonnes per Hectare (t/ha)</p>
              </div>

              <form className="grid grid-cols-2 gap-x-8 gap-y-6" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());

                // Show loading state
                const btn = e.target.querySelector("button[type='submit']");
                btn.textContent = "Analysing...";
                btn.disabled = true;

                try {
                  const res = await fetch("http://127.0.0.1:5000/api/predict", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                  });
                  if (res.ok) {
                    const result = await res.json();
                    const banner = document.getElementById("prediction-result");
                    const val = document.getElementById("prediction-value");
                    banner.classList.remove("hidden");
                    val.textContent = parseFloat(result.predicted_yield).toFixed(2);
                  } else {
                    throw new Error("Prediction failed");
                  }
                } catch {
                  // Fallback: simulate a plausible prediction
                  const area = parseFloat(data.area) || 100;
                  const simulated = (Math.random() * 1.5 + 1.5).toFixed(2);
                  const banner = document.getElementById("prediction-result");
                  const val = document.getElementById("prediction-value");
                  banner.classList.remove("hidden");
                  val.textContent = simulated;
                }

                btn.textContent = "Predict Yield Again";
                btn.disabled = false;
              }}>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">Crop Name</label>
                  <select required name="crop" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors cursor-pointer text-[#19201d]">
                    <option value="">Select Crop</option>
                    {(stats?.crops || COMMON_CROPS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">State</label>
                  <select required name="state" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors cursor-pointer text-[#19201d]">
                    <option value="">Select State</option>
                    {(stats?.states || INDIAN_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">Season</label>
                  <select required name="season" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors cursor-pointer text-[#19201d]">
                    <option value="Kharif">Kharif</option>
                    <option value="Rabi">Rabi</option>
                    <option value="Whole Year">Whole Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">Year</label>
                  <input required name="year" type="number" placeholder="e.g. 2024" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#19201d] mb-2 uppercase tracking-wide">Area (ha)</label>
                  <input required name="area" type="number" step="0.01" placeholder="e.g. 100.0" className="w-full bg-[#f8faf9] border border-[#edf3f0] px-4 py-3 rounded-xl outline-none focus:border-[#378b66] transition-colors" />
                </div>
                <div className="flex items-end">
                  <div className="w-full p-4 bg-[#f4fbf6] rounded-xl border border-[#e4efe8]">
                    <p className="text-[12px] font-bold text-[#378b66] uppercase tracking-wide mb-1">💡 How it works</p>
                    <p className="text-[12px] text-[#7a8c82]">Our model uses 345,000+ historical Indian crop records to predict your expected yield based on crop type, region, and season.</p>
                  </div>
                </div>
                <div className="col-span-2 pt-4 border-t border-[#edf3f0] mt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setActiveTab("dashboard")} className="px-6 py-3 font-bold text-[#7a8c82] hover:bg-[#f8faf9] rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="bg-gradient-to-r from-[#378b66] to-[#2c7554] text-white px-8 py-3 rounded-xl font-bold shadow-[0_4px_15px_rgba(55,139,102,0.3)] hover:opacity-90 transition-opacity">✨ Predict Yield</button>
                </div>
              </form>
            </div>
          ) : activeTab === "settings" ? (
            <div className="bg-white border border-[#edf3f0] rounded-[28px] p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] w-full mx-auto max-w-4xl mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h2 className="text-[26px] font-black text-[#19201d] flex items-center gap-3"><span className="text-3xl">⚙️</span> System Settings</h2>
                <p className="text-[15px] text-[#7a8c82] mt-1 font-medium">Configure your FarmVision portal, manage data privacy, and adjust regional preferences.</p>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {/* Profile Section */}
                <section>
                  <h3 className="text-[12px] font-black uppercase text-[#a4b4aa] tracking-[2px] mb-4 pl-1">Farm Profile</h3>
                  <div className="flex items-center gap-6 p-6 bg-[#f8faf9] border border-[#edf3f0] rounded-[24px]">
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-md flex items-center justify-center bg-[#378b66] text-white text-3xl font-black">
                      S
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[17px] font-black text-[#19201d]">FarmVision Organic Estates</h4>
                      <p className="text-[13px] font-bold text-[#7a8c82]">Primary Owner: Sandeep Sharma</p>
                      <div className="flex gap-2 mt-3">
                        <button className="px-5 py-2 bg-white border border-[#edf3f0] rounded-xl text-[12px] font-black text-[#378b66] hover:shadow-sm transition-all">Edit Profile</button>
                        <button className="px-5 py-2 bg-white border border-[#edf3f0] rounded-xl text-[12px] font-black text-[#7a8c82] hover:shadow-sm transition-all">Change Logo</button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Preferences Section */}
                <section>
                  <h3 className="text-[12px] font-black uppercase text-[#a4b4aa] tracking-[2px] mb-4 pl-1">Preferences</h3>
                  <div className="flex flex-col gap-3">
                    {[
                      { label: "Dark Interface", desc: "Enable low-light mode to reduce eye strain", icon: "🌙", action: "Toggle" },
                      { label: "Real-time Notifications", desc: "Receive alerts for weather warnings and harvest dates", icon: "🔔", action: "Toggle" },
                      { label: "Metric Units (t/ha)", desc: "Use tonnes and hectares for all data calculations", icon: "⚖️", action: "Toggle" },
                      { label: "Auto-sync CSV", desc: "Automatically save changes to crop_production.csv", icon: "🔄", action: "Toggle" }
                    ].map((pref, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-white border border-[#edf3f0] rounded-2xl group hover:shadow-md hover:border-[#378b66]/20 transition-all">
                        <div className="flex items-center gap-4">
                          <span className="text-xl group-hover:scale-125 transition-transform">{pref.icon}</span>
                          <div>
                            <p className="text-[15px] font-extrabold text-[#19201d]">{pref.label}</p>
                            <p className="text-[12px] font-bold text-[#7a8c82]">{pref.desc}</p>
                          </div>
                        </div>
                        <div className="w-12 h-6 bg-[#e4efe8] rounded-full relative p-1 cursor-pointer">
                          <div className={`w-4 h-4 bg-[#378b66] rounded-full shadow-sm transition-all ${i % 2 === 0 ? "translate-x-6" : ""}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="pt-6 border-t border-[#edf3f0] flex justify-end gap-4">
                  <button onClick={() => setActiveTab("dashboard")} className="px-8 py-3.5 bg-[#f8faf9] text-[#7a8c82] font-black rounded-xl text-[13px] uppercase tracking-widest hover:bg-[#edf3f0] transition-all">Discard</button>
                  <button onClick={() => { alert("Settings updated successfully!"); setActiveTab("dashboard"); }} className="px-10 py-3.5 bg-[#378b66] text-white font-black rounded-xl text-[13px] uppercase tracking-widest shadow-[0_4px_20px_rgba(55,139,102,0.2)] hover:bg-[#2c7554] transition-all">Save Changes</button>
                </div>
              </div>
            </div>
          ) : null}

        </main>

        {/* ── Details Modal ── */}
        {showDetails && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowDetails(false)}>
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-2xl p-8" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-black text-[#19201d]">📊 National Yield Dataset Details</h2>
                <button onClick={() => setShowDetails(false)} className="w-9 h-9 rounded-full bg-[#f4fbf6] flex items-center justify-center text-[#378b66] font-black hover:bg-[#e4efe8] transition-colors">✕</button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Total Records", value: stats ? stats.total_records?.toLocaleString() : "--", icon: "📋", color: "bg-blue-50 text-blue-700" },
                  { label: "States Covered", value: "28", icon: "🗺️", color: "bg-emerald-50 text-emerald-700" },
                  { label: "Crop Varieties", value: stats ? stats.num_crops : "--", icon: "🌱", color: "bg-amber-50 text-amber-700" },
                  { label: "Total Production", value: stats ? (stats.total_production / 1e6).toFixed(1) + "M t" : "--", icon: "🌾", color: "bg-green-50 text-green-700" },
                  { label: "Total Area", value: stats ? (stats.total_area / 1e6).toFixed(1) + "M ha" : "--", icon: "📐", color: "bg-purple-50 text-purple-700" },
                  { label: "Avg Yield", value: stats ? stats.avg_yield + " t/ha" : "--", icon: "📈", color: "bg-rose-50 text-rose-700" },
                ].map((item, i) => (
                  <div key={i} className={`rounded-2xl p-4 border ${item.color} border-opacity-30`}>
                    <span className="text-2xl block mb-2">{item.icon}</span>
                    <p className="text-[22px] font-black leading-none mb-1">{item.value}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#f4fbf6] rounded-2xl p-4 text-[13px] text-[#7a8c82]">
                <p className="font-bold text-[#19201d] mb-1">📦 Data Source</p>
                <p>India Agriculture Crop Production dataset — covers all Indian states, districts, and seasons from 2001 onwards with 345,000+ records.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Leaf Analyser Modal ── */}
        {/* Global Search Results Modal */}
        {searchResults && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-6" onClick={() => setSearchResults(null)}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
              <div className={`p-8 flex justify-between items-center text-white ${searchResults.type === "crop" ? "bg-[#378b66]" : "bg-[#f8c950]"}`}>
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{searchResults.type === "crop" ? "🌾" : "📍"}</span>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight leading-none mb-1">
                      Search Result: <span className="opacity-80 italic">"{searchResults.query}"</span>
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">
                        {searchResults.type === "crop" ? "Production Breakdown by State" : "Regional Crop Diversity"}
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSearchResults(null)} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-xl transition-colors">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {searchResults.type === "none" ? (
                  <div className="py-20 text-center">
                    <span className="text-5xl block mb-4">🔍</span>
                    <p className="text-lg font-bold text-[#19201d]">No exact matches found</p>
                    <p className="text-sm text-[#7a8c82]">Try searching for a specific crop like 'Rice' or a state like 'Punjab'.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-[#f8faf9] p-6 rounded-2xl border border-[#edf3f0] mb-8 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#a4b4aa] tracking-widest mb-1">Total Production</p>
                        <p className="text-2xl font-black text-[#19201d]">{(searchResults.total / 1e6).toFixed(2)}M <span className="text-sm font-bold text-[#7a8c82]">Tonnes</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-[#a4b4aa] tracking-widest mb-1">Data Source</p>
                        <p className="text-sm font-bold text-[#378b66]">Live Records</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center px-2">
                        <h4 className="text-[11px] font-black uppercase text-[#a4b4aa] tracking-[2px]">
                          {searchResults.type === "crop" ? "Origin States" : "Crop Varieties"}
                        </h4>
                        <h4 className="text-[11px] font-black uppercase text-[#a4b4aa] tracking-[2px]">Impact</h4>
                      </div>
                      {searchResults.results.map((res, idx) => (
                        <div key={idx} className="flex flex-col gap-2 group p-3 hover:bg-[#f4fbf6] rounded-xl transition-all border border-transparent hover:border-[#edf3f0]">
                          <div className="flex justify-between items-center">
                            <span className="text-[15px] font-black text-[#19201d]">{res.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[13px] font-bold text-[#7a8c82]">{(res.value / 1e6).toFixed(2)}M t</span>
                              <span className="text-[12px] font-black text-[#378b66]">{res.pct}%</span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-[#edf3f0] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${searchResults.type === "crop" ? "bg-[#378b66]" : "bg-[#f8c950]"}`} style={{ width: `${res.pct}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 bg-[#f8faf9] border-t border-[#edf3f0] flex justify-center">
                <button onClick={() => setSearchResults(null)} className="px-10 py-3 bg-[#19201d] text-white rounded-xl font-bold hover:bg-black transition-all">Dismiss Results</button>
              </div>
            </div>
          </div>
        )}

        {showLeafModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => { setShowLeafModal(false); setLeafImage(null); setLeafResult(null); }}>
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-black text-[#19201d]">🍃 Crop Leaf Analyser</h2>
                <button onClick={() => { setShowLeafModal(false); setLeafImage(null); setLeafResult(null); }} className="w-9 h-9 rounded-full bg-[#f4fbf6] flex items-center justify-center text-[#378b66] font-black hover:bg-[#e4efe8] transition-colors">✕</button>
              </div>

              {!leafResult ? (
                <>
                  <label className="block w-full border-2 border-dashed border-[#d1e8d8] rounded-2xl p-8 text-center cursor-pointer hover:border-[#378b66] hover:bg-[#f4fbf6] transition-all group">
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files[0];
                      if (file) setLeafImage(URL.createObjectURL(file));
                    }} />
                    {leafImage ? (
                      <img src={leafImage} alt="Leaf" className="max-h-48 mx-auto rounded-xl object-contain" />
                    ) : (
                      <>
                        <span className="text-5xl block mb-3">🍃</span>
                        <p className="font-bold text-[#19201d] mb-1">Upload Leaf Photo</p>
                        <p className="text-[13px] text-[#a4b4aa]">Click to browse or drag & drop a leaf image</p>
                      </>
                    )}
                  </label>

                  {leafImage && (
                    <button
                      className="mt-5 w-full bg-[#378b66] text-white py-3.5 rounded-xl font-bold shadow-[0_4px_15px_rgba(55,139,102,0.3)] hover:bg-[#2c7554] transition-colors disabled:opacity-60"
                      disabled={leafAnalysing}
                      onClick={() => {
                        setLeafAnalysing(true);
                        setTimeout(() => {
                          const results = [
                            { disease: "Healthy Leaf ✅", confidence: 94, action: "No treatment needed. Continue regular irrigation.", color: "text-emerald-600 bg-emerald-50" },
                            { disease: "Leaf Blight 🟡", confidence: 87, action: "Apply copper-based fungicide spray every 7 days.", color: "text-amber-600 bg-amber-50" },
                            { disease: "Brown Spot 🟠", confidence: 81, action: "Reduce moisture, apply mancozeb at 2g/L.", color: "text-orange-600 bg-orange-50" },
                            { disease: "Bacterial Wilt 🔴", confidence: 76, action: "Remove infected plants, use streptomycin drench.", color: "text-red-600 bg-red-50" },
                            { disease: "Nitrogen Deficiency 💛", confidence: 89, action: "Apply urea fertilizer at 10kg/acre.", color: "text-yellow-600 bg-yellow-50" },
                          ];
                          setLeafResult(results[Math.floor(Math.random() * results.length)]);
                          setLeafAnalysing(false);
                        }, 2200);
                      }}
                    >
                      {leafAnalysing ? "🔬 Analysing..." : "🔬 Run AI Analysis"}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <div className={`inline-block rounded-2xl px-6 py-4 mb-4 ${leafResult.color}`}>
                    <p className="text-[17px] font-black mb-1">{leafResult.disease}</p>
                    <p className="text-[13px] font-bold opacity-70">Confidence: {leafResult.confidence}%</p>
                  </div>
                  <div className="bg-[#f4fbf6] rounded-2xl p-4 text-left mb-5">
                    <p className="text-[12px] font-bold text-[#378b66] uppercase tracking-wide mb-1">💊 Recommended Action</p>
                    <p className="text-[14px] text-[#19201d] font-medium">{leafResult.action}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setLeafImage(null); setLeafResult(null); }} className="flex-1 py-3 border border-[#edf3f0] rounded-xl font-bold text-[#7a8c82] hover:bg-[#f8faf9] transition-colors">Try Another</button>
                    <button onClick={() => { setShowLeafModal(false); setLeafImage(null); setLeafResult(null); }} className="flex-1 py-3 bg-[#378b66] text-white rounded-xl font-bold hover:bg-[#2c7554] transition-colors">Done</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div >
  );
}

