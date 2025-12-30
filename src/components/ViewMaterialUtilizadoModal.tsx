import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { MaterialUtilizado } from '../types';
import Swal from 'sweetalert2';

interface ViewMaterialUtilizadoModalProps {
    isOpen: boolean;
    onClose: () => void;
    historiaClinicaId: number;
}

const ViewMaterialUtilizadoModal: React.FC<ViewMaterialUtilizadoModalProps> = ({
    isOpen,
    onClose,
    historiaClinicaId
}) => {
    const [material, setMaterial] = useState<MaterialUtilizado | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && historiaClinicaId) {
            fetchMaterial();
        }
    }, [isOpen, historiaClinicaId]);

    const fetchMaterial = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/material-utilizado/historia/${historiaClinicaId}`);
            setMaterial(response.data);
        } catch (error) {
            console.error('Error fetching material utilizado:', error);
            Swal.fire({
                icon: 'info',
                title: 'Sin Material Registrado',
                text: 'No se ha registrado material utilizado para esta Historia Clínica',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Material Utilizado
                    </h3>
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded transition-colors"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando...</p>
                        </div>
                    ) : material ? (
                        <div className="space-y-4">
                            {/* Material */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                    Material
                                </label>
                                <p className="text-lg font-medium text-gray-800 dark:text-white">
                                    {material.inventario?.descripcion || 'N/A'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Fecha */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                        Fecha
                                    </label>
                                    <p className="text-lg font-medium text-gray-800 dark:text-white">
                                        {material.fecha ? new Date(material.fecha).toLocaleDateString('es-ES') : 'N/A'}
                                    </p>
                                </div>

                                {/* Cantidad */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                        Cantidad
                                    </label>
                                    <p className="text-lg font-medium text-gray-800 dark:text-white">
                                        {material.cantidad || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Observaciones */}
                            {material.observaciones && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                        Observaciones
                                    </label>
                                    <p className="text-gray-800 dark:text-white">
                                        {material.observaciones}
                                    </p>
                                </div>
                            )}

                            {/* Usuario */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                    Registrado por
                                </label>
                                <p className="text-gray-800 dark:text-white">
                                    {material.user?.name || 'N/A'}
                                </p>
                            </div>

                            {/* Fecha de registro */}
                            {material.createdAt && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                                    Registrado el: {new Date(material.createdAt).toLocaleString('es-ES')}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>No hay información disponible</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewMaterialUtilizadoModal;
