import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MODES = [
  { id: "general", label: "General", icon: "⚡", color: "#e040fb", prompt: "You are Plasma, a highly intelligent and helpful AI assistant." },
  { id: "analyst", label: "Analyst", icon: "📊", color: "#00e5ff", prompt: "You are Plasma in Analyst mode. Think critically and provide structured responses." },
  { id: "coder", label: "Coder", icon: "💻", color: "#69ff47", prompt: "You are Plasma in Coder mode. Write clean efficient code with clear explanations." },
  { id: "creative", label: "Creative", icon: "🎨", color: "#ff6d00", prompt: "You are Plasma in Creative mode. Be imaginative and help with writing and ideas." },
];

const FREE_LIMIT = 20;

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

  useEffect(() => {
    if (session) fetchProfile();
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #060a12, #0d0618)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 40, width: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(90deg, #e040fb, #00e5ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PLASMA</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 }}>AI Interface</div>
        </div>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, marginBottom: 12, boxSizing: "border-box" }} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />
        {authError && <div style={{ color: authError.includes("Check") ? "#69ff47" : "#ff6d00", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{authError}</div>}
        <button onClick={handleAuth} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #e040fb, #00e5ff)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}>
          {authMode === "login" ? "Sign In" : "Create Account"}
        </button>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          {authMode === "login" ? "No account? " : "Have an account? "}
          <span onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} style={{ color: "#e040fb", cursor: "pointer" }}>
            {authMode === "login" ? "Sign up free" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #060a12, #0d0618)", fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,10,18,0.8)" }}>
        <div style={{ fontSize: 20, fontWeight: 800, background: "linear-gradient(90deg, #e040fb, #00e5ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PLASMA</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{profile?.plan === "free" ? (profile?.message_count || 0) + "/" + FREE_LIMIT + " messages used" : "Unlimited"}</div>
          <button onClick={handleSignOut} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Sign Out</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "10px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", overflowX: "auto" }}>
        {MODES.map(mode => (
          <button key={mode.id} onClick={() => setActiveMode(mode)} style={{ padding: "7px 16px", borderRadius: 20, border: "1px solid " + (activeMode.id === mode.id ? mode.color + "80" : "rgba(255,255,255,0.08)"), background: activeMode.id === mode.id ? mode.color + "22" : "rgba(255,255,255,0.02)", color: activeMode.id === mode.id ? mode.color : "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            {mode.icon} {mode.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 24, maxWidth: 800, width: "100%", margin: "0 auto", alignSelf: "stretch" }}>
        {messages.length === 0 && <div style={{ textAlign: "center", marginTop: 80, color: "rgba(255,255,255,0.2)", fontSize: 16 }}>Welcome to Plasma ⚡ Start chatting below</div>}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 16 }}>
            <div style={{ maxWidth: "72%", padding: "12px 16px", borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px", background: msg.role === "user" ? "linear-gradient(135deg, " + activeMode.color + "cc, " + activeMode.color + "88)" : "rgba(255,255,255,0.05)", border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{msg.content}</div>
          </div>
        ))}
        {loading && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, padding: "8px 0" }}>Plasma is thinking...</div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "16px 24px 24px", background: "rgba(6,10,18,0.9)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", gap: 12, alignItems: "flex-end" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}} placeholder="Message Plasma..." rows={1} style={{ flex: 1, padding: "12px 16px", borderRadius: 14, border: "1px solid " + activeMode.color + "44", background: "rgba(255,255,255,0.04)", color: "#f0f0f0", fontSize: 14, resize: "none", fontFamily: "sans-serif" }} />
          <button onClick={sendMessage} disabled={!input.trim() || loading} style={{ width: 48, height: 48, borderRadius: 12, border: "none", background: input.trim() && !loading ? "linear-gradient(135deg, " + activeMode.color + ", #00e5ff)" : "rgba(255,255,255,0.06)", cursor: input.trim() && !loading ? "pointer" : "not-allowed", color: "#fff", fontSize: 20 }}>↑</button>
        </div>
      </div>
    </div>
  );
}
