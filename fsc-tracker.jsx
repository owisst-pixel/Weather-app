import { useState, useMemo } from "react";

const EMPTY_PRODUCT = () => ({ id: Date.now() + Math.random(), name: "", volumeM3: "", fscCode: "" });

const EMPTY_DEAL = () => ({
  id: null,
  supplierName: "", supplierContract: "", supplierInvoice: "",
  supplierPaid: false,
  buyerName: "", buyerContract: "", buyerInvoice: "",
  buyerPaymentReceived: false,
  products: [EMPTY_PRODUCT()],
  docInvoice: false, docPackingList: false, docOriginCert: false, docBillOfLading: false,
  date: new Date().toISOString().split("T")[0],
  notes: "",
});
const totalVolume = (products) => products.reduce((s, p) => s + (parseFloat(p.volumeM3) || 0), 0);

const StatusBadge = ({ deal }) => {
  const allDocs = [deal.docInvoice, deal.docPackingList, deal.docOriginCert, deal.docBillOfLading].every(Boolean);
  const allPaid = deal.supplierPaid && deal.buyerPaymentReceived;
  if (allPaid && allDocs) return <span style={styles.badge.complete}>✓ Pilna</span>;
  if (deal.supplierPaid && !deal.buyerPaymentReceived) return <span style={styles.badge.waiting}>⏳ Laukiama mokėjimo</span>;
  if (!deal.supplierPaid) return <span style={styles.badge.pending}>◈ Vykdoma</span>;
  return <span style={styles.badge.docs}>⚠ Trūksta dok.</span>;
};

const DocCheck = ({ label, checked, onChange }) => (
  <div onClick={onChange} style={{
    display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"6px 10px",borderRadius:4,
    background:checked?"rgba(180,255,180,0.08)":"rgba(255,255,255,0.03)",
    border:`1px solid ${checked?"#4a7c59":"#333"}`,transition:"all 0.2s",userSelect:"none",
  }}>
    <div style={{width:16,height:16,borderRadius:3,background:checked?"#4CAF50":"transparent",
      border:`2px solid ${checked?"#4CAF50":"#555"}`,display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:10,color:"#fff",flexShrink:0}}>{checked&&"✓"}</div>
    <span style={{fontSize:12,color:checked?"#a8d5a2":"#777",fontFamily:"monospace"}}>{label}</span>
  </div>
);

const Field = ({ label, children, span }) => (
  <div style={{gridColumn:span?`span ${span}`:undefined}}>
    <label style={{display:"block",fontSize:10,color:"#666",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5,fontFamily:"monospace"}}>{label}</label>
    {children}
  </div>
);

const Inp = ({ value, onChange, type="text", placeholder, style:s }) => (
  <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{...styles.input,...s}} />
);

const Toggle = ({ checked, onChange, label }) => (
  <div onClick={onChange} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",
    padding:"8px 12px",borderRadius:4,background:checked?"rgba(76,175,80,0.1)":"rgba(255,255,255,0.03)",
    border:`1px solid ${checked?"#4CAF50":"#333"}`,userSelect:"none"}}>
    <div style={{width:32,height:18,borderRadius:9,background:checked?"#4CAF50":"#333",position:"relative",transition:"background 0.2s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:checked?17:3,width:12,height:12,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
    </div>
    <span style={{fontSize:12,color:checked?"#a8d5a2":"#666",fontFamily:"monospace"}}>{label}</span>
  </div>
);

const InfoRow = ({ label, value, mono, ok }) => (
  <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1a1a1a"}}>
    <span style={{fontSize:11,color:"#555",fontFamily:"monospace"}}>{label}</span>
    <span style={{fontSize:12,color:ok===true?"#4CAF50":ok===false?"#e74c3c":"#aaa",fontFamily:mono?"monospace":"inherit"}}>{value||"—"}</span>
  </div>
);

const ProductsEditor = ({ products, onChange }) => {
  const update = (id, key, val) => onChange(products.map(p => p.id===id ? {...p,[key]:val} : p));
  const add = () => onChange([...products, EMPTY_PRODUCT()]);
  const remove = (id) => { if (products.length > 1) onChange(products.filter(p => p.id!==id)); };
  const vol = totalVolume(products);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h2 style={styles.sectionTitle}>▸ Prekės</h2>
        <button onClick={add} style={styles.addProductBtn}>+ Pridėti prekę</button>
      </div>

      {products.map((p, i) => (
        <div key={p.id} style={{background:"#111",border:"1px solid #222",borderRadius:6,padding:"14px 14px 12px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:11,color:"#4CAF50",fontFamily:"monospace",letterSpacing:"0.06em"}}>PREKĖ #{i+1}</span>
            {products.length > 1 && (
              <button onClick={()=>remove(p.id)} style={styles.removeProductBtn} title="Ištrinti">✕ Pašalinti</button>
            )}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10}}>
            <Field label="Pavadinimas">
              <Inp value={p.name} onChange={v=>update(p.id,"name",v)} placeholder="Pjautas medis, Eglė..." />
            </Field>
            <Field label="Kiekis (m³)">
              <Inp type="number" value={p.volumeM3} onChange={v=>update(p.id,"volumeM3",v)} placeholder="0.000" />
            </Field>
            <Field label="FSC Kodas">
              <Inp value={p.fscCode} onChange={v=>update(p.id,"fscCode",v)} placeholder="FSC-C000000" />
            </Field>
          </div>
        </div>
      ))}

      <div style={{display:"flex",justifyContent:"flex-end",gap:24,padding:"10px 14px",background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:4}}>
        <span style={{fontSize:11,color:"#555",fontFamily:"monospace"}}>
          PREKIŲ RŪŠIŲ: <strong style={{color:"#aaa"}}>{products.length}</strong>
        </span>
        <span style={{fontSize:11,color:"#555",fontFamily:"monospace"}}>
          BENDRAS KIEKIS: <strong style={{color:"#4CAF50"}}>{vol.toFixed(3)} m³</strong>
        </span>
      </div>

      <div style={{marginTop:16,padding:"14px 16px",background:"rgba(76,175,80,0.04)",border:"1px solid #2a4a2e",borderRadius:6}}>
        <div style={{fontSize:11,color:"#4CAF50",fontFamily:"monospace",letterSpacing:"0.05em",marginBottom:10}}>FSC GRANDINĖS SEKIMAS</div>
        {products.map((p, i) => (
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i<products.length-1?8:0,fontSize:11,fontFamily:"monospace"}}>
            <span style={{color:"#444",width:20}}>#{i+1}</span>
            <span style={{color:"#4CAF50",padding:"2px 8px",border:"1px solid #2a4a2a",borderRadius:3,background:"#0d1a0d",minWidth:100}}>{p.fscCode||"FSC—"}</span>
            <span style={{color:"#3a5a3a"}}>·</span>
            <span style={{color:"#888",flex:1}}>{p.name||"Prekė"}</span>
            <span style={{color:"#4CAF50",fontWeight:700}}>{p.volumeM3||"0"} m³</span>
          </div>
        ))}
        {products.length > 1 && (
          <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #1a2a1a",display:"flex",justifyContent:"flex-end",fontSize:12,fontFamily:"monospace",color:"#4CAF50",fontWeight:700}}>
            Viso: {vol.toFixed(3)} m³
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [deals, setDeals] = useState([]);
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_DEAL());
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("supplier");

  const setField = (key) => (val) => setForm(f => ({...f,[key]:val}));
  const toggleField = (key) => () => setForm(f => ({...f,[key]:!f[key]}));

  const openNew = () => { setForm({...EMPTY_DEAL(),id:Date.now()}); setEditing(null); setActiveSection("supplier"); setView("form"); };
  const openEdit = (deal) => { setForm({...deal}); setEditing(deal.id); setActiveSection("supplier"); setView("form"); };
  const openDetail = (deal) => { setForm({...deal}); setView("detail"); };

  const save = () => {
    if (editing) setDeals(ds => ds.map(d => d.id===editing ? form : d));
    else setDeals(ds => [...ds, form]);
    setView("list");
  };

  const deleteDeal = (id) => {
    if (confirm("Ištrinti šį sandorį?")) { setDeals(ds => ds.filter(d => d.id!==id)); setView("list"); }
  };

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return deals.filter(d => {
      const matchSearch = !q ||
        d.supplierName?.toLowerCase().includes(q) || d.buyerName?.toLowerCase().includes(q) ||
        d.supplierContract?.toLowerCase().includes(q) || d.buyerContract?.toLowerCase().includes(q) ||
        d.supplierInvoice?.toLowerCase().includes(q) || d.buyerInvoice?.toLowerCase().includes(q) ||
        d.products?.some(p => p.name?.toLowerCase().includes(q) || p.fscCode?.toLowerCase().includes(q));
      const matchFrom = !periodFrom || d.date >= periodFrom;
      const matchTo = !periodTo || d.date <= periodTo;
      return matchSearch && matchFrom && matchTo;
    });
  }, [deals, search, periodFrom, periodTo]);

  const stats = useMemo(() => {
    const monthDeals = deals.filter(d => d.date && d.date.startsWith(currentYM));
    const monthCount = monthDeals.length;
    // Užsakytas kiekis = visų sandorių mėnesį tiekėjo pusė (pirkimas)
    const monthBought = monthDeals.reduce((s,d) => s+totalVolume(d.products||[]), 0);
    // Parduotas kiekis = sandoriai kur pirkėjas patvirtintas (buyerPaymentReceived)
    const monthSold = monthDeals.filter(d=>d.buyerPaymentReceived).reduce((s,d) => s+totalVolume(d.products||[]), 0);
    const totalVol = deals.reduce((s,d) => s+totalVolume(d.products||[]), 0);
    return { totalVol, monthCount, monthBought, monthSold, count: deals.length };
  }, [deals, currentYM]);

  // ── FORMA ──
  if (view === "form") {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <button onClick={()=>setView("list")} style={styles.backBtn}>← Grįžti</button>
          <h1 style={styles.title}>{editing ? "Redaguoti sandorį" : "Naujas sandoris"}</h1>
          <button onClick={save} style={styles.saveBtn}>Išsaugoti ✓</button>
        </div>

        <div style={{display:"flex",gap:2,marginBottom:24,borderBottom:"1px solid #222"}}>
          {[{key:"supplier",label:"Tiekėjas"},{key:"buyer",label:"Pirkėjas"},{key:"goods",label:"Prekės"},{key:"docs",label:"Dokumentai"}].map(s=>(
            <button key={s.key} onClick={()=>setActiveSection(s.key)} style={{
              ...styles.tabBtn,
              borderBottom:activeSection===s.key?"2px solid #4CAF50":"2px solid transparent",
              color:activeSection===s.key?"#4CAF50":"#666",
            }}>{s.label}</button>
          ))}
        </div>

        {activeSection==="supplier" && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>▸ Tiekėjas</h2>
            <div style={styles.grid2}>
              <Field label="Tiekėjo pavadinimas" span={2}><Inp value={form.supplierName} onChange={setField("supplierName")} placeholder="UAB Mediena..." /></Field>
              <Field label="Kontrakto Nr."><Inp value={form.supplierContract} onChange={setField("supplierContract")} placeholder="K-2024-001" /></Field>
              <Field label="Sąskaitos Nr."><Inp value={form.supplierInvoice} onChange={setField("supplierInvoice")} placeholder="INV-001" /></Field>
              <Field label="Data"><Inp type="date" value={form.date} onChange={setField("date")} /></Field>
              <Field label="Mokėjimo statusas" span={2}><Toggle checked={form.supplierPaid} onChange={toggleField("supplierPaid")} label={form.supplierPaid?"Apmokėta ✓":"Neapmokėta"} /></Field>
            </div>
          </div>
        )}

        {activeSection==="buyer" && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>▸ Pirkėjas</h2>
            <div style={styles.grid2}>
              <Field label="Pirkėjo pavadinimas" span={2}><Inp value={form.buyerName} onChange={setField("buyerName")} placeholder="UAB Distributors..." /></Field>
              <Field label="Kontrakto Nr."><Inp value={form.buyerContract} onChange={setField("buyerContract")} placeholder="K-2024-001" /></Field>
              <Field label="Sąskaitos Nr."><Inp value={form.buyerInvoice} onChange={setField("buyerInvoice")} placeholder="INV-001" /></Field>
              <Field label="Pastabos" span={2}>
                <textarea value={form.notes} onChange={e=>setField("notes")(e.target.value)}
                  placeholder="Papildoma informacija..." rows={3}
                  style={{...styles.input,resize:"vertical",fontFamily:"monospace"}} />
              </Field>
              <Field label="Mokėjimo statusas" span={2}><Toggle checked={form.buyerPaymentReceived} onChange={toggleField("buyerPaymentReceived")} label={form.buyerPaymentReceived?"Mokėjimas gautas ✓":"Mokėjimas negautas"} /></Field>
            </div>
          </div>
        )}

        {activeSection==="goods" && (
          <ProductsEditor products={form.products} onChange={setField("products")} />
        )}

        {activeSection==="docs" && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>▸ Dokumentai</h2>
            <p style={{fontSize:12,color:"#555",marginBottom:16,fontFamily:"monospace"}}>Pažymėkite gautus dokumentus:</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <DocCheck label="Invoice (Sąskaita)" checked={form.docInvoice} onChange={toggleField("docInvoice")} />
              <DocCheck label="Packing List" checked={form.docPackingList} onChange={toggleField("docPackingList")} />
              <DocCheck label="Kilmės sertifikatas" checked={form.docOriginCert} onChange={toggleField("docOriginCert")} />
              <DocCheck label="Bill of Lading" checked={form.docBillOfLading} onChange={toggleField("docBillOfLading")} />
            </div>
            <div style={{marginTop:20,padding:"12px 16px",background:"#111",border:"1px solid #222",borderRadius:6}}>
              <div style={{fontSize:11,color:"#555",fontFamily:"monospace",marginBottom:8}}>DOKUMENTŲ STATUSAS</div>
              {[{key:"docInvoice",label:"Invoice"},{key:"docPackingList",label:"Packing List"},{key:"docOriginCert",label:"Kilmės sertifikatas"},{key:"docBillOfLading",label:"Bill of Lading"}].map(d=>(
                <div key={d.key} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #1a1a1a"}}>
                  <span style={{fontSize:12,color:"#777",fontFamily:"monospace"}}>{d.label}</span>
                  <span style={{fontSize:12,color:form[d.key]?"#4CAF50":"#c0392b",fontFamily:"monospace"}}>{form[d.key]?"✓ Gautas":"✗ Negautas"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:10,marginTop:24}}>
          <button onClick={save} style={{...styles.saveBtn,flex:1,padding:"12px"}}>Išsaugoti sandorį ✓</button>
          {editing && <button onClick={()=>deleteDeal(editing)} style={styles.deleteBtn}>Ištrinti</button>}
        </div>
      </div>
    );
  }

  // ── DETALĖS ──
  if (view === "detail") {
    const d = form;
    const vol = totalVolume(d.products||[]);
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <button onClick={()=>setView("list")} style={styles.backBtn}>← Grįžti</button>
          <h1 style={styles.title}>Sandorio detalės</h1>
          <button onClick={()=>openEdit(d)} style={styles.editBtn}>Redaguoti ✎</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>▸ Tiekėjas</div>
            <InfoRow label="Įmonė" value={d.supplierName} />
            <InfoRow label="Kontraktas" value={d.supplierContract} mono />
            <InfoRow label="Sąskaita" value={d.supplierInvoice} mono />
            <InfoRow label="Apmokėta" value={d.supplierPaid?"✓ Taip":"✗ Ne"} ok={d.supplierPaid} />
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>▸ Pirkėjas</div>
            <InfoRow label="Įmonė" value={d.buyerName} />
            <InfoRow label="Kontraktas" value={d.buyerContract} mono />
            <InfoRow label="Sąskaita" value={d.buyerInvoice} mono />
            <InfoRow label="Mokėjimas gautas" value={d.buyerPaymentReceived?"✓ Taip":"✗ Ne"} ok={d.buyerPaymentReceived} />
          </div>
        </div>

        <div style={{...styles.card,marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={styles.cardTitle}>▸ Prekės ({(d.products||[]).length} rūš.)</div>
            <span style={{fontSize:12,color:"#4CAF50",fontFamily:"monospace",fontWeight:700}}>Viso: {vol.toFixed(3)} m³</span>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"monospace"}}>
            <thead>
              <tr style={{borderBottom:"1px solid #1e1e1e"}}>
                {["#","Pavadinimas","Kiekis (m³)","FSC Kodas"].map(h=>(
                  <th key={h} style={{padding:"6px 8px",textAlign:"left",fontSize:10,color:"#444",letterSpacing:"0.07em",textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(d.products||[]).map((p,i)=>(
                <tr key={p.id} style={{borderBottom:"1px solid #161616"}}>
                  <td style={{...styles.td,color:"#444"}}>{i+1}</td>
                  <td style={{...styles.td,color:"#ccc"}}>{p.name||"—"}</td>
                  <td style={{...styles.td,color:"#4CAF50",fontWeight:700}}>{p.volumeM3?`${p.volumeM3} m³`:"—"}</td>
                  <td style={{...styles.td,color:"#7ab87a",fontSize:11}}>{p.fscCode||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{marginTop:16}}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>▸ Dokumentai</div>
            {[{key:"docInvoice",label:"Invoice"},{key:"docPackingList",label:"Packing List"},{key:"docOriginCert",label:"Kilmės sertifikatas"},{key:"docBillOfLading",label:"Bill of Lading"}].map(doc=>(
              <InfoRow key={doc.key} label={doc.label} value={d[doc.key]?"✓ Gautas":"✗ Negautas"} ok={d[doc.key]} />
            ))}
          </div>
        </div>
        {d.notes && <div style={{...styles.card,marginTop:16}}><div style={styles.cardTitle}>▸ Pastabos</div><p style={{fontSize:13,color:"#888",margin:0,fontFamily:"monospace"}}>{d.notes}</p></div>}
      </div>
    );
  }

  // ── SĄRAŠAS ──
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.mainTitle}>FSC TRACKER</h1>
          <div style={{fontSize:11,color:"#444",fontFamily:"monospace",letterSpacing:"0.1em"}}>TARPININKŲ SANDORIŲ VALDYMO SISTEMA</div>
        </div>
        <button onClick={openNew} style={styles.newBtn}>+ Naujas sandoris</button>
      </div>

      {/* Einamojo mėnesio statistika */}
      {(() => {
        const monthLabel = now.toLocaleString("lt-LT", {month:"long", year:"numeric"});
        return (
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,color:"#444",fontFamily:"monospace",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>
              {monthLabel.toUpperCase()} — EINAMASIS MĖNUO
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:12}}>
              {[
                {label:"Sandorių šį mėnesį",value:stats.monthCount,unit:"vnt."},
                {label:"Bendras kiekis (visi)",value:stats.totalVol.toFixed(2),unit:"m³"},
                {label:"Užsakyta šį mėnesį",value:stats.monthBought.toFixed(3),unit:"m³",color:"#a2c8d5"},
                {label:"Parduota šį mėnesį",value:stats.monthSold.toFixed(3),unit:"m³",color:"#4CAF50"},
              ].map(s=>(
                <div key={s.label} style={styles.statCard}>
                  <div style={{fontSize:10,color:"#555",fontFamily:"monospace",letterSpacing:"0.07em",textTransform:"uppercase"}}>{s.label}</div>
                  <div style={{fontSize:20,fontFamily:"monospace",fontWeight:700,color:s.color||"#e8e8e8",marginTop:4}}>{s.value}</div>
                  <div style={{fontSize:11,color:"#444",fontFamily:"monospace"}}>{s.unit}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Paieška ir laikotarpio filtras */}
      <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:10,marginBottom:20,alignItems:"end"}}>
        <div>
          <label style={{display:"block",fontSize:10,color:"#555",fontFamily:"monospace",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:5}}>Paieška</label>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Tiekėjas, pirkėjas, kontraktas, sąskaita, prekė, FSC..."
            style={{...styles.input,padding:"9px 14px",fontSize:13}} />
        </div>
        <div>
          <label style={{display:"block",fontSize:10,color:"#555",fontFamily:"monospace",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:5}}>Nuo</label>
          <input type="date" value={periodFrom} onChange={e=>setPeriodFrom(e.target.value)} style={{...styles.input,width:140}} />
        </div>
        <div>
          <label style={{display:"block",fontSize:10,color:"#555",fontFamily:"monospace",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:5}}>Iki</label>
          <div style={{display:"flex",gap:6}}>
            <input type="date" value={periodTo} onChange={e=>setPeriodTo(e.target.value)} style={{...styles.input,width:140}} />
            {(periodFrom||periodTo) && (
              <button onClick={()=>{setPeriodFrom("");setPeriodTo("");}} style={{...styles.backBtn,padding:"8px 10px",whiteSpace:"nowrap"}}>✕</button>
            )}
          </div>
        </div>
      </div>

      {filtered.length===0 ? (
        <div style={{textAlign:"center",padding:"60px 0",color:"#333",fontFamily:"monospace"}}>
          {deals.length===0?"Nėra sandorių. Sukurkite pirmąjį.":"Nerasta sandorių."}
        </div>
      ) : (
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"monospace"}}>
            <thead>
              <tr style={{borderBottom:"1px solid #222"}}>
                {["Data","Tiekėjas","Pirkėjas","Prekės","Viso m³","Dok.","Statusas",""].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,color:"#444",letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d,i)=>{
                const vol = totalVolume(d.products||[]);
                const names = (d.products||[]).map(p=>p.name).filter(Boolean).join(", ")||"—";
                return (
                  <tr key={d.id} onClick={()=>openDetail(d)}
                    style={{borderBottom:"1px solid #161616",cursor:"pointer",background:i%2===0?"transparent":"rgba(255,255,255,0.012)",transition:"background 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(76,175,80,0.05)"}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"transparent":"rgba(255,255,255,0.012)"}
                  >
                    <td style={styles.td}>{d.date}</td>
                    <td style={{...styles.td,color:"#c8d8c8"}}>{d.supplierName||"—"}</td>
                    <td style={{...styles.td,color:"#c8c8d8"}}>{d.buyerName||"—"}</td>
                    <td style={{...styles.td,maxWidth:180}}>
                      <span style={{color:"#aaa",fontSize:11}}>{names.length>26?names.slice(0,26)+"…":names}</span>
                      {(d.products||[]).length>1&&(
                        <span style={{marginLeft:6,fontSize:10,color:"#4CAF50",background:"rgba(76,175,80,0.12)",padding:"1px 5px",borderRadius:3,border:"1px solid #2a4a2a"}}>
                          {d.products.length} rūš.
                        </span>
                      )}
                    </td>
                    <td style={{...styles.td,color:"#4CAF50",fontWeight:700}}>{vol.toFixed(3)}</td>
                    <td style={styles.td}>
                      <div style={{display:"flex",gap:2}}>
                        {["I","P","K","B"].map((l,idx)=>{
                          const keys=["docInvoice","docPackingList","docOriginCert","docBillOfLading"];
                          return <span key={l} style={{width:16,height:16,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,background:d[keys[idx]]?"rgba(76,175,80,0.2)":"rgba(255,255,255,0.05)",color:d[keys[idx]]?"#4CAF50":"#333",border:`1px solid ${d[keys[idx]]?"#3a6a3a":"#222"}`}}>{l}</span>;
                        })}
                      </div>
                    </td>
                    <td style={styles.td}><StatusBadge deal={d} /></td>
                    <td style={styles.td} onClick={e=>{e.stopPropagation();openEdit(d);}}>
                      <button style={styles.rowEditBtn}>✎</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page:{minHeight:"100vh",background:"#0d0d0d",color:"#e0e0e0",padding:"24px",fontFamily:"'Segoe UI', sans-serif",maxWidth:1100,margin:"0 auto"},
  header:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28,paddingBottom:20,borderBottom:"1px solid #1a1a1a"},
  mainTitle:{fontSize:22,fontFamily:"monospace",fontWeight:900,letterSpacing:"0.15em",color:"#4CAF50",margin:0},
  title:{fontSize:18,fontFamily:"monospace",fontWeight:700,margin:0,color:"#e0e0e0"},
  newBtn:{padding:"10px 20px",background:"#4CAF50",border:"none",color:"#fff",fontFamily:"monospace",fontWeight:700,fontSize:13,cursor:"pointer",borderRadius:4,letterSpacing:"0.04em"},
  saveBtn:{padding:"8px 18px",background:"#4CAF50",border:"none",color:"#fff",fontFamily:"monospace",fontWeight:700,fontSize:13,cursor:"pointer",borderRadius:4},
  editBtn:{padding:"8px 18px",background:"transparent",border:"1px solid #4CAF50",color:"#4CAF50",fontFamily:"monospace",fontWeight:700,fontSize:13,cursor:"pointer",borderRadius:4},
  deleteBtn:{padding:"8px 16px",background:"transparent",border:"1px solid #c0392b",color:"#c0392b",fontFamily:"monospace",fontSize:12,cursor:"pointer",borderRadius:4},
  backBtn:{padding:"8px 14px",background:"transparent",border:"1px solid #333",color:"#888",fontFamily:"monospace",fontSize:12,cursor:"pointer",borderRadius:4},
  input:{width:"100%",padding:"8px 10px",background:"#111",border:"1px solid #282828",color:"#e0e0e0",fontSize:13,borderRadius:4,outline:"none",boxSizing:"border-box",fontFamily:"monospace"},
  section:{marginBottom:24},
  sectionTitle:{fontSize:13,color:"#4CAF50",fontFamily:"monospace",letterSpacing:"0.06em",marginBottom:16,marginTop:0},
  grid2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14},
  statCard:{padding:"14px 16px",background:"#111",border:"1px solid #1e1e1e",borderRadius:6},
  card:{padding:"16px",background:"#111",border:"1px solid #1e1e1e",borderRadius:6},
  cardTitle:{fontSize:12,color:"#4CAF50",fontFamily:"monospace",letterSpacing:"0.06em",marginBottom:12,fontWeight:700},
  td:{padding:"9px 10px",fontSize:12,color:"#888",whiteSpace:"nowrap"},
  tabBtn:{padding:"10px 18px",background:"transparent",border:"none",fontFamily:"monospace",fontSize:12,cursor:"pointer",letterSpacing:"0.04em",transition:"color 0.2s"},
  rowEditBtn:{background:"transparent",border:"1px solid #222",color:"#555",padding:"3px 8px",cursor:"pointer",borderRadius:3,fontSize:12,fontFamily:"monospace"},
  addProductBtn:{padding:"6px 14px",background:"transparent",border:"1px solid #4CAF50",color:"#4CAF50",fontFamily:"monospace",fontSize:12,cursor:"pointer",borderRadius:4},
  removeProductBtn:{background:"transparent",border:"1px solid #3a2020",color:"#8a3a3a",padding:"3px 10px",cursor:"pointer",borderRadius:3,fontSize:11,fontFamily:"monospace"},
  badge:{
    complete:{background:"rgba(76,175,80,0.15)",color:"#4CAF50",padding:"3px 8px",borderRadius:3,fontSize:11,fontFamily:"monospace",border:"1px solid #2a4a2a"},
    waiting:{background:"rgba(243,156,18,0.1)",color:"#f39c12",padding:"3px 8px",borderRadius:3,fontSize:11,fontFamily:"monospace",border:"1px solid #4a3a10"},
    pending:{background:"rgba(255,255,255,0.05)",color:"#888",padding:"3px 8px",borderRadius:3,fontSize:11,fontFamily:"monospace",border:"1px solid #2a2a2a"},
    docs:{background:"rgba(192,57,43,0.1)",color:"#e74c3c",padding:"3px 8px",borderRadius:3,fontSize:11,fontFamily:"monospace",border:"1px solid #4a2020"},
  },
};
