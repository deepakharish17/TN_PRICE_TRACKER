import { useState, useEffect } from "react";
import api from "../api/axios";

const DEFAULT_DISTRICTS = [
  "Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli",
  "Vellore","Erode","Thoothukudi","Dindigul","Thanjavur","Namakkal",
  "Kancheepuram","Tiruppur","Krishnagiri","Dharmapuri","Villupuram",
  "Ramanathapuram","Tiruvannamalai","Cuddalore","Nagapattinam","The Nilgiris",
];

const DEFAULT_COMMODITIES = [
  "Tomato","Onion","Potato","Rice (Raw)","Rice (Boiled)","Wheat",
  "Tur Dal","Chana Dal","Moong Dal","Groundnut Oil","Coconut Oil",
  "Milk","Eggs (dozen)","Banana","Brinjal","Carrot",
];

// Session-level cache so we don't refetch on every page navigation
let _cache = null;

export function useSettings() {
  const [districts,   setDistricts]   = useState(_cache?.districts   || DEFAULT_DISTRICTS);
  const [commodities, setCommodities] = useState(_cache?.commodities || DEFAULT_COMMODITIES);
  const [loading, setLoading] = useState(!_cache);

  const fetchSettings = () => {
    setLoading(true);
    api.get("/admin/settings")
      .then(res => {
        _cache = res.data;
        setDistricts(res.data.districts);
        setCommodities(res.data.commodities);
      })
      .catch(() => {
        const cd = localStorage.getItem("custom_districts");
        const cc = localStorage.getItem("custom_commodities");
        const d = cd ? JSON.parse(cd) : DEFAULT_DISTRICTS;
        const c = cc ? JSON.parse(cc) : DEFAULT_COMMODITIES;
        _cache = { districts: d, commodities: c };
        setDistricts(d);
        setCommodities(c);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (_cache) {
      setDistricts(_cache.districts);
      setCommodities(_cache.commodities);
      return;
    }
    fetchSettings();
  }, []);

  // Call after admin saves — busts cache and immediately re-fetches
  const invalidate = () => {
    _cache = null;
    fetchSettings();
  };

  return { districts, commodities, loading, invalidate };
}
