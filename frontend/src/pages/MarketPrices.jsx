import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useSettings } from "../hooks/useSettings";

const COMMODITY_ICONS = {
  "Tomato": "🍅", "Onion": "🧅", "Potato": "🥔",
  "Rice (Raw)": "🍚", "Rice (Boiled)": "🍚", "Wheat": "🌾",
  "Tur Dal": "🫘", "Chana Dal": "🫘", "Moong Dal": "🫘",
  "Groundnut Oil": "🫒", "Coconut Oil": "🥥", "Milk": "🥛",
  "Eggs (dozen)": "🥚", "Banana": "🍌", "Brinjal": "🍆", "Carrot": "🥕",
};
const getIcon = (name) => COMMODITY_ICONS[name] || "🌿";

function MarketPrices() {
  const { districts } = useSettings();
  const [prices, setPrices]             = useState([]);
  const [loading, setLoading]           = useState(false);
  const [selectedDistrict, setDistrict] = useState("");
  const [search, setSearch]             = useState("");
  const [sortBy, setSortBy]             = useState("commodity");
  const [fetched, setFetched]           = useState(false);

  const fetchPrices = async (district) => {
    if (!district) return;
    setLoading(true);
    setFetched(false);
    try {
      const res = await api.get(`/price/district/${district}`);
      setPrices(res.data);
      setFetched(true);
    } catch (err) {
      console.error(err);
      setPrices([]);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrict = (d) => {
    setDistrict(d);
    setSearch("");
    fetchPrices(d);
  };

  // Filter + sort
  const filtered = prices
    .filter(p => !search || p.commodity.toLowerCase().includes(search.toLowerCase()) || p.marketName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "price_asc")  return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "latest")     return new Date(b.createdAt) - new Date(a.createdAt);
      return a.commodity.localeCompare(b.commodity);
    });

  // Group by commodity for summary cards
  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.commodity]) acc[item.commodity] = [];
    acc[item.commodity].push(item);
    return acc;
  }, {});

  const avgPrice = (items) => (items.reduce((s, i) => s + i.price, 0) / items.length).toFixed(1);
  const minPrice = (items) => Math.min(...items.map(i => i.price));
  const maxPrice = (items) => Math.max(...items.map(i => i.price));

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: "32px" }} className="fade-up">
        <p style={{ color: "var(--accent)", fontSize: "12px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
          Live Data
        </p>
        <h1 style={{ fontSize: "36px", color: "var(--text)", marginBottom: "6px" }}>Market Prices</h1>
        <p style={{ color: "var(--muted)", fontSize: "15px" }}>
          Browse approved commodity prices across Tamil Nadu districts
        </p>
      </div>

      {/* District selector */}
      <div className="card fade-up fade-up-1" style={{ marginBottom: "24px", padding: "20px 24px" }}>
        <p style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "500", marginBottom: "12px" }}>Select a district to view prices</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {districts.map(d => (
            <button
              key={d}
              onClick={() => handleDistrict(d)}
              style={{
                padding: "7px 14px", borderRadius: "99px",
                border: `1px solid ${selectedDistrict === d ? "var(--accent)" : "var(--border)"}`,
                background: selectedDistrict === d ? "rgba(245,158,11,0.15)" : "transparent",
                color: selectedDistrict === d ? "var(--accent)" : "var(--muted)",
                fontSize: "13px", fontWeight: selectedDistrict === d ? "600" : "400",
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (selectedDistrict !== d) { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--text)"; }}}
              onMouseLeave={e => { if (selectedDistrict !== d) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Results area */}
      {!selectedDistrict && (
        <div className="card fade-up" style={{ textAlign: "center", padding: "60px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗺️</div>
          <h3 style={{ color: "var(--text)", marginBottom: "8px" }}>Choose a District</h3>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>Select any district above to see live approved market prices.</p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "80px", color: "var(--muted)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
          Loading prices for {selectedDistrict}…
        </div>
      )}

      {fetched && !loading && (
        <>
          {/* Summary bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }} className="fade-up">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <h2 style={{ fontSize: "20px", color: "var(--text)", fontWeight: "600" }}>
                {selectedDistrict}
              </h2>
              <span style={{ fontSize: "12px", color: "var(--accent)", background: "rgba(245,158,11,0.1)", padding: "4px 12px", borderRadius: "99px", border: "1px solid rgba(245,158,11,0.2)", fontWeight: "600" }}>
                {filtered.length} prices · {Object.keys(grouped).length} commodities
              </span>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <input
                placeholder="Search commodity or market…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: "8px", padding: "8px 14px",
                  color: "var(--text)", fontSize: "13px", outline: "none", width: "220px",
                }}
              />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: "8px", padding: "8px 12px",
                  color: "var(--text)", fontSize: "13px", cursor: "pointer", outline: "none",
                }}
              >
                <option value="commodity">Sort: A–Z</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="latest">Latest first</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card fade-up" style={{ textAlign: "center", padding: "60px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
              <h3 style={{ color: "var(--text)", marginBottom: "8px" }}>No prices found</h3>
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>
                {search ? `No results for "${search}" in ${selectedDistrict}.` : `No approved prices yet for ${selectedDistrict}.`}
              </p>
            </div>
          ) : (
            <>
              {/* Commodity summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px", marginBottom: "28px" }}>
                {Object.entries(grouped).map(([commodity, items], i) => (
                  <div
                    key={commodity}
                    className={`card fade-up fade-up-${Math.min(i + 1, 4)}`}
                    style={{ padding: "18px 20px", cursor: "default" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                      <span style={{ fontSize: "26px" }}>{getIcon(commodity)}</span>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)", lineHeight: 1.2 }}>{commodity}</p>
                    </div>
                    <p style={{ fontSize: "28px", fontFamily: "'DM Serif Display', serif", color: "var(--accent)", lineHeight: 1, marginBottom: "4px" }}>
                      ₹{avgPrice(items)}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "10px" }}>avg / kg · {items.length} market{items.length > 1 ? "s" : ""}</p>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: "99px" }}>
                        Low ₹{minPrice(items)}
                      </span>
                      <span style={{ fontSize: "11px", color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: "99px" }}>
                        High ₹{maxPrice(items)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Full price table */}
              <div className="card fade-up" style={{ padding: "0", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text)" }}>
                    All Market Listings — {selectedDistrict}
                  </h3>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Commodity</th>
                      <th>Market Name</th>
                      <th>District</th>
                      <th>Price / kg</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ width: "32px", height: "32px", background: "var(--surface2)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                              {getIcon(item.commodity)}
                            </span>
                            <span style={{ fontWeight: "500", color: "var(--text)" }}>{item.commodity}</span>
                          </div>
                        </td>
                        <td style={{ color: "var(--muted)" }}>{item.marketName}</td>
                        <td style={{ color: "var(--muted)" }}>{item.district}</td>
                        <td>
                          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px", color: "#f59e0b" }}>₹{item.price}</span>
                          <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "4px" }}>/kg</span>
                        </td>
                        <td style={{ fontSize: "12px", color: "var(--muted)" }}>
                          {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </Layout>
  );
}

export default MarketPrices;
