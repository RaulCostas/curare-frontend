import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Paciente } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import { formatDate } from '../utils/dateUtils';
import PacienteImagenesModal from './PacienteImagenesModal';
import Swal from 'sweetalert2';

const PacienteList: React.FC = () => {
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);

    const [showManual, setShowManual] = useState(false);
    const [showImagenesModal, setShowImagenesModal] = useState(false);
    const [selectedPacienteIdForImages, setSelectedPacienteIdForImages] = useState<number | null>(null);
    const limit = 5;
    const navigate = useNavigate();

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Pacientes',
            content: 'Desde esta pantalla puede administrar todo el registro de pacientes de la clínica.'
        },
        {
            title: 'Agregar Paciente',
            content: 'Use el botón azul "+ Nuevo Paciente" para registrar una nueva ficha. Es importante completar los datos personales y de contacto.'
        },
        {
            title: 'Acciones Rápidas',
            content: (
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>💰 <strong>Presupuestos:</strong> Ver y crear presupuestos para el paciente.</li>
                    <li>📑 <strong>Propuestas:</strong> Gestionar propuestas de tratamiento.</li>
                    <li>📋 <strong>Historia Clínica:</strong> Acceder al historial médico completo.</li>
                    <li>📷 <strong>Imágenes:</strong> Gestionar y visualizar imágenes de tratamientos.</li>
                </ul>
            )
        },
        {
            title: 'Dar de Baja y Reactivar',
            content: 'Use el botón de lápiz (amarillo) para modificar datos personales. Para pacientes activos, el botón rojo (papelera) cambia el estado a "Inactivo". Para pacientes inactivos, aparece un botón verde (check) que permite reactivarlos a estado "Activo".'
        },
        {
            title: 'Búsqueda y Reportes',
            content: 'Puede buscar por nombre/apellido y exportar la lista filtrada a Excel o PDF para reportes externos.'
        }
    ];

    const formatCelular = (celular: string) => {
        if (!celular) return '';
        const countryCodes = ['+591', '+54', '+55', '+56', '+51', '+595', '+598', '+57', '+52', '+34', '+1'];
        const code = countryCodes.find(c => celular.startsWith(c));
        if (code) {
            const number = celular.substring(code.length);
            return `(${code}) ${number}`;
        }
        return celular;
    };


    useEffect(() => {
        fetchPacientes();
    }, [searchTerm, currentPage]);

    const fetchPacientes = async () => {
        try {
            const response = await api.get(`/pacientes?page=${currentPage}&limit=${limit}&search=${searchTerm}`);
            setPacientes(Array.isArray(response.data.data) ? response.data.data : []);
            setTotalPages(response.data.totalPages || 0);
            setTotalRecords(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching pacientes:', error);
            setPacientes([]);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Dar de baja paciente?',
            text: 'El paciente pasará a estado Inactivo sin eliminar el registro de la base de datos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/pacientes/${id}`, { estado: 'inactivo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Paciente dado de baja!',
                    text: 'El estado del paciente ha sido cambiado a Inactivo.',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchPacientes();
            } catch (error) {
                console.error('Error al dar de baja paciente:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo dar de baja el paciente'
                });
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar paciente?',
            text: 'El paciente volverá a estado Activo.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/pacientes/${id}`, { estado: 'activo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Paciente reactivado!',
                    text: 'El estado del paciente ha sido cambiado a Activo.',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchPacientes();
            } catch (error) {
                console.error('Error al reactivar paciente:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo reactivar el paciente'
                });
            }
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const exportToExcel = () => {
        const dataToExport = pacientes.map(p => ({
            Paciente: `${p.paterno} ${p.materno} ${p.nombre}`,
            Celular: p.celular,
            'Tipo Paciente': p.tipo_paciente
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
        XLSX.writeFile(wb, "pacientes.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Lista de Pacientes", 20, 10);
        const tableColumn = ["Paciente", "Celular", "Tipo Paciente"];
        const tableRows = pacientes.map(p => [
            `${p.paterno} ${p.materno} ${p.nombre}`,
            p.celular,
            p.tipo_paciente
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });
        doc.save("pacientes.pdf");
    };


    const handlePrint = async () => {
        try {
            // Fetch ALL records for printing
            const response = await api.get(`/pacientes?page=1&limit=9999&search=${searchTerm}`);
            const allPacientes = Array.isArray(response.data.data) ? response.data.data : [];

            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow?.document;
            if (!doc) {
                document.body.removeChild(iframe);
                return;
            }

            const printDate = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Lista de Pacientes</title>
                    <style>
                        @page {
                            size: A4; /* Vertical */
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
                            font-size: 10px;
                        }
                        
                        th {
                            background-color: #3498db;
                            color: white;
                            padding: 8px 6px;
                            text-align: left;
                            font-weight: bold;
                            border: 1px solid #2980b9;
                        }
                        
                        td {
                            padding: 6px;
                            border: 1px solid #ddd;
                        }
                        
                        tr:nth-child(even) {
                            background-color: #f8f9fa;
                        }
                        
                        .status-active {
                            color: #27ae60;
                            font-weight: bold;
                        }
                        
                        .status-inactive {
                            color: #e74c3c;
                            font-weight: bold;
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
                        <h1>Lista de Pacientes</h1>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Paciente</th>
                                <th>Celular</th>
                                <th>Fecha Nac.</th>
                                <th>Categoría</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allPacientes.map((p: Paciente, index: number) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${p.paterno} ${p.materno} ${p.nombre}</td>
                                    <td>${p.celular}</td>
                                    <td>${formatDate(p.fecha_nacimiento)}</td>
                                    <td>${p.categoria ? p.categoria.sigla : '-'}</td>
                                    <td class="${p.estado === 'activo' ? 'status-active' : 'status-inactive'}">
                                        ${p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        <div class="footer-line"></div>
                        <div class="footer-content">
                            <div class="footer-info">
                                <div>Fecha de impresión: ${printDate}</div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            doc.open();
            doc.write(printContent);
            doc.close();

            const doPrint = () => {
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error('Print error:', e);
                } finally {
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                    }, 2000);
                }
            };

            const logo = doc.querySelector('img');
            if (logo) {
                if (logo.complete) {
                    doPrint();
                } else {
                    logo.onload = doPrint;
                    logo.onerror = doPrint;
                }
            } else {
                doPrint();
            }
        } catch (error) {
            console.error('Error al imprimir:', error);
            alert('Error al generar el documento de impresión');
        }
    };

    const handlePrintPaciente = async (pacientePreview: Paciente) => {
        try {
            // Show loading alert because we are not opening a window immediately
            Swal.fire({
                title: 'Generando Ficha...',
                text: 'Por favor espere',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Fetch full patient data
            const response = await api.get<Paciente>(`/pacientes/${pacientePreview.id}`);
            const fullPaciente = response.data;
            const ficha = fullPaciente.fichaMedica;



            // Helper for boolean checks
            const check = (val: boolean | undefined) => val ? 'SÍ' : 'NO';
            const checkIcon = (val: boolean | undefined) => val ? '☒' : '☐';

            // Create a hidden iframe
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow?.document;
            if (!doc) {
                document.body.removeChild(iframe);
                throw new Error('No se pudo crear el iframe de impresión');
            }

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Ficha de Paciente - ${fullPaciente.nombre} ${fullPaciente.paterno}</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 0;
                        }
                        
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            color: #333;
                            line-height: 1.4;
                            font-size: 12px;
                        }

                        .page-container {
                            height: 297mm;
                            width: 210mm;
                            position: relative;
                            padding: 2cm 1.5cm;
                            box-sizing: border-box;
                            page-break-after: always;
                            display: flex;
                            flex-direction: column;
                        }

                        .page-container:last-child {
                            page-break-after: auto;
                        }

                        .content-wrap {
                            flex: 1;
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

                        h2 {
                            color: #2c3e50;
                            border-bottom: 1px solid #ccc;
                            padding-bottom: 5px;
                            margin-top: 20px;
                            font-size: 16px;
                            text-transform: uppercase;
                        }

                        .info-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 15px;
                        }

                        .field {
                            margin-bottom: 8px;
                        }
                        
                        .label {
                            font-weight: bold;
                            color: #555;
                            display: block;
                            font-size: 10px;
                            text-transform: uppercase;
                        }
                        
                        .value {
                            font-size: 13px;
                            color: #000;
                            border-bottom: 1px dotted #ccc;
                            padding-bottom: 2px;
                            min-height: 18px;
                        }

                        /* Ficha Medica Styles */
                        .ficha-section {
                            margin-bottom: 15px;
                        }
                        
                        .checkbox-grid {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 10px;
                        }

                        .checkbox-item {
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        }

                        .footer {
                            position: absolute;
                            bottom: 1.5cm;
                            left: 1.5cm;
                            right: 1.5cm;
                            padding-top: 10px;
                            border-top: 1px solid #eee;
                            font-size: 10px;
                            color: #777;
                            display: flex;
                            justify-content: space-between;
                        }

                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <!-- PAGE 1: DATOS PERSONALES -->
                    <div class="page-container">
                        <div class="content-wrap">
                            <div class="header">
                                <img src="/logo-curare.png" alt="Curare Centro Dental">
                                <div>
                                    <h1>Ficha de Paciente</h1>
                                </div>
                            </div>

                            <div class="info-grid">
                                <div class="field"><span class="label">Nombres</span><div class="value">${fullPaciente.nombre}</div></div>
                                <div class="field"><span class="label">Apellido Paterno</span><div class="value">${fullPaciente.paterno}</div></div>
                                <div class="field"><span class="label">Apellido Materno</span><div class="value">${fullPaciente.materno}</div></div>
                                <div class="field"><span class="label">Fecha Nacimiento</span><div class="value">${formatDate(fullPaciente.fecha_nacimiento)}</div></div>
                                <div class="field"><span class="label">CI / Documento</span><div class="value">${fullPaciente.nomenclatura || '-'}</div></div>
                                <div class="field"><span class="label">Celular</span><div class="value">${fullPaciente.celular}</div></div>
                                <div class="field"><span class="label">Teléfono</span><div class="value">${fullPaciente.telefono || '-'}</div></div>
                                <div class="field"><span class="label">Dirección</span><div class="value">${fullPaciente.direccion}</div></div>
                                <div class="field"><span class="label">Email</span><div class="value">${fullPaciente.email || '-'}</div></div>
                                <div class="field"><span class="label">Estado Civil</span><div class="value">${fullPaciente.estado_civil || '-'}</div></div>
                                <div class="field"><span class="label">Profesión / Ocupación</span><div class="value">${fullPaciente.profesion || '-'}</div></div>
                                <div class="field"><span class="label">Casilla</span><div class="value">${fullPaciente.casilla || '-'}</div></div>
                                
                                <!-- Trabajo -->
                                <div class="field"><span class="label">Dirección Oficina</span><div class="value">${fullPaciente.direccion_oficina || '-'}</div></div>
                                <div class="field"><span class="label">Teléfono Oficina</span><div class="value">${fullPaciente.telefono_oficina || '-'}</div></div>

                                <!-- Seguro -->
                                <div class="field"><span class="label">Seguro Médico</span><div class="value">${fullPaciente.seguro_medico || '-'}</div></div>
                                <div class="field"><span class="label">Póliza</span><div class="value">${fullPaciente.poliza || '-'}</div></div>

                                <!-- Responsable -->
                                <div class="field"><span class="label">Responsable</span><div class="value">${fullPaciente.responsable || '-'}</div></div>
                                <div class="field"><span class="label">Parentesco</span><div class="value">${fullPaciente.parentesco || '-'}</div></div>
                                <div class="field"><span class="label">Dirección Resp.</span><div class="value">${fullPaciente.direccion_responsable || '-'}</div></div>
                                <div class="field"><span class="label">Teléfono Resp.</span><div class="value">${fullPaciente.telefono_responsable || '-'}</div></div>
                                
                                <!-- Extra -->
                                <div class="field"><span class="label">Recomendado por</span><div class="value">${fullPaciente.recomendado || '-'}</div></div>
                                <div class="field"><span class="label">Tipo Paciente</span><div class="value">${fullPaciente.tipo_paciente || '-'}</div></div>
                            </div>
                        </div>

                        <div class="footer">
                            <div>Curare Centro Dental - Sistema de Gestión</div>
                            <div>Página 1 de 2</div>
                        </div>
                    </div>

                    <!-- PAGE 2: FICHA MEDICA -->
                    <div class="page-container">
                        <div class="content-wrap" style="display: flex; flex-direction: column;">
                            <div class="header">
                                <img src="/logo-curare.png" alt="Curare Centro Dental">
                                <div>
                                    <h1>Ficha Médica</h1>
                                </div>
                            </div>

                            ${ficha ? `
                                <div class="ficha-section">
                                    <h2>Antecedentes Médicos</h2>
                                    <div class="checkbox-grid">
                                        <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.alergia_anestesicos)}</span> Alergia Anestésicos</div>
                                        <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.alergias_drogas)}</span> Alergia Drogas</div>
                                        <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.hepatitis)}</span> Hepatitis</div>
                                        <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.asma)}</span> Asma</div>
                                        <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.diabetes)}</span> Diabetes</div>
                                        <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.dolencia_cardiaca)}</span> Dolencia Cardíaca</div>
                                        <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.hipertension)}</span> Hipertensión</div>
                                        <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.fiebre_reumatica)}</span> Fiebre Reumática</div>
                                        <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.diatesis_hemorragia)}</span> Diátesis Hemorragia</div>
                                        <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.sinusitis)}</span> Sinusitis</div>
                                        <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.ulcera_gastroduodenal)}</span> Úlcera Gastroduodenal</div>
                                        <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.enfermedades_tiroides)}</span> Enf. Tiroides</div>
                                    </div>
                                </div>

                                <div class="info-grid" style="margin-top: 20px;">
                                    <div class="field"><span class="label">Médico de Cabecera</span><div class="value">${ficha.medico_cabecera || '-'}</div></div>
                                    <div class="field"><span class="label">Enfermedad Actual</span><div class="value">${ficha.enfermedad_actual || '-'}</div></div>
                                    <div class="field"><span class="label">Toma Medicamentos</span><div class="value">${check(ficha.toma_medicamentos)}</div></div>
                                    <div class="field"><span class="label">Detalle Medicamentos</span><div class="value">${ficha.medicamentos_detalle || '-'}</div></div>
                                    <div class="field"><span class="label">Tratamiento Actual</span><div class="value">${ficha.tratamiento || '-'}</div></div>
                                    <div class="field" style="grid-column: span 2;"><span class="label">Observaciones Médicas</span><div class="value">${ficha.observaciones || '-'}</div></div>
                                </div>

                                <h2>Antecedentes Odontológicos</h2>
                                <div class="info-grid">
                                    <div class="field"><span class="label">Última Consulta</span><div class="value">${ficha.ultima_consulta || '-'}</div></div>
                                    <div class="field"><span class="label">Frecuencia Cepillado</span><div class="value">${ficha.frecuencia_cepillado || '-'}</div></div>
                                </div>
                                
                                <div class="checkbox-grid" style="margin-top: 10px;">
                                    <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.usa_cepillo)}</span> Usa Cepillo</div>
                                    <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.usa_hilo_dental)}</span> Usa Hilo Dental</div>
                                    <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.usa_enjuague)}</span> Usa Enjuague</div>
                                    <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.mal_aliento)}</span> Mal Aliento</div>
                                    <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.sangra_encias)}</span> Sangra Encías</div>
                                    <div class="checkbox-item"><span style="font-size: 16px;">${checkIcon(ficha.dolor_cara)}</span> Dolor Cara</div>
                                </div>
                                
                                <div class="info-grid" style="margin-top: 20px;">
                                     <div class="field"><span class="label">Causa Mal Aliento</span><div class="value">${ficha.causa_mal_aliento || '-'}</div></div>
                                     <div class="field" style="grid-column: span 2;"><span class="label">Comentarios / Quejas Principales</span><div class="value">${ficha.comentarios || '-'}</div></div>
                                </div>

                            ` : '<p style="text-align: center; margin-top: 50px; font-style: italic;">No se ha registrado ficha médica para este paciente.</p>'}

                            <div class="signature-section" style="margin-top: auto; padding-bottom: 1cm; text-align: center;">
                                <div style="display: inline-block; text-align: center;">
                                    <div style="border-top: 1px solid #333; width: 250px; margin-bottom: 5px;"></div>
                                    <div style="font-weight: bold;">Firma del Paciente</div>
                                    <div style="font-size: 10px;">${fullPaciente.nombre} ${fullPaciente.paterno}</div>
                                </div>
                            </div>
                        </div>

                        <div class="footer">
                            <div>Curare Centro Dental - Sistema de Gestión</div>
                            <div>Página 2 de 2</div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            doc.open();
            doc.write(printContent);
            doc.close();

            // Wait for images to load (like logo) before printing
            // Wait for images to load (like logo) before printing
            const logo = doc.querySelector('img');
            let printTriggered = false;

            const doPrint = () => {
                if (printTriggered) return;
                printTriggered = true;

                if (Swal.isVisible()) Swal.close();

                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error('Print error:', e);
                }

                // Remove iframe after sufficient time
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 2000);
            };

            if (logo) {
                if (logo.complete) {
                    doPrint();
                } else {
                    logo.onload = doPrint;
                    logo.onerror = doPrint;
                }

                // Fallback if image fails or takes too long
                setTimeout(doPrint, 2000);
            } else {
                doPrint();
            }

        } catch (error) {
            console.error('Error al imprimir ficha de paciente:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar la información del paciente para imprimir.'
            });
        }
    };


    return (
        <div className="content-card">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 no-print gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                    Lista de Pacientes
                </h2>
                <div className="flex gap-2 flex-wrap justify-center">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg> Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg> PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg> Imprimir
                    </button>
                    <button
                        onClick={() => navigate('/pacientes/create')}
                        className="bg-[#3498db] hover:bg-blue-600 text-white hover:text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5"
                    >
                        <span className="text-xl">+</span> Nuevo Paciente
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="relative flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, paterno o materno..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
                {searchTerm && (
                    <button
                        onClick={handleClearSearch}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                    >
                        Limpiar
                    </button>
                )}
            </div>

            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Mostrando {pacientes.length} de {totalRecords} resultados
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Celular</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Nacimiento</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoría</th>
                            <th className="no-print px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Procesos</th>
                            <th className="no-print px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {Array.isArray(pacientes) && pacientes.map((paciente, index) => (
                            <tr key={paciente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{`${paciente.paterno} ${paciente.materno} ${paciente.nombre}`}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{formatDate(paciente.fecha)}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{formatCelular(paciente.celular)}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{formatDate(paciente.fecha_nacimiento)}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${paciente.estado === 'activo'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                        {paciente.estado}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">
                                    {paciente.categoria ? (
                                        <div className="flex items-center gap-2">
                                            <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: paciente.categoria.color }} title={paciente.categoria.descripcion}></div>
                                            <span>{paciente.categoria.sigla}</span>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="no-print p-3">
                                    <div className="flex gap-1.5 flex-wrap">
                                        <button
                                            onClick={() => navigate(`/pacientes/${paciente.id}/presupuestos`)}
                                            className="px-3 py-1.5 bg-[#1abc9c] hover:bg-[#16a085] text-white rounded-lg text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Presupuestos"
                                        >
                                            💰
                                        </button>
                                        <button
                                            onClick={() => navigate(`/pacientes/${paciente.id}/propuestas`)}
                                            className="px-3 py-1.5 bg-purple-600 hover:bg-[#8e44ad] text-white rounded-lg text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Propuestas"
                                        >
                                            📑
                                        </button>
                                        <button
                                            onClick={() => navigate(`/pacientes/${paciente.id}/historia-clinica`)}
                                            className="px-3 py-1.5 bg-[#34495e] hover:bg-[#2c3e50] text-white rounded-lg text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Historia Clínica"
                                        >
                                            📋
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedPacienteIdForImages(paciente.id);
                                                setShowImagenesModal(true);
                                            }}
                                            className="px-3 py-1.5 bg-[#e67e22] hover:bg-[#d35400] text-white rounded-lg text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Imágenes"
                                        >
                                            📷
                                        </button>
                                    </div>
                                </td>
                                <td className="no-print p-3 flex gap-2">
                                    <button
                                        onClick={() => navigate(`/pacientes/edit/${paciente.id}`)}
                                        className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handlePrintPaciente(paciente)}
                                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Imprimir Ficha"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                            <rect x="6" y="14" width="12" height="8"></rect>
                                        </svg>
                                    </button>
                                    {paciente.estado === 'activo' ? (
                                        <button
                                            onClick={() => handleDelete(paciente.id)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Dar de baja"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivate(paciente.id)}
                                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Reactivar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {(!pacientes || pacientes.length === 0) && (
                            <tr>
                                <td colSpan={9} className="p-5 text-center text-gray-500 dark:text-gray-400">No hay pacientes registrados</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Pacientes"
                sections={manualSections}
            />
            <PacienteImagenesModal
                isOpen={showImagenesModal}
                onClose={() => setShowImagenesModal(false)}
                pacienteId={selectedPacienteIdForImages}
            />
        </div>
    );
};

export default PacienteList;
