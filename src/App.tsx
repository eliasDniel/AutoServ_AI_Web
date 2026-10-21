import { useState, useEffect, useCallback } from 'react';
import { clearSession, readSession } from '../utils/auth';
import * as api from '../utils/supabase/api';
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
  initialClients, initialVehicles, initialOrders, initialInventory, initialAppointments,
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
  const [selectedOS, setSelectedOS] = useState(initialOrders[0].os);
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
  const [orders, setOrders] = useState<ServiceOrder[]>(initialOrders);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [syncingApts, setSyncingApts] = useState(false);

  const syncAppointments = useCallback(async () => {
    setSyncingApts(true);
    try {
      const remote = await api.appointments.list();
      if (remote.length > 0) {
        setAppointments(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const newOnes = remote.filter(r => !existingIds.has(r.id));
          return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
        });
      }
    } finally {
      setSyncingApts(false);
    }
  }, []);

  // Cargar datos reales desde Supabase al hacer login
  useEffect(() => {
    if (!session) return;
    Promise.all([
      api.clients.list(),
      api.vehicles.list(),
      api.orders.list(),
      api.inventory.list(),
    ]).then(([remoteClients, remoteVehicles, remoteOrders, remoteInventory]) => {
      if (remoteClients.length > 0) setClients(remoteClients);
      if (remoteVehicles.length > 0) setVehicles(remoteVehicles);
      if (remoteOrders.length > 0) {
        setOrders(remoteOrders);
        setSelectedOS(remoteOrders[0].os);
      }
      if (remoteInventory.length > 0) setInventory(remoteInventory);
    });
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
    setSelectedOS(initialOrders[0].os);
    setDraftNewOrder(null);
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

  const saveOrder = (updated: ServiceOrder) => {
    api.orders.save(updated); // persiste en Supabase
    if (draftNewOrder && updated.os === draftNewOrder.os) {
      setOrders(prev => [updated, ...prev]);
      setSelectedOS(updated.os);
      setDraftNewOrder(null);
    } else {
      setOrders(prev => prev.map(o => o.os === updated.os ? updated : o));
    }
  };

  const advanceOrder = (os: string) => {
    const order = orders.find(o => o.os === os);
    if (!order) return;
    if (order.status === 'en_taller') {
      // Show payment modal before marking as terminada
      setPendingPaymentOS(os);
    } else if (order.status === 'recepcion') {
      setOrders(prev => prev.map(o => o.os === os ? { ...o, status: 'en_taller' } : o));
    }
  };

  const handlePaymentConfirm = (payment: ServiceOrder['payment']) => {
    if (!pendingPaymentOS) return;
    setOrders(prev => prev.map(o =>
      o.os === pendingPaymentOS
        ? { ...o, status: 'terminada', payment }
        : o
    ));
    setPendingPaymentOS(null);
  };

  const navigate = (v: View) => {
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
  const receptionOrder = draftNewOrder ?? (orders.find(o => o.os === selectedOS) ?? orders[0]);
  const currentClient = clients.find(c => c.id === receptionOrder.clientId) ?? blankClient;
  const currentVehicle = vehicles.find(v => v.id === receptionOrder.vehicleId) ?? blankVehicle;
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
          {view === 'dashboard' && (
            <Dashboard
              orders={orders} clients={clients} vehicles={vehicles}
              onNavigate={navigate}
              onSelectOS={selectOS}
            />
          )}
          {/* Always mounted so local draft state survives sidebar/orders navigation */}
          <div className={view === 'reception' ? 'flex-1 overflow-hidden flex flex-col' : 'hidden'}>
            <Reception
              order={receptionOrder}
              client={currentClient}
              vehicle={currentVehicle}
              inventory={inventory}
              allOrders={orders}
              onSave={saveOrder}
              onAdvance={advanceOrder}
              onCreateClientVehicle={(c, v, osId) => {
                api.clients.save(c);
                api.vehicles.save(v);
                setClients(prev => [...prev, c]);
                setVehicles(prev => [...prev, v]);
                if (draftNewOrder && osId === draftNewOrder.os) {
                  // Actualiza el borrador con clientId/vehicleId, pero no lo agrega a la lista aún
                  setDraftNewOrder(prev => prev ? { ...prev, clientId: c.id, vehicleId: v.id } : null);
                } else {
                  setOrders(prev => prev.map(o => o.os === osId ? { ...o, clientId: c.id, vehicleId: v.id } : o));
                }
              }}
              onUpdateClientVehicle={(c, v) => {
                api.clients.update(c);
                api.vehicles.update(v);
                setClients(prev => prev.map(x => x.id === c.id ? c : x));
                setVehicles(prev => prev.map(x => x.id === v.id ? v : x));
              }}
            />
          </div>
          {view === 'orders' && (
            <Orders
              orders={orders} clients={clients} vehicles={vehicles}
              role={role}
              onSelectOS={selectOS}
              onNavigate={navigate}
              onOpenOrder={os => { setDraftNewOrder(null); setSelectedOS(os); setView('reception'); }}
              onDeleteOrder={os => { api.orders.remove(os); setOrders(prev => prev.filter(o => o.os !== os)); }}
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
              onUpdateAppointment={apt => setAppointments(prev => prev.map(a => a.id === apt.id ? apt : a))}
              onAddAppointment={apt => setAppointments(prev => [apt, ...prev])}
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
          {(view === 'inventory' || view === 'parts') && (
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
          {view === 'dbschema' && <DatabaseSchema />}
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
