import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import Layout from './components/Layout';

// Views
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import POS from './views/POS';
import ShiftControl from './views/ShiftControl';
import Inventory from './views/Inventory';
import Hospitality from './views/Hospitality';
import Repairs from './views/Repairs';
import Deliveries from './views/Deliveries';
import HP from './views/HP';
import TradeIn from './views/TradeIn';
import Staff from './views/Staff';
import Customers from './views/Customers';
import Expenses from './views/Expenses';
import Reports from './views/Reports';
import Settings from './views/Settings';

export default function App() {
  const { token, initSocket, fetchCurrentShift, fetchSettings } = useStore();
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    if (token) {
      initSocket();
      fetchCurrentShift();
      fetchSettings();
    }
  }, [token]);

  if (!token) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS />;
      case 'shift':
        return <ShiftControl />;
      case 'inventory':
        return <Inventory />;
      case 'hospitality':
        return <Hospitality />;
      case 'repairs':
        return <Repairs />;
      case 'deliveries':
        return <Deliveries />;
      case 'hp':
        return <HP />;
      case 'tradein':
        return <TradeIn />;
      case 'staff':
        return <Staff />;
      case 'customers':
        return <Customers />;
      case 'expenses':
        return <Expenses />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderView()}
    </Layout>
  );
}
