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
notePrompt: "You are a clinical notes AI for a South African GP. Convert the following consultation transcript into a professional structured SOAP note with these sections: SUBJECTIVE, OBJECTIVE, ASSESSMENT, PLAN. Be concise and clinical."
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
notePrompt: "You are a clinical notes AI for a South African dentist. Convert the following consultation transcript into a structured dental note with: COMPLAINT, EXAMINATION, DIAGNOSIS, TREATMENT PLAN, NOTES."
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
notePrompt: "You are a clinical notes AI for a South African aesthetic doctor. Convert the following consultation transcript into a structured aesthetic consult note with: CLIENT CONCERN, SKIN ASSESSMENT, TREATMENT PERFORMED, PRODUCTS USED, AFTERCARE ADVICE, FOLLOW-UP PLAN."
}
];

const FREE_LIMIT = 500;

function userBubbleStyle(color) {
return { maxWidth: "72%", padding: "12px 16px", borderRadius: "20px 20px 4px 20px", background: color, color: "#fff", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" };
}

var aiBubbleStyle = { maxWidth: "72%", padding: "12px 16px", borderRadius: "20px 20px 20px 4px", background: "#fff", border: "1px solid #e2e8f0", color: "#1e293b", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" };

function getDaysUntilFollowUp(lastVisit, followUpDays) {
var last = new Date(lastVisit);
var due = new Date(last.getTime() + followUpDays * 24 * 60 * 60 * 1000);
var today = new Date();
return Math.ceil((due - today) / (24 * 60 * 60 * 1000));
}

var emptyPatient = {
full_name: "", age: "", gender: "", phone: "", id_number: "",
payment_type: "cash", medical_aid_name: "", medical_aid_number: "",
chronic_conditions: "", current_medications: "", allergies: "",
last_visit: "", last_treatment: "", follow_up_days: 14, clinical_notes: ""
};

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
var [patients, setPatients] = useState([]);
var [patientsLoading, setPatientsLoading] = useState(false);
var [showAddPatient, setShowAddPatient] = useState(false);
var [newPatient, setNewPatient] = useState(emptyPatient);
var [selectedPatient, setSelectedPatient] = useState(null);
var [patientView, setPatientView] = useState("list");
var [aiReminder, setAiReminder] = useState("");
var [reminderLoading, setReminderLoading] = useState(false);
var [searchText, setSearchText] = useState("");
var [saving, setSaving] = useState(false);
var recognitionRef = useRef(null);
var bottomRef = useRef(null);

useEffect(function() {
supabase.auth.getSession().then(function(res) { setSession(res.data.session); });
supabase.auth.onAuthStateChange(function(_e, s) { setSession(s); });
}, []);

useEffect(function() { if (session) { fetchProfile(); fetchPatients(); } }, [session]);
useEffect(function() { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

async function fetchProfile() {
var res = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
setProfile(res.data);
}

async function fetchPatients() {
setPatientsLoading(true);
var res = await supabase.from("patients").select("*").eq("doctor_id", session.user.id).order("full_name");
if (res.data) setPatients(res.data);
setPatientsLoading(false);
}

async function savePatient() {
if (!newPatient.full_name || !newPatient.last_visit) return;
setSaving(true);
var payload = Object.assign({}, newPatient, {
doctor_id: session.user.id,
age: parseInt(newPatient.age) || null,
follow_up_days: parseInt(newPatient.follow_up_days) || 14
});
var res = await supabase.from("patients").insert([payload]);
if (!res.error) {
await fetchPatients();
setNewPatient(emptyPatient);
setShowAddPatient(false);
setActiveTab("followups");
}
setSaving(false);
}

async function updatePatient(id, updates) {
await supabase.from("patients").update(updates).eq("id", id);
await fetchPatients();
}

async function deletePatient(id) {
if (!window.confirm("Delete this patient?")) return;
await supabase.from("patients").delete().eq("id", id);
await fetchPatients();
setSelectedPatient(null);
setPatientView("list");
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
setTranscript(""); setGeneratedNote(""); setPatients([]);
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
body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, system: specialty.notePrompt, messages: [{ role: "user", content: "Convert this consultation transcript:\n\n" + transcript }] }),
});
var data = await res.json();
setGeneratedNote(data.content && data.content[0] ? data.content[0].text : "Error.");
} catch(e) { setGeneratedNote("Connection error."); }
setNoteLoading(false);
}

function copyText(text) {
navigator.clipboard.writeText(text);
setCopied(true);
setTimeout(function() { setCopied(false); }, 2000);
}

async function generateReminder(patient) {
setAiReminder(""); setReminderLoading(true);
var days = getDaysUntilFollowUp(patient.last_visit, patient.follow_up_days);
var prompt = "Generate a warm professional SMS follow-up reminder for: " + patient.full_name + ", Age " + patient.age + ", Last treatment: " + patient.last_treatment + " on " + patient.last_visit + ". Notes: " + patient.clinical_notes + ". Follow-up is " + (days < 0 ? Math.abs(days) + " days overdue." : "due in " + days + " days.");
try {
var res = await fetch("/api/chat", {
method: "POST", headers: { "Content-Type": "application/json" },
body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 200, system: "You write short warm professional medical SMS reminders.", messages: [{ role: "user", content: prompt }] }),
});
var data = await res.json();
setAiReminder(data.content && data.content[0] ? data.content[0].text : "Error.");
} catch(e) { setAiReminder("Connection error."); }
setReminderLoading(false);
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

var inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff", color: "#1e293b" };
var labelStyle = { fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 4, letterSpacing: "0.4px", display: "block" };
var sectionStyle = { marginBottom: 20 };

// LOGIN
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

// SPECIALTY SELECT
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

var overdueCount = patients.filter(function(p) { return p.last_visit && getDaysUntilFollowUp(p.last_visit, p.follow_up_days) < 0; }).length;

var tabs = [
{ id: "chat", label: "AI Chat", icon: "💬" },
{ id: "voice", label: "Voice-to-Note", icon: "🎤" },
{ id: "patients", label: "Patients", icon: "👤" },
{ id: "followups", label: "Follow-ups", icon: "🔔" },
];

var filteredPatients = patients.filter(function(p) {
return !searchText || p.full_name.toLowerCase().includes(searchText.toLowerCase());
});

return (
<div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Segoe UI, sans-serif", display: "flex", flexDirection: "column" }}>

{/* NAVBAR */}
<div style={{ padding: "0 28px", height: 60, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
<div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>PLAS<span style={{ color: "#2563eb" }}>MED</span></div>
<div style={{ width: 1, height: 18, background: "#e2e8f0" }} />
<div style={{ fontSize: 12, color: "#fff", background: specialty.color, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{specialty.icon} {specialty.label}</div>
<button onClick={function() { setSpecialty(null); }} style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>Change</button>
</div>
<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
{overdueCount > 0 && (
<div onClick={function() { setActiveTab("followups"); }} style={{ fontSize: 12, color: "#dc2626", background: "#fef2f2", padding: "4px 10px", borderRadius: 6, border: "1px solid #fecaca", fontWeight: 600, cursor: "pointer" }}>
⚠ {overdueCount} overdue
</div>
)}
<div style={{ fontSize: 12, color: "#94a3b8", background: "#f8fafc", padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
{profile && profile.plan === "free" ? (profile.message_count || 0) + " / " + FREE_LIMIT : "Unlimited"}
</div>
<button onClick={handleSignOut} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Sign Out</button>
</div>
</div>

{/* TABS */}
<div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#fff", padding: "0 28px" }}>
{tabs.map(function(tab) {
var isActive = activeTab === tab.id;
return (
<button key={tab.id} onClick={function() { setActiveTab(tab.id); }}
style={{ padding: "14px 18px", border: "none", borderBottom: isActive ? "2px solid " + specialty.color : "2px solid transparent", background: "none", color: isActive ? specialty.color : "#94a3b8", fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: "pointer", fontFamily: "inherit", marginBottom: -1, position: "relative" }}>
{tab.icon} {tab.label}
{tab.id === "followups" && overdueCount > 0 && (
<span style={{ position: "absolute", top: 8, right: 4, width: 7, height: 7, background: "#dc2626", borderRadius: "50%" }} />
)}
</button>
);
})}
</div>

{/* AI CHAT */}
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
<div style={msg.role === "user" ? userBubbleStyle(activeMode ? activeMode.color : "#2563eb") : aiBubbleStyle}>{msg.content}</div>
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

{/* VOICE-TO-NOTE */}
{activeTab === "voice" && (
<div style={{ flex: 1, padding: "32px 24px", maxWidth: 780, width: "100%", margin: "0 auto", alignSelf: "stretch" }}>
<div style={{ marginBottom: 24 }}>
<div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Voice-to-Note</div>
<div style={{ fontSize: 13, color: "#94a3b8" }}>Speak your consultation — PLASMED generates a structured clinical note</div>
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
<div style={labelStyle}>TRANSCRIPT</div>
<div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, fontSize: 14, color: "#1e293b", lineHeight: 1.65, minHeight: 80 }}>{transcript}</div>
<button onClick={generateNote} disabled={noteLoading}
style={{ marginTop: 12, width: "100%", padding: "12px", borderRadius: 10, border: "none", background: noteLoading ? "#e2e8f0" : specialty.color, color: noteLoading ? "#94a3b8" : "#fff", fontSize: 14, fontWeight: 600, cursor: noteLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
{noteLoading ? "Generating note…" : "✨ Generate Clinical Note"}
</button>
</div>
)}
{generatedNote && (
<div>
<div style={labelStyle}>GENERATED NOTE</div>
<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, fontSize: 14, color: "#1e293b", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{generatedNote}</div>
<button onClick={function() { copyText(generatedNote); }}
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

{/* PATIENTS TAB */}
{activeTab === "patients" && (
<div style={{ flex: 1, padding: "24px", maxWidth: 860, width: "100%", margin: "0 auto", alignSelf: "stretch" }}>

{patientView === "list" && (
<div>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
<div>
<div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Patients</div>
<div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{patients.length} patients registered</div>
</div>
<button onClick={function() { setShowAddPatient(true); setPatientView("add"); }}
style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: specialty.color, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
+ Add Patient
</button>
</div>
<input placeholder="Search patients..." value={searchText} onChange={function(e) { setSearchText(e.target.value); }}
style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 16, boxSizing: "border-box" }} />
{patientsLoading ? (
<div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>Loading patients…</div>
) : filteredPatients.length === 0 ? (
<div style={{ textAlign: "center", padding: 60 }}>
<div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
<div style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>No patients yet</div>
<div style={{ fontSize: 13, color: "#cbd5e1" }}>Add your first patient to get started</div>
</div>
) : (
<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
{filteredPatients.map(function(p) {
return (
<div key={p.id} onClick={function() { setSelectedPatient(p); setPatientView("profile"); }}
style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<div>
<div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>{p.full_name}</div>
<div style={{ fontSize: 12, color: "#94a3b8" }}>
{p.age ? "Age " + p.age : ""}{p.age && p.gender ? " · " : ""}{p.gender || ""}
{p.last_treatment ? " · Last: " + p.last_treatment : ""}
</div>
</div>
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<div style={{ fontSize: 11, fontWeight: 600, color: p.payment_type === "medical_aid" ? "#0891b2" : "#16a34a", background: p.payment_type === "medical_aid" ? "#e0f2fe" : "#f0fdf4", padding: "3px 8px", borderRadius: 8 }}>
{p.payment_type === "medical_aid" ? "Medical Aid" : "Cash"}
</div>
<div style={{ color: "#94a3b8", fontSize: 18 }}>›</div>
</div>
</div>
);
})}
</div>
)}
</div>
)}

{patientView === "add" && (
<div>
<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
<button onClick={function() { setPatientView("list"); setNewPatient(emptyPatient); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#64748b" }}>←</button>
<div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>New Patient</div>
</div>

<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, marginBottom: 16 }}>
<div style={{ fontSize: 13, fontWeight: 700, color: specialty.color, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>Personal Details</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
<div>
<label style={labelStyle}>FULL NAME *</label>
<input value={newPatient.full_name} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { full_name: e.target.value })); }} style={inputStyle} placeholder="Patient full name" />
</div>
<div>
<label style={labelStyle}>AGE</label>
<input value={newPatient.age} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { age: e.target.value })); }} style={inputStyle} placeholder="Age" type="number" />
</div>
<div>
<label style={labelStyle}>GENDER</label>
<select value={newPatient.gender} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { gender: e.target.value })); }} style={inputStyle}>
<option value="">Select</option>
<option value="Male">Male</option>
<option value="Female">Female</option>
<option value="Other">Other</option>
</select>
</div>
<div>
<label style={labelStyle}>PHONE NUMBER</label>
<input value={newPatient.phone} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { phone: e.target.value })); }} style={inputStyle} placeholder="e.g. 082 123 4567" />
</div>
<div style={{ gridColumn: "span 2" }}>
<label style={labelStyle}>ID NUMBER</label>
<input value={newPatient.id_number} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { id_number: e.target.value })); }} style={inputStyle} placeholder="SA ID number" />
</div>
</div>
</div>

<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, marginBottom: 16 }}>
<div style={{ fontSize: 13, fontWeight: 700, color: specialty.color, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>Payment & Medical Aid</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
<div style={{ gridColumn: "span 2" }}>
<label style={labelStyle}>PAYMENT TYPE</label>
<div style={{ display: "flex", gap: 10 }}>
{["cash", "medical_aid"].map(function(type) {
return (
<button key={type} onClick={function() { setNewPatient(Object.assign({}, newPatient, { payment_type: type })); }}
style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid " + (newPatient.payment_type === type ? specialty.color : "#e2e8f0"), background: newPatient.payment_type === type ? specialty.color + "12" : "#fff", color: newPatient.payment_type === type ? specialty.color : "#64748b", fontSize: 13, fontWeight: newPatient.payment_type === type ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
{type === "cash" ? "💵 Cash" : "🏥 Medical Aid"}
</button>
);
})}
</div>
</div>
{newPatient.payment_type === "medical_aid" && (
<div>
<label style={labelStyle}>MEDICAL AID NAME</label>
<input value={newPatient.medical_aid_name} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { medical_aid_name: e.target.value })); }} style={inputStyle} placeholder="e.g. Discovery, Momentum" />
</div>
)}
{newPatient.payment_type === "medical_aid" && (
<div>
<label style={labelStyle}>MEMBER NUMBER</label>
<input value={newPatient.medical_aid_number} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { medical_aid_number: e.target.value })); }} style={inputStyle} placeholder="Member number" />
</div>
)}
</div>
</div>

<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, marginBottom: 16 }}>
<div style={{ fontSize: 13, fontWeight: 700, color: specialty.color, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>Medical History</div>
<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
<div>
<label style={labelStyle}>CHRONIC CONDITIONS</label>
<input value={newPatient.chronic_conditions} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { chronic_conditions: e.target.value })); }} style={inputStyle} placeholder="e.g. Hypertension, Diabetes Type 2" />
</div>
<div>
<label style={labelStyle}>CURRENT MEDICATIONS</label>
<input value={newPatient.current_medications} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { current_medications: e.target.value })); }} style={inputStyle} placeholder="e.g. Metformin 500mg, Amlodipine 5mg" />
</div>
<div>
<label style={labelStyle}>ALLERGIES</label>
<input value={newPatient.allergies} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { allergies: e.target.value })); }} style={inputStyle} placeholder="e.g. Penicillin, Sulfa drugs" />
</div>
</div>
</div>

<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, marginBottom: 20 }}>
<div style={{ fontSize: 13, fontWeight: 700, color: specialty.color, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>Visit & Follow-up</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
<div>
<label style={labelStyle}>LAST VISIT DATE *</label>
<input value={newPatient.last_visit} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { last_visit: e.target.value })); }} style={inputStyle} type="date" />
</div>
<div>
<label style={labelStyle}>TREATMENT / REASON</label>
<input value={newPatient.last_treatment} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { last_treatment: e.target.value })); }} style={inputStyle} placeholder="e.g. Hypertension review" />
</div>
<div>
<label style={labelStyle}>FOLLOW-UP IN (DAYS)</label>
<input value={newPatient.follow_up_days} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { follow_up_days: e.target.value })); }} style={inputStyle} type="number" placeholder="14" />
</div>
<div style={{ gridColumn: "span 2" }}>
<label style={labelStyle}>CLINICAL NOTES</label>
<input value={newPatient.clinical_notes} onChange={function(e) { setNewPatient(Object.assign({}, newPatient, { clinical_notes: e.target.value })); }} style={inputStyle} placeholder="Additional notes" />
</div>
</div>
</div>

<button onClick={savePatient} disabled={saving || !newPatient.full_name || !newPatient.last_visit}
style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: saving || !newPatient.full_name ? "#e2e8f0" : specialty.color, color: saving || !newPatient.full_name ? "#94a3b8" : "#fff", fontSize: 15, fontWeight: 600, cursor: saving || !newPatient.full_name ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
{saving ? "Saving…" : "Save Patient"}
</button>
</div>
)}

{patientView === "profile" && selectedPatient && (
<div>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
<button onClick={function() { setPatientView("list"); setSelectedPatient(null); setAiReminder(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#64748b" }}>←</button>
<div>
<div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{selectedPatient.full_name}</div>
<div style={{ fontSize: 12, color: "#94a3b8" }}>
{selectedPatient.age ? "Age " + selectedPatient.age : ""}{selectedPatient.gender ? " · " + selectedPatient.gender : ""}
</div>
</div>
</div>
<button onClick={function() { deletePatient(selectedPatient.id); }}
style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
Delete
</button>
</div>

<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
<div style={labelStyle}>PAYMENT</div>
<div style={{ fontSize: 14, fontWeight: 600, color: selectedPatient.payment_type === "medical_aid" ? "#0891b2" : "#16a34a" }}>
{selectedPatient.payment_type === "medical_aid" ? "Medical Aid" : "Cash"}
</div>
{selectedPatient.medical_aid_name && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{selectedPatient.medical_aid_name} · {selectedPatient.medical_aid_number}</div>}
</div>
<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
<div style={labelStyle}>CONTACT</div>
<div style={{ fontSize: 14, color: "#1e293b" }}>{selectedPatient.phone || "—"}</div>
{selectedPatient.id_number && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>ID: {selectedPatient.id_number}</div>}
</div>
</div>

<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 14 }}>
<div style={labelStyle}>CHRONIC CONDITIONS</div>
<div style={{ fontSize: 14, color: "#1e293b", marginBottom: 12 }}>{selectedPatient.chronic_conditions || "None recorded"}</div>
<div style={labelStyle}>CURRENT MEDICATIONS</div>
<div style={{ fontSize: 14, color: "#1e293b", marginBottom: 12 }}>{selectedPatient.current_medications || "None recorded"}</div>
<div style={labelStyle}>ALLERGIES</div>
<div style={{ fontSize: 14, color: selectedPatient.allergies ? "#dc2626" : "#1e293b", fontWeight: selectedPatient.allergies ? 600 : 400 }}>{selectedPatient.allergies || "None recorded"}</div>
</div>

<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 14 }}>
<div style={labelStyle}>LAST VISIT</div>
<div style={{ fontSize: 14, color: "#1e293b", marginBottom: 4 }}>{selectedPatient.last_visit} · {selectedPatient.last_treatment || "—"}</div>
<div style={labelStyle}>CLINICAL NOTES</div>
<div style={{ fontSize: 14, color: "#1e293b" }}>{selectedPatient.clinical_notes || "—"}</div>
</div>

<button onClick={function() { generateReminder(selectedPatient); }}
style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: specialty.color, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
🔔 Generate AI Follow-up Reminder
</button>

{reminderLoading && <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: 12 }}>Generating reminder…</div>}
{aiReminder && (
<div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, marginBottom: 10 }}>
<div style={labelStyle}>AI REMINDER</div>
<div style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.6 }}>{aiReminder}</div>
<button onClick={function() { copyText(aiReminder); }}
style={{ marginTop: 10, padding: "7px 16px", borderRadius: 8, border: "none", background: "#0f172a", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
{copied ? "✓ Copied!" : "📋 Copy"}
</button>
</div>
)}
</div>
)}
</div>
)}

{/* FOLLOW-UPS TAB */}
{activeTab === "followups" && (
<div style={{ flex: 1, padding: "24px", maxWidth: 780, width: "100%", margin: "0 auto", alignSelf: "stretch" }}>
<div style={{ marginBottom: 20 }}>
<div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Follow-ups</div>
<div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
{overdueCount} overdue · {patients.filter(function(p) { var d = p.last_visit ? getDaysUntilFollowUp(p.last_visit, p.follow_up_days) : 99; return d >= 0 && d <= 7; }).length} due this week
</div>
</div>
{patients.length === 0 ? (
<div style={{ textAlign: "center", padding: 60 }}>
<div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
<div style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>No patients yet</div>
<div style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 20 }}>Add patients to track follow-ups</div>
<button onClick={function() { setActiveTab("patients"); setPatientView("add"); }}
style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: specialty.color, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
+ Add First Patient
</button>
</div>
) : (
<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
{patients.filter(function(p) { return p.last_visit; }).sort(function(a, b) {
return getDaysUntilFollowUp(a.last_visit, a.follow_up_days) - getDaysUntilFollowUp(b.last_visit, b.follow_up_days);
}).map(function(patient) {
var days = getDaysUntilFollowUp(patient.last_visit, patient.follow_up_days);
var isOverdue = days < 0;
var isDueSoon = days >= 0 && days <= 7;
var statusColor = isOverdue ? "#dc2626" : isDueSoon ? "#d97706" : "#16a34a";
var statusBg = isOverdue ? "#fef2f2" : isDueSoon ? "#fffbeb" : "#f0fdf4";
var statusText = isOverdue ? Math.abs(days) + "d overdue" : "Due in " + days + "d";
return (
<div key={patient.id} style={{ background: "#fff", border: "1px solid " + (isOverdue ? "#fecaca" : "#e2e8f0"), borderRadius: 12, padding: 16 }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
<div style={{ flex: 1 }}>
<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
<div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{patient.full_name}</div>
<div style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: statusBg, padding: "2px 8px", borderRadius: 10 }}>{statusText}</div>
</div>
<div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>Last: {patient.last_treatment} · {patient.last_visit}</div>
{patient.chronic_conditions && <div style={{ fontSize: 12, color: "#94a3b8" }}>{patient.chronic_conditions}</div>}
</div>
<button onClick={function() { setSelectedPatient(patient); setPatientView("profile"); setActiveTab("patients"); generateReminder(patient); }}
style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid " + specialty.color + "44", background: specialty.color + "10", color: specialty.color, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginLeft: 12, whiteSpace: "nowrap" }}>
AI Reminder
</button>
</div>
</div>
);
})}
</div>
)}
</div>
)}

</div>
);
}
