import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import type { SecuenciaTratamiento, Paciente } from '../types';
import { formatDateUTC } from '../utils/formatters';
import ManualModal, { type ManualSection } from './ManualModal';
import Pagination from './Pagination';

interface Props {
    pacienteId: number;
    paciente: Paciente | null;
    selectedProformaId: number;
}

const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const fields = [
    { name: 'periodoncia', label: 'Periodoncia' },
    { name: 'cirugia', label: 'Cirugía' },
    { name: 'endodoncia', label: 'Endodoncia' },
    { name: 'operatoria', label: 'Operatoria' },
    { name: 'protesis', label: 'Prótesis' },
    { name: 'implantes', label: 'Implantes' },
    { name: 'ortodoncia', label: 'Ortodoncia' },
    { name: 'odontopediatria', label: 'Odontopediatría' },
];

const SecuenciaTratamientoManager: React.FC<Props> = ({ pacienteId, paciente, selectedProformaId }) => {
    const [secuencias, setSecuencias] = useState<SecuenciaTratamiento[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Secuencia de Tratamiento',
            content: 'Registro cronológico y detallado de los procedimientos realizados en cada especialidad.'
        },
        {
            title: 'Especialidades',
            content: 'Puede registrar avances específicos en áreas como Periodoncia, Cirugía, Endodoncia, Operatoria, Prótesis, Implantes, Ortodoncia y Odontopediatría.'
        },
        {
            title: 'Gestión',
            content: 'Use "Nueva Secuencia" para agregar un registro diario. Puede editar o eliminar registros existentes si es necesario. Use el botón de imprimir para generar un reporte físico.'
        }
    ];

    // Form State
    const [formData, setFormData] = useState<any>({
        fecha: getLocalDateString(),
        periodoncia: '',
        cirugia: '',
        endodoncia: '',
        operatoria: '',
        protesis: '',
        implantes: '',
        ortodoncia: '',
        odontopediatria: ''
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        if (selectedProformaId) {
            fetchSecuencia();
        } else {
            setSecuencias([]);
        }
    }, [selectedProformaId]);

    const fetchSecuencia = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/secuencia-tratamiento/proforma/${selectedProformaId}`);
            setSecuencias(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching secuencia:', error);
            setSecuencias([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: SecuenciaTratamiento) => {
        setEditingId(item.id);
        setFormData({
            fecha: item.fecha.split('T')[0],
            periodoncia: item.periodoncia || '',
            cirugia: item.cirugia || '',
            endodoncia: item.endodoncia || '',
            operatoria: item.operatoria || '',
            protesis: item.protesis || '',
            implantes: item.implantes || '',
            ortodoncia: item.ortodoncia || '',
            odontopediatria: item.odontopediatria || ''
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Está seguro de eliminar este registro?')) return;
        try {
            await api.delete(`/secuencia-tratamiento/${id}`);
            fetchSecuencia();
            if (editingId === id) resetForm();
        } catch (error) {
            console.error('Error deleting secuencia:', error);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            fecha: getLocalDateString(),
            periodoncia: '',
            cirugia: '',
            endodoncia: '',
            operatoria: '',
            protesis: '',
            implantes: '',
            ortodoncia: '',
            odontopediatria: ''
        });
        setShowForm(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                pacienteId,
                proformaId: selectedProformaId
            };

            if (editingId) {
                await api.patch(`/secuencia-tratamiento/${editingId}`, payload);
            } else {
                await api.post('/secuencia-tratamiento', payload);
            }

            await fetchSecuencia();
            resetForm();
        } catch (error) {
            console.error('Error saving secuencia:', error);
            alert('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const filteredSecuencias = useMemo(() => {
        if (!searchTerm) return secuencias;
        const term = searchTerm.toLowerCase();
        return secuencias.filter(item => {
            return fields.some(f => {
                const val = (item as any)[f.name];
                return val && val.toLowerCase().includes(term);
            }) || (item.fecha && item.fecha.includes(term));
        });
    }, [secuencias, searchTerm]);

    // Pagination
    const totalPages = Math.ceil(filteredSecuencias.length / itemsPerPage);
    const paginatedSecuencias = filteredSecuencias.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

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
                <title>Historial de Secuencia - Plan #${selectedProformaId}</title>
                <style>
                    @page {
                        size: A4 landscape;
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
                    
                    .plan-info {
                        margin: 20px 0;
                        padding: 10px;
                        background-color: #f8f9fa;
                        border-left: 4px solid #3498db;
                        font-size: 11px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }
                    
                    th {
                        background-color: #3498db;
                        color: white;
                        padding: 10px 6px;
                        text-align: left;
                        font-weight: bold;
                        border: 1px solid #2980b9;
                        font-size: 10px;
                    }
                    
                    td {
                        padding: 6px;
                        border: 1px solid #ddd;
                        font-size: 9px;
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
                        
                        .plan-info {
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
                    <h1>Historial de Secuencia de Tratamiento</h1>
                </div>
                
                <div class="plan-info">
                     <p style="margin: 0 0 5px 0;"><strong>PACIENTE:</strong> ${paciente ? `${paciente.paterno} ${paciente.materno} ${paciente.nombre}`.toUpperCase() : 'N/A'}</p>
                     <p style="margin: 0;"><strong>PLAN DE TRATAMIENTO:</strong> #${selectedProformaId}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            ${fields.map(f => `<th>${f.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredSecuencias.map(item => `
                            <tr>
                                <td>${formatDateUTC(item.fecha)}</td>
                                ${fields.map(f => `<td>${(item as any)[f.name] || ''}</td>`).join('')}
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

    if (!selectedProformaId) {
        return (
            <div className="p-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <p>⬅️ Por favor, seleccione un <strong>Plan de Tratamiento</strong>.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Historial de Secuencia
            </h3>

            {(showForm || editingId) && (
                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 animate-fade-in-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
                                    name="fecha"
                                    value={formData.fecha}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {fields.map(field => (
                            <div key={field.name}>
                                <label className="block mb-2 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide">{field.label}</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-3 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    <textarea
                                        name={field.name}
                                        value={formData[field.name]}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y min-h-[50px]"
                                        placeholder={`${field.label}...`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-6 py-2 rounded-lg font-bold text-white shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
                                } ${saving ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            {saving ? 'Guardando...' : (editingId ? 'Actualizar Registro' : 'Guardar Registro')}
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
                        placeholder="Buscar en el historial..."
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
                            Nueva Secuencia
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
                Mostrando {filteredSecuencias.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredSecuencias.length)} de {filteredSecuencias.length} resultados
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                {loading ? (
                    <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-2"></div>
                        <p>Cargando datos...</p>
                    </div>
                ) : filteredSecuencias.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">Fecha</th>
                                {fields.map(f => (
                                    <th key={f.name} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">{f.label}</th>
                                ))}
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedSecuencias.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className={`${editingId === item.id
                                        ? 'bg-amber-50 dark:bg-amber-900/30'
                                        : index % 2 === 0
                                            ? 'bg-white dark:bg-gray-800'
                                            : 'bg-gray-50 dark:bg-gray-750'
                                        } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150`}
                                >
                                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">{formatDateUTC(item.fecha)}</td>
                                    {fields.map(f => (
                                        <td key={f.name} className="px-4 py-4 text-gray-600 dark:text-gray-400 text-xs">{(item as any)[f.name]}</td>
                                    ))}
                                    <td className="px-4 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2 text-white bg-amber-400 hover:bg-amber-500 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Editar"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor">
                                                    <path d="M497.9 142.1l-46.1 46.1c-4.7 4.7-12.3 4.7-17 0l-111-111c-4.7-4.7-4.7-12.3 0-17l46.1-46.1c18.7-18.7 49.1-18.7 67.9 0l60.1 60.1c18.8 18.7 18.8 49.1 0 67.9zM284.2 99.8L21.6 362.4.4 483.9c-2.9 16.4 11.4 30.6 27.8 27.8l121.5-21.3 262.6-262.6c4.7-4.7 4.7-12.3 0-17l-111-111c-4.8-4.7-12.4-4.7-17.1 0zM124.1 339.9c-5.5-5.5-5.5-14.3 0-19.8l154-154c5.5-5.5 14.3-5.5 19.8 0s5.5 14.3 0 19.8l-154 154c-5.5 5.5-14.3 5.5-19.8 0zM88 424h48v36.3l-64.5 11.3-31.1-31.1L51.7 376H88v48z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
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
                        <p className="italic">No hay registros de secuencia para este plan.</p>
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
                title="Manual de Usuario - Secuencia de Tratamiento"
                sections={manualSections}
            />
        </div >
    );
};

export default SecuenciaTratamientoManager;
