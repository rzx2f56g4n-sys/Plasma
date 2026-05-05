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
],
notePrompt: "You are a clinical notes AI for a South African GP. Convert the following consultation transcript into a professional structured SOAP note with these sections: SUBJECTIVE (patient complaint, history), OBJECTIVE (vitals, examination findings), ASSESSMENT (diagnosis or differential), PLAN (treatment, medications, referrals, follow-up). Be concise and clinical."
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
],
notePrompt: "You are a clinical notes AI for a South African dentist. Convert the following consultation transcript into a structured dental note with: COMPLAINT, EXAMINATION, DIAGNOSIS, TREATMENT PLAN, and NOTES. Be concise and professional."
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
],
notePrompt: "You are a clinical notes AI for a South African aesthetic doctor. Convert the following consultation transcript into a structured aesthetic consult note with: CLIENT COMPLAINT / CONCERN, SKIN ASSESSMENT, TREATMENT PERFORMED, PRODUCTS USED, AFTERCARE ADVICE, and FOLLOW-UP PLAN. Be concise and professional."
}
];

const FREE_LIMIT = 500;

function userBubbleStyle(color) {
return { maxWidth: "72%", padding: "12px 16px", borderRadius: "20px 20px 4px 20px", background: color, color: "#fff", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" };
}

var aiBubbleStyle = { maxWidth: "72%", padding: "12px 16px", borderRadius: "20px 20px 20px 4px", background: "#fff", border: "1px solid #e2e8f0", color: "#1e293b", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" };

var DEMO_PATIENTS = [
{ id: 1, name: "Sarah M.", age: 34, lastVisit: "2026-04-10", treatment: "Jessner's Peel", followUpDays: 30, notes: "Responded well. Recommend Cosmelan next." },
{ id: 2, name: "James K.", age: 52, lastVisit: "2026-04-25", treatment: "Hypertension review", followUpDays: 14, notes: "BP 148/92. On Amlodipine 5mg." },
{ id: 3, name: "Priya N.", age: 28, lastVisit: "2026-05-01", treatment: "Botox — forehead", followUpDays: 14, notes: "First time. 20 units used." },
{ id: 4, name: "David L.", age: 45, lastVisit: "2026-03-20", treatment: "Diabetes check", followUpDays: 30, notes: "HbA1c 7.2. Metformin 500mg BD." },
];

function getDaysUntilFollowUp(lastVisit, followUpDays) {
var last = new Date(lastVisit);
var due = new Date(last.getTime() + followUpDays * 24 * 60 * 60 * 1000);
var today = new Date();
return Math.ceil((due - today) / (24 * 60 * 60 * 1000));
}

export default function App() {
var [session, setSession] = useState(null);
var [profile, setProfile] = useState(null);
var [email, setEmail] = useState("");
var [password, setPassword] = useState("");
var [authMode, setAuthMode] = useState("login");
var [authError, setAuthError] = useState("");
var [specialty, setSpecialty] = useState(null);
var [activeTab, setActiveTab] = useState("chat");
var [messages, setMessages] = useState([]);
var [input, setInput] = useState("");
var [loading, setLoading] = useState(false);
var [activeMode, setActiveMode] = useState(null);
var [isRecording, setIsRecording] = useState(false);
var [transcript, setTranscript] = useState("");
var [generatedNote, setGeneratedNote] = useState("");
var [noteLoading, setNoteLoading] = useState(false);
var [copied, setCopied] = useState(false);
var [patients, setPatients] = useState(DEMO_PATIENTS);
var [showAddPatient, setShowAddPatient] = useState(false);
var [newPatient, setNewPatient] = useState({ name: "", age: "", lastVisit: "", treatment: "", followUpDays: 14, notes: "" });
var [selectedPatient, setSelectedPatient] = useState(null);
var [aiReminder, setAiReminder] = useState("");
var [reminderLoading, setReminderLoading] = useState(false);
var recognitionRef = useRef(null);
var bottomRef = useRef(null);

useEffect(function() {
supabase.auth.getSession().then(function(res) { setSession(res.data.session); });
supabase.auth.onAuthStateChange(function(_e, s) { setSession(s); });
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
var r = await supabase.auth.signInWithPassword({ email: email, password: password });
if (r.error) setAuthError(r.error.message);
} else {
var r2 = await supabase.auth.signUp({ email: email, password: password });
if (r2.error) setAuthError(r2.error.message);
else setAuthError("Check your email to confirm your account!");
}
}

async function handleSignOut() {
await supabase.auth.signOut();
setMessages([]); setProfile(null); setSpecialty(null); setActiveMode(null);
setTranscript(""); setGeneratedNote("");
}

function selectSpecialty(s) {
setSpecialty(s); setActiveMode(s.modes[0]); setMessages([]);
setTranscript(""); setGeneratedNote(""); setActiveTab("chat");
}

function startRecording() {
var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) { alert("Please use Chrome or Edge for voice recording."); return; }
var rec = new SR();
rec.continuous = true; rec.interimResults = true; rec.lang = "en-ZA";
var final = "";
rec.onresult = function(e) {
var interim = "";
for (var i = e.resultIndex; i < e.results.length; i++) {
if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
else interim += e.results[i][0].transcript;
}
setTranscript(final + interim);
};
rec.onerror = function() { setIsRecording(false); };
rec.onend = function() { setIsRecording(false); };
recognitionRef.current = rec;
rec.start();
setIsRecording(true); setGeneratedNote("");
}

function stopRecording() {
if (recognitionRef.current) recognitionRef.current.stop();
setIsRecording(false);
}

async function generateNote() {
if (!transcript.trim()) return;
setNoteLoading(true); setGeneratedNote("");
try {
var res = await fetch("/api/chat", {
method: "POST", headers: { "Content-Type": "application/json" },
body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, system: specialty.notePrompt, messages: [{ role: "user", content: "Convert this consultation transcript into a structured clinical note:\n\n" + transcript }] }),
});
var data = await res.json();
setGeneratedNote(data.content && data.content[0] ? data.content[0].text : "Error generating note.");
} catch(e) { setGeneratedNote("Connection error. Please try again."); }
setNoteLoading(false);
}

function copyNote() {
navigator.clipboard.writeText(generatedNote);
setCopied(true);
setTimeout(function() { setCopied(false); }, 2000);
}

async function generateReminder(patient) {
setSelectedPatient(patient); setAiReminder(""); setReminderLoading(true);
var daysUntil = getDaysUntilFollowUp(patient.lastVisit, patient.followUpDays);
var prompt = "You are a medical practice assistant. Generate a warm, professional follow-up reminder message for a patient. Patient: " + patient.name + ", Age: " + patient.age + ", Last treatment: " + patient.treatment + " on " + patient.lastVisit + ", Notes: " + patient.notes + ". Follow-up is " + (daysUntil < 0 ? Math.abs(daysUntil) + " days overdue" : "due in " + daysUntil + " days") + ". Write a short, friendly SMS-style reminder.";
try {
var res = await fetch("/api/chat", {
method: "POST", headers: { "Content-Type": "application/json" },
body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 300, system: "You are a medical practice assistant writing patient follow-up reminders.", messages: [{ role: "user", content: prompt }] }),
});
var data = await res.json();
setAiReminder(data.content && data.content[0] ? data.content[0].text : "Error.");
} catch(e) { setAiReminder("Connection error."); }
setReminderLoading(false);
}

function addPatient() {
if (!newPatient.name || !newPatient.lastVisit || !newPatient.treatment) return;
var p = Object.assign({}, newPatient, { id: Date.now(), age: parseInt(newPatient.age) || 0, followUpDays: parseInt(newPatient.followUpDays) || 14 });
setPatients(patients.concat([p]));
setNewPatient({ name: "", age: "", lastVisit: "", treatment: "", followUpDays: 14, notes: "" });
setShowAddPatient(false);
}

async function sendMessage() {
if (!input.trim() || loading) return;
var userMsg = { role: "user", content: input.trim() };
var newMessages = messages.concat([userMsg]);
setMessages(newMessages); setInput(""); setLoading(true);
await supabase.from("profiles").update({ message_count: (profile ? profile.message_count || 0 : 0) + 1 }).eq("id", session.user.id);
await fetchProfile();
try {
var res = await fetch("/api/chat", {
method: "POST", headers: { "Content-Type": "application/json" },
body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, system: activeMode.prompt, messages: newMessages }),
});
var data = await res.json();
setMessages(newMessages.concat([{ role: "assistant", content: data.content && data.content[0] ? data.content[0].text : "Error." }]));
} catch(e) { setMessages(newMessages.concat([{ role: "assistant", content: "Connection error." }])); }
setLoading(false);
}

if (!session) {
return (
<div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Segoe UI, sans-serif" }}>
<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "48px 40px", width: 380, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}>
<div style={{ textAlign: "center", marginBottom: 36 }}>
<div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>PLAS<span style={{ color: "#2563eb" }}>MED</span></div>
<div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>AI for Medical Practices</div>
<div style={{ width: 40, height: 3, background: "#2563eb", borderRadius: 2, margin: "16px auto 0" }} />
</div>
<input value={email} onChange={function(e) { setEmail(e.target.value); }} placeholder="Email address"
style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, marginBottom: 12, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
<input value={password} onChange={function(e) { setPassword(e.target.value); }} placeholder="Password" type="password"
onKeyDown={function(e) { if (e.key === "Enter") handleAuth(); }}
style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
{authError && (
<div style={{ fontSize: 13, marginBottom: 12, textAlign: "center", padding: "8px 12px", borderRadius: 8, color: authError.includes("Check") ? "#16a34a" : "#dc2626", background: authError.includes("Check") ? "#f0fdf4" : "#fef2f2" }}>
{authError}
</div>
)}
<button onClick={handleAuth} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 16, fontFamily: "inherit" }}>
{authMode === "login" ? "Sign In" : "Create Account"}
</button>
<div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
{authMode === "login" ? "No account? " : "Have an account? "}
<span onClick={function() { setAuthMode(authMode === "login" ? "signup" : "login"); }} style={{ color: "#2563eb", cursor: "pointer", fontWeight: 600 }}>
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
<div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>PLAS<span style={{ color: "#2563eb" }}>MED</span></div>
<button onClick={handleSignOut} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Sign Out</button>
</div>
<div style={{ maxWidth: 700, margin: "0 auto", padding: "60px 24px" }}>
<div style={{ textAlign: "center", marginBottom: 48 }}>
<div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Select Your Specialty</div>
<div style={{ color: "#94a3b8", fontSize: 15 }}>Choose your practice type to load the right AI tools</div>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
{SPECIALTIES.map(function(s) {
return (
<div key={s.id} onClick={function() { selectSpecialty(s); }}
style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: 16, padding: 28, cursor: "pointer", textAlign: "center" }}>
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

var tabs = [
{ id: "chat", label: "AI Chat", icon: "💬" },
{ id: "voice", label: "Voice-to-Note", icon: "🎤" },
{ id: "patients", label: "Follow-ups", icon: "👥" },
];

var overduePatients = patients.filter(function(p) { return getDaysUntilFollowUp(p.lastVisit, p.followUpDays) < 0; });
var dueSoonPatients = patients.filter(function(p) { var d = getDaysUntilFollowUp(p.lastVisit, p.followUpDays); return d >= 0 && d <= 7; });

return (
<div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Segoe UI, sans-serif", display: "flex", flexDirection: "column" }}>
<div style={{ padding: "0 28px", height: 60, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
<div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>PLAS<span style={{ color: "#2563eb" }}>MED</span></div>
<div style={{ width: 1, height: 18, background: "#e2e8f0" }} />
<div style={{ fontSize: 12, color: "#fff", background: specialty.color, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{specialty.icon} {specialty.label}</div>
<button onClick={function() { setSpecialty(null); setMessages([]); }} style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>Change</button>
</div>
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
{overduePatients.length > 0 && (
<div style={{ fontSize: 12, color: "#dc2626", background: "#fef2f2", padding: "4px 10px", borderRadius: 6, border: "1px solid #fecaca", fontWeight: 600 }}>
⚠ {overduePatients.length} overdue
</div>
)}
<div style={{ fontSize: 12, color: "#94a3b8", background: "#f8fafc", padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
{profile && profile.plan === "free" ? (profile.message_count || 0) + " / " + FREE_LIMIT : "Unlimited"}
</div>
<button onClick={handleSignOut} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Sign Out</button>
</div>
</div>

<div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#fff", padding: "0 28px" }}>
{tabs.map(function(tab) {
var isActive = activeTab === tab.id;
return (
<button key={tab.id} onClick={function() { setActiveTab(tab.id); }}
style={{ padding: "14px 20px", border: "none", borderBottom: isActive ? "2px solid " + specialty.color : "2px solid transparent", background: "none", color: isActive ? specialty.color : "#94a3b8", fontSize: 14, fontWeight: isActive ? 600 : 400, cursor: "pointer", fontFamily: "inherit", marginBottom: -1, position: "relative" }}>
{tab.icon} {tab.label}
{tab.id === "patients" && overduePatients.length > 0 && (
<span style={{ position: "absolute", top: 8, right: 4, width: 8, height: 8, background: "#dc2626", borderRadius: "50%", display: "block" }} />
)}
</button>
);
})}
</div>

{/* CHAT TAB */}
{activeTab === "chat" && (
<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
<div style={{ display: "flex", gap: 6, padding: "10px 28px", borderBottom: "1px solid #f1f5f9", overflowX: "auto", background: "#fff" }}>
{specialty.modes.map(function(mode) {
var isActive = activeMode && activeMode.id === mode.id;
return (
<button key={mode.id} onClick={function() { setActiveMode(mode); setMessages([]); }}
style={{ padding: "7px 16px", borderRadius: 20, border: "1.5px solid " + (isActive ? mode.color : "#e2e8f0"), background: isActive ? mode.color + "18" : "#fff", color: isActive ? mode.color : "#64748b", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", fontWeight: isActive ? 600 : 400 }}>
{mode.icon} {mode.label}
</button>
);
})}
</div>
<div style={{ flex: 1, overflowY: "auto", padding: "28px 24px", maxWidth: 780, width: "100%", margin: "0 auto", alignSelf: "stretch" }}>
{messages.length === 0 && (
<div style={{ textAlign: "center", marginTop: 80 }}>
<div style={{ fontSize: 36, marginBottom: 12 }}>{activeMode ? activeMode.icon : "🏥"}</div>
<div style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>{activeMode ? activeMode.label : "Welcome"} Mode</div>
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
<div style={{ width: 28, height: 28, borderRadius: "50%", background: activeMode.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{activeMode.icon}</div>
<div style={{ color: "#94a3b8", fontSize: 13 }}>PLASMED is thinking…</div>
</div>
)}
<div ref={bottomRef} />
</div>
<div style={{ padding: "14px 24px 24px", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
<div style={{ maxWidth: 780, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
<textarea value={input} onChange={function(e) { setInput(e.target.value); }}
onKeyDown={function(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
placeholder={activeMode ? "Ask " + activeMode.label + " anything..." : "Ask anything..."}
rows={1} style={{ flex: 1, padding: "12px 16px", borderRadius: 14, border: "1.5px solid " + (activeMode ? activeMode.color + "44" : "#e2e8f0"), background: "#f8fafc", color: "#1e293b", fontSize: 14, resize: "none", fontFamily: "inherit", outline: "none" }} />
<button onClick={sendMessage} disabled={!input.trim() || loading}
style={{ width: 46, height: 46, borderRadius: 12, border: "none", background: input.trim() && !loading ? (activeMode ? activeMode.color : "#2563eb") : "#e2e8f0", cursor: input.trim() && !loading ? "pointer" : "not-allowed", color: input.trim() && !loading ? "#fff" : "#94a3b8", fontSize: 18, fontWeight: 700 }}>↑</button>
</div>
</div>
</div>
)}

{/* VOICE-TO-NOTE TAB */}
{activeTab === "voice" && (
<div style={{ flex: 1, padding: "32px 24px", maxWidth: 780, width: "100%", margin: "0 auto", alignSelf: "stretch" }}>
<div style={{ marginBottom: 24 }}>
<div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Voice-to-Note</div>
<div style={{ fontSize: 13, color: "#94a3b8" }}>Speak your consultation freely — PLASMED converts it to a structured clinical note</div>
</div>
<div style={{ textAlign: "center", marginBottom: 28 }}>
<button onClick={isRecording ? stopRecording : startRecording}
style={{ width: 80, height: 80, borderRadius: "50%", border: "none", background: isRecording ? "#dc2626" : specialty.color, color: "#fff", fontSize: 32, cursor: "pointer", boxShadow: isRecording ? "0 0 0 8px rgba(220,38,38,0.2)" : "0 4px 16px rgba(0,0,0,0.12)" }}>
{isRecording ? "⏹" : "🎤"}
</button>
<div style={{ marginTop: 12, fontSize: 13, color: isRecording ? "#dc2626" : "#94a3b8", fontWeight: isRecording ? 600 : 400 }}>
{isRecording ? "Recording... tap to stop" : "Tap to start recording"}
</div>
</div>
{transcript && (
<div style={{ marginBottom: 20 }}>
<div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>TRANSCRIPT</div>
<div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, fontSize: 14, color: "#1e293b", lineHeight: 1.65, minHeight: 80 }}>{transcript}</div>
<button onClick={generateNote} disabled={noteLoading}
style={{ marginTop: 12, width: "100%", padding: "12px", borderRadius: 10, border: "none", background: noteLoading ? "#e2e8f0" : specialty.color, color: noteLoading ? "#94a3b8" : "#fff", fontSize: 14, fontWeight: 600, cursor: noteLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
{noteLoading ? "Generating note…" : "✨ Generate Clinical Note"}
</button>
</div>
)}
{generatedNote && (
<div>
<div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>GENERATED NOTE</div>
<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, fontSize: 14, color: "#1e293b", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{generatedNote}</div>
<button onClick={copyNote}
style={{ marginTop: 12, width: "100%", padding: "12px", borderRadius: 10, border: "none", background: copied ? "#16a34a" : "#0f172a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
{copied ? "✓ Copied!" : "📋 Copy for EMR"}
</button>
<button onClick={function() { setTranscript(""); setGeneratedNote(""); }}
style={{ marginTop: 8, width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
New Consultation
</button>
</div>
)}
</div>
)}

{/* FOLLOW-UPS TAB */}
{activeTab === "patients" && (
<div style={{ flex: 1, padding: "24px", maxWidth: 780, width: "100%", margin: "0 auto", alignSelf: "stretch" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
<div>
<div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Patient Follow-ups</div>
<div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{overduePatients.length} overdue · {dueSoonPatients.length} due this week</div>
</div>
<button onClick={function() { setShowAddPatient(!showAddPatient); }}
style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: specialty.color, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
+ Add Patient
</button>
</div>

{showAddPatient && (
<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, marginBottom: 20 }}>
<div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 14 }}>New Patient</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
<input placeholder="Patient name" value={newPatient.name} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { name: e.target.value })); }}
style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
<input placeholder="Age" value={newPatient.age} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { age: e.target.value })); }}
style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
<input placeholder="Last visit date" type="date" value={newPatient.lastVisit} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { lastVisit: e.target.value })); }}
style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
<input placeholder="Treatment / reason" value={newPatient.treatment} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { treatment: e.target.value })); }}
style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
</div>
<input placeholder="Follow-up in how many days?" value={newPatient.followUpDays} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { followUpDays: e.target.value })); }}
style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
<input placeholder="Clinical notes" value={newPatient.notes} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { notes: e.target.value })); }}
style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
<button onClick={addPatient}
style={{ width: "100%", padding: "11px", borderRadius: 8, border: "none", background: specialty.color, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
Save Patient
</button>
</div>
)}

<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
{patients.sort(function(a, b) { return getDaysUntilFollowUp(a.lastVisit, a.followUpDays) - getDaysUntilFollowUp(b.lastVisit, b.followUpDays); }).map(function(patient) {
var daysUntil = getDaysUntilFollowUp(patient.lastVisit, patient.followUpDays);
var isOverdue = daysUntil < 0;
var isDueSoon = daysUntil >= 0 && daysUntil <= 7;
var statusColor = isOverdue ? "#dc2626" : isDueSoon ? "#d97706" : "#16a34a";
var statusBg = isOverdue ? "#fef2f2" : isDueSoon ? "#fffbeb" : "#f0fdf4";
var statusText = isOverdue ? Math.abs(daysUntil) + "d overdue" : isDueSoon ? "Due in " + daysUntil + "d" : "Due in " + daysUntil + "d";
return (
<div key={patient.id} style={{ background: "#fff", border: "1px solid " + (isOverdue ? "#fecaca" : "#e2e8f0"), borderRadius: 12, padding: 16 }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
<div style={{ flex: 1 }}>
<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
<div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{patient.name}</div>
<div style={{ fontSize: 11, color: "#94a3b8" }}>Age {patient.age}</div>
<div style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: statusBg, padding: "2px 8px", borderRadius: 10 }}>{statusText}</div>
</div>
<div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>Last: {patient.treatment} · {patient.lastVisit}</div>
<div style={{ fontSize: 12, color: "#94a3b8" }}>{patient.notes}</div>
</div>
<button onClick={function() { generateReminder(patient); }}
style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid " + specialty.color + "44", background: specialty.color + "10", color: specialty.color, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", marginLeft: 12 }}>
AI Reminder
</button>
</div>
{selectedPatient && selectedPatient.id === patient.id && (
<div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
{reminderLoading ? (
<div style={{ fontSize: 13, color: "#94a3b8" }}>Generating reminder…</div>
) : (
<div>
<div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.6, background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 8 }}>{aiReminder}</div>
<button onClick={function() { navigator.clipboard.writeText(aiReminder); }}
style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#0f172a", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
📋 Copy Reminder
</button>
</div>
)}
</div>
)}
</div>
);
})}
</div>
</div>
)}
</div>
);
}
