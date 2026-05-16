import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const REFRESH_MS = 30 * 60 * 1000;

const FALLBACK = {
  updatedAt: "2026-05-16",
  stats: { total: 11, confirmed: 8, probable: 2, deaths: 3, monitoring: "100+", countries: 23, esRisk: "ŽEMA" },
  alert: "Andes hantavirusas — MV Hondius (Nyderlandai). 11 atvejų iš 23 valstybių. 3 mirę. Ispanija: naujas atvejis 05-13. ES rizika: LABAI ŽEMA.",
  news: [
    { date:"2026-05-14", src:"CDC",  type:"update",    title:"JAV: dr. Kornfeld pirminis teigiamas → neigiamas",                body:"Pirmasis amerikiečių bioizoliaciniame skyriuje testuotas Dr. Kornfeld pasitvirtino NEIGIAMU. Perkeltas į karantino skyrių. Kanzasas: 3 ne-keleiviai su aukštos rizikos kontaktu hospitalizuoti." },
    { date:"2026-05-13", src:"WHO",  type:"confirmed", title:"DON601: Ispanija — naujas patvirtintas atvejis (besimptomis)",      body:"Ispanų keleivis patvirtintas atvykus po repatriacijos. Besimptomis. Gydomas Gómez Ulla karo ligoninėje, Madride. Iš viso 8 patvirtinti atvejai." },
    { date:"2026-05-12", src:"ECDC", type:"confirmed", title:"Prancūzija: keleivė ECMO reanimacijoje",                           body:"Keleivė išvystė simptomus skrendant iš Tenerifės 05-10. Sunkiausios formos HCPS. Ekstrakorporinė membraninė oksigenacija (ECMO). 22 kontaktų atvejai identifikuoti ir sekami." },
    { date:"2026-05-11", src:"ECDC", type:"update",    title:"Visi MV Hondius keleiviai repatrijuoti — 7 skrydžiai",             body:"94 keleiviai repatrijuoti per 7 evakuacijos skrydžius iš Tenerifės į 6 Europos šalis ir Kanadą. Filipinų įgulos nariai (38) karantinas Nyderlanduose 42 dienas." },
    { date:"2026-05-10", src:"ECDC", type:"update",    title:"MV Hondius atvyksta į Tenerifę (Granadilla uostas)",               body:"Laivas atvyko 05:30. Ispanija koordinuoja repatriaciją. ES civilinės saugos mechanizmas aktyvuotas. Ispanų gynybos ministras: 'precedento neturintis planas'." },
    { date:"2026-05-06", src:"ECDC", type:"confirmed", title:"Patvirtintas Andes hantavirusas (ANDV) — Šveicarija pirmoji seka", body:"Šveicarijos UH Ciuriche patvirtino ANDV. Paskelbta genomės sekvencija: ANDV/Switzerland/Hu-3337/2026. Nextstrain medžiai sukurti 05-08." },
    { date:"2026-05-04", src:"WHO",  type:"confirmed", title:"WHO DON599: pirmasis oficialus protrūkio pranešimas",               body:"PSO paskelbė protrūkio pranešimą. 7 atvejai tuo metu. Pabrėžiama kad Andes virusas — vienintelis tarp žmonių plintantis hantavirusas." },
    { date:"2026-04-26", src:"NICD", type:"confirmed", title:"Pietų Afrika: NICD identifikuoja Andes virusą",                    body:"Johanesburgo NICD laboratorija pirmoji patvirtino ANDV 05-02. Britų turistė mirė 04-26. Jos vyras mirė laive 04-11 — abu tarp pirmųjų aukų." },
  ],
  cases: [
    { flag:"🇳🇱", country:"Nyderlandai",        lat:52.09, lng:5.12,   status:"confirmed",  detail:"8 keleiviai + 5 įgulos. 2 mirę laive. Leideno UH: hospitalizuoti. 12 medikų karantinas.",                               tags:["✓ patvirtinti","† 2 mirę","12 medikų"] },
    { flag:"🇫🇷", country:"Prancūzija",          lat:48.85, lng:2.35,  status:"confirmed",  detail:"1 patvirtinta – ECMO reanimacijoje. 4 kiti neigiami. 22 kontaktų atvejai.",                                              tags:["✓ patvirtintas","🔴 ECMO","22 kontaktai"] },
    { flag:"🇪🇸", country:"Ispanija",            lat:40.42, lng:-3.70, status:"confirmed",  detail:"Naujas 05-13. Besimptomis. Gómez Ulla karo ligoninė, Madridas.",                                                         tags:["✓ NAUJAS 05-13","Besimptomis"] },
    { flag:"🇨🇭", country:"Šveicarija",          lat:47.37, lng:8.54,  status:"confirmed",  detail:"Hospitalizuotas Ciuriche. Sekvencija: ANDV/Switzerland/Hu-3337/2026.",                                                   tags:["✓ patvirtintas","Hospitalizuotas"] },
    { flag:"🇬🇧", country:"Jungtinė Karalystė",  lat:51.51, lng:-0.13, status:"confirmed",  detail:"2 patvirtinti. Kita mirė Johanesburge 04-26 (KLM KL592). UKHSA seksė 30 Šv. Elenos keleivių.",                          tags:["✓ 2 patvirtinti","† 1 mirtis"] },
    { flag:"🇩🇪", country:"Vokietija",           lat:51.23, lng:6.78,  status:"probable",   detail:"Vokietė mirė laive 05-02 (ANDV post-mortem). Kitas evakuotas – pirminis + → neigiamas.",                                tags:["~ tikėtinas","† 1 mirtis"] },
    { flag:"🇿🇦", country:"Pietų Afrika",        lat:-26.20,lng:28.05, status:"confirmed",  detail:"NICD patvirtino ANDV 05-02. Britė mirė 04-26.",                                                                          tags:["✓ patvirtintas","† 1 mirtis"] },
    { flag:"🇺🇸", country:"JAV (Nebraska)",      lat:41.25, lng:-95.93,status:"monitoring", detail:"16 Nebraska Medical Center. Dr. Kornfeld: pirminis + → neigiamas 05-14. CDC: 100+ darbuotojų.",                          tags:["16 Nebraska","CDC lygis 3"] },
    { flag:"🇺🇸", country:"JAV (Kanzasas)",      lat:39.09, lng:-94.58,status:"monitoring", detail:"3 ne-keleiviai su aukštos rizikos kontaktu hospitalizuoti stebėjimui.",                                                  tags:["3 hospitalizuoti","Aukšta rizika"] },
    { flag:"🇨🇦", country:"Kanada",              lat:43.65, lng:-79.38,status:"monitoring", detail:"Stebimi Ontarijuje ir Kvebeke po repatriacijos.",                                                                         tags:["Stebimi"] },
    { flag:"🇸🇬", country:"Singapūras",          lat:1.35,  lng:103.82,status:"safe",       detail:"Abu neigiami 05-08. Išleisti iš NCID.",                                                                                   tags:["✓ abu neigiami","Išleisti"] },
    { flag:"🇱🇹", country:"Lietuva",             lat:54.69, lng:25.28, status:"safe",       detail:"Nėra atvejų. NVSC stebi. Puumala virusas – sezoninis aktyvumas.",                                                        tags:["✓ nėra atvejų","NVSC stebi"] },
  ],
  timeline: [
    {d:"04-01",t:"Išplaukia iš Ushuaia",n:false},
    {d:"04-11",t:"1-oji mirtis laive (NL)",n:false},
    {d:"04-24",t:"30 keleivių išlipa Šv. Elenoje",n:false},
    {d:"04-26",t:"2-oji mirtis, Johanesburgas",n:false},
    {d:"05-02",t:"3-ioji mirtis, PSO pranešimas",n:false},
    {d:"05-06",t:"ANDV patvirtinimas",n:false},
    {d:"05-10",t:"Atvyksta į Tenerifę",n:false},
    {d:"05-11",t:"Visi keleiviai repatrijuoti",n:false},
    {d:"05-13",t:"Ispanija: naujas patvirtintas",n:true},
    {d:"05-14",t:"JAV: pirminis + → neigiamas",n:true},
  ]
};

const SC = { confirmed:"#c0392b", probable:"#d97706", monitoring:"#2563eb", safe:"#059669" };
const SL = { confirmed:"Patvirtintas", probable:"Tikėtinas", monitoring:"Stebimas", safe:"Saugus" };

const SYS_PROMPT = `Tu esi hantaviruso protrūkio stebėsenos sistema. Tavo užduotis: surinkti naujausią informaciją internete ir grąžinti tiktai JSON.

Ieškoki naujausių naujienų apie: "MV Hondius hantavirus 2026", "ECDC hantavirus update", "hantavirus cruise ship latest".

Grąžink TIKTAI gryną JSON objektą (be markdown, be kodo blokų, be komentarų):
{
  "updatedAt": "2026-05-16",
  "stats": {"total":11,"confirmed":8,"probable":2,"deaths":3,"monitoring":"100+","countries":23,"esRisk":"ŽEMA"},
  "alert": "Trumpas įspėjimas 1-2 sakiniai apie naujausią situaciją.",
  "news": [
    {"date":"2026-05-16","src":"ECDC","type":"confirmed","title":"Antraštė lietuviškai","body":"Aprašymas 1-2 sakiniai lietuviškai."}
  ],
  "cases": [
    {"flag":"🇳🇱","country":"Nyderlandai","lat":52.09,"lng":5.12,"status":"confirmed","detail":"Aprašymas.","tags":["✓ patvirtinti"]}
  ],
  "timeline": [
    {"d":"04-01","t":"Įvykis","n":false}
  ]
}
Pateik 8-12 naujienų, naujausios pirmos. Atnaujink skaičius jei randi naujesnių duomenų. Tiktai JSON.`;

// ─── TAG HELPER ───────────────────────────────────────────────────────────────
function tagColor(t) {
  if (t.includes("†"))    return { bg:"#f5f3ff", color:"#7c3aed", border:"#ddd6fe" };
  if (t.includes("ECMO") || t.includes("lygis")) return { bg:"#fef2f2", color:"#c0392b", border:"#fecaca" };
  if (t.includes("✓") && !t.includes("nėra") && !t.includes("neigiami")) return { bg:"#fef2f2", color:"#c0392b", border:"#fecaca" };
  if (t.includes("✓") || t.includes("neigiami") || t.includes("Išleisti") || t.includes("nėra")) return { bg:"#f0fdf4", color:"#059669", border:"#bbf7d0" };
  if (t.includes("NAUJAS")) return { bg:"#fef2f2", color:"#c0392b", border:"#fecaca" };
  return { bg:"#eff6ff", color:"#2563eb", border:"#bfdbfe" };
}

function srcColor(src) {
  const s = (src||"").toUpperCase();
  if (s.includes("ECDC") || s.includes("NVSC")) return { bg:"#f0fdf4", color:"#059669", border:"#bbf7d0" };
  if (s.includes("WHO"))  return { bg:"#eff6ff", color:"#2563eb", border:"#bfdbfe" };
  if (s.includes("CDC"))  return { bg:"#fffbeb", color:"#d97706", border:"#fde68a" };
  return { bg:"#f5f3ff", color:"#7c3aed", border:"#ddd6fe" };
}

// ─── MAP COMPONENT (injects Leaflet via script tag) ───────────────────────────
function LiveMap({ cases, selCase, onSelect }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);
  const routeRef = useRef(null);
  const initRef = useRef(false);

  // Inject Leaflet CSS + JS once
  useEffect(() => {
    if (document.getElementById("leaflet-css")) return;
    const css = document.createElement("link");
    css.id = "leaflet-css";
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);

    const js = document.createElement("script");
    js.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    js.onload = () => initMap();
    document.head.appendChild(js);
  }, []);

  function initMap() {
    if (initRef.current || !mapRef.current) return;
    initRef.current = true;

    const L = window.L;
    const m = L.map(mapRef.current, { zoomControl: false }).setView([25, 5], 2);
    leafletRef.current = m;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO", subdomains: "abcd", maxZoom: 19
    }).addTo(m);

    L.control.zoom({ position: "topright" }).addTo(m);

    // Ship route
    routeRef.current = L.polyline(
      [[-54.80,-68.30],[-45,-55],[-15.97,-5.70],[-7.93,-14.41],[14.93,-23.51],[28.08,-16.73]],
      { color:"#64748b", weight:2, dashArray:"6 9", opacity:.65 }
    ).addTo(m);

    // Ship marker
    const shipIcon = L.divIcon({ html:'<div style="font-size:22px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">🚢</div>', iconSize:[28,28], iconAnchor:[14,14], className:"" });
    L.marker([28.08,-16.73], { icon: shipIcon }).addTo(m)
      .bindPopup("<strong>MV Hondius</strong><br>Tenerifė → Nyderlandai<br>Planuojamas atvykimas: 05-17/18");

    // Origin
    const originIcon = L.divIcon({ html:'<div style="width:14px;height:14px;background:#7c3aed;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>', iconSize:[14,14], iconAnchor:[7,7], className:"" });
    L.marker([-54.80,-68.30], { icon: originIcon }).addTo(m)
      .bindPopup("<strong>Ushuaia, Argentina</strong><br>Išplaukimo uostas (04-01)<br>Pirminė apsikrėtimo vieta");

    // St Helena
    const shIcon = L.divIcon({ html:'<div style="width:11px;height:11px;background:#d97706;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>', iconSize:[11,11], iconAnchor:[5.5,5.5], className:"" });
    L.marker([-15.97,-5.70], { icon: shIcon }).addTo(m)
      .bindPopup("<strong>Šventosios Elenos sala</strong><br>30 keleivių išlipo 04-24");

    addCaseMarkers(cases);
  }

  function addCaseMarkers(caseList) {
    if (!leafletRef.current || !window.L) return;
    const L = window.L;
    const m = leafletRef.current;

    markersRef.current.forEach(mk => m.removeLayer(mk));
    markersRef.current = [];

    caseList.forEach(c => {
      if (c.lat == null) return;
      const r = c.count > 10 ? 16 : c.count > 3 ? 13 : 10;
      const mk = L.circleMarker([c.lat, c.lng], {
        radius: r, fillColor: SC[c.status] || "#64748b",
        color: "#fff", weight: 1.5, fillOpacity: .88
      }).addTo(m);
      mk.bindPopup(
        `<strong>${c.flag} ${c.country}</strong><br><em style="color:${SC[c.status]};font-size:11px">${SL[c.status]||""}</em><br><span style="font-size:11px;color:#64748b">${c.detail||""}</span>`,
        { maxWidth: 230 }
      );
      mk.on("click", () => onSelect(c));
      markersRef.current.push(mk);
    });
  }

  // Update markers when cases change
  useEffect(() => {
    if (window.L && leafletRef.current) addCaseMarkers(cases);
  }, [cases]);

  // Fly to selected case
  useEffect(() => {
    if (selCase && leafletRef.current && selCase.lat != null) {
      leafletRef.current.flyTo([selCase.lat, selCase.lng], 5, { duration: 1.1 });
    }
  }, [selCase]);

  return (
    <div ref={mapRef} style={{ width:"100%", height:"100%" }} />
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 768);
  const [mobTab, setMobTab]       = useState("map");
  const [sideTab, setSideTab]     = useState("news");
  const [time, setTime]           = useState("");
  const [data, setData]           = useState(FALLBACK);
  const [autoStatus, setAutoStatus] = useState({ state:"idle", msg:"Palaukite..." });
  const [countdown, setCountdown] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selCase, setSelCase]     = useState(null);
  const [prevNews, setPrevNews]   = useState([]);
  const nextRefAt = useRef(Date.now() + REFRESH_MS);
  const refreshTimer = useRef(null);
  const aiEndRef = useRef(null);

  // Responsive
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // Clock
  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toISOString().split("T")[1].split(".")[0] + " UTC");
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Countdown
  useEffect(() => {
    const t = setInterval(() => {
      const rem = Math.max(0, nextRefAt.current - Date.now());
      const m = Math.floor(rem / 60000), s = Math.floor((rem % 60000) / 1000);
      setCountdown(`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Refresh function
  const doRefresh = useCallback(async (isAuto = false) => {
    if (isLoading) return;
    setIsLoading(true);
    setAutoStatus({ state:"loading", msg: isAuto ? "Automatinis atnaujinimas..." : "Kraunama..." });

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: SYS_PROMPT }]
        })
      });

      const raw = await resp.json();
      let jsonStr = "";

      if (raw.content) {
        for (const block of raw.content) {
          if (block.type === "text" && block.text) {
            const t = block.text.trim();
            const s = t.indexOf("{"), e = t.lastIndexOf("}");
            if (s !== -1 && e > s) { jsonStr = t.slice(s, e + 1); break; }
          }
        }
      }

      if (!jsonStr) throw new Error("Negautas JSON");

      const parsed = JSON.parse(jsonStr);
      setPrevNews(data.news || []);
      setData(parsed);

      const ts = new Date().toLocaleString("lt-LT");
      setAutoStatus({ state:"ok", msg:`Atnaujinta: ${ts}` });

    } catch (err) {
      setAutoStatus({ state:"error", msg:`Klaida: ${err.message}` });
    }

    setIsLoading(false);
    nextRefAt.current = Date.now() + REFRESH_MS;
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => doRefresh(true), REFRESH_MS);
  }, [isLoading, data]);

  // Initial load
  useEffect(() => {
    doRefresh(false);
    return () => clearTimeout(refreshTimer.current);
  }, []);

  // ── SHARED COMPONENTS ──────────────────────────────────────────────────────

  const StatBar = () => (
    <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", display:"grid",
      gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(6,1fr)", flexShrink:0 }}>
      {[
        { lbl:"Iš viso",      val: data.stats?.total,      color:"#c0392b", sub:"Patvirtinti+tikėtini" },
        { lbl:"Patvirtinti",  val: data.stats?.confirmed,  color:"#c0392b", sub:"PCR/Antikūnai" },
        { lbl:"Mirčių",       val: data.stats?.deaths,     color:"#7c3aed", sub:"CFR ~27%" },
        { lbl:"Stebimi",      val: data.stats?.monitoring, color:"#d97706", sub:"Kontaktai" },
        { lbl:"Šalys",        val: data.stats?.countries,  color:"#2563eb", sub:"Pilietybės" },
        { lbl:"ES rizika",    val: data.stats?.esRisk,     color:"#059669", sub:"ECDC" },
      ].map((s, i) => (
        <div key={i} style={{ padding: isMobile ? "9px 8px" : "12px 16px", borderRight:"1px solid #f1f5f9",
          textAlign: isMobile ? "center" : "left" }}>
          <div style={{ fontFamily:"monospace", fontSize:8, textTransform:"uppercase", letterSpacing:".08em",
            color:"#94a3b8", marginBottom:3 }}>{s.lbl}</div>
          <div style={{ fontWeight:800, fontSize: isMobile ? 19 : 22, color:s.color, lineHeight:1,
            transition:"all .4s" }}>{s.val ?? "–"}</div>
          <div style={{ fontFamily:"monospace", fontSize:8, color:"#94a3b8", marginTop:2 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );

  const AutoBar = () => {
    const dotColor = autoStatus.state === "ok" ? "#059669" : autoStatus.state === "loading" ? "#d97706" : autoStatus.state === "error" ? "#c0392b" : "#64748b";
    return (
      <div style={{ background:"#0f172a", borderBottom:"1px solid #1e293b", padding:"6px 14px",
        display:"flex", alignItems:"center", gap:10, flexShrink:0, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontFamily:"monospace", fontSize:10 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:dotColor, flexShrink:0,
            animation: autoStatus.state === "loading" ? "pulse 0.8s infinite" : "none" }}/>
          <span style={{ color:"#94a3b8" }}><strong style={{ color:"#e2e8f0" }}>AI atnaujinimas:</strong> {autoStatus.msg}</span>
        </div>
        {!isMobile && (
          <div style={{ marginLeft:"auto", fontFamily:"monospace", fontSize:10, color:"#475569" }}>
            Sekantis: <span style={{ color:"#64748b" }}>{countdown}</span>
          </div>
        )}
        <button onClick={() => doRefresh(false)} disabled={isLoading}
          style={{ background:"#1e293b", border:"1px solid #334155", color:"#94a3b8",
            fontFamily:"monospace", fontSize:9, padding:"3px 9px", cursor:"pointer",
            borderRadius:2, opacity: isLoading ? .5 : 1, flexShrink:0 }}>
          {isLoading ? "⟳ Kraunama..." : "⟳ Atnaujinti dabar"}
        </button>
      </div>
    );
  };

  const AlertBar = () => (
    <div style={{ background:"#fef2f2", borderBottom:"1px solid #fecaca", padding:"7px 14px",
      fontSize:11, color:"#7f1d1d", lineHeight:1.4, flexShrink:0 }}>
      <strong style={{ color:"#c0392b" }}>⚠ AKTYVUS PROTRŪKIS:</strong> {data.alert}
    </div>
  );

  const NewsTab = () => {
    const prevTitles = new Set(prevNews.map(n => n.title));
    return (
      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ padding:"8px 13px", fontFamily:"monospace", fontSize:9, fontWeight:600,
          textTransform:"uppercase", letterSpacing:".08em", color:"#64748b", background:"#f8fafc",
          borderBottom:"1px solid #e2e8f0", display:"flex", justifyContent:"space-between",
          position:"sticky", top:0, zIndex:5 }}>
          Automatinės naujienos
          <span style={{ color:"#94a3b8" }}>{data.news?.length || 0} įrašai · {data.updatedAt}</span>
        </div>
        {(data.news || []).map((item, i) => {
          const isNew = prevTitles.size > 0 && !prevTitles.has(item.title);
          const sc = srcColor(item.src);
          const borderColor = item.type === "confirmed" ? "#c0392b" : item.type === "monitoring" ? "#d97706" : "#2563eb";
          return (
            <div key={i} style={{ padding:"11px 13px", borderBottom:"1px solid #f1f5f9",
              borderLeft:`3px solid ${borderColor}`, background: isNew ? "#f0fdf4" : "#fff",
              transition:"background .5s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <span style={{ fontFamily:"monospace", fontSize:9, color:"#94a3b8" }}>{item.date}</span>
                <span style={{ fontFamily:"monospace", fontSize:8, padding:"1px 5px", borderRadius:2,
                  background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, fontWeight:700 }}>{item.src}</span>
                {isNew && <span style={{ fontFamily:"monospace", fontSize:8, padding:"1px 5px", borderRadius:2,
                  background:"#f0fdf4", color:"#059669", border:"1px solid #bbf7d0", fontWeight:700 }}>NAUJA</span>}
              </div>
              <div style={{ fontWeight:600, fontSize:12, color:"#1e293b", marginBottom:3, lineHeight:1.3 }}>{item.title}</div>
              <div style={{ fontSize:11, color:"#64748b", lineHeight:1.5 }}>{item.body}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const CasesTab = () => (
    <div style={{ flex:1, overflowY:"auto" }}>
      <div style={{ padding:"8px 13px", fontFamily:"monospace", fontSize:9, fontWeight:600,
        textTransform:"uppercase", letterSpacing:".08em", color:"#64748b", background:"#f8fafc",
        borderBottom:"1px solid #e2e8f0", display:"flex", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:5 }}>
        Šalys ir atvejai
        <span style={{ color:"#94a3b8" }}>{data.updatedAt}</span>
      </div>
      {(data.cases || []).map((c, i) => (
        <div key={i} onClick={() => setSelCase(c)}
          style={{ padding:"11px 13px", borderBottom:"1px solid #f1f5f9", cursor:"pointer",
            borderLeft:`3px solid ${SC[c.status] || "#64748b"}`,
            background: selCase?.country === c.country ? "#f8fafc" : "#fff", transition:"background .12s" }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{c.flag} {c.country}</div>
          <div style={{ fontSize:11, color:"#64748b", lineHeight:1.5 }}>{c.detail}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginTop:5 }}>
            {(c.tags || []).map((t, j) => {
              const s = tagColor(t);
              return <span key={j} style={{ fontFamily:"monospace", fontSize:9, padding:"2px 5px",
                borderRadius:2, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>{t}</span>;
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const TimelineOverlay = () => (
    <div style={{ position:"absolute", bottom:10, right:10, zIndex:400,
      background:"rgba(255,255,255,.96)", border:"1px solid #e2e8f0",
      padding:"9px 11px", width:175, boxShadow:"0 2px 10px rgba(0,0,0,.1)", overflowY:"auto", maxHeight:260 }}>
      <div style={{ fontFamily:"monospace", fontSize:8, textTransform:"uppercase", letterSpacing:".1em",
        color:"#94a3b8", marginBottom:6, fontWeight:600 }}>Chronologija</div>
      {(data.timeline || []).map((e, i) => (
        <div key={i} style={{ display:"flex", gap:6, marginBottom:4 }}>
          <span style={{ fontFamily:"monospace", fontSize:8, color:"#c0392b", minWidth:36, fontWeight:600 }}>{e.d}</span>
          <span style={{ fontFamily:"monospace", fontSize:8, color: e.n ? "#059669" : "#64748b",
            lineHeight:1.4, fontWeight: e.n ? 700 : 400 }}>{e.t}</span>
        </div>
      ))}
    </div>
  );

  const InfoTab = () => (
    <div style={{ flex:1, overflowY:"auto" }}>
      {[
        { title:"🦠 Andes Hantavirusas (ANDV)", body:"Vienintelis iš 50+ hantaviruso rūšių, plintantis tarp žmonių. Paplitęs Argentinos ir Čilės Andų kalnuose. Sukelia Hantavirusinį kardiopulmoninį sindromą (HCPS). Nėra vakcinos ar specifinio gydymo." },
        { title:"🔴 Simptomai (inkubacija 1–8 sav.)", symptoms:["Karščiavimas","Galvos skausmas","Raumenų skausmai","Šaltkrėtis","Pykinimas","Pilvo skausmas","Kvėpavimo sunkumai ⚠","Kraujospūdžio kritimas ⚠"] },
        { title:"📊 Rizikos lygiai", risks:[{l:"ES/EEE bendr. gyv.",v:8,c:"#059669",t:"ŽEMA"},{l:"Laivo kontaktai",v:55,c:"#d97706",t:"VID."},{l:"Artimi kontaktai",v:78,c:"#c0392b",t:"AUK."},{l:"HCPS be gydymo",v:90,c:"#c0392b",t:"20-40%"}] },
        { title:"🛡️ Prevencija", body:"MV Hondius kontaktai: 45 dienų savisteba simptomams. Pietų Amerika: vengti graužikų kontakto, vėdinti uždarytas patalpas. Grįžus su simptomais – nedelsiant kreiptis į gydytoją ir informuoti apie kelionę." },
      ].map((b, i) => (
        <div key={i} style={{ padding:"13px 14px", borderBottom:"1px solid #f1f5f9" }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:7 }}>{b.title}</div>
          {b.body && <div style={{ fontSize:11, color:"#64748b", lineHeight:1.7 }}>{b.body}</div>}
          {b.symptoms && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, marginTop:7 }}>
              {b.symptoms.map((s, j) => (
                <div key={j} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", padding:"5px 8px",
                  fontFamily:"monospace", fontSize:9, color:"#64748b", display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:"#c0392b", flexShrink:0 }}/>{s}
                </div>
              ))}
            </div>
          )}
          {b.risks && (
            <div style={{ marginTop:8 }}>
              {b.risks.map((r, j) => (
                <div key={j} style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
                  <div style={{ fontFamily:"monospace", fontSize:9, color:"#64748b", width:110, flexShrink:0 }}>{r.l}</div>
                  <div style={{ flex:1, height:5, background:"#f1f5f9", borderRadius:3, margin:"0 7px" }}>
                    <div style={{ height:"100%", width:`${r.v}%`, background:r.c, borderRadius:3 }}/>
                  </div>
                  <div style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, color:r.c, minWidth:36, textAlign:"right" }}>{r.t}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const SourcesTab = () => (
    <div style={{ flex:1, overflowY:"auto" }}>
      <div style={{ padding:"8px 13px", background:"#f0fdf4", borderBottom:"1px solid #bbf7d0",
        fontFamily:"monospace", fontSize:9, color:"#166534", lineHeight:1.6 }}>
        Claude AI ieško naujienų <strong>kas 30 min.</strong> šiuose šaltiniuose automatiškai.
      </div>
      {[
        { badge:"ECDC", title:"Andes hantavirus outbreak – Surveillance & Updates", meta:"ecdc.europa.eu · Kasdien atnaujinama", url:"https://www.ecdc.europa.eu/en/infectious-disease-topics/hantavirus-infection/surveillance-and-updates/andes-hantavirus-outbreak" },
        { badge:"WHO",  title:"Disease Outbreak News DON601 – Multi-country cluster", meta:"who.int · Atnaujinta 2026-05-13", url:"https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON601" },
        { badge:"CDC",  title:"US CDC – Level 3 Hantavirus Response", meta:"cdc.gov · Nebraska, Atlanta, 11 valstijų", url:"https://www.cdc.gov/hantavirus" },
        { badge:"ABC",  title:"Hantavirus Live Updates – ABC News", meta:"abcnews.go.com · Gyvas atnaujinimas", url:"https://abcnews.go.com/International/live-updates/hantavirus-live-updates-mv-hondius-canary-islands/?id=132746955" },
        { badge:"WIKI", title:"MV Hondius hantavirus outbreak – Wikipedia", meta:"Chronologinis aprašas · Nuolat atnaujinamas", url:"https://en.wikipedia.org/wiki/MV_Hondius_hantavirus_outbreak" },
        { badge:"NVSC", title:"Nacionalinis visuomenės sveikatos centras – LT", meta:"nvsc.lrv.lt · Lietuvos šaltinis", url:"https://nvsc.lrv.lt" },
      ].map((s, i) => {
        const sc = srcColor(s.badge);
        return (
          <div key={i} style={{ padding:"10px 13px", borderBottom:"1px solid #f1f5f9", display:"flex", gap:9, alignItems:"flex-start" }}>
            <div style={{ fontFamily:"monospace", fontSize:8, padding:"2px 5px", borderRadius:2, flexShrink:0,
              fontWeight:700, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, marginTop:1, textTransform:"uppercase" }}>{s.badge}</div>
            <div>
              <div style={{ fontSize:11, color:"#1e293b", fontWeight:500, lineHeight:1.4, marginBottom:2 }}>{s.title}</div>
              <div style={{ fontFamily:"monospace", fontSize:9, color:"#94a3b8" }}>{s.meta}</div>
              <a href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:"monospace", fontSize:9, color:"#2563eb", textDecoration:"none", marginTop:1, display:"block" }}>
                → {s.url.replace("https://","").split("/")[0]}
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );

  const Sidebar = () => (
    <div style={{ display:"flex", flexDirection:"column", overflow:"hidden", background:"#fff",
      ...(isMobile ? { flex:1 } : { width:360, flexShrink:0, borderLeft:"1px solid #e2e8f0" }) }}>
      <div style={{ display:"flex", borderBottom:"1px solid #e2e8f0", background:"#f8fafc", flexShrink:0 }}>
        {[["news","🔴 Naujienos"],["cases","Atvejai"],["info","Info"],["sources","Šaltiniai"]].map(([id,lbl]) => (
          <button key={id} onClick={() => setSideTab(id)}
            style={{ flex:1, padding:"10px 4px", background: sideTab===id ? "#fff" : "none",
              border:"none", fontFamily:"monospace", fontSize: isMobile ? 8 : 9, fontWeight:600,
              textTransform:"uppercase", letterSpacing:".06em",
              color: sideTab===id ? "#1e293b" : "#94a3b8", cursor:"pointer",
              borderBottom:`2px solid ${sideTab===id ? "#c0392b" : "transparent"}`, transition:"all .15s" }}>
            {lbl}
          </button>
        ))}
      </div>
      {sideTab==="news"    && <NewsTab/>}
      {sideTab==="cases"   && <CasesTab/>}
      {sideTab==="info"    && <InfoTab/>}
      {sideTab==="sources" && <SourcesTab/>}
    </div>
  );

  const MapPanel = () => (
    <div style={{ position:"relative", flex:1, overflow:"hidden" }}>
      <LiveMap cases={data.cases || []} selCase={selCase} onSelect={c => { setSelCase(c); if(isMobile) setMobTab("map"); }} />

      {/* Header */}
      <div style={{ position:"absolute", top:10, left:10, zIndex:400,
        background:"rgba(255,255,255,.96)", border:"1px solid #e2e8f0", borderLeft:"3px solid #c0392b",
        padding:"8px 11px", boxShadow:"0 2px 10px rgba(0,0,0,.1)", maxWidth:"55%" }}>
        <div style={{ fontWeight:700, fontSize: isMobile ? 11 : 13, marginBottom:2 }}>🌍 MV Hondius protrūkis · 2026</div>
        <div style={{ fontFamily:"monospace", fontSize:8, color:"#64748b" }}>
          {isLoading ? "⟳ Atnaujinama..." : `Atnaujinta: ${data.updatedAt}`}
        </div>
      </div>

      {/* Case popup */}
      {selCase && (
        <div style={{ position:"absolute", top:10, right:10, zIndex:400,
          background:"#fff", border:`1px solid #e2e8f0`, borderLeft:`3px solid ${SC[selCase.status]||"#64748b"}`,
          padding:"10px 12px", maxWidth: isMobile ? 160 : 210, boxShadow:"0 4px 16px rgba(0,0,0,.12)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:6 }}>
            <div style={{ fontWeight:700, fontSize: isMobile ? 11 : 13 }}>{selCase.flag} {selCase.country}</div>
            <button onClick={() => setSelCase(null)}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:16, lineHeight:1, flexShrink:0 }}>×</button>
          </div>
          <div style={{ fontFamily:"monospace", fontSize:8, color:SC[selCase.status], fontWeight:700,
            marginTop:2, marginBottom:5, textTransform:"uppercase" }}>{SL[selCase.status]}</div>
          <div style={{ fontSize:10, color:"#64748b", lineHeight:1.5 }}>{selCase.detail}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginTop:6 }}>
            {(selCase.tags||[]).map((t,i) => {
              const s = tagColor(t);
              return <span key={i} style={{ fontFamily:"monospace", fontSize:8, padding:"2px 4px",
                borderRadius:2, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>{t}</span>;
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ position:"absolute", bottom:10, left:10, zIndex:400,
        background:"rgba(255,255,255,.96)", border:"1px solid #e2e8f0",
        padding:"8px 11px", boxShadow:"0 2px 10px rgba(0,0,0,.1)" }}>
        {isMobile
          ? <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[{c:"#c0392b",t:"Patvirtinti"},{c:"#d97706",t:"Tikėtini"},{c:"#2563eb",t:"Stebimi"},{c:"#059669",t:"Saugūs"}].map((l,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:4, fontFamily:"monospace", fontSize:9, color:"#64748b" }}>
                  <div style={{ width:9,height:9,borderRadius:"50%",background:l.c }}/>{l.t}
                </div>
              ))}
            </div>
          : <>
              <div style={{ fontFamily:"monospace", fontSize:8, textTransform:"uppercase", letterSpacing:".1em", color:"#94a3b8", marginBottom:6, fontWeight:600 }}>Legenda</div>
              {[{c:"#c0392b",t:"Patvirtinti"},{c:"#d97706",t:"Tikėtini"},{c:"#2563eb",t:"Stebimi"},{c:"#059669",t:"Saugūs"},{c:"#7c3aed",t:"Kilmės vieta"}].map((l,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, fontFamily:"monospace", fontSize:9, color:"#64748b" }}>
                  <div style={{ width:10,height:10,borderRadius:"50%",background:l.c,border:"1px solid rgba(0,0,0,.1)",flexShrink:0 }}/>{l.t}
                </div>
              ))}
            </>
        }
      </div>

      {/* Timeline – desktop only */}
      {!isMobile && <TimelineOverlay/>}
    </div>
  );

  // ── MOBILE LAYOUT ────────────────────────────────────────────────────────────
  if (isMobile) {
    const NAV = [
      {id:"map",    icon:"🗺️", lbl:"Žemėlapis"},
      {id:"news",   icon:"🔴",  lbl:"Naujienos"},
      {id:"cases",  icon:"📋",  lbl:"Atvejai"},
      {id:"info",   icon:"ℹ️",  lbl:"Info"},
      {id:"sources",icon:"📰",  lbl:"Šaltiniai"},
    ];
    return (
      <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", height:"100vh", display:"flex",
        flexDirection:"column", overflow:"hidden", color:"#1e293b", background:"#f1f5f9" }}>
        <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}`}</style>

        {/* Header */}
        <div style={{ height:44, background:"#fff", borderBottom:"2px solid #c0392b",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 12px", flexShrink:0, boxShadow:"0 2px 6px rgba(0,0,0,.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ background:"#c0392b", color:"#fff", fontFamily:"monospace", fontSize:9, fontWeight:700, padding:"3px 7px" }}>NSC</div>
            <div style={{ fontWeight:700, fontSize:12 }}>HANTAVIRUSAS</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5, fontFamily:"monospace", fontSize:10, color:"#c0392b" }}>
            <div style={{ width:6, height:6, background:"#c0392b", borderRadius:"50%", animation:"pulse 1.4s infinite" }}/>GYVAS
          </div>
        </div>

        <AutoBar/>
        <AlertBar/>
        <StatBar/>

        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          {mobTab === "map" && <MapPanel/>}
          {mobTab !== "map" && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:"#fff" }}>
              <div style={{ display:"flex", borderBottom:"1px solid #e2e8f0", background:"#f8fafc", flexShrink:0 }}>
                {[["news","🔴 Naujienos"],["cases","Atvejai"],["info","Info"],["sources","Šaltiniai"]].map(([id,lbl]) => (
                  <button key={id} onClick={() => { setSideTab(id); setMobTab(id); }}
                    style={{ flex:1, padding:"10px 3px", background: mobTab===id ? "#fff" : "none",
                      border:"none", fontFamily:"monospace", fontSize:8, fontWeight:600, textTransform:"uppercase",
                      letterSpacing:".05em", color: mobTab===id ? "#1e293b" : "#94a3b8", cursor:"pointer",
                      borderBottom:`2px solid ${mobTab===id ? "#c0392b" : "transparent"}` }}>
                    {lbl}
                  </button>
                ))}
              </div>
              {mobTab==="news"    && <NewsTab/>}
              {mobTab==="cases"   && <CasesTab/>}
              {mobTab==="info"    && <InfoTab/>}
              {mobTab==="sources" && <SourcesTab/>}
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div style={{ background:"#fff", borderTop:"1px solid #e2e8f0", display:"flex",
          flexShrink:0, boxShadow:"0 -2px 8px rgba(0,0,0,.06)" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setMobTab(n.id); if(n.id!=="map") setSideTab(n.id); }}
              style={{ flex:1, padding:"7px 2px 8px", background: mobTab===n.id ? "#fef2f2" : "none",
                border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                borderTop:`2px solid ${mobTab===n.id ? "#c0392b" : "transparent"}`, transition:"all .15s" }}>
              <span style={{ fontSize:15 }}>{n.icon}</span>
              <span style={{ fontFamily:"monospace", fontSize:8, color: mobTab===n.id ? "#c0392b" : "#94a3b8",
                fontWeight: mobTab===n.id ? 700 : 400 }}>{n.lbl}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", height:"100vh", display:"flex",
      flexDirection:"column", overflow:"hidden", color:"#1e293b", background:"#f1f5f9" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}`}</style>

      {/* Header */}
      <div style={{ height:48, background:"#fff", borderBottom:"2px solid #c0392b",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 16px", flexShrink:0, boxShadow:"0 2px 6px rgba(0,0,0,.07)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ background:"#c0392b", color:"#fff", fontFamily:"monospace", fontSize:10, fontWeight:700, padding:"3px 9px", letterSpacing:".08em" }}>NSC</div>
          <div style={{ fontWeight:700, fontSize:15 }}>HANTAVIRUSAS — AUTOMATINIS STEBĖSENOS CENTRAS</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, fontFamily:"monospace", fontSize:10, color:"#94a3b8" }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, color:"#c0392b" }}>
            <div style={{ width:7, height:7, background:"#c0392b", borderRadius:"50%", animation:"pulse 1.4s infinite" }}/>GYVAS
          </div>
          <span>{time}</span>
          <span style={{ color:"#64748b", fontSize:9 }}>Sekantis: {countdown}</span>
        </div>
      </div>

      <AutoBar/>
      <AlertBar/>
      <StatBar/>

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <MapPanel/>
        <Sidebar/>
      </div>

      <div style={{ background:"#fff", borderTop:"1px solid #e2e8f0", padding:"5px 16px",
        display:"flex", alignItems:"center", gap:14, fontFamily:"monospace", fontSize:8,
        flexWrap:"wrap", flexShrink:0 }}>
        <span style={{ color:"#94a3b8" }}>Šaltiniai: <strong style={{ color:"#1e293b" }}>ECDC · WHO · CDC · ABC News</strong></span>
        <span style={{ color:"#94a3b8" }}>Virusas: <strong style={{ color:"#1e293b" }}>Andes hantavirus (ANDV)</strong></span>
        <span style={{ color:"#94a3b8" }}>Laivas: <strong style={{ color:"#1e293b" }}>MV Hondius · Nyderlandai</strong></span>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, color:"#059669" }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:"#059669" }}/>
          Sistema aktyvi · {data.updatedAt}
        </div>
      </div>
    </div>
  );
}
