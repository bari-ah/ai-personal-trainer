/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Standard luxury error resilience: prevent any unhandled background promise or exception from crashing the server process
process.on("unhandledRejection", (reason, promise) => {
  console.error("CRITICAL: Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err, origin) => {
  console.error(`CRITICAL: Caught exception: ${err}\nException origin: ${origin}`);
});

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to persist JSON database (uses VM's temporary directory when running under Vercel serverless environment)
const DATA_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), "db_state_luxury.json")
  : path.join(process.cwd(), "db_state.json");

// Define basic initial data
const DEFAULT_CLIENTS = [
  {
    id: "c1",
    name: "Ambassador Elena Rostova",
    phone: "+251 91 123 4567",
    email: "e.rostova@embassy.gov",
    assignedTrainer: "Martha",
    goal: "Postural correction, shoulder rehabilitation, and luxury spa active recovery integration",
    totalSessions: 12,
    completedSessions: 10,
    remainingSessions: 2,
    notes: "Ambassador Elena completed session 10 of 12. Marked posture stabilisation. Prefers quiet personal spa recovery sessions after intense workouts.",
    status: "needs-renewal",
    lastActive: "2026-06-06",
    motivationScore: 82,
    attendanceStreak: 4,
    unmotivatedReason: ""
  },
  {
    id: "c2",
    name: "Marcus Vance (IMF Director)",
    phone: "+251 92 987 6543",
    email: "m.vance@imf.org",
    assignedTrainer: "Mike",
    goal: "Decompress spinal stiffness, scoliosis management, and heated pool therapeutic flow",
    totalSessions: 10,
    completedSessions: 3,
    remainingSessions: 7,
    notes: "Marcus missed 3 booked sessions due to immediate diplomatic flights. Expressed flight-related back stiffness and muscle tension.",
    status: "at-risk",
    lastActive: "2026-05-30",
    motivationScore: 35,
    attendanceStreak: 0,
    unmotivatedReason: "Frequent sudden diplomatic departures and travel jetlag causing him to lose momentum."
  },
  {
    id: "c3",
    name: "Hana Al-Mansoor",
    phone: "+251 90 345 6789",
    email: "hana.am@gulfinvest.com",
    assignedTrainer: "Martha",
    goal: "Underwater aquatic resistance conditioning and deep muscle definitions",
    totalSessions: 10,
    completedSessions: 9,
    remainingSessions: 1,
    notes: "Hana is highly pleased with our aquatic resistance pool progress but struggles with international flight dining schedules. Desires a custom macro layout.",
    status: "needs-renewal",
    lastActive: "2026-06-05",
    motivationScore: 88,
    attendanceStreak: 6,
    unmotivatedReason: ""
  },
  {
    id: "c4",
    name: "David Chen (UN Envoy)",
    phone: "+251 94 456 7890",
    email: "david.chen@un.org",
    assignedTrainer: "Sarah",
    goal: "Functional core endurance and cardiovascular conditioning for high altitude training in Addis",
    totalSessions: 15,
    completedSessions: 12,
    remainingSessions: 3,
    notes: "David reached a cardiovascular benchmark today on the luxury TechnoGym deck! Feeling fully vital. Ready for elite package renewal dialogue.",
    status: "active",
    lastActive: "2026-06-06",
    motivationScore: 94,
    attendanceStreak: 8,
    unmotivatedReason: ""
  },
  {
    id: "c5",
    name: "Saron Tekle (Embassy Attaché)",
    phone: "+251 91 555 4321",
    email: "saron.tekle@gov.et",
    assignedTrainer: "Sarah",
    goal: "Post-pregnancy rehabilitation and luxury heated pool restorative flow",
    totalSessions: 10,
    completedSessions: 2,
    remainingSessions: 8,
    notes: "Saron is feeling extremely demotivated by post-natal muscle soreness and heavy work anxiety. Expressed she wants to delay sessions.",
    status: "at-risk",
    lastActive: "2026-05-25",
    motivationScore: 20,
    attendanceStreak: 0,
    unmotivatedReason: "Post-natal fatigue combined with severe embassy stress and slow visible progress."
  },
  {
    id: "c6",
    name: "Dr. Tariku Bekele (African Union)",
    phone: "+251 93 777 8899",
    email: "tariku.b@au.int",
    assignedTrainer: "Mike",
    goal: "Stress relief, high-altitude cardiovascular endurance, and sauna thermal recovery",
    totalSessions: 20,
    completedSessions: 16,
    remainingSessions: 4,
    notes: "Dr. Tariku is thriving! Maintained standard 3 weekly sessions, highly praised the traditional wooden sauna and Coach Mike's energetic pacing.",
    status: "active",
    lastActive: "2026-06-08",
    motivationScore: 98,
    attendanceStreak: 12,
    unmotivatedReason: ""
  }
];

const DEFAULT_LOGS = [
  {
    id: "log1",
    clientId: "c3",
    clientName: "Hana Al-Mansoor",
    trainerName: "Martha",
    sessionNumber: 9,
    totalSessionsInPackage: 10,
    date: "2026-06-05",
    notes: "Hana completed aquatic resistance session 9. Excellent water drag mobility, but wants solid custom dining templates.",
    source: "dashboard"
  },
  {
    id: "log2",
    clientId: "c2",
    clientName: "Marcus Vance (IMF Director)",
    trainerName: "Mike",
    sessionNumber: 3,
    totalSessionsInPackage: 10,
    date: "2026-05-30",
    notes: "Marcus expressed lumbar stiffness. Pivoted workout to core stability and heated pool aquatic decompression.",
    source: "dashboard"
  },
  {
    id: "log3",
    clientId: "c1",
    clientName: "Ambassador Elena Rostova",
    trainerName: "Martha",
    sessionNumber: 10,
    totalSessionsInPackage: 12,
    date: "2026-06-06",
    notes: "Tracked session 10. Outstanding thoracic rotation progress. Deep steam bath and spa recovery utilized afterwards.",
    source: "dashboard"
  },
  {
    id: "log4",
    clientId: "c4",
    clientName: "David Chen (UN Envoy)",
    trainerName: "Sarah",
    sessionNumber: 12,
    totalSessionsInPackage: 15,
    date: "2026-06-06",
    notes: "Completed high altitude cardio conditioning. Energy was exceptional, functional mobility looks robust.",
    source: "dashboard"
  }
];

const DEFAULT_ALERTS = [
  {
    id: "alert1",
    type: "renewal",
    severity: "critical",
    clientName: "Hana Al-Mansoor",
    clientId: "c3",
    title: "Aqua-VIP Renewal Due: 1 Session Remaining",
    description: "Hana Al-Mansoor is highly pleased with aquatic resistance results but struggles with travel nutrition. Pitch the elite Wellness & Nutritional guide track.",
    messageTemplate: "Dear Hana, outstanding session with Martha yesterday at The Aqva Club (Sheraton Addis)! You have only 1 elite aquatic resistance session left in your package. Coach Martha wants to guide you into our advanced Aquatic Resistance & Wellness track next week, fully integrated with customized hotel nutritional templates. May I secure your preferred VIP block today before rosters close? Let us know.",
    trainerName: "Martha",
    timestamp: "2026-06-05T18:00:00Z",
    dismissed: false
  },
  {
    id: "alert2",
    type: "risk",
    severity: "high",
    clientName: "Marcus Vance (IMF Director)",
    clientId: "c2",
    title: "Retention Warning: Missed 3 Sessions",
    description: "Marcus has missed 3 sessions due to diplomatic travel schedules. Send a luxury check-in to book low-impact heated pool recovery.",
    messageTemplate: "Dear Marcus, Coach Mike here from The Aqva Club (Sheraton Addis). We hope your diplomatic travels have been pleasant! Mike noticed you've missed your decompression routines this week. We know the corporate load gets intense—let's schedule a comfortable 30-minute posture decompress and muscle-release massage at our heated pool spa this weekend to completely wash off the fatigue. What time fits your local slot?",
    trainerName: "Mike",
    timestamp: "2026-06-04T12:00:00Z",
    dismissed: false
  }
];

const DEFAULT_TRAINERS = [
  { id: "t1", name: "Martha", activeClients: 2, sessionsLoggedCount: 15, renewalRate: 92 },
  { id: "t2", name: "Mike", activeClients: 1, sessionsLoggedCount: 8, renewalRate: 80 },
  { id: "t3", name: "Sarah", activeClients: 1, sessionsLoggedCount: 12, renewalRate: 88 }
];

const DEFAULT_WEBHOOK = {
  makeUrl: ""
};

interface ServerClient {
  id: string;
  name: string;
  phone: string;
  email: string;
  assignedTrainer: string;
  goal: string;
  totalSessions: number;
  completedSessions: number;
  remainingSessions: number;
  notes: string;
  status: string;
  lastActive: string;
  motivationScore?: number;
  attendanceStreak?: number;
  unmotivatedReason?: string;
  lastNudged?: string;
}

// Help structure to read and write database state safely
interface AppStore {
  clients: ServerClient[];
  logs: any[];
  alerts: any[];
  trainers: any[];
  webhook: typeof DEFAULT_WEBHOOK;
}

function loadStore(): AppStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      return {
        clients: parsed.clients || DEFAULT_CLIENTS,
        logs: parsed.logs || DEFAULT_LOGS,
        alerts: parsed.alerts || DEFAULT_ALERTS,
        trainers: parsed.trainers || DEFAULT_TRAINERS,
        webhook: parsed.webhook || DEFAULT_WEBHOOK,
      };
    }
  } catch (err) {
    console.error("Failed to load store, using defaults", err);
  }
  return {
    clients: DEFAULT_CLIENTS,
    logs: DEFAULT_LOGS,
    alerts: DEFAULT_ALERTS,
    trainers: DEFAULT_TRAINERS,
    webhook: DEFAULT_WEBHOOK,
  };
}

function saveStore(store: AppStore) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save store state", err);
  }
}

// Lazy initialization for safe, resilient model calling
let isGeminiClientHealthy = false;
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    isGeminiClientHealthy = false;
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
    isGeminiClientHealthy = true;
    return aiClient;
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI", err);
    isGeminiClientHealthy = false;
    return null;
  }
}

// Fallback AI templates to guarantee the application works beautifully offline / during testing
function generateFallbackAIAlert(
  trainerName: string,
  clientName: string,
  sessionNumber: number,
  totalSessions: number,
  notes: string
): { title: string; type: "renewal" | "risk" | "milestone" | "info"; severity: "critical" | "high" | "medium"; description: string; messageTemplate: string } {
  
  const remaining = totalSessions - sessionNumber;
  const lowerNotes = notes.toLowerCase();
  
  if (remaining <= 2 && remaining >= 0) {
    return {
      type: "renewal",
      severity: "critical",
      title: `Renewal Warning: ${remaining} sessions left`,
      description: `Client is at session ${sessionNumber} of ${totalSessions}. Immediate pitch required. Notes: "${notes}"`,
      messageTemplate: `Hey ${clientName}! Martha mentioned you had an incredible session today! 🏋️‍♂️ Since you only have ${remaining} sessions left in this package, let's keep your momentum going locked in. Next phase target is focused entirely on advanced stamina and core stability. Let me know if we should secure your spot with ${trainerName} for next month! 😊`
    };
  }

  if (lowerNotes.includes("miss") || lowerNotes.includes("busy") || lowerNotes.includes("stiff") || lowerNotes.includes("work") || lowerNotes.includes("struggle")) {
    return {
      type: "risk",
      severity: "high",
      title: `Engagement Check-in Needed`,
      description: `Client is showing signs of struggle/missing sessions. Notes: "${notes}"`,
      messageTemplate: `Hey ${clientName}! Just checking in. ${trainerName} mentioned you've had a crazy busy week but miss having you in the gym! Let's set up a quick 45-minute active reset session next time you are free to destress. What day is lookin' best?`
    };
  }

  return {
    type: "milestone",
    severity: "medium",
    title: `Milestone: Stellar Progress`,
    description: `Great progress logged. Re-enforce motivation. Notes: "${notes}"`,
    messageTemplate: `Hey ${clientName}! Incredible work on your session with ${trainerName} today! Crushing that milestone today is a huge step. Let's make sure your hydration is on point tonight and we'll see you for the next push! 💯`
  };
}

// Core API endpoints
app.get(["/api/data", "/data"], (req, res) => {
  const store = loadStore();
  const geminiAvailable = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({ ...store, geminiAvailable });
});

// Logs POST: process trainer logging, trigger AI, and save state
app.post(["/api/logs", "/logs"], async (req, res) => {
  const { trainerName, clientName, sessionNumber, noteText } = req.body;
  if (!trainerName || !clientName) {
    return res.status(400).json({ error: "Trainer Name and Client Name are required" });
  }

  const store = loadStore();

  // Find or create Client
  let client = store.clients.find(c => c.name.trim().toLowerCase() === clientName.trim().toLowerCase());
  const parsedSessionNumber = Number(sessionNumber) || 1;

  if (!client) {
    // Generate new client
    const newId = "c_" + Date.now();
    client = {
      id: newId,
      name: clientName,
      phone: "+1 (555) 000-0000",
      email: `${clientName.toLowerCase().replace(/\s+/g, "")}@example.com`,
      assignedTrainer: trainerName,
      goal: "General fitness and body composition tuning",
      totalSessions: parsedSessionNumber + 2 >= 10 ? 10 : parsedSessionNumber + 2,
      completedSessions: parsedSessionNumber,
      remainingSessions: Math.max(0, (parsedSessionNumber + 2 >= 10 ? 10 : parsedSessionNumber + 2) - parsedSessionNumber),
      notes: noteText || "Initial workout session logged.",
      status: "active",
      lastActive: new Date().toISOString().split("T")[0]
    };
    store.clients.push(client);
  } else {
    // Update existing client
    client.completedSessions = parsedSessionNumber;
    client.remainingSessions = Math.max(0, client.totalSessions - parsedSessionNumber);
    client.notes = noteText || client.notes;
    client.lastActive = new Date().toISOString().split("T")[0];
    client.assignedTrainer = trainerName; // Assign latest trainer
  }

  // Set appropriate status based on remaining sessions
  if (client.remainingSessions <= 2 && client.remainingSessions > 0) {
    client.status = "needs-renewal";
  } else if (client.remainingSessions === 0) {
    client.status = "completed";
  } else {
    client.status = "active";
  }

  // Create Log entry
  const newLogId = "log_" + Date.now();
  const sessionLog = {
    id: newLogId,
    clientId: client.id,
    clientName: client.name,
    trainerName: trainerName,
    sessionNumber: parsedSessionNumber,
    totalSessionsInPackage: client.totalSessions,
    date: new Date().toISOString().split("T")[0],
    notes: noteText || "",
    source: "dashboard" as const
  };
  store.logs.unshift(sessionLog);

  // Update trainer statistics
  let trainer = store.trainers.find(t => t.name.trim().toLowerCase() === trainerName.trim().toLowerCase());
  if (trainer) {
    trainer.sessionsLoggedCount += 1;
    // ensure active client counts reflect actual assignments
  } else {
    store.trainers.push({
      id: "t_" + Date.now(),
      name: trainerName,
      activeClients: 1,
      sessionsLoggedCount: 1,
      renewalRate: 80
    });
  }

  // Recalculate trainers active client counts
  store.trainers.forEach(t => {
    t.activeClients = store.clients.filter(c => c.assignedTrainer.trim().toLowerCase() === t.name.trim().toLowerCase() && c.status !== "completed").length;
  });

  // Now, trigger the AI analysis!
  let aiAlert;
  const gemini = getGeminiClient();

  if (gemini) {
    try {
      console.log(`Analyzing log for ${client.name} using Gemini 3.5...`);
      // Ask Gemini 3.5 to analyze the log and output custom instructions
      const prompt = `Analyze this personal training session log for a client at a gym and generate a highly persuasive sales script or client check-in outreach template.
Client Name: ${client.name}
Trainer: ${trainerName}
Session completed: ${parsedSessionNumber} of ${client.totalSessions}
Remaining: ${client.remainingSessions}
Trainer Notes: "${noteText}"

Determine the category:
- RENEWAL (if remaining sessions is <= 2): draft a highly persuasive script for the gym owner or trainer to sell them a renewal pack. Focus on their results and goals.
- RISK (if notes show struggles, busy schedule, back pains, misses, work stress, or dropping motivation): draft a supportive re-engagement message to pull them back into the gym.
- MILESTONE: If they are doing amazing, draft a high-energy motivational/celebration text thanking them.

Response Schema requirements. Return JSON strictly in this structure:
{
  "type": "renewal" | "risk" | "milestone",
  "severity": "critical" | "high" | "medium",
  "title": "Short title of the alert",
  "description": "Short explanation of the analytical reasoning",
  "messageTemplate": "The actual message script designed to be sent to them via WhatsApp or text. Write in an encouraging, friendly, local-gym vibe, highly personalized based on their notes."
}`;

      const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "Type of alert" },
              severity: { type: Type.STRING, description: "Severity indicator" },
              title: { type: Type.STRING, description: "Title of the smart alert" },
              description: { type: Type.STRING, description: "Description or reasoning for the alert" },
              messageTemplate: { type: Type.STRING, description: "The sales pitch script or check-in text" },
            },
            required: ["type", "severity", "title", "description", "messageTemplate"],
          },
        },
      });

      if (response && response.text) {
        const parsedAI = JSON.parse(response.text.trim());
        aiAlert = {
          id: "alert_" + Date.now(),
          type: parsedAI.type || "renewal",
          severity: parsedAI.severity || "high",
          clientName: client.name,
          clientId: client.id,
          title: parsedAI.title,
          description: parsedAI.description,
          messageTemplate: parsedAI.messageTemplate,
          trainerName: trainerName,
          timestamp: new Date().toISOString(),
          dismissed: false
        };
      }
    } catch (apiError) {
      console.error("Gemini API error, falling back to local heuristic analysis:", apiError);
      const fallback = generateFallbackAIAlert(trainerName, client.name, parsedSessionNumber, client.totalSessions, noteText || "");
      aiAlert = {
        id: "alert_" + Date.now(),
        ...fallback,
        clientName: client.name,
        clientId: client.id,
        trainerName: trainerName,
        timestamp: new Date().toISOString(),
        dismissed: false
      };
    }
  } else {
    // Key is missing/empty, do Heuristic Mock AI Generation
    const fallback = generateFallbackAIAlert(trainerName, client.name, parsedSessionNumber, client.totalSessions, noteText || "");
    aiAlert = {
      id: "alert_" + Date.now(),
      ...fallback,
      clientName: client.name,
      clientId: client.id,
      trainerName: trainerName,
      timestamp: new Date().toISOString(),
      dismissed: false
    };
  }

  if (aiAlert) {
    store.alerts.unshift(aiAlert);
  }

  // If a MakeUrl webhook is saved, forward this entire event to Make.com trigger in the background
  if (store.webhook && store.webhook.makeUrl) {
    try {
      console.log(`Forwarding event webhook to Make.com: ${store.webhook.makeUrl}`);
      fetch(store.webhook.makeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "session_logged",
          log: sessionLog,
          clientState: client,
          aiAlertRecommendation: aiAlert
        })
      }).catch(err => console.error("Make.com background dispatch failed to deliver", err));
    } catch (whErr) {
      console.error("Make webhook call error:", whErr);
    }
  }

  saveStore(store);
  res.json({ success: true, log: sessionLog, alert: aiAlert, client: client });
});

// Create/Edit manual Clients
app.post(["/api/clients", "/clients"], (req, res) => {
  const { id, name, phone, email, assignedTrainer, goal, totalSessions, completedSessions } = req.body;
  
  if (!name || !assignedTrainer) {
    return res.status(400).json({ error: "Client Name and Assigned Trainer are required" });
  }

  const store = loadStore();
  const total = Number(totalSessions) || 10;
  const completed = Number(completedSessions) || 0;
  const remaining = Math.max(0, total - completed);

  let status: 'active' | 'at-risk' | 'needs-renewal' | 'completed' = "active";
  if (remaining <= 2 && remaining > 0) {
    status = "needs-renewal";
  } else if (remaining === 0) {
    status = "completed";
  }

  if (id) {
    // Edit existing
    const idx = store.clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      store.clients[idx] = {
        ...store.clients[idx],
        name,
        phone: phone || store.clients[idx].phone,
        email: email || store.clients[idx].email,
        assignedTrainer,
        goal: goal || store.clients[idx].goal,
        totalSessions: total,
        completedSessions: completed,
        remainingSessions: remaining,
        status,
        lastActive: new Date().toISOString().split("T")[0]
      };
    }
  } else {
    // Create new
    const newClient = {
      id: "c_" + Date.now(),
      name,
      phone: phone || "+1 (555) 000-0000",
      email: email || `${name.toLowerCase().replace(/\s+/g, "")}@example.com`,
      assignedTrainer,
      goal: goal || "Strength and endurance tuning",
      totalSessions: total,
      completedSessions: completed,
      remainingSessions: remaining,
      notes: "Client profile created.",
      status,
      lastActive: new Date().toISOString().split("T")[0]
    };
    store.clients.push(newClient);
  }

  // Re-sync trainer counts
  store.trainers.forEach(t => {
    t.activeClients = store.clients.filter(c => c.assignedTrainer.trim().toLowerCase() === t.name.trim().toLowerCase() && c.status !== "completed").length;
  });

  saveStore(store);
  res.json({ success: true, clients: store.clients });
});

// Update Client Motivation Details
app.post(["/api/clients/motivation", "/clients/motivation"], (req, res) => {
  const { id, motivationScore, unmotivatedReason } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Client ID is required" });
  }
  const store = loadStore();
  const idx = store.clients.findIndex(c => c.id === id);
  if (idx !== -1) {
    store.clients[idx].motivationScore = typeof motivationScore !== 'undefined' ? Number(motivationScore) : store.clients[idx].motivationScore;
    store.clients[idx].unmotivatedReason = typeof unmotivatedReason !== 'undefined' ? unmotivatedReason : store.clients[idx].unmotivatedReason;
    
    // Automatically trigger alert if motivation drops to alert status
    if (store.clients[idx].motivationScore && store.clients[idx].motivationScore <= 40) {
      // Find if alert already exists to avoid duplication
      const exists = store.alerts.some(a => a.clientId === id && a.type === 'risk' && !a.dismissed);
      if (!exists) {
        store.alerts.unshift({
          id: "alert_motivation_" + Math.random().toString(36).substr(2, 9),
          type: "risk",
          severity: store.clients[idx].motivationScore && store.clients[idx].motivationScore <= 25 ? "critical" : "high",
          clientName: store.clients[idx].name,
          clientId: id,
          title: "🚨 SEVERE MOTIVATION DIP FLAGGED",
          description: `${store.clients[idx].name} is demotivated: "${store.clients[idx].unmotivatedReason || 'Attendance dropping'}"`,
          messageTemplate: `Dear ${store.clients[idx].name.split(" ")[0]}, Coach ${store.clients[idx].assignedTrainer} here from The Aqva Club at Sheraton Addis. We hope you're having an excellent week! I wanted to check in on our schedule—I know the travel/diplomatic workload is extremely heavy, but preserving 30 minutes of heated pools recovery with legendary underwater music or traditional steam bath is critical to wash away muscle fatigue. Shall we book your custom slot for tomorrow or Saturday?`,
          trainerName: store.clients[idx].assignedTrainer,
          timestamp: new Date().toISOString(),
          dismissed: false
        });
      }
    }
    
    saveStore(store);
    return res.json({ success: true, clients: store.clients, alerts: store.alerts });
  }
  res.status(404).json({ error: "Client not found" });
});

// Nudge Client
app.post(["/api/clients/nudge", "/clients/nudge"], (req, res) => {
  const { id, nudgeText } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Client ID is required" });
  }
  const store = loadStore();
  const idx = store.clients.findIndex(c => c.id === id);
  if (idx !== -1) {
    store.clients[idx].lastNudged = new Date().toISOString().split("T")[0];
    
    // Increment motivation score slightly on nudge to simulate re-engagement
    if (store.clients[idx].motivationScore && store.clients[idx].motivationScore < 100) {
       store.clients[idx].motivationScore = Math.min(100, (store.clients[idx].motivationScore || 0) + 12);
    }
    
    // Create motivation log entry
    store.logs.unshift({
      id: "log_nudge_" + Date.now(),
      clientId: id,
      clientName: store.clients[idx].name,
      trainerName: store.clients[idx].assignedTrainer,
      sessionNumber: store.clients[idx].completedSessions,
      totalSessionsInPackage: store.clients[idx].totalSessions,
      date: new Date().toISOString().split("T")[0],
      notes: `[MOTIVATION NUDGE SENT] dispatched check-in: "${nudgeText || 'General motivational boost prompt'}"`,
      source: "dashboard"
    });
    
    saveStore(store);
    return res.json({ success: true, clients: store.clients, logs: store.logs });
  }
  res.status(404).json({ error: "Client not found" });
});

// Dismiss Alert
app.post(["/api/alerts/dismiss", "/alerts/dismiss"], (req, res) => {
  const { id } = req.body;
  const store = loadStore();
  const alertIndex = store.alerts.findIndex(a => a.id === id);
  if (alertIndex !== -1) {
    store.alerts[alertIndex].dismissed = true;
    saveStore(store);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Alert not found" });
});

// Reset simulation datasets to default
app.post(["/api/reset", "/reset"], (req, res) => {
  const defaultStore = {
    clients: DEFAULT_CLIENTS,
    logs: DEFAULT_LOGS,
    alerts: DEFAULT_ALERTS,
    trainers: DEFAULT_TRAINERS,
    webhook: DEFAULT_WEBHOOK
  };
  saveStore(defaultStore);
  res.json({ success: true, ...defaultStore });
});

// Configure Make Webhook
app.post(["/api/webhook-config", "/webhook-config"], (req, res) => {
  const { makeUrl } = req.body;
  const store = loadStore();
  store.webhook = { makeUrl: makeUrl || "" };
  saveStore(store);
  res.json({ success: true, webhook: store.webhook });
});

// Trigger all-client sales optimization sweep using Gemini
app.post(["/api/alerts/sweep", "/alerts/sweep"], async (req, res) => {
  const store = loadStore();
  const gemini = getGeminiClient();

  if (!gemini) {
    return res.json({
      success: false,
      message: "Gemini API key is not configured. Sweep cannot run on real AI. Please configure secrets or use manual logger."
    });
  }

  try {
    const activeClientsSummary = store.clients
      .filter(c => c.status !== "completed")
      .map(c => `- ${c.name} (Assigned to ${c.assignedTrainer}): Session ${c.completedSessions} of ${c.totalSessions}. Goal: "${c.goal}". Notes: "${c.notes}"`)
      .join("\n");

    const prompt = `You are a growth consultant for a personal training gym. Sweep the client list and generate high-priority sales or retention alert recommendations.
Active Clients Status:
${activeClientsSummary}

Pick up to 2 clients who currently require critical follow-up or renewal outreach and generate professional alerts for the gym manager.
Return JSON strictly structured as an array of alerts:
[
  {
    "type": "renewal" | "risk",
    "severity": "critical" | "high",
    "clientName": "Client exact name",
    "assignedTrainer": "Trainer name",
    "title": "Follow up header",
    "description": "Business reason to follow up",
    "messageTemplate": "Friendly copy-paste WhatsApp outreach text ready to send. Start with warm vibe and tie back directly to their custom goal."
  }
]`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              severity: { type: Type.STRING },
              clientName: { type: Type.STRING },
              assignedTrainer: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              messageTemplate: { type: Type.STRING },
            },
            required: ["type", "severity", "clientName", "assignedTrainer", "title", "description", "messageTemplate"],
          }
        },
      },
    });

    if (response && response.text) {
      const parsedAlerts = JSON.parse(response.text.trim());
      parsedAlerts.forEach((a: any) => {
        const clientObj = store.clients.find(c => c.name.toLowerCase() === a.clientName.toLowerCase());
        store.alerts.unshift({
          id: "alert_sweep_" + Math.random().toString(36).substr(2, 9),
          type: a.type || "renewal",
          severity: a.severity || "high",
          clientName: a.clientName,
          clientId: clientObj ? clientObj.id : "unknown",
          title: a.title,
          description: a.description,
          messageTemplate: a.messageTemplate,
          trainerName: a.assignedTrainer || "Staff",
          timestamp: new Date().toISOString(),
          dismissed: false
        });
      });
      saveStore(store);
      return res.json({ success: true, count: parsedAlerts.length, alerts: store.alerts });
    }
  } catch (error) {
    console.error("Sweep generation failed", error);
    return res.status(500).json({ error: "Failed to compile automated audit sweep." });
  }

  res.json({ success: false, message: "No strategic targets identified or format mismatch." });
});

// Interactive AI Gym Growth Advisor Chat Route
app.post(["/api/chat", "/chat"], async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const store = loadStore();
  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const gemini = getGeminiClient();

  if (gemini) {
    try {
      const activeClientsDetail = store.clients.map(c => 
        `- name: ${c.name}, Status: ${c.status}, Assigned: Coach ${c.assignedTrainer}, Done: ${c.completedSessions}/${c.totalSessions} sessions. Goal: ${c.goal}, Last active: ${c.lastActive}, Notes: "${c.notes}"`
      ).join("\n");

      const trainersDetail = store.trainers.map(t => 
        `- name: Coach ${t.name}, Active clients: ${t.activeClients}, Sessions logged: ${t.sessionsLoggedCount}, Renewal Rate: ${t.renewalRate}%`
      ).join("\n");

      const activeAlertsDetail = store.alerts.filter(a => !a.dismissed).map(a => 
        `- Type: ${a.type}, Client: ${a.clientName}, Issue: ${a.title}, Summary: ${a.description}`
      ).join("\n");

      const systemPrompt = `You are "Sheraton Addis Gym Advisor", an elite cognitive hospitality and wellness consultant embedded in "The Aqva Club at Sheraton Addis" (located at the Sheraton Addis Luxury Collection Hotel, Taitu Street, Addis Ababa). The club features a state-of-the-art wellness pavilion containing three heated outdoor swimming pools with legendary underwater music, elite TechnoGym & Life Fitness setups, a luxurious traditional sauna, steam baths, and VIP privacy-first message suites.

Your goal is to help the gym managers and coaches optimize personal training (PT) retention, re-engage high-profile diplomats, ambassadors, and international executives, and automate high-end VIP outreach scripts with hotel-grade hospitality standards.

Use the details of The Aqva Club at Sheraton Addis (heated pool with underwater music, premium TechnoGym/Life Fitness, diplomatic safe, privacy protocols) to enrich all tactical fitness and sales ideas:

=== MEMBER DATABASE ===
${activeClientsDetail}

=== PT COACH ROSTER ===
${trainersDetail}

=== UNRESOLVED SMART ALERTS ===
${activeAlertsDetail}

=== HOW YOU TALK ===
- State that you are speaking from The Aqva Club at Sheraton Addis.
- Speak with incredible high-end premium clarity, energy, and intelligence.
- Keep responses relatively brief, highly structured, actionable, and ready to send.
- If they ask for outreach text scripts, format professional yet charismatic WhatsApp messages for Addis Ababa's elite clientele. Include local concierge context (e.g., "active recovery on our TechnoGym deck", "swimming sessions with underwater music", "exclusive VIP slot reservation") and custom references to their goal (e.g., postural correction, aquatic therapy, endurance).
- Keep everything completely realistic and aligned with elite luxury hotel-service standards.`;

      const contentPrompt = `${systemPrompt}\n\nClient conversation history:\n${messages.map(m => `${m.role === "user" ? "Gym Manager" : "AI Advisor"}: ${m.content}`).join("\n")}\n\nAI Advisor:`;

      const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentPrompt,
      });

      if (response && response.text) {
        return res.json({ success: true, text: response.text });
      }
    } catch (chatError) {
      console.error("Gemini Chat failed, falling back to rule reasoning:", chatError);
    }
  }

  // Smart Heuristic NLP matching for offline/API-key inactive environments
  const query = lastUserMessage.toLowerCase();
  let text = "";

  if (query.includes("who is at risk") || query.includes("at-risk") || query.includes("churn") || query.includes("risk")) {
    const riskClients = store.clients.filter(c => c.status === "at-risk");
    if (riskClients.length > 0) {
      text = `## At-Risk Luxury Members at The Aqva Club (Sheraton Addis):\n\n` + riskClients.map(c => `* **${c.name}** is flagged under **Coach ${c.assignedTrainer}** due to missed schedules at Taitu Street. Notes: _"${c.notes}"_`).join("\n") + 
      `\n\n**Supportive Luxury Outreach text to re-engage them:**\n\n_"Dear Marcus! Hope you are traveling safely. Mike here from The Aqva Club at Sheraton Addis. We missed your presence on our luxury TechnoGym deck this week! We completely understand your high diplomatic load—let's schedule a relaxing 30-minute lumbar decompress & active pools recovery followed by quiet spa time this weekend. What slow hours fit your slots?"_`;
    } else {
      text = `Outstanding performance! Standard KPI check shows all luxury members are active on the club floor or heated pool here at Sheraton Addis. There are zero critical churn risk alerts today.`;
    }
  } else if (query.includes("renewal") || query.includes("expire") || query.includes("needs renewal") || query.includes("sessions left") || query.includes("renew")) {
    const expiredClients = store.clients.filter(c => c.status === "needs-renewal" || c.status === "completed");
    text = `## Pending Platinum Renewals at Aqva Club (Sheraton Addis):\n\n` + expiredClients.map(c => `* **${c.name}** has only **${c.remainingSessions} premium sessions remaining** under **Coach ${c.assignedTrainer}**.`).join("\n") + 
    `\n\n**HIGH-CONVERTING ELITE RENEWAL PITCH:**\n_"Dear Hana! Martha here from The Aqva Club at Sheraton Addis. Super proud of how you dominated the aquatic resistance pool session yesterday! Since you have only 1 key session left, let's keep that momentum locked in. I'm securing slots for next week's group—let's renew your 12-session elite routine today so we don't lose your dedicated hour. Shall I put you down?"_`;
  } else if (query.includes("coaches") || query.includes("trainer") || query.includes("performance") || query.includes("martha") || query.includes("mike") || query.includes("sarah")) {
    text = `### The Aqva Club Training Audit:\n\n` + store.trainers.map(t => `* **Coach ${t.name}**: Guiding **${t.activeClients} active VIP members** with an average renewal tracking rate of **${t.renewalRate}%** utilizing TechnoGym tools.`).join("\n");
  } else if (query.includes("elena") || query.includes("rostova") || query.includes("ambassador")) {
    const c = store.clients.find(x => x.name.toLowerCase().includes("elena"));
    if (c) {
      text = `**Premium Client Profile: Ambassador Elena Rostova**\n- **Completed sessions:** ${c.completedSessions} of ${c.totalSessions} (${c.remainingSessions} remaining - RENEWAL DUE)\n- **Assigned Coach:** Coach Martha\n- **Target Fitness Goal:** ${c.goal}\n- **Latest note:** ${c.notes}\n\n**Action Plan:** Martha should pitch her our VIP wellness blueprint at Taitu Street featuring customized massage and steam recovery perks to supplement her postural correction exercises.`;
    } else {
      text = `Elena is down to her final 2 sessions. Direct Coach Martha to pitch her the VIP Package renewal tomorrow during quiet hours!`;
    }
  } else if (query.includes("hana") || query.includes("al-mansoor") || query.includes("mansoor")) {
    text = `**Premium Client Profile: Hana Al-Mansoor**\n- **Completed sessions:** 9 of 10 (1 remaining - IMMEDIATE RENEWAL)\n- **Assigned Coach:** Coach Martha\n- **Target Fitness Goal:** Aquatic resistance and deep muscle definition at the heated pool\n- **Latest note:** Loving the underwater music and aquatic exercises but struggling with flight schedules.\n\n**Action Plan:** Pitch her the premium 12-session Elite Package renewal with integrated wellness massage and custom macro setup tomorrow.`;
  } else if (query.includes("aqva") || query.includes("sheraton") || query.includes("addis") || query.includes("hotel") || query.includes("club") || query.includes("taitu")) {
    text = `### 🌟 The Aqva Club at Sheraton Addis Elite Training Intel
- **Premium Location**: Sheraton Addis Resort, Taitu Street, Kirkos, Addis Ababa.
- **Flagship Equipment**: Premium TechnoGym & Life Fitness Elite range.
- **Landmark Feature**: Three heated outdoor swimming pools with underwater music (signature attraction).
- **Market Positioning**: Luxury, Diplomat-safe, Privacy-first luxury health club.
- **PT Growth Engine**: Leverage high-touch personalized check-ins, custom tracking, and direct WhatsApp scripts to ensure a **90%+ PT renewal rate** on premium packages!`;
  } else {
    text = `### 🌟 Welcome to The Aqva Club at Sheraton Addis VIP Advisor!
I have real-time access to the **Member Roster**, **Trainer Performance Logs**, and the premium **TechnoGym metrics** at Taitu Street. 

**Try asking me customized business growth questions like:**
* 📉 _"Who is currently at-risk of canceling their membership?"_
* 🚨 _"Show me everyone who has a renewal package due soon."_
* 🏋️‍♂️ _"How is Coach Martha performing this week on renewals?"_
* 📩 _"Draft a highly persuasive WhatsApp script for Ambassador Elena Rostova mentioning The Aqva Club."_
* 🇪🇹 _"Tell me more about The Aqva Club's elite positioning at the Sheraton Addis Hotel."_`;
  }

  res.json({ success: true, text });
});

// Serve compiled static layout in production or Vite in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Trainer Dashboard server booted on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
