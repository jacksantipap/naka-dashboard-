'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ── SUPABASE ──────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gstkzsazcwxihhrhtkjn.supabase.co',
  'sb_publishable_hYfjkP-E9vU0waQbY4_oGA_45_nUiMU'
);

async function sbFetch(path, options = {}) {
  const url = new URL(`https://gstkzsazcwxihhrhtkjn.supabase.co/rest/v1${path}`);
  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": 'sb_publishable_hYfjkP-E9vU0waQbY4_oGA_45_nUiMU',
      "Authorization": `Bearer sb_publishable_hYfjkP-E9vU0waQbY4_oGA_45_nUiMU`,
      ...options.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : [];
}

// ── ROLES ─────────────────────────────────────────────────────────────────────
const ROLE_MENUS = {
  admin:     ["overview","admin","crm","ads","qa","account","pl","orders","store","settings"],
  account:   ["overview","account","pl"],
  qa:        ["qa"],
  warehouse: ["overview","orders","store"],
  ads:       ["ads"],
  store:     ["orders","store"],
};
const ROLE_LABELS = { admin:"Admin (CEO)", account:"บัญชี", qa:"QA", warehouse:"คลัง", ads:"Ads", store:"Store" };
const MENUS = [
  { key:"overview",  label:"Overview",   icon:"📊" },
  { key:"admin",     label:"Sale Admin", icon:"👩‍💼" },
  { key:"crm",       label:"Sale CRM",   icon:"📞" },
  { key:"ads",       label:"Ads",        icon:"📢" },
  { key:"qa",        label:"QA",         icon:"🎙️" },
  { key:"account",   label:"Account",    icon:"💳" },
  { key:"pl",        label:"P&L",        icon:"📉" },
  { key:"orders",    label:"คำสั่งซื้อ", icon:"📋" },
  { key:"store",     label:"Store",      icon:"🏪" },
  { key:"settings",  label:"Settings",   icon:"⚙️" },
];
const COLORS = ["#FF6B35","#004E89","#1A936F","#F7C59F","#88D498","#C6DABF"];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmt  = n => (Number(n) || 0).toLocaleString("th-TH");
const fmtB = n => n >= 1e6 ? `${(n/1e6).toFixed(2)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : `${n}`;
const TT   = { background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#fff", fontSize:12 };
const AX   = { fill:"rgba(255,255,255,0.35)", fontSize:11 };
const GR   = { strokeDasharray:"3 3", stroke:"rgba(255,255,255,0.05)" };

// ── CSV PARSER ────────────────────────────────────────────────────────────────
const COL_MAP = {
  "เลขออเดอร์":"เลขออเดอร์","วันที่ทำรายการ":"วันที่ทำรายการ","วิธีการชำระเงิน":"วิธีการชำระเงิน",
  "เบอร์โทรศัพท์":"เบอร์โทรศัพท์","รหัสลูกค้า":"รหัสลูกค้า","ชื่อลูกค้า":"ชื่อลูกค้า",
  "ที่อยู่จัดส่ง":"ที่อยู่จัดส่ง","แขวง / ตำบล":"แขวง_ตำบล","เขต / อำเภอ":"เขต_อำเภอ",
  "จังหวัด":"จังหวัด","รหัสไปรษณีย์":"รหัสไปรษณีย์","หมายเหตุ":"หมายเหตุ",
  "Promotion":"promotion","สินค้า":"สินค้า","ค่าส่ง":"ค่าส่ง","ส่วนลด":"ส่วนลด",
  "คูปองส่วนลด":"คูปองส่วนลด","ยอดขาย Admin":"ยอดขาย_admin",
  "ผู้ขาย username":"ผู้ขาย_username","ผู้ขาย nickname":"ผู้ขาย_nickname","ชื่อผู้ขาย":"ชื่อผู้ขาย",
  "ยอด Upsale":"ยอด_upsale","ผู้ Upsale":"ผู้_upsale","ยอดรวม":"ยอดรวม",
  "คนดูแล username":"คนดูแล_username","คนดูแล nickname":"คนดูแล_nickname",
  "ช่องทาง":"ช่องทาง","ชื่อช่องทาง":"ชื่อช่องทาง","ชื่อลูกค้าในโซเชียล":"ชื่อลูกค้าในโซเชียล",
  "รหัสตัวแทนขาย":"รหัสตัวแทนขาย","ชื่อตัวแทนขาย":"ชื่อตัวแทนขาย","ตัวแทนเจ้าของลูกค้า":"ตัวแทนเจ้าของลูกค้า",
  "สั่งซื้อครั้งที่":"สั่งซื้อครั้งที่","ลูกค้าใหม่ / ลูกค้ารีออเดอร์":"ลูกค้าใหม่_รีออเดอร์",
  "สถานะ":"สถานะ","ขนส่ง":"ขนส่ง","Tracking":"tracking",
  "สถานะการชำระเงิน":"สถานะการชำระเงิน","วันที่รับชำระเงิน":"วันที่รับชำระเงิน","เวลารับชำระ":"เวลารับชำระ",
};
const NUMERIC_COLS = new Set(["ค่าส่ง","ส่วนลด","คูปองส่วนลด","ยอดขาย_admin","ยอด_upsale","ยอดรวม","สั่งซื้อครั้งที่"]);

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  function splitLine(line) {
    const result = []; let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    result.push(cur.trim());
    return result;
  }
  const headers = splitLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = splitLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  });
}

function mapCSVRow(row) {
  const obj = {};
  for (const [excelCol, dbCol] of Object.entries(COL_MAP)) {
    const val = String(row[excelCol] ?? "").trim();
    if (!val || val === "nan") { obj[dbCol] = null; }
    else if (NUMERIC_COLS.has(dbCol)) {
      const n = parseFloat(val);
      obj[dbCol] = isNaN(n) ? null : (n === Math.floor(n) ? Math.floor(n) : n);
    } else { obj[dbCol] = val; }
  }
  return obj;
}

// ── UI COMPONENTS ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#FF6B35", icon }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderLeft:`3px solid ${color}`, borderRadius:14, padding:"18px 20px", display:"flex", flexDirection:"column", gap:6, position:"relative", overflow:"hidden" }}>
      <div style={{ fontSize:24, position:"absolute", top:14, right:16, opacity:0.1 }}>{icon}</div>
      <span style={{ color:"rgba(255,255,255,0.4)", fontSize:10, letterSpacing:1, textTransform:"uppercase" }}>{label}</span>
      <span style={{ color:"#fff", fontSize:22, fontWeight:800, lineHeight:1 }}>{value}</span>
      {sub && <span style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>{sub}</span>}
    </div>
  );
}
function Card({ children, style }) {
  return <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:14, padding:22, border:"1px solid rgba(255,255,255,0.07)", ...style }}>{children}</div>;
}
function Sec({ children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
      <div style={{ width:3, height:20, background:"#FF6B35", borderRadius:2 }} />
      <h2 style={{ color:"#fff", fontSize:15, fontWeight:700, margin:0 }}>{children}</h2>
    </div>
  );
}
function Btn({ children, onClick, color="#FF6B35", small, outline, danger, disabled }) {
  const bg = danger?"rgba(231,76,60,0.15)":outline?"transparent":disabled?"rgba(255,255,255,0.08)":color;
  const bd = danger?"1px solid rgba(231,76,60,0.4)":outline?`1px solid ${color}`:"none";
  const tc = danger?"#e74c3c":outline?color:disabled?"rgba(255,255,255,0.3)":"#fff";
  return <button onClick={onClick} disabled={disabled} style={{ background:bg, border:bd, borderRadius:8, padding:small?"5px 11px":"8px 18px", color:tc, cursor:disabled?"default":"pointer", fontWeight:600, fontSize:small?11:13, fontFamily:"inherit" }}>{children}</button>;
}
function Inp({ value, onChange, type="text", placeholder="" }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.11)", borderRadius:8, padding:"8px 12px", color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" }} />;
}
function Sel({ value, onChange, options }) {
  return <select value={value} onChange={onChange} style={{ background:"#1e1b3a", border:"1px solid rgba(255,255,255,0.11)", borderRadius:8, padding:"8px 12px", color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit", width:"100%" }}>{options.map(o => <option key={o.value??o} value={o.value??o} style={{ background:"#1e1b3a" }}>{o.label??o}</option>)}</select>;
}
function Lbl({ children }) {
  return <span style={{ color:"rgba(255,255,255,0.4)", fontSize:10, letterSpacing:0.8, textTransform:"uppercase" }}>{children}</span>;
}
function Loading() {
  return <div style={{ padding:40, textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:14 }}>⏳ กำลังโหลดข้อมูล...</div>;
}
function Empty({ text = "ยังไม่มีข้อมูล — กรุณาอัพโหลด CSV ก่อน" }) {
  return <div style={{ padding:40, textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:13 }}>📭 {text}</div>;
}

// ── UPLOAD CSV BUTTON ─────────────────────────────────────────────────────────
function UploadCSVButton({ onUpload, uploading }) {
  return (
    <input
      type="file"
      accept=".csv"
      disabled={uploading}
      onChange={onUpload}
      title="อัพโหลด CSV"
      style={{
        background: uploading ? "rgba(255,255,255,0.08)" : "#004E89",
        border: "none",
        borderRadius: 8,
        padding: "8px 18px",
        color: "#fff",
        cursor: uploading ? "default" : "pointer",
        fontWeight: 600,
        fontSize: 13,
        fontFamily: "inherit",
        opacity: uploading ? 0.6 : 1,
      }}
    />
  );
}

// ── STATUS BADGE ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = { FINISH:["rgba(26,147,111,0.2)","#1A936F"], O:["rgba(255,107,53,0.2)","#FF6B35"], CALLED:["rgba(0,78,137,0.2)","#88D498"], C:["rgba(231,76,60,0.15)","#e74c3c"], W:["rgba(247,197,159,0.2)","#F7C59F"], RETURN:["rgba(231,76,60,0.15)","#e74c3c"], TRANSIT:["rgba(198,218,191,0.2)","#C6DABF"] };
  const [bg, color] = map[status] || ["rgba(255,255,255,0.08)","rgba(255,255,255,0.5)"];
  return <span style={{ background:bg, color, borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700 }}>{status||"–"}</span>;
}

// ── SHARED UPLOAD LOGIC ───────────────────────────────────────────────────────
function useCSVUpload(onSuccess) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [preview, setPreview] = useState(null);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadResult(null); setPreview(null);
    try {
      const text = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = ev => res(ev.target.result);
        reader.onerror = () => rej(new Error("อ่านไฟล์ไม่ได้"));
        reader.readAsText(file, "utf-8");
      });
      const rawRows = parseCSV(text);
      const mapped = rawRows.map(mapCSVRow).filter(r => r["เลขออเดอร์"]);
      if (!mapped.length) { setUploadResult({ error:"ไม่พบข้อมูล — ตรวจสอบรูปแบบ CSV" }); return; }
      setPreview({ rows: mapped, filename: file.name });
    } catch (err) { setUploadResult({ error: err.message }); }
    e.target.value = "";
  }

  async function confirmUpload() {
    if (!preview) return;
    setUploading(true); setUploadResult(null);
    const mapped = preview.rows;
    try {
      const existingNums = new Set();
      for (let i = 0; i < mapped.length; i += 100) {
        const chunk = mapped.slice(i, i+100).map(r => `"${r["เลขออเดอร์"]}"`).join(",");
        try {
          const res = await sbFetch(`/orders?select=เลขออเดอร์&เลขออเดอร์=in.(${chunk})`);
          res.forEach(r => existingNums.add(r["เลขออเดอร์"]));
        } catch {}
      }
      const newRows = mapped.filter(r => !existingNums.has(r["เลขออเดอร์"]));
      const dupCount = mapped.length - newRows.length;
      let inserted = 0;
      for (let i = 0; i < newRows.length; i += 100) {
        try {
          await sbFetch("/orders", { method:"POST", headers:{ "Prefer":"resolution=ignore-duplicates,return=minimal" }, body:JSON.stringify(newRows.slice(i, i+100)) });
          inserted += Math.min(100, newRows.length - i);
        } catch {}
      }
      setUploadResult({ total:mapped.length, added:inserted, duplicate:dupCount });
      setPreview(null);
      if (onSuccess) onSuccess();
    } catch (err) { setUploadResult({ error:err.message }); }
    setUploading(false);
  }

  return { uploading, uploadResult, handleUpload, confirmUpload, preview, clearPreview: () => setPreview(null) };
}

// ── UPLOAD RESULT BANNER ──────────────────────────────────────────────────────
function UploadBanner({ result, preview, onConfirm, onCancel, uploading }) {
  if (preview && !uploading) return (
    <div style={{ marginTop:12, padding:"14px 18px", borderRadius:10, background:"rgba(0,78,137,0.15)", border:"1px solid rgba(0,78,137,0.4)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          <span style={{ color:"#fff", fontSize:13 }}>📂 <strong>{preview.filename}</strong></span>
          <span style={{ color:"#88D498", fontSize:13 }}>📊 พบข้อมูล <strong>{preview.rows.length.toLocaleString()}</strong> รายการ</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onCancel} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, padding:"7px 16px", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>ยกเลิก</button>
          <button onClick={onConfirm} style={{ background:"#1A936F", border:"none", borderRadius:8, padding:"7px 20px", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit" }}>✅ ยืนยันอัพโหลด</button>
        </div>
      </div>
    </div>
  );
  if (uploading) return (
    <div style={{ marginTop:12, padding:"12px 18px", borderRadius:10, background:"rgba(255,107,53,0.1)", border:"1px solid rgba(255,107,53,0.3)", color:"#FF6B35", fontSize:13 }}>⏳ กำลังอัพโหลดข้อมูลเข้า Supabase...</div>
  );
  if (!result) return null;
  if (result.error) return <div style={{ marginTop:12, padding:"12px 16px", borderRadius:10, background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)", color:"#e74c3c", fontSize:13 }}>❌ {result.error}</div>;
  return (
    <div style={{ marginTop:12, padding:"12px 18px", borderRadius:10, background:"rgba(26,147,111,0.1)", border:"1px solid rgba(26,147,111,0.3)", display:"flex", gap:24, flexWrap:"wrap" }}>
      <span style={{ color:"#fff", fontSize:13 }}>📊 ทั้งหมด: <strong>{result.total}</strong></span>
      <span style={{ color:"#1A936F", fontSize:13 }}>✅ เพิ่มใหม่: <strong>{result.added}</strong></span>
      <span style={{ color:"#F7C59F", fontSize:13 }}>⚠️ ซ้ำ: <strong>{result.duplicate}</strong></span>
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginPage({ users, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  function handleLogin() {
    const found = users.find(u => u.username === username && u.password === password);
    if (found) { setError(""); onLogin(found); }
    else setError("Username หรือ Password ไม่ถูกต้อง");
  }
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sarabun','Noto Sans Thai',sans-serif" }}>
      <div style={{ width:360, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:40 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🐍</div>
          <div style={{ color:"#fff", fontWeight:800, fontSize:22 }}>Naka Beauty Group</div>
          <div style={{ color:"rgba(255,255,255,0.35)", fontSize:13, marginTop:4 }}>Management Dashboard</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div><Lbl>Username</Lbl><div style={{ marginTop:5 }}><Inp value={username} onChange={e => setUsername(e.target.value)} placeholder="username" /></div></div>
          <div><Lbl>Password</Lbl><div style={{ marginTop:5 }}><Inp value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••" /></div></div>
          {error && <div style={{ color:"#e74c3c", fontSize:12, textAlign:"center" }}>{error}</div>}
          <Btn onClick={handleLogin}>เข้าสู่ระบบ</Btn>
        </div>
        <div style={{ color:"rgba(255,255,255,0.2)", fontSize:11, textAlign:"center", marginTop:24 }}>ceo/1234 · account/1234 · qa/1234 · ads/1234 · store/1234</div>
      </div>
    </div>
  );
}

// ── OVERVIEW (from Supabase) ──────────────────────────────────────────────────
function OverviewPage() {
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const { uploading, uploadResult, handleUpload, confirmUpload, preview, clearPreview } = useCSVUpload(() => loadData());

  async function loadData() {
    setLoading(true);
    try {
      const rows = await sbFetch("/orders?select=ยอดรวม,ยอดขาย_admin,ช่องทาง,วันที่ทำรายการ,ลูกค้าใหม่_รีออเดอร์,ส่วนลด,ยอด_upsale&limit=5000");
      if (!rows.length) { setLoading(false); return; }

      const totalRevenue = rows.reduce((s,r) => s+(Number(r.ยอดรวม)||0), 0);
      const adminRevenue = rows.filter(r => !["CRM"].includes(r.ช่องทาง)).reduce((s,r) => s+(Number(r.ยอดรวม)||0), 0);
      const crmRevenue   = rows.filter(r => r.ช่องทาง === "CRM").reduce((s,r) => s+(Number(r.ยอดรวม)||0), 0);
      const newCust      = rows.filter(r => r.ลูกค้าใหม่_รีออเดอร์ === "ลูกค้าใหม่").length;
      const reorder      = rows.filter(r => r.ลูกค้าใหม่_รีออเดอร์ === "ลูกค้ารีออเดอร์").length;
      const discount     = rows.reduce((s,r) => s+(Number(r.ส่วนลด)||0), 0);

      setStats({ total_orders:rows.length, total_revenue:totalRevenue, admin_revenue:adminRevenue, crm_revenue:crmRevenue, new_customers:newCust, reorder_customers:reorder, total_discount:discount, avg_order:rows.length?Math.round(totalRevenue/rows.length):0 });

      // Daily
      const dayMap = {};
      rows.forEach(r => {
        const d = String(r.วันที่ทำรายการ||"").substring(0,5);
        if (!d) return;
        dayMap[d] = dayMap[d] || { date:d, orders:0, total:0 };
        dayMap[d].orders++;
        dayMap[d].total += Number(r.ยอดรวม)||0;
      });
      setDaily(Object.values(dayMap).sort((a,b) => a.date.localeCompare(b.date)));

      // Channels
      const chMap = {};
      rows.forEach(r => {
        const ch = r.ช่องทาง || "อื่นๆ";
        chMap[ch] = chMap[ch] || { channel:ch, orders:0, total:0 };
        chMap[ch].orders++;
        chMap[ch].total += Number(r.ยอดรวม)||0;
      });
      setChannels(Object.values(chMap).filter(c => c.total > 0).sort((a,b) => b.total-a.total));
    } catch(err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  if (loading) return <Loading />;

  if (!stats) return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <Card>
        <Sec>อัพโหลดข้อมูลคำสั่งซื้อ</Sec>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, marginBottom:16 }}>ยังไม่มีข้อมูลใน Supabase — อัพโหลด CSV เพื่อเริ่มต้น</p>
        <UploadCSVButton onUpload={handleUpload} uploading={uploading} />
        <UploadBanner result={uploadResult} preview={preview} onConfirm={confirmUpload} onCancel={clearPreview} uploading={uploading} />
      </Card>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ color:"rgba(255,255,255,0.3)", fontSize:12 }}>📊 ข้อมูลจาก Supabase · {stats.total_orders.toLocaleString()} ออเดอร์</span>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <UploadCSVButton onUpload={handleUpload} uploading={uploading} />
          <Btn outline small onClick={loadData}>🔄</Btn>
        </div>
      </div>
      <UploadBanner result={uploadResult} preview={preview} onConfirm={confirmUpload} onCancel={clearPreview} uploading={uploading} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:13 }}>
        <StatCard label="ยอดขายรวม"   value={`฿${fmtB(stats.total_revenue)}`}  sub={`${fmt(stats.total_revenue)} บาท`} icon="💰" color="#FF6B35" />
        <StatCard label="จำนวนออเดอร์" value={fmt(stats.total_orders)}            sub="รายการ" icon="📦" color="#004E89" />
        <StatCard label="AOV เฉลี่ย"   value={`฿${fmt(stats.avg_order)}`}         sub="ต่อออเดอร์" icon="📊" color="#1A936F" />
        <StatCard label="ยอด Admin"    value={`฿${fmtB(stats.admin_revenue)}`}    sub={`${stats.total_revenue>0?((stats.admin_revenue/stats.total_revenue)*100).toFixed(1):0}%`} icon="👩‍💼" color="#F7C59F" />
        <StatCard label="ยอด CRM"      value={`฿${fmtB(stats.crm_revenue)}`}      sub={`${stats.total_revenue>0?((stats.crm_revenue/stats.total_revenue)*100).toFixed(1):0}%`} icon="📞" color="#88D498" />
        <StatCard label="ลูกค้าใหม่"   value={fmt(stats.new_customers)}            sub={`${stats.total_orders>0?((stats.new_customers/stats.total_orders)*100).toFixed(1):0}%`} icon="🆕" color="#C6DABF" />
        <StatCard label="รีออเดอร์"    value={fmt(stats.reorder_customers)}        sub={`${stats.total_orders>0?((stats.reorder_customers/stats.total_orders)*100).toFixed(1):0}%`} icon="🔄" color="#EFEFD0" />
        <StatCard label="ส่วนลดรวม"   value={`฿${fmtB(stats.total_discount)}`}    sub="ยอดส่วนลด" icon="🏷️" color="#e74c3c" />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:18 }}>
        <Card>
          <Sec>ยอดขายรายวัน</Sec>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={daily}>
              <CartesianGrid {...GR} /><XAxis dataKey="date" tick={AX} /><YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}K`} tick={AX} />
              <Tooltip formatter={v=>`฿${fmt(v)}`} contentStyle={TT} />
              <Line type="monotone" dataKey="total" stroke="#FF6B35" strokeWidth={2.5} dot={{ fill:"#FF6B35", r:3 }} name="ยอดขาย" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <Sec>ช่องทางการขาย</Sec>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={channels} dataKey="total" nameKey="channel" cx="50%" cy="50%" outerRadius={80} label={({ channel, percent }) => `${channel} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {channels.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v=>`฿${fmt(v)}`} contentStyle={TT} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ── SELLER PAGE (Admin or CRM) ────────────────────────────────────────────────
function SellerPage({ type }) {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = type === "admin";
  const channelFilter = isAdmin ? ["FACEBOOK","INBCALL","LINEAD","อื่นๆ","INSTRAGRAM"] : ["CRM"];
  const accentColor = isAdmin ? "#FF6B35" : "#004E89";

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const rows = await sbFetch(`/orders?select=ผู้ขาย_username,ผู้ขาย_nickname,ชื่อผู้ขาย,ยอดรวม,ช่องทาง,ลูกค้าใหม่_รีออเดอร์,สั่งซื้อครั้งที่&limit=5000`);
        const filtered = rows.filter(r => isAdmin ? channelFilter.includes(r.ช่องทาง) : r.ช่องทาง === "CRM");
        const map = {};
        filtered.forEach(r => {
          const key = r.ผู้ขาย_username || r.ผู้ขาย_nickname || "ไม่ระบุ";
          if (!map[key]) map[key] = { username:key, nickname:r.ผู้ขาย_nickname||key, name:r.ชื่อผู้ขาย||key, orders:0, total:0, new_cust:0, reorder:0 };
          map[key].orders++;
          map[key].total += Number(r.ยอดรวม)||0;
          if (r.สั่งซื้อครั้งที่ <= 1) map[key].new_cust++;
          else map[key].reorder++;
        });
        const sorted = Object.values(map).sort((a,b) => b.total-a.total);
        sorted.forEach(s => { s.avg = s.orders ? Math.round(s.total/s.orders) : 0; });
        setSellers(sorted);
      } catch(err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [type]);

  if (loading) return <Loading />;
  if (!sellers.length) return <Empty />;

  const totalRevenue = sellers.reduce((s,r) => s+r.total, 0);
  const totalOrders  = sellers.reduce((s,r) => s+r.orders, 0);
  const maxTotal = Math.max(...sellers.map(s => s.total), 1);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:13 }}>
        <StatCard label={`ยอด ${isAdmin?"Admin":"CRM"} รวม`} value={`฿${fmtB(totalRevenue)}`} icon={isAdmin?"💼":"📞"} color={accentColor} />
        <StatCard label="ออเดอร์" value={fmt(totalOrders)} sub="รายการ" icon="📦" color="#004E89" />
        <StatCard label="AOV เฉลี่ย" value={`฿${fmt(totalOrders?Math.round(totalRevenue/totalOrders):0)}`} icon="💡" color="#1A936F" />
        <StatCard label={`ทีม ${isAdmin?"Admin":"CRM"}`} value={sellers.length} sub="คน" icon="👥" color="#F7C59F" />
      </div>
      <Card>
        <Sec>ยอดขายรายคน — Sale {isAdmin?"Admin":"CRM"}</Sec>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                {["#","Username","ชื่อ","ออเดอร์","ยอดรวม","AOV","ใหม่","รีออเดอร์","สัดส่วน"].map(h => (
                  <th key={h} style={{ padding:"9px 10px", textAlign:["ยอดรวม","AOV"].includes(h)?"right":["ออเดอร์","ใหม่","รีออเดอร์"].includes(h)?"center":"left", color:"rgba(255,255,255,0.3)", fontWeight:600, fontSize:10, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sellers.map((row, idx) => {
                const pct = Math.round((row.total/maxTotal)*100);
                return (
                  <tr key={row.username} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"11px 10px", color:"rgba(255,255,255,0.2)", fontSize:11 }}>{idx+1}</td>
                    <td style={{ padding:"11px 10px", color:"rgba(255,255,255,0.45)", fontSize:12 }}>{row.username}</td>
                    <td style={{ padding:"11px 10px", color:"#fff", fontWeight:600 }}>{row.name}</td>
                    <td style={{ padding:"11px 10px", textAlign:"center", color:"rgba(255,255,255,0.6)" }}>{row.orders}</td>
                    <td style={{ padding:"11px 10px", textAlign:"right", color:accentColor, fontWeight:700 }}>฿{fmt(row.total)}</td>
                    <td style={{ padding:"11px 10px", textAlign:"right", color:"rgba(255,255,255,0.5)" }}>฿{fmt(row.avg)}</td>
                    <td style={{ padding:"11px 10px", textAlign:"center", color:"#1A936F" }}>{row.new_cust}</td>
                    <td style={{ padding:"11px 10px", textAlign:"center", color:"#F7C59F" }}>{row.reorder}</td>
                    <td style={{ padding:"11px 10px", minWidth:100 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ flex:1, height:4, background:"rgba(255,255,255,0.08)", borderRadius:2 }}>
                          <div style={{ width:`${pct}%`, height:"100%", background:accentColor, borderRadius:2 }} />
                        </div>
                        <span style={{ color:"rgba(255,255,255,0.3)", fontSize:10, width:26 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <Card>
          <Sec>ยอดขายแต่ละคน</Sec>
          <ResponsiveContainer width="100%" height={Math.max(200, sellers.length * 32)}>
            <BarChart data={sellers.slice(0,10)} layout="vertical" barSize={14}>
              <CartesianGrid {...GR} /><XAxis type="number" tickFormatter={v=>`${(v/1000).toFixed(0)}K`} tick={AX} />
              <YAxis dataKey="name" type="category" tick={{ ...AX, fontSize:10 }} width={100} />
              <Tooltip formatter={v=>`฿${fmt(v)}`} contentStyle={TT} />
              <Bar dataKey="total" name="ยอดรวม" fill={accentColor} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <Sec>ลูกค้าใหม่ vs รีออเดอร์</Sec>
          <ResponsiveContainer width="100%" height={Math.max(200, sellers.length * 32)}>
            <BarChart data={sellers.slice(0,10)} barSize={12}>
              <CartesianGrid {...GR} /><XAxis dataKey="nickname" tick={{ ...AX, fontSize:10 }} /><YAxis tick={AX} />
              <Tooltip contentStyle={TT} /><Legend wrapperStyle={{ color:"rgba(255,255,255,0.5)", fontSize:12 }} />
              <Bar dataKey="new_cust" name="ลูกค้าใหม่" fill="#1A936F" radius={[4,4,0,0]} />
              <Bar dataKey="reorder"  name="รีออเดอร์"  fill="#F7C59F" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ── ORDERS PAGE ───────────────────────────────────────────────────────────────
const ORDER_COLS = [
  { key:"เลขออเดอร์", label:"เลขออเดอร์", w:150 },
  { key:"วันที่ทำรายการ", label:"วันที่", w:110 },
  { key:"ชื่อลูกค้า", label:"ชื่อลูกค้า", w:150 },
  { key:"สินค้า", label:"สินค้า", w:120 },
  { key:"ยอดรวม", label:"ยอดรวม", w:100 },
  { key:"ยอดขาย_admin", label:"ยอดขาย Admin", w:110 },
  { key:"ผู้ขาย_nickname", label:"ผู้ขาย", w:110 },
  { key:"ช่องทาง", label:"ช่องทาง", w:100 },
  { key:"สั่งซื้อครั้งที่", label:"ครั้งที่", w:70 },
  { key:"ลูกค้าใหม่_รีออเดอร์", label:"ประเภท", w:110 },
  { key:"สถานะ", label:"สถานะ", w:90 },
  { key:"ขนส่ง", label:"ขนส่ง", w:80 },
  { key:"tracking", label:"Tracking", w:130 },
  { key:"สถานะการชำระเงิน", label:"ชำระเงิน", w:90 },
  { key:"จังหวัด", label:"จังหวัด", w:100 },
];

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 100;
  const { uploading, uploadResult, handleUpload, confirmUpload, preview, clearPreview } = useCSVUpload(() => { setPage(0); loadOrders(0); });

  async function loadOrders(pageNum = 0) {
    setLoading(true);
    try {
      const data = await sbFetch(`/orders?select=*&order=วันที่ทำรายการ.desc&limit=${PAGE_SIZE}&offset=${pageNum * PAGE_SIZE}`);
      setOrders(data);
    } catch(err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { loadOrders(0); }, []);

  const filtered = orders.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return String(o.เลขออเดอร์||"").toLowerCase().includes(s) ||
           String(o.ชื่อลูกค้า||"").toLowerCase().includes(s) ||
           String(o.ผู้ขาย_nickname||"").toLowerCase().includes(s) ||
           String(o.สถานะ||"").toLowerCase().includes(s);
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div>
            <Sec>ข้อมูลคำสั่งซื้อ</Sec>
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12, marginTop:-10 }}>Supabase · {loading ? "กำลังโหลด..." : `${orders.length} รายการ (หน้า ${page+1})`}</div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหาเลขออเดอร์ / ชื่อ..."
              style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.11)", borderRadius:8, padding:"8px 14px", color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit", width:250 }} />
            <UploadCSVButton onUpload={handleUpload} uploading={uploading} />
            <Btn outline small onClick={() => loadOrders(page)}>🔄</Btn>
          </div>
        </div>
        <UploadBanner result={uploadResult} preview={preview} onConfirm={confirmUpload} onCancel={clearPreview} uploading={uploading} />
      </Card>

      <Card style={{ padding:0, overflow:"hidden" }}>
        {loading ? <Loading /> : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:"rgba(0,0,0,0.3)" }}>
                  {ORDER_COLS.map(col => (
                    <th key={col.key} style={{ padding:"10px 12px", textAlign:"left", color:"rgba(255,255,255,0.4)", fontWeight:600, fontSize:10, textTransform:"uppercase", whiteSpace:"nowrap", minWidth:col.w, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={ORDER_COLS.length}><Empty /></td></tr>
                ) : filtered.map((order, idx) => (
                  <tr key={order.เลขออเดอร์||idx} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background:idx%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                    {ORDER_COLS.map(col => (
                      <td key={col.key} style={{ padding:"9px 12px", color:"rgba(255,255,255,0.7)", whiteSpace:"nowrap", maxWidth:col.w, overflow:"hidden", textOverflow:"ellipsis" }}>
                        {col.key === "สถานะ" ? <StatusBadge status={order[col.key]} /> :
                         col.key === "ยอดรวม" || col.key === "ยอดขาย_admin" ? <span style={{ color:"#FF6B35", fontWeight:700 }}>฿{fmt(order[col.key])}</span> :
                         col.key === "เลขออเดอร์" ? <span style={{ color:"#88D498", fontWeight:600 }}>{order[col.key]}</span> :
                         String(order[col.key] ?? "–")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (
          <div style={{ padding:"12px 20px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:8, alignItems:"center" }}>
            <Btn small outline disabled={page===0} onClick={() => { const p=page-1; setPage(p); loadOrders(p); }}>← ก่อนหน้า</Btn>
            <span style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>หน้า {page+1}</span>
            <Btn small outline disabled={orders.length < PAGE_SIZE} onClick={() => { const p=page+1; setPage(p); loadOrders(p); }}>ถัดไป →</Btn>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── STORE PAGE ────────────────────────────────────────────────────────────────
function StorePage() {
  const [data, setData] = useState({ products:[], statuses:[], tracking:[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const rows = await sbFetch("/orders?select=สินค้า,สถานะ,ขนส่ง,tracking,เลขออเดอร์,ชื่อลูกค้า,จังหวัด&limit=5000");
        const productMap = {};
        rows.forEach(o => {
          String(o.สินค้า||"").split(",").forEach(item => {
            const m = item.trim().match(/^([A-Za-z0-9]+)=(\d+)/);
            if (m) productMap[m[1]] = (productMap[m[1]]||0) + parseInt(m[2]);
          });
        });
        const statusMap = {};
        rows.forEach(o => { const s=o.สถานะ||"ไม่ระบุ"; statusMap[s]=(statusMap[s]||0)+1; });
        const tracking = rows.filter(o => o.tracking && o.tracking !== "nan" && o.tracking !== "null" && o.tracking !== "");

        setData({
          products: Object.entries(productMap).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([sku,qty])=>({sku,qty})),
          statuses: Object.entries(statusMap).map(([status,count])=>({status,count})),
          tracking,
        });
      } catch(err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Loading />;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))", gap:13 }}>
        <StatCard label="ออเดอร์ทั้งหมด" value={fmt(data.statuses.reduce((s,r)=>s+r.count,0))} icon="📦" color="#FF6B35" />
        <StatCard label="มี Tracking"     value={fmt(data.tracking.length)} icon="🚚" color="#004E89" />
        <StatCard label="SKU สินค้า"      value={data.products.length} sub="รายการ" icon="🏷️" color="#1A936F" />
        <StatCard label="สถานะ FINISH"    value={fmt(data.statuses.find(s=>s.status==="FINISH")?.count||0)} icon="✅" color="#88D498" />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <Card>
          <Sec>สินค้าจากออเดอร์ (Top 10)</Sec>
          {data.products.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.products} layout="vertical" barSize={16}>
                <CartesianGrid {...GR} /><XAxis type="number" tick={AX} />
                <YAxis dataKey="sku" type="category" tick={{ ...AX, fontSize:11 }} width={70} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="qty" name="จำนวน" fill="#FF6B35" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty text="ไม่พบข้อมูลสินค้า" />}
        </Card>
        <Card>
          <Sec>สถานะออเดอร์</Sec>
          {data.statuses.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.statuses} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, percent }) => `${status} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {data.statuses.map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TT} />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty text="ไม่พบข้อมูลสถานะ" />}
        </Card>
      </div>
      <Card>
        <Sec>ติดตามพัสดุ ({fmt(data.tracking.length)} รายการ)</Sec>
        {data.tracking.length === 0 ? <Empty text="ไม่มี Tracking" /> : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                {["เลขออเดอร์","ชื่อลูกค้า","จังหวัด","ขนส่ง","Tracking","สถานะ"].map(h => (
                  <th key={h} style={{ padding:"9px 12px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:10, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {data.tracking.slice(0,50).map((o,idx) => (
                  <tr key={o.เลขออเดอร์||idx} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"9px 12px", color:"#88D498", fontWeight:600, fontSize:12 }}>{o.เลขออเดอร์}</td>
                    <td style={{ padding:"9px 12px", color:"#fff" }}>{o.ชื่อลูกค้า||"–"}</td>
                    <td style={{ padding:"9px 12px", color:"rgba(255,255,255,0.55)" }}>{o.จังหวัด||"–"}</td>
                    <td style={{ padding:"9px 12px", color:"rgba(255,255,255,0.55)" }}>{o.ขนส่ง||"–"}</td>
                    <td style={{ padding:"9px 12px", color:"#F7C59F", fontFamily:"monospace", fontSize:12 }}>{o.tracking}</td>
                    <td style={{ padding:"9px 12px" }}><StatusBadge status={o.สถานะ} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── ACCOUNT PAGE ──────────────────────────────────────────────────────────────
function AccountPage() {
  const [sellers, setSellers] = useState({ admin:[], crm:[] });
  const [loading, setLoading] = useState(true);
  const [adminTiers, setAdminTiers] = useState([{from:0,to:100000,rate:3},{from:100001,to:150000,rate:4},{from:150001,to:null,rate:5}]);
  const [crmTiers,   setCrmTiers]   = useState([{from:0,to:100000,rate:4},{from:100001,to:150000,rate:5},{from:150001,to:null,rate:6}]);
  const [method, setMethod] = useState("step");
  const [salaries, setSalaries] = useState({});
  const [subTab, setSubTab] = useState("commission");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const rows = await sbFetch("/orders?select=ผู้ขาย_username,ชื่อผู้ขาย,ยอดรวม,ช่องทาง&limit=5000");
        const adminMap = {}, crmMap = {};
        rows.forEach(r => {
          const key = r.ผู้ขาย_username||"ไม่ระบุ";
          const isAdmin = r.ช่องทาง !== "CRM";
          const map = isAdmin ? adminMap : crmMap;
          if (!map[key]) map[key] = { username:key, name:r.ชื่อผู้ขาย||key, total:0 };
          map[key].total += Number(r.ยอดรวม)||0;
        });
        setSellers({
          admin: Object.values(adminMap).sort((a,b)=>b.total-a.total),
          crm:   Object.values(crmMap).sort((a,b)=>b.total-a.total),
        });
      } catch(err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, []);

  function calcComm(total, tiers) {
    if (method === "flat") { const t=[...tiers].reverse().find(t=>total>=t.from); return t?Math.round(total*t.rate/100):0; }
    let c=0;
    for (const t of tiers) { const hi=t.to??Infinity; if(total<=t.from)break; c+=(Math.min(total,hi)-t.from)*t.rate/100; }
    return Math.round(c);
  }
  function updSal(username, val) { setSalaries(p => ({...p,[username]:Number(val)||0})); }
  function addTier(setter) { setter(p=>[...p,{from:(p[p.length-1]?.to??0)+1,to:null,rate:5}]); }
  function updTier(setter,idx,field,val) { setter(p=>p.map((t,i)=>i===idx?{...t,[field]:field==="rate"?Number(val):val===""?null:Number(val)}:t)); }
  function delTier(setter,idx) { setter(p=>p.filter((_,i)=>i!==idx)); }

  const aTotalC = sellers.admin.reduce((s,r)=>s+calcComm(r.total,adminTiers),0);
  const cTotalC = sellers.crm.reduce((s,r)=>s+calcComm(r.total,crmTiers),0);
  const aTotalS = sellers.admin.reduce((s,r)=>s+(salaries[r.username]||0),0);
  const cTotalS = sellers.crm.reduce((s,r)=>s+(salaries[r.username]||0),0);

  const TABS = [{key:"commission",label:"💰 คอมมิชชั่น"},{key:"salary",label:"💵 เงินเดือน"},{key:"summary",label:"📋 สรุป"}];

  function TierEditor({tiers, setter}) {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {tiers.map((tier,idx) => (
          <div key={idx} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:8, alignItems:"flex-end" }}>
            {[{l:"ยอดตั้งแต่",f:"from",v:tier.from},{l:"ยอดถึง",f:"to",v:tier.to??""},{l:"Rate %",f:"rate",v:tier.rate}].map(({l,f,v}) => (
              <div key={f}><Lbl>{l}</Lbl>
                <input type="number" value={v} placeholder={f==="to"?"ไม่จำกัด":""} onChange={e=>updTier(setter,idx,f,e.target.value)}
                  style={{ width:"100%", marginTop:4, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.11)", borderRadius:7, padding:"7px 10px", color:f==="rate"?"#FF6B35":"#fff", fontSize:13, fontWeight:f==="rate"?700:400, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
              </div>
            ))}
            <Btn small danger onClick={()=>delTier(setter,idx)}>ลบ</Btn>
          </div>
        ))}
        <div style={{ marginTop:6 }}><Btn outline small onClick={()=>addTier(setter)}>+ เพิ่ม Tier</Btn></div>
      </div>
    );
  }

  if (loading) return <Loading />;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))", gap:13 }}>
        <StatCard label="คอมมิชชั่น Admin" value={`฿${fmt(aTotalC)}`} icon="💼" color="#FF6B35" />
        <StatCard label="คอมมิชชั่น CRM"   value={`฿${fmt(cTotalC)}`} icon="📞" color="#004E89" />
        <StatCard label="เงินเดือนรวม"      value={`฿${fmt(aTotalS+cTotalS)}`} icon="💵" color="#1A936F" />
        <StatCard label="COL รวม"           value={`฿${fmt(aTotalC+cTotalC+aTotalS+cTotalS)}`} icon="👥" color="#e74c3c" />
      </div>
      <div style={{ display:"flex", background:"rgba(0,0,0,0.2)", borderRadius:10, padding:4, width:"fit-content" }}>
        {TABS.map(t => <button key={t.key} onClick={()=>setSubTab(t.key)} style={{ background:subTab===t.key?"rgba(255,107,53,0.2)":"transparent", border:"none", borderRadius:8, padding:"7px 15px", color:subTab===t.key?"#FF6B35":"rgba(255,255,255,0.4)", cursor:"pointer", fontWeight:subTab===t.key?700:400, fontSize:13, fontFamily:"inherit" }}>{t.label}</button>)}
      </div>
      {subTab==="commission" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card>
            <Sec>วิธีคำนวณ</Sec>
            <div style={{ display:"flex", gap:8 }}>
              {[{v:"step",l:"แบบขั้นบันได"},{v:"flat",l:"แบบทั้งก้อน"}].map(m => (
                <button key={m.v} onClick={()=>setMethod(m.v)} style={{ background:method===m.v?"rgba(255,107,53,0.2)":"transparent", border:`1px solid ${method===m.v?"#FF6B35":"rgba(255,255,255,0.15)"}`, borderRadius:8, padding:"6px 14px", color:method===m.v?"#FF6B35":"rgba(255,255,255,0.45)", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>{m.l}</button>
              ))}
            </div>
          </Card>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
            <Card><Sec>Admin — ขั้นบันได</Sec><TierEditor tiers={adminTiers} setter={setAdminTiers} /></Card>
            <Card><Sec>CRM — ขั้นบันได</Sec><TierEditor tiers={crmTiers} setter={setCrmTiers} /></Card>
          </div>
        </div>
      )}
      {subTab==="salary" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
          {[{label:"Sale Admin",data:sellers.admin},{label:"Sale CRM",data:sellers.crm}].map(g => (
            <Card key={g.label}>
              <Sec>เงินเดือน — {g.label}</Sec>
              {g.data.length === 0 ? <Empty /> : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                    {["ชื่อ","เงินเดือน (฿)"].map(h => <th key={h} style={{ padding:"9px 10px", textAlign:h==="เงินเดือน (฿)"?"right":"left", color:"rgba(255,255,255,0.3)", fontSize:10, textTransform:"uppercase" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {g.data.map(s => (
                      <tr key={s.username} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding:"10px 10px", color:"#fff" }}>{s.name}</td>
                        <td style={{ padding:"10px 10px" }}>
                          <input type="number" value={salaries[s.username]||0} onChange={e=>updSal(s.username,e.target.value)}
                            style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, padding:"6px 10px", color:"#F7C59F", fontSize:13, fontWeight:700, outline:"none", fontFamily:"inherit", textAlign:"right", boxSizing:"border-box" }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          ))}
        </div>
      )}
      {subTab==="summary" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
          {[{label:"Sale Admin",data:sellers.admin,tiers:adminTiers},{label:"Sale CRM",data:sellers.crm,tiers:crmTiers}].map(g => (
            <Card key={g.label}>
              <Sec>สรุป — {g.label}</Sec>
              {g.data.length === 0 ? <Empty /> : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                    {["ชื่อ","ยอดขาย","เงินเดือน","คอมมิชชั่น","รวม"].map(h => <th key={h} style={{ padding:"9px 8px", textAlign:h==="ชื่อ"?"left":"right", color:"rgba(255,255,255,0.3)", fontSize:10, textTransform:"uppercase" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {g.data.map(s => {
                      const comm = calcComm(s.total, g.tiers);
                      const sal  = salaries[s.username]||0;
                      return (
                        <tr key={s.username} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding:"10px 8px", color:"#fff", fontWeight:600 }}>{s.name}</td>
                          <td style={{ padding:"10px 8px", textAlign:"right", color:"rgba(255,255,255,0.5)" }}>฿{fmt(s.total)}</td>
                          <td style={{ padding:"10px 8px", textAlign:"right", color:"#F7C59F" }}>฿{fmt(sal)}</td>
                          <td style={{ padding:"10px 8px", textAlign:"right", color:"#FF6B35" }}>฿{fmt(comm)}</td>
                          <td style={{ padding:"10px 8px", textAlign:"right", color:"#fff", fontWeight:700 }}>฿{fmt(sal+comm)}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ borderTop:"2px solid rgba(255,255,255,0.12)" }}>
                      <td style={{ padding:"11px 8px", color:"#fff", fontWeight:700 }}>รวม</td>
                      <td style={{ padding:"11px 8px", textAlign:"right", color:"rgba(255,255,255,0.5)", fontWeight:700 }}>฿{fmt(g.data.reduce((s,r)=>s+r.total,0))}</td>
                      <td style={{ padding:"11px 8px", textAlign:"right", color:"#F7C59F", fontWeight:700 }}>฿{fmt(g.data.reduce((s,r)=>s+(salaries[r.username]||0),0))}</td>
                      <td style={{ padding:"11px 8px", textAlign:"right", color:"#FF6B35", fontWeight:700 }}>฿{fmt(g.data.reduce((s,r)=>s+calcComm(r.total,g.tiers),0))}</td>
                      <td style={{ padding:"11px 8px", textAlign:"right", color:"#fff", fontWeight:800, fontSize:14 }}>฿{fmt(g.data.reduce((s,r)=>s+(salaries[r.username]||0)+calcComm(r.total,g.tiers),0))}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── P&L PAGE ──────────────────────────────────────────────────────────────────
function PLPage() {
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cogsPct, setCogsPct] = useState(35);
  const [comItems, setComItems] = useState([{id:1,label:"Facebook Ads",amount:0},{id:2,label:"Google Ads",amount:0}]);
  const [colItems, setColItems] = useState([{id:1,label:"เงินเดือน Admin",amount:0},{id:2,label:"คอมมิชชั่น Admin",amount:0},{id:3,label:"เงินเดือน CRM",amount:0},{id:4,label:"คอมมิชชั่น CRM",amount:0}]);
  const [coaItems, setCoaItems] = useState([{id:1,label:"ค่าสำนักงาน",amount:0},{id:2,label:"ค่าน้ำ/ไฟ",amount:0},{id:3,label:"ค่าใช้จ่ายอื่นๆ",amount:0}]);

  useEffect(() => {
    async function load() {
      try {
        const rows = await sbFetch("/orders?select=ยอดรวม,ค่าส่ง&limit=5000");
        const rev = rows.reduce((s,r) => s+(Number(r.ยอดรวม)||0), 0);
        setRevenue(rev);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  function addI(setter) { setter(p=>[...p,{id:Date.now(),label:"รายการใหม่",amount:0}]); }
  function updI(setter,id,f,v) { setter(p=>p.map(x=>x.id===id?{...x,[f]:f==="amount"?Number(v)||0:v}:x)); }
  function delI(setter,id) { setter(p=>p.filter(x=>x.id!==id)); }

  const cop = Math.round(revenue * cogsPct / 100);
  const com = comItems.reduce((s,r)=>s+r.amount,0);
  const col = colItems.reduce((s,r)=>s+r.amount,0);
  const coa = coaItems.reduce((s,r)=>s+r.amount,0);
  const grossProfit = revenue - cop;
  const netProfit   = grossProfit - com - col - coa;

  function CostSec({title, code, color, items, setter}) {
    return (
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:3, height:20, background:color, borderRadius:2 }} />
            <span style={{ color, fontWeight:800, fontSize:13 }}>{code}</span>
            <span style={{ color:"rgba(255,255,255,0.55)", fontSize:13, marginLeft:6 }}>{title}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ color, fontWeight:700 }}>฿{fmt(items.reduce((s,r)=>s+r.amount,0))}</span>
            <Btn small outline onClick={()=>addI(setter)}>+ เพิ่ม</Btn>
          </div>
        </div>
        {items.map(item => (
          <div key={item.id} style={{ display:"grid", gridTemplateColumns:"1fr 150px auto", gap:8, marginBottom:8, alignItems:"center" }}>
            <input value={item.label} onChange={e=>updI(setter,item.id,"label",e.target.value)} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, padding:"7px 10px", color:"rgba(255,255,255,0.8)", fontSize:13, outline:"none", fontFamily:"inherit" }} />
            <input type="number" value={item.amount} onChange={e=>updI(setter,item.id,"amount",e.target.value)} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, padding:"7px 10px", color, fontSize:13, fontWeight:700, outline:"none", fontFamily:"inherit", textAlign:"right" }} />
            <Btn small danger onClick={()=>delI(setter,item.id)}>ลบ</Btn>
          </div>
        ))}
      </Card>
    );
  }

  if (loading) return <Loading />;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:13 }}>
        <StatCard label="รายได้รวม (Supabase)"  value={`฿${fmtB(revenue)}`}       icon="📈" color="#1A936F" />
        <StatCard label="Gross Profit"  value={`฿${fmtB(grossProfit)}`}  sub={`${revenue>0?((grossProfit/revenue)*100).toFixed(1):0}%`} icon="💹" color="#88D498" />
        <StatCard label="Net Profit"    value={`฿${fmtB(netProfit)}`}    sub={`${revenue>0?((netProfit/revenue)*100).toFixed(1):0}%`} icon={netProfit>=0?"✅":"⚠️"} color={netProfit>=0?"#1A936F":"#e74c3c"} />
        <StatCard label="รวมค่าใช้จ่าย" value={`฿${fmtB(cop+com+col+coa)}`} icon="💸" color="#e74c3c" />
      </div>
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:3, height:20, background:"#F7C59F", borderRadius:2 }} />
            <span style={{ color:"#F7C59F", fontWeight:800 }}>COP</span>
            <span style={{ color:"rgba(255,255,255,0.55)", marginLeft:6 }}>ต้นทุนสินค้า (COGS)</span>
          </div>
          <span style={{ color:"#F7C59F", fontWeight:700 }}>฿{fmt(cop)}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><Lbl>COGS %</Lbl><span style={{ color:"#F7C59F", fontWeight:700 }}>{cogsPct}%</span></div>
            <input type="range" min={0} max={80} step={1} value={cogsPct} onChange={e=>setCogsPct(Number(e.target.value))} style={{ width:"100%", accentColor:"#F7C59F" }} />
          </div>
          <div style={{ textAlign:"right", minWidth:160 }}>
            <div style={{ color:"rgba(255,255,255,0.45)", fontSize:12 }}>ต้นทุนสินค้า: <span style={{ color:"#F7C59F", fontWeight:700 }}>฿{fmt(cop)}</span></div>
            <div style={{ color:"rgba(255,255,255,0.45)", fontSize:12, marginTop:4 }}>จากรายได้: <span style={{ color:"#F7C59F", fontWeight:700 }}>฿{fmt(revenue)}</span></div>
          </div>
        </div>
      </Card>
      <CostSec title="ต้นทุนค่าการตลาดโฆษณา"    code="COM" color="#FF6B35" items={comItems} setter={setComItems} />
      <CostSec title="ต้นทุนค่าแรงและคอมมิชชั่น" code="COL" color="#88D498" items={colItems} setter={setColItems} />
      <CostSec title="ต้นทุนค่าบริหารจัดการ"      code="COA" color="#C6DABF" items={coaItems} setter={setCoaItems} />
    </div>
  );
}

// ── ADS PAGE ──────────────────────────────────────────────────────────────────
function AdsPage() {
  const [revenue, setRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ date:"", platform:"Facebook Ads", amount:"" });

  useEffect(() => {
    async function load() {
      try {
        const rows = await sbFetch("/orders?select=ยอดรวม&limit=5000");
        setRevenue(rows.reduce((s,r)=>s+(Number(r.ยอดรวม)||0),0));
        setTotalOrders(rows.length);
      } catch {}
    }
    load();
  }, []);

  const totalAds = entries.reduce((s,e)=>s+(Number(e.amount)||0), 0);
  const roas = totalAds > 0 ? (revenue/totalAds).toFixed(2) : "–";
  const cpo  = totalAds > 0 && totalOrders > 0 ? fmt(Math.round(totalAds/totalOrders)) : "–";

  function addEntry() {
    if (!form.date||!form.amount) return;
    setEntries(p=>[...p,{...form,amount:Number(form.amount),id:Date.now()}]);
    setForm(p=>({...p,date:"",amount:""}));
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))", gap:13 }}>
        <StatCard label="ค่าโฆษณารวม"  value={totalAds>0?`฿${fmtB(totalAds)}`:"–"} icon="📢" color="#e74c3c" />
        <StatCard label="ROAS"          value={roas} sub={roas!=="–"?"x บาทต่อบาทโฆษณา":"รอข้อมูล"} icon="📈" color="#FF6B35" />
        <StatCard label="CPO"           value={cpo!=="–"?`฿${cpo}`:"–"} sub="ต้นทุนต่อออเดอร์" icon="🎯" color="#004E89" />
        <StatCard label="ยอดขาย (SB)"  value={`฿${fmtB(revenue)}`} icon="💰" color="#1A936F" />
      </div>
      <Card>
        <Sec>บันทึกค่าโฆษณา</Sec>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:10, marginBottom:16, alignItems:"flex-end" }}>
          <div><Lbl>วันที่</Lbl><div style={{ marginTop:4 }}><Inp type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} /></div></div>
          <div><Lbl>แพลตฟอร์ม</Lbl><div style={{ marginTop:4 }}><Sel value={form.platform} onChange={e=>setForm(p=>({...p,platform:e.target.value}))} options={["Facebook Ads","Google Ads","TikTok Ads","LINE Ads","อื่นๆ"]} /></div></div>
          <div><Lbl>จำนวนเงิน (฿)</Lbl><div style={{ marginTop:4 }}><Inp type="number" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} /></div></div>
          <Btn onClick={addEntry}>+ เพิ่ม</Btn>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
            {["วันที่","แพลตฟอร์ม","จำนวนเงิน",""].map(h=><th key={h} style={{ padding:"9px 10px", textAlign:h==="จำนวนเงิน"?"right":"left", color:"rgba(255,255,255,0.3)", fontSize:10, textTransform:"uppercase" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {entries.map(e=>(
              <tr key={e.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding:"10px 10px", color:"rgba(255,255,255,0.55)" }}>{e.date}</td>
                <td style={{ padding:"10px 10px", color:"#fff" }}>{e.platform}</td>
                <td style={{ padding:"10px 10px", textAlign:"right", color:"#FF6B35", fontWeight:700 }}>฿{fmt(e.amount)}</td>
                <td style={{ padding:"10px 10px" }}><Btn small danger onClick={()=>setEntries(p=>p.filter(x=>x.id!==e.id))}>ลบ</Btn></td>
              </tr>
            ))}
            {entries.length===0&&<tr><td colSpan={4} style={{ padding:"24px", textAlign:"center", color:"rgba(255,255,255,0.2)" }}>ยังไม่มีรายการ</td></tr>}
            {entries.length>0&&<tr style={{ borderTop:"2px solid rgba(255,255,255,0.12)" }}>
              <td colSpan={2} style={{ padding:"12px", color:"#fff", fontWeight:700 }}>รวม</td>
              <td style={{ padding:"12px", textAlign:"right", color:"#FF6B35", fontWeight:800, fontSize:15 }}>฿{fmt(totalAds)}</td>
              <td />
            </tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── QA PAGE ───────────────────────────────────────────────────────────────────
function QAPage() {
  const [files, setFiles] = useState([]);
  const [analyses, setAnalyses] = useState({});
  const [loading, setLoading] = useState({});

  async function analyzeFile(entry) {
    setLoading(p=>({...p,[entry.id]:true}));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:`คุณเป็น QA Supervisor ของทีม CRM บริษัทขายอาหารเสริม Lab Farm และ BETALIFE\n\nไฟล์เสียง: "${entry.name}"\n\nประเมิน 4 หัวข้อ (0-10):\n1. ความสุภาพและการทักทาย\n2. การนำเสนอสินค้า\n3. การจัดการข้อโต้แย้ง\n4. การปิดการขาย\n\nสรุปคะแนนรวมและข้อแนะนำ ตอบเป็นภาษาไทย`}]}) });
      const data = await res.json();
      setAnalyses(p=>({...p,[entry.id]:data.content?.filter(b=>b.type==="text").map(b=>b.text).join("\n")||"ไม่สามารถวิเคราะห์ได้"}));
    } catch { setAnalyses(p=>({...p,[entry.id]:"เกิดข้อผิดพลาด"})); }
    setLoading(p=>({...p,[entry.id]:false}));
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <Card>
        <Sec>อัพโหลดไฟล์เสียง QA</Sec>
        <label onMouseEnter={e=>e.currentTarget.style.borderColor="#FF6B35"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"}
          style={{ display:"block", border:"2px dashed rgba(255,255,255,0.12)", borderRadius:12, padding:"34px 24px", textAlign:"center", cursor:"pointer", transition:"border-color 0.2s" }}>
          <div style={{ fontSize:34, marginBottom:8 }}>🎙️</div>
          <div style={{ color:"#fff", fontWeight:600, marginBottom:4 }}>คลิกเพื่ออัพโหลดไฟล์เสียง</div>
          <div style={{ color:"rgba(255,255,255,0.3)", fontSize:12 }}>MP3, WAV, M4A, OGG</div>
          <input type="file" accept="audio/*" multiple onChange={e=>setFiles(p=>[...p,...Array.from(e.target.files).map((f,i)=>({file:f,id:Date.now()+i,name:f.name,size:f.size}))])}
            style={{ display:"block", margin:"12px auto 0", cursor:"pointer", color:"rgba(255,255,255,0.6)", fontSize:13 }} />
        </label>
      </Card>
      {files.map(entry=>(
        <Card key={entry.id}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>🎧</span>
              <div><div style={{ color:"#fff", fontWeight:600, fontSize:13 }}>{entry.name}</div><div style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>{(entry.size/1024).toFixed(1)} KB</div></div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn onClick={()=>analyzeFile(entry)} color="#004E89" disabled={loading[entry.id]}>{loading[entry.id]?"⏳ กำลังวิเคราะห์...":"🔍 วิเคราะห์ AI"}</Btn>
              <Btn small danger onClick={()=>setFiles(p=>p.filter(f=>f.id!==entry.id))}>ลบ</Btn>
            </div>
          </div>
          {analyses[entry.id]&&<div style={{ background:"rgba(0,0,0,0.25)", borderRadius:10, padding:16, borderLeft:"3px solid #004E89" }}><div style={{ color:"rgba(255,255,255,0.35)", fontSize:10, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>ผลวิเคราะห์ AI</div><div style={{ color:"rgba(255,255,255,0.85)", fontSize:13, lineHeight:1.9, whiteSpace:"pre-wrap" }}>{analyses[entry.id]}</div></div>}
        </Card>
      ))}
      {files.length===0&&<div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.2)", fontSize:14 }}>ยังไม่มีไฟล์เสียง</div>}
    </div>
  );
}

// ── SETTINGS PAGE ─────────────────────────────────────────────────────────────
function SettingsPage({ users, setUsers }) {
  const [newUser, setNewUser] = useState({ name:"", username:"", role:"account", password:"" });
  const allRoles = ["admin","account","qa","warehouse","ads","store"];
  const menuLabels = { overview:"Overview", admin:"Sale Admin", crm:"Sale CRM", ads:"Ads", qa:"QA", account:"Account", pl:"P&L", orders:"คำสั่งซื้อ", store:"Store", settings:"Settings" };

  function addUser() {
    if (!newUser.name||!newUser.username||!newUser.password) return;
    setUsers(p=>[...p,{...newUser,id:Date.now()}]);
    setNewUser({name:"",username:"",role:"account",password:""});
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <Card>
        <Sec>เพิ่มผู้ใช้งาน</Sec>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:10, alignItems:"flex-end" }}>
          {[{l:"ชื่อ",k:"name"},{l:"Username",k:"username"},{l:"Password",k:"password"}].map(f=>(
            <div key={f.k}><Lbl>{f.l}</Lbl><div style={{ marginTop:4 }}><Inp value={newUser[f.k]} onChange={e=>setNewUser(p=>({...p,[f.k]:e.target.value}))} /></div></div>
          ))}
          <div><Lbl>Role</Lbl><div style={{ marginTop:4 }}><Sel value={newUser.role} onChange={e=>setNewUser(p=>({...p,role:e.target.value}))} options={allRoles.map(r=>({value:r,label:ROLE_LABELS[r]}))} /></div></div>
          <Btn onClick={addUser}>+ เพิ่ม</Btn>
        </div>
      </Card>
      <Card>
        <Sec>ผู้ใช้งานทั้งหมด</Sec>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
            {["ชื่อ","Username","Role","สิทธิ์เมนู",""].map(h=><th key={h} style={{ padding:"9px 10px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:10, textTransform:"uppercase" }}>{h}</th>)}
          </tr></thead>
          <tbody>{users.map(u=>(
            <tr key={u.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <td style={{ padding:"11px 10px", color:"#fff", fontWeight:600 }}>{u.name}</td>
              <td style={{ padding:"11px 10px", color:"rgba(255,255,255,0.45)" }}>{u.username}</td>
              <td style={{ padding:"11px 10px" }}><span style={{ background:"rgba(255,107,53,0.15)", color:"#FF6B35", borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:700 }}>{ROLE_LABELS[u.role]}</span></td>
              <td style={{ padding:"11px 10px" }}><div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>{(ROLE_MENUS[u.role]||[]).map(m=><span key={m} style={{ background:"rgba(0,78,137,0.2)", color:"#88D498", borderRadius:5, padding:"1px 7px", fontSize:10 }}>{menuLabels[m]}</span>)}</div></td>
              <td style={{ padding:"11px 10px" }}>{u.username!=="ceo"&&<Btn small danger onClick={()=>setUsers(p=>p.filter(x=>x.id!==u.id))}>ลบ</Btn>}</td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ currentUser, activePage, onNavigate, onLogout, collapsed, onToggleCollapse, allowedMenus }) {
  const visible = MENUS.filter(m => allowedMenus.includes(m.key));
  return (
    <div style={{ width:collapsed?62:218, minHeight:"100vh", background:"rgba(0,0,0,0.38)", backdropFilter:"blur(20px)", borderRight:"1px solid rgba(255,255,255,0.07)", display:"flex", flexDirection:"column", flexShrink:0, transition:"width 0.22s", position:"sticky", top:0, height:"100vh", zIndex:100 }}>
      <div style={{ padding:collapsed?"18px 0":"18px 18px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:10, justifyContent:collapsed?"center":"flex-start", minHeight:64 }}>
        <div style={{ width:34, height:34, background:"linear-gradient(135deg,#FF6B35,#f7c59f)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>🐍</div>
        {!collapsed&&<div><div style={{ color:"#fff", fontWeight:800, fontSize:13, lineHeight:1.2 }}>Naka Beauty</div><div style={{ color:"rgba(255,255,255,0.3)", fontSize:10 }}>Management</div></div>}
      </div>
      <nav style={{ flex:1, padding:"10px 0", overflowY:"auto" }}>
        {visible.map(menu => {
          const active = activePage === menu.key;
          return (
            <button key={menu.key} onClick={()=>onNavigate(menu.key)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:collapsed?"10px 0":"10px 18px", justifyContent:collapsed?"center":"flex-start", background:active?"rgba(255,107,53,0.13)":"transparent", border:"none", borderLeft:active?"3px solid #FF6B35":"3px solid transparent", color:active?"#FF6B35":"rgba(255,255,255,0.45)", cursor:"pointer", fontWeight:active?700:400, fontSize:13, fontFamily:"inherit", transition:"all 0.18s" }}>
              <span style={{ fontSize:15, flexShrink:0 }}>{menu.icon}</span>
              {!collapsed&&<span>{menu.label}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:collapsed?"14px 0":"14px 18px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
        {!collapsed&&<div style={{ marginBottom:10 }}><div style={{ color:"#fff", fontWeight:600, fontSize:13 }}>{currentUser.name}</div><div style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>{ROLE_LABELS[currentUser.role]}</div></div>}
        <button onClick={onLogout} style={{ width:"100%", background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.25)", borderRadius:8, padding:"7px", color:"#e74c3c", cursor:"pointer", fontSize:12, fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>{collapsed?"🚪":"🚪 ออกจากระบบ"}</button>
      </div>
      <button onClick={onToggleCollapse} style={{ position:"absolute", top:"50%", right:-11, transform:"translateY(-50%)", width:22, height:22, background:"#302b63", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"50%", color:"rgba(255,255,255,0.45)", cursor:"pointer", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center" }}>{collapsed?"›":"‹"}</button>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [users, setUsers] = useState([
    { id:1, name:"สันติภาพ", username:"ceo",       role:"admin",    password:"1234" },
    { id:2, name:"บัญชี",    username:"account",   role:"account",  password:"1234" },
    { id:3, name:"QA",       username:"qa",        role:"qa",       password:"1234" },
    { id:4, name:"คลัง",     username:"warehouse", role:"warehouse",password:"1234" },
    { id:5, name:"Ads",      username:"ads",       role:"ads",      password:"1234" },
    { id:6, name:"Store",    username:"store",     role:"store",    password:"1234" },
  ]);

  function handleLogin(user) { setCurrentUser(user); setActivePage(ROLE_MENUS[user.role]?.[0]||"overview"); }

  if (!currentUser) return <LoginPage users={users} onLogin={handleLogin} />;

  const allowedMenus = ROLE_MENUS[currentUser.role] || [];
  const pageTitle = MENUS.find(m => m.key === activePage);

  const pageMap = {
    overview: <OverviewPage />,
    admin:    <SellerPage type="admin" />,
    crm:      <SellerPage type="crm" />,
    ads:      <AdsPage />,
    qa:       <QAPage />,
    account:  <AccountPage />,
    pl:       <PLPage />,
    orders:   <OrdersPage />,
    store:    <StorePage />,
    settings: <SettingsPage users={users} setUsers={setUsers} />,
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)", fontFamily:"'Sarabun','Noto Sans Thai',sans-serif", display:"flex" }}>
      <Sidebar currentUser={currentUser} activePage={activePage} onNavigate={setActivePage} onLogout={()=>setCurrentUser(null)} collapsed={collapsed} onToggleCollapse={()=>setCollapsed(p=>!p)} allowedMenus={allowedMenus} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"0 26px", height:54, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50, backdropFilter:"blur(10px)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:17 }}>{pageTitle?.icon}</span>
            <span style={{ color:"#fff", fontWeight:700, fontSize:15 }}>{pageTitle?.label}</span>
          </div>
          <div style={{ background:"rgba(26,147,111,0.14)", border:"1px solid rgba(26,147,111,0.28)", borderRadius:20, padding:"3px 11px", fontSize:11, color:"#88D498" }}>● Supabase Live</div>
        </div>
        <div style={{ flex:1, padding:"26px", overflowY:"auto" }}>
          {pageMap[activePage]}
        </div>
      </div>
    </div>
  );
}
