import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MODES = [
{ id: "general", label: "General", icon: "⚡", color: "#2563eb", prompt: "You are Plasmed, a highly intelligent and helpful AI assistant for medical practices." },
{ id: "medical", label: "Medical", icon: "🏥", color: "#0891b2", prompt: "You are Plasmed, an AI assistant for medical professionals. You help doctors and dentists with patient communication, clinical summaries, referral letters, medical reports, and answering common patient questions professionally and accurately. Always maintain patient confidentiality and recommend consulting a qualified physician for specific medical advice." },
{ id: "receptionist", label: "Receptionist", icon: "📋", color: "#0d9488", prompt: "You are Plasmed in Receptionist mode. You help medical receptionists draft appointment confirmations, patient reminders, follow-up messages, and handle general patient enquiries in a warm, professional manner." },
{ id: "reports", label: "Reports", icon: "📝", color: "#7c3aed", prompt: "You are Plasmed in Reports mode. You help medical professionals write and structure clinical notes, patient reports, referral letters, and medical certificates clearly and professionally." },
{ id: "patient", label: "Patient Info", icon: "💊", color: "#dc2626", prompt: "You are Plasmed in Patient Info mode. You explain medical conditions, procedures, medications, and aftercare instructions in simple, easy-to-understand language suitable for patients. Always recommend consulting their doctor for personal medical advice." },
];

const FREE_LIMIT = 500;

const styles = {
page: {
minHeight: "100vh",
background: "#f8fafc",
fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
display: "flex",
flexDirection: "column",
},
loginPage: {
minHeight: "100vh",
background: "#f8fafc",
display: "flex",
alignItems: "center",
justifyContent: "center",
fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
backgroundImage: "radial-gradient(circle at 20% 50%, #e0f2fe 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f0fdf4 0%, transparent 40%)",
},
loginCard: {
background: "#ffffff",
border: "1px solid #e2e8f0",
borderRadius: 20,
padding: "48px 40px",
width: 380,
boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 40px -10px rgba(0,0,0,0.08)",
},
logo: {
fontSize: 28,
fontWeight: 800,
color: "#0f172a",
letterSpacing: "-0.5px",
},
logoAccent: {
color: "#2563eb",
},
tagline: {
color: "#94a3b8",
fontSize: 13,
marginTop: 4,
fontWeight: 400,
letterSpacing: "0.3px",
},
input: {
width: "100%",
padding: "12px 16px",
borderRadius: 10,
border: "1.5px solid #e2e8f0",
background: "#ffffff",
color: "#1e293b",
fontSize: 14,
marginBottom: 12,
boxSizing: "border-box",
outline: "none",
transition: "border-color 0.2s",
fontFamily: "inherit",
},
primaryBtn: {
width: "100%",
padding: "13px",
borderRadius: 10,
border: "none",
background: "#2563eb",
color: "#ffffff",
fontSize: 15,
fontWeight: 600,
cursor: "pointer",
marginBottom: 16,
fontFamily: "inherit",
transition: "background 0.2s, transform 0.1s",
},
navbar: {
padding: "0 28px",
height: 60,
borderBottom: "1px solid #e2e8f0",
display: "flex",
alignItems: "center",
justifyContent: "space-between",
background: "#ffffff",
boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
},
navLogo: {
fontSize: 18,
fontWeight: 800,
color: "#0f172a",
letterSpacing: "-0.5px",
},
signOutBtn: {
background: "#f1f5f9",
border: "1px solid #e2e8f0",
color: "#64748b",
padding: "6px 14px",
borderRadius: 8,
fontSize: 12,
cursor: "pointer",
fontFamily: "inherit",
fontWeight: 500,
},
modesBar: {
display: "flex",
gap: 6,
padding: "10px 28px",
borderBottom: "1px solid #f1f5f9",
overflowX: "auto",
background: "#ffffff",
},
modeBtn: (active, color) => ({
padding: "7px 16px",
borderRadius: 20,
border: `1.5px solid ${active ? color : "#e2e8f0"}`,
background: active ? color + "12" : "#ffffff",
color: active ? color : "#64748b",
fontSize: 13,
cursor: "pointer",
whiteSpace: "nowrap",
fontFamily: "inherit",
fontWeight: active ? 600 : 400,
transition: "all 0.15s",
}),
chatArea: {
flex: 1,
overflowY: "auto",
padding: "28px 24px",
maxWidth: 780,
width: "100%",
margin: "0 auto",
alignSelf: "stretch",
},
emptyState: {
textAlign: "center",
marginTop: 80,
color: "#cbd5e1",
fontSize: 15,
},
emptyIcon: {
fontSize: 40,
marginBottom: 12,
},
userBubble: (color) => ({
maxWidth: "72%",
padding: "12px 16px",
borderRadius: "20px 20px 4px 20px",
background: color,
color: "#ffffff",
fontSize: 14,
lineHeight: 1.65,
whiteSpace: "pre-wrap",
boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
}),
aiBubble: {
maxWidth: "72%",
padding: "12px 16px",
borderRadius: "20px 20px 20px 4px",
background: "#ffffff",
border: "1px solid #e2e8f0",
color: "#1e293b",
fontSize: 14,
lineHeight: 1.65,
whiteSpace: "pre-wrap",
boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
},
inputBar: {
padding: "14px 24px 24px",
background: "#ffffff",
borderTop: "1px solid #e2e8f0",
},
inputInner: {
maxWidth: 780,
margin: "0 auto",
display: "flex",
gap: 10,
alignItems: "flex-end",
},
textarea: (color) => ({
flex: 1,
padding: "12px 16px",
borderRadius: 14,
border: `1.5px solid ${color}44`,
background: "#f8fafc",
color: "#1e293b",
fontSize: 14,
resize: "none",
fontFamily: "inherit",
outline: "none",
}),
sendBtn: (active, color) => ({
width: 46,
height: 46,
borderRadius: 12,
border: "none",
background: active ? color : "#e2e8f0",
cursor: active ? "pointer" : "not-allowed",
color: active ? "#fff" : "#94a3b8",
fontSize: 18,
fontWeight: 700,
transition: "background 0.2s",
}),
};

export default function App() {
const [session, setSession] = useState(null);
const [profile, setProfile] = useState(null);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [authMode, setAuthMode] = useState("login");
const [authError, setAuthError] = useState("");
const [messages, setMessages] = useState([]);
const [input, setInput] = useState("");
const [loading, setLoading] = useState(false);
const [activeMode, setActiveMode] = useState(MODES[0]);
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

if (!session) return (
<div style={styles.loginPage}>
<div style={styles.loginCard}>
<div style={{ textAlign: "center", marginBottom: 36 }}>
<div style={styles.logo}>PLAS<span style={styles.logoAccent}>MED</span></div>
<div style={styles.tagline}>AI for Medical Practices</div>
<div style={{ width: 40, height: 3, background: "#2563eb", borderRadius: 2, margin: "16px auto 0" }} />
</div>
<div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.5px" }}>
{authMode === "login" ? "SIGN IN TO YOUR ACCOUNT" : "CREATE YOUR ACCOUNT"}
</div>
<input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={styles.input}
onFocus={e => e.target.style.borderColor = "#2563eb"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
<input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={styles.input}
onFocus={e => e.target.style.borderColor = "#2563eb"} onBlur={e => e.target.style.borderColor = "#e2e8f0"}
onKeyDown={e => e.key === "Enter" && handleAuth()} />
{authError && (
<div style={{ color: authError.includes("Check") ? "#16a34a" : "#dc2626", fontSize: 13, marginBottom: 12, textAlign: "center", padding: "8px 12px", background: authError.includes("Check") ? "#f0fdf4" : "#fef2f2", borderRadius: 8 }}>
{authError}
</div>
)}
<button onClick={handleAuth} style={styles.primaryBtn}
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

return (
<div style={styles.page}>
<div style={styles.navbar}>
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
<div style={styles.navLogo}>PLAS<span style={{ color: "#2563eb" }}>MED</span></div>
<div style={{ width: 1, height: 18, background: "#e2e8f0" }} />
<div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>AI for Medical Practices</div>
</div>
<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
<div style={{ fontSize: 12, color: "#94a3b8", background: "#f8fafc", padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
{profile?.plan === "free" ? `${profile?.message_count || 0} / ${FREE_LIMIT} messages` : "✦ Unlimited"}
</div>
<button onClick={handleSignOut} style={styles.signOutBtn}>Sign Out</button>
</div>
</div>
<div style={styles.modesBar}>
{MODES.map(mode => (
<button key={mode.id} onClick={() => setActiveMode(mode)} style={styles.modeBtn(activeMode.id === mode.id, mode.color)}>
{mode.icon} {mode.label}
</button>
))}
</div>
<div style={styles.chatArea}>
{messages.length === 0 && (
<div style={styles.emptyState}>
<div style={styles.emptyIcon}>🏥</div>
<div style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>Welcome to PLASMED</div>
<div style={{ fontSize: 13, color: "#cbd5e1" }}>Select a mode above and start your clinical query</div>
</div>
)}
{messages.map((msg, i) => (
<div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 16 }}>
{msg.role === "assistant" && (
<div style={{ width: 28, height: 28, borderRadius: "50%", background: activeMode.color + "15", border: `1.5px solid ${activeMode.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginRight: 8, flexShrink: 0, marginTop: 2 }}>
{activeMode.icon}
</div>
)}
<div style={msg.role === "user" ? styles.userBubble(activeMode.color) : styles.aiBubble}>{msg.content}</div>
</div>
))}
{loading && (
<div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
<div style={{ width: 28, height: 28, borderRadius: "50%", background: activeMode.color + "15", border: `1.5px solid ${activeMode.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
{activeMode.icon}
</div>
<div style={{ color: "#94a3b8", fontSize: 13 }}>PLASMED is thinking…</div>
</div>
)}
<div ref={bottomRef} />
</div>
<div style={styles.inputBar}>
<div style={styles.inputInner}>
<textarea value={input} onChange={e => setInput(e.target.value)}
onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
placeholder={`Ask ${activeMode.label} anything…`} rows={1} style={styles.textarea(activeMode.color)} />
<button onClick={sendMessage} disabled={!input.trim() || loading} style={styles.sendBtn(input.trim() && !loading, activeMode.color)}>↑</button>
</div>
</div>
</div>
);
}
