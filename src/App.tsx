import { useState, useEffect, useCallback } from 'react';
import { clearSession, readSession } from '../utils/auth';
import {
  cambiarEstado, eliminarOrden, guardarCita, guardarRecepcion,
  listarCitas, listarInventario, listarRecepcion, reiniciarDatos,
} from '../utils/recepcion';
import NavSidebar from './components/NavSidebar';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Reception from './views/Reception';
import Orders from './views/Orders';
import Workshop from './views/Workshop';
import Diagnosis from './views/Diagnosis';
import Inventory from './views/Inventory';
import Clients from './views/Clients';
import Reports from './views/Reports';
import Config from './views/Config';
import DatabaseSchema from './views/DatabaseSchema';
import Agenda from './views/Agenda';
import PaymentModal from './components/PaymentModal';
import {
  type ServiceOrder, type InventoryItem, type Client, type Vehicle,
  type View, type Role, type Appointment,
} from './store';

type Session = { role: Role; name: string };

const defaultViewByRole: Record<Role, View> = {
  admin: 'dashboard',
  asesor: 'reception',
  tecnico: 'workshop',
};

const sidebarViews: View[] = ['reception', 'orders'];

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const saved = readSession();
    return saved ? { role: saved.role, name: saved.name } : null;
  });
  const [view, setView] = useState<View>(() => {
    const saved = readSession();
    return saved ? defaultViewByRole[saved.role] : 'reception';
  });
  const [selectedOS, setSelectedOS] = useState('');
  const [pendingPaymentOS, setPendingPaymentOS] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : false;
  });

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  // Apply saved preference on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, []);

  // Shared state
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadError, setLoadError] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [syncingApts, setSyncingApts] = useState(false);

  const syncAppointments = useCallback(async () => {
    setSyncingApts(true);
    try {
      setAppointments(await listarCitas());
    } catch {
      return;
    } finally {
      setSyncingApts(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoadError('');
    listarRecepcion()
      .then((remote) => {
        setClients(remote.clientes);
        setVehicles(remote.vehiculos);
        setOrders(remote.ordenes);
        setSelectedOS(remote.ordenes[0]?.os ?? '');
      })
      .catch((error) => {
        setClients([]);
        setVehicles([]);
        setOrders([]);
        setSelectedOS('');
        setLoadError(error instanceof Error ? error.message : 'No se pudo cargar la recepción.');
      });
    listarInventario()
      .then(setInventory)
      .catch(() => setInventory([]));
    listarCitas()
      .then(setAppointments)
      .catch(() => setAppointments([]));
  }, [session]);

  // Sincronizar citas remotas cuando se abre la Agenda
  useEffect(() => {
    if (view === 'agenda') {
      syncAppointments();
    }
  }, [view, syncAppointments]);
  // Nueva orden en borrador — solo se agrega a orders cuando el usuario guarda
  const [draftNewOrder, setDraftNewOrder] = useState<ServiceOrder | null>(null);

  const handleLogin = (role: Role, name: string) => {
    setSession({ role, name });
    setView(defaultViewByRole[role]);
    setSelectedOS('');
    setDraftNewOrder(null);
  };

  const reiniciarDatosTaller = async () => {
    await reiniciarDatos();
    setClients([]);
    setVehicles([]);
    setOrders([]);
    setSelectedOS('');
    setDraftNewOrder(null);
    setPendingPaymentOS(null);
    const [piezas, citas] = await Promise.all([listarInventario(), listarCitas()]);
    setInventory(piezas);
    setAppointments(citas);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setDraftNewOrder(null);
  };

  const selectOS = (os: string) => {
    setDraftNewOrder(null);
    setSelectedOS(os);
    setView('reception');
  };

  const createNewOrder = () => {
    const nextNum = String(orders.length + 568).padStart(6, '0');
    const newOS: ServiceOrder = {
      os: `OS-2024-${nextNum}`,
      clientId: '',
      vehicleId: '',
      advisor: session?.name ?? '',
      date: new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/'),
      status: 'recepcion',
      fuelLevel: 50,
      hasKey: false,
      hasAlarm: false,
      authSigned: false,
      warranty: false,
      warrantyType: '',
      warrantyNum: '',
      clientObservations: '',
      techNotes: '',
      inspectionNotes: '',
      parts: {
        'Parabrisas': true, 'Espejo Izq.': true, 'Faro Izq.': true,
        'Llanta Del. Izq.': true, 'Puerta Izq.': true, 'Puerta Tras. Izq.': true,
        'Parabrisas Tras.': true, 'Espejo Der.': true, 'Faro Der.': true,
        'Llanta Del. Der.': true, 'Puerta Der.': true, 'Puerta Tras. Der.': true, 'Parachoques Tras.': true,
      },
      services: [],
      usedParts: [],
    };
    setDraftNewOrder(newOS); // solo en borrador, no en la lista
    setView('reception');
  };

  const upsertById = <T extends { id: string }>(items: T[], item: T) => {
    const index = items.findIndex((current) => current.id === item.id);
    if (index === -1) return [item, ...items];
    return items.map((current) => (current.id === item.id ? item : current));
  };

  const telefonoDe = (valor: string) => valor.replace(/\D/g, '');
  const emailDe = (valor: string) => valor.trim().toLowerCase();
  const mismoContacto = (a: Client, b: Client) => {
    const telefono = telefonoDe(a.phone);
    const email = emailDe(a.email);
    if (telefono && telefono === telefonoDe(b.phone)) return true;
    if (email && email === emailDe(b.email)) return true;
    return false;
  };
  const reutilizarCliente = (client: Client) => {
    if (/^\d+$/.test(client.id)) return client;
    const conocido = clients.find((item) => /^\d+$/.test(item.id) && mismoContacto(item, client));
    return conocido ? { ...client, id: conocido.id } : client;
  };

  const saveOrder = async (
    updated: ServiceOrder,
    clientArg?: Client,
    vehicleArg?: Vehicle,
  ): Promise<ServiceOrder> => {
    const ingresado = clientArg ?? clients.find((item) => item.id === updated.clientId);
    const client = ingresado ? reutilizarCliente(ingresado) : ingresado;
    const vehicle = vehicleArg ?? vehicles.find((item) => item.id === updated.vehicleId);
    if (!client?.name || !vehicle?.plate) {
      throw new Error('Completa el nombre del cliente y la placa del vehículo.');
    }
    const guardado = await guardarRecepcion(updated, client, vehicle);
    const persisted: ServiceOrder = {
      ...updated,
      ...guardado.orden,
      diagnosis: guardado.orden.diagnosis ?? updated.diagnosis,
      diagnosisNotes: updated.diagnosisNotes,
      payment: guardado.orden.payment ?? updated.payment,
    };
    setClients((prev) => upsertById(prev, guardado.cliente).filter((item) => (
      item.id === guardado.cliente.id || !mismoContacto(item, guardado.cliente)
    )));
    setVehicles((prev) => upsertById(prev, guardado.vehiculo));
    setOrders((prev) => [
      persisted,
      ...prev.filter((item) => item.os !== updated.os && item.os !== persisted.os),
    ]);
    setSelectedOS(persisted.os);
    if (draftNewOrder && updated.os === draftNewOrder.os) setDraftNewOrder(null);
    return persisted;
  };

  const advanceOrder = async (os: string, status?: ServiceOrder['status']) => {
    const current = status ?? orders.find((item) => item.os === os)?.status;
    if (!current || current === 'terminada') return;
    if (current === 'en_taller') {
      setPendingPaymentOS(os);
      return;
    }
    try {
      const updated = await cambiarEstado(os, 'en_taller');
      setOrders((prev) => prev.map((item) => (
        item.os === os ? { ...item, status: updated.status } : item
      )));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo cambiar el estado.');
    }
  };

  const handlePaymentConfirm = async (payment: ServiceOrder['payment']) => {
    if (!pendingPaymentOS) return;
    const numero = pendingPaymentOS;
    try {
      const updated = await cambiarEstado(numero, 'terminada', payment);
      setOrders((prev) => prev.map((item) => (
        item.os === numero ? { ...item, ...updated, status: 'terminada', payment: updated.payment ?? payment } : item
      )));
      setPendingPaymentOS(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo cerrar la orden.');
    }
  };

  const navigate = (v: View) => {
    if (v === 'parts') {
      setDraftNewOrder(null);
      setView('inventory');
      return;
    }
    if (v === 'reception') {
      createNewOrder();
      return;
    }
    setDraftNewOrder(null);
    setView(v);
  };

  if (!session) return <Login onLogin={handleLogin} />;

  const { role, name } = session;
  const blankClient: Client = { id: '', name: '', phone: '', email: '', address: '', city: '' };
  const blankVehicle: Vehicle = { id: '', clientId: '', plate: '', brand: '', model: '', year: '', color: '', vin: '', engine: '', fuel: '', transmission: '', km: 0 };

  // Si hay un borrador de nueva orden, Reception lo muestra; si no, muestra la orden seleccionada
  const receptionOrder = draftNewOrder
    ?? orders.find((item) => item.os === selectedOS)
    ?? orders[0]
    ?? null;
  const currentClient = receptionOrder
    ? clients.find((item) => item.id === receptionOrder.clientId) ?? blankClient
    : blankClient;
  const currentVehicle = receptionOrder
    ? vehicles.find((item) => item.id === receptionOrder.vehicleId) ?? blankVehicle
    : blankVehicle;
  const showSidebar = sidebarViews.includes(view);

  const pendingOrder = pendingPaymentOS ? orders.find(o => o.os === pendingPaymentOS) : null;
  const pendingTotal = pendingOrder
    ? (pendingOrder.services ?? []).reduce((s, v) => s + v.price, 0) +
      (pendingOrder.usedParts ?? []).filter(p => p.used).reduce((s, p) => s + p.price * p.qty, 0)
    : 0;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left nav sidebar */}
      <NavSidebar
        currentView={view}
        onNavigate={navigate}
        role={role}
        userName={name}
        onLogout={handleLogout}
      />

      {/* Right: topbar + content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          currentView={view}
          onNavigate={navigate}
          role={role}
          darkMode={darkMode}
          onToggleDark={toggleDark}
          orders={orders}
          inventory={inventory}
        />

        <div className="flex flex-1 overflow-hidden">
          {showSidebar && (
            <Sidebar
              orders={orders}
              clients={clients}
              vehicles={vehicles}
              selectedOS={selectedOS}
              onSelectOS={selectOS}
              onNewOrder={createNewOrder}
            />
          )}

        <main className="flex-1 overflow-hidden flex flex-col">
          {loadError && (
            <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {loadError}
            </div>
          )}
          {view === 'dashboard' && (
            <Dashboard
              orders={orders} clients={clients} vehicles={vehicles}
              onNavigate={navigate}
              onSelectOS={selectOS}
            />
          )}
          {/* Always mounted so local draft state survives sidebar/orders navigation */}
          <div className={view === 'reception' ? 'flex-1 overflow-hidden flex flex-col' : 'hidden'}>
            {receptionOrder ? (
            <Reception
              order={receptionOrder}
              client={currentClient}
              vehicle={currentVehicle}
              clients={clients}
              vehicles={vehicles}
              inventory={inventory}
              allOrders={orders}
              onSave={saveOrder}
              onAdvance={advanceOrder}
            />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <p className="text-sm font-semibold text-slate-600">No hay órdenes de recepción.</p>
                  <button className="btn-primary" onClick={createNewOrder}>Nueva recepción</button>
                </div>
              </div>
            )}
          </div>
          {view === 'orders' && (
            <Orders
              orders={orders} clients={clients} vehicles={vehicles}
              role={role}
              onSelectOS={selectOS}
              onNavigate={navigate}
              onOpenOrder={os => { setDraftNewOrder(null); setSelectedOS(os); setView('reception'); }}
              onDeleteOrder={async (os) => {
                try {
                  await eliminarOrden(os);
                  setOrders(prev => prev.filter(o => o.os !== os));
                } catch (error) {
                  window.alert(error instanceof Error ? error.message : 'No se pudo eliminar la orden.');
                }
              }}
            />
          )}
          {view === 'workshop' && (
            <Workshop
              role={role} orders={orders} clients={clients} vehicles={vehicles}
              onUpdateOrder={saveOrder}
              onAdvanceOrder={advanceOrder}
            />
          )}
          {view === 'diagnosis' && (
            <Diagnosis
              orders={orders}
              clients={clients}
              vehicles={vehicles}
              onUpdateOrder={saveOrder}
            />
          )}
          {view === 'agenda' && (
            <Agenda
              appointments={appointments}
              syncing={syncingApts}
              onSync={syncAppointments}
              onUpdateAppointment={async (apt) => {
                try {
                  const guardada = await guardarCita(apt);
                  setAppointments(prev => prev.map(a => a.id === apt.id ? guardada : a));
                } catch (error) {
                  window.alert(error instanceof Error ? error.message : 'No se pudo guardar la cita.');
                }
              }}
              onAddAppointment={async (apt) => {
                const guardada = await guardarCita(apt);
                setAppointments(prev => [guardada, ...prev.filter(a => a.id !== apt.id)]);
              }}
              onConvertToOS={apt => {
                const nextNum = String(orders.length + 568).padStart(6, '0');
                const osId = `OS-2024-${nextNum}`;
                const ts = String(Date.now()).slice(-4);

                // Buscar cliente existente por teléfono
                let existingClient = clients.find(c => c.phone === apt.clientPhone);
                let clientId = existingClient?.id ?? '';
                let vehicleId = '';

                if (!existingClient) {
                  // Crear cliente nuevo a partir de los datos de la cita
                  const newClient: Client = {
                    id: `C${ts}`, name: apt.clientName, phone: apt.clientPhone,
                    email: '', address: '', city: '',
                  };
                  setClients(prev => [...prev, newClient]);
                  clientId = newClient.id;
                  existingClient = newClient;
                }

                // Buscar vehículo existente por placa
                const existingVehicle = vehicles.find(v => v.plate === apt.plate);
                if (existingVehicle) {
                  vehicleId = existingVehicle.id;
                } else if (apt.plate) {
                  // Crear vehículo nuevo con la placa de la cita
                  const newVehicle: Vehicle = {
                    id: `V${ts}`, clientId,
                    plate: apt.plate, brand: '', model: '', year: '',
                    color: '', vin: '', engine: '', fuel: '', transmission: '', km: 0,
                  };
                  setVehicles(prev => [...prev, newVehicle]);
                  vehicleId = newVehicle.id;
                }

                const newOS: ServiceOrder = {
                  os: osId, clientId, vehicleId,
                  advisor: name,
                  date: new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                  status: 'recepcion',
                  fuelLevel: 50, hasKey: false, hasAlarm: false, authSigned: false,
                  warranty: false, warrantyType: '', warrantyNum: '',
                  clientObservations: `${apt.service}${apt.notes ? '\n' + apt.notes : ''}`,
                  techNotes: '', inspectionNotes: '',
                  parts: { 'Parabrisas': true, 'Espejo Izq.': true, 'Faro Izq.': true, 'Llanta Del. Izq.': true, 'Puerta Izq.': true, 'Puerta Tras. Izq.': true, 'Parabrisas Tras.': true, 'Espejo Der.': true, 'Faro Der.': true, 'Llanta Del. Der.': true, 'Puerta Der.': true, 'Puerta Tras. Der.': true, 'Parachoques Tras.': true },
                  services: [], usedParts: [],
                };
                setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: 'confirmada' } : a));
                setOrders(prev => [newOS, ...prev]);
                setSelectedOS(osId);
                setDraftNewOrder(null);
                setView('orders');
              }}
            />
          )}
          {view === 'inventory' && (
            <Inventory inventory={inventory} onUpdateInventory={setInventory} role={role} />
          )}
          {view === 'clients' && (
            <Clients
              clients={clients} vehicles={vehicles} orders={orders}
              onSelectOS={selectOS}
              onNavigate={v => setView(v)}
              onAddClient={c => setClients(prev => [...prev, c])}
              onUpdateClient={c => setClients(prev => prev.map(x => x.id === c.id ? c : x))}
              onAddVehicle={v => setVehicles(prev => [...prev, v])}
            />
          )}
          {view === 'reports' && (
            <Reports orders={orders} clients={clients} vehicles={vehicles} />
          )}
          {view === 'config' && <Config />}
          {view === 'dbschema' && <DatabaseSchema onReset={reiniciarDatosTaller} />}
        </main>
        </div>
      </div>

      {pendingPaymentOS && pendingOrder && (
        <PaymentModal
          os={pendingPaymentOS}
          total={pendingTotal}
          onConfirm={handlePaymentConfirm}
          onCancel={() => setPendingPaymentOS(null)}
        />
      )}
    </div>
  );
}
