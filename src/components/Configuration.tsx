

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
            <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-gray-600">Panel de configuración del sistema.</p>
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
