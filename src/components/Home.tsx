import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Personal, GastoFijo, Inventario } from '../types';

import { getLocalDateString } from '../utils/dateUtils';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [birthdays, setBirthdays] = useState<Personal[]>([]);
    const [stats, setStats] = useState<{ totalPacientes: number, birthdayPacientes: any[] }>({ totalPacientes: 0, birthdayPacientes: [] });
    const [todayAppointmentsCount, setTodayAppointmentsCount] = useState(0);
    const [dueGastos, setDueGastos] = useState<GastoFijo[]>([]);
    const [labAlerts, setLabAlerts] = useState<any[]>([]);
    const [lowStockItems, setLowStockItems] = useState<Inventario[]>([]);

    // Permission Logic
    const userString = localStorage.getItem('user');
    let user = null;
    try {
        user = userString ? JSON.parse(userString) : null;
    } catch {
        user = null;
    }
    const permisos = (user && Array.isArray(user.permisos)) ? user.permisos : [];
    const hasAccess = (moduleId: string) => !permisos.includes(moduleId);

    useEffect(() => {
        fetchBirthdays();
        fetchStats();
        fetchTodayAppointments();
        fetchDueGastos();
        fetchLabAlerts();
        fetchLowStockItems();
        fetchNoRegistrados();
    }, []);

    const fetchTodayAppointments = async () => {
        try {
            const today = getLocalDateString();
            const response = await api.get(`/agenda?date=${today}`);
            if (response.data) {
                setTodayAppointmentsCount(response.data.length);
            }
        } catch (error) {
            console.error('Error fetching today appointments:', error);
        }
    };

    const fetchBirthdays = async () => {
        try {
            const response = await api.get<Personal[]>('/personal/birthdays');
            setBirthdays(response.data);
        } catch (error) {
            console.error('Error fetching birthdays:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/pacientes/dashboard-stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchDueGastos = async () => {
        try {
            const response = await api.get<GastoFijo[]>('/gastos-fijos');
            const gastos = response.data;
            const today = new Date();
            const currentDay = today.getDate();
            const currentMonth = today.toLocaleDateString('es-ES', { month: 'long' }).toLowerCase();

            const due = gastos.filter(gasto => {
                if (gasto.dia !== currentDay) return false;
                if (gasto.anual) {
                    return gasto.mes?.toLowerCase() === currentMonth;
                }
                return true; // Monthly expense matches day
            });
            setDueGastos(due);
        } catch (error) {
            console.error('Error fetching due expenses:', error);
        }
    };


    const calculateAge = (dateString: string) => {
        const birthDate = new Date(dateString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const fetchLabAlerts = async () => {
        try {
            const response = await api.get('/trabajos-laboratorios/alertas/terminados-sin-cita');
            setLabAlerts(response.data);
        } catch (error) {
            console.error('Error fetching lab alerts:', error);
        }
    };

    const fetchLowStockItems = async () => {
        try {
            const response = await api.get<Inventario[]>('/inventario/alertas/bajo-stock');
            setLowStockItems(response.data);
        } catch (error) {
            console.error('Error fetching low stock items:', error);
        }
    };

    const [noRegistrados, setNoRegistrados] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchNoRegistrados = async () => {
        try {
            const response = await api.get('/pacientes/no-registrados');
            setNoRegistrados(response.data);
        } catch (error) {
            console.error('Error fetching no registrados:', error);
        }
    };

    return (
        <div className="content-card bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm transition-colors duration-200">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 text-center">Bienvenido a CURARE</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 text-center mb-8">
                Sistema de Gestión de Consultorio Dental.
            </p>

            {/* Pacientes No Registrados Section */}
            {hasAccess('dashboard_pacientes_no_registrados') && noRegistrados.length > 0 && (
                <div className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-400 mb-4 flex items-center gap-2">
                        <span>⚠️</span> Pacientes Agendados (Atendidos) Sin Registro Hoy
                    </h2>
                    <div className="overflow-x-auto bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-200 dark:border-gray-500">
                                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Paciente</th>
                                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Fecha (cita)</th>
                                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Consultorio</th>
                                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Hora</th>
                                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                                {noRegistrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600/50 transition-colors">
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{item.nombre} {item.paterno} {item.materno}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{new Date(item.fecha).toLocaleDateString()}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{item.consultorio}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{item.hora}</td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => navigate(`/pacientes/${item.pacienteId}/historia-clinica`)}
                                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-all shadow-md transform hover:-translate-y-0.5"
                                            >
                                                Llenar Historia Clínica
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex justify-between items-center mt-4 px-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Mostrando {noRegistrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).length} de {noRegistrados.length} registros
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${currentPage === 1
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(noRegistrados.length / itemsPerPage)))}
                                    disabled={currentPage === Math.ceil(noRegistrados.length / itemsPerPage)}
                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${currentPage === Math.ceil(noRegistrados.length / itemsPerPage)
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Low Stock Alert Section */}
            {hasAccess('dashboard_stock_minimo') && lowStockItems.length > 0 && (
                <div className="mb-8 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                        <span>⚠️</span> Alerta de Stock Bajo
                    </h2>
                    <div className="space-y-3">
                        {lowStockItems.map(item => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{item.descripcion}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        Cantidad: <span className="font-bold text-red-500 dark:text-red-400">{item.cantidad_existente}</span> | Mínimo Requerido: {item.stock_minimo}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                                        Especialidad: {item.especialidad?.especialidad} | Grupo: {item.grupoInventario?.grupo}
                                    </p>
                                </div>
                                <div className="text-2xl text-red-500 dark:text-red-400">
                                    📉
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Expenses Due Today Section */}
            {hasAccess('dashboard_gastos_vencidos') && dueGastos.length > 0 && (
                <div className="mb-8 bg-pink-50 dark:bg-pink-900/20 border-l-4 border-pink-500 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-pink-700 dark:text-pink-400 mb-4 flex items-center gap-2">
                        <span>⚠️</span> Gastos Fijos por Pagar Hoy
                    </h2>
                    <div className="space-y-3">
                        {dueGastos.map(gasto => (
                            <div
                                key={gasto.id}
                                className="flex justify-between items-center bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                                        {gasto.gasto_fijo}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        Destino: {gasto.destino} - {gasto.monto} {gasto.moneda}
                                    </p>
                                </div>
                                <div className="text-2xl text-pink-500 dark:text-pink-400">
                                    💸
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Birthday Section */}
            {hasAccess('dashboard_cumpleanos') && birthdays.length > 0 && (
                <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
                        <span>🎉</span> Cumpleaños de Personal Hoy
                    </h2>
                    <div className="space-y-3">
                        {birthdays.map(person => (
                            <div
                                key={person.id}
                                className="flex justify-between items-center bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                                        {person.nombre} {person.paterno} {person.materno}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        Cumple {calculateAge(person.fecha_nacimiento)} años hoy
                                    </p>
                                </div>
                                <div className="text-3xl animate-bounce">
                                    🎂
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Patient Birthday Section */}
            {hasAccess('dashboard_cumpleanos') && stats.birthdayPacientes.length > 0 && (
                <div className="mb-8 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
                        <span>🎉</span> Cumpleaños de Pacientes Hoy
                    </h2>
                    <div className="space-y-3">
                        {stats.birthdayPacientes.map((paciente: any) => (
                            <div
                                key={paciente.id}
                                className="flex justify-between items-center bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                                        {paciente.nombre} {paciente.paterno} {paciente.materno}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        Cumple {calculateAge(paciente.fecha_nacimiento)} años hoy
                                    </p>
                                </div>
                                <div className="text-3xl animate-bounce">
                                    🎈
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Alertas Trabajos Laboratorio (Terminado Sin Cita) */}
            {hasAccess('dashboard_trabajos_pendientes') && labAlerts.length > 0 && (
                <div className="mb-8 bg-gray-100 dark:bg-gray-700/50 border-l-4 border-gray-500 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <span>⚠️</span> Trabajos Terminados Sin Cita
                    </h2>
                    <div className="space-y-3">
                        {labAlerts.map(work => (
                            <div
                                key={work.id}
                                className="flex flex-col gap-1 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div className="font-bold text-red-500 dark:text-red-400 mb-1">
                                    El siguiente trabajo de Laboratorio se encuentra en la Clínica, y el Paciente no tiene Cita Agendada
                                </div>
                                <div className="text-gray-800 dark:text-white">
                                    <span className="font-semibold">Laboratorio:</span> {work.laboratorio?.laboratorio}
                                </div>
                                <div className="text-gray-800 dark:text-white">
                                    <span className="font-semibold">Paciente:</span> {work.paciente?.nombre} {work.paciente?.paterno}
                                </div>
                                <div className="text-gray-800 dark:text-white">
                                    <span className="font-semibold">Trabajo:</span> {work.precioLaboratorio?.detalle} (Pieza: {work.pieza})
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Terminado el: {new Date(work.fecha_terminado).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-12 flex justify-center gap-6 flex-wrap">
                <div className="p-6 bg-blue-500 text-white rounded-xl w-52 text-center shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-1 duration-200">
                    <h3 className="mb-2 text-lg font-medium opacity-90">Pacientes</h3>
                    <p className="text-3xl font-bold">{stats.totalPacientes}</p>
                </div>
                {hasAccess('dashboard_citas_hoy') && (
                    <div className="p-6 bg-green-500 text-white rounded-xl w-52 text-center shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-1 duration-200">
                        <h3 className="mb-2 text-lg font-medium opacity-90">Citas Hoy</h3>
                        <p className="text-3xl font-bold">{todayAppointmentsCount}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
