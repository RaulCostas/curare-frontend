import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';
import ManualModal, { type ManualSection } from './ManualModal';

interface Doctor {
    id: number;
    paterno: string;
    materno: string;
    nombre: string;
}

interface FormaPago {
    id: number;
    forma_pago: string;
}

interface HistoriaClinica {
    id: number;
    fecha: string;
    paciente: {
        paterno: string;
        materno: string;
        nombre: string;
    };
    tratamiento: string;
    precio: number;
    pagado: string;
    pieza?: string;
    cantidad?: number;
    proformaId?: number;
    proformaDetalle?: {
        descuento: number;
    };
    // Loaded from backend
    ultimoPagoPaciente?: {
        fecha: string; // payment date
        forma_pago: string;
        monto: number;
        moneda: string;
    } | null;
}

interface RowDetail {
    costoLaboratorio: number;
    descuento: number; // Percentage
}

const PagosDoctoresForm = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL
    const isEditMode = Boolean(id);

    const [doctores, setDoctores] = useState<Doctor[]>([]);
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
    const [pendientes, setPendientes] = useState<HistoriaClinica[]>([]);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Pagos a Doctores',
            content: 'Registro y gestión de pagos a doctores por los tratamientos realizados.'
        },
        {
            title: 'Selección de Doctor y Tratamientos',
            content: 'Seleccione un doctor para ver su lista de tratamientos pendientes. Marque los tratamientos que desea incluir en este pago.'
        },
        {
            title: 'Ajustes y Descuentos',
            content: 'Puede ingresar el Costo de Laboratorio y el porcentaje de Descuento para cada tratamiento seleccionado. El subtotal se actualizará automáticamente.'
        },
        {
            title: 'Datos del Pago',
            content: 'En la parte inferior, configure la fecha, forma de pago, moneda y comisión (si aplica). Verifique el "Total a Pagar" antes de guardar.'
        }
    ];

    // Header Data
    const [idDoctor, setIdDoctor] = useState<string>('');

    // Footer Data
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [moneda, setMoneda] = useState('Bolivianos'); // Bolivianos or Dólares
    const [tc, setTc] = useState<number>(6.96);
    const [idForma_pago, setIdFormaPago] = useState<string>('');
    const [comision, setComision] = useState<number>(0);

    // Selection & Row Details
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [rowDetails, setRowDetails] = useState<Record<number, RowDetail>>({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDoctores();
        fetchFormasPago();
        if (isEditMode && id) {
            fetchPagoData(Number(id));
        }
    }, [id]);

    useEffect(() => {
        // Only fetch pending if NOT in edit mode, or if doctor changes in create mode
        if (idDoctor && !isEditMode) {
            fetchPendientes(Number(idDoctor));
        }
    }, [idDoctor, isEditMode]);

    const fetchPagoData = async (paymentId: number) => {
        try {
            const response = await api.get(`/pagos-doctores/${paymentId}`);
            const pago = response.data;
            setIdDoctor(String(pago.doctor?.id || ''));
            setFecha(pago.fecha.split('T')[0]);

            // Normalized Currency
            let normalizedMoneda = 'Bolivianos';
            if (pago.moneda === 'Bs') normalizedMoneda = 'Bolivianos';
            else if (pago.moneda === '$us' || pago.moneda === 'Sus') normalizedMoneda = 'Dólares';
            else normalizedMoneda = pago.moneda;

            setMoneda(normalizedMoneda);
            setTc(Number(pago.tc) || 6.96); // Load TC
            setIdFormaPago(String(pago.formaPago?.id || ''));
            setComision(Number(pago.comision));

            // 2. Extract "Saved/Paid" Items
            let loadedItems: HistoriaClinica[] = [];
            if (pago.detalles) {
                loadedItems = pago.detalles.map((d: any) => ({
                    ...d.historiaClinica,
                }));
            }

            // 3. Fetch "Unpaid/Pending" Items for this doctor
            let pendingItems: HistoriaClinica[] = [];
            if (pago.doctor?.id) {
                try {
                    const pendingRes = await api.get(`/historia-clinica/pendientes/${pago.doctor.id}`);
                    pendingItems = pendingRes.data;
                } catch (err) {
                    console.error('Error fetching additional pending items:', err);
                }
            }

            setPendientes([...loadedItems, ...pendingItems]);

            const ids = loadedItems.map((i: any) => i.id);
            setSelectedIds(ids);

            const detailsMap: Record<number, RowDetail> = {};
            pago.detalles.forEach((d: any) => {
                detailsMap[d.historiaClinica.id] = {
                    costoLaboratorio: Number(d.costo_laboratorio),
                    descuento: Number(d.descuento)
                };
            });
            pendingItems.forEach(p => {
                detailsMap[p.id] = {
                    costoLaboratorio: 0,
                    descuento: p.proformaDetalle?.descuento || 0
                };
            });
            setRowDetails(detailsMap);

        } catch (error) {
            console.error('Error fetching payment:', error);
            Swal.fire('Error', 'No se pudo cargar la información del pago', 'error');
            navigate('/pagos-doctores');
        }
    };

    const fetchDoctores = async () => {
        try {
            const response = await api.get('/historia-clinica/doctores/pendientes');
            setDoctores(response.data);
        } catch (error) {
            console.error('Error fetching doctores:', error);
        }
    };

    const fetchFormasPago = async () => {
        try {
            const response = await api.get('/forma-pago?limit=100');
            const data = response.data.data || response.data;
            if (Array.isArray(data)) {
                setFormasPago(data.filter((f: any) => f.estado === 'Activo'));
            } else {
                setFormasPago([]);
            }
        } catch (error) {
            console.error('Error fetching formas pago:', error);
        }
    };

    const fetchPendientes = async (doctorId: number) => {
        try {
            const response = await api.get(`/historia-clinica/pendientes/${doctorId}`);
            setPendientes(response.data);
            setSelectedIds([]);
            setRowDetails({});
        } catch (error) {
            console.error('Error fetching pendientes:', error);
            Swal.fire('Error', 'No se pudieron cargar los tratamientos pendientes', 'error');
        }
    };

    const calculateRowTotal = (item: HistoriaClinica) => {
        const details = rowDetails[item.id] || { costoLaboratorio: 0, descuento: 0 };
        const base = Number(item.precio) || 0;

        // 1. Discount
        const discountAmount = (base * (details.descuento || 0)) / 100;
        const afterDiscount = base - discountAmount;

        // 2. Subtract Lab Cost
        const costoLab = details.costoLaboratorio || 0;

        return Math.max(0, afterDiscount - costoLab);
    };

    // Grand Total (Sum of rows)
    const subTotal = pendientes
        .filter(p => selectedIds.includes(p.id))
        .reduce((sum, p) => sum + calculateRowTotal(p), 0);

    // Commission Amount
    const amountAfterCommission = comision > 0
        ? (subTotal * comision) / 100
        : subTotal;

    // Convert to Selected Currency
    const totalToPay = moneda === 'Dólares' && tc > 0
        ? amountAfterCommission / tc
        : amountAfterCommission;

    // Search
    const filteredPendientes = pendientes.filter(item => {
        const term = searchTerm.toLowerCase();
        const pacienteName = `${item.paciente?.nombre} ${item.paciente?.paterno} ${item.paciente?.materno}`.toLowerCase();
        const tratamiento = item.tratamiento?.toLowerCase() || '';
        return pacienteName.includes(term) || tratamiento.includes(term);
    });

    const handleCheckboxChange = (id: number) => {
        setSelectedIds(prev => {
            const isSelected = prev.includes(id);
            if (!isSelected) {
                // Initialize details when selected if not present
                if (!rowDetails[id]) {
                    const item = pendientes.find(p => p.id === id);
                    const defaultDiscount = item?.proformaDetalle?.descuento || 0;

                    setRowDetails(curr => ({
                        ...curr,
                        [id]: { costoLaboratorio: 0, descuento: defaultDiscount }
                    }));
                }
                return [...prev, id];
            } else {
                return prev.filter(pid => pid !== id);
            }
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = filteredPendientes.map(p => p.id);
            const uniqueIds = Array.from(new Set([...selectedIds, ...allIds]));

            setSelectedIds(uniqueIds);

            // Initialize details
            const newDetails = { ...rowDetails };
            filteredPendientes.forEach(p => {
                if (!newDetails[p.id]) {
                    const defaultDiscount = p.proformaDetalle?.descuento || 0;
                    newDetails[p.id] = { costoLaboratorio: 0, descuento: defaultDiscount };
                }
            });
            setRowDetails(newDetails);
        } else {
            // Deselect visible items
            const visibleIds = filteredPendientes.map(p => p.id);
            setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
        }
    };

    const handleDetailChange = (id: number, field: keyof RowDetail, value: number) => {
        setRowDetails(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idDoctor || !idForma_pago || selectedIds.length === 0) {
            Swal.fire('Atención', 'Seleccione un doctor, forma de pago y al menos un tratamiento', 'warning');
            return;
        }

        const detalles = pendientes
            .filter(p => selectedIds.includes(p.id))
            .map(p => {
                const rd = rowDetails[p.id] || { costoLaboratorio: 0, descuento: 0 };
                const rowTotal = calculateRowTotal(p);
                return {
                    idhistoria_clinica: p.id,
                    total: rowTotal,
                    costo_laboratorio: rd.costoLaboratorio,
                    fecha_pago_paciente: p.ultimoPagoPaciente?.fecha || null,
                    forma_pago_paciente: p.ultimoPagoPaciente?.forma_pago || null,
                    descuento: rd.descuento
                };
            });

        const payload = {
            idDoctor: Number(idDoctor),
            fecha,
            comision,
            total: totalToPay,
            moneda,
            tc: moneda === 'Dólares' ? tc : 0,
            idForma_pago: Number(idForma_pago),
            detalles
        };

        try {
            if (isEditMode && id) {
                await api.patch(`/pagos-doctores/${id}`, payload);
                Swal.fire({ icon: 'success', title: 'Pago Actualizado', text: 'El pago se ha actualizado correctamente', timer: 1500, showConfirmButton: false });
            } else {
                await api.post('/pagos-doctores', payload);
                Swal.fire({ icon: 'success', title: 'Pago Registrado', text: 'El pago se ha guardado correctamente', timer: 1500, showConfirmButton: false });
            }
            navigate('/pagos-doctores');
        } catch (error) {
            console.error('Error saving pago:', error);
            Swal.fire('Error', 'No se pudo guardar el pago', 'error');
        }
    };

    return (
        <div className="content-card flex flex-col h-full bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6 px-6 pt-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Nuevo Pago a Doctor</h2>
                <button
                    onClick={() => setShowManual(true)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Ayuda / Manual"
                >
                    ?
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-grow space-y-4 px-6 pb-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seleccionar Doctor</label>
                    <div className="relative w-full md:w-1/3">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <select
                            value={idDoctor}
                            onChange={(e) => setIdDoctor(e.target.value)}
                            className="w-full pl-10 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                            required
                        >
                            <option value="">-- Seleccione Doctor --</option>
                            {Array.isArray(doctores) && doctores.map(d => (
                                <option key={d.id} value={d.id}>{d.paterno} {d.materno} {d.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-grow bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-colors">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Tratamientos Pendientes</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{selectedIds.length} seleccionados</span>
                        </div>
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Buscar paciente o tratamiento..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 border border-blue-300 dark:border-blue-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute right-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-grow">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 shadow-sm z-10 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-3 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={filteredPendientes.length > 0 && filteredPendientes.every(p => selectedIds.includes(p.id))}
                                            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                                        />
                                    </th>
                                    <th className="p-3"># Pres.</th>
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Paciente</th>
                                    <th className="p-3">Tratamiento</th>
                                    <th className="p-3">Pieza</th>
                                    <th className="p-3 text-center">Cant.</th>
                                    <th className="p-3 text-right">Precio</th>

                                    {/* Editable Columns Header */}
                                    <th className="p-3 w-32 bg-blue-50/50 dark:bg-blue-900/20">Costo Lab.</th>
                                    <th className="p-3 w-24 bg-blue-50/50 dark:bg-blue-900/20">Desc (%)</th>
                                    <th className="p-3 bg-gray-50/50 dark:bg-gray-800/50">Fecha Pago (Pac)</th>
                                    <th className="p-3 bg-gray-50/50 dark:bg-gray-800/50">Forma Pago (Pac)</th>
                                    <th className="p-3 bg-green-50/50 dark:bg-green-900/20 text-right font-bold text-green-700 dark:text-green-400">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                {filteredPendientes.length === 0 ? (
                                    <tr>
                                        <td colSpan={13} className="p-10 text-center text-gray-500 dark:text-gray-400 italic">
                                            {idDoctor ? (searchTerm ? 'No se encontraron resultados.' : 'No hay tratamientos pendientes.') : 'Seleccione un doctor para ver sus pendientes.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPendientes.map(p => {
                                        const isSelected = selectedIds.includes(p.id);
                                        const details = rowDetails[p.id] || { costoLaboratorio: 0, descuento: 0 };
                                        const rowTotal = calculateRowTotal(p);

                                        return (
                                            <tr key={p.id} className={`${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} transition-colors`}>
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleCheckboxChange(p.id)}
                                                        className="h-4 w-4 text-blue-600 rounded cursor-pointer focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                                                    />
                                                </td>
                                                <td className="p-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{p.proformaId || '-'}</td>
                                                <td className="p-3 text-gray-600 dark:text-gray-300">{formatDate(p.fecha)}</td>
                                                <td className="p-3 font-medium text-gray-800 dark:text-white">{p.paciente?.paterno} {p.paciente?.nombre}</td>
                                                <td className="p-3 text-gray-700 dark:text-gray-300">{p.tratamiento}</td>
                                                <td className="p-3 text-gray-500 dark:text-gray-400">{p.pieza || '-'}</td>
                                                <td className="p-3 text-center text-gray-500 dark:text-gray-400">{p.cantidad}</td>
                                                <td className="p-3 text-right font-bold text-gray-800 dark:text-white">{Number(p.precio).toFixed(2)}</td>

                                                <td className="p-2">
                                                    {isSelected && (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={details.costoLaboratorio}
                                                            onChange={(e) => handleDetailChange(p.id, 'costoLaboratorio', Number(e.target.value))}
                                                            className="w-full p-1 border border-blue-300 dark:border-blue-600 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            placeholder="0.00"
                                                        />
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    {isSelected && (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={details.descuento}
                                                            onChange={(e) => handleDetailChange(p.id, 'descuento', Number(e.target.value))}
                                                            className="w-full p-1 border border-blue-300 dark:border-blue-600 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            placeholder="0%"
                                                        />
                                                    )}
                                                </td>

                                                <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
                                                    {isSelected && p.ultimoPagoPaciente?.fecha ? formatDate(p.ultimoPagoPaciente.fecha) : '-'}
                                                </td>
                                                <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
                                                    {isSelected && p.ultimoPagoPaciente?.forma_pago ? (
                                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-[10px] uppercase font-bold">
                                                            {p.ultimoPagoPaciente.forma_pago}
                                                        </span>
                                                    ) : '-'}
                                                </td>

                                                <td className="p-3 text-right font-bold text-green-700 dark:text-green-400">
                                                    {isSelected ? rowTotal.toFixed(2) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer: Payment Details */}
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-lg mt-auto border border-gray-200 dark:border-gray-700 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-gray-600 dark:text-gray-400 text-xs uppercase font-bold mb-2">Fecha Pago</label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-400"
                                required
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-gray-600 dark:text-gray-400 text-xs uppercase font-bold mb-2">Forma de Pago</label>
                            <select
                                value={idForma_pago}
                                onChange={(e) => setIdFormaPago(e.target.value)}
                                className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-400"
                                required
                            >
                                <option value="" className="text-gray-500">Seleccionar</option>
                                {Array.isArray(formasPago) && formasPago.map(f => (
                                    <option key={f.id} value={f.id}>{f.forma_pago}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-gray-600 dark:text-gray-400 text-xs uppercase font-bold mb-2">Moneda</label>
                            <select
                                value={moneda}
                                onChange={(e) => setMoneda(e.target.value)}
                                className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-400"
                            >
                                <option value="Bolivianos">Bolivianos</option>
                                <option value="Dólares">Dólares</option>
                            </select>
                        </div>

                        {moneda === 'Dólares' && (
                            <div className="md:col-span-1">
                                <label className="block text-gray-600 dark:text-gray-400 text-xs uppercase font-bold mb-2">T. Cambio</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={tc}
                                    onChange={(e) => setTc(Number(e.target.value))}
                                    className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-400"
                                />
                            </div>
                        )}

                        <div className="md:col-span-1">
                            <label className="block text-gray-600 dark:text-gray-400 text-xs uppercase font-bold mb-2">Comisión (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={comision}
                                onChange={(e) => setComision(Number(e.target.value))}
                                className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-400"
                            />
                        </div>

                        <div className="bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-center md:col-span-1">
                            <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">Total a Pagar</span>
                            <span className="block text-2xl font-bold text-green-600 dark:text-green-400 tracking-wider">
                                {totalToPay.toFixed(2)} <span className="text-sm text-gray-600 dark:text-gray-300">{moneda === 'Dólares' ? '$' : 'Bs'}</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => navigate('/pagos-doctores')}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2">

                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg> Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-transform transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={selectedIds.length === 0}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            GUARDAR PAGO
                        </button>
                    </div>
                </div>
            </form>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Pagos a Doctores"
                sections={manualSections}
            />
        </div>
    );
};

export default PagosDoctoresForm;
