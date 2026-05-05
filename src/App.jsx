
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SPECIALTIES = [
{
id: "gp",
label: "GP / Doctor",
icon: "🩺",
description: "Clinical queries, diagnosis support, drug reference & SOAP notes",
color: "#2563eb",
modes: [
{ id: "general", label: "General Query", icon: "⚡", color: "#2563eb", prompt: "You are Plasmed, a clinical AI assistant for General Practitioners in South Africa. Help with general medical queries professionally and accurately." },
{ id: "diagnosis", label: "Diagnosis", icon: "🔍", color: "#0891b2", prompt: "You are Plasmed in Diagnosis mode. Help the doctor work through differential diagnoses based on symptoms, history, and clinical findings. Be systematic and evidence-based." },
{ id: "drugs", label: "Drug Reference", icon: "💊", color: "#7c3aed", prompt: "You are Plasmed in Drug Reference mode. Provide accurate information about medications including dosages, contraindications, interactions, and South African availability." },
{ id: "notes", label: "Clinical Notes", icon: "📝", color: "#0d9488", prompt: "You are Plasmed in Clinical Notes mode. Help generate structured SOAP notes and clinical documentation from the doctor's input. Format clearly and professionally." },
]
},
{
id: "dental",
label: "Dental",
icon: "🦷",
description: "Dental clinical support, treatment planning & patient notes",
color: "#0891b2",
modes: [
{ id: "general", label: "General Query", icon: "⚡", color: "#0891b2", prompt: "You are Plasmed, a clinical AI assistant for Dental professionals in South Africa. Help with dental queries professionally and accurately." },
{ id: "treatment", label: "Treatment Plan", icon: "📋", color: "#2563eb", prompt: "You are Plasmed in Treatment Planning mode for dentistry. Help dentists create structured treatment plans based on clinical findings." },
{ id: "drugs", label: "Drug Reference", icon: "💊", color: "#7c3aed", prompt: "You are Plasmed in Drug Reference mode for dentistry. Provide accurate dental pharmacology information including local anaesthetics, analgesics, and antibiotics." },
{ id: "notes", label: "Clinical Notes", icon: "📝", color: "#0d9488", prompt: "You are Plasmed in Clinical Notes mode for dentistry. Help generate structured dental consultation notes and charting documentation." },
]
},
{
id: "aesthetics",
label: "Aesthetician",
icon: "✨",
description: "Treatment protocols, consult notes, follow-ups & client suggestions",
color: "#7c3aed",
modes: [
{ id: "protocols", label: "Treatment Protocols", icon: "✨", color: "#7c3aed", prompt: "You are Plasmed in Treatment Protocols mode for aesthetic medicine. Help aesthetic doctors with treatment protocols, product selection, and procedure guidance." },
{ id: "notes", label: "Consult Notes", icon: "📝", color: "#0891b2", prompt: "You are Plasmed in Consult Notes mode for aesthetics. Generate structured aesthetic consultation notes from the doctor's input." },
{ id: "followup", label: "Follow-ups", icon: "🔔", color: "#2563eb", prompt: "You are Plasmed in Follow-up mode. Help aesthetic doctors manage client follow-ups, draft reminder messages, and suggest recall timing based on treatments." },
{ id: "suggestions", label: "AI Suggestions", icon: "💡", color: "#dc2626", prompt: "You are Plasmed in AI Suggestions mode. Based on client history and treatments, suggest appropriate next treatments or products for aesthetic clients." },
]
}
];

const FREE_LIMIT = 500;

export default function App() {
const [session, setSession] = useState(null);
const [profile, setProfile] = useState(null);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [authMode, setAuthMode] = useState("login");
const [authError, setAuthError] = useState("");
const [specialty, setSpecialty] = useState(null);
const [messages, setMessages] = useState([]);
const [input, setInput] = useState("");
const [loading, setLoading] = useState(false);
const [activeMode, setActiveMode] = useState(null);
const bottomRef = useRef(null);

useEffect(() => {
supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
supabase.auth.onAuthStateChange((_event, session) => setSession(session));
}, []);

useEffect(() => { if (session) fetchProfile(); }, [session]);
useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

const fetchProfile = async () => {
const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
setProfile(data);
};

const handleAuth = async () => {
setAuthError("");
if (authMode === "login") {
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) setAuthError(error.message);
} else {
const { error } = await supabase.auth.signUp({ email, password });
if (error) setAuthError(error.message);
else setAuthError("Check your email to confirm your account!");
}
};

const handleSignOut = async () => {
await supabase.auth.signOut();
setMessages([]);
setProfile(null);
setSpecialty(null);
setActiveMode(null);
};

const selectSpecialty = (s) => {
setSpecialty(s);
setActiveMode(s.modes[0]);
setMessages([]);
};

const sendMessage = async () => {
if (!input.trim() || loading) return;
if (profile?.plan === "free" && profile?.message_count >= FREE_LIMIT) {
alert("Free limit reached! Upgrade to Pro for unlimited messages.");
return;
}
const userMsg = { role: "user", content: input.trim() };
const newMessages = [...messages, userMsg];
setMessages(newMessages);
setInput("");
setLoading(true);
await supabase.from("profiles").update({ message_count: (profile?.message_count || 0) + 1 }).eq("id", session.user.id);
await fetchProfile();
try {
const response = await fetch("/api/chat", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, system: activeMode.prompt, messages: newMessages }),
});
const data = await response.json();
setMessages([...newMessages, { role: "assistant", content: data.content?.[0]?.text || "Error getting response." }]);
} catch {
setMessages([...newMessages, { role: "assistant", content: "Connection error. Please try again." }]);
}
setLoading(false);
};

// LOGIN SCREEN
if (!session) return (
<div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif", backgroundImage: "radial-gradient(circle at 20% 50%, #e0f2fe 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f0fdf4 0%, transparent 40%)" }}>
<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "48px 40px", width: 380, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 40px -10px rgba(0,0,0,0.08)" }}>
<div style={{ textAlign: "center", marginBottom: 36 }}>
<div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>PLAS<span style={{ color: "#2563eb" }}>MED</span></div>
<div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>AI for Medical Practices</div>
<div style={{ width: 40, height: 3, background: "#2563eb", borderRadius: 2, margin: "16px auto 0" }} />
</div>
<div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.5px" }}>
{authMode === "login" ? "SIGN IN TO YOUR ACCOUNT" : "CREATE YOUR ACCOUNT"}
</div>
<input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#1e293b", fontSize: 14, marginBottom: 12, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
onFocus={e => e.target.style.borderColor = "#2563eb"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
<input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password"
style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#1e293b", fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
onFocus={e => e.target.style.borderColor = "#2563eb"} onBlur={e => e.target.style.borderColor = "#e2e8f0"}
onKeyDown={e => e.key === "Enter" && handleAuth()} />
{authError && (
<div style={{ color: authError.includes("Check") ? "#16a34a" : "#dc2626", fontSize: 13, marginBottom: 12, textAlign: "center", padding: "8px 12px", background: authError.includes("Check") ? "#f0fdf4" : "#fef2f2", borderRadius: 8 }}>
{authError}
</div>
)}
<button onClick={handleAuth}
style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 16, fontFamily: "inherit" }}
onMouseOver={e => e.target.style.background = "#1d4ed8"} onMouseOut={e => e.target.style.background = "#2563eb"}>
{authMode === "login" ? "Sign In" : "Create Account"}
</button>
<div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
{authMode === "login" ? "No account? " : "Have an account? "}
<span onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} style={{ color: "#2563eb", cursor: "pointer", fontWeight: 600 }}>
{authMode === "login" ? "Sign up free" : "Sign in"}
</span>
</div>
<div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "center", gap: 20 }}>
{["POPIA Compliant", "SA Doctors", "Secure"].map(tag => (
<div key={tag} style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
<div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
{tag}
</div>
))}
</div>
</div>
</div>
);

// SPECIALTY SELECTION SCREEN
if (!specialty) return (
<div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
<div style={{ padding: "0 28px", height: 60, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
<div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>PLAS<span style={{ color: "#2563eb" }}>MED</span></div>
<button onClick={handleSignOut} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Sign Out</button>
</div>
<div style={{ maxWidth: 700, margin: "0 auto", padding: "60px 24px" }}>
<div style={{ textAlign: "center", marginBottom: 48 }}>
<div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Select Your Specialty</div>
<div style={{ color: "#94a3b8", fontSize: 15 }}>Choose your practice type to load the right AI tools</div>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
{SPECIALTIES.map(s => (
<div key={s.id} onClick={() => selectSpecialty(s)}
style={{ background: "#fff", border: `2px solid #e2e8f0`, borderRadius: 16, padding: 28, cursor: "pointer", transition: "all 0.2s", textAlign: "center" }}
onMouseOver={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}20`; e.currentTarget.style.transform = "translateY(-2px)"; }}
onMouseOut={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
<div style={{ fontSize: 40, marginBottom: 12 }}>{s.icon}</div>
<div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{s.label}</div>
<div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{s.description}</div>
<div style={{ marginTop: 16, padding: "8px 16px", background: s.color + "12", color: s.color, borderRadius: 20, fontSize: 12, fontWeight: 600, display: "inline-block" }}>
{s.modes.length} AI Modes
</div>
</div>
))}
</div>
</div>
</div>
);

// MAIN CHAT SCREEN
return (
<div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans','Segoe UI',sans-serif", display: "flex", flexDirection: "column" }}>
<div style={{ padding: "0 28px", height: 60, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
<div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>PLAS<span style={{ color: "#2563eb" }}>MED</span></div>
<div style={{ width: 1, height: 18, background: "#e2e8f0" }} />
<div style={{ fontSize: 12, color: "#fff", background: specialty.color, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{specialty.icon} {specialty.label}</div>
<button onClick={() => { setSpecialty(null); setMessages([]); }} style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Change ↗</button>
</div>
<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
<div style={{ fontSize: 12, color: "#94a3b8", background: "#f8fafc", padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
{profile?.plan === "free" ? `${profile?.message_count || 0} / ${FREE_LIMIT}` : "✦ Unlimited"}
</div>
<button onClick={handleSignOut} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Sign Out</button>
</div>
</div>

<div style={{ display: "flex", gap: 6, padding: "10px 28px", borderBottom: "1px solid #f1f5f9", overflowX: "auto", background: "#fff" }}>
{specialty.modes.map(mode => (
<button key={mode.id} onClick={() => { setActiveMode(mode); setMessages([]); }}
style={{ padding: "7px 16px", borderRadius: 20, border: `1.5px solid ${activeMode?.id === mode.id ? mode.color : "#e2e8f0"}`, background: activeMode?.id === mode.id ? mode.color + "12" : "#fff", color: activeMode?.id === mode.id ? mode.color : "#64748b", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", fontWeight: activeMode?.id === mode.id ? 600 : 400 }}>
{mode.icon} {mode.label}
</button>
))}
</div>

<div style={{ flex: 1, overflowY: "auto", padding: "28px 24px", maxWidth: 780, width: "100%", margin: "0 auto", alignSelf: "stretch" }}>
{messages.length === 0 && (
<div style={{ textAlign: "center", marginTop: 80 }}>
<div style={{ fontSize: 36, marginBottom: 12 }}>{activeMode?.icon}</div>
<div style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>{activeMode?.label} Mode</div>
<div style={{ fontSize: 13, color: "#cbd5e1" }}>Ask your {specialty.label} question below</div>
</div>
)}
{messages.map((msg, i) => (
<div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 16 }}>
{msg.role === "assistant" && (
<div style={{ width: 28, height: 28, borderRadius: "50%", background: activeMode.color + "15", border: `1.5px solid ${activeMode.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginRight: 8, flexShrink: 0, marginTop: 2 }}>
{activeMode.icon}
</div>
)}
<div style={msg.role === "user" ? userBubble : aiBubble}>
