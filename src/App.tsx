/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dumbbell,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  Send,
  Zap,
  CheckCircle,
  Trash2,
  Settings,
  Plus,
  RefreshCw,
  Search,
  MessageSquare,
  HelpCircle,
  Smile,
  Copy,
  ChevronRight,
  ClipboardList,
  Building,
  UserCheck,
  Edit2,
  Check,
  RotateCcw,
  ArrowUpRight,
  Sliders,
  Sparkles
} from "lucide-react";
import { Client, SessionLog, SmartAlert, Trainer } from "./types";
import TrainerForm from "./components/TrainerForm";

// Helper utilities to parse basic markdown in AI responses
const processBoldText = (text: string) => {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="text-acid-lime font-extrabold">{part}</strong>;
    }
    return part;
  });
};

const parseMarkdownText = (text: string) => {
  return text.split("\n").map((line, idx) => {
    let content: React.ReactNode = line;
    
    // Check headers
    if (line.startsWith("### ")) {
      return (
        <h3 key={idx} className="text-xs font-mono font-bold text-white mt-4 mb-2 flex items-center gap-1.5 border-b border-white/10 pb-1 uppercase tracking-wider">
          {line.substring(4)}
        </h3>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h2 key={idx} className="text-sm font-mono font-extrabold text-acid-lime mt-4 mb-2 uppercase">
          {line.substring(3)}
        </h2>
      );
    }
    if (line.startsWith("# ")) {
      return (
        <h1 key={idx} className="text-base font-grotesque font-black text-acid-lime mt-4 mb-2.5 uppercase">
          {line.substring(2)}
        </h1>
      );
    }

    // Check list items
    if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
      const trimmed = line.trim().substring(2);
      content = processBoldText(trimmed);
      return (
        <li key={idx} className="ml-4 list-none text-xs text-white/75 font-mono mb-1 leading-relaxed flex items-start gap-1.5">
          <span className="text-acid-lime">■</span>
          <span>{content}</span>
        </li>
      );
    }

    content = processBoldText(line);

    // If it's a quote style block
    if (line.trim().startsWith("_\"") || line.trim().startsWith("> ")) {
      return (
        <blockquote key={idx} className="border-l-2 border-acid-lime bg-white/5 p-3 italic text-xs text-white/95 font-mono my-2.5 uppercase tracking-wide">
          {content}
        </blockquote>
      );
    }

    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }

    return <p key={idx} className="text-xs font-mono text-white/70 mb-2 leading-relaxed">{content}</p>;
  });
};

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<"editorial" | "schedule" | "logger" | "roster" | "motivation" | "webhook">("editorial");

  // State Management
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Swiss Schedule Registrations state
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  
  // Custom high-end toast notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };
  
  // Interaction & forms
  const [searchQuery, setSearchQuery] = useState("");
  const [isSweeping, setIsSweeping] = useState(false);
  const [copiedAlertId, setCopiedAlertId] = useState<string | null>(null);

  // Motivation Tab States
  const [selectedClientForMotivation, setSelectedClientForMotivation] = useState<Client | null>(null);
  const [customMotivationScore, setCustomMotivationScore] = useState<number>(50);
  const [customUnmotivatedReason, setCustomUnmotivatedReason] = useState<string>("");
  const [customNudgeText, setCustomNudgeText] = useState<string>("");
  const [aiMotivationResponseText, setAiMotivationResponseText] = useState<string>("");
  const [aiGeneratingMotivation, setAiGeneratingMotivation] = useState<boolean>(false);
  
  // AI Chat states
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "### 👋 SHERATON ADDIS GYM ADVISOR\n\nI run on live records representing **The Aqva Club at Sheraton Addis Gym**.\n\nType your query to request target metrics, staff conversion parameters, or persuasive renewal pitches for VIP dropouts. Try asking: **'Draft a renewal message for Hana'** or **'List clients who are at risk'**."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Send message to backend Advisor
  const handleSendChatMessage = async (customMessage?: string) => {
    const textToSend = customMessage || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const updatedMessages = [...chatMessages, { role: "user" as const, content: textToSend }];
    setChatMessages(updatedMessages);
    if (!customMessage) {
      setChatInput("");
    }
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });
      const data = await res.json();
      if (data.success && data.text) {
        setChatMessages(prev => [...prev, { role: "assistant" as const, content: data.text }]);
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            role: "assistant" as const,
            content: "SECURE OVERRIDE ERROR: Could not process request. Please ensure the server is alive and configured."
          }
        ]);
      }
    } catch (err) {
      console.error("Chat fetch error:", err);
      setChatMessages(prev => [
        ...prev,
        {
          role: "assistant" as const,
          content: "TRANSMISSION FAILED: Network timeout with the Sheraton Addis Gym Advisor. Check credentials."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };
  
  // Client edit states
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [clientFormSubmitting, setClientFormSubmitting] = useState(false);

  // Load backend data
  const fetchData = async () => {
    try {
      const response = await fetch("/api/data");
      const data = await response.json();
      if (data) {
        setClients(data.clients || []);
        setLogs(data.logs || []);
        setAlerts(data.alerts || []);
        setTrainers(data.trainers || []);
        if (data.webhook) {
          setWebhookUrl(data.webhook.makeUrl || "");
        }
        setGeminiAvailable(!!data.geminiAvailable);
      }
    } catch (err) {
      console.error("Error fetching state data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Log session submission handler
  const handleLogSubmit = async (formData: {
    trainerName: string;
    clientName: string;
    sessionNumber: number;
    noteText: string;
  }) => {
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        showToast(`LOGGED SESSION FOR ${formData.clientName.toUpperCase()} SUCCESSFULLY`, "success");
        return { success: true, alert: data.alert, client: data.client };
      }
      return { success: false, alert: null, client: null };
    } catch (err) {
      console.error(err);
      return { success: false, alert: null, client: null };
    }
  };

  // Force AI scan sweep using Gemini API
  const handleForceAIScan = async () => {
    setIsSweeping(true);
    try {
      const res = await fetch("/api/alerts/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        showToast(`Success! Auto-generated ${data.count || 0} smart insights from the VIP roster!`, "success");
      } else {
        showToast(data.message || "Manual sweep was unable to proceed. Check if Gemini API key is configured.", "error");
      }
    } catch (err) {
      console.error("Error triggering AI sweep:", err);
      showToast("System failed to execute direct scan. Check backend limits.", "error");
    } finally {
      setIsSweeping(false);
    }
  };

  // Reset demo datasets
  const handleResetData = async () => {
    if (confirm("OVEROVERWRITE PERMANENT DATABASE WITH SHERATON DEMO SEEDS? All custom VIP records will be reset.")) {
      try {
        const res = await fetch("/api/reset", { method: "POST" });
        if (res.ok) {
          await fetchData();
          showToast("SHERATON ADDIS GYM DATABASE RE-INITIALIZED", "success");
        }
      } catch (err) {
        console.error("Reset failed", err);
      }
    }
  };

  // Save integration webhook url
  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/webhook-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ makeUrl: webhookUrl }),
      });
      if (res.ok) {
        showToast("MAKE.COM ACTION HOOK SAVED SECURELY", "success");
      }
    } catch (err) {
      console.error("Webhook save failed", err);
    }
  };

  // Save manual Client
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientFormSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingClient),
      });
      if (res.ok) {
        await fetchData();
        setIsClientModalOpen(false);
        setEditingClient(null);
        showToast(`MEMBER SAVED SUCCESSFULLY`, "success");
      }
    } catch (err) {
      console.error("Client save failed", err);
      showToast("FAILED TO SAVE MEMBER PROFILE", "error");
    } finally {
      setClientFormSubmitting(false);
    }
  };

  // Update motivation details
  const handleUpdateMotivation = async (id: string, score: number, reason: string) => {
    try {
      const res = await fetch("/api/clients/motivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, motivationScore: score, unmotivatedReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        showToast("MOTIVATION CALIBRATED AT SHERATON", "success");
      }
    } catch (err) {
      console.error("Failed to update motivation", err);
      showToast("FAILED TO SYNC MOTIVATION STATS", "error");
    }
  };

  // Send a targeted motivation nudge check-in
  const handleSendNudgeCheckIn = async (id: string, name: string, trainer: string, messageText: string) => {
    try {
      const res = await fetch("/api/clients/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nudgeText: messageText }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        showToast(`MOTIVATION SEED DELIVERED TO ${name.toUpperCase()}`, "success");
      }
    } catch (err) {
      console.error("Nudge failed", err);
      showToast("FAILED TO SEND MOTIVATION BOOSTER", "error");
    }
  };

  // Generate customized AI re-engagement advice targeting unmotivated state
  const handleGenerateAIMotivationScript = async (client: Client) => {
    setAiGeneratingMotivation(true);
    setAiMotivationResponseText("");
    try {
      const promptText = `URGENT RE-ENGAGEMENT RETENTION ACTION: Draft an elite, highly personalized motivational check-in outreach template for Sheraton Addis Gym member "${client.name}". 
      - Motivation Score: ${client.motivationScore || 40}%
      - Current State: ${client.status === 'at-risk' ? 'UNMOTIVATED & HIGH CHURN RISK' : 'ACTIVE BUT SLIPPING'}
      - Goal: "${client.goal}"
      - Why they are unmotivated: "${client.unmotivatedReason || 'Losing consistency, needs active hotel luxury incentive'}".
      
      Craft a bespoke, high-touch luxury check-in text (ready for Whatsapp). Mention specific Aqva Club Sheraton Addis wellness features (e.g., 28°C heated pools with underwater music, traditional sauna steam, private massage, high-altitude oxygen conditioning, or bespoke executive hours). Speak as Coach ${client.assignedTrainer} from The Aqva Club. Do not write generic marketing placeholders; write the exact message text.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: promptText }]
        })
      });

      const data = await res.json();
      if (data.success && data.text) {
        setAiMotivationResponseText(data.text);
        showToast("BESPOKE AI OUTREACH GENERATED!", "success");
      } else {
        throw new Error("No script text returned");
      }
    } catch (err) {
      console.error("AI motivation gen failed", err);
      // Fallback high-quality script
      const fallback = `Dear ${client.name.split(" ")[0]},

Coach ${client.assignedTrainer} here from The Aqva Club at Sheraton Addis! 🌟

I was looking at our luxury TechnoGym records and noticed we haven't seen your vibrant energy on the fitness floor lately. We completely understand that your executive and diplomatic schedule at Taitu Street gets intense. 

However, your goal of "${client.goal}" is extremely important to us! To make re-entry completely effortless, I have reserved a special private VIP slot for you this Thursday. Let's start with a low-impact warmup and then move to a complete active decompression session in our 28°C heated outdoor pools with soothing underwater music, followed by high-altitude oxygen steam.

We've got your custom nutrition layout pending as well. Let me know what time works best—let's keep your high-momentum alive!

In high spirits,
Coach ${client.assignedTrainer}
The Aqva Club // Sheraton Addis`;
      setAiMotivationResponseText(fallback);
      showToast("GENERATED (HEURISTIC BACKUP ENGAGED)", "info");
    } finally {
      setAiGeneratingMotivation(false);
    }
  };

  // Close or dismiss alerts
  const handleDismissAlert = async (id: string) => {
    try {
      const res = await fetch("/api/alerts/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
        showToast("ALERT CLEARED FROM LOGS", "info");
      }
    } catch (err) {
      console.error("Dismiss failed", err);
    }
  };

  // Helpers
  const activeAlerts = alerts.filter(a => !a.dismissed);
  const pendingUpsellsCount = clients.filter(c => c.status === "needs-renewal" || c.status === "at-risk").length;
  const activeCount = clients.filter(c => c.status === "active").length;
  const totalCount = clients.length || 1;
  const baseRetentionRatio = Math.round(((totalCount - clients.filter(c => c.status === "at-risk").length) / totalCount) * 100);

  const copyScriptToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAlertId(id);
    showToast("RENEWAL OUTREACH TEMPLATE COPIED TO CLIPBOARD", "success");
    setTimeout(() => {
      setCopiedAlertId(null);
    }, 2000);
  };

  const filteredClients = clients.filter(c => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      c.assignedTrainer.toLowerCase().includes(s) ||
      c.goal.toLowerCase().includes(s)
    );
  });

  // STATIC IMMERSIVE SWISS CLASS SCHEDULE DATA ( inspired by raw modernist grids )
  const SWISS_SCHEDULE_SLOTS = [
    { id: "S-01", time: "06:00 - 07:30", code: "ST-01", name: "COLD INDUSTRIAL STRENGTH", trainer: "MIKE", metric: "95% M-E", status: "11/12 FULL" },
    { id: "S-02", time: "08:15 - 09:15", code: "HY-04", name: "AQUATIC DRAG RESISTANCE", trainer: "MARTHA", metric: "80% HRmax", status: "3 SLOTS LEFT" },
    { id: "S-03", time: "11:00 - 12:30", code: "KB-09", name: "KRAV COMBAT SIMULATION", trainer: "SARAH", metric: "90% L-V", status: "1 SLOT LEFT" },
    { id: "S-04", time: "13:00 - 14:00", code: "RC-02", name: "SPINAL HYPER-DECOMPRESSION", trainer: "MIKE", metric: "75% NEU", status: "4 SLOTS LEFT" },
    { id: "S-05", time: "16:45 - 18:15", code: "ZP-10", name: "PEAK LACTATE ACCUMULATION", trainer: "SARAH", metric: "98% M-E", status: "FULL" },
    { id: "S-06", time: "19:00 - 20:30", code: "BR-05", name: "HEATED AMBIENT RECOVERY", trainer: "MARTHA", metric: "60% PARA", status: "6 SLOTS LEFT" }
  ];

  const toggleBookSlot = (slotId: string, name: string) => {
    if (bookedSlots.includes(slotId)) {
      setBookedSlots(prev => prev.filter(id => id !== slotId));
      showToast(`CANCELLED RESERVATION: ${name}`, "info");
    } else {
      setBookedSlots(prev => [...prev, slotId]);
      showToast(`RESERVED SLOT: ${name}. VIP ROSTER DISPATCHED.`, "success");
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col md:flex-row text-white font-sans antialiased relative selection:bg-acid-lime selection:text-black overflow-x-hidden" id="aqva-brutal-landing-root">
      
      {/* 1. VERTICAL SIDEBAR NAVIGATION (LEFT) */}
      <aside className="w-full md:w-80 shrink-0 bg-black border-b md:border-b-0 md:border-r-2 border-white/20 flex flex-col justify-between z-10" id="sidebar-drawer">
        <div>
          {/* Brutalist Brand Flag */}
          <div className="p-6 md:p-8 border-b-2 border-white/10 flex flex-col space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-acid-lime text-black flex items-center justify-center font-grotesque font-black text-xl font-bold">
                S
              </div>
              <div>
                <span className="text-sm font-grotesque font-black tracking-widest block leading-none">SHERATON ADDIS</span>
                <span className="text-[9px] text-acid-lime font-mono tracking-widest uppercase block mt-1">THE AQVA CLUB / GYM</span>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-3 font-mono text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-white/40">SYS_STATUS:</span>
                <span className="text-acid-lime font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">GEO_LOCATION:</span>
                <span className="text-white">ADDIS ABABA / VIP</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation links with letter spacing, monospace numbering and 0px border-radius */}
          <nav className="p-4 md:p-6 space-y-2">
            <button
              onClick={() => setActiveTab("editorial")}
              className={`w-full text-left p-4 rounded-none border transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "editorial"
                  ? "bg-acid-lime text-black border-acid-lime font-extrabold"
                  : "bg-transparent text-white/60 border-white/10 hover:border-white/50 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-mono">[01]</span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider">EDITORIAL / CHAT</span>
              </div>
              <ArrowUpRight className="w-4.5 h-4.5 shrink-0" />
            </button>

            <button
              onClick={() => setActiveTab("schedule")}
              className={`w-full text-left p-4 rounded-none border transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "schedule"
                  ? "bg-acid-lime text-black border-acid-lime font-extrabold"
                  : "bg-transparent text-white/60 border-white/10 hover:border-white/50 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-mono">[02]</span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider">SWISS SCHEDULE</span>
              </div>
              <div className="flex items-center space-x-1">
                {bookedSlots.length > 0 && (
                  <span className="bg-black text-[#D1FF00] font-mono text-[9px] px-1.5 py-0.5 font-bold">
                    {bookedSlots.length}
                  </span>
                )}
                <ArrowUpRight className="w-4.5 h-4.5 shrink-0" />
              </div>
            </button>

            <button
              onClick={() => setActiveTab("logger")}
              className={`w-full text-left p-4 rounded-none border transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "logger"
                  ? "bg-acid-lime text-black border-acid-lime font-extrabold"
                  : "bg-transparent text-white/60 border-white/10 hover:border-white/50 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-mono">[03]</span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider">TRAINER LOGS</span>
              </div>
              <ArrowUpRight className="w-4.5 h-4.5 shrink-0" />
            </button>

            <button
              onClick={() => setActiveTab("roster")}
              className={`w-full text-left p-4 rounded-none border transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "roster"
                  ? "bg-acid-lime text-black border-acid-lime font-extrabold"
                  : "bg-transparent text-white/60 border-white/10 hover:border-white/50 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-mono">[04]</span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider">VIP DIRECTORY</span>
              </div>
              <div className="flex items-center space-x-1">
                {activeAlerts.length > 0 && (
                  <span className="bg-rose-500 text-white font-mono text-[9px] px-1.5 py-0.5">
                    {activeAlerts.length}
                  </span>
                )}
                <ArrowUpRight className="w-4.5 h-4.5 shrink-0" />
              </div>
            </button>

            <button
              onClick={() => setActiveTab("motivation")}
              className={`w-full text-left p-4 rounded-none border transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "motivation"
                  ? "bg-acid-lime text-black border-acid-lime font-extrabold"
                  : "bg-transparent text-white/60 border-white/10 hover:border-white/50 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-mono">[05]</span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-acid-lime font-black">MOTIVATION COCKPIT</span>
              </div>
              <div className="flex items-center space-x-1">
                {clients.filter(c => (c.motivationScore || 100) <= 40).length > 0 && (
                  <span className="bg-yellow-400 text-black font-mono text-[9px] px-1.5 py-0.5 font-bold">
                    {clients.filter(c => (c.motivationScore || 100) <= 40).length} RISK
                  </span>
                )}
                <ArrowUpRight className="w-4.5 h-4.5 shrink-0" />
              </div>
            </button>

            <button
              onClick={() => setActiveTab("webhook")}
              className={`w-full text-left p-4 rounded-none border transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "webhook"
                  ? "bg-acid-lime text-black border-acid-lime font-extrabold"
                  : "bg-transparent text-white/60 border-white/10 hover:border-white/50 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-mono">[06]</span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider">AUTOMATION HOOK</span>
              </div>
              <ArrowUpRight className="w-4.5 h-4.5 shrink-0" />
            </button>
          </nav>
        </div>

        {/* Bottom Metadata Panel / System Configs */}
        <div className="p-6 border-t border-white/10 bg-white/5 space-y-4">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-mono text-white/40 block">SPACER // ENROLLMENT</span>
            <div className="text-xs font-mono font-bold uppercase">
              REVENUE SEED DATA:
            </div>
            <p className="text-[10px] font-mono text-white/50 leading-relaxed">
              TO REVERT BACK TO THE PRIMARY SHERATON HOTEL RETENTION DEMO, TRIGGER DIRECT SEED RESET.
            </p>
          </div>

          <div className="flex gap-2 justify-between">
            <button
              onClick={handleResetData}
              type="button"
              className="py-2.5 px-4 bg-transparent border border-white/20 text-white/60 hover:text-rose-400 hover:border-rose-400 font-mono text-[9px] uppercase tracking-widest text-center transition-all cursor-pointer w-full"
            >
              [ RESET SEEDS ]
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION STREAM CONTAINER */}
      <main className="flex-1 min-w-0 flex flex-col relative z-20 overflow-x-hidden" id="main-content-workspace">
        
        {/* TOP STATUS HEADER BAR (Minimalist Swiss Data indicators, No shiny components) */}
        <header className="bg-black/90 border-b-2 border-white/10 p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative select-none">
          <div className="flex flex-wrap items-center gap-6 md:gap-14">
            
            {/* Stat Item 1 */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 bg-acid-lime" />
                <span className="text-[9px] text-white/40 uppercase font-mono tracking-widest">VIP OVERLAY RETRIBUTION</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl md:text-2xl font-mono font-extrabold text-white">
                  ${(4800 + (clients.filter(c => c.status === "needs-renewal").length * 600)).toLocaleString()}
                </span>
                <span className="text-[9px] font-mono text-acid-lime bg-acid-lime/10 px-1 py-0.5 border border-acid-lime/20">
                  +18.4%
                </span>
              </div>
            </div>

            {/* Stat Item 2 */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 bg-white" />
                <span className="text-[9px] text-white/40 uppercase font-mono tracking-widest">PIPELINE RENEW STATUS</span>
              </div>
              <p className="text-xl md:text-2xl font-mono font-extrabold text-white">
                {pendingUpsellsCount} SUBJECTS <span className="text-[10px] font-normal text-white/50">PENDING</span>
              </p>
            </div>

            {/* Stat Item 3 */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 bg-acid-lime" />
                <span className="text-[9px] text-white/40 uppercase font-mono tracking-widest">RETENTION INTEL</span>
              </div>
              <p className="text-xl md:text-2xl font-mono font-extrabold text-acid-lime">
                {Math.max(88, baseRetentionRatio)}% SECURE
              </p>
            </div>
          </div>

          {/* Core Force AI Sweep CTA Element (0px Border and raw styling) */}
          <div className="flex items-center space-x-3 shrink-0">
            {!geminiAvailable && (
              <div className="hidden xl:flex items-center space-x-1.5 text-[9px] text-yellow-400 font-mono uppercase bg-yellow-400/5 border border-yellow-400/20 py-2.5 px-3">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>HEURISTIC BACKUP ENGAGED</span>
              </div>
            )}
            
            <button
              onClick={handleForceAIScan}
              disabled={isSweeping}
              className="px-5 py-3.5 bg-acid-lime text-black font-mono font-bold text-xs uppercase tracking-widest hover-invert-brutal border border-acid-lime transition-all cursor-pointer flex items-center space-x-2"
              id="force-scan-btn"
            >
              {isSweeping ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>SWEEPING VIP METRICS...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>STATED FORCED AI SCAN [SWEEP]</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* LIVE VIEW TAB SWITCHER WITH TRANSITIONS */}
        <section className="flex-1 p-6 md:p-10 bg-[#0D0D0D] overflow-y-auto relative z-10 concrete-grain">
          
          <AnimatePresence mode="wait">
            
            {/* TAB 1: EDITORIAL & AI LOGS CONCIERGE CHAT */}
            {activeTab === "editorial" && (
              <motion.div
                key="editorial-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-12"
              >
                {/* HERO BLOCK: MONUMENT EXTENDED HEAVY CUT OFF TEXT (Broken grid layout) */}
                <div className="relative bg-black border-2 border-white/20 p-6 md:p-10 flex flex-col md:flex-row gap-8 overflow-hidden z-0 shadow-2xl">
                  {/* Absolute cutoff background text */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-[-15%] whitespace-nowrap text-[12vw] font-grotesque font-black tracking-tighter uppercase text-stroke-brutal pointer-events-none opacity-20 select-none z-0">
                    SHERATON.GYM
                  </div>
                  
                  {/* Left editorial header block */}
                  <div className="relative z-10 flex-1 space-y-6">
                    <span className="text-acid-lime font-mono text-xs font-bold tracking-widest uppercase block mb-1">
                      [ RAW STRENGTH // SHERATON ADDIS GYM ]
                    </span>
                    <h1 className="text-5xl md:text-7xl font-grotesque font-black tracking-widest text-white uppercase leading-none italic">
                      SHERATON ADDIS <br/>
                      <span className="text-acid-lime text-stroke-acid">AQVA CLUB GYM</span>
                    </h1>
                    
                    <p className="text-xs md:text-sm text-white/70 max-w-lg font-mono leading-relaxed uppercase">
                      WE REDEFINE HEATH & PHYSICAL HARDENING FOR ELITE RETENTIONS. SET INSIDE THE BOLD CONCRETE WALLS OF SHERATON ADDIS, COMBINING CRUDE RAW FORMS WITH INTEL AND BIO-METRICS.
                    </p>
                    
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={() => setActiveTab("schedule")}
                        className="py-3 px-6 bg-acid-lime text-black font-mono font-bold text-xs uppercase tracking-widest hover-invert-brutal border border-acid-lime cursor-pointer"
                      >
                        VIEW WORKOUT CATALOGUES
                      </button>
                      <button
                        onClick={() => {
                          const chatEl = document.getElementById("virtual-concierge-anchor");
                          if (chatEl) chatEl.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="py-3 px-6 bg-transparent text-white border border-white/20 font-mono font-bold text-xs uppercase tracking-widest hover-invert-dark cursor-pointer"
                      >
                        MEET AI CONCIERGE
                      </button>
                    </div>
                  </div>

                  {/* Asymmetric Overlapping Block */}
                  <div className="relative z-10 w-full md:w-80 border-2 border-acid-lime bg-[#121212] p-6 flex flex-col justify-between shadow-xl">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="text-[10px] font-mono text-acid-lime uppercase tracking-widest font-bold">STATION CONFIG</span>
                        <Sliders className="w-4 h-4 text-acid-lime" />
                      </div>
                      <div className="font-mono text-[11px] space-y-2 uppercase">
                        <div>
                          <span className="text-white/40">AIR TEMP:</span> 19.5 °C
                        </div>
                        <div>
                          <span className="text-white/40">POOL HEAT:</span> 28.0 °C
                        </div>
                        <div>
                          <span className="text-white/40">VIP TRACKS:</span> {clients.length} ROSTERED
                        </div>
                        <div>
                          <span className="text-white/40">ALERT DANGER:</span> {activeAlerts.length} REQUIRES WORK
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 mt-6 md:mt-2">
                      <div className="text-[10px] font-mono text-white/50 uppercase italic leading-tight">
                        "STRICT RULES APPLIED. NO LOG GLOWS. NO SOFT PLAYSETS allowed."
                      </div>
                    </div>
                  </div>
                </div>

                {/* EDITORIAL MAGAZINE GRID SPREAD (Broken alignment) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Editorial Column L (7 cols): High Fashion Concept blocks */}
                  <div className="lg:col-span-7 space-y-8">
                    <div className="border-t-2 border-white pt-4">
                      <span className="text-xs font-mono text-white/40 block mb-1">01 / CONCEPT</span>
                      <h3 className="text-lg font-grotesque font-bold uppercase tracking-tight text-white mb-3">
                        AESTHETIC PARADOX: RAW RECOVERY
                      </h3>
                      <p className="text-xs font-mono text-white/60 leading-relaxed uppercase">
                        OUR BOUTIQUE APPARATUS COMBINES HEATED SALTWATER VELOCITY FLUIDS WITH INDUSTRIAL IRON BENCHES. EVERY WORKOUT IS TRACKED AS AN ELEVATED METRIC BLOCK FOR REVENUE AGENTS. OUR TRAINERS MARTHA, MIKE AND SARAH PARSE RECOVERY DEVIATIONS IN 10-SECOND LOG MODULES DIRECTLY UPON EXIT.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="bg-white/5 p-5 border border-white/10 relative">
                        <span className="absolute top-2 right-3 text-[9px] font-mono text-acid-lime bg-acid-lime/10 px-1">01</span>
                        <h4 className="text-xs font-mono font-bold text-white uppercase mb-2">THERAPEUTIC VELOCITY</h4>
                        <p className="text-[11px] font-mono text-white/55 uppercase leading-normal">
                          HYDRAULIC PRESSURE ENGINES SECURE ELITA SPINAL DECOMPRESSIONS FOR TRAVELING UN ENVOYS AND IMF RESIDENTS.
                        </p>
                      </div>
                      
                      <div className="bg-white/5 p-5 border border-white/10 relative">
                        <span className="absolute top-2 right-3 text-[9px] font-mono text-acid-lime bg-acid-lime/10 px-1">02</span>
                        <h4 className="text-xs font-mono font-bold text-white uppercase mb-2">LACTATE STABILITY ANALYSIS</h4>
                        <p className="text-[11px] font-mono text-white/55 uppercase leading-normal">
                          LIVE GEMINI CRITICAL DISHWASH SENSING TRIGGERS RE-ENROLLMENT SCRIPTS AUTOMATICALLY UPON PACKAGE COMPONENT 9 EXPIRE.
                        </p>
                      </div>
                    </div>

                    {/* INTERACTIVE COMPRESSED CHAT BLOCK IN EDITORIAL PAGE */}
                    <div id="virtual-concierge-anchor" className="border-t-2 border-white pt-6">
                      <div className="flex justify-between items-baseline mb-4">
                        <div>
                          <span className="text-xs font-mono text-acid-lime block tracking-widest font-bold">02 / INTERACTIVE ADVISOR Terminal</span>
                          <h3 className="text-lg font-grotesque font-bold uppercase text-white tracking-tight">
                            LAUNCH SHERATON GYM AI ANALYZER
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-white/40">ONLINE // CHAT_PORTAL_3000</span>
                      </div>

                      <div className="bg-black border border-white/20 p-4 md:p-6 space-y-4">
                        {/* Messages Area */}
                        <div className="h-96 overflow-y-auto space-y-4 border-b border-white/10 pb-4 pr-1 scrollbar-thin">
                          {chatMessages.map((msg, i) => (
                            <div
                              key={i}
                              className={`p-4 border ${
                                msg.role === "user"
                                  ? "bg-white/5 border-white/30 ml-8 text-right font-mono"
                                  : "bg-[#0D0D0D] border-acid-lime/20 mr-8 text-left"
                              }`}
                            >
                              <div className="flex justify-between items-center text-[9px] font-mono text-white/40 mb-2 uppercase">
                                <span>{msg.role === "user" ? "VIP OPERATOR" : "SHERATON AI ENGINE"}</span>
                                <span>{msg.role === "user" ? "TRANS_OUT" : "TRANS_IN"}</span>
                              </div>
                              <div className="text-xs text-white leading-relaxed">
                                {msg.role === "user" ? (
                                  <span className="font-mono uppercase">{msg.content}</span>
                                ) : (
                                  parseMarkdownText(msg.content)
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {chatLoading && (
                            <div className="p-4 bg-white/5 border border-white/10 mr-8 text-left animate-pulse">
                              <span className="text-xs font-mono text-acid-lime">SHERATON MACHINE IS DECRYPTING PATTERNS...</span>
                            </div>
                          )}
                        </div>

                        {/* Input Area */}
                        <div className="flex gap-2.5">
                          <input
                            type="text"
                            placeholder={chatLoading ? "SYS BUSY..." : "REQUEST ROSTER OUTLINE / DRAFT VIP MESSAGE..."}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSendChatMessage();
                            }}
                            className="flex-1 bg-[#121212] text-white font-mono uppercase px-4 py-3 text-xs border border-white/20 focus:outline-none focus:border-acid-lime"
                            disabled={chatLoading}
                          />
                          <button
                            onClick={() => handleSendChatMessage()}
                            disabled={chatLoading}
                            className="px-6 py-3 bg-acid-lime text-black font-mono font-bold text-xs uppercase tracking-widest hover-invert-brutal border border-acid-lime cursor-pointer disabled:opacity-20 transition-all shrink-0"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Trigger suggestions */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            onClick={() => handleSendChatMessage("Draft an elite renewal script for Ambassador Elena")}
                            className="text-[9px] font-mono uppercase bg-[#171717] border border-white/10 px-2.5 py-1.5 text-white/60 hover:text-acid-lime hover:border-acid-lime transition-all cursor-pointer"
                          >
                            ▲ RENEW SCRIPT: ELENA
                          </button>
                          <button
                            onClick={() => handleSendChatMessage("State the core high level retention risk of IMF Director Marcus")}
                            className="text-[9px] font-mono uppercase bg-[#171717] border border-white/10 px-2.5 py-1.5 text-white/60 hover:text-acid-lime hover:border-acid-lime transition-all cursor-pointer"
                          >
                            ▲ INTEL CHURN RISK: MARCUS
                          </button>
                          <button
                            onClick={() => handleSendChatMessage("Who is my best staff trainer based on logged count?")}
                            className="text-[9px] font-mono uppercase bg-[#171717] border border-white/10 px-2.5 py-1.5 text-white/60 hover:text-acid-lime hover:border-acid-lime transition-all cursor-pointer"
                          >
                            ▲ STAFF LEADERBOARD QUESTIONS
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Editorial Column R (5 cols): Priority Churn Action Alerts Drawer */}
                  <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
                    <div className="border-t-2 border-acid-lime pt-4">
                      <span className="text-xs font-mono text-acid-lime block mb-1">03 / ACTIVE ACTION PLAYBOOKS</span>
                      <h3 className="text-sm font-grotesque font-bold uppercase tracking-widest text-[#F43F5E] mb-4 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-rose-500 animate-ping shrink-0" />
                        CRITICAL REVENUE WARNINGS ({activeAlerts.length})
                      </h3>
                      
                      {activeAlerts.length === 0 ? (
                        <div className="bg-black/50 border border-white/10 p-6 text-center">
                          <h4 className="text-xs font-mono text-white/70 uppercase">NO CHURN SIGNALS REGISTERED TODAY</h4>
                          <p className="text-[10px] font-mono text-white/40 mt-1 uppercase">
                            VIP package pipelines are stable. Log a target workout session to refresh metrics.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activeAlerts.map((alt) => (
                            <div key={alt.id} className="border border-white/20 bg-black/90 p-5 space-y-4">
                              <div className="flex justify-between items-baseline border-b border-white/10 pb-2">
                                <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 ${
                                  alt.type === "renewal" 
                                    ? "bg-acid-lime text-black" 
                                    : "bg-rose-500 text-white"
                                }`}>
                                  {alt.type === "renewal" ? "PIP_RENEW_DUE" : "RISK_WARNING"}
                                </span>
                                <span className="text-[9px] font-mono text-white/40 uppercase">ASSIGNEE: {alt.trainerName.toUpperCase()}</span>
                              </div>

                              <div>
                                <h4 className="text-xs font-mono font-extrabold text-white uppercase">{alt.title}</h4>
                                <p className="text-[11px] font-sans text-white/60 mt-1 uppercase leading-normal">
                                  {alt.description}
                                </p>
                              </div>

                              {/* Outreach message template */}
                              <div className="bg-white/5 p-3 border border-white/10 space-y-2">
                                <span className="text-[8px] font-mono text-acid-lime block tracking-wider uppercase">[ VIP OUTREACH PERSUASION ]:</span>
                                <p className="text-xs font-mono text-white/95 italic">
                                  "{alt.messageTemplate}"
                                </p>
                                
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={() => copyScriptToClipboard(alt.messageTemplate, alt.id)}
                                    className="py-1.5 px-3 bg-white text-black text-[9px] font-mono font-bold uppercase hover:bg-acid-lime hover:text-black transition-all cursor-pointer flex-1"
                                  >
                                    {copiedAlertId === alt.id ? "COPIED SYSTEM" : "[ COPY SCRIPT ]"}
                                  </button>
                                  <button
                                    onClick={() => handleDismissAlert(alt.id)}
                                    className="py-1.5 px-3 bg-transparent border border-white/20 text-white/60 text-[9px] font-mono font-bold uppercase hover:text-rose-400 hover:border-rose-400 transition-all cursor-pointer"
                                  >
                                    [ COMPLETE ]
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* STAFF RETENTION MONITOR */}
                    <div className="border-t-2 border-white pt-4">
                      <span className="text-xs font-mono text-white/40 block mb-1">04 / PERFORMANCE</span>
                      <h3 className="text-xs font-grotesque font-bold uppercase tracking-widest text-white mb-3">
                        OPERATOR STACKING RANK
                      </h3>
                      
                      <div className="border border-white/20 divide-y divide-white/10 bg-black/40">
                        {trainers.map((t, idx) => (
                          <div key={idx} className="p-3.5 flex items-center justify-between text-xs font-mono uppercase">
                            <div className="flex items-center space-x-3">
                              <span className="text-acid-lime font-bold">0{idx + 1}</span>
                              <span className="text-white font-extrabold">{t.name}</span>
                            </div>
                            <div className="flex space-x-4 text-right">
                              <div>
                                <span className="text-white/40 text-[9px] block">ACTIVE_VIP:</span>
                                <span className="font-bold">{t.activeClients}</span>
                              </div>
                              <div>
                                <span className="text-white/40 text-[9px] block">SESS_COUNT:</span>
                                <span className="font-bold">{t.sessionsLoggedCount}</span>
                              </div>
                              <div>
                                <span className="text-white/40 text-[9px] block">RENEW_RATIO:</span>
                                <span className="text-acid-lime font-bold">{t.renewalRate}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: SWISS TYPOGRAPHY CLASS SCHEDULE */}
            {activeTab === "schedule" && (
              <motion.div
                key="schedule-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Header overview styling like an editorial magazine */}
                <div className="border-b-2 border-white/20 pb-5">
                  <span className="text-xs text-acid-lime font-mono tracking-widest uppercase block mb-1">
                    [ CATALOGUE CODE: SWISS_CHRONO_908 ]
                  </span>
                  <h2 className="text-2xl md:text-4xl font-grotesque font-black uppercase text-white tracking-tighter">
                    SWISS MINIMALIST DATA-HEAVY SCHEDULE
                  </h2>
                  <p className="text-xs font-mono text-white/50 uppercase mt-1">
                    HIGH-DENSITY DATA INSPIRED BY RAW TYPE THEORY. COLOR INVERSION MICRO-INTERACTIONS APPLIED ON TARGET MATRIXES.
                  </p>
                </div>

                {/* Swiss high density table */}
                <div className="overflow-x-auto border-2 border-white">
                  <table className="w-full text-left border-collapse font-mono text-xs uppercase">
                    <thead>
                      <tr className="bg-black text-white/55 border-b-2 border-white">
                        <th className="p-4 border-r border-white/20 tracking-wider">CODEX</th>
                        <th className="p-4 border-r border-white/20 tracking-wider">CHRONOMETER INDEX (TIME)</th>
                        <th className="p-4 border-r border-white/20 tracking-wider">TARGET COURSE NAME</th>
                        <th className="p-4 border-r border-white/20 tracking-wider">OPERATOR COACH</th>
                        <th className="p-4 border-r border-white/20 tracking-wider text-right">BIOMETRIC LOAD</th>
                        <th className="p-4 border-r border-white/20 tracking-wider text-center">DENSITY VOL</th>
                        <th className="p-4 tracking-wider text-center">INTERACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/25">
                      {SWISS_SCHEDULE_SLOTS.map((slot) => {
                        const isBooked = bookedSlots.includes(slot.id);
                        return (
                          <tr
                            key={slot.id}
                            className={`transition-colors hover:bg-white/5`}
                          >
                            <td className="p-4 border-r border-white/20 font-extrabold text-acid-lime">
                              {slot.code}
                            </td>
                            <td className="p-4 border-r border-white/20">
                              {slot.time}
                            </td>
                            <td className="p-4 border-r border-white/20 font-sans font-black text-white">
                              {slot.name}
                            </td>
                            <td className="p-4 border-r border-white/20 text-white/60">
                              {slot.trainer}
                            </td>
                            <td className="p-4 border-r border-white/20 text-right font-extrabold text-[#ffffff]">
                              {slot.metric}
                            </td>
                            <td className="p-4 border-r border-white/20 text-center text-white/50">
                              {slot.status}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => toggleBookSlot(slot.id, slot.name)}
                                className={`w-full py-2.5 px-4 font-mono font-bold uppercase text-[10px] tracking-widest cursor-pointer transition-all ${
                                  isBooked 
                                    ? "bg-[#ffffff] text-black border border-white hover:bg-rose-500 hover:text-white hover:border-rose-500" 
                                    : "bg-transparent text-acid-lime border border-acid-lime hover-invert-brutal"
                                }`}
                              >
                                {isBooked ? "[ BOOKED ]" : "[ ENLIST ]"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Swiss legend detail guidelines below */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div className="p-5 border border-white/10 uppercase font-mono space-y-2 bg-black/40">
                    <div className="text-xs font-bold text-acid-lime">M-E RATING (LIFT)</div>
                    <p className="text-[10px] text-white/60 leading-normal">
                      REPRESENTS PEAK MUSCULAR ENERGY COEFFICIENT. TARGET LOADS ARE SCIENTIFICALLY BALANCED AT ELEVATED RECOVERY SPEED PLANNERS.
                    </p>
                  </div>
                  <div className="p-5 border border-white/10 uppercase font-mono space-y-2 bg-black/40">
                    <div className="text-xs font-bold text-white">CHURN RESILIENCE FLUID</div>
                    <p className="text-[10px] text-white/60 leading-normal">
                      AQUATIC RESISTANCE TARGET MODULES DECREASE SPINAL DECOMPRESSION TIMEOUTS FOR DECOUPLED DIPLOMATIC OFFICERS BY 40%.
                    </p>
                  </div>
                  <div className="p-5 border border-white/10 uppercase font-mono space-y-2 bg-black/40">
                    <div className="text-xs font-bold text-acid-lime">SWISS TYPOGRAPHY DIRECTIVES</div>
                    <p className="text-[10px] text-white/60 leading-normal">
                      DATA OVERLOAD ENFORCES IMMEDIATE CRUSH VALUES. STATE INDICATORS REMODELED TO ENCOURAGE REPETITIVE SEAMLESS RE-ENROLLMENT.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: TRAINER SESSIONS LOGGER FORM */}
            {activeTab === "logger" && (
              <motion.div
                key="logger-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="max-w-xl mx-auto space-y-4">
                  <TrainerForm
                    clients={clients}
                    trainers={trainers}
                    onLogSubmit={handleLogSubmit}
                  />
                  
                  {/* Latest logs tracker block */}
                  <div className="concrete-grain bg-black border border-white/20 p-5 mt-6">
                    <h3 className="text-xs font-mono font-bold text-white/40 uppercase mb-4 tracking-widest">
                      TRANSCEIVER FEED: PREVIOUS WORKOUT TRANSMISSIONS ({logs.length})
                    </h3>
                    
                    <div className="space-y-3.5 max-h-60 overflow-y-auto divide-y divide-white/10 pr-1">
                      {logs.slice().reverse().map((log, idx) => (
                        <div key={idx} className="pt-3 text-[11px] font-mono uppercase space-y-1 text-left">
                          <div className="flex justify-between font-bold text-white">
                            <span>{log.clientName}</span>
                            <span className="text-acid-lime">SESS {log.sessionNumber}</span>
                          </div>
                          <div className="flex justify-between text-white/40 text-[10px]">
                            <span>OPERATOR: {log.trainerName}</span>
                            <span>DATE: {log.date}</span>
                          </div>
                          <p className="text-xs text-white/70 italic mt-1 font-sans tracking-wide">
                            "{log.notes}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: VIP DIRECTORY & CLIENT CRUD */}
            {activeTab === "roster" && (
              <motion.div
                key="roster-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div className="border-b-2 border-white/20 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <span className="text-xs text-acid-lime font-mono tracking-widest uppercase block mb-1">
                      [ SECURE DIRECTORY DATABASE_04 ]
                    </span>
                    <h2 className="text-2xl md:text-3xl font-grotesque font-black uppercase text-white tracking-tighter">
                      ELITE SUBJECT DIRECTORY
                    </h2>
                    <p className="text-xs font-mono text-white/50 uppercase">
                      MANAGE ENROLLMENTS, CONTRACT LIMITS, AND TRAINER ASSIGNMETS IN LIVE REVENUE SECTOR.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingClient({
                        name: "",
                        goal: "",
                        assignedTrainer: "Martha",
                        phone: "",
                        email: "",
                        totalSessions: 10,
                        completedSessions: 0,
                        status: "active"
                      });
                      setIsClientModalOpen(true);
                    }}
                    className="py-3 px-6 bg-acid-lime text-black font-mono font-bold text-xs uppercase tracking-widest hover-invert-brutal border border-acid-lime transition-all cursor-pointer shadow-lg"
                  >
                    + REGISTER MEMBER PROFILE
                  </button>
                </div>

                {/* Filter / Search Bar */}
                <div className="relative bg-[#121212] border border-white/20 p-2 flex items-center gap-3">
                  <Search className="w-4 h-4 text-white/40 ml-3" />
                  <input
                    type="text"
                    placeholder="SEARCH MEMBERS BY NAME, OPERATOR, BIO-GOAL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow bg-transparent text-white font-mono uppercase text-xs focus:outline-none placeholder-white/30 py-2.5"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-white/40 hover:text-white uppercase font-mono text-[9px] mr-2"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                {/* Broken Editorial Card Grid representing Clients */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClients.map((c) => {
                    return (
                      <div
                        key={c.id}
                        className="border-2 border-white bg-black/90 p-5 flex flex-col justify-between transition-all hover:border-acid-lime relative"
                      >
                        {/* Status tag */}
                        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
                          <span className={`px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-wider font-extrabold ${
                            c.status === "needs-renewal"
                              ? "bg-acid-lime text-black"
                              : c.status === "at-risk"
                                ? "bg-rose-600 text-white"
                                : c.status === "completed"
                                  ? "bg-white/40 text-black"
                                  : "bg-white/10 text-white"
                          }`}>
                            {c.status.toUpperCase()}
                          </span>

                          <span className="text-[10px] font-mono text-white/40">
                            SESS_{c.completedSessions}/{c.totalSessions}
                          </span>
                        </div>

                        {/* Middle Info */}
                        <div className="space-y-3 mb-6">
                          <h4 className="text-sm font-grotesque font-black uppercase text-white">
                            {c.name}
                          </h4>
                          
                          <div className="font-mono text-[10px] space-y-1 text-white/60">
                            <div>
                              <span className="text-white/30">OPERATOR:</span> {c.assignedTrainer.toUpperCase()}
                            </div>
                            <div>
                              <span className="text-white/30">PHONE:</span> {c.phone}
                            </div>
                            <div>
                              <span className="text-white/30">EMAIL:</span> {c.email}
                            </div>
                            <div className="pt-1 text-white uppercase italic leading-tight">
                              [ TARGET: {c.goal} ]
                            </div>
                          </div>
                        </div>

                        {/* Actions block */}
                        <div className="flex gap-2 border-t border-white/10 pt-3">
                          <button
                            onClick={() => {
                              setEditingClient(c);
                              setIsClientModalOpen(true);
                            }}
                            className="flex-1 py-2 bg-transparent border border-white/20 text-white text-[10px] font-mono font-bold uppercase hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer"
                          >
                            [ EDIT ]
                          </button>
                          
                          <button
                            onClick={() => {
                              const simulatedRes = handleLogSubmit({
                                clientName: c.name,
                                trainerName: c.assignedTrainer,
                                sessionNumber: Math.min(c.totalSessions, c.completedSessions + 1),
                                noteText: "Completed targeted brutal physical drill. Heavy load stabilization processed perfectly."
                              });
                            }}
                            className="flex-1 py-2 bg-acid-lime border border-acid-lime text-black text-[10px] font-mono font-bold uppercase hover-invert-brutal transition-all cursor-pointer"
                          >
                            [ Sim_Log ]
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB 5: MOTIVATION & RETENTION COCKPIT */}
            {activeTab === "motivation" && (
              <motion.div
                key="motivation-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-8 text-white text-left animate-fade-in"
              >
                {/* Header */}
                <div className="border-b-2 border-white/20 pb-5">
                  <span className="text-xs text-acid-lime font-mono tracking-widest uppercase block mb-1">
                    [ RETENTION TASKFORCE // ACTIVE DE-NEUTRALIZATION ]
                  </span>
                  <h2 className="text-2xl md:text-3xl font-grotesque font-black uppercase tracking-tighter">
                    AI MOTIVATION & RETENTION COCKPIT
                  </h2>
                  <p className="text-xs font-mono text-white/50 uppercase">
                    MONITOR DISENGAGED DIPLOMAT ATTENDANCE, COMPOSE ELITE RETENTION SCRIPTS, AND CELEBRATE HIGH-MOMENTUM CHAMPIONS.
                  </p>
                </div>

                {/* Score Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-white/20 bg-black/80 p-5">
                    <span className="text-xs font-mono text-white/40 block uppercase tracking-wider">⚠️ DISENGAGED MEMBER ALERTS</span>
                    <h3 className="text-3xl font-grotesque font-black text-rose-500 mt-2">
                      {clients.filter(c => (c.motivationScore ?? 100) <= 45).length} SUBJECTS
                    </h3>
                    <p className="text-[10px] font-mono text-white/40 uppercase mt-1">Motivation levels under 45% flag severe churn risk.</p>
                  </div>

                  <div className="border border-white/20 bg-black/80 p-5">
                    <span className="text-xs font-mono text-white/40 block uppercase tracking-wider">🏆 HIGH-MOMENTUM SUPERSTARS</span>
                    <h3 className="text-3xl font-grotesque font-black text-acid-lime mt-2">
                      {clients.filter(c => (c.motivationScore ?? 0) >= 80).length} HEROES
                    </h3>
                    <p className="text-[10px] font-mono text-white/40 uppercase mt-1">Streak champions achieving their luxury target goals.</p>
                  </div>

                  <div className="border border-white/20 bg-black/80 p-5">
                    <span className="text-xs font-mono text-white/40 block uppercase tracking-wider">⚡ SHERATON RESILIENCE RATING</span>
                    <h3 className="text-3xl font-grotesque font-black mt-2">
                      {clients.length > 0 
                        ? Math.round(clients.reduce((acc, c) => acc + (c.motivationScore ?? 100), 0) / clients.length) 
                        : 0}% AVG
                    </h3>
                    <p className="text-[10px] font-mono text-white/40 uppercase mt-1">Gym-wide engagement index on Taitu Street.</p>
                  </div>
                </div>

                {/* Main Split Interface Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left segment list (lg:col-span-7) */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Low Motivation Section */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 border-b border-rose-500/35 pb-2">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-rose-500">
                          SOS // UNMOTIVATED & DISENGAGING MEMBERS ({clients.filter(c => (c.motivationScore ?? 100) <= 45).length})
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {clients.filter(c => (c.motivationScore ?? 100) <= 45).map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => {
                              setSelectedClientForMotivation(c);
                              setCustomMotivationScore(c.motivationScore ?? 40);
                              setCustomUnmotivatedReason(c.unmotivatedReason ?? "");
                              setCustomNudgeText("");
                              setAiMotivationResponseText("");
                            }}
                            className={`border p-4 bg-black/60 transition-all cursor-pointer flex flex-col justify-between ${
                              selectedClientForMotivation?.id === c.id 
                                ? "border-rose-500 bg-[#1e0a0f]/40" 
                                : "border-white/15 hover:border-white/30"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-grotesque font-black uppercase text-white leading-none">{c.name}</h4>
                                <span className="text-[10px] font-mono text-white/40 mt-1 block">ASSIGNED COACH: {c.assignedTrainer.toUpperCase()}</span>
                              </div>
                              <span className="text-rose-500 font-mono text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 px-2 py-0.5">
                                MOTIVATION SCORE: {c.motivationScore ?? 40}%
                              </span>
                            </div>

                            {/* Motivation Bar */}
                            <div className="w-full bg-white/5 h-2 rounded-none mt-3 relative overflow-hidden">
                              <div 
                                className="bg-rose-600 h-full transition-all duration-500" 
                                style={{ width: `${c.motivationScore ?? 40}%` }}
                              />
                            </div>

                            {c.unmotivatedReason && (
                              <p className="text-[10px] font-mono text-white/70 italic mt-3 bg-rose-500/5 border border-rose-500/15 p-2 uppercase">
                                <span className="text-rose-400 font-bold">[MOTIVATION OBSTACLE]:</span> {c.unmotivatedReason}
                              </p>
                            )}

                            <div className="mt-3 flex justify-between items-center text-[9px] font-mono text-white/40 uppercase">
                              <span>LAST ENROLLED: {c.lastActive}</span>
                              {c.lastNudged ? (
                                <span className="text-rose-400 font-bold">🚨 NUDGED ON: {c.lastNudged}</span>
                              ) : (
                                <span className="text-white/30 font-bold">NEVER NUDGED IN THIS RUN</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {clients.filter(c => (c.motivationScore ?? 100) <= 45).length === 0 && (
                          <div className="border border-white/10 p-6 text-center text-white/40 font-mono text-xs uppercase">
                            Zero unmotivated diplomats. Outstanding! All members are active.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* High Motivation Section */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 border-b border-acid-lime/35 pb-2">
                        <Smile className="w-4 h-4 text-acid-lime" />
                        <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-acid-lime">
                          🏆 THRIVING CHAMPIONS & HIGH-MOMENTUM ({clients.filter(c => (c.motivationScore ?? 0) >= 80).length})
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {clients.filter(c => (c.motivationScore ?? 0) >= 80).map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => {
                              setSelectedClientForMotivation(c);
                              setCustomMotivationScore(c.motivationScore ?? 85);
                              setCustomUnmotivatedReason(c.unmotivatedReason ?? "");
                              setCustomNudgeText("");
                              setAiMotivationResponseText("");
                            }}
                            className={`border p-4 bg-black/60 transition-all cursor-pointer flex flex-col justify-between ${
                              selectedClientForMotivation?.id === c.id 
                                ? "border-acid-lime bg-[#0d1607]" 
                                : "border-white/15 hover:border-white/30"
                            }`}
                          >
                            <div className="flex flex-col h-full justify-between">
                              <div>
                                <div className="flex justify-between items-start">
                                  <h4 className="text-sm font-grotesque font-black uppercase text-white leading-tight">{c.name}</h4>
                                  <span className="text-acid-lime font-mono text-[9px] font-bold bg-acid-lime/10 px-1.5 py-0.5 border border-acid-lime/20 h-fit shrink-0">
                                    {c.motivationScore ?? 85}%
                                  </span>
                                </div>
                                <p className="text-[10px] font-mono text-acid-lime mt-1 uppercase italic">
                                  [STREAK: 🔥 {c.attendanceStreak ?? 3} WORKOUTS]
                                </p>
                                
                                <p className="text-[10px] font-mono text-white/70 leading-normal mt-2 line-clamp-2 uppercase">
                                  Goal: {c.goal}
                                </p>
                              </div>

                              <div className="mt-4 pt-2 border-t border-white/15">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendNudgeCheckIn(
                                      c.id, 
                                      c.name, 
                                      c.assignedTrainer, 
                                      `Dear ${c.name.split(" ")[0]}, Coach ${c.assignedTrainer} here from The Aqva Club Sheraton Addis. We want to congratulate you on your consecutive ${c.attendanceStreak || 4} workout streak! We have booked a complimentary 30-min sensory massage voucher for you to enjoy after your next session. Keep rising!`
                                    );
                                  }}
                                  className="w-full py-2 border border-acid-lime bg-acid-lime text-black font-mono font-bold text-[9px] uppercase hover:bg-black hover:text-acid-lime transition-all cursor-pointer text-center"
                                >
                                  [ AWARD Compli massage ]
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Moderate Slipping Section */}
                    {clients.filter(c => (c.motivationScore ?? 50) > 45 && (c.motivationScore ?? 50) < 80).length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 border-b border-yellow-500/35 pb-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-yellow-500">
                            ⚠️ MODERATE / SLIPPING LEVEL MEMBERS
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {clients.filter(c => (c.motivationScore ?? 50) > 45 && (c.motivationScore ?? 50) < 80).map(c => (
                            <div 
                              key={c.id} 
                              onClick={() => {
                                setSelectedClientForMotivation(c);
                                setCustomMotivationScore(c.motivationScore ?? 65);
                                setCustomUnmotivatedReason(c.unmotivatedReason ?? "");
                                setCustomNudgeText("");
                                setAiMotivationResponseText("");
                              }}
                              className={`border p-4 bg-black/60 transition-all cursor-pointer flex flex-col justify-between ${
                                selectedClientForMotivation?.id === c.id 
                                  ? "border-yellow-500 bg-[#1f1a07]" 
                                  : "border-white/10 hover:border-white/20"
                              }`}
                            >
                              <div>
                                <div className="flex justify-between items-start">
                                  <h4 className="text-xs font-grotesque font-black uppercase text-white">{c.name}</h4>
                                  <span className="text-yellow-500 font-mono text-[9px] font-bold">
                                    {c.motivationScore ?? 65}%
                                  </span>
                                </div>
                                <p className="text-[10px] font-mono text-white/40 mt-1 uppercase">Coach: {c.assignedTrainer}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Right side command console (lg:col-span-5) */}
                  <div className="lg:col-span-5">
                    {selectedClientForMotivation ? (
                      <div className="border-2 border-white p-5 space-y-6 bg-black sticky top-6">
                        {/* Selected Title */}
                        <div className="border-b border-white/10 pb-4">
                          <span className="text-acid-lime font-mono text-[10px] font-bold block uppercase tracking-wider">
                            [ ACTIVE DE-NEUTRALIZATION TARGET ]
                          </span>
                          <h3 className="text-md font-grotesque font-black uppercase text-white mt-1 leading-snug">
                            {selectedClientForMotivation.name}
                          </h3>
                          <p className="text-[10px] font-mono text-white/50 uppercase">
                            Coach {selectedClientForMotivation.assignedTrainer.toUpperCase()} // Goal: {selectedClientForMotivation.goal}
                          </p>
                        </div>

                        {/* Sliders to update motivation and reasons */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-mono font-bold tracking-widest text-acid-lime uppercase text-left">
                            [ 01 // CALIBRATE STATE ]
                          </h4>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between font-mono text-[10px]">
                              <span className="text-white/50">ENGAGEMENT SCORE:</span>
                              <span className={`font-bold ${customMotivationScore <= 40 ? "text-rose-500" : "text-acid-lime"}`}>{customMotivationScore}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={customMotivationScore}
                              onChange={(e) => setCustomMotivationScore(Number(e.target.value))}
                              className="w-full accent-acid-lime bg-white/10 cursor-pointer h-1 rounded-none outline-none"
                            />
                            <div className="flex justify-between text-[8.5px] font-mono text-white/30 uppercase">
                              <span>0% CHURN</span>
                              <span>50% PASSIVE</span>
                              <span>100% THRIVING</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-mono font-bold text-white/50 uppercase">
                              MOTIVATION OBSTACLE / UNMOTIVATED CAUSE:
                            </label>
                            <input 
                              type="text"
                              value={customUnmotivatedReason}
                              onChange={(e) => setCustomUnmotivatedReason(e.target.value.toUpperCase())}
                              placeholder="E.G. TRAVEL LETHARGY, WORK STRESS..."
                              className="w-full bg-[#111] border border-white/20 text-xs font-mono text-white px-3 py-2 uppercase placeholder-white/20 focus:outline-none focus:border-acid-lime"
                            />
                          </div>

                          <button
                            onClick={() => handleUpdateMotivation(selectedClientForMotivation.id, customMotivationScore, customUnmotivatedReason)}
                            className="w-full py-2.5 bg-white text-black font-mono font-bold text-[10px] uppercase hover:bg-neutral-200 transition-all cursor-pointer border border-white"
                          >
                            [ SAVE CALIBRATION SEEDS ]
                          </button>
                        </div>

                        {/* AI outreach composed section */}
                        <div className="space-y-4 border-t border-white/10 pt-5 text-left">
                          <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-mono font-bold tracking-widest text-acid-lime uppercase">
                              [ 02 // BESPOKE AI RETENTION ENGINE ]
                            </h4>
                            {selectedClientForMotivation.status === "at-risk" && (
                              <span className="text-[9px] font-mono text-rose-500 bg-rose-500/10 px-1 border border-rose-500/20 font-bold uppercase">
                                TARGET AT RISK
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[10px] font-mono text-white/50 leading-relaxed uppercase">
                            Compose a luxurious, custom outreach script targeting their exact blockages utilizing Sheraton hotel-grade service standards.
                          </p>

                          <button
                            onClick={() => handleGenerateAIMotivationScript(selectedClientForMotivation)}
                            disabled={aiGeneratingMotivation}
                            className="w-full py-3 bg-acid-lime text-black font-mono font-bold text-[10px] uppercase hover-invert-brutal transition-all cursor-pointer border border-acid-lime flex items-center justify-center space-x-2"
                          >
                            {aiGeneratingMotivation ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>COMPOSING LUXURY SOLUTION...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                <span>GENERATE PERSONAL MOTIVATION SCRIPT</span>
                              </>
                            )}
                          </button>

                          {aiMotivationResponseText && (
                            <div className="space-y-3">
                              <div className="relative border border-acid-lime/30 bg-[#0d0f0d] p-4 text-left font-mono">
                                <span className="absolute top-2 right-2 text-[8px] font-mono text-acid-lime uppercase bg-acid-lime/10 px-1 pb-0.5">READY DISPATCH</span>
                                <div className="text-[11px] text-white/90 leading-relaxed whitespace-pre-wrap select-text selection:bg-acid-lime selection:text-black">
                                  {aiMotivationResponseText}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(aiMotivationResponseText);
                                    showToast("COPIED BESPOKE RETENTION SCRIPT!", "success");
                                    setCustomNudgeText(aiMotivationResponseText);
                                  }}
                                  className="flex-grow py-2 bg-transparent border border-white/20 text-white text-[9px] font-mono font-bold uppercase hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer"
                                >
                                  [ COPY TO CLIPBOARD ]
                                </button>
                                <button
                                  onClick={() => {
                                    setCustomNudgeText(aiMotivationResponseText);
                                    showToast("PULLED INSIDE THE NUDGE TRANSMITTER", "info");
                                  }}
                                  className="flex-grow py-2 bg-acid-lime border border-acid-lime text-black text-[9px] font-mono font-bold uppercase hover-invert-brutal transition-all cursor-pointer"
                                >
                                  [ USE AS NUDGE TEXT ]
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Send actual motivation nudge check-in */}
                        <div className="space-y-4 border-t border-white/10 pt-5 text-left">
                          <h4 className="text-[10px] font-mono font-bold tracking-widest text-acid-lime uppercase">
                            [ 03 // DISPATCH RETENTION SEED ]
                          </h4>

                          <div className="space-y-2">
                            <textarea
                              rows={4}
                              placeholder="WRITE OR PASTE CUSTOM MOTIVATION BOOST OUTREACH..."
                              value={customNudgeText}
                              onChange={(e) => setCustomNudgeText(e.target.value)}
                              className="w-full bg-[#111] text-[11px] font-mono text-white px-3 py-2 border border-white/20 focus:outline-none focus:border-acid-lime tracking-normal leading-normal whitespace-pre-wrap placeholder-white/10 rounded-none uppercase"
                            />
                            
                            {/* Sheraton Addis Specific Quick presets */}
                            <div className="flex flex-wrap gap-1">
                              <button 
                                onClick={() => setCustomNudgeText(`Dear ${selectedClientForMotivation.name.split(" ")[0]}, Coach ${selectedClientForMotivation.assignedTrainer} here from The Aqva Club Sheraton Addis. Don't let your travel schedule get the best of you! The weather's refreshing—let's book a cozy 30-minute swim session in our 28°C heated outdoor pools with legendary underwater audio. Perfect active recovery. What spot fits?`)}
                                className="text-[8px] font-mono bg-white/5 border border-white/10 px-2 py-1 text-white/60 hover:text-white hover:border-white transition-all cursor-pointer uppercase"
                              >
                                [ Preset: Pool & Music ]
                              </button>
                              <button 
                                onClick={() => setCustomNudgeText(`Dear ${selectedClientForMotivation.name.split(" ")[0]}, Coach ${selectedClientForMotivation.assignedTrainer} here from Taitu Street. I've designed a specialized spinal decompression protocol on the TechnoGym deck to break up that international flight fatigue. Let's do a quiet VIP session tomorrow. Shall I lock in the slot?`)}
                                className="text-[8px] font-mono bg-white/5 border border-white/10 px-2 py-1 text-white/60 hover:text-white hover:border-white transition-all cursor-pointer uppercase"
                              >
                                [ Preset: Spinal Relief ]
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              handleSendNudgeCheckIn(
                                selectedClientForMotivation.id,
                                selectedClientForMotivation.name,
                                selectedClientForMotivation.assignedTrainer,
                                customNudgeText
                              );
                              setCustomNudgeText("");
                            }}
                            disabled={!customNudgeText.trim()}
                            className="w-full py-3 bg-white text-black font-mono font-bold text-[10px] uppercase hover:bg-neutral-200 hover:text-black transition-all cursor-pointer border border-white disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            [ DELIVER RE-ENGAGEMENT CHECK-IN ]
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-white/20 border-dashed p-10 text-center font-mono space-y-4 bg-black/30">
                        <Smile className="w-8 h-8 text-white/30 mx-auto animate-bounce" />
                        <div>
                          <p className="text-xs uppercase text-white font-bold leading-normal">
                            COMMAND CONSOLE INERT
                          </p>
                          <p className="text-[10px] text-white/40 uppercase mt-1 leading-relaxed">
                            SELECT ANY RETENTION TARGET MEMBER ON THE LEFT LIST TO LAUNCH COMPOSITION SLIDERS, GENERATE CUSTOM AI OUTREACH AND RECORD MOTIVATION RECOVERY NUDGES.
                          </p>
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              const firstAtRisk = clients.find(c => (c.motivationScore ?? 100) <= 45);
                              if (firstAtRisk) {
                                setSelectedClientForMotivation(firstAtRisk);
                                setCustomMotivationScore(firstAtRisk.motivationScore ?? 40);
                                setCustomUnmotivatedReason(firstAtRisk.unmotivatedReason ?? "");
                              } else if (clients.length > 0) {
                                setSelectedClientForMotivation(clients[0]);
                                setCustomMotivationScore(clients[0].motivationScore ?? 85);
                                setCustomUnmotivatedReason(clients[0].unmotivatedReason ?? "");
                              }
                            }}
                            className="py-2.5 px-4 border border-acid-lime text-acid-lime hover:bg-acid-lime hover:text-black transition-all text-[9.5px] uppercase font-black tracking-widest cursor-pointer"
                          >
                            [ AUTO-TARGET CRITICAL PROFILE ]
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 5: WEBHOOK API CONFIGURATION */}
            {activeTab === "webhook" && (
              <motion.div
                key="webhook-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                <div className="border border-white p-6 md:p-8 space-y-6 bg-black">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <Sliders className="w-6 h-6 text-acid-lime" />
                    <div>
                      <h2 className="text-lg font-grotesque font-black uppercase text-white leading-none">
                        MAKE.COM INTEGRATION SCHEMATIC
                      </h2>
                      <span className="text-[10px] text-acid-lime font-mono tracking-widest uppercase block mt-1">
                        DISPATCH REALTIME WEBSYNC EMITTERS
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSaveWebhook} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                        TARGET CUSTOM WEBHOOK ENDPOINT
                      </label>
                      <input
                        type="url"
                        placeholder="E.G. HTTPS://HOOKS.INTEGROMAT.COM/XXXXXX..."
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="w-full bg-[#111111] text-xs font-mono text-white px-4 py-3 border border-white/20 focus:outline-none focus:border-acid-lime uppercase"
                        required
                      />
                      <p className="text-[9px] font-mono text-white/40 leading-normal uppercase">
                        PASTE THE HOOK CONFIG GENERATED BY CHOSEN MIDDLEWARE. MAKE sure TO SAVE SO BIOMETRICS BROADCAST TO YOUR TARGET CRM ENDPOINT LIVE upon active log.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="py-3 px-6 bg-acid-lime text-black font-mono font-bold text-xs uppercase tracking-widest hover-invert-brutal border border-acid-lime transition-all cursor-pointer"
                    >
                      [ COMMIT CONFIG TUNNEL ]
                    </button>
                  </form>
                </div>

                {/* Dispatch json schema indicator */}
                <div className="border border-white/20 bg-black/40 p-5 font-mono space-y-3 text-left">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-[9px] font-extrabold text-acid-lime">[ TRANSMISSION_DISPATCH_SCHEMA ]</span>
                    <span className="text-[9px] text-white/40 bg-white/5 border border-white/10 px-1 py-0.5">POST / JSON</span>
                  </div>
                  
                  <pre className="text-[10px] text-white/50 bg-[#111111] p-4 border border-white/5 overflow-x-auto leading-normal">
{`{
  "event": "workout_session_logged",
  "data": {
    "clientName": "AMBASSADOR ELENA ROSTOVA",
    "trainerName": "MARTHA",
    "completedSessions": 10,
    "totalSessions": 12,
    "currentDate": "2026-06-09",
    "rawNotes": " thorium rotation progress standard."
  },
  "recipient_meta": {
    "subject": "e.rostova@embassy.gov",
    "outreach_template": "PRACTICAL TEMPLATE WITH MIKE..."
  }
}`}
                  </pre>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </section>
      </main>

      {/* R ROSTER REGISTER / CLIENT EDIT MODAL (Solid unrounded borders, minimalist form) */}
      <AnimatePresence>
        {isClientModalOpen && editingClient && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D0D0D] border-2 border-white max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl relative z-50 text-left"
            >
              <div className="border-b border-white/10 pb-3">
                <span className="text-[9px] text-acid-lime font-mono tracking-widest uppercase block mb-1">
                  DB_WRITE_PROFILE
                </span>
                <h3 className="text-lg font-grotesque font-black text-white uppercase tracking-tighter leading-none">
                  {editingClient.id ? "[ EDIT MEMBER PARAMS ]" : "[ REGISTER NEW MEMBER ]"}
                </h3>
              </div>

              <form onSubmit={handleSaveClient} className="space-y-4">
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-white/50 uppercase">FULL NAME</label>
                    <input
                      type="text"
                      required
                      value={editingClient.name || ""}
                      onChange={(e) => setEditingClient(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-[#111111] text-xs font-mono text-white px-3 py-2.5 border border-white/20 uppercase focus:outline-none focus:border-acid-lime"
                      placeholder="ENTER NAME..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-white/50 uppercase">PHONE METRIC</label>
                      <input
                        type="text"
                        required
                        value={editingClient.phone || ""}
                        onChange={(e) => setEditingClient(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-[#111111] text-xs font-mono text-white px-3 py-2.5 border border-white/20 uppercase focus:outline-none"
                        placeholder="PHONE..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-white/50 uppercase">EMAIL SYSTEM</label>
                      <input
                        type="email"
                        value={editingClient.email || ""}
                        onChange={(e) => setEditingClient(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full bg-[#111111] text-xs font-mono text-white px-3 py-2.5 border border-white/20 uppercase focus:outline-none"
                        placeholder="EMAIL..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-white/50 uppercase">ASSIGNED TRAINER INSTRUCTOR</label>
                    <select
                      value={editingClient.assignedTrainer || "Martha"}
                      onChange={(e) => setEditingClient(prev => ({ ...prev, assignedTrainer: e.target.value }))}
                      className="w-full bg-[#111111] text-xs font-mono text-white px-3 py-2.5 border border-white/20 uppercase cursor-pointer focus:outline-none"
                    >
                      <option value="Martha" className="bg-[#0D0D0D]">Martha</option>
                      <option value="Mike" className="bg-[#0D0D0D]">Mike</option>
                      <option value="Sarah" className="bg-[#0D0D0D]">Sarah</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-white/50 uppercase">CORE STRENGTH / BIOMETRIC TARGETS</label>
                    <input
                      type="text"
                      required
                      value={editingClient.goal || ""}
                      onChange={(e) => setEditingClient(prev => ({ ...prev, goal: e.target.value }))}
                      className="w-full bg-[#111111] text-xs font-mono text-white px-3 py-2.5 border border-white/20 uppercase focus:outline-none"
                      placeholder="E.G. AQUATIC STRENGTH, POSTURE STABILITY..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-white/50">TOTAL PT SESSIONS</label>
                      <input
                        type="number"
                        required
                        value={editingClient.totalSessions || 10}
                        onChange={(e) => setEditingClient(prev => ({ ...prev, totalSessions: parseInt(e.target.value) || 10 }))}
                        className="w-full bg-[#111111] text-xs font-mono text-white px-3 py-2.5 border border-white/20 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-white/50">COMPLETED COUNT</label>
                      <input
                        type="number"
                        required
                        value={editingClient.completedSessions ?? 0}
                        onChange={(e) => setEditingClient(prev => ({ ...prev, completedSessions: parseInt(e.target.value) ?? 0 }))}
                        className="w-full bg-[#111111] text-xs font-mono text-white px-3 py-2.5 border border-white/20 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    disabled={clientFormSubmitting}
                    className="flex-1 py-3 bg-acid-lime text-black font-mono font-bold text-xs uppercase tracking-widest hover-invert-brutal border border-acid-lime cursor-pointer disabled:opacity-40"
                  >
                    {clientFormSubmitting ? "TRANSMITTING WRITE..." : "SAVE PROFILE"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsClientModalOpen(false);
                      setEditingClient(null);
                    }}
                    className="py-3 px-6 bg-transparent text-white/50 hover:text-white border border-white/15 font-mono text-xs uppercase"
                  >
                    [ DISMISS ]
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. HIGH-END FLOATING TOAST NOTIFICATION CHANNEL */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 p-4 border shadow-2xl flex items-center gap-3.5 max-w-sm"
            style={{
              backgroundColor: "#000000",
              borderColor: toast.type === "success" ? "#D1FF00" : "rgba(244, 63, 94, 0.6)"
            }}
          >
            <div className={`w-2.5 h-2.5 shrink-0 ${toast.type === "success" ? "bg-acid-lime" : "bg-rose-500"}`} />
            <div>
              <span className="text-[8px] font-mono text-white/40 block mt-0.5">[ SYS_ALERT // ENGAGED ]</span>
              <p className="text-[11px] font-mono uppercase font-bold text-white leading-tight mt-0.5">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
