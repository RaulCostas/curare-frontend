import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import UserList from './components/UserList';
import UserForm from './components/UserForm'; // Note: Used as Route component now
import Home from './components/Home';
import DoctorList from './components/DoctorList';
import DoctorForm from './components/DoctorForm';
import ProveedorList from './components/ProveedorList';
import ProveedorForm from './components/ProveedorForm';
import PersonalList from './components/PersonalList';
import PersonalForm from './components/PersonalForm';
import EspecialidadList from './components/EspecialidadList';
import EspecialidadForm from './components/EspecialidadForm';
import ArancelList from './components/ArancelList';
import ArancelForm from './components/ArancelForm';
import EgresoList from './components/EgresoList';
import EgresoForm from './components/EgresoForm';
import LaboratorioList from './components/LaboratorioList';
import LaboratorioForm from './components/LaboratorioForm';
import PrecioLaboratorioList from './components/PrecioLaboratorioList';
import PrecioLaboratorioForm from './components/PrecioLaboratorioForm';
import TrabajosLaboratoriosList from './components/TrabajosLaboratoriosList';
import TrabajosLaboratoriosForm from './components/TrabajosLaboratoriosForm';
import PagosLaboratoriosList from './components/PagosLaboratoriosList';
import PagosLaboratoriosForm from './components/PagosLaboratoriosForm';
import SeguimientoTrabajoComponent from './components/SeguimientoTrabajo';
import PacienteList from './components/PacienteList';
import PacienteForm from './components/PacienteForm';
import CategoriaPacienteList from './components/CategoriaPacienteList';
import PersonalTipoList from './components/PersonalTipoList';
import PersonalTipoForm from './components/PersonalTipoForm';
import CategoriaPacienteForm from './components/CategoriaPacienteForm';
import PresupuestoList from './components/PresupuestoList';
import PresupuestoForm from './components/PresupuestoForm';
import HistoriaClinica from './components/HistoriaClinica';
import PagosList from './components/PagosList';
import PagosForm from './components/PagosForm';
import ComisionTarjetaList from './components/ComisionTarjetaList';
import ComisionTarjetaForm from './components/ComisionTarjetaForm';
import PagosPedidosList from './components/PagosPedidosList';
import PagosPedidosForm from './components/PagosPedidosForm';
import GastosFijosList from './components/GastosFijosList';
import GastosFijosForm from './components/GastosFijosForm';
import AgendaView from './components/AgendaView';
import CorreosList from './components/CorreosList';
import Configuration from './components/Configuration';
import ChatbotConfig from './components/ChatbotConfig';
import FormaPagoList from './components/FormaPagoList';
import FormaPagoForm from './components/FormaPagoForm';
import GrupoInventarioList from './components/GrupoInventarioList';
import GrupoInventarioForm from './components/GrupoInventarioForm';
import InventarioList from './components/InventarioList';
import InventarioForm from './components/InventarioForm';
import VacacionesList from './components/VacacionesList';
import VacacionesForm from './components/VacacionesForm';
import CalificacionList from './components/CalificacionList';
import CalificacionForm from './components/CalificacionForm';
import PedidosList from './components/PedidosList';
import PedidosForm from './components/PedidosForm';
import PacientesDeudores from './components/PacientesDeudores';
import PacientesPendientes from './components/PacientesPendientes';
import CubetasList from './components/CubetasList';
import CubetasForm from './components/CubetasForm';
import { ChatProvider } from './context/ChatContext';
import { CorreosProvider } from './context/CorreosContext';
import DeudasLaboratorios from './components/DeudasLaboratorios';
import DeudasPedidos from './components/DeudasPedidos';
import PagosDoctoresList from './components/PagosDoctoresList';
import PagosDoctoresForm from './components/PagosDoctoresForm';
import PropuestasList from './components/PropuestasList';
import PropuestasForm from './components/PropuestasForm';
import ProtectedRoute from './components/ProtectedRoute';
import HojaDiaria from './components/HojaDiaria';
import Utilidades from './components/Utilidades';
import Estadisticas from './components/Estadisticas';
import EstadisticasDoctores from './components/EstadisticasDoctores';
import EstadisticasEspecialidades from './components/EstadisticasEspecialidades';
import EstadisticasPacientesNuevos from './components/EstadisticasPacientesNuevos';

import EstadisticasProductos from './components/EstadisticasProductos';
import EstadisticasUtilidades from './components/EstadisticasUtilidades';
import RecetarioList from './components/RecetarioList';
import RecetarioForm from './components/RecetarioForm';
import RecordatorioList from './components/RecordatorioList';
import RecordatorioForm from './components/RecordatorioForm';
import ContactosList from './components/ContactosList';
import ContactosForm from './components/ContactosForm';
import BackupManager from './components/BackupManager';
import MusicaTelevisionView from './components/MusicaTelevisionView';


import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <Router>
            <ChatProvider>
                <CorreosProvider>
                    <ThemeProvider>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/" element={<Layout />}>
                                <Route index element={<Home />} />

                                {/* Agenda */}
                                <Route element={<ProtectedRoute moduleId="agenda" />}>
                                    <Route path="/agenda" element={<AgendaView />} />
                                </Route>

                                {/* Usuarios & Configuration */}
                                <Route element={<ProtectedRoute moduleId="usuarios" />}>
                                    <Route path="/users" element={<UserList />} />
                                    <Route path="/users/create" element={<UserForm />} />
                                    <Route path="/users/edit/:id" element={<UserForm />} />
                                    <Route path="/configuration" element={<Configuration />} />
                                    <Route path="/configuration/chatbot" element={<ChatbotConfig />} />
                                    <Route path="/backup" element={<BackupManager />} />
                                    <Route path="/correos" element={<CorreosList />} />
                                </Route>

                                {/* Doctores & Especialidades */}
                                {/* Note: 'doctores' is not currently in PermisosModal list, but we can wrap it if we add it. 
                                For now, excluding strict check or using 'personal' if appropriate? 
                                Leaving Doctores unrestricted as per current PermisosModal definition. */}
                                <Route path="/doctors" element={<DoctorList />} />
                                <Route path="/doctors/create" element={<DoctorForm />} />
                                <Route path="/doctors/edit/:id" element={<DoctorForm />} />
                                <Route path="/especialidad" element={<EspecialidadList />} />
                                <Route path="/especialidad/create" element={<EspecialidadForm />} />
                                <Route path="/especialidad/edit/:id" element={<EspecialidadForm />} />
                                <Route path="/pagos-doctores" element={<PagosDoctoresList />} />
                                <Route path="/pagos-doctores/create" element={<PagosDoctoresForm />} />
                                <Route path="/pagos-doctores/edit/:id" element={<PagosDoctoresForm />} />


                                {/* Providers / ADMs */}
                                <Route element={<ProtectedRoute moduleId="adms" />}>
                                    <Route path="/proveedores" element={<ProveedorList />} />
                                    <Route path="/proveedores/create" element={<ProveedorForm />} />
                                    <Route path="/proveedores/edit/:id" element={<ProveedorForm />} />
                                </Route>

                                {/* Personal */}
                                <Route element={<ProtectedRoute moduleId="personal" />}>
                                    <Route path="/personal" element={<PersonalList />} />
                                    <Route path="/personal/create" element={<PersonalForm />} />
                                    <Route path="/personal/edit/:id" element={<PersonalForm />} />
                                    <Route path="/vacaciones" element={<VacacionesList />} />
                                    <Route path="/vacaciones/nuevo" element={<VacacionesForm />} />
                                    <Route path="/vacaciones/editar/:id" element={<VacacionesForm />} />
                                    <Route path="/calificacion" element={<CalificacionList />} />
                                    <Route path="/calificacion/create" element={<CalificacionForm />} />
                                    <Route path="/calificacion/edit/:id" element={<CalificacionForm />} />
                                </Route>

                                {/* Arancel? Maybe configuration or independent */}
                                <Route path="/arancel" element={<ArancelList />} />
                                <Route path="/arancel/create" element={<ArancelForm />} />
                                <Route path="/arancel/edit/:id" element={<ArancelForm />} />

                                {/* Egresos & Gastos */}
                                <Route element={<ProtectedRoute moduleId="gastos" />}>
                                    <Route path="/egresos" element={<EgresoList />} />
                                    <Route path="/egresos/create" element={<EgresoForm />} />
                                    <Route path="/egresos/edit/:id" element={<EgresoForm />} />
                                    <Route path="/gastos-fijos" element={<GastosFijosList />} />
                                    <Route path="/gastos-fijos/create" element={<GastosFijosForm />} />
                                    <Route path="/gastos-fijos/edit/:id" element={<GastosFijosForm />} />
                                </Route>

                                {/* Laboratorios */}
                                <Route element={<ProtectedRoute moduleId="laboratorios" />}>
                                    <Route path="/laboratorios" element={<LaboratorioList />} />
                                    <Route path="/laboratorios/create" element={<LaboratorioForm />} />
                                    <Route path="/laboratorios/edit/:id" element={<LaboratorioForm />} />
                                    <Route path="/precios-laboratorios" element={<PrecioLaboratorioList />} />
                                    <Route path="/precios-laboratorios/create" element={<PrecioLaboratorioForm />} />
                                    <Route path="/precios-laboratorios/edit/:id" element={<PrecioLaboratorioForm />} />
                                    <Route path="/trabajos-laboratorios" element={<TrabajosLaboratoriosList />} />
                                    <Route path="/trabajos-laboratorios/nuevo" element={<TrabajosLaboratoriosForm />} />
                                    <Route path="/trabajos-laboratorios/editar/:id" element={<TrabajosLaboratoriosForm />} />
                                    <Route path="/pagos-laboratorios" element={<PagosLaboratoriosList />} />
                                    <Route path="/pagos-laboratorios/deudas" element={<DeudasLaboratorios />} />
                                    <Route path="/trabajos-laboratorios/seguimiento/:workId" element={<SeguimientoTrabajoComponent />} />
                                    <Route path="/pagos-laboratorios/nuevo" element={<PagosLaboratoriosForm />} />
                                    <Route path="/pagos-laboratorios/edit/:id" element={<PagosLaboratoriosForm />} />
                                    <Route path="/cubetas" element={<CubetasList />} />
                                    <Route path="/cubetas/create" element={<CubetasForm />} />
                                    <Route path="/cubetas/edit/:id" element={<CubetasForm />} />
                                </Route>

                                {/* Pacientes */}
                                <Route element={<ProtectedRoute moduleId="pacientes" />}>
                                    <Route path="/pacientes" element={<PacienteList />} />
                                    <Route path="/pacientes/create" element={<PacienteForm />} />
                                    <Route path="/pacientes/edit/:id" element={<PacienteForm />} />
                                    <Route path="/pacientes-pendientes" element={<PacientesPendientes />} />
                                    <Route path="/categoria-paciente" element={<CategoriaPacienteList />} />
                                    <Route path="/personal-tipo" element={<PersonalTipoList />} />
                                    <Route path="/personal-tipo/create" element={<PersonalTipoForm />} />
                                    <Route path="/personal-tipo/edit/:id" element={<PersonalTipoForm />} />
                                    <Route path="/categoria-paciente/create" element={<CategoriaPacienteForm />} />
                                    <Route path="/categoria-paciente/edit/:id" element={<CategoriaPacienteForm />} />
                                    <Route path="/pacientes/:id/historia-clinica" element={<HistoriaClinica />} />
                                    <Route path="/pacientes-deudores" element={<PacientesDeudores />} />
                                    <Route path="/recetario" element={<RecetarioList />} />
                                    <Route path="/recetario/create" element={<RecetarioForm />} />
                                    <Route path="/recetario/edit/:id" element={<RecetarioForm />} />

                                    {/* Presupuestos & Propuestas sub-routes */}
                                    <Route element={<ProtectedRoute moduleId="presupuestos" />}>
                                        <Route path="/pacientes/:id/presupuestos" element={<PresupuestoList />} />
                                        <Route path="/pacientes/:id/presupuestos/create" element={<PresupuestoForm />} />
                                        <Route path="/pacientes/:id/presupuestos/edit/:proformaId" element={<PresupuestoForm />} />
                                        <Route path="/pacientes/:id/presupuestos/view/:proformaId" element={<PresupuestoForm />} />
                                        <Route path="/pacientes/:id/propuestas" element={<PropuestasList />} />
                                        <Route path="/pacientes/:id/propuestas/create" element={<PropuestasForm />} />
                                        <Route path="/pacientes/:id/propuestas/edit/:propuestaId" element={<PropuestasForm />} />
                                        <Route path="/pacientes/:id/propuestas/view/:propuestaId" element={<PropuestasForm />} />
                                    </Route>
                                </Route>

                                {/* Pagos */}
                                <Route element={<ProtectedRoute moduleId="pagos" />}>
                                    <Route path="/pagos" element={<PagosList />} />
                                    <Route path="/pagos/nuevo" element={<PagosForm />} />
                                    <Route path="/pagos/edit/:id" element={<PagosForm />} />
                                    <Route path="/pagos-pedidos" element={<PagosPedidosList />} />
                                    <Route path="/pagos-pedidos/create" element={<PagosPedidosForm />} />
                                    <Route path="/pagos-pedidos/edit/:id" element={<PagosPedidosForm />} />
                                    <Route path="/comision-tarjeta" element={<ComisionTarjetaList />} />
                                    <Route path="/comision-tarjeta/new" element={<ComisionTarjetaForm />} />
                                    <Route path="/comision-tarjeta/edit/:id" element={<ComisionTarjetaForm />} />
                                    <Route path="/forma-pago" element={<FormaPagoList />} />
                                    <Route path="/forma-pago/create" element={<FormaPagoForm />} />
                                    <Route path="/forma-pago/edit/:id" element={<FormaPagoForm />} />
                                </Route>

                                {/* Inventario */}
                                <Route element={<ProtectedRoute moduleId="inventario" />}>
                                    <Route path="/grupo-inventario" element={<GrupoInventarioList />} />
                                    <Route path="/grupo-inventario/create" element={<GrupoInventarioForm />} />
                                    <Route path="/grupo-inventario/edit/:id" element={<GrupoInventarioForm />} />
                                    <Route path="/inventario" element={<InventarioList />} />
                                    <Route path="/pedidos" element={<PedidosList />} />
                                    <Route path="/pedidos/deudas" element={<DeudasPedidos />} />
                                    <Route path="/pedidos/create" element={<PedidosForm />} />
                                    <Route path="/pedidos/edit/:id" element={<PedidosForm />} />
                                    <Route path="/inventario/create" element={<InventarioForm />} />
                                    <Route path="/inventario/edit/:id" element={<InventarioForm />} />
                                </Route>

                                {/* Nuevos Módulos */}
                                <Route path="/hoja-diaria" element={<HojaDiaria />} />
                                <Route path="/utilidades" element={<Utilidades />} />
                                <Route path="/estadisticas" element={<Estadisticas />} />
                                <Route path="/estadisticas/doctores" element={<EstadisticasDoctores />} />
                                <Route path="/estadisticas/especialidades" element={<EstadisticasEspecialidades />} />
                                <Route path="/estadisticas/pacientes-nuevos" element={<EstadisticasPacientesNuevos />} />
                                <Route path="/estadisticas/productos" element={<EstadisticasProductos />} />
                                <Route path="/estadisticas/utilidades" element={<EstadisticasUtilidades />} />

                                {/* Recordatorios */}
                                <Route path="/recordatorio" element={<RecordatorioList />} />
                                <Route path="/recordatorio/create" element={<RecordatorioForm />} />
                                <Route path="/recordatorio/edit/:id" element={<RecordatorioForm />} />

                                {/* Contactos */}
                                <Route path="/contactos" element={<ContactosList />} />
                                <Route path="/contactos/create" element={<ContactosForm />} />
                                <Route path="/contactos/edit/:id" element={<ContactosForm />} />

                                {/* Música / Televisión */}
                                <Route path="/musica-television" element={<MusicaTelevisionView />} />
                            </Route>

                        </Routes>
                    </ThemeProvider>
                </CorreosProvider>
            </ChatProvider>
        </Router>
    );
}

export default App;
