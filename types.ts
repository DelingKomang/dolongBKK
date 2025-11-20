
import type { LucideIcon } from 'lucide-react';

export interface SidebarMenuItem {
  name: string;
  icon: LucideIcon;
}

export interface MonthlyData {
  name: string;
  penerimaan: number;
  realisasi: number;
}

export interface CategoryData {
  name: string;
  value: number;
  // FIX: Add index signature to satisfy recharts' generic object type for chart data.
  [key: string]: any;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Penerimaan' | 'Realisasi';
  category: string;
}

export interface SummaryData {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
}

export interface BkuData {
  id: string;
  tanggal: string;
  kode: string;
  uraian: string;
  kategori: string; // Added field
  penerimaan: number;
  pengeluaran: number;
  saldo: number;
}

export interface BkpData {
  id: string;
  tanggal: string;
  bukti: string;
  uraian: string;
  kategori: string; 
  debet: number; // Penerimaan
  kredit: number; // Pengeluaran
  saldo: number;
}

// Aliases for compatibility with Rekonsiliasi component
export type BkuTransaction = BkuData;
export type BkpTransaction = BkpData;

export interface JuDisplayRow {
  rowId: string;
  idTransaksi?: string;
  date?: string;
  kodeRekening?: string;
  uraian: string;
  debet: number;
  kredit: number;
  rowType: 'debet' | 'kredit' | 'memo';
}

export interface BudgetItem {
  id: string;
  kode: string;
  uraian: string;
  jumlah: number;
  type: 'pendapatan' | 'belanja';
}
