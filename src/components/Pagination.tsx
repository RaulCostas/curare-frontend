import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="no-print" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '20px',
            gap: '15px'
        }}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                    padding: '8px 16px',
                    backgroundColor: currentPage === 1 ? '#ecf0f1' : 'white',
                    color: currentPage === 1 ? '#bdc3c7' : '#3498db',
                    border: `1px solid ${currentPage === 1 ? '#ecf0f1' : '#3498db'}`,
                    borderRadius: '6px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                }}
            >
                Anterior
            </button>

            <span style={{
                color: '#2c3e50',
                fontSize: '14px',
                fontWeight: 500
            }}>
                Página {currentPage} de {totalPages}
            </span>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                    padding: '8px 16px',
                    backgroundColor: currentPage === totalPages ? '#ecf0f1' : 'white',
                    color: currentPage === totalPages ? '#bdc3c7' : '#3498db',
                    border: `1px solid ${currentPage === totalPages ? '#ecf0f1' : '#3498db'}`,
                    borderRadius: '6px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                }}
            >
                Siguiente
            </button>
        </div>
    );
};

export default Pagination;
