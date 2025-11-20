import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {

  const buttonClass = "flex items-center gap-1 px-3 py-1.5 bg-gray-800 rounded-md border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400 mt-4 gap-4">
        <div>
            Halaman <span className="font-bold text-white">{currentPage}</span> dari <span className="font-bold text-white">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className={buttonClass}
                title="Halaman Awal"
            >
                <ChevronsLeft size={16} />
                <span className="hidden md:inline">Awal</span>
            </button>
             <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={buttonClass}
            >
                <ChevronLeft size={16} />
                <span>Sebelumnya</span>
            </button>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={buttonClass}
            >
                <span>Berikutnya</span>
                <ChevronRight size={16} />
            </button>
             <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={buttonClass}
                title="Halaman Akhir"
            >
                 <span className="hidden md:inline">Akhir</span>
                <ChevronsRight size={16} />
            </button>
        </div>
    </div>
  );
};

export default Pagination;