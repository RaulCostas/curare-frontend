import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import MusicaTelevisionTab from './MusicaTelevisionTab';

const PacienteForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const [activeTab, setActiveTab] = useState('datos');
    const [showManual, setShowManual] = useState(false);
    const [selectedMusicas, setSelectedMusicas] = useState<number[]>([]);
    const [selectedTelevisiones, setSelectedTelevisiones] = useState<number[]>([]);

    const manualSections: ManualSection[] = [
        {
            title: 'Registro de Pacientes',
            content: 'Complete los datos personales, de contacto y médicos del paciente. Use las pestañas para organizar la información. El formulario cuenta con 3 pestañas: Datos Personales, Ficha Médica y Música/Televisión.'
        },
        {
            title: 'Ficha Médica',
            content: 'Registre el historial médico del paciente, incluyendo alergias, enfermedades crónicas y medicamentos. Esta información es crucial para la atención odontológica segura.'
        },
        {
            title: 'Categoría y Tipo',
            content: 'Asigne una categoría al paciente (ej: VIP, Regular) y defina si es Particular o de Seguro para aplicar tarifas correctas.'
        },
        {
            title: 'Música / Televisión',
            content: 'Configure las preferencias de música y televisión del paciente para personalizar su experiencia durante los tratamientos. Las selecciones se guardan automáticamente al marcar/desmarcar las opciones.'
        },
        {
            title: 'Guardado de Datos',
            content: 'Use el botón "Guardar" al final del formulario para guardar los datos personales y la ficha médica. Las preferencias de música/TV se guardan automáticamente al seleccionarlas. Puede cancelar en cualquier momento con el botón "Cancelar".'
        }
    ];

    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        paterno: '',
        materno: '',
        nombre: '',
        direccion: '',
        telefono: '',
        celular: '',
        email: '',
        casilla: '',
        profesion: '',
        estado_civil: '',
        direccion_oficina: '',
        telefono_oficina: '',
        fecha_nacimiento: '',
        sexo: '',
        seguro_medico: '',
        poliza: '',
        recomendado: '',
        responsable: '',
        parentesco: '',
        direccion_responsable: '',
        telefono_responsable: '',
        idCategoria: 0,
        tipo_paciente: '',
        motivo: '',
        nomenclatura: '',
        estado: 'activo',
        // Ficha Medica
        fichaMedica: {
            alergia_anestesicos: false,
            alergias_drogas: false,
            hepatitis: false,
            asma: false,
            diabetes: false,
            dolencia_cardiaca: false,
            hipertension: false,
            fiebre_reumatica: false,
            diatesis_hemorragia: false,
            sinusitis: false,
            ulcera_gastroduodenal: false,
            enfermedades_tiroides: false,
            observaciones: '',
            medico_cabecera: '',
            enfermedad_actual: '',
            toma_medicamentos: false,
            medicamentos_detalle: '',
            tratamiento: '',
            ultima_consulta: '',
            frecuencia_cepillado: '',
            usa_cepillo: false,
            usa_hilo_dental: false,
            usa_enjuague: false,
            mal_aliento: false,
            causa_mal_aliento: '',
            sangra_encias: false,
            dolor_cara: false,
            comentarios: ''
        }
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

    useEffect(() => {
        if (isEditing) {
            fetchPaciente();
        }
    }, [id]);

    const fetchPaciente = async () => {
        try {
            const response = await api.get(`/pacientes/${id}`);
            const data = response.data;
            console.log('Fetched paciente data:', data);

            // Ensure idCategoria is set correctly
            if (data.categoria && !data.idCategoria) {
                data.idCategoria = data.categoria.id;
            }
            if (!data.idCategoria) {
                data.idCategoria = 0;
            }

            // Initialize fichaMedica if missing
            if (!data.fichaMedica) {
                data.fichaMedica = { ...formData.fichaMedica };
            }

            setFormData(data);

            // Handle splitting celular into code and number
            if (data.celular) {
                // Check if it starts with any known code
                const foundCode = countryCodes.find(c => data.celular.startsWith(c.code));
                if (foundCode && foundCode.code !== '+0') {
                    setCountryCode(foundCode.code);
                    setLocalCelular(data.celular.substring(foundCode.code.length));
                } else {
                    // Try to guess or just set generic
                    if (data.celular.startsWith('+')) {
                        // It has a code but maybe not in our list, or is custom
                        setCountryCode('+0');
                        setLocalCelular(data.celular);
                    } else {
                        // Assuming default or old data without code
                        setCountryCode('+591');
                        setLocalCelular(data.celular);
                    }
                }
            } else {
                setCountryCode('+591');
                setLocalCelular('');
            }
        } catch (error) {
            console.error('Error fetching paciente:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar el paciente'
            });
        }
    };

    const [categorias, setCategorias] = useState<any[]>([]);

    useEffect(() => {
        fetchCategorias();
    }, []);

    const fetchCategorias = async () => {
        try {
            const response = await api.get('/categoria-paciente?limit=100');
            const activeCategorias = (response.data.data || []).filter((cat: any) => cat.estado === 'activo');
            setCategorias(activeCategorias);
        } catch (error) {
            console.error('Error fetching categorias:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (name.startsWith('fichaMedica.')) {
            const field = name.split('.')[1];
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                fichaMedica: {
                    ...prev.fichaMedica,
                    [field]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'idCategoria' ? Number(value) : value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalCelular = countryCode === '+0' ? localCelular : `${countryCode}${localCelular}`;

            const payload = {
                ...formData,
                celular: finalCelular,
                idCategoria: formData.idCategoria === 0 ? null : formData.idCategoria
            };
            console.log('Submitting payload:', payload);

            if (isEditing) {
                await api.patch(`/pacientes/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Paciente Actualizado',
                    text: 'Paciente actualizado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                const response = await api.post('/pacientes', payload);
                const newPacienteId = response.data.id;

                // Guardar preferencias de música y TV si existen
                if (selectedMusicas.length > 0) {
                    await api.post(`/pacientes/${newPacienteId}/musica`, { musicaIds: selectedMusicas });
                }
                if (selectedTelevisiones.length > 0) {
                    await api.post(`/pacientes/${newPacienteId}/television`, { televisionIds: selectedTelevisiones });
                }

                await Swal.fire({
                    icon: 'success',
                    title: 'Paciente Creado',
                    text: 'Paciente creado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            navigate('/pacientes');
        } catch (error: any) {
            console.error('Error saving paciente:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar el paciente';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
            });
        }
    };

    return (
        <div className="content-card max-w-[700px] mx-auto text-gray-800 dark:text-white">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </span>
                    {isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}
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

            {/* Tabs Navigation matching the standard model */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-5 bg-white dark:bg-gray-800 rounded-t-lg px-2 pt-2">
                <button
                    type="button"
                    onClick={() => setActiveTab('datos')}
                    className={`px-5 py-2.5 cursor-pointer border-b-4 flex items-center gap-2 transition-all duration-200 text-base ${activeTab === 'datos'
                        ? 'border-blue-500 text-blue-500 font-bold bg-gray-50 dark:bg-gray-700 rounded-t'
                        : 'border-transparent text-gray-600 dark:text-gray-400 font-normal bg-gray-200 dark:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Datos Personales
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('ficha')}
                    className={`px-5 py-2.5 cursor-pointer border-b-4 flex items-center gap-2 transition-all duration-200 text-base ${activeTab === 'ficha'
                        ? 'border-blue-500 text-blue-500 font-bold bg-gray-50 dark:bg-gray-700 rounded-t'
                        : 'border-transparent text-gray-600 dark:text-gray-400 font-normal bg-gray-200 dark:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Ficha Médica
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('musica-tv')}
                    className={`px-5 py-2.5 cursor-pointer border-b-4 flex items-center gap-2 transition-all duration-200 text-base ${activeTab === 'musica-tv'
                        ? 'border-blue-500 text-blue-500 font-bold bg-gray-50 dark:bg-gray-700 rounded-t'
                        : 'border-transparent text-gray-600 dark:text-gray-400 font-normal bg-gray-200 dark:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                    Música / Televisión
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5">

                {activeTab === 'datos' && (
                    <>
                        {/* Datos Personales */}
                        <fieldset className="border border-gray-300 dark:border-gray-700 p-4 rounded-lg">
                            <legend className="font-bold px-2 text-gray-700 dark:text-gray-300">Datos Personales</legend>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Paterno:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <input type="text" name="paterno" value={formData.paterno} onChange={handleChange} required className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Materno:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <input type="text" name="materno" value={formData.materno} onChange={handleChange} required className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Nombre:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Fecha Nacimiento:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} required className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Sexo:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="9" cy="7" r="4"></circle>
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                        </svg>
                                        <select name="sexo" value={formData.sexo} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Estado Civil:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                        </svg>
                                        <select name="estado_civil" value={formData.estado_civil} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                                            <option value="Soltero">Soltero(a)</option>
                                            <option value="Casado">Casado(a)</option>
                                            <option value="Divorciado">Divorciado(a)</option>
                                            <option value="Viudo">Viudo(a)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        {/* Contacto */}
                        <fieldset className="border border-gray-300 dark:border-gray-700 p-4 rounded-lg mt-4">
                            <legend className="font-bold px-2 text-gray-700 dark:text-gray-300">Contacto</legend>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-3">
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Dirección:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                        <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
                                    <div>
                                        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Teléfono:</label>
                                        <div className="relative">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                            </svg>
                                            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Celular:</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={countryCode}
                                                onChange={(e) => setCountryCode(e.target.value)}
                                                className="w-[120px] p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {countryCodes.map(c => (
                                                    <option key={c.code} value={c.code}>{c.label}</option>
                                                ))}
                                            </select>
                                            <div className="relative flex-grow">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                                    <path d="M12 2a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4z"></path>
                                                    <line x1="10" y1="18" x2="10" y2="18"></line>
                                                </svg>
                                                <input
                                                    type="text"
                                                    name="celular" // Keep name but handle separately in render
                                                    value={localCelular}
                                                    onChange={(e) => setLocalCelular(e.target.value)}
                                                    placeholder="Nro. Celular"
                                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Email:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Casilla:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        <input type="text" name="casilla" value={formData.casilla} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Profesión:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                        </svg>
                                        <input type="text" name="profesion" value={formData.profesion} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        {/* Datos Oficina */}
                        <fieldset className="border border-gray-300 dark:border-gray-700 p-4 rounded-lg mt-4">
                            <legend className="font-bold px-2 text-gray-700 dark:text-gray-300">Datos Oficina</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Dirección Oficina:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                        <input type="text" name="direccion_oficina" value={formData.direccion_oficina} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Teléfono Oficina:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                        <input type="text" name="telefono_oficina" value={formData.telefono_oficina} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        {/* Seguro y Referencia */}
                        <fieldset className="border border-gray-300 dark:border-gray-700 p-4 rounded-lg mt-4">
                            <legend className="font-bold px-2 text-gray-700 dark:text-gray-300">Seguro y Referencia</legend>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Seguro Médico:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                        </svg>
                                        <input type="text" name="seguro_medico" value={formData.seguro_medico} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Póliza:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                        <input type="text" name="poliza" value={formData.poliza} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Recomendado por:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                        </svg>
                                        <input type="text" name="recomendado" value={formData.recomendado} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        {/* Responsable */}
                        <fieldset className="border border-gray-300 dark:border-gray-700 p-4 rounded-lg mt-4">
                            <legend className="font-bold px-2 text-gray-700 dark:text-gray-300">Responsable</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Nombre Responsable:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <input type="text" name="responsable" value={formData.responsable} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Parentesco:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="9" cy="7" r="4"></circle>
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                        </svg>
                                        <input type="text" name="parentesco" value={formData.parentesco} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Dirección Responsable:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                        <input type="text" name="direccion_responsable" value={formData.direccion_responsable} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Teléfono Responsable:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                        <input type="text" name="telefono_responsable" value={formData.telefono_responsable} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        {/* Clasificación */}
                        <fieldset className="border border-gray-300 dark:border-gray-700 p-4 rounded-lg mt-4">
                            <legend className="font-bold px-2 text-gray-700 dark:text-gray-300">Clasificación</legend>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Tipo Paciente:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                            <line x1="7" y1="7" x2="7.01" y2="7"></line>
                                        </svg>
                                        <select name="tipo_paciente" value={formData.tipo_paciente} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                                            <option value="Normal">Normal</option>
                                            <option value="Especial">Especial</option>
                                        </select>
                                    </div>
                                    {formData.tipo_paciente === 'Especial' && (
                                        <div className="mt-2">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Motivo:</label>
                                            <textarea
                                                name="motivo"
                                                value={formData.motivo || ''}
                                                onChange={handleChange}
                                                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows={2}
                                                placeholder="Especifique el motivo"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Nomenclatura:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                        <select name="nomenclatura" value={formData.nomenclatura} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                                            <option value="">Ninguna</option>
                                            <option value="Paciente Remitido">Paciente Remitido</option>
                                            <option value="Mal Paciente">Mal Paciente</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Categoría:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                            <line x1="7" y1="7" x2="7.01" y2="7"></line>
                                        </svg>
                                        <select name="idCategoria" value={formData.idCategoria} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                                            <option value={0}>Seleccione una categoría</option>
                                            {categorias.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.descripcion}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {formData.idCategoria > 0 && (
                                        <div className="mt-1 flex items-center gap-2">
                                            <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: categorias.find(c => c.id === formData.idCategoria)?.color }}></div>
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Color asignado</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </fieldset>
                    </>
                )}

                {activeTab === 'ficha' && (
                    <>
                        <fieldset className="border border-gray-300 dark:border-gray-700 p-4 rounded-lg">
                            <legend className="font-bold px-2 text-gray-700 dark:text-gray-300">Por favor indique si sufrió alguna de las siguientes enfermedades:</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.alergia_anestesicos" checked={formData.fichaMedica.alergia_anestesicos} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Alergia a Anestésicos</label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.alergias_drogas" checked={formData.fichaMedica.alergias_drogas} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Alergias a Drogas</label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.hepatitis" checked={formData.fichaMedica.hepatitis} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Hepatitis</label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.asma" checked={formData.fichaMedica.asma} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Asma</label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.diabetes" checked={formData.fichaMedica.diabetes} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Diabetes</label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.dolencia_cardiaca" checked={formData.fichaMedica.dolencia_cardiaca} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Dolencia Cardíaca</label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.hipertension" checked={formData.fichaMedica.hipertension} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Hipertensión</label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.fiebre_reumatica" checked={formData.fichaMedica.fiebre_reumatica} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Fiebre Reumática</label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.diatesis_hemorragia" checked={formData.fichaMedica.diatesis_hemorragia} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Diátesis Hemorragia</label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.sinusitis" checked={formData.fichaMedica.sinusitis} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Sinusitis</label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.ulcera_gastroduodenal" checked={formData.fichaMedica.ulcera_gastroduodenal} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Úlcera Gastroduodenal</label>
                                <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.enfermedades_tiroides" checked={formData.fichaMedica.enfermedades_tiroides} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Enfermedades de Tiroides</label>
                            </div>

                            <div className="mt-4">
                                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Observaciones:</label>
                                <textarea name="fichaMedica.observaciones" value={formData.fichaMedica.observaciones} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
                            </div>

                            <div className="mt-4">
                                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Nombre del Médico de Cabecera:</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <input type="text" name="fichaMedica.medico_cabecera" value={formData.fichaMedica.medico_cabecera} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Indique si sufre actualmente de alguna enfermedad:</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                    </svg>
                                    <input type="text" name="fichaMedica.enfermedad_actual" value={formData.fichaMedica.enfermedad_actual} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-4">
                                <label className="text-gray-700 dark:text-gray-300 font-medium">¿Toma actualmente algún medicamento?</label>
                                <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.toma_medicamentos" value="true" checked={formData.fichaMedica.toma_medicamentos === true} onChange={() => setFormData(prev => ({ ...prev, fichaMedica: { ...prev.fichaMedica, toma_medicamentos: true } }))} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Si</label>
                                <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.toma_medicamentos" value="false" checked={formData.fichaMedica.toma_medicamentos === false} onChange={() => setFormData(prev => ({ ...prev, fichaMedica: { ...prev.fichaMedica, toma_medicamentos: false } }))} className="accent-blue-500 w-4 h-4 cursor-pointer" /> No</label>
                            </div>
                            {formData.fichaMedica.toma_medicamentos && (
                                <div className="mt-2">
                                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">¿Cuál?</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="16"></line>
                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                        </svg>
                                        <input type="text" name="fichaMedica.medicamentos_detalle" value={formData.fichaMedica.medicamentos_detalle} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div></div>
                            )}

                            <div className="mt-4">
                                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Tratamiento:</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                    </svg>
                                    <input type="text" name="fichaMedica.tratamiento" value={formData.fichaMedica.tratamiento} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="border border-gray-300 dark:border-gray-700 p-4 rounded-lg mt-6">
                            <legend className="font-bold px-2 text-gray-700 dark:text-gray-300">Historial Dental e Higiene</legend>

                            <div className="mb-4">
                                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Fecha de su última consulta odontológica:</label>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.ultima_consulta" value="6 meses" checked={formData.fichaMedica.ultima_consulta === '6 meses'} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> 6 meses a un año</label>
                                    <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.ultima_consulta" value="mas de 1 año" checked={formData.fichaMedica.ultima_consulta === 'mas de 1 año'} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> más de 1 año</label>
                                    <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.ultima_consulta" value="mas de 3 años" checked={formData.fichaMedica.ultima_consulta === 'mas de 3 años'} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> más de 3 años</label>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">¿Cuántas veces al día se cepilla los dientes?</label>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.frecuencia_cepillado" value="Una" checked={formData.fichaMedica.frecuencia_cepillado === 'Una'} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Una</label>
                                    <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.frecuencia_cepillado" value="Dos" checked={formData.fichaMedica.frecuencia_cepillado === 'Dos'} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Dos</label>
                                    <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.frecuencia_cepillado" value="Tres" checked={formData.fichaMedica.frecuencia_cepillado === 'Tres'} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Tres</label>
                                    <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.frecuencia_cepillado" value="Mas" checked={formData.fichaMedica.frecuencia_cepillado === 'Mas'} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Más</label>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">¿Qué elementos usa para su higiene dental?</label>
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.usa_cepillo" checked={formData.fichaMedica.usa_cepillo} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Cepillo dental</label>
                                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.usa_hilo_dental" checked={formData.fichaMedica.usa_hilo_dental} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Elementos interdentales</label>
                                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" name="fichaMedica.usa_enjuague" checked={formData.fichaMedica.usa_enjuague} onChange={handleChange} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Enjuague bucal</label>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-4">
                                <label className="text-gray-700 dark:text-gray-300 font-medium">¿Sufre de mal aliento? (Halitosis)</label>
                                <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.mal_aliento" value="true" checked={formData.fichaMedica.mal_aliento === true} onChange={() => setFormData(prev => ({ ...prev, fichaMedica: { ...prev.fichaMedica, mal_aliento: true } }))} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Si</label>
                                <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.mal_aliento" value="false" checked={formData.fichaMedica.mal_aliento === false} onChange={() => setFormData(prev => ({ ...prev, fichaMedica: { ...prev.fichaMedica, mal_aliento: false } }))} className="accent-blue-500 w-4 h-4 cursor-pointer" /> No</label>
                            </div>
                            {formData.fichaMedica.mal_aliento && (
                                <div className="mt-2">
                                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">¿Conoce la causa?</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                        </svg>
                                        <input type="text" name="fichaMedica.causa_mal_aliento" value={formData.fichaMedica.causa_mal_aliento} onChange={handleChange} className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div></div>
                            )}

                            <div className="mt-4 flex items-center gap-4">
                                <label className="text-gray-700 dark:text-gray-300 font-medium">¿Le sangra las encías al cepillarse?</label>
                                <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.sangra_encias" value="true" checked={formData.fichaMedica.sangra_encias === true} onChange={() => setFormData(prev => ({ ...prev, fichaMedica: { ...prev.fichaMedica, sangra_encias: true } }))} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Si</label>
                                <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.sangra_encias" value="false" checked={formData.fichaMedica.sangra_encias === false} onChange={() => setFormData(prev => ({ ...prev, fichaMedica: { ...prev.fichaMedica, sangra_encias: false } }))} className="accent-blue-500 w-4 h-4 cursor-pointer" /> No</label>
                            </div>

                            <div className="mt-4 flex flex-col gap-2">
                                <label className="text-gray-700 dark:text-gray-300 font-medium">¿Siente cansancio o algún dolor en la cara después de masticar o de alguna conversación prolongada?</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.dolor_cara" value="true" checked={formData.fichaMedica.dolor_cara === true} onChange={() => setFormData(prev => ({ ...prev, fichaMedica: { ...prev.fichaMedica, dolor_cara: true } }))} className="accent-blue-500 w-4 h-4 cursor-pointer" /> Si</label>
                                    <label className="flex items-center gap-1 cursor-pointer text-gray-700 dark:text-gray-300"><input type="radio" name="fichaMedica.dolor_cara" value="false" checked={formData.fichaMedica.dolor_cara === false} onChange={() => setFormData(prev => ({ ...prev, fichaMedica: { ...prev.fichaMedica, dolor_cara: false } }))} className="accent-blue-500 w-4 h-4 cursor-pointer" /> No</label>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Comentarios:</label>
                                <textarea name="fichaMedica.comentarios" value={formData.fichaMedica.comentarios} onChange={handleChange} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
                            </div>

                        </fieldset>
                    </>
                )}

                {activeTab === 'musica-tv' && (
                    <MusicaTelevisionTab
                        pacienteId={id ? Number(id) : null}
                        selectedMusicas={selectedMusicas}
                        setSelectedMusicas={setSelectedMusicas}
                        selectedTelevisiones={selectedTelevisiones}
                        setSelectedTelevisiones={setSelectedTelevisiones}
                    />
                )}

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
                        {isEditing ? 'Actualizar' : 'Guardar'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/pacientes')}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2">

                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg> Cancelar
                    </button>
                </div>
            </form>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Pacientes"
                sections={manualSections}
            />
        </div>
    );
};

export default PacienteForm;
