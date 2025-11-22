
import React, { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import PlaceholderPage from './pages/PlaceholderPage';
import SplashScreen from './pages/SplashScreen';
import DisclaimerPage from './pages/DisclaimerPage';
import BukuKasUmum from './pages/BukuKasUmum';
import BukuKasPembantu from './pages/BukuKasPembantu';
import JurnalUmum from './pages/JurnalUmum';
import BukuBesar from './pages/BukuBesar';
import Rekonsiliasi from './pages/Rekonsiliasi';
import LaporanRekonsiliasiAkhir from './pages/LaporanRekonsiliasiAkhir';
import SaldoAkhir from './pages/SaldoAkhir';
import Anggaran from './pages/Anggaran';
import { SIDEBAR_MENU } from './constants';
import { getInitialBkuData, getInitialBkpData, getInitialJuData, getInitialBudgetItems } from './hooks/useMockData';
import type { BkuData, BkpData, JuDisplayRow, BudgetItem } from './types';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<string>(SIDEBAR_MENU[0].name);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false);
  
  // BKU State Management
  const [bkuData, setBkuData] = useState<BkuData[]>(() => getInitialBkuData());

  // BKP State Management
  const [bkpData, setBkpData] = useState<BkpData[]>(() => getInitialBkpData());

  // Jurnal Umum State Management
  const [juData, setJuData] = useState<JuDisplayRow[]>(() => getInitialJuData());

  // Budget Items State Management
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() => getInitialBudgetItems());

  // Saldo Akhir State Management
  const [saldoAwal, setSaldoAwal] = useState<number>(0);
  const [penyetoranPajak, setPenyetoranPajak] = useState<number>(0);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  
  const handleLogin = async (email: string, password: string) => {
    // Simulate API Call
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            if(email && password) {
                setIsLoggedIn(true);
                resolve();
            } else {
                reject(new Error("Kredensial tidak valid"));
            }
        }, 1500);
    });
  };

  const handleRegister = async (email: string, password: string) => {
      // Simulate API Call
      return new Promise<void>((resolve) => {
          setTimeout(() => {
              // For demo, just resolve successfully. User still needs to login.
              resolve();
          }, 1500);
      });
  };
  
  // --- HELPER: Generate Jurnal Umum Rows ---
  const generateJuRows = (transaction: Omit<BkuData, 'id' | 'saldo'> | BkuData): JuDisplayRow[] => {
      const date = new Date(transaction.tanggal);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const KODE_KAS = '1.1.1.01'; // Default Cash Account Code
      const URAIAN_KAS = 'Kas di Bendahara Desa';

      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const juId = `JU-${month}${day}-${randomSuffix}`;

      if (transaction.penerimaan > 0) {
          // Logic Penerimaan: Debet Kas, Kredit Pendapatan
          return [
              {
                  rowId: `${juId}-1`,
                  idTransaksi: juId,
                  date: transaction.tanggal,
                  kodeRekening: KODE_KAS,
                  uraian: URAIAN_KAS,
                  debet: transaction.penerimaan,
                  kredit: 0,
                  rowType: 'debet'
              },
              {
                  rowId: `${juId}-2`,
                  idTransaksi: juId,
                  kodeRekening: transaction.kode,
                  uraian: transaction.uraian,
                  debet: 0,
                  kredit: transaction.penerimaan,
                  rowType: 'kredit'
              },
              {
                  rowId: `${juId}-3`,
                  idTransaksi: juId,
                  uraian: `(Posting Otomatis: ${transaction.uraian})`,
                  debet: 0,
                  kredit: 0,
                  rowType: 'memo'
              }
          ];
      } else {
          // Logic Pengeluaran: Debet Belanja, Kredit Kas
          return [
              {
                  rowId: `${juId}-1`,
                  idTransaksi: juId,
                  date: transaction.tanggal,
                  kodeRekening: transaction.kode,
                  uraian: transaction.uraian,
                  debet: transaction.pengeluaran,
                  kredit: 0,
                  rowType: 'debet'
              },
              {
                  rowId: `${juId}-2`,
                  idTransaksi: juId,
                  kodeRekening: KODE_KAS,
                  uraian: URAIAN_KAS,
                  debet: 0,
                  kredit: transaction.pengeluaran,
                  rowType: 'kredit'
              },
              {
                  rowId: `${juId}-3`,
                  idTransaksi: juId,
                  uraian: `(Posting Otomatis: ${transaction.uraian})`,
                  debet: 0,
                  kredit: 0,
                  rowType: 'memo'
              }
          ];
      }
  };

  // --- BKU LOGIC ---
  const recalculateBkuSaldo = (data: Omit<BkuData, 'saldo'>[]): BkuData[] => {
      const sortedData = [...data].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
      let runningBalance = 0;
      return sortedData.map(item => {
          runningBalance += item.penerimaan - item.pengeluaran;
          return { ...item, saldo: runningBalance };
      });
  };

  const handleBkuDelete = (id: string) => {
      setBkuData(prevData => {
        const updatedData = prevData.filter(item => item.id !== id);
        return recalculateBkuSaldo(updatedData);
      });
  };

  const handleBkuSubmit = (formData: Omit<BkuData, 'id' | 'saldo'>, id?: string) => {
      setBkuData(prevData => {
        let updatedData;
        if (id) {
            updatedData = prevData.map(item => item.id === id ? { ...item, ...formData } : item);
        } else {
            // Use random suffix to prevent ID collisions during rapid adds
            const newEntry = { ...formData, id: `bku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
            updatedData = [...prevData, newEntry];
        }
        return recalculateBkuSaldo(updatedData);
      });

      // --- AUTOMATION: POST TO JURNAL UMUM ---
      // Only automate for NEW transactions to avoid duplicating journals on edits
      if (!id) {
          const newJuRows = generateJuRows(formData);
          setJuData(prevJu => [...prevJu, ...newJuRows]);
      }
  };

  const handleBkuReplace = (newData: BkuData[]) => {
      const calculatedData = recalculateBkuSaldo(newData);
      setBkuData(calculatedData);
      
      // Generate JU for all imported items
      // We assume a replace action clears existing JU derived from BKU and repopulates it
      const allNewJuRows = calculatedData.flatMap(item => generateJuRows(item));
      setJuData(allNewJuRows);
  };

  // --- BKP LOGIC ---
  const recalculateBkpSaldo = (data: Omit<BkpData, 'saldo'>[]): BkpData[] => {
      const sortedData = [...data].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
      let runningBalance = 0;
      return sortedData.map(item => {
          runningBalance += item.debet - item.kredit;
          return { ...item, saldo: runningBalance };
      });
  };

  const handleBkpDelete = (id: string) => {
      setBkpData(prevData => {
          const updatedData = prevData.filter(item => item.id !== id);
          return recalculateBkpSaldo(updatedData);
      });
  };

  const handleBkpSubmit = (formData: Omit<BkpData, 'id' | 'saldo'>, id?: string) => {
      setBkpData(prevData => {
          let updatedData;
          if (id) {
              updatedData = prevData.map(item => item.id === id ? { ...item, ...formData } : item);
          } else {
              // Use random suffix to prevent ID collisions during loop insertions (like from Nota)
              const newEntry = { ...formData, id: `bkp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
              updatedData = [...prevData, newEntry];
          }
          return recalculateBkpSaldo(updatedData);
      });
  };

  const handleBkpReplace = (newData: BkpData[]) => {
      setBkpData(recalculateBkpSaldo(newData));
  };


  const renderPage = () => {
    switch (activePage) {
      case 'Anggaran':
        return <Anggaran 
                  budgetItems={budgetItems} 
                  setBudgetItems={setBudgetItems} 
               />;
      case 'Dashboard':
        return <Dashboard bkuData={bkuData} />;
      case 'Buku Kas Umum':
        return <BukuKasUmum 
                  bkuData={bkuData}
                  onSubmit={handleBkuSubmit}
                  onDelete={handleBkuDelete}
                  onReplace={handleBkuReplace}
                />;
      case 'Buku Kas Pembantu':
        return <BukuKasPembantu
                  bkpData={bkpData}
                  onSubmit={handleBkpSubmit}
                  onDelete={handleBkpDelete}
                  onReplace={handleBkpReplace}
               />;
      case 'Jurnal Umum':
        return <JurnalUmum entries={juData} setEntries={setJuData} />;
      case 'Buku Besar':
        return <BukuBesar 
                  entries={juData} 
                  bkuData={bkuData}
                  budgetItems={budgetItems}
                  onSubmit={handleBkuSubmit}
                  onBkpSubmit={handleBkpSubmit} 
                  onDelete={handleBkuDelete}
                  onReplaceBku={handleBkuReplace}
               />;
      case 'Saldo Akhir':
        return <SaldoAkhir 
                  bkuTransactions={bkuData} 
                  saldoAwal={saldoAwal}
                  setSaldoAwal={setSaldoAwal}
                  penyetoranPajak={penyetoranPajak}
                  setPenyetoranPajak={setPenyetoranPajak}
               />;
      case 'Rekonsiliasi':
        return <Rekonsiliasi bkuTransactions={bkuData} bkpTransactions={bkpData} />;
      case 'Laporan Rekonsiliasi Akhir':
        return <LaporanRekonsiliasiAkhir
                  bkuTransactions={bkuData}
                  budgetItems={budgetItems}
               />;
      default:
        return <PlaceholderPage title={activePage} />;
    }
  };

  if (!isLoggedIn) {
    return <SplashScreen onLogin={handleLogin} onRegister={handleRegister} isLoading={isLoading} />;
  }

  if (!isDisclaimerAccepted) {
    return <DisclaimerPage onContinue={() => {
        setIsDisclaimerAccepted(true);
        setActivePage('Anggaran'); // Go to Anggaran after disclaimer
    }} />;
  }

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </Layout>
  );
};

export default App;
