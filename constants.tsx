
import React from 'react';
import type { SidebarMenuItem } from './types';
import { LayoutDashboard, Book, BookCopy, FileText, BarChart2, Repeat, FileCheck2, ClipboardList, BookOpen, Calculator } from 'lucide-react';

export const SIDEBAR_MENU: SidebarMenuItem[] = [
  { name: 'Anggaran', icon: Calculator },
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Buku Besar', icon: BookOpen },
  { name: 'Buku Kas Umum', icon: Book },
  { name: 'Buku Kas Pembantu', icon: BookCopy },
  { name: 'Jurnal Umum', icon: ClipboardList },
  { name: 'Saldo Akhir', icon: BarChart2 },
  { name: 'Rekonsiliasi', icon: Repeat },
  { name: 'Laporan Rekonsiliasi Akhir', icon: FileCheck2 },
];

// Standard Reference for Village Account Codes
export const REFERENSI_REKENING = [
    { code: '022.22.1', name: 'Hibah Tahap I' },
    { code: '022.22.2', name: 'Hibah Tahap II' },
    { code: '022.22.3', name: 'Hibah Tahap III' },
    { code: '1.1.1', name: 'Insentif' },
    { code: '1.1.2', name: 'Konsumsi Paruman' },
    { code: '1.1.3', name: 'ATK, Materai, Fotocopy' },
    { code: '1.1.4', name: 'Perkara Adat' },
    { code: '1.1.5', name: 'Awig2/Perarem' },
    { code: '1.1.6', name: 'Internet' },
    { code: '1.1.7', name: 'Uang Saku & Transport' },
    { code: '1.1.8', name: 'BPJS' },
    { code: '1.1.9', name: 'Pecalang' },
    { code: '1.1.10', name: 'Operasional lainnya' },
    { code: '2.1.1', name: 'Perlindungan Pra, Pratima.' },
    { code: '2.1.2', name: 'Upakara' },
    { code: '2.1.3', name: 'Persembahyangan/MuspaBersama' },
    { code: '2.1.4', name: 'Pembangunan/penataan Pura Kahyangan Tiga' },
    { code: '2.1.5', name: 'Sarana Penunjang Pura' },
    { code: '2.1.6', name: 'Parhyangan Lainnya' },
    { code: '3.1.1', name: 'Pasraman' },
    { code: '3.1.2', name: 'Seni Wali, bebali, Tradisi' },
    { code: '3.1.3', name: 'Sekaa Sebunan' },
    { code: '3.1.4', name: 'Pesantian' },
    { code: '3.1.5', name: 'Bulan Bahasa, Sastra dan Aksara' },
    { code: '3.1.6', name: 'SIPANDU' },
    { code: '3.1.7', name: 'Kapasitas Pemangku/Serati/Pecalang dll' },
    { code: '3.1.8', name: 'Sarana Pemangku,serati,pecalang dll' },
    { code: '3.1.9', name: 'Keprajuruan MDA' },
    { code: '3.1.10', name: 'Kapasitas SDM adat di PT' },
    { code: '3.1.11', name: 'Pawongan Lainnya' },
    { code: '4.1.1', name: 'Wantilan Desa' },
    { code: '4.1.2', name: 'Palemahan Wewidangan desa' },
    { code: '4.1.3', name: 'Pengelolaan Sampah' },
    { code: '4.1.4', name: 'Pelindungan Danau, Sungai, Mata Air' },
    { code: '4.1.5', name: 'Setra desa' },
    { code: '4.1.6', name: 'BUPDA' },
    { code: '4.1.7', name: 'Labda Pacingkreman Desa (LPD)' },
    { code: '4.1.8', name: 'Palemahan Lainnya' },
    { code: '6.1.1.01', name: 'Penerimaan Pembiayaan (SILPA)' },
    { code: '6.2.1.01', name: 'Pengeluaran Pembiayaan' }
];
