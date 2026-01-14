

import React, { useState } from 'react';
import ManualModal, { type ManualSection } from './ManualModal';

const Configuration: React.FC = () => {
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Configuración del Sistema',
            content: 'Desde este panel puede acceder a las distintas opciones de configuración disponibles en el menú lateral o superior.'
        },
        {
            title: 'Opciones',
            content: 'Explore las subsecciones para configurar Usuarios, Chatbot, Categorías de Pacientes, entre otros.'
        }
    ];
    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Configuración</h2>
                <button
                    onClick={() => setShowManual(true)}
                    style={{
                        backgroundColor: '#f1f1f1',
                        border: '1px solid #ddd',
                        padding: '6px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '30px',
                        height: '30px',
                        fontSize: '14px',
                        color: '#555'
                    }}
                    title="Ayuda / Manual"
                >
                    ?
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Backup de Base de Datos */}
                <div
                    onClick={() => window.location.href = '/backup'}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-500"
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Backup de BD</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Crear, restaurar y gestionar copias de seguridad de la base de datos</p>
                </div>

                {/* Chatbot Configuration */}
                <div
                    onClick={() => window.location.href = '/configuration/chatbot'}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-green-500"
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Chatbot</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Configurar el chatbot de WhatsApp y sus respuestas automáticas</p>
                </div>

                {/* Users Management */}
                <div
                    onClick={() => window.location.href = '/users'}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-500"
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Usuarios</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Gestionar usuarios del sistema y sus permisos</p>
                </div>
            </div>


            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Configuración"
                sections={manualSections}
            />
        </div >
    );
};

export default Configuration;
