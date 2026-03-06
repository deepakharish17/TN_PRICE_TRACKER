import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useSettings } from "../hooks/useSettings";

const COMMODITY_ICONS = {"Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚","Rice (Boiled)":"🍚","Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘","Moong Dal":"🫘","Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛","Eggs (dozen)":"🥚","Banana":"🍌","Brinjal":"🍆","Carrot":"🥕"};
const getIcon = c => COMMODITY_ICONS[c] || "🌿";

const STORAGE_KEY = "tn_bookmarks"; // { commodity, district }[]

function Bookmarks() {
  const { commodities, districts } = useSettings();
  const [bookmarks, setBookmarks]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [prices, setPrices]   = useState({});
  const [loading, setLoading] = useState(false);
  const [addForm, setAddForm] = useState({ commodity:"", district:"" });
  const [showAdd, setShowAdd] = useState(false);

  const save = (bms) => { setBookmarks(bms); localStorage.setItem(STORAGE_KEY, JSON.stringify(bms)); };

  const addBookmark = () => {
    if (!addForm.commodity || !addForm.district) return;
    const already = bookmarks.find(b=>b.commodity===addForm.commodity && b.district===addForm.district);
    if (already) return;
    save([...bookmarks, addForm]);
    setAddForm({ commodity:"", district:"" });
    setShowAdd(false);
  };

  const removeBookmark = (commodity, district) => {
    save(bookmarks.filter(b => !(b.commodity===commodity && b.district===district)));
  };

  // Fetch latest price for each bookmark
  useEffect(() => {
    if (bookmarks.length === 0) return;
    setLoading(true);
    const distinctDistricts = [...new Set(bookmarks.map(b=>b.district))];
    Promise.all(
      distinctDistricts.map(d => api.get(`/price/district/${d}`).then(r=>({ district:d, data:r.data })).catch(()=>({ district:d, data:[] })))
    ).then(results => {
      const map = {};
      results.forEach(({district, data}) => {
        data.forEach(p => {
          const key = `${p.commodity}__${district}`;
          if (!map[key]) map[key] = [];
          map[key].push(p.price);
        });
      });
      const avgMap = {};
      Object.entries(map).forEach(([key, arr]) => {
        avgMap[key] = Math.round(arr.reduce((s,v)=>s+v,0)/arr.length * 10)/10;
      });
      setPrices(avgMap);
    }).finally(()=>setLoading(false));
  }, [bookmarks.length]);

  const getPrice = (commodity, district) => prices[`${commodity}__${district}`];

  return (
    <Layout>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"32px" }} className="fade-up">
        <div>
          <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>Watchlist</p>
          <h1 style={{ fontSize:"36px", color:"var(--text)", marginBottom:"6px" }}>Bookmarks</h1>
          <p style={{ color:"var(--muted)", fontSize:"15px" }}>Track your favourite commodity prices across districts</p>
        </div>
        <button className="btn" onClick={()=>setShowAdd(!showAdd)}>
          {showAdd ? "✕ Cancel" : "＋ Add Bookmark"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card fade-up" style={{ marginBottom:"24px", borderTop:"2px solid var(--accent)" }}>
          <h3 style={{ fontSize:"15px", color:"var(--text)", marginBottom:"16px" }}>Add New Bookmark</h3>
          <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
            <select className="input" value={addForm.commodity} style={{ flex:1, minWidth:"180px", marginTop:0, cursor:"pointer" }}
              onChange={e=>setAddForm({...addForm,commodity:e.target.value})}>
              <option value="">Select commodity…</option>
              {commodities.map(c=><option key={c} value={c}>{getIcon(c)} {c}</option>)}
            </select>
            <select className="input" value={addForm.district} style={{ flex:1, minWidth:"180px", marginTop:0, cursor:"pointer" }}
              onChange={e=>setAddForm({...addForm,district:e.target.value})}>
              <option value="">Select district…</option>
              {districts.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
            <button className="btn" onClick={addBookmark} disabled={!addForm.commodity||!addForm.district}>
              ⭐ Bookmark
            </button>
          </div>
        </div>
      )}

      {bookmarks.length === 0 ? (
        <div className="card fade-up" style={{ textAlign:"center", padding:"60px" }}>
          <div style={{ fontSize:"48px", marginBottom:"16px" }}>⭐</div>
          <h3 style={{ color:"var(--text)", marginBottom:"8px" }}>No bookmarks yet</h3>
          <p style={{ color:"var(--muted)", fontSize:"14px", marginBottom:"20px" }}>Bookmark your favourite commodity–district pairs to track prices here</p>
          <button className="btn" onClick={()=>setShowAdd(true)}>＋ Add your first bookmark</button>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"16px" }}>
          {bookmarks.map(({commodity,district}) => {
            const price = getPrice(commodity, district);
            return (
              <div key={`${commodity}__${district}`} className="card fade-up" style={{ position:"relative" }}>
                {/* Remove button */}
                <button onClick={()=>removeBookmark(commodity,district)} style={{
                  position:"absolute", top:"12px", right:"12px",
                  background:"transparent", border:"none", cursor:"pointer",
                  color:"var(--muted)", fontSize:"18px", lineHeight:1, padding:"2px 6px",
                  borderRadius:"6px",
                }}
                  onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                  onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"}
                >×</button>

                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"14px" }}>
                  <span style={{ fontSize:"30px" }}>{getIcon(commodity)}</span>
                  <div>
                    <p style={{ fontSize:"15px", fontWeight:"600", color:"var(--text)" }}>{commodity}</p>
                    <p style={{ fontSize:"12px", color:"var(--muted)" }}>📍 {district}</p>
                  </div>
                </div>

                {loading ? (
                  <p style={{ color:"var(--muted)", fontSize:"13px" }}>Loading price…</p>
                ) : price ? (
                  <>
                    <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"36px", color:"var(--accent)", lineHeight:1, marginBottom:"4px" }}>₹{price}</p>
                    <p style={{ fontSize:"12px", color:"var(--muted)" }}>avg / kg · latest data</p>
                  </>
                ) : (
                  <p style={{ color:"var(--muted)", fontSize:"13px", fontStyle:"italic" }}>No price data yet</p>
                )}

                <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:"1px solid var(--border)" }}>
                  <span style={{ fontSize:"11px", color:"var(--accent)", fontWeight:"600" }}>⭐ Bookmarked</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

export default Bookmarks;
