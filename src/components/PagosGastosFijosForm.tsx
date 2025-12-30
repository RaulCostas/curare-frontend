import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { GastoFijo, PagoGastoFijo, FormaPago } from '../types';

interface PagosGastosFijosFormProps {
    gastoFijo: GastoFijo;
    existingPayment?: PagoGastoFijo | null;
    onClose: () => void;
    onSave: () => void;
}

const PagosGastosFijosForm: React.FC<PagosGastosFijosFormProps> = ({ gastoFijo, existingPayment, onClose, onSave }) => {
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [monto, setMonto] = useState(gastoFijo.monto);
    const [moneda, setMoneda] = useState(gastoFijo.moneda);
    const [formaPagoId, setFormaPagoId] = useState<number | ''>('');
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
    const [observaciones, setObservaciones] = useState('');

    useEffect(() => {
        const fetchFormasPago = async () => {
            try {
                const response = await api.get('/forma-pago?limit=100');
                if (response.data && response.data.data) {
                    const activeFormasPago = (response.data.data || []).filter((fp: any) => fp.estado === 'activo');
                    setFormasPago(activeFormasPago);
                } else if (Array.isArray(response.data)) { // Fallback if API returns array directly
                    const activeFormasPago = response.data.filter((fp: any) => fp.estado === 'activo');
                    setFormasPago(activeFormasPago);
                }
            } catch (err) {
                console.error('Error fetching formas de pago:', err);
            }
        };
        fetchFormasPago();
    }, []);

    useEffect(() => {
        if (existingPayment) {
            setFecha(existingPayment.fecha);
            setMonto(existingPayment.monto);
            setMoneda(existingPayment.moneda);
            if (existingPayment.formaPagoId) {
                setFormaPagoId(existingPayment.formaPagoId);
            } else if (existingPayment.formaPago && typeof existingPayment.formaPago === 'object') {
                // @ts-ignore
                setFormaPagoId(existingPayment.formaPago.id);
            }
            setObservaciones(existingPayment.observaciones || '');
        }
    }, [existingPayment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            gastoFijoId: gastoFijo.id,
            fecha,
            monto,
            moneda,
            formaPagoId,
            observaciones
        };

        try {
            if (existingPayment) {
                await api.patch(`/pagos-gastos-fijos/${existingPayment.id}`, data);
            } else {
                await api.post('/pagos-gastos-fijos', data);
            }

            await Swal.fire({
                icon: 'success',
                title: existingPayment ? 'Pago Actualizado' : 'Pago Registrado',
                text: existingPayment ? 'Pago actualizado exitosamente' : 'Pago registrado exitosamente',
                timer: 1500,
                showConfirmButton: false
            });

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving payment:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar el pago. Por favor intente nuevamente.'
            });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <h3 className="text-2xl font-bold mb-6 text-[#1a202c] dark:text-white">
                {existingPayment ? 'Editar Pago' : 'Registrar Pago'}: <span className="text-[#3498db] dark:text-[#5dade2]">{gastoFijo.gasto_fijo}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Fecha</label>
                    <div style={{ position: 'relative' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 bg-white dark:text-white dark:bg-gray-700"
                            style={{ paddingLeft: '35px' }}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Monto</label>
                        <div style={{ position: 'relative' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            <input
                                type="number"
                                step="0.01"
                                value={monto}
                                onChange={(e) => setMonto(parseFloat(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 bg-white dark:text-white dark:bg-gray-700"
                                style={{ paddingLeft: '35px' }}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Moneda</label>
                        <div style={{ position: 'relative' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            <select
                                value={moneda}
                                onChange={(e) => setMoneda(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 bg-white dark:text-white dark:bg-gray-700 arrow-none"
                                style={{ paddingLeft: '35px' }}
                            >
                                <option value="Bolivianos">Bolivianos</option>
                                <option value="Dólares">Dólares</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Forma de Pago</label>
                    <div style={{ position: 'relative' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                            <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                        <select
                            value={formaPagoId}
                            onChange={(e) => setFormaPagoId(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 bg-white dark:text-white dark:bg-gray-700 appearance-none"
                            style={{ paddingLeft: '35px' }}
                        >
                            <option value="">Seleccione una forma de pago</option>
                            {formasPago.map((fp) => (
                                <option key={fp.id} value={fp.id}>
                                    {fp.forma_pago}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Observaciones</label>
                    <div style={{ position: 'relative' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '15px', pointerEvents: 'none' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 bg-white dark:text-white dark:bg-gray-700"
                            rows={3}
                            style={{ paddingLeft: '35px' }}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2">

                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg> Cancelar
                    </button>
                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        {existingPayment ? 'Guardar Cambios' : 'Pagar'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PagosGastosFijosForm;
