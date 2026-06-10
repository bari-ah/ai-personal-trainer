/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Client {
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
  status: 'active' | 'at-risk' | 'needs-renewal' | 'completed';
  lastActive: string;
  motivationScore?: number;
  attendanceStreak?: number;
  unmotivatedReason?: string;
  lastNudged?: string;
}

export interface SessionLog {
  id: string;
  clientId: string;
  clientName: string;
  trainerName: string;
  sessionNumber: number;
  totalSessionsInPackage: number;
  date: string;
  notes: string;
  source: 'form' | 'dashboard';
}

export interface SmartAlert {
  id: string;
  type: 'renewal' | 'risk' | 'milestone' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  clientName: string;
  clientId: string;
  title: string;
  description: string;
  messageTemplate: string; // The AI-generated sales scripts / check-in message
  trainerName: string;
  timestamp: string;
  dismissed: boolean;
}

export interface Trainer {
  id: string;
  name: string;
  activeClients: number;
  sessionsLoggedCount: number;
  renewalRate: number; // e.g. 85 for 85%
}

export interface WebhookConfig {
  makeUrl: string;
}
