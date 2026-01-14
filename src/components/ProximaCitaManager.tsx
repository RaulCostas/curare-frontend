import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Doctor, Proforma, ProximaCita, Paciente, HistoriaClinica } from '../types';
import { formatDateUTC } from '../utils/formatters';
import ManualModal, { type ManualSection } from './ManualModal';
import Pagination from './Pagination';

interface ProximaCitaManagerProps {
    pacienteId: number;
    paciente: Paciente | null;
    selectedProformaId: number;
    proformas: Proforma[];
    historia: HistoriaClinica[];
    onCitaSaved?: () => void;
}

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ProximaCitaManager: React.FC<ProximaCitaManagerProps> = ({ pacienteId, paciente, selectedProformaId, proformas, historia, onCitaSaved }) => {
    const [citas, setCitas] = useState<ProximaCita[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        fecha: getLocalDateString(),
        pieza: '',
        proformaDetalleId: 0,
        observaciones: '',
        doctorId: 0,
        estado: 'pendiente'
    });
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const manualSections: ManualSection[] = [
        {
            title: 'Próxima Cita',
            content: 'Gestione las futuras consultas del paciente para un plan de tratamiento específico.'
        },
        {
            title: 'Detalles de la Cita',
            content: 'Indique la fecha, el doctor asignado, y seleccione el tratamiento específico del plan que se realizará.'
        },
        {
            title: 'Acciones',
            content: 'Puede programar nuevas citas, editarlas o eliminarlas. Use el botón de imprimir para generar un listado de citas futuras.'
        }
    ];

    useEffect(() => {
        if (pacienteId) {
            fetchCitas();
        }
        fetchDoctors();
    }, [pacienteId]);

    const fetchCitas = async () => {
        try {
            const response = await api.get(`/proxima-cita/paciente/${pacienteId}`);
            console.log('Received Citas:', response.data); // Debug Request
            setCitas(response.data || []);
        } catch (error) {
            console.error('Error fetching proxima citas:', error);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/doctors?limit=100');
            const allDoctors = response.data.data || response.data || [];
            const activeDoctors = allDoctors.filter((doctor: Doctor) => doctor.estado === 'activo');
            setDoctors(activeDoctors);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const currentProformaDetails = useMemo(() => {
        if (!selectedProformaId) return [];
        const proforma = proformas.find(p => p.id === selectedProformaId);
        return proforma ? proforma.detalles : [];
    }, [selectedProformaId, proformas]);

    const handleTreatmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const detailId = Number(e.target.value);
        if (detailId === 0) {
            setFormData(prev => ({ ...prev, proformaDetalleId: 0, pieza: '' }));
            return;
        }

        const detail = currentProformaDetails.find(d => d.id === detailId);
        if (detail) {
            setFormData(prev => ({
                ...prev,
                proformaDetalleId: detailId,
                pieza: detail.piezas || '',
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log('Sending Date:', formData.fecha); // Debug Request
        try {
            const payload = {
                ...formData,
                pacienteId,
                proformaId: selectedProformaId || undefined
            };

            if (editingId) {
                await api.patch(`/proxima-cita/${editingId}`, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Cita Actualizada',
                    text: 'Próxima cita actualizada correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/proxima-cita', payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Cita Guardada',
                    text: 'Próxima cita guardada correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Trigger workflow callback for new citas
                if (onCitaSaved) {
                    onCitaSaved();
                }
            }

            fetchCitas();
            resetForm();
            setShowForm(false);
        } catch (error) {
            console.error('Error saving proxima cita:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar la próxima cita'
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            fecha: getLocalDateString(),
            pieza: '',
            proformaDetalleId: 0,
            observaciones: '',
            doctorId: 0,
            estado: 'pendiente'
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (cita: ProximaCita) => {
        setEditingId(cita.id);
        const localDate = cita.fecha ? cita.fecha.split('T')[0] : getLocalDateString();
        setFormData({
            fecha: localDate,
            pieza: cita.pieza || '',
            proformaDetalleId: cita.proformaDetalleId || 0,
            observaciones: cita.observaciones || '',
            doctorId: cita.doctorId,
            estado: cita.estado
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "¿Está seguro de eliminar esta cita?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/proxima-cita/${id}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Cita eliminada correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchCitas();
                if (editingId === id) resetForm();
            } catch (error) {
                console.error('Error deleting proxima cita:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar la cita'
                });
            }
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const date = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Próximas Citas - Paciente #${pacienteId}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 2cm 1.5cm 3cm 1.5cm;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        color: #333;
                    }
                    
                    .header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 2px solid #3498db;
                    }
                    
                    .header img {
                        height: 60px;
                        margin-right: 20px;
                    }
                    
                    h1 {
                        color: #2c3e50;
                        margin: 0;
                        font-size: 24px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    
                    th {
                        background-color: #3498db;
                        color: white;
                        padding: 12px 8px;
                        text-align: left;
                        font-weight: bold;
                        border: 1px solid #2980b9;
                        font-size: 11px;
                    }
                    
                    td {
                        padding: 8px;
                        border: 1px solid #ddd;
                        font-size: 10px;
                    }
                    
                    tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }
                    
                    .footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        padding: 10px 0;
                    }
                    
                    .footer-line {
                        border-top: 1px solid #333;
                        margin-bottom: 10px;
                    }
                    
                    .footer-content {
                        display: flex;
                        justify-content: flex-end;
                        font-size: 9px;
                        color: #666;
                    }
                    
                    .footer-info {
                        text-align: right;
                    }
                    
                    @media print {
                        body {
                            margin: 0;
                        }
                        
                        th {
                            background-color: #3498db !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        
                        tr:nth-child(even) {
                            background-color: #f8f9fa !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        
                        .footer {
                            position: fixed;
                            bottom: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/logo-curare.png" alt="Curare Centro Dental">
                    <h1>Próximas Citas</h1>
                </div>
                
                <div style="margin-bottom: 20px; padding: 10px; background-color: #f8f9fa; border-left: 4px solid #3498db;">
                    <p style="margin: 0 0 5px 0;"><strong>PACIENTE:</strong> ${paciente ? `${paciente.paterno} ${paciente.materno} ${paciente.nombre}`.toUpperCase() : 'N/A'}</p>
                    <p style="margin: 0;"><strong>PLAN DE TRATAMIENTO:</strong> ${selectedProformaId > 0 ? (() => {
                const proforma = proformas.find(p => p.id === selectedProformaId);
                return proforma ? `Plan #${proforma.numero || proforma.id} - ${formatDateUTC(proforma.fecha)}` : 'N/A';
            })() : 'Todos los planes'}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tratamiento</th>
                            <th>Pieza</th>
                            <th>Observaciones</th>
                            <th>Doctor</th>
                            <th>Plan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredCitas.map(cita => `
                            <tr>
                                <td>${formatDateUTC(cita.fecha)}</td>
                                <td>${cita.proformaDetalle?.arancel?.detalle || '-'}</td>
                                <td>${cita.pieza || '-'}</td>
                                <td>${cita.observaciones || '-'}</td>
                                <td>${cita.doctor ? `${cita.doctor.paterno} ${cita.doctor.nombre}` : '-'}</td>
                                <td>${cita.proformaId ? `Plan #${cita.proformaId}` : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <div class="footer-line"></div>
                    <div class="footer-content">
                        <div class="footer-info">
                            <div>Fecha de impresión: ${date}</div>
                        </div>
                    </div>
                </div>
                
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    const [searchTerm, setSearchTerm] = useState('');

    // Filter citas by selected plan and search term
    const filteredCitas = useMemo(() => {
        if (!selectedProformaId) return [];
        let result = citas.filter(c => c.proformaId === selectedProformaId);

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(cita =>
                (cita.pieza?.toLowerCase() || '').includes(term) ||
                (cita.observaciones?.toLowerCase() || '').includes(term) ||
                (cita.proformaDetalle?.arancel?.detalle?.toLowerCase() || '').includes(term) ||
                (cita.doctor?.nombre?.toLowerCase() || '').includes(term) ||
                (cita.doctor?.paterno?.toLowerCase() || '').includes(term)
            );
        }
        return result;
    }, [citas, selectedProformaId, searchTerm]);

    // Pagination
    const totalPages = Math.ceil(filteredCitas.length / itemsPerPage);
    const paginatedCitas = filteredCitas.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalCitasForPlan = useMemo(() => {
        if (!selectedProformaId) return 0;
        return citas.filter(c => c.proformaId === selectedProformaId).length;
    }, [citas, selectedProformaId]);

    if (!selectedProformaId) {
        return (
            <div className="p-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <p>⬅️ Por favor, seleccione un <strong>Plan de Tratamiento</strong>.</p>
            </div>
        )
    }

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Historial de Próximas Citas
            </h3>

            {(showForm || editingId) && (
                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 animate-fade-in-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        {/* Fecha */}
                        <div>
                            <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm">Fecha</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <input
                                    type="date"
                                    value={formData.fecha}
                                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Doctor */}
                        <div>
                            <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm">Doctor</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <select
                                    value={formData.doctorId}
                                    onChange={e => setFormData({ ...formData, doctorId: Number(e.target.value) })}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                                    required
                                >
                                    <option value={0}>-- Seleccione --</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.paterno} {d.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Tratamiento */}
                        <div>
                            <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm">Tratamiento</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                                </svg>
                                <select
                                    value={formData.proformaDetalleId}
                                    onChange={handleTreatmentChange}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                                >
                                    <option value={0}>-- Seleccione Tratamiento --</option>
                                    {currentProformaDetails.map(d => {
                                        let isCompleted = false;

                                        if (d.piezas) {
                                            const allPiezas = d.piezas.split('/').map((p: string) => p.trim());
                                            const completedPieces: string[] = [];
                                            historia.forEach(h => {
                                                if (h.proformaDetalleId === d.id &&
                                                    h.estadoTratamiento === 'terminado' &&
                                                    h.pieza) {
                                                    const pieces = h.pieza.split('/').map((p: string) => p.trim());
                                                    completedPieces.push(...pieces);
                                                }
                                            });
                                            isCompleted = allPiezas.length > 0 && allPiezas.every((p: string) => completedPieces.includes(p));
                                        } else {
                                            isCompleted = historia.some(h =>
                                                h.proformaDetalleId === d.id &&
                                                h.estadoTratamiento === 'terminado'
                                            );
                                        }

                                        return (
                                            <option
                                                key={d.id}
                                                value={d.id}
                                                style={isCompleted ? {
                                                    color: '#16a34a',
                                                    fontWeight: 'bold'
                                                } : undefined}
                                            >
                                                {d.arancel ? d.arancel.detalle : 'Tratamiento'} {d.piezas ? `(Pz: ${d.piezas})` : ''} {isCompleted ? '(Completado)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        {/* Pieza */}
                        <div>
                            <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm">Pieza</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                </svg>
                                <input
                                    type="text"
                                    value={formData.pieza}
                                    onChange={e => setFormData({ ...formData, pieza: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div className="mb-6">
                        <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm">Observaciones / Detalle</label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <input
                                type="text"
                                value={formData.observaciones}
                                onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading || formData.doctorId === 0}
                            className={`px-6 py-2 rounded-lg font-bold text-white shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
                                } ${loading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            {loading ? 'Guardando...' : (editingId ? 'Actualizar Cita' : 'Guardar Próxima Cita')}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Search Bar & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="relative w-full md:max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por tratamiento, doctor, pieza..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    {!showForm && !editingId && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Nueva Cita
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        Imprimir
                    </button>
                </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
                Mostrando {filteredCitas.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCitas.length)} de {filteredCitas.length} resultados
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                {filteredCitas.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tratamiento</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pieza</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Observaciones</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedCitas.map((cita, index) => (
                                <tr
                                    key={cita.id}
                                    className={`${editingId === cita.id
                                        ? 'bg-amber-50 dark:bg-amber-900/30'
                                        : index % 2 === 0
                                            ? 'bg-white dark:bg-gray-800'
                                            : 'bg-gray-50 dark:bg-gray-900'
                                        } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150`}
                                >
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">
                                        {formatDateUTC(cita.fecha)}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        {cita.proformaDetalle?.arancel?.detalle || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        {cita.pieza || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        {cita.observaciones || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        {cita.doctor ? `${cita.doctor.paterno} ${cita.doctor.nombre}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        {cita.proformaId ? `Plan #${cita.proformaId}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(cita)}
                                                className="p-2 text-white bg-amber-400 hover:bg-amber-500 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Editar"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor">
                                                    <path d="M497.9 142.1l-46.1 46.1c-4.7 4.7-12.3 4.7-17 0l-111-111c-4.7-4.7-4.7-12.3 0-17l46.1-46.1c18.7-18.7 49.1-18.7 67.9 0l60.1 60.1c18.8 18.7 18.8 49.1 0 67.9zM284.2 99.8L21.6 362.4.4 483.9c-2.9 16.4 11.4 30.6 27.8 27.8l121.5-21.3 262.6-262.6c4.7-4.7 4.7-12.3 0-17l-111-111c-4.8-4.7-12.4-4.7-17.1 0zM124.1 339.9c-5.5-5.5-5.5-14.3 0-19.8l154-154c5.5-5.5 14.3-5.5 19.8 0s5.5 14.3 0 19.8l-154 154c-5.5 5.5-14.3 5.5-19.8 0zM88 424h48v36.3l-64.5 11.3-31.1-31.1L51.7 376H88v48z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cita.id)}
                                                className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Eliminar"
                                            >
                                                <svg width="14" height="16" viewBox="0 0 448 512" fill="currentColor">
                                                    <path d="M135.2 17.69C140.6 6.848 151.7 0 163.8 0H284.2C296.3 0 307.4 6.848 312.8 17.69L320 32H416C433.7 32 448 46.33 448 64C448 81.67 433.7 96 416 96H32C14.33 96 0 81.67 0 64C0 46.33 14.33 32 32 32H128L135.2 17.69zM39.42 462.3C35.23 441.5 32 419.6 32 397.7V128H416V397.7C416 419.6 412.8 441.5 408.6 462.3C402.1 494.5 373.9 512 344.1 512H103.9C74.07 512 45.92 494.5 39.42 462.3z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                        <p className="italic">No se han registrado próximas citas para este plan.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Próxima Cita"
                sections={manualSections}
            />
        </div >
    );
};

export default ProximaCitaManager;
