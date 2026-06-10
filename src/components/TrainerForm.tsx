/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClipboardList, Radio, Compass, AlertCircle, ArrowRight, CornerDownRight } from "lucide-react";
import { Client } from "../types";

interface TrainerFormProps {
  clients: Client[];
  trainers: { id: string; name: string }[];
  onLogSubmit: (data: {
    trainerName: string;
    clientName: string;
    sessionNumber: number;
    noteText: string;
  }) => Promise<{ success: boolean; alert: any; client: any }>;
}

export default function TrainerForm({ clients, trainers, onLogSubmit }: TrainerFormProps) {
  const [trainerName, setTrainerName] = useState("");
  const [customTrainer, setCustomTrainer] = useState("");
  const [clientSelection, setClientSelection] = useState("existing");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [customClientName, setCustomClientName] = useState("");
  const [sessionNumber, setSessionNumber] = useState(1);
  const [noteText, setNoteText] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  const activeClients = clients.filter(c => c.status !== "completed");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTrainer = trainerName === "custom" ? customTrainer.trim() : trainerName;
    const finalClient = clientSelection === "existing" 
      ? clients.find(c => c.id === selectedClientId)?.name || "" 
      : customClientName.trim();

    if (!finalTrainer) {
      alert("Please specify a trainer name");
      return;
    }
    if (!finalClient) {
      alert("Please specify or select a client");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onLogSubmit({
        trainerName: finalTrainer,
        clientName: finalClient,
        sessionNumber,
        noteText: noteText.trim()
      });
      if (res.success) {
        setGeneratedResult(res);
        setIsSuccess(true);
        setNoteText("");
        setSessionNumber(1);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit trainer log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setIsSuccess(false);
    setGeneratedResult(null);
  };

  const activeSelectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="max-w-xl mx-auto concrete-grain bg-[#0D0D0D] border-2 border-white p-6 md:p-8" id="trainer-floor-logger">
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="form-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Form Title in Brutalist Style */}
            <div className="border-b-2 border-white/20 pb-5 flex items-start justify-between">
              <div>
                <span className="text-xs text-acid-lime font-mono font-bold tracking-widest block mb-1">
                  SEC // LOG_09
                </span>
                <h2 className="text-xl md:text-2xl font-grotesque font-extrabold uppercase text-white tracking-tighter leading-none">
                  TRAINER FLOOR LOGGER
                </h2>
              </div>
              <div className="px-2 py-1 bg-acid-lime text-black font-mono font-bold text-[9px] uppercase tracking-wider">
                RAW_LOG_MODE
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              {/* Trainer Identification */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    [01] SELECT OPERATOR
                  </label>
                  <span className="text-[10px] text-white/40 font-mono">CODE: AUTH_TRAINER</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {trainers.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTrainerName(t.name);
                        setCustomTrainer("");
                      }}
                      className={`py-3.5 px-3 text-xs font-mono font-bold uppercase transition-all tracking-wider border cursor-pointer ${
                        trainerName === t.name
                          ? "bg-acid-lime text-black border-acid-lime"
                          : "border-white/20 text-white/60 bg-transparent hover:bg-white hover:text-black hover:border-white"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTrainerName("custom")}
                    className={`py-3.5 px-2 text-xs font-mono font-bold uppercase transition-all tracking-wider border cursor-pointer ${
                      trainerName === "custom"
                        ? "bg-acid-lime text-black border-acid-lime"
                        : "border-white/20 text-white/60 bg-transparent hover:bg-white hover:text-black hover:border-white"
                    }`}
                  >
                    + OTHER
                  </button>
                </div>

                {trainerName === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-2"
                  >
                    <input
                      type="text"
                      required
                      placeholder="ENTER OPERATOR ID/NAME..."
                      value={customTrainer}
                      onChange={(e) => setCustomTrainer(e.target.value)}
                      className="w-full text-xs font-mono font-semibold px-4 py-3 bg-[#111111] text-white uppercase placeholder-white/30 border border-white/40 focus:outline-none focus:border-acid-lime focus:ring-1 focus:ring-acid-lime"
                    />
                  </motion.div>
                )}
              </div>

              {/* Client Selection Toggle */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    [02] TARGET SUBJECT
                  </label>
                  <div className="flex border border-white/20 bg-black text-xs">
                    <button
                      type="button"
                      onClick={() => setClientSelection("existing")}
                      className={`text-[9px] uppercase font-mono font-bold tracking-widest px-3 py-1 cursor-pointer transition-all ${
                        clientSelection === "existing"
                          ? "bg-white text-black font-extrabold"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      ROSTER
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientSelection("new")}
                      className={`text-[9px] uppercase font-mono font-bold tracking-widest px-3 py-1 cursor-pointer transition-all ${
                        clientSelection === "new"
                          ? "bg-white text-black font-extrabold"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      NEW_SUBJECT
                    </button>
                  </div>
                </div>

                {clientSelection === "existing" ? (
                  <div className="relative">
                    <select
                      required
                      value={selectedClientId}
                      onChange={(e) => {
                        setSelectedClientId(e.target.value);
                        const matchingClient = clients.find(c => c.id === e.target.value);
                        if (matchingClient) {
                          setSessionNumber(Math.min(matchingClient.totalSessions, matchingClient.completedSessions + 1));
                        }
                      }}
                      className="w-full text-xs font-mono font-bold uppercase py-3.5 px-4 bg-[#111111] text-white border border-white/20 focus:outline-none focus:border-acid-lime focus:ring-1 focus:ring-acid-lime cursor-pointer appearance-none"
                    >
                      <option value="" disabled className="text-white/35 bg-[#0D0D0D]">-- CHOOSE ACTIVE SUBJECT --</option>
                      {activeClients.map(c => (
                        <option key={c.id} value={c.id} className="text-white bg-[#171717]">
                          {c.name.toUpperCase()} (COACH {c.assignedTrainer.toUpperCase()}) / SESS {c.completedSessions}_{c.totalSessions}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-mono text-[9px]">
                      [▼]
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="ENTER FULL NAME OF CLIENT..."
                    value={customClientName}
                    onChange={(e) => setCustomClientName(e.target.value)}
                    className="w-full text-xs font-mono font-semibold px-4 py-3.5 bg-[#111111] text-white uppercase placeholder-white/30 border border-white/20 focus:outline-none focus:border-acid-lime"
                  />
                )}
              </div>

              {/* Work Session Counts */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
                  [03] INCREMENTAL PACKAGE PROGRESS
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border border-white/20 p-4 bg-black/80">
                  <div className="text-[11px] font-mono text-white/60 mb-2 sm:mb-0">
                    {clientSelection === "existing" && activeSelectedClient ? (
                      <div>
                        SUBJECT PACKAGE STATUS:{" "}
                        <span className="text-white font-bold font-sans">
                          {activeSelectedClient.completedSessions} / {activeSelectedClient.totalSessions} DONE
                        </span>
                        <div className="text-acid-lime font-bold mt-1 uppercase">
                          ➔ RECORDING INCREMENTAL SESSION {sessionNumber}
                        </div>
                      </div>
                    ) : (
                      <div>
                        FIRST MILESTONE PIPELINE STATUS:
                        <div className="text-acid-lime font-bold mt-1 uppercase">
                          ➔ RECORDING TARGET MODULE {sessionNumber} completed (Est. 10 Total)
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    <button
                      type="button"
                      disabled={sessionNumber <= 1}
                      onClick={() => setSessionNumber(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 bg-[#171717] border border-white/20 flex items-center justify-center text-white font-mono font-bold hover:bg-white hover:text-black hover:border-white disabled:opacity-25 transition-all text-sm cursor-pointer"
                    >
                      [- ]
                    </button>
                    <span className="text-lg font-mono font-bold text-acid-lime w-10 text-center">
                      {String(sessionNumber).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      disabled={clientSelection === "existing" && activeSelectedClient && sessionNumber >= activeSelectedClient.totalSessions}
                      onClick={() => setSessionNumber(prev => prev + 1)}
                      className="w-10 h-10 bg-[#171717] border border-white/20 flex items-center justify-center text-white font-mono font-bold hover:bg-white hover:text-black hover:border-white disabled:opacity-25 transition-all text-sm cursor-pointer"
                    >
                      [+]
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Summary Notes */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    [04] TARGET BIO-METRIC & RECOVERY SUMMARY
                  </label>
                  <span className="text-[10px] text-white/40 font-mono">RAW_RECORDS_MANDATORY</span>
                </div>
                
                <textarea
                  required
                  rows={4}
                  placeholder="SPECIFY: LIFT PROGRESSION / NUTRITION COMPLIANCE / CHURN RISKS / FATIGUE RATINGS..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full text-xs font-mono font-semibold p-4 bg-[#111111] text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-acid-lime leading-relaxed"
                />

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNoteText(prev => (prev + " Highly motivated today. Highlighted chest/shoulder torque. Slight tightness reports. Diet score holds 85%.").trim())}
                    className="py-1.5 px-3 text-[10px] font-mono text-white/50 border border-white/10 bg-[#171717] hover:border-acid-lime hover:text-acid-lime transition-all cursor-pointer uppercase"
                  >
                    + COMPLIANCE HIGH
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteText(prev => (prev + " Fatigued from travel work. Spine stiff. Weekend macro diet slipped under high social stress. Back rehab priority.").trim())}
                    className="py-1.5 px-3 text-[10px] font-mono text-white/50 border border-white/10 bg-[#171717] hover:border-acid-lime hover:text-acid-lime transition-all cursor-pointer uppercase"
                  >
                    + TRAVEL_STRESS / BACK STIFF
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-acid-lime text-black font-mono font-bold text-xs uppercase tracking-widest transition-all hover-invert-brutal border border-acid-lime cursor-pointer flex items-center justify-center space-x-3.5"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>COMPILING SESS_ANALYTICS...</span>
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-4 h-4 text-black" />
                    <span>TRANSMIT WORKOUT RECORDS & SYNC</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6 space-y-6"
          >
            <div className="w-16 h-16 bg-acid-lime/10 text-acid-lime border border-acid-lime/20 flex items-center justify-center mx-auto">
              <CornerDownRight className="w-8 h-8 text-acid-lime" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-grotesque font-extrabold text-white uppercase tracking-tighter">[TRANSMISSION COMPLETE]</h2>
              <p className="text-xs font-mono text-white/50 max-w-sm mx-auto">
                LOG SUCCESSFULLY PARSED ON SERVER DATABASE AND PROCESSED BY THE INTELLIGENCE SYSTEM.
              </p>
            </div>

            {generatedResult?.alert && (
              <div className="border border-white/20 bg-black p-4 text-left font-mono">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <span className="text-[9px] font-extrabold uppercase bg-acid-lime text-black px-1.5 py-0.5">
                    AI RESOLVED RENEWAL_ACTION
                  </span>
                  <span className="text-[10px] text-white/40">
                    SESS_{sessionNumber} SUCCESS
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white uppercase mb-1">{generatedResult.alert.title}</h4>
                <p className="text-xs text-white/60 mb-4 font-sans leading-relaxed">{generatedResult.alert.description}</p>
                
                {/* Visual prompt script */}
                <div className="bg-[#111111] p-3 border border-white/10 space-y-2.5">
                  <div className="text-[9px] uppercase font-bold text-acid-lime tracking-wider">[PITCH SPECIMEN SCRIPT]:</div>
                  <div className="text-[11px] text-white/80 leading-relaxed font-mono font-medium italic">
                    "{generatedResult.alert.messageTemplate}"
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleResetForm}
              type="button"
              className="py-3 px-6 bg-white text-black text-xs font-mono font-bold uppercase hover:bg-acid-lime hover:text-black transition-all cursor-pointer"
            >
              [ LOG REPETITION_SESSION ]
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
