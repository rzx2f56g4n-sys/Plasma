import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SPECIALTIES = [
{
id: "gp", label: "GP / Doctor", icon: "🩺",
description: "Clinical queries, diagnosis, drug reference & SOAP notes",
color: "#2563eb",
modes: [
{ id: "general", label: "General Query", icon: "⚡", color: "#2563eb", prompt: "You are Plasmed, a clinical AI assistant for General Practitioners in South Africa." },
{ id: "diagnosis", label: "Diagnosis", icon: "🔍", color: "#0891b2", prompt: "You are Plasmed in Diagnosis mode. Help work through differential diagnoses systematically." },
{ id: "drugs", label: "Drug Reference", icon: "💊", color: "#7c3aed", prompt: "You are Plasmed in Drug Reference mode. Provide accurate medication information for South African practice." },
{ id: "notes", label: "Clinical Notes", icon: "📝", color: "#0d9488", prompt: "You are Plasmed in Clinical Notes mode. Generate structured SOAP notes from the doctor's input." },
]
},
{
id: "dental", label: "Dental", icon: "🦷",
description: "Dental clinical support, treatment planning & patient notes",
color: "#0891b2",
modes: [
{ id: "general", label: "General Query", icon: "⚡", color: "#0891b2", prompt: "You are Plasmed, a clinical AI assistant for Dental professionals in South Africa." },
{ id: "treatment", label: "Treatment Plan", icon: "📋", color: "#2563eb", prompt: "You are Plasmed in Treatment Planning mode for dentistry." },
{ id: "drugs", label: "Drug Reference", icon: "💊", color: "#7c3aed", prompt: "You are Plasmed in Drug Reference mode for dentistry." },
{ id: "notes", label: "Clinical Notes", icon: "📝", color: "#0d9488", prompt: "You are Plasmed in Clinical Notes mode for dentistry." },
]
},
{
id: "aesthetics", label: "Aesthetician", icon: "✨",
description: "Treatment protocols, consult notes, follow-ups & suggestions",
color: "#7c3aed",
modes: [
{ id: "protocols", label: "Treatment Protocols", icon: "✨", color: "#7c3aed", prompt: "You are Plasmed in Treatment Protocols mode for aesthetic medicine." },
{ id: "notes", label: "Consult Notes", icon: "📝", color: "#0891b2", prompt: "You are Plasmed in Consult Notes mode for aesthetics." },
{ id: "followup", label: "Follow-ups", icon: "🔔", color: "#2563eb", prompt: "You are Plasmed in Follow-up mode for aesthetic client management." },
{ id: "suggestions", label: "AI Suggestions", icon: "💡", color: "#dc2626", prompt: "You are Plasmed in AI Suggestions mode for aesthetic treatment recommendations." },
]
}
];

const FREE_LIMIT = 500;

const userBubbleStyle = function(color) {
return {
maxWidth: "72%",
padding: "12px 16px",
borderRadius: "20px 20px 4px 20px",
background: color,
color: "#fff",
fontSize: 14,
lineHeight: 1.65,
whiteSpace: "pre-wrap"
};
};

const aiBubbleStyle = {
maxWidth: "72%",
padding: "12px 16px",
borderRadius: "20px 20px 20px 4px",
background: "#fff",
border: "1px solid #e2e8f0",
color: "#1e293b",
fontSize: 14,
lineHeight: 1.65,
whiteSpace: "pre-wrap"
};

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
supabase.auth.getSession().then(function(res) { setSession(res.data.session); });
supabase.auth.onAuthStateChange(function(_event, session) { setSession(session); });
}, []);

useEffect(function() { if (session) fetchProfile(); }, [session]);
useEffect(function() { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

async function fetchProfile() {
var res = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
setProfile(res.data);
}

async function handleAuth() {
setAuthError("");
if (authMode === "login") {
var res = await supabase.auth.signInWithPassword({ email: email, password: password });
if (res.error) setAuthError(res.error.message);
} else {
var res2 = await supabase.auth.signUp({ email: email, password: password });
if (res2.error) setAuthError(res2.error.message);
else setAuthError("Check your email to confirm your account!");
}
}

async function handleSignOut() {
await supabase.auth.signOut();
setMessages([]);
setProfile(null);
setSpecialty(null);
setActiveMode(null);
}

function selectSpecialty(s) {
setSpecialty(s);
setActiveMode(s.modes[0]);
setMessages([]);
}

async function sendMessage() {
if (!input.trim() || loading) return;
if (profile && profile.plan === "free" && profile.message_count >= FREE_LIMIT) {
alert("Free limit reached! Upgrade to Pro for unlimited messages.");
return;
}
var userMsg = { role: "user", content: input.trim() };
var newMessages = messages.concat([userMsg]);
setMessages(newMessages);
setInput("");
setLoading(true);
await supabase.from("profiles").update({ message_count: (profile ? profile.message_count || 0 : 0) + 1 }).eq("id", session.user.id);
await fetchProfile();
try {
var response = await fetch("/api/chat", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, system: activeMode.prompt, messages: newMessages }),
});
var data = await response.json();
var text = data.content && data.content[0] ? data.content[0].text : "Error getting response.";
setMessages(newMessages.concat([{ role: "assistant", content: text }]));
} catch(e) {
setMessages(newMessages.concat([{ role: "assistant", content: "Connection error. Please try again." }]));
}
setLoading(false);
}

if (!session) {
return (
<div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Segoe UI, sans-serif" }}>
<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "48px 40px", width: 380, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}>
<div style={{ textAlign: "center", marginBottom: 36 }}>
<div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
PLAS<span style={{ color: "#2563eb" }}>MED</span>
</div>
<div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>AI for Medical Practices</div>
<div style={{ width: 40, height: 3, background: "#2563eb", borderRadius: 2, margin: "16px auto 0" }} />
</div>
<div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8, letterSpacing: "0.5px" }}>
{authMode === "login" ? "SIGN IN TO YOUR ACCOUNT" : "CREATE YOUR ACCOUNT"}
</div>
<input
value={email}
onChange={function(e) { setEmail(e.target.value); }}
placeholder="Email address"
style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, marginBottom: 12, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
/>
<input
value={password}
onChange={function(e) { setPassword(e.target.value); }}
placeholder="Password"
type="password"
onKeyDown={function(e) { if (e.key === "Enter") handleAuth(); }}
style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
/>
{authError && (
<div style={{ fontSize: 13, marginBottom: 12, textAlign: "center", padding: "8px 12px", borderRadius: 8, color: authError.includes("Check") ? "#16a34a" : "#dc2626", background: authError.includes("Check") ? "#f0fdf4" : "#fef2f2" }}>
{authError}
</div>
)}
<button
onClick={handleAuth}
style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 16, fontFamily: "inherit" }}
>
{authMode === "login" ? "Sign In" : "Create Account"}
</button>
<div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
{authMode === "login" ? "No account? " : "Have an account? "}
<span
onClick={function() { setAuthMode(authMode === "login" ? "signup" : "login"); }}
style={{ color: "#2563eb", cursor: "pointer", fontWeight: 600 }}
>
{authMode === "login" ? "Sign up free" : "Sign in"}
</span>
</div>
<div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "center", gap: 20 }}>
{["POPIA Compliant", "SA Doctors", "Secure"].map(function(tag) {
return (
<div key={tag} style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
<div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
{tag}
</div>
);
})}
</div>
</div>
</div>
);
}

if (!specialty) {
return (
<div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Segoe UI, sans-serif" }}>
<div style={{ padding: "0 28px", height: 60, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
<div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
PLAS<span style={{ color: "#2563eb" }}>MED</span>
</div>
<button onClick={handleSignOut} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
Sign Out
</button>
</div>
<div style={{ maxWidth: 700, margin: "0 auto", padding: "60px 24px" }}>
<div style={{ textAlign: "center", marginBottom: 48 }}>
<div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Select Your Specialty</div>
<div style={{ color: "#94a3b8", fontSize: 15 }}>Choose your practice type to load the right AI tools</div>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
{SPECIALTIES.map(function(s) {
return (
<div
key={s.id}
onClick={function() { selectSpecialty(s); }}
style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: 16, padding: 28, cursor: "pointer", textAlign: "center" }}
>
<div style={{ fontSize: 40, marginBottom: 12 }}>{s.icon}</div>
<div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{s.label}</div>
<div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{s.description}</div>
<div style={{ marginTop: 16, padding: "8px 16px", background: s.color + "18", color: s.color, borderRadius: 20, fontSize: 12, fontWeight: 600, display: "inline-block" }}>
{s.modes.length} AI Modes
</div>
</div>
);
})}
</div>
</div>
</div>
);
}

return (
<div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Segoe UI, sans-serif", display: "flex", flexDirection: "column" }}>
<div style={{ padding: "0 28px", height: 60, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
<div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
PLAS<span style={{ color: "#2563eb" }}>MED</span>
</div>
<div style={{ width: 1, height: 18, background: "#e2e8f0" }} />
<div style={{ fontSize: 12, color: "#fff", background: specialty.color, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
{specialty.icon} {specialty.label}
</div>
<button
onClick={function() { setSpecialty(null); setMessages([]); }}
style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}
>
Change
</button>
</div>
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
<div style={{ fontSize: 12, color: "#94a3b8", background: "#f8fafc", padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
{profile && profile.plan === "free" ? (profile.message_count || 0) + " / " + FREE_LIMIT : "Unlimited"}
</div>
<button onClick={handleSignOut} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
Sign Out
</button>
</div>
</div>

<div style={{ display: "flex", gap: 6, padding: "10px 28px", borderBottom: "1px solid #f1f5f9", overflowX: "auto", background: "#fff" }}>
{specialty.modes.map(function(mode) {
var isActive = activeMode && activeMode.id === mode.id;
return (
<button
key={mode.id}
onClick={function() { setActiveMode(mode); setMessages([]); }}
style={{ padding: "7px 16px", borderRadius: 20, border: "1.5px solid " + (isActive ? mode.color : "#e2e8f0"), background: isActive ? mode.color + "18" : "#fff", color: isActive ? mode.color : "#64748b", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", fontWeight: isActive ? 600 : 400 }}
>
{mode.icon} {mode.label}
</button>
);
})}
</div>

<div style={{ flex: 1, overflowY: "auto", padding: "28px 24px", maxWidth: 780, width: "100%", margin: "0 auto", alignSelf: "stretch" }}>
{messages.length === 0 && (
<div style={{ textAlign: "center", marginTop: 80 }}>
<div style={{ fontSize: 36, marginBottom: 12 }}>{activeMode ? activeMode.icon : "🏥"}</div>
<div style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
{activeMode ? activeMode.label : "Welcome"} Mode
</div>
<div style={{ fontSize: 13, color: "#cbd5e1" }}>Ask your {specialty.label} question below</div>
</div>
)}
{messages.map(function(msg, i) {
return (
<div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 16 }}>
{msg.role === "assistant" && activeMode && (
<div style={{ width: 28, height: 28, borderRadius: "50%", background: activeMode.color + "18", border: "1.5px solid " + activeMode.color + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginRight: 8, flexShrink: 0, marginTop: 2 }}>
{activeMode.icon}
</div>
)}
<div style={msg.role === "user" ? userBubbleStyle(activeMode ? activeMode.color : "#2563eb") : aiBubbleStyle}>
{msg.content}
</div>
</div>
);
})}
{loading && activeMode && (
<div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
<div style={{ width: 28, height: 28, borderRadius: "50%", background: activeMode.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
{activeMode.icon}
</div>
<div style={{ color: "#94a3b8", fontSize: 13 }}>PLASMED is thinking…</div>
</div>
)}
<div ref={bottomRef} />
</div>

<div style={{ padding: "14px 24px 24px", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
<div style={{ maxWidth: 780, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
<textarea
value={input}
onChange={function(e) { setInput(e.target.value); }}
onKeyDown={function(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
placeholder={activeMode ? "Ask " + activeMode.label + " anything..." : "Ask anything..."}
rows={1}
style={{ flex: 1, padding: "12px 16px", borderRadius: 14, border: "1.5px solid " + (activeMode ? activeMode.color + "44" : "#e2e8f0"), background: "#f8fafc", color: "#1e293b", fontSize: 14, resize: "none", fontFamily: "inherit", outline: "none" }}
/>
<button
onClick={sendMessage}
disabled={!input.trim() || loading}
style={{ width: 46, height: 46, borderRadius: 12, border: "none", background: input.trim() && !loading ? (activeMode ? activeMode.color : "#2563eb") : "#e2e8f0", cursor: input.trim() && !loading ? "pointer" : "not-allowed", color: input.trim() && !loading ? "#fff" : "#94a3b8", fontSize: 18, fontWeight: 700 }}
>
↑
</button>
</div>
</div>
</div>
);
}
