import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AgendaView.css'; // Import custom overrides
import api from '../services/api';
import type { Agenda, Paciente } from '../types';
import AgendaForm from './AgendaForm';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import QuienAgendoModal from './QuienAgendoModal';

import { getLocalDateString } from '../utils/dateUtils';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const AgendaView: React.FC = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(getLocalDateString());
    const [dateValue, setDateValue] = useState<Value>(new Date());
    const [appointments, setAppointments] = useState<Agenda[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ time: string, consultorio: number } | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<Agenda | null>(null);

    // Patient Search State
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPacientes, setFilteredPacientes] = useState<Paciente[]>([]);
    const [showPatientResults, setShowPatientResults] = useState(false);
    const [patientHistory, setPatientHistory] = useState<Agenda[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<Paciente | null>(null);

    const [showManual, setShowManual] = useState(false);
    const [showQuienAgendoModal, setShowQuienAgendoModal] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Navegación',
            content: 'Utilice los botones "<<" y ">>" para moverse entre días, o "Hoy" para volver a la fecha actual. También puede seleccionar una fecha específica en el calendario lateral.'
        },
        {
            title: 'Agendar Cita',
            content: 'Haga clic en cualquier espacio vacío de la grilla para programar una nueva cita en ese horario y consultorio. Complete el formulario con los datos del paciente.'
        },
        {
            title: 'Gestión de Citas',
            content: 'Haga clic en una cita existente (celdas coloreadas) para ver detalles, editarla o cambiar su estado. Los colores indican: Azul (Agendado), Verde (Confirmado), Rojo (Cancelado), Gris (Atendido).'
        },
        {
            title: 'Búsqueda de Pacientes',
            content: 'Utilice el buscador en la barra lateral izquierda para encontrar pacientes y ver su historial completo de citas.'
        }
    ];

    // Generate time slots from 08:00 to 20:30
    const timeSlots: string[] = [];
    let startHour = 8;
    let startMinute = 0;
    while (startHour < 20 || (startHour === 20 && startMinute <= 30)) {
        const hourStr = startHour.toString().padStart(2, '0');
        const minStr = startMinute.toString().padStart(2, '0');
        timeSlots.push(`${hourStr}:${minStr}`);

        startMinute += 30;
        if (startMinute === 60) {
            startMinute = 0;
            startHour++;
        }
    }

    useEffect(() => {
        fetchAppointments();
        fetchPatients();
    }, [currentDate]);

    // Sync dateValue when currentDate changes (e.g. via prev/next buttons)
    useEffect(() => {
        const [year, month, day] = currentDate.split('-').map(Number);
        // Note: Month is 0-indexed in Date constructor, but 1-indexed in ISO string split? 
        // Actually ISO is YYYY-MM-DD. new Date(YYYY, MM-1, DD)
        setDateValue(new Date(year, month - 1, day));
    }, [currentDate]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredPacientes([]);
            setShowPatientResults(false);
        } else {
            const lowerComp = searchTerm.toLowerCase();
            const filtered = pacientes.filter(p =>
                p.nombre.toLowerCase().includes(lowerComp) ||
                p.paterno.toLowerCase().includes(lowerComp) ||
                p.materno?.toLowerCase().includes(lowerComp)
            );
            setFilteredPacientes(filtered.slice(0, 10)); // Limit to 10 results
            setShowPatientResults(true);
        }
    }, [searchTerm, pacientes]);

    const fetchPatients = async () => {
        try {
            const response = await api.get('/pacientes?limit=2000'); // Fetch enough patients
            setPacientes(Array.isArray(response.data.data) ? response.data.data : response.data);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const handlePatientSelect = async (patient: Paciente) => {
        setSearchTerm(`${patient.nombre} ${patient.paterno}`);
        setShowPatientResults(false);
        setSelectedPatientForHistory(patient);

        try {
            const response = await api.get(`/agenda/paciente/${patient.id}`);
            setPatientHistory(response.data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error('Error fetching patient history:', error);
            Swal.fire('Error', 'No se pudo obtener el historial del paciente', 'error');
        }
    };

    const fetchAppointments = async () => {
        try {
            const response = await api.get(`/agenda?date=${currentDate}`);
            setAppointments(response.data || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const handlePrevDay = () => {
        const date = new Date(currentDate + 'T00:00:00'); // Force local time interpretation
        date.setDate(date.getDate() - 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setCurrentDate(`${year}-${month}-${day}`);
    };

    const handleNextDay = () => {
        const date = new Date(currentDate + 'T00:00:00'); // Force local time interpretation
        date.setDate(date.getDate() + 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setCurrentDate(`${year}-${month}-${day}`);
    };

    const handleToday = () => {
        setCurrentDate(getLocalDateString());
    };

    const handleCalendarChange = (value: Value) => {
        if (value instanceof Date) {
            // Adjust for timezone offset to prevent day shift
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            setCurrentDate(`${year}-${month}-${day}`);
        }
    };

    const handleCellClick = (time: string, consultorio: number) => {
        const existing = getAppointmentForSlot(time, consultorio);
        if (existing) {
            setEditingAppointment(existing);
        } else {
            setEditingAppointment(null);
            setSelectedSlot({ time, consultorio });
        }
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setSelectedSlot(null);
        setEditingAppointment(null);
    };

    const handleFormSave = () => {
        fetchAppointments();
        handleFormClose();
    };

    const getAppointmentForSlot = (time: string, consultorio: number) => {
        return appointments.find(app => {
            const appTime = app.hora.substring(0, 5);
            // Exclude cancelled appointments from blocking the slot
            return appTime === time && app.consultorio === consultorio && app.estado !== 'cancelado';
        });
    };

    // Calculate which cells to skip rendering because they are covered by a rowspan
    const skipCells = new Set<string>();
    appointments.forEach(app => {
        // Skip cancelled appointments - they don't block time slots
        if (app.estado === 'cancelado') return;

        const duration = app.duracion || 30;
        const rowSpan = Math.ceil(duration / 30);
        if (rowSpan > 1) {
            const appTime = app.hora.substring(0, 5);
            const startIndex = timeSlots.indexOf(appTime);
            if (startIndex !== -1) {
                for (let i = 1; i < rowSpan; i++) {
                    if (startIndex + i < timeSlots.length) {
                        const nextTime = timeSlots[startIndex + i];
                        skipCells.add(`${nextTime}-${app.consultorio}`);
                    }
                }
            }
        }
    });

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    // ... imports remain the same

    // ... logic up to return

    return (
        <div className="flex flex-col md:flex-row gap-5 h-[85vh] p-2 md:p-5">

            {/* Sidebar Calendar - Hidden on mobile */}
            <div className="hidden md:flex w-[300px] flex-shrink-0 flex-col gap-5">

                {/* Patient Search Widget */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm relative border border-gray-100 dark:border-gray-700">
                    <h3 className="m-0 mb-2.5 text-base font-bold text-gray-800 dark:text-gray-200">Buscar Paciente</h3>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Nombre, Apellido o CI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {showPatientResults && filteredPacientes.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-b-lg shadow-lg z-50 max-h-[200px] overflow-y-auto">
                            {filteredPacientes.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => handlePatientSelect(p)}
                                    className="p-3 cursor-pointer border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-800 dark:text-gray-200"
                                >
                                    <strong>{p.nombre} {p.paterno}</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 calendar-wrapper">
                    <Calendar
                        onChange={handleCalendarChange}
                        value={dateValue}
                        locale="es-ES"
                        className="dark:bg-gray-800 dark:text-white dark:border-gray-700 w-full"
                        tileClassName={({ date, view }) => view === 'month' && date.toDateString() === new Date().toDateString() ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full' : 'hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full'}
                    />
                </div>
            </div>

            {/* Main Agenda Grid */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 gap-2">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <h2 className="m-0 text-lg sm:text-xl font-bold text-gray-900 dark:text-white">AGENDA</h2>
                        <button
                            onClick={() => setShowManual(true)}
                            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors shadow-sm text-sm"
                            title="Ayuda / Manual"
                        >
                            ?
                        </button>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <button
                            onClick={() => setShowQuienAgendoModal(true)}
                            className="px-2 sm:px-4 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded font-bold transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm shadow-md"
                            title="Buscar quién agendó"
                        >
                            Quien Agendó
                        </button>
                        <button
                            onClick={() => navigate('/recordatorio')}
                            className="px-2 sm:px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm shadow-md"
                            title="Gestionar recordatorios"
                        >
                            Recordatorio
                        </button>
                        <button
                            onClick={() => navigate('/contactos')}
                            className="px-2 sm:px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded font-bold transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm shadow-md"
                            title="Ver Contactos"
                        >
                            Contactos
                        </button>
                        <button
                            onClick={handleToday}
                            className="px-2 sm:px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm shadow-md"
                            title="Ir a hoy"
                        >
                            Hoy
                        </button>
                        <button
                            onClick={handlePrevDay}
                            className="px-2 sm:px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded font-bold transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm shadow-md"
                            title="Día anterior"
                        >
                            {'<<'}
                        </button>
                        <span className="text-sm sm:text-lg font-bold min-w-[90px] sm:min-w-[120px] text-center text-gray-800 dark:text-white">
                            {formatDateDisplay(currentDate)}
                        </span>
                        <button
                            onClick={handleNextDay}
                            className="px-2 sm:px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded font-bold transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm shadow-md"
                            title="Día siguiente"
                        >
                            {'>>'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-auto relative bg-white dark:bg-gray-800">
                    <table className="min-w-[800px] w-full border-collapse table-fixed">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10 shadow-sm">
                            <tr>
                                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center font-bold text-gray-700 dark:text-gray-200 w-20">HORA</th>
                                {[1, 2, 3, 4, 5].map(num => (
                                    <th key={num} className="border border-gray-300 dark:border-gray-600 p-2 text-center font-bold text-gray-700 dark:text-gray-200">CONSULTORIO #{num}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map(time => (
                                <tr key={time}>
                                    <td className="border border-gray-300 dark:border-gray-600 p-1 text-center bg-gray-50 dark:bg-gray-750 font-bold text-gray-600 dark:text-gray-400 text-sm align-middle">{time}</td>
                                    {[1, 2, 3, 4, 5].map(consultorio => {
                                        const cellKey = `${time}-${consultorio}`;
                                        if (skipCells.has(cellKey)) {
                                            return null;
                                        }

                                        const appointment = getAppointmentForSlot(time, consultorio);
                                        const rowSpan = appointment ? Math.ceil((appointment.duracion || 30) / 30) : 1;

                                        // Dynamic inline style for color only, classes for structure
                                        const bgColor = appointment
                                            ? (appointment.paciente?.categoria?.color || getStatusColor(appointment.estado))
                                            : undefined; // Let class handle default

                                        return (
                                            <td
                                                key={cellKey}
                                                rowSpan={rowSpan}
                                                className={`border border-gray-300 dark:border-gray-600 p-1 align-top cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-gray-700 ${!appointment ? 'bg-white dark:bg-gray-800' : ''}`}
                                                style={{
                                                    backgroundColor: bgColor,
                                                    height: appointment ? 'auto' : '40px'
                                                }}
                                                onClick={() => handleCellClick(time, consultorio)}
                                            >
                                                {appointment && (
                                                    <div className="h-full flex flex-col justify-center text-xs overflow-hidden text-white drop-shadow-md px-1 py-0.5 rounded-sm">
                                                        <div className="font-bold truncate">
                                                            {appointment.paciente ? (
                                                                `${appointment.paciente.paterno} ${appointment.paciente.nombre}`
                                                            ) : (
                                                                <span className="italic">
                                                                    {appointment.tratamiento || 'Bloqueo'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="truncate">{appointment.doctor ? `Dr. ${appointment.doctor.nombre}` : ''}</div>
                                                        {appointment.asistente && (
                                                            <div className="truncate text-[10px] opacity-90">
                                                                {appointment.asistente.nombre} {appointment.asistente.paterno}
                                                            </div>
                                                        )}
                                                        {appointment.paciente && appointment.tratamiento && ( // Only show treatment if patient exists and treatment is specified
                                                            <div className="text-[10px] italic mt-0.5 truncate opacity-90">
                                                                {appointment.tratamiento}
                                                            </div>
                                                        )}
                                                        <div className="text-[10px] mt-0.5 font-bold uppercase opacity-80">
                                                            {appointment.estado}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormOpen && (
                <AgendaForm
                    isOpen={isFormOpen}
                    onClose={handleFormClose}
                    onSave={handleFormSave}
                    initialData={editingAppointment}
                    defaultDate={currentDate}
                    defaultTime={selectedSlot?.time}
                    defaultConsultorio={selectedSlot?.consultorio}
                    existingAppointments={appointments}
                />
            )}

            {/* History Modal */}
            {showHistoryModal && selectedPatientForHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                    <div className="bg-white dark:bg-gray-800 w-[90%] max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white m-0">📅 Historial de Citas: {selectedPatientForHistory.nombre} {selectedPatientForHistory.paterno}</h2>
                        </div>
                        <div className="p-0 overflow-y-auto flex-1 dark:bg-gray-800">
                            {patientHistory.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 p-8">No hay citas registradas para este paciente.</p>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                        <tr>
                                            <th className="p-3 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-white">Fecha</th>
                                            <th className="p-3 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-white">Hora</th>
                                            <th className="p-3 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-white">Doctor</th>
                                            <th className="p-3 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-white">Tratamiento</th>
                                            <th className="p-3 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-white">Estado</th>
                                            <th className="p-3 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-white">Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {patientHistory.map((cita) => (
                                            <tr key={cita.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="p-3 text-gray-700 dark:text-gray-300">{new Date(cita.fecha + 'T00:00:00').toLocaleDateString()}</td>
                                                <td className="p-3 text-gray-700 dark:text-gray-300">{cita.hora ? cita.hora.substring(0, 5) : '-'}</td>
                                                <td className="p-3 text-gray-700 dark:text-gray-300">{cita.doctor ? `Dr. ${cita.doctor.nombre}` : '-'}</td>
                                                <td className="p-3 text-gray-700 dark:text-gray-300">{cita.tratamiento || '-'}</td>
                                                <td className="p-3">
                                                    <span className="px-2 py-1 rounded-full text-xs font-bold text-white shadow-sm" style={{ backgroundColor: getStatusColor(cita.estado) }}>
                                                        {cita.estado.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-gray-700 dark:text-gray-300 text-sm">
                                                    {cita.estado === 'cancelado' && cita.motivoCancelacion ? (
                                                        <span className="italic">{cita.motivoCancelacion}</span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-right">
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-sm font-medium transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Agenda"
                sections={manualSections}
            />

            <QuienAgendoModal
                isOpen={showQuienAgendoModal}
                onClose={() => setShowQuienAgendoModal(false)}
            />

            <style>{`
                /* Base Calendar Styles */
                .calendar-wrapper .react-calendar { 
                    border: none; 
                    font-family: inherit;
                    width: 100%;
                    background-color: white;
                    color: #1f2937;
                }
                
                .calendar-wrapper .react-calendar__navigation button {
                    min-width: 44px;
                    background: none;
                    color: #1f2937;
                }
                
                .calendar-wrapper .react-calendar__navigation__label {
                    font-weight: bold;
                }
                
                .calendar-wrapper .react-calendar__navigation button:enabled:hover,
                .calendar-wrapper .react-calendar__navigation button:enabled:focus {
                    background-color: #f3f4f6;
                }
                
                /* Light Mode Day Styles */
                .calendar-wrapper .react-calendar__month-view__days__day {
                    color: #374151;
                }
                
                .calendar-wrapper .react-calendar__month-view__days__day--weekend {
                    color: #dc2626;
                }
                
                .calendar-wrapper .react-calendar__month-view__days__day--neighboringMonth {
                    color: #9ca3af;
                }
                
                .calendar-wrapper .react-calendar__tile:enabled:hover,
                .calendar-wrapper .react-calendar__tile:enabled:focus {
                    background-color: #f3f4f6;
                }
                
                .calendar-wrapper .react-calendar__tile--now {
                    background: #fef3c7;
                    color: #92400e;
                    font-weight: bold;
                }
                
                .calendar-wrapper .react-calendar__tile--now:enabled:hover,
                .calendar-wrapper .react-calendar__tile--now:enabled:focus {
                    background: #fde68a;
                }
                
                .calendar-wrapper .react-calendar__tile--active {
                    background: #3b82f6;
                    color: white;
                    font-weight: bold;
                }
                
                .calendar-wrapper .react-calendar__tile--active:enabled:hover,
                .calendar-wrapper .react-calendar__tile--active:enabled:focus {
                    background: #2563eb;
                }
                
                /* Dark Mode Calendar Styles */
                .dark .calendar-wrapper .react-calendar {
                    background-color: #1f2937;
                    color: white;
                }
                
                .dark .calendar-wrapper .react-calendar__navigation button {
                    color: white;
                }
                
                .dark .calendar-wrapper .react-calendar__navigation button:enabled:hover,
                .dark .calendar-wrapper .react-calendar__navigation button:enabled:focus {
                    background-color: #374151;
                }
                
                .dark .calendar-wrapper .react-calendar__month-view__days__day {
                    color: #d1d5db;
                }
                
                .dark .calendar-wrapper .react-calendar__month-view__days__day--weekend {
                    color: #f87171;
                }
                
                .dark .calendar-wrapper .react-calendar__month-view__days__day--neighboringMonth {
                    color: #6b7280;
                }
                
                .dark .calendar-wrapper .react-calendar__tile:enabled:hover,
                .dark .calendar-wrapper .react-calendar__tile:enabled:focus {
                    background-color: #374151;
                }
                
                .dark .calendar-wrapper .react-calendar__tile--now {
                    background: #eab308;
                    color: black;
                    font-weight: bold;
                }
                
                .dark .calendar-wrapper .react-calendar__tile--now:enabled:hover,
                .dark .calendar-wrapper .react-calendar__tile--now:enabled:focus {
                    background: #ca8a04;
                }
                
                .dark .calendar-wrapper .react-calendar__tile--active {
                    background: #2563eb;
                    color: white;
                    font-weight: bold;
                }
                
                .dark .calendar-wrapper .react-calendar__tile--active:enabled:hover,
                .dark .calendar-wrapper .react-calendar__tile--active:enabled:focus {
                    background: #1d4ed8;
                }
            `}</style>

        </div>
    );
};

const getStatusColor = (estado: string) => {
    switch (estado) {
        case 'agendado': return '#3498db'; // Blue
        case 'confirmado': return '#2ecc71'; // Green
        case 'cancelado': return '#e74c3c'; // Red
        case 'atendido': return '#95a5a6'; // Gray
        default: return '#f1c40f'; // Yellow
    }
};

export default AgendaView;
