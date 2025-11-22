
import React, { useState, useMemo } from 'react';
import type { BudgetItem } from '../types';
import Modal from '../components/shared/Modal';
import Notification from '../components/shared/Notification';
import { Plus, Pencil, Trash2, Save, ArrowUpRight, DollarSign, BookOpen, Users, Settings, Flower, Handshake, Trees } from 'lucide-react';
import { numberToWords, formatCurrency } from '../utils/formatter';
import { REFERENSI_REKENING } from '../constants';

interface AnggaranProps {
    budgetItems: BudgetItem[];
    setBudgetItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
}

type TabType = 'pendapatan' | 'belanja-rutin-insentif' | 'belanja-rutin-operasional' | 'belanja-program-parhyangan' | 'belanja-program-pawongan' | 'belanja-program-palemahan';

const Anggaran: React.FC<AnggaranProps> = ({ budgetItems, setBudgetItems }) => {
    const [activeTab, setActiveTab] = useState<TabType>('pendapatan');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Form State
    const [formKode, setFormKode] = useState('');
    const [formKategori, setFormKategori] = useState('');
    const [formJumlah, setFormJumlah] = useState<number | ''>('');

    const filteredItems = useMemo(() => {
        return budgetItems.filter(item => item.type === activeTab);
    }, [budgetItems, activeTab]);

    const totalAmount = useMemo(() => {
        return filteredItems.reduce((sum, item) => sum + item.jumlah, 0);
    }, [filteredItems]);

    // Identify selected code description for feedback in the modal
    const selectedCodeDescription = useMemo(() => {
        if(!formKode) return '';
        const cleanCode = formKode.split(' - ')[0].trim();
        const found = REFERENSI_REKENING.find(c => c.code === cleanCode);
        return found ? found.name : '';
    }, [formKode]);

    const handleOpenModal = (item: BudgetItem | null = null) => {
        if (item) {
            setEditingItem(item);
            setFormKode(item.kode);
            setFormKategori(item.uraian);
            setFormJumlah(item.jumlah);
        } else {
            setEditingItem(null);
            setFormKode('');
            setFormKategori('');
            setFormJumlah('');
        }
        setIsModalOpen(true);
    };

    // Handle selection from the datalist
    const handleKodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormKode(value);
        
        // Auto-populate Kategori/Uraian if it's currently empty
        const cleanCode = value.split(' - ')[0].trim();
        const found = REFERENSI_REKENING.find(c => c.code === cleanCode);
        
        if (found && !formKategori) {
            setFormKategori(found.name);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formKategori || formJumlah === '') {
            setNotification({ message: 'Kategori dan Jumlah harus diisi.', type: 'error' });
            return;
        }

        // Extract clean code if user selected from dropdown (e.g. "5.1.2.01 - ATK" -> "5.1.2.01")
        const cleanKode = formKode.split(' - ')[0].trim();

        const newItem: BudgetItem = {
            id: editingItem ? editingItem.id : `${activeTab}-${Date.now()}`,
            kode: cleanKode || '00.00',
            uraian: formKategori,
            jumlah: Number(formJumlah),
            type: activeTab
        };

        if (editingItem) {
            setBudgetItems(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
            setNotification({ message: 'Item anggaran diperbarui.', type: 'success' });
        } else {
            setBudgetItems(prev => [...prev, newItem]);
            setNotification({ message: 'Item anggaran ditambahkan.', type: 'success' });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Hapus item anggaran ini?')) {
            setBudgetItems(prev => prev.filter(item => item.id !== id));
            setNotification({ message: 'Item anggaran dihapus.', type: 'success' });
        }
    };

    const terbilang = (num: number) => numberToWords(num) + ' Rupiah';

    const getTabLabel = (tab: TabType) => {
        switch (tab) {
            case 'pendapatan': return 'Pendapatan';
            case 'belanja-rutin-insentif': return 'Rutin (Insentif)';
            case 'belanja-rutin-operasional': return 'Rutin (Operasional)';
            case 'belanja-program-parhyangan': return 'Prog. Parhyangan';
            case 'belanja-program-pawongan': return 'Prog. Pawongan';
            case 'belanja-program-palemahan': return 'Prog. Palemahan';
            default: return '';
        }
    };

    const getTabColor = (tab: TabType) => {
        switch (tab) {
            case 'pendapatan': return 'bg-green-600';
            case 'belanja-rutin-insentif': return 'bg-purple-600';
            case 'belanja-rutin-operasional': return 'bg-pink-600';
            case 'belanja-program-parhyangan': return 'bg-yellow-600';
            case 'belanja-program-pawongan': return 'bg-blue-600';
            case 'belanja-program-palemahan': return 'bg-emerald-600';
            default: return 'bg-gray-600';
        }
    };

    const getTabBorderColor = (tab: TabType) => {
        switch (tab) {
            case 'pendapatan': return 'bg-green-900/20 border-green-800';
            case 'belanja-rutin-insentif': return 'bg-purple-900/20 border-purple-800';
            case 'belanja-rutin-operasional': return 'bg-pink-900/20 border-pink-800';
            case 'belanja-program-parhyangan': return 'bg-yellow-900/20 border-yellow-800';
            case 'belanja-program-pawongan': return 'bg-blue-900/20 border-blue-800';
            case 'belanja-program-palemahan': return 'bg-emerald-900/20 border-emerald-800';
            default: return 'border-gray-800';
        }
    };

    const getTabIconColor = (tab: TabType) => {
        switch (tab) {
            case 'pendapatan': return 'bg-green-500/20 text-green-400';
            case 'belanja-rutin-insentif': return 'bg-purple-500/20 text-purple-400';
            case 'belanja-rutin-operasional': return 'bg-pink-500/20 text-pink-400';
            case 'belanja-program-parhyangan': return 'bg-yellow-500/20 text-yellow-400';
            case 'belanja-program-pawongan': return 'bg-blue-500/20 text-blue-400';
            case 'belanja-program-palemahan': return 'bg-emerald-500/20 text-emerald-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {notification && <Notification {...notification} onClose={() => setNotification(null)} />}

            <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Penyusunan Anggaran</h2>
                        <p className="text-gray-400 text-sm">Tentukan target Pendapatan, Belanja Rutin, dan Belanja Program (Tri Hita Karana).</p>
                    </div>
                </div>
                
                {/* Tabs Container */}
                <div className="flex bg-gray-800 p-1 rounded-lg overflow-x-auto mb-6 gap-1 custom-scrollbar">
                    <button
                        onClick={() => setActiveTab('pendapatan')}
                        className={`px-3 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'pendapatan' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <ArrowUpRight size={16} /> Pendapatan
                    </button>
                    <button
                        onClick={() => setActiveTab('belanja-rutin-insentif')}
                        className={`px-3 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'belanja-rutin-insentif' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Users size={16} /> Rutin (Insentif)
                    </button>
                     <button
                        onClick={() => setActiveTab('belanja-rutin-operasional')}
                        className={`px-3 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'belanja-rutin-operasional' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Settings size={16} /> Rutin (Operasional)
                    </button>
                    <button
                        onClick={() => setActiveTab('belanja-program-parhyangan')}
                        className={`px-3 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'belanja-program-parhyangan' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Flower size={16} /> Parhyangan
                    </button>
                     <button
                        onClick={() => setActiveTab('belanja-program-pawongan')}
                        className={`px-3 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'belanja-program-pawongan' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Handshake size={16} /> Pawongan
                    </button>
                     <button
                        onClick={() => setActiveTab('belanja-program-palemahan')}
                        className={`px-3 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'belanja-program-palemahan' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Trees size={16} /> Palemahan
                    </button>
                </div>

                {/* Summary Card */}
                <div className={`p-6 rounded-lg border mb-6 flex items-center justify-between ${getTabBorderColor(activeTab)}`}>
                    <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-full ${getTabIconColor(activeTab)}`}>
                            <DollarSign size={24} />
                         </div>
                         <div>
                             <p className="text-sm text-gray-400 uppercase font-bold">Total Anggaran {getTabLabel(activeTab)}</p>
                             <p className="text-3xl font-bold text-white">{formatCurrency(totalAmount)}</p>
                         </div>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white shadow-lg transition-transform hover:scale-105 ${getTabColor(activeTab)} hover:brightness-110`}
                    >
                        <Plus size={18} /> Tambah Item
                    </button>
                </div>

                {/* List Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-700">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-800">
                            <tr>
                                <th className="px-6 py-3">Kode</th>
                                <th className="px-6 py-3">Kategori / Uraian</th>
                                <th className="px-6 py-3 text-right">Jumlah Anggaran</th>
                                <th className="px-6 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500 italic">
                                        Belum ada data anggaran untuk kategori ini. Silakan tambahkan.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => (
                                    <tr key={item.id} className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50">
                                        <td className="px-6 py-4">{item.kode}</td>
                                        <td className="px-6 py-4 text-white font-medium">{item.uraian}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-white">{formatCurrency(item.jumlah)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleOpenModal(item)} className="p-1 text-sky-400 hover:text-sky-300 hover:bg-sky-900/30 rounded transition-colors">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="mt-6 flex justify-end">
                    <p className="text-gray-500 text-xs italic">
                        * Data anggaran yang disimpan di sini akan otomatis muncul di Laporan Realisasi Anggaran (LRA) dan opsi dropdown di Buku Besar.
                    </p>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${editingItem ? 'Edit' : 'Tambah'} Anggaran ${getTabLabel(activeTab)}`}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Kode Rekening</label>
                        <input 
                            list="budget-codes-list"
                            type="text" 
                            value={formKode}
                            onChange={handleKodeChange}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Pilih atau ketik kode (Contoh: 5.1.2.01)"
                            autoFocus
                            autoComplete="off"
                        />
                         <datalist id="budget-codes-list">
                            {REFERENSI_REKENING.map(item => (
                                <option key={item.code} value={`${item.code} - ${item.name}`} />
                            ))}
                        </datalist>
                        
                         {/* Keterangan Kode Display */}
                         <div className="mt-2 p-2 bg-gray-900/50 rounded border border-gray-700 text-sm min-h-[2.5rem] flex items-center gap-2">
                            <BookOpen size={16} className="text-teal-400"/>
                            {selectedCodeDescription ? (
                                <span className="text-teal-300 font-medium">{selectedCodeDescription}</span>
                            ) : (
                                <span className="text-gray-500 italic">Keterangan kode akan muncul di sini...</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Kategori / Uraian</label>
                        <input 
                            type="text" 
                            value={formKategori}
                            onChange={e => setFormKategori(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Contoh: Belanja Upacara..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Nama kategori ini akan menjadi acuan untuk perhitungan realisasi.</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Jumlah Anggaran</label>
                        <input 
                            type="number" 
                            value={formJumlah}
                            onChange={e => setFormJumlah(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="0"
                        />
                         {Number(formJumlah) > 0 && <p className="text-xs text-teal-400 mt-1 italic">{terbilang(Number(formJumlah))}</p>}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors">Batal</button>
                        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-lg">
                            <Save size={18}/> Simpan
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Anggaran;
