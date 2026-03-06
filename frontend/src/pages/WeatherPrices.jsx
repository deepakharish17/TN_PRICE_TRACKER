import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useSettings } from "../hooks/useSettings";

// Tamil Nadu district coordinates
const DISTRICT_COORDS = {
  "Chennai":          { lat:13.0827, lon:80.2707 },
  "Coimbatore":       { lat:11.0168, lon:76.9558 },
  "Madurai":          { lat:9.9252,  lon:78.1198 },
  "Tiruchirappalli":  { lat:10.7905, lon:78.7047 },
  "Salem":            { lat:11.6643, lon:78.1460 },
  "Tirunelveli":      { lat:8.7139,  lon:77.7567 },
  "Vellore":          { lat:12.9165, lon:79.1325 },
  "Erode":            { lat:11.3410, lon:77.7172 },
  "Thoothukudi":      { lat:8.7642,  lon:78.1348 },
  "Dindigul":         { lat:10.3624, lon:77.9695 },
  "Thanjavur":        { lat:10.7870, lon:79.1378 },
  "Namakkal":         { lat:11.2342, lon:78.1673 },
  "Kancheepuram":     { lat:12.8185, lon:79.6947 },
  "Tiruppur":         { lat:11.1085, lon:77.3411 },
  "Krishnagiri":      { lat:12.5186, lon:78.2137 },
  "Dharmapuri":       { lat:12.1278, lon:78.1580 },
  "Villupuram":       { lat:11.9401, lon:79.4861 },
  "Ramanathapuram":   { lat:9.3762,  lon:78.8304 },
  "Tiruvannamalai":   { lat:12.2253, lon:79.0747 },
  "Cuddalore":        { lat:11.7447, lon:79.7689 },
  "Nagapattinam":     { lat:10.7672, lon:79.8449 },
  "The Nilgiris":     { lat:11.4916, lon:76.7337 },
  "Tirupathur":       { lat:12.4963, lon:78.5693 },
};

// Impact model: how weather affects crop prices
const getWeatherImpact = (weather) => {
  if (!weather) return [];
  const impacts = [];
  const temp = weather.main?.temp || 25;
  const humidity = weather.main?.humidity || 60;
  const desc = (weather.weather?.[0]?.description || "").toLowerCase();
  const isRaining = desc.includes("rain") || desc.includes("drizzle");
  const isHot = temp > 35;
  const isCold = temp < 15;
  const isHumid = humidity > 80;

  if (isRaining)  impacts.push({ commodity:"Tomato",   icon:"🍅", effect:"↑", reason:"Rain damages crop, supply may drop",   color:"#ef4444" });
  if (isRaining)  impacts.push({ commodity:"Onion",    icon:"🧅", effect:"↑", reason:"Wet harvest delays, price may rise",   color:"#ef4444" });
  if (isHot)      impacts.push({ commodity:"Milk",     icon:"🥛", effect:"↑", reason:"High heat reduces yield",             color:"#ef4444" });
  if (isHot)      impacts.push({ commodity:"Banana",   icon:"🍌", effect:"↓", reason:"Good ripening weather, supply up",    color:"#10b981" });
  if (isCold)     impacts.push({ commodity:"Rice (Raw)",icon:"🍚",effect:"↓", reason:"Cold boosts grain quality, prices stable", color:"#6366f1" });
  if (isHumid)    impacts.push({ commodity:"Wheat",    icon:"🌾", effect:"↑", reason:"High humidity risks mould in storage", color:"#f59e0b" });
  if (!isRaining) impacts.push({ commodity:"Carrot",   icon:"🥕", effect:"↓", reason:"Dry weather ideal for root crops",    color:"#10b981" });
  if (isHot && !isRaining) impacts.push({ commodity:"Groundnut Oil", icon:"🫒", effect:"↓", reason:"Sunny weather good for groundnut harvest", color:"#10b981" });

  return impacts.slice(0, 6);
};

const WX_ICONS = {
  "clear sky":"☀️", "few clouds":"⛅", "scattered clouds":"🌤️",
  "broken clouds":"☁️", "overcast clouds":"☁️", "light rain":"🌦️",
  "moderate rain":"🌧️", "heavy intensity rain":"⛈️", "thunderstorm":"⛈️",
  "mist":"🌫️", "haze":"🌫️", "smoke":"🌫️",
};
const wxIcon = (desc) => WX_ICONS[desc] || "🌡️";

function WeatherPrices() {
  const { districts } = useSettings();
  const [district, setDistrict] = useState("Chennai");
  const [weather, setWeather]   = useState(null);
  const [prices, setPrices]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [wxError, setWxError]   = useState("");

  useEffect(() => { fetchAll(district); }, [district]);

  const fetchAll = async (d) => {
    setLoading(true); setWxError("");
    const coords = DISTRICT_COORDS[d];
    try {
      // Fetch weather from open-meteo (free, no key needed)
      const wxUrl = coords
        ? `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&hourly=relativehumidity_2m&timezone=Asia/Kolkata`
        : null;

      const [wxRes, priceRes] = await Promise.all([
        wxUrl ? fetch(wxUrl).then(r=>r.json()).catch(()=>null) : Promise.resolve(null),
        api.get(`/price/district/${d}`).catch(()=>({data:[]})),
      ]);

      // Normalise open-meteo response into a weather-like shape
      if (wxRes?.current_weather) {
        const cw = wxRes.current_weather;
        const humidity = wxRes.hourly?.relativehumidity_2m?.[0] || 65;
        const wmoMap = { 0:"clear sky",1:"few clouds",2:"scattered clouds",3:"overcast clouds",61:"light rain",63:"moderate rain",65:"heavy intensity rain",80:"light rain",95:"thunderstorm",45:"mist" };
        const desc = wmoMap[cw.weathercode] || "clear sky";
        setWeather({
          main: { temp: cw.temperature, feels_like: cw.temperature-2, humidity },
          weather: [{ description: desc }],
          wind: { speed: (cw.windspeed/3.6).toFixed(1) },
          name: d,
        });
      } else {
        setWxError("Weather data unavailable for this district");
      }

      setPrices(priceRes.data || []);
    } catch { setWxError("Could not load weather data"); }
    finally { setLoading(false); }
  };

  const impacts = getWeatherImpact(weather);
  const temp    = weather?.main?.temp;
  const humidity = weather?.main?.humidity;
  const desc    = weather?.weather?.[0]?.description || "";

  // Commodity avg prices for this district
  const commodityMap = {};
  prices.forEach(p => {
    if (!commodityMap[p.commodity]) commodityMap[p.commodity] = [];
    commodityMap[p.commodity].push(p.price);
  });
  const avgPrices = Object.entries(commodityMap).map(([c,arr]) => ({
    commodity: c,
    avg: Math.round(arr.reduce((s,v)=>s+v,0)/arr.length * 10)/10,
  })).sort((a,b)=>b.avg-a.avg);

  return (
    <Layout>
      <div style={{ marginBottom:"32px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>Weather Impact</p>
        <h1 style={{ fontSize:"36px", color:"var(--text)", marginBottom:"6px" }}>🌦️ Weather & Prices</h1>
        <p style={{ color:"var(--muted)", fontSize:"15px" }}>See how today's weather may affect commodity prices in your district</p>
      </div>

      {/* District selector */}
      <div className="card fade-up fade-up-1" style={{ marginBottom:"24px", padding:"16px 20px" }}>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          {districts.map(d => (
            <button key={d} onClick={()=>setDistrict(d)} style={{
              padding:"6px 14px", borderRadius:"99px", cursor:"pointer",
              border:`1px solid ${district===d?"var(--accent)":"var(--border)"}`,
              background: district===d ? "rgba(245,158,11,0.12)" : "transparent",
              color: district===d ? "var(--accent)" : "var(--muted)",
              fontSize:"12px", fontWeight: district===d?"600":"400",
              transition:"all 0.15s",
            }}>{d}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"80px", color:"var(--muted)", fontSize:"16px" }}>🌤️ Loading weather…</div>
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px", marginBottom:"24px" }}>
            {/* Weather card */}
            <div className="card fade-up fade-up-1" style={{ background:"linear-gradient(135deg,var(--surface),var(--surface2))" }}>
              {wxError ? (
                <div style={{ textAlign:"center", padding:"20px", color:"var(--muted)" }}>
                  <p style={{ fontSize:"32px", marginBottom:"8px" }}>🌡️</p>
                  <p>{wxError}</p>
                </div>
              ) : weather ? (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
                    <div>
                      <p style={{ fontSize:"13px", color:"var(--muted)", marginBottom:"4px" }}>📍 {district}, Tamil Nadu</p>
                      <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"64px", color:"var(--text)", lineHeight:1 }}>{Math.round(temp)}°</p>
                      <p style={{ fontSize:"15px", color:"var(--muted)", marginTop:"4px", textTransform:"capitalize" }}>{desc}</p>
                    </div>
                    <div style={{ fontSize:"72px" }}>{wxIcon(desc)}</div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px" }}>
                    {[
                      { label:"Feels like", value:`${Math.round(weather.main?.feels_like||temp)}°C` },
                      { label:"Humidity",   value:`${humidity}%` },
                      { label:"Wind",       value:`${weather.wind?.speed} m/s` },
                    ].map(({label,value})=>(
                      <div key={label} style={{ textAlign:"center", padding:"10px", background:"rgba(255,255,255,0.03)", borderRadius:"10px" }}>
                        <p style={{ fontSize:"11px", color:"var(--muted)", marginBottom:"4px" }}>{label}</p>
                        <p style={{ fontSize:"16px", fontWeight:"600", color:"var(--text)" }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Price impact widget */}
            <div className="card fade-up fade-up-2">
              <h3 style={{ fontSize:"16px", color:"var(--text)", marginBottom:"4px" }}>🌾 Predicted Price Impact</h3>
              <p style={{ fontSize:"12px", color:"var(--muted)", marginBottom:"16px" }}>Based on today's weather conditions in {district}</p>
              {impacts.length === 0 ? (
                <p style={{ color:"var(--muted)", fontSize:"14px" }}>Weather conditions look neutral for prices today.</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  {impacts.map(({commodity,icon,effect,reason,color}) => (
                    <div key={commodity} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 14px", borderRadius:"10px", background:`${color}08`, border:`1px solid ${color}25` }}>
                      <span style={{ fontSize:"22px" }}>{icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"2px" }}>
                          <span style={{ fontSize:"14px", fontWeight:"600", color:"var(--text)" }}>{commodity}</span>
                          <span style={{ fontSize:"13px", fontWeight:"700", color, background:`${color}15`, padding:"1px 8px", borderRadius:"99px" }}>{effect} Price</span>
                        </div>
                        <p style={{ fontSize:"12px", color:"var(--muted)" }}>{reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Current market prices for this district */}
          {avgPrices.length > 0 && (
            <div className="card fade-up fade-up-3" style={{ padding:0, overflow:"hidden" }}>
              <div style={{ padding:"16px 24px", borderBottom:"1px solid var(--border)" }}>
                <h3 style={{ fontSize:"16px", color:"var(--text)" }}>📊 Current Prices in {district}</h3>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"1px", background:"var(--border)" }}>
                {avgPrices.map(({commodity,avg}) => {
                  const impact = impacts.find(i=>i.commodity===commodity);
                  return (
                    <div key={commodity} style={{ padding:"16px", background:"var(--surface)", textAlign:"center" }}>
                      <p style={{ fontSize:"11px", color:"var(--muted)", marginBottom:"6px" }}>{commodity}</p>
                      <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"24px", color:"var(--accent)", lineHeight:1 }}>₹{avg}</p>
                      {impact && <p style={{ fontSize:"11px", marginTop:"4px", color:impact.color, fontWeight:"600" }}>{impact.effect} Expected</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

export default WeatherPrices;
