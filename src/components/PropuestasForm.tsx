import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Paciente, Arancel } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';

interface DetalleItem {
    id?: number;
    letra: string; // Added Letra for Detail
    arancelId: number;
    codigo: string;
    tratamiento: string;
    precioUnitario: number;
    tc: number;
    piezas: string;
    cantidad: number;
    subTotal: number;
    descuento: number;
    total: number;
    posible: boolean;
}

const PropuestasForm: React.FC = () => {
    const { id, propuestaId } = useParams<{ id: string; propuestaId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isReadOnly = location.pathname.includes('/view/');

    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [aranceles, setAranceles] = useState<Arancel[]>([]);
    const [detalles, setDetalles] = useState<DetalleItem[]>([]);
    const [nota, setNota] = useState('');
    const [letraHeader, setLetraHeader] = useState(''); // Optional header label
    const [fecha, setFecha] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [numero, setNumero] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState('A'); // Default tab

    // Form state for new item
    const [selectedArancelId, setSelectedArancelId] = useState<number>(0);
    const [precioType, setPrecioType] = useState<'precio1' | 'precio2'>('precio1');
    const [piezas, setPiezas] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [descuento, setDescuento] = useState(0);
    const [posible, setPosible] = useState(false);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Propuestas de Tratamiento',
            content: 'Las propuestas permiten crear múltiples opciones de tratamiento (A-F) para que el paciente elija. Cada opción puede tener diferentes tratamientos y precios.'
        },
        {
            title: 'Pestañas A-F',
            content: 'Use las pestañas para organizar hasta 6 propuestas diferentes. Agregue tratamientos a cada pestaña según las opciones que desea ofrecer al paciente.'
        },
        {
            title: 'Pasar a Presupuesto',
            content: 'Una vez que el paciente elija una propuesta, puede convertirla en presupuesto oficial usando el botón "Pasar a Presupuesto".'
        }
    ];

    // State for editing an item
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const tabs = ['A', 'B', 'C', 'D', 'E', 'F'];

    useEffect(() => {
        if (id) {
            fetchPaciente(Number(id));
            fetchAranceles();
        }
        if (propuestaId) {
            fetchPropuesta(Number(propuestaId));
        }
    }, [id, propuestaId]);

    const fetchPropuesta = async (propuestaId: number) => {
        try {
            const response = await api.get(`/propuestas/${propuestaId}`);
            const data = response.data;
            setNota(data.nota);
            setLetraHeader(data.letra || '');
            setFecha(data.fecha.split('T')[0]);
            setNumero(data.numero);

            if (data.detalles) {
                const mappedDetalles = data.detalles.map((d: any) => ({
                    id: d.id,
                    letra: d.letra || 'A', // Default to A if missing
                    arancelId: d.arancel.id,
                    codigo: d.arancel.id.toString(),
                    tratamiento: d.arancel.detalle,
                    precioUnitario: Number(d.precioUnitario),
                    tc: Number(d.tc),
                    piezas: d.piezas,
                    cantidad: Number(d.cantidad),
                    subTotal: Number(d.subTotal),
                    descuento: Number(d.descuento),
                    total: Number(d.total),
                    posible: d.posible
                }));
                setDetalles(mappedDetalles);
            }
        } catch (error) {
            console.error('Error fetching propuesta:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo cargar la propuesta',
                icon: 'error',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const fetchPaciente = async (pacienteId: number) => {
        try {
            const response = await api.get(`/pacientes/${pacienteId}`);
            setPaciente(response.data);
        } catch (error) {
            console.error('Error fetching paciente:', error);
        }
    };

    const fetchAranceles = async () => {
        try {
            const response = await api.get('/arancel?limit=1000');
            setAranceles(response.data.data);
        } catch (error) {
            console.error('Error fetching aranceles:', error);
        }
    };

    const handleAddItem = () => {
        if (!selectedArancelId) return;

        const arancel = aranceles.find(a => a.id === Number(selectedArancelId));
        if (!arancel) return;

        const precio = precioType === 'precio1' ? Number(arancel.precio1) : Number(arancel.precio2);
        const subTotal = precio * cantidad;
        const descuentoAmount = (subTotal * descuento) / 100;
        const total = subTotal - descuentoAmount;

        const newItem: DetalleItem = {
            id: editingIndex !== null ? detalles[editingIndex].id : undefined,
            letra: activeTab, // Use current tab
            arancelId: arancel.id,
            codigo: arancel.id.toString(),
            tratamiento: arancel.detalle,
            precioUnitario: precio,
            tc: Number(arancel.tc),
            piezas,
            cantidad,
            subTotal,
            descuento,
            total,
            posible
        };

        if (editingIndex !== null) {
            const updatedDetalles = [...detalles];
            updatedDetalles[editingIndex] = newItem;
            setDetalles(updatedDetalles);
            setEditingIndex(null);
        } else {
            setDetalles([...detalles, newItem]);
        }

        // Reset form
        setSelectedArancelId(0);
        setPiezas('');
        setCantidad(1);
        setDescuento(0);
        setPosible(false);
    };

    const handleRemoveItem = (index: number) => {
        const newDetalles = [...detalles];
        newDetalles.splice(index, 1);
        setDetalles(newDetalles);

        if (editingIndex === index) {
            cancelEdit();
        } else if (editingIndex !== null && index < editingIndex) {
            setEditingIndex(editingIndex - 1);
        }
    };

    const handleEditItem = (index: number) => {
        // realIndex is the index in the filtered array, index is in the main array?
        // Wait, handleEditItem should receive the index in the 'detalles' array

        const item = detalles[index];
        setEditingIndex(index);

        // When editing, ensure we are on the correct tab (though we should strictly be editing visible items)
        if (item.letra !== activeTab) {
            setActiveTab(item.letra);
        }

        setSelectedArancelId(item.arancelId);
        setPiezas(item.piezas);
        setCantidad(item.cantidad);
        setDescuento(item.descuento);
        setPosible(item.posible);

        const arancel = aranceles.find(a => a.id === item.arancelId);
        if (arancel) {
            if (item.precioUnitario === Number(arancel.precio2)) {
                setPrecioType('precio2');
            } else {
                setPrecioType('precio1');
            }
        }
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setSelectedArancelId(0);
        setPiezas('');
        setCantidad(1);
        setDescuento(0);
        setPosible(false);
    };

    // Calculate total ONLY for the active tab for display
    const calculateTabTotal = () => {
        const tabItems = detalles.filter(d => d.letra === activeTab);
        return tabItems.reduce((sum, item) => sum + item.total, 0);
    };

    // Calculate GRAND TOTAL (sum of all items) - usually stored in DB
    const calculateGrandTotal = () => {
        return detalles.reduce((sum, item) => sum + item.total, 0);
    };

    const handleSubmit = async () => {
        if (!paciente) return;

        // Validate nota field
        if (!nota || nota.trim() === '') {
            Swal.fire({
                icon: 'warning',
                title: 'Campo Requerido',
                text: 'Por favor, ingrese una nota o comentario para la propuesta.',
                confirmButtonText: 'OK',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        try {
            const payload = {
                pacienteId: paciente.id,
                usuarioId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : 1,
                nota,
                letra: letraHeader,
                fecha: new Date(fecha).toISOString(),
                total: calculateGrandTotal(), // Storing sum of all, or should it be 0? Storing sum for now.
                detalles: detalles.map(d => ({
                    id: d.id,
                    letra: d.letra,
                    arancelId: d.arancelId,
                    precioUnitario: d.precioUnitario,
                    tc: d.tc,
                    piezas: d.piezas,
                    cantidad: d.cantidad,
                    subTotal: d.subTotal,
                    descuento: d.descuento,
                    total: d.total,
                    posible: d.posible
                }))
            };

            if (propuestaId) {
                await api.patch(`/propuestas/${propuestaId}`, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Propuesta Actualizada',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            } else {
                await api.post('/propuestas', payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Propuesta Guardada',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
            setTimeout(() => {
                navigate(`/pacientes/${id}/propuestas`);
            }, 1500);
        } catch (error: any) {
            console.error('Error saving propuesta:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
            Swal.fire({
                icon: 'error',
                title: 'Error al Guardar',
                text: errorMessage,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const handleConvertToBudget = async () => {
        if (!propuestaId) return;

        const result = await Swal.fire({
            title: 'Convertir a Presupuesto',
            text: `¿Crear un nuevo presupuesto con los items de la Propuesta ${activeTab}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, crear',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
        });

        if (result.isConfirmed) {
            try {
                const usuarioId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : 1;
                const response = await api.post(`/propuestas/${propuestaId}/convertir`, {
                    letra: activeTab,
                    usuarioId: usuarioId
                });

                Swal.fire({
                    icon: 'success',
                    title: '¡Creado!',
                    text: 'El presupuesto ha sido creado.',
                    showConfirmButton: false,
                    timer: 1500,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });

                navigate(`/pacientes/${id}/presupuestos/edit/${response.data.id}`);

            } catch (error: any) {
                console.error('Error converting to budget:', error);
                const errorMessage = error.response?.data?.message || 'Error al crear el presupuesto';
                Swal.fire({
                    title: 'Error',
                    text: errorMessage,
                    icon: 'error',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        }
    };

    return (
        <div className="content-card max-w-[1400px] mx-auto text-gray-800 dark:text-white bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <span className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-600 dark:text-purple-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </span>
                    {propuestaId ? (isReadOnly ? 'Ver Propuesta' : 'Editar Propuesta') : 'Nueva Propuesta'}
                </h2>
                <button
                    onClick={() => setShowManual(true)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Ayuda / Manual"
                >
                    ?
                </button>
            </div>

            {/* Header: Patient Info */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-600 mb-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3">
                        <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Paciente</label>
                        <div className="text-xl font-bold text-gray-800 dark:text-white mt-1">
                            {paciente ? `${paciente.paterno} ${paciente.materno} ${paciente.nombre}` : 'Cargando...'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha</label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            disabled={isReadOnly}
                            className="w-full mt-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 dark:text-gray-200"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs Navigation matching the standard model */}
            <div className="no-print flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-6 gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => {
                            if (!isReadOnly) {
                                cancelEdit(); // Cancel edit if switching tabs
                            }
                            setActiveTab(tab);
                        }}
                        className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2
                            ${activeTab === tab
                                ? 'bg-white dark:bg-gray-800 border-b-2 border-purple-500 text-purple-600 dark:text-purple-300 shadow-sm'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Propuesta {tab}
                    </button>
                ))}
            </div>

            {/* Item Entry Form */}
            {!isReadOnly && (
                <div className={`p-6 rounded-xl mb-8 border transition-all duration-300 ${editingIndex !== null ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        {editingIndex !== null ? (
                            <>
                                <span className="p-1 bg-blue-100 dark:bg-blue-800 rounded text-blue-600 dark:text-blue-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                </span>
                                Editar Item en Propuesta {activeTab}
                            </>
                        ) : (
                            <>
                                <span className="p-1 bg-green-100 dark:bg-green-800 rounded text-green-600 dark:text-green-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                </span>
                                Agregar Item a Propuesta {activeTab}
                            </>
                        )}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="md:col-span-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tratamiento</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C3.088 13.633 3.241 15 4.3 15H10a1 1 0 001-1v-1h5a1 1 0 001-1V8a1 1 0 00-1-1h-5V7h1a1 1 0 100-2h-2V3a1 1 0 00-1-1H7zm1 6V4.414L7.414 5H8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <select
                                    value={selectedArancelId}
                                    onChange={(e) => setSelectedArancelId(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 dark:text-gray-200"
                                >
                                    <option value={0}>-- Seleccione Tratamiento --</option>
                                    {aranceles.map(a => (
                                        <option key={a.id} value={a.id}>{a.detalle} - {a.precio1} Bs.</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-4 flex items-center gap-6">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Precio:</span>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="precioType"
                                        className="form-radio text-purple-600 focus:ring-purple-500 h-4 w-4 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                        value="precio1"
                                        checked={precioType === 'precio1'}
                                        onChange={() => setPrecioType('precio1')}
                                    />
                                    <span className="ml-2 text-gray-700 dark:text-gray-300">Precio 1</span>
                                </label>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="precioType"
                                        className="form-radio text-purple-600 focus:ring-purple-500 h-4 w-4 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                        value="precio2"
                                        checked={precioType === 'precio2'}
                                        onChange={() => setPrecioType('precio2')}
                                    />
                                    <span className="ml-2 text-gray-700 dark:text-gray-300">Precio 2</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº Pieza(s)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 00-1.219-1.343L8.88 4.5c-.832-.086-1.55.534-1.611 1.343l-.128 1.7a1 1 0 001.218 1.343l5.109-.432c.831-.087 1.55-.534 1.611-1.343l.132-1.7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={piezas}
                                    onChange={(e) => setPiezas(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 dark:text-gray-200"
                                    placeholder="Ej: 18, 24"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400 font-bold">#</span>
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 dark:text-gray-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descuento (%)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                                        <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                                    </svg>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={descuento}
                                    onChange={(e) => setDescuento(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 dark:text-gray-200"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center cursor-pointer text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={posible}
                                        onChange={(e) => setPosible(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-10 h-5 bg-gray-300 rounded-full shadow-inner transition-colors ${posible ? 'bg-orange-400' : ''}`}></div>
                                    <div className={`dot absolute w-5 h-5 bg-white rounded-full shadow -left-1 -top-0 transition-transform ${posible ? 'transform translate-x-full bg-blue-500' : ''}`}></div>
                                </div>
                                <span className="ml-3 font-semibold select-none">POSIBLE TRATAMIENTO</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleAddItem}
                            className={`w-full md:w-auto min-w-[200px] py-2 px-4 rounded-lg shadow-md font-semibold text-white text-sm transition-all transform hover:-translate-y-0.5
                                ${editingIndex !== null
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-orange-500 hover:bg-orange-600'
                                }`}
                        >
                            {editingIndex !== null ? 'Actualizar Tratamiento' : 'Agregar Tratamiento'}
                        </button>
                        {editingIndex !== null && (
                            <button
                                onClick={cancelEdit}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors flex items-center gap-2">

                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg> Cancelar
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Items Table for Active Tab */}
            <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                        </svg>
                        Tratamientos de Propuesta {activeTab}
                    </h4>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nº</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tratamiento</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Piezas</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">P.U.</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cant.</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Desc %</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Neto</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Posible</th>
                                {!isReadOnly && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acción</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {detalles.map((item, index) => {
                                // Only render items for the active tab
                                if (item.letra !== activeTab) return null;

                                return (
                                    <tr key={index} className={`
                                        ${editingIndex === index
                                            ? 'bg-blue-50 dark:bg-blue-900/30'
                                            : item.posible
                                                ? 'bg-yellow-50 dark:bg-yellow-900/10'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        } transition-colors
                                    `}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">{index + 1}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.tratamiento}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">{item.piezas}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{item.precioUnitario.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">{item.cantidad}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{item.subTotal.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">{item.descuento}%</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white text-right">{item.total.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.posible ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {item.posible ? 'SÍ' : 'NO'}
                                            </span>
                                        </td>
                                        {!isReadOnly && (
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEditItem(index)}
                                                        className="p-1.5 bg-transparent text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
                                                        title="Editar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="p-1.5 bg-transparent text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {detalles.filter(d => d.letra === activeTab).length === 0 && (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No hay items registrados en esta propuesta.
                        </div>
                    )}
                </div>
            </div>

            {/* Footer: Total and Note */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-600">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nota (General)</label>
                        <textarea
                            value={nota}
                            onChange={(e) => setNota(e.target.value)}
                            disabled={isReadOnly}
                            required
                            className="w-full h-32 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 dark:text-gray-200 resize-none transition-colors"
                            placeholder="Ingrese una nota o comentario general para la propuesta..."
                        />
                    </div>

                    <div className="flex flex-col justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Propuesta {activeTab}</div>
                            <div className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                                {calculateTabTotal().toFixed(2)} <span className="text-xl text-gray-500 dark:text-gray-400">Bs.</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-8">
                            {!isReadOnly && (
                                <button
                                    onClick={handleSubmit}
                                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    Guardar
                                </button>
                            )}

                            {propuestaId && (
                                <button
                                    onClick={handleConvertToBudget}
                                    className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Pasar a Presupuesto
                                </button>
                            )}

                            <button
                                onClick={() => navigate(`/pacientes/${id}/propuestas`)}
                                className="w-full md:w-auto bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                {isReadOnly ? 'Volver' : 'Cancelar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Propuestas"
                sections={manualSections}
            />
        </div >
    );
};
export default PropuestasForm;
