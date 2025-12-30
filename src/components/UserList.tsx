import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import PermisosModal from './PermisosModal';
import type { User } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';

interface PaginatedResponse {
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const UserList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [showPermisosModal, setShowPermisosModal] = useState(false);
    const [selectedUserForPermisos, setSelectedUserForPermisos] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0); // Fixed variable name from 'total' to match state if needed, but it seems correct.
    const [showManual, setShowManual] = useState(false);
    const limit = 5;

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Usuarios',
            content: 'Control de acceso al sistema. Cree usuarios para Doctores, Recepcionistas o Administradores.'
        },
        {
            title: 'Agregar Usuario',
            content: 'Use el botón azul "+ Nuevo Usuario". Puede asignar si es Recepcionista (vista limitada) o asignar un Código Proforma.'
        },
        {
            title: 'Permisos y Restricciones',
            content: 'El botón gris con candado permite configurar detalladamente a qué módulos tiene acceso cada usuario.'
        },
        {
            title: 'Estado',
            content: 'Haga clic en la etiqueta "Activo/Inactivo" en la tabla para cambiar rápidamente el acceso del usuario sin eliminarlo.'
        }
    ];

    useEffect(() => {
        fetchUsers();
    }, [currentPage, searchTerm]);

    const fetchUsers = async () => {
        try {
            // Note: Assuming backend supports pagination/search for users similar to doctors.
            // If not, we might need to adjust this or implement client-side pagination temporarily.
            // For now, I will implement it assuming the backend is ready or will be ready.
            // If the backend doesn't support it yet, this might break, but the request implies parity.
            // However, looking at the previous UserList, it was a simple get('/users').
            // I will try to use the same pattern as DoctorList.

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            // Fallback to simple get if pagination endpoint isn't ready? 
            // The user asked to "Apply the same tools", implying backend support or need for it.
            // Since I can't see backend code for Users controller easily without searching, 
            // I'll assume standard parity. If it fails, I'll fix it.
            // Actually, let's check if I should implement client-side pagination if backend doesn't support it.
            // Given the user wants "same tools", I'll assume full stack parity.

            const response = await api.get<PaginatedResponse | User[]>(`/users?${params}`);

            if (Array.isArray(response.data)) {
                // Handle case where backend returns plain array (no pagination yet)
                // Implement client-side pagination/search for now to ensure it works immediately
                let filtered = response.data;
                if (searchTerm) {
                    const lowerTerm = searchTerm.toLowerCase();
                    filtered = filtered.filter(u =>
                        u.name.toLowerCase().includes(lowerTerm) ||
                        u.email.toLowerCase().includes(lowerTerm)
                    );
                }
                setTotal(filtered.length);
                setTotalPages(Math.ceil(filtered.length / limit));

                const start = (currentPage - 1) * limit;
                setUsers(filtered.slice(start, start + limit));
            } else {
                // Backend supports pagination
                setUsers(response.data?.data || []);
                setTotalPages(response.data?.totalPages || 1);
                setTotal(response.data?.total || 0);
            }

        } catch (error) {
            console.error('Error fetching users:', error);
            // alert('Error al cargar los usuarios'); // Optional: suppress initial error if backend is adjusting
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los usuarios'
            });
        }
    };



    const handleStatusChange = async (user: User) => {
        try {
            // Assuming 'estado' can be toggled between 'Activo' and 'Inactivo'
            const newStatus = user.estado === 'Activo' ? 'Inactivo' : 'Activo';
            await api.patch(`/users/${user.id}/status`, { estado: newStatus });
            setUsers(
                users.map((u) =>
                    u.id === user.id ? { ...u, estado: newStatus } : u
                )
            );
            Swal.fire({
                icon: 'success',
                title: 'Estado Actualizado',
                text: `Usuario ${newStatus === 'Activo' ? 'activado' : 'desactivado'} correctamente`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error updating user status:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al actualizar estado del usuario'
            });
        }
    };

    const handleDelete = async (user: User) => {
        const result = await Swal.fire({
            title: '¿Dar de baja usuario?',
            text: `El usuario ${user.name} pasará a estado Inactivo.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/users/${user.id}`, { estado: 'Inactivo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Usuario dado de baja!',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchUsers(); // Refresh the list
            } catch (error) {
                console.error('Error updating user status:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo dar de baja el usuario'
                });
            }
        }
    };

    const handleReactivate = async (user: User) => {
        const result = await Swal.fire({
            title: '¿Reactivar usuario?',
            text: `El usuario ${user.name} volverá a estar activo.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/users/${user.id}`, { estado: 'Activo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Usuario reactivado!',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchUsers(); // Refresh the list
            } catch (error) {
                console.error('Error reactivating user:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo reactivar el usuario'
                });
            }
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const exportToExcel = () => {
        try {
            const excelData = users.map(user => ({
                'ID': user.id,
                'Nombre': user.name,
                'Email': user.email,
                'Estado': user.estado,
                'Recepcionista': user.recepcionista ? 'Si' : 'No',
                'Código Proforma': user.codigo_proforma || ''
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

            const date = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `usuarios_${date}.xlsx`);
        } catch (error) {
            alert('Error al exportar a Excel');
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text('Lista de Usuarios', 14, 22);

            const date = new Date().toLocaleDateString('es-ES');
            doc.setFontSize(10);
            doc.text(`Fecha: ${date}`, 14, 30);

            const tableData = users.map(user => [
                user.id,
                user.name,
                user.email,
                user.estado,
                user.recepcionista ? 'Si' : 'No',
                user.codigo_proforma || ''
            ]);

            autoTable(doc, {
                head: [['ID', 'Nombre', 'Email', 'Estado', 'Recep.', 'Cod. Prof.']],
                body: tableData,
                startY: 35,
                styles: { fontSize: 10 },
                headStyles: { fillColor: [52, 152, 219] }
            });

            doc.save(`usuarios_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            alert('Error al exportar a PDF');
        }
    };

    const handlePrint = async () => {
        try {
            // Fetch ALL records for printing
            const params = new URLSearchParams({
                page: '1',
                limit: '9999'
            });
            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await api.get<PaginatedResponse | User[]>(`/users?${params}`);
            let allUsers: User[] = [];

            if (Array.isArray(response.data)) {
                allUsers = response.data;
                if (searchTerm) {
                    const lowerTerm = searchTerm.toLowerCase();
                    allUsers = allUsers.filter(u =>
                        u.name.toLowerCase().includes(lowerTerm) ||
                        u.email.toLowerCase().includes(lowerTerm)
                    );
                }
            } else {
                allUsers = response.data?.data || [];
            }

            const printWindow = window.open('', '_blank');
            if (!printWindow) return;

            const printDate = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Lista de Usuarios</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 2cm 1.5cm 3cm 1.5cm;
                        }
                        
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            padding-bottom: 60px;
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
                            font-size: 11px;
                        }
                        
                        th {
                            background-color: #3498db;
                            color: white;
                            padding: 10px 8px;
                            text-align: left;
                            font-weight: bold;
                            border: 1px solid #2980b9;
                        }
                        
                        td {
                            padding: 8px;
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
                            padding: 10px 1.5cm;
                            background: white;
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
                        <h1>Lista de Usuarios</h1>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Estado</th>
                                <th>Recep.</th>
                                <th>Cod. Prof.</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allUsers.map((user: User) => `
                                <tr>
                                    <td>${user.id}</td>
                                    <td>${user.name}</td>
                                    <td>${user.email}</td>
                                    <td class="${user.estado === 'Activo' ? 'status-active' : 'status-inactive'}">
                                        ${user.estado}
                                    </td>
                                    <td>${user.recepcionista ? 'Si' : 'No'}</td>
                                    <td>${user.codigo_proforma || '-'}</td>
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

            printWindow.document.write(printContent);
            printWindow.document.close();

            setTimeout(() => {
                printWindow.print();
                printWindow.onafterprint = () => {
                    printWindow.close();
                };
                setTimeout(() => {
                    if (!printWindow.closed) {
                        printWindow.close();
                    }
                }, 1000);
            }, 500);
        } catch (error) {
            console.error('Error al imprimir:', error);
            Swal.fire('Error', 'Error al generar el documento de impresión', 'error');
        }
    };



    return (
        <div className="content-card">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 no-print gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                    Lista de Usuarios
                </h2>
                <div className="flex gap-2">
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
                    <Link
                        to="/users/create"
                        className="bg-[#3498db] hover:bg-blue-600 text-white hover:text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5"
                    >
                        <span className="text-xl">+</span> Nuevo Usuario
                    </Link>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="relative flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
                {searchTerm && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setCurrentPage(1);
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                    >
                        Limpiar
                    </button>
                )}
            </div>

            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Mostrando {users.length} de {total} resultados
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Foto</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {Array.isArray(users) && users.map((user, index) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-3">
                                    {user.foto ? (
                                        <img src={user.foto} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                    )}
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{user.name}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{user.email}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">
                                    <span
                                        onClick={() => handleStatusChange(user)}
                                        className={`px-2 py-1 rounded text-sm font-medium cursor-pointer ${user.estado === 'Activo'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}
                                    >
                                        {user.estado}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <Link
                                        to={`/users/edit/${user.id}`}
                                        className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setSelectedUserForPermisos(user);
                                            setShowPermisosModal(true);
                                        }}
                                        className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Restricciones de Acceso"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    {user.estado === 'Activo' ? (
                                        <button
                                            onClick={() => handleDelete(user)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Dar de baja"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivate(user)}
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
                    </tbody>
                </table>
            </div>

            {
                users.length === 0 && (
                    <p className="text-center mt-5 text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'No se encontraron resultados' : 'No hay usuarios registrados'}
                    </p>
                )
            }

            {
                totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                )
            }


            {showPermisosModal && selectedUserForPermisos && (
                <PermisosModal
                    user={selectedUserForPermisos}
                    isOpen={showPermisosModal}
                    onClose={() => setShowPermisosModal(false)}
                    onSave={() => {
                        fetchUsers(); // Refresh to get updated permissions
                    }}
                />
            )}

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Usuarios"
                sections={manualSections}
            />
        </div>
    );
};

export default UserList;
