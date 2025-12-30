import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Doctor, Especialidad } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';

const DoctorForm: React.FC = () => {
    const [formData, setFormData] = useState({
        paterno: '',
        materno: '',
        nombre: '',
        celular: '',
        direccion: '',
        estado: 'activo',
        idEspecialidad: 0
    });

    // New state for phone country code
    const [countryCode, setCountryCode] = useState('+591');
    const [localCelular, setLocalCelular] = useState('');

    const countryCodes = [
        { code: '+591', label: 'Bolivia (+591)' },
        { code: '+1', label: 'USA/Canadá (+1)' },
        { code: '+54', label: 'Argentina (+54)' },
        { code: '+55', label: 'Brasil (+55)' },
        { code: '+56', label: 'Chile (+56)' },
        { code: '+51', label: 'Perú (+51)' },
        { code: '+595', label: 'Paraguay (+595)' },
        { code: '+598', label: 'Uruguay (+598)' },
        { code: '+57', label: 'Colombia (+57)' },
        { code: '+52', label: 'México (+52)' },
        { code: '+34', label: 'España (+34)' },
        { code: '+0', label: 'Otro' },
    ];

    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Doctores',
            content: 'Registre la información de los doctores que trabajan en la clínica. Incluya datos personales, contacto, especialidad y estado.'
        },
        {
            title: 'Especialidad',
            content: 'Asigne una especialidad a cada doctor para facilitar la asignación de citas y seguimiento de tratamientos.'
        },
        {
            title: 'Estado del Doctor',
            content: 'Los doctores pueden estar activos o inactivos. Los doctores inactivos no aparecerán en las opciones de selección para nuevas citas.'
        }
    ];

    useEffect(() => {
        fetchEspecialidades();
        if (id) {
            api.get<Doctor>(`/doctors/${id}`)
                .then(response => {
                    const data = response.data;
                    setFormData({
                        ...data,
                        idEspecialidad: data.idEspecialidad || 0
                    });

                    // Handle splitting celular into code and number
                    if (data.celular) {
                        const foundCode = countryCodes.find(c => data.celular.startsWith(c.code));
                        if (foundCode && foundCode.code !== '+0') {
                            setCountryCode(foundCode.code);
                            setLocalCelular(data.celular.substring(foundCode.code.length));
                        } else {
                            if (data.celular.startsWith('+')) {
                                setCountryCode('+0');
                                setLocalCelular(data.celular);
                            } else {
                                setCountryCode('+591');
                                setLocalCelular(data.celular);
                            }
                        }
                    } else {
                        setCountryCode('+591');
                        setLocalCelular('');
                    }
                })
                .catch(error => {
                    console.error('Error fetching doctor:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Error al cargar el doctor'
                    });
                });
        } else {
            setCountryCode('+591');
            setLocalCelular('');
        }
    }, [id]);

    const fetchEspecialidades = async () => {
        try {
            const response = await api.get<{ data: Especialidad[] }>('/especialidad?limit=100');
            setEspecialidades(response.data.data);
        } catch (error) {
            console.error('Error fetching especialidades:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.name === 'idEspecialidad' ? Number(e.target.value) : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalCelular = countryCode === '+0' ? localCelular : `${countryCode}${localCelular}`;
            const payload = { ...formData, celular: finalCelular };

            if (id) {
                await api.patch(`/doctors/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Doctor Actualizado',
                    text: 'Doctor actualizado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/doctors', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Doctor Creado',
                    text: 'Doctor creado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            navigate('/doctors');
        } catch (error) {
            console.error('Error saving doctor:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar el doctor'
            });
        }
    };

    return (
        <div className="content-card max-w-[700px] mx-auto text-gray-800 dark:text-white">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <span className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-indigo-600 dark:text-indigo-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </span>
                    {id ? 'Editar Doctor' : 'Nuevo Doctor'}
                </h2>
                <button
                    type="button"
                    onClick={() => setShowManual(true)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Ayuda / Manual"
                >
                    ?
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-4">
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Apellido Paterno:</label>
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <input
                            type="text"
                            name="paterno"
                            value={formData.paterno}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Apellido Materno:</label>
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <input
                            type="text"
                            name="materno"
                            value={formData.materno}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Nombre:</label>
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Celular:</label>
                    <div className="flex gap-2">
                        <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-[140px]"
                        >
                            {countryCodes.map(c => (
                                <option key={c.code} value={c.code}>{c.label}</option>
                            ))}
                        </select>
                        <div className="relative flex-grow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            <input
                                type="text"
                                name="celular"
                                value={localCelular}
                                onChange={(e) => setLocalCelular(e.target.value)}
                                required
                                placeholder="Nro. Celular"
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Dirección:</label>
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <input
                            type="text"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Especialidad:</label>
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                        <select
                            name="idEspecialidad"
                            value={formData.idEspecialidad}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <option value="">Seleccione una especialidad</option>
                            {especialidades.map(esp => (
                                <option key={esp.id} value={esp.id}>
                                    {esp.especialidad}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Estado:</label>
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                            <line x1="12" y1="2" x2="12" y2="12"></line>
                        </svg>
                        <select
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        {id ? 'Actualizar' : 'Guardar'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/doctors')}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2">

                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg> Cancelar
                    </button>
                </div>
            </form>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Doctores"
                sections={manualSections}
            />
        </div>
    );
};

export default DoctorForm;
