import { useState, useEffect, useRef, useCallback } from "react";

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  teal900: "#04342C", teal800: "#085041", teal600: "#0F6E56",
  teal400: "#1D9E75", teal200: "#5DCAA5", teal100: "#9FE1CB", teal50: "#E1F5EE",
  slate900: "#0f172a", slate800: "#1e293b", slate700: "#334155",
  slate600: "#475569", slate500: "#64748b", slate400: "#94a3b8",
  slate200: "#e2e8f0", slate100: "#f1f5f9", slate50: "#f8fafc",
  amber400: "#f59e0b", amber100: "#fef3c7", amber50: "#fffbeb",
  red500: "#ef4444", red100: "#fee2e2", red50: "#fef2f2",
  blue500: "#3b82f6", blue100: "#dbeafe", blue50: "#eff6ff",
  white: "#ffffff",
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_PATIENTS = [
  { id: 1, name: "Thabo Nkosi", dob: "1968-03-14", id_no: "6803145678091", gender: "Male", phone: "071 234 5678", medical_aid: "Discovery Health", plan: "Comprehensive", aid_no: "DH-4523891", icd10: ["J45", "E11"], allergies: ["Penicillin"], last_visit: "2025-04-20", balance: 1250, status: "active" },
  { id: 2, name: "Nomsa Dlamini", dob: "1982-07-22", id_no: "8207221234083", gender: "Female", phone: "082 987 6543", medical_aid: "Bonitas", plan: "BonStart", aid_no: "BON-77334", icd10: ["K21", "F32"], allergies: [], last_visit: "2025-04-28", balance: 0, status: "active" },
  { id: 3, name: "Pieter van der Merwe", dob: "1955-11-05", id_no: "5511055512089", gender: "Male", phone: "083 456 7890", medical_aid: "Medihelp", plan: "Necesse", aid_no: "MH-19283", icd10: ["I10", "E78", "N18"], allergies: ["Sulfonamides", "Aspirin"], last_visit: "2025-03-15", balance: 3400, status: "overdue" },
  { id: 4, name: "Ayesha Patel", dob: "1991-02-28", id_no: "9102284567086", gender: "Female", phone: "076 321 0987", medical_aid: "None", plan: "Self-pay", aid_no: "—", icd10: ["O26"], allergies: [], last_visit: "2025-04-30", balance: 850, status: "active" },
  { id: 5, name: "Lungelo Cele", dob: "2008-09-17", id_no: "0809175678023", gender: "Male", phone: "061 111 2222", medical_aid: "GEMS", plan: "Beryl", aid_no: "GEMS-55123", icd10: ["J30", "L20"], allergies: ["Latex"], last_visit: "2025-04-10", balance: 0, status: "active" },
];

const MOCK_BILLING = [
  { id: "INV-2025-0041", patient: "Thabo Nkosi", date: "2025-04-20", items: [{ code: "0190", desc: "Consultation (complex)", amount: 980 }, { code: "3615", desc: "ECG 12-lead", amount: 420 }], total: 1400, paid: 150, aid: "Discovery Health", status: "partial" },
  { id: "INV-2025-0040", patient: "Nomsa Dlamini", date: "2025-04-28", items: [{ code: "0190", desc: "Consultation (moderate)", amount: 680 }], total: 680, paid: 680, aid: "Bonitas", status: "paid" },
  { id: "INV-2025-0039", patient: "Ayesha Patel", date: "2025-04-30", items: [{ code: "0190", desc: "Antenatal consultation", amount: 720 }, { code: "4271", desc: "Ultrasound obstetric", amount: 1200 }], total: 1920, paid: 1070, aid: "Self-pay", status: "partial" },
  { id: "INV-2025-0038", patient: "Pieter van der Merwe", date: "2025-03-15", items: [{ code: "0190", desc: "Consultation (complex)", amount: 980 }, { code: "3601", desc: "Full blood count", amount: 280 }, { code: "3604", desc: "Lipogram", amount: 320 }], total: 1580, paid: 0, aid: "Medihelp", status: "unpaid" },
];

const MOCK_FOLLOWUPS = [
  { id: 1, patient: "Thabo Nkosi", date: "2025-05-10", type: "Asthma review", priority: "routine", notes: "Check spirometry + controller adherence", done: false },
  { id: 2, patient: "Pieter van der Merwe", date: "2025-05-07", type: "CKD + HTN follow-up", priority: "urgent", notes: "Repeat creatinine, review BP meds. Pt had BP 165/105 at last visit.", done: false },
  { id: 3, patient: "Nomsa Dlamini", date: "2025-05-12", type: "Mood disorder review", priority: "routine", notes: "PHQ-9 follow up. On sertraline 50mg.", done: false },
  { id: 4, patient: "Ayesha Patel", date: "2025-05-08", type: "28-week antenatal", priority: "routine", notes: "GDM screen results, OGTT scheduled.", done: false },
  { id: 5, patient: "Lungelo Cele", date: "2025-05-14", type: "Allergy review", priority: "routine", notes: "Consider referral to allergist. Parents concerned re school camp (latex exposure).", done: false },
];

const PROTOCOLS = [
  { id: 1, title: "SA Hypertension Guideline 2024", category: "Cardiology", summary: "Step-therapy: ACE-I or ARB first-line. Add CCB second. Thiazide third. Target <130/80 for most adults, <140/90 if CKD+proteinuria. Lifestyle mod essential.", tags: ["HTN", "Cardiovascular", "SAJHM"] },
  { id: 2, title: "SAMF Antibiotic Guidelines", category: "Infectious Disease", summary: "Community-acquired pneumonia (non-severe): Amoxicillin 1g TDS 5 days. Penicillin allergy: Doxycycline 100mg BD 5 days. Severe: Refer/admit.", tags: ["Antibiotics", "Respiratory", "Stewardship"] },
  { id: 3, title: "DoH Diabetes Type 2 Protocol", category: "Endocrinology", summary: "First-line: Metformin + lifestyle. Add SGLT2i (empagliflozin) if CVD/CKD. GLP-1 RA if obesity dominant. Insulin if HbA1c >10% or symptomatic hyperglycaemia.", tags: ["Diabetes", "T2DM", "NHI"] },
  { id: 4, title: "PMTCT Protocol (2024)", category: "HIV / PMTCT", summary: "All pregnant women ART regardless of CD4. TLD (TDF+3TC+DTG) preferred. Neonatal NVP for 6 weeks. Early infant diagnosis at 6 weeks.", tags: ["HIV", "Pregnancy", "PMTCT"] },
  { id: 5, title: "IMCI — Under 5 Respiratory Illness", category: "Paediatrics", summary: "Classify: severe pneumonia (admit + IV amox), non-severe pneumonia (oral amox), no pneumonia (cough/cold — no antibiotic). Count RR, look for chest indrawing.", tags: ["Paediatrics", "Respiratory", "IMCI"] },
];

const ICD10_LOOKUP = {
  J45: "Asthma", E11: "Type 2 Diabetes Mellitus", K21: "GORD", F32: "Depressive Episode",
  I10: "Essential Hypertension", E78: "Hyperlipidaemia", N18: "Chronic Kidney Disease",
  O26: "Antenatal Care", J30: "Allergic Rhinitis", L20: "Atopic Dermatitis",
};

// ─── Utility ──────────────────────────────────────────────────────────────────
const fmt = (n) => `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);
const age = (dob) => {
  const d = new Date(dob), now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: "'Sora', 'DM Sans', sans-serif", display: "flex", height: "100vh", background: C.slate50, color: C.slate900, overflow: "hidden" },
  sidebar: { width: 220, background: C.teal900, display: "flex", flexDirection: "column", flexShrink: 0 },
  sidebarLogo: { padding: "28px 20px 20px", borderBottom: `1px solid ${C.teal800}` },
  sidebarLogoText: { fontSize: 20, fontWeight: 700, color: C.white, letterSpacing: "-0.5px" },
  sidebarSub: { fontSize: 11, color: C.teal200, marginTop: 2, letterSpacing: "0.04em" },
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", cursor: "pointer", background: active ? C.teal800 : "transparent", color: active ? C.white : C.teal100, fontSize: 13.5, fontWeight: active ? 600 : 400, borderLeft: active ? `3px solid ${C.teal200}` : "3px solid transparent", transition: "all 0.15s", borderRadius: "0 6px 6px 0", marginRight: 8 }),
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: { background: C.white, borderBottom: `1px solid ${C.slate200}`, padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  content: { flex: 1, overflow: "auto", padding: "28px 28px" },
  card: { background: C.white, borderRadius: 12, border: `1px solid ${C.slate200}`, padding: "20px 24px", marginBottom: 20 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: C.slate800, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 },
  badge: (color) => ({ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: color === "green" ? C.teal50 : color === "red" ? C.red100 : color === "amber" ? C.amber100 : C.blue100, color: color === "green" ? C.teal600 : color === "red" ? C.red500 : color === "amber" ? "#92400e" : C.blue500 }),
  btn: (variant = "primary") => ({ cursor: "pointer", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, background: variant === "primary" ? C.teal600 : variant === "outline" ? C.white : variant === "danger" ? C.red500 : C.slate100, color: variant === "primary" ? C.white : variant === "outline" ? C.teal600 : variant === "danger" ? C.white : C.slate700, border: variant === "outline" ? `1.5px solid ${C.teal400}` : "none", transition: "opacity 0.15s" }),
  input: { border: `1px solid ${C.slate200}`, borderRadius: 8, padding: "9px 13px", fontSize: 13.5, width: "100%", outline: "none", background: C.white, color: C.slate800, boxSizing: "border-box" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13.5 },
  th: { textAlign: "left", padding: "10px 14px", fontSize: 11.5, fontWeight: 700, color: C.slate500, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1.5px solid ${C.slate200}`, background: C.slate50 },
  td: { padding: "12px 14px", borderBottom: `1px solid ${C.slate100}`, color: C.slate700, verticalAlign: "middle" },
  statCard: { background: C.white, borderRadius: 12, border: `1px solid ${C.slate200}`, padding: "18px 22px" },
  statLabel: { fontSize: 12, color: C.slate500, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 },
  statVal: { fontSize: 26, fontWeight: 800, color: C.slate900 },
  statSub: { fontSize: 12, color: C.teal600, marginTop: 4, fontWeight: 500 },
  sectionGrid: (cols) => ({ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 24 }),
  aiBox: { background: "linear-gradient(135deg, #E1F5EE 0%, #e0f2fe 100%)", border: `1.5px solid ${C.teal200}`, borderRadius: 12, padding: "18px 22px", marginBottom: 20 },
  voiceBtn: (recording) => ({ width: 52, height: 52, borderRadius: "50%", background: recording ? C.red500 : C.teal600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 22, flexShrink: 0, boxShadow: recording ? `0 0 0 6px ${C.red100}` : "none", transition: "all 0.2s" }),
  modal: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)" },
  modalBox: { background: C.white, borderRadius: 16, padding: "32px 36px", width: 580, maxHeight: "85vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.15)" },
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = { paid: ["green", "Paid"], partial: ["amber", "Partial"], unpaid: ["red", "Unpaid"], overdue: ["red", "Overdue"], active: ["green", "Active"], routine: ["green", "Routine"], urgent: ["red", "Urgent"] };
  const [color, label] = map[status] || ["green", status];
  return <span style={S.badge(color)}>{label}</span>;
}

function Avatar({ name, size = 36 }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("");
  const hue = name.charCodeAt(0) % 6;
  const colors = [[C.teal800, C.teal50], ["#1e3a8a", C.blue50], ["#7c3aed", "#ede9fe"], ["#9d174d", "#fce7f3"], ["#92400e", C.amber100], [C.teal800, C.teal50]];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: colors[hue][1], color: colors[hue][0], display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ─── AI Suggester (calls Anthropic API) ───────────────────────────────────────
function AISuggester({ context }) {
  const [prompt, setPrompt] = useState(context || "");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are PLASMED-AI, a clinical decision support assistant embedded in a South African GP practice management app. 
You are knowledgeable about: SA DoH guidelines, SAMF drug formulary, ICD-10 AM coding, Discovery/Bonitas/Medihelp medical aid schemes, PHC protocols, IMCI, PMTCT, NHI context. 
Respond in concise clinical language. Use bullet points for differential diagnoses and management steps. 
Always flag red-flag symptoms. Mention SA-specific formulary/funding context where relevant.
Keep responses to 300 words max. Never replace clinical judgment.`,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "No response.";
      setResponse(text);
    } catch (e) {
      setResponse("⚠️ Could not reach AI service. Please check your connection.");
    }
    setLoading(false);
  };

  return (
    <div style={S.aiBox}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.teal600, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 16 }}>⚕</div>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.teal900 }}>PLASMED-AI Clinical Suggester</span>
        <span style={{ marginLeft: "auto", ...S.badge("green") }}>Claude Sonnet</span>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <textarea
          style={{ ...S.input, height: 72, resize: "vertical", fontFamily: "inherit" }}
          placeholder="e.g. '55yo male, BP 165/105, CKD stage 3, on amlodipine 5mg — next step?' or 'ICD-10 code for gestational hypertension'"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === "Enter" && e.ctrlKey && ask()}
        />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button style={S.btn("primary")} onClick={ask} disabled={loading}>
          {loading ? "Thinking…" : "Ask AI ↵"}
        </button>
        {["Differentials for chest pain SA adult", "Antibiotic for CAP (non-severe)", "SGLT2i funding criteria Discovery"].map(q => (
          <button key={q} style={{ ...S.btn("outline"), fontSize: 12, padding: "7px 12px" }} onClick={() => { setPrompt(q); }}>
            {q}
          </button>
        ))}
      </div>
      {loading && (
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, color: C.teal600, fontSize: 13 }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${C.teal200}`, borderTopColor: C.teal600, animation: "spin 0.8s linear infinite" }} />
          Analysing clinical context…
        </div>
      )}
      {response && (
        <div style={{ marginTop: 18, background: C.white, borderRadius: 10, padding: "16px 18px", border: `1px solid ${C.teal100}`, fontSize: 13.5, lineHeight: 1.7, color: C.slate800, whiteSpace: "pre-wrap" }}>
          {response}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Voice to Note ────────────────────────────────────────────────────────────
function VoiceToNote() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [soapNote, setSoapNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const recRef = useRef(null);
  const chunksRef = useRef([]);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = e => chunksRef.current.push(e.data);
      rec.onstop = () => { setStatus("processing"); processAudio(); };
      rec.start();
      setRecording(true);
      setStatus("recording");
    } catch {
      setStatus("error");
      setTranscript("Microphone access denied. Please type notes below.");
    }
  };

  const stopRec = () => {
    recRef.current?.stop();
    recRef.current?.stream?.getTracks().forEach(t => t.stop());
    setRecording(false);
  };

  const processAudio = async () => {
    // For demo: since we can't do server-side audio transcription, simulate with a typed note
    setStatus("idle");
    setTranscript("[Transcription demo] Patient complains of 3-day history of productive cough, fever 38.5°C, right-sided pleuritic chest pain. No haemoptysis. PMH: non-smoker. On no meds. O/E: RR 20, SpO2 96% RA, right basal crackles.");
  };

  const generateSOAP = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setSoapNote("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are a medical scribe for a South African GP. Convert the transcribed consultation note into a structured SOAP note. Include: S (Subjective), O (Objective), A (Assessment with ICD-10 codes), P (Plan referencing SA formulary/SAMF). Be clinical and concise. Do NOT invent information not in the transcript.",
          messages: [{ role: "user", content: `Convert this consultation note to SOAP format:\n\n${transcript}` }],
        }),
      });
      const data = await res.json();
      setSoapNote(data.content?.map(b => b.text || "").join("") || "Could not generate note.");
    } catch {
      setSoapNote("⚠️ AI service unavailable.");
    }
    setLoading(false);
  };

  return (
    <div style={S.card}>
      <div style={S.cardTitle}>🎙 Voice-to-Note</div>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
        <button style={S.voiceBtn(recording)} onClick={recording ? stopRec : startRec} title={recording ? "Stop recording" : "Start recording"}>
          {recording ? "⏹" : "🎤"}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: recording ? C.red500 : C.slate600, marginBottom: 4 }}>
            {recording ? "● Recording… speak clearly" : status === "processing" ? "⌛ Processing audio…" : "Click mic to start, or type below"}
          </div>
          <textarea
            style={{ ...S.input, height: 100, resize: "vertical", fontFamily: "inherit" }}
            placeholder="Consultation notes appear here after recording, or type manually…"
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
          />
        </div>
      </div>
      <button style={S.btn("primary")} onClick={generateSOAP} disabled={loading || !transcript.trim()}>
        {loading ? "Generating SOAP…" : "Generate SOAP Note with AI"}
      </button>
      {soapNote && (
        <div style={{ marginTop: 18, background: C.slate50, borderRadius: 10, padding: "16px 18px", border: `1px solid ${C.slate200}`, fontSize: 13.5, lineHeight: 1.75, whiteSpace: "pre-wrap", fontFamily: "'IBM Plex Mono', monospace", color: C.slate800 }}>
          {soapNote}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ setTab, setSelectedPatient }) {
  const totalBilled = MOCK_BILLING.reduce((s, i) => s + i.total, 0);
  const totalPaid = MOCK_BILLING.reduce((s, i) => s + i.paid, 0);
  const totalOutstanding = totalBilled - totalPaid;
  const urgentFollowups = MOCK_FOLLOWUPS.filter(f => f.priority === "urgent" && !f.done).length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.slate900, margin: 0 }}>Good morning, Dr. Singh 👋</h1>
        <p style={{ color: C.slate500, fontSize: 14, marginTop: 4 }}>Wednesday, 7 May 2025 · Durban, KZN</p>
      </div>

      <div style={S.sectionGrid(4)}>
        {[
          { label: "Today's patients", val: "5", sub: "2 confirmed, 3 walk-in", icon: "👤" },
          { label: "Outstanding billing", val: fmt(totalOutstanding), sub: "Across 3 invoices", icon: "💳" },
          { label: "Urgent follow-ups", val: urgentFollowups, sub: "Require attention today", icon: "🔴" },
          { label: "This month's revenue", val: fmt(totalBilled), sub: `${Math.round(totalPaid / totalBilled * 100)}% collected`, icon: "📈" },
        ].map(s => (
          <div key={s.label} style={S.statCard}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={S.statLabel}>{s.label}</div>
            <div style={S.statVal}>{s.val}</div>
            <div style={S.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>📅 Today's Follow-ups</div>
          {MOCK_FOLLOWUPS.slice(0, 3).map(f => (
            <div key={f.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${C.slate100}` }}>
              <Avatar name={f.patient} size={34} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: C.slate800 }}>{f.patient}</div>
                <div style={{ fontSize: 12.5, color: C.slate500 }}>{f.type}</div>
              </div>
              <StatusBadge status={f.priority} />
            </div>
          ))}
          <button style={{ ...S.btn("outline"), marginTop: 12, width: "100%", fontSize: 12 }} onClick={() => setTab("followups")}>View all follow-ups →</button>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>💳 Recent Invoices</div>
          {MOCK_BILLING.slice(0, 3).map(inv => (
            <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.slate100}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: C.slate800 }}>{inv.patient}</div>
                <div style={{ fontSize: 12, color: C.slate500 }}>{inv.id} · {inv.date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt(inv.total)}</div>
                <StatusBadge status={inv.status} />
              </div>
            </div>
          ))}
          <button style={{ ...S.btn("outline"), marginTop: 12, width: "100%", fontSize: 12 }} onClick={() => setTab("billing")}>View all invoices →</button>
        </div>
      </div>

      <AISuggester context="" />
    </div>
  );
}

// ─── Patients ─────────────────────────────────────────────────────────────────
function Patients({ setSelectedPatient, setTab }) {
  const [search, setSearch] = useState("");
  const filtered = MOCK_PATIENTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.id_no.includes(search));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Patient Profiles</h2>
        <button style={S.btn("primary")}>+ New Patient</button>
      </div>
      <input style={{ ...S.input, marginBottom: 16, maxWidth: 400 }} placeholder="Search by name or ID number…" value={search} onChange={e => setSearch(e.target.value)} />
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              {["Patient", "DOB / Age", "Medical Aid", "ICD-10", "Last Visit", "Balance", ""].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedPatient(p); setTab("patientdetail"); }}>
                <td style={S.td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={p.name} size={34} />
                    <div>
                      <div style={{ fontWeight: 600, color: C.slate800 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.slate400 }}>{p.id_no}</div>
                    </div>
                  </div>
                </td>
                <td style={S.td}><div>{new Date(p.dob).toLocaleDateString("en-ZA")}</div><div style={{ fontSize: 12, color: C.slate400 }}>{age(p.dob)} yrs</div></td>
                <td style={S.td}><div style={{ fontWeight: 500 }}>{p.medical_aid}</div><div style={{ fontSize: 12, color: C.slate400 }}>{p.plan}</div></td>
                <td style={S.td}>{p.icd10.map(c => <span key={c} style={{ ...S.badge("green"), marginRight: 4, display: "inline-block" }}>{c}</span>)}</td>
                <td style={S.td}>{p.last_visit}</td>
                <td style={S.td}><span style={{ fontWeight: 700, color: p.balance > 0 ? C.red500 : C.teal600 }}>{fmt(p.balance)}</span></td>
                <td style={S.td}><button style={{ ...S.btn("outline"), padding: "5px 12px", fontSize: 12 }}>View →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Patient Detail ───────────────────────────────────────────────────────────
function PatientDetail({ patient, setTab }) {
  const [aiContext, setAiContext] = useState(`Patient: ${patient.name}, ${age(patient.dob)}yo ${patient.gender}. ICD-10: ${patient.icd10.join(", ")} (${patient.icd10.map(c => ICD10_LOOKUP[c] || c).join(", ")}). Allergies: ${patient.allergies.join(", ") || "NKDA"}. Medical aid: ${patient.medical_aid} ${patient.plan}.`);

  return (
    <div>
      <button style={{ ...S.btn("outline"), marginBottom: 18, fontSize: 13 }} onClick={() => setTab("patients")}>← Back to patients</button>
      <div style={S.card}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <Avatar name={patient.name} size={64} />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{patient.name}</h2>
            <div style={{ color: C.slate500, fontSize: 13.5, marginTop: 4 }}>{patient.id_no} · {age(patient.dob)} years · {patient.gender}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              {[
                ["📞", patient.phone],
                ["🏥", `${patient.medical_aid} — ${patient.plan}`],
                ["🔑", `Aid no: ${patient.aid_no}`],
                ["📅", `Last visit: ${patient.last_visit}`],
              ].map(([icon, val]) => (
                <span key={val} style={{ fontSize: 13, color: C.slate600, background: C.slate50, padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.slate200}` }}>{icon} {val}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={S.statLabel}>Balance</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: patient.balance > 0 ? C.red500 : C.teal600 }}>{fmt(patient.balance)}</div>
            <StatusBadge status={patient.status} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 22, paddingTop: 20, borderTop: `1px solid ${C.slate100}` }}>
          <div>
            <div style={S.statLabel}>Active diagnoses (ICD-10)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {patient.icd10.map(c => (
                <span key={c} style={{ background: C.teal50, color: C.teal800, border: `1px solid ${C.teal200}`, padding: "4px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                  {c} — {ICD10_LOOKUP[c] || "Unknown"}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div style={S.statLabel}>⚠️ Allergies</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {patient.allergies.length === 0
                ? <span style={{ color: C.teal600, fontWeight: 600, fontSize: 13 }}>NKDA — No known drug allergies</span>
                : patient.allergies.map(a => (
                  <span key={a} style={{ background: C.red100, color: C.red500, border: `1px solid #fca5a5`, padding: "4px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>{a}</span>
                ))}
            </div>
          </div>
        </div>
      </div>

      <AISuggester context={aiContext} />
      <VoiceToNote />
    </div>
  );
}

// ─── Billing ──────────────────────────────────────────────────────────────────
function Billing() {
  const [selected, setSelected] = useState(null);
  const totalBilled = MOCK_BILLING.reduce((s, i) => s + i.total, 0);
  const totalPaid = MOCK_BILLING.reduce((s, i) => s + i.paid, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Billing Dashboard</h2>
        <button style={S.btn("primary")}>+ New Invoice</button>
      </div>

      <div style={S.sectionGrid(4)}>
        {[
          { label: "Total billed", val: fmt(totalBilled), sub: `${MOCK_BILLING.length} invoices`, color: C.slate900 },
          { label: "Collected", val: fmt(totalPaid), sub: `${Math.round(totalPaid / totalBilled * 100)}% collection rate`, color: C.teal600 },
          { label: "Outstanding", val: fmt(totalBilled - totalPaid), sub: "Pending payment", color: C.red500 },
          { label: "Medical aid", val: fmt(totalBilled * 0.72), sub: "72% scheme-covered", color: C.blue500 },
        ].map(s => (
          <div key={s.label} style={S.statCard}>
            <div style={S.statLabel}>{s.label}</div>
            <div style={{ ...S.statVal, color: s.color }}>{s.val}</div>
            <div style={S.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>📄 Invoices</div>
        <table style={S.table}>
          <thead>
            <tr>{["Invoice", "Patient", "Date", "Medical Aid", "Total", "Paid", "Balance", "Status", ""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {MOCK_BILLING.map(inv => (
              <tr key={inv.id}>
                <td style={{ ...S.td, fontWeight: 600, color: C.teal700 }}>{inv.id}</td>
                <td style={S.td}>{inv.patient}</td>
                <td style={S.td}>{inv.date}</td>
                <td style={S.td}>{inv.aid}</td>
                <td style={{ ...S.td, fontWeight: 600 }}>{fmt(inv.total)}</td>
                <td style={{ ...S.td, color: C.teal600, fontWeight: 600 }}>{fmt(inv.paid)}</td>
                <td style={{ ...S.td, color: inv.total - inv.paid > 0 ? C.red500 : C.teal600, fontWeight: 700 }}>{fmt(inv.total - inv.paid)}</td>
                <td style={S.td}><StatusBadge status={inv.status} /></td>
                <td style={S.td}>
                  <button style={{ ...S.btn("outline"), padding: "5px 10px", fontSize: 12 }} onClick={() => setSelected(inv)}>Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div style={S.modal} onClick={() => setSelected(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{selected.id}</h3>
              <button style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: C.slate500 }} onClick={() => setSelected(null)}>×</button>
            </div>
            <div style={{ color: C.slate600, fontSize: 13.5, marginBottom: 18 }}>{selected.patient} · {selected.date} · {selected.aid}</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Code</th><th style={S.th}>Description</th><th style={{ ...S.th, textAlign: "right" }}>Amount</th></tr></thead>
              <tbody>
                {selected.items.map(item => (
                  <tr key={item.code}>
                    <td style={{ ...S.td, fontWeight: 600, color: C.teal700 }}>{item.code}</td>
                    <td style={S.td}>{item.desc}</td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 600 }}>{fmt(item.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ ...S.td, fontWeight: 700 }}>Total</td>
                  <td style={{ ...S.td, textAlign: "right", fontWeight: 800, fontSize: 16 }}>{fmt(selected.total)}</td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ ...S.td, color: C.teal600, fontWeight: 600 }}>Paid</td>
                  <td style={{ ...S.td, textAlign: "right", color: C.teal600, fontWeight: 700 }}>{fmt(selected.paid)}</td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ ...S.td, color: C.red500, fontWeight: 600 }}>Balance</td>
                  <td style={{ ...S.td, textAlign: "right", color: C.red500, fontWeight: 800 }}>{fmt(selected.total - selected.paid)}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button style={S.btn("outline")}>Print</button>
              <button style={S.btn("primary")}>Record Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Follow-ups ───────────────────────────────────────────────────────────────
function Followups() {
  const [items, setItems] = useState(MOCK_FOLLOWUPS);
  const toggle = (id) => setItems(items.map(f => f.id === id ? { ...f, done: !f.done } : f));
  const pending = items.filter(f => !f.done);
  const done = items.filter(f => f.done);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Follow-up Tracker</h2>
        <button style={S.btn("primary")}>+ Add Follow-up</button>
      </div>

      {[{ title: "⏳ Pending", list: pending }, { title: "✅ Completed", list: done }].map(group => group.list.length > 0 && (
        <div key={group.title} style={S.card}>
          <div style={S.cardTitle}>{group.title} ({group.list.length})</div>
          {group.list.map(f => (
            <div key={f.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0", borderBottom: `1px solid ${C.slate100}`, opacity: f.done ? 0.55 : 1 }}>
              <input type="checkbox" checked={f.done} onChange={() => toggle(f.id)} style={{ marginTop: 3, accentColor: C.teal600, width: 16, height: 16, cursor: "pointer" }} />
              <Avatar name={f.patient} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.slate800 }}>{f.patient}</span>
                  <StatusBadge status={f.priority} />
                  <span style={{ fontSize: 12, color: C.slate400 }}>📅 {f.date}</span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.teal700, marginTop: 3 }}>{f.type}</div>
                <div style={{ fontSize: 13, color: C.slate500, marginTop: 2 }}>{f.notes}</div>
              </div>
              <button style={{ ...S.btn("outline"), padding: "5px 12px", fontSize: 12, flexShrink: 0 }}>View</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Protocols ────────────────────────────────────────────────────────────────
function Protocols() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const filtered = PROTOCOLS.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>SA Clinical Protocols</h2>
      </div>
      <input style={{ ...S.input, marginBottom: 18, maxWidth: 400 }} placeholder="Search by condition, category or keyword…" value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ ...S.card, marginBottom: 0, cursor: "pointer", borderLeft: `4px solid ${C.teal400}` }} onClick={() => setSelected(p)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.slate800 }}>{p.title}</div>
              <span style={{ ...S.badge("green"), flexShrink: 0, marginLeft: 10 }}>{p.category}</span>
            </div>
            <p style={{ fontSize: 13, color: C.slate600, margin: "0 0 12px", lineHeight: 1.6 }}>{p.summary}</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {p.tags.map(t => <span key={t} style={{ fontSize: 11, background: C.slate100, color: C.slate600, padding: "2px 8px", borderRadius: 10 }}>{t}</span>)}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={S.modal} onClick={() => setSelected(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.3 }}>{selected.title}</h3>
              <button style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: C.slate500, marginLeft: 16 }} onClick={() => setSelected(null)}>×</button>
            </div>
            <span style={{ ...S.badge("green"), marginBottom: 16, display: "inline-block" }}>{selected.category}</span>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: C.slate700 }}>{selected.summary}</p>
            <div style={{ marginTop: 16, padding: "14px 16px", background: C.teal50, borderRadius: 8, border: `1px solid ${C.teal100}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.teal800, marginBottom: 6 }}>ASK AI ABOUT THIS PROTOCOL</div>
              <button style={S.btn("primary")} onClick={() => { setSelected(null); }}>
                Open in AI Suggester →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "patients", label: "Patients", icon: "👤" },
  { id: "billing", label: "Billing", icon: "💳" },
  { id: "followups", label: "Follow-ups", icon: "📅" },
  { id: "protocols", label: "Protocols", icon: "📋" },
  { id: "ai", label: "AI Suggester", icon: "⚕" },
  { id: "voice", label: "Voice-to-Note", icon: "🎙" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const renderContent = () => {
    if (tab === "patientdetail" && selectedPatient) return <PatientDetail patient={selectedPatient} setTab={setTab} />;
    switch (tab) {
      case "dashboard": return <Dashboard setTab={setTab} setSelectedPatient={setSelectedPatient} />;
      case "patients": return <Patients setSelectedPatient={setSelectedPatient} setTab={setTab} />;
      case "billing": return <Billing />;
      case "followups": return <Followups />;
      case "protocols": return <Protocols />;
      case "ai": return <div><h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>AI Clinical Suggester</h2><AISuggester context="" /></div>;
      case "voice": return <div><h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Voice-to-Note</h2><VoiceToNote /></div>;
      default: return null;
    }
  };

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=IBM+Plex+Mono&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <div style={S.sidebarLogoText}>PLASMED</div>
          <div style={S.sidebarSub}>SA Practice Management</div>
        </div>
        <nav style={{ flex: 1, paddingTop: 12 }}>
          {NAV.map(n => (
            <div key={n.id} style={S.navItem(tab === n.id || (tab === "patientdetail" && n.id === "patients"))} onClick={() => setTab(n.id)}>
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.teal800}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.teal600, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontSize: 14 }}>RS</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>Dr. R. Singh</div>
              <div style={{ fontSize: 11, color: C.teal200 }}>GP · Durban, KZN</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={S.main}>
        <div style={S.topbar}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.slate600 }}>
            {NAV.find(n => n.id === tab)?.icon} {tab === "patientdetail" ? `Patient — ${selectedPatient?.name}` : NAV.find(n => n.id === tab)?.label}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ ...S.badge("green"), fontSize: 12 }}>🟢 AI online</span>
            <span style={{ fontSize: 13, color: C.slate400 }}>HPCSA: MP0412387</span>
          </div>
        </div>
        <div style={S.content}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}