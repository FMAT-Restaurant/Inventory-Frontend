import { useState } from 'react';
import { InventoryProvider } from './context/InventoryContext.jsx';
import { Shell } from './components/layout/Shell.jsx';
import { InsumosPage } from './pages/InsumosPage.jsx';
import { RecetasPage } from './pages/RecetasPage.jsx';
import { MovimientosPage } from './pages/MovimientosPage.jsx';

function MainApp() {
  const [activeTab, setActiveTab] = useState('insumos');

  const pageTitles: Record<string, string> = {
    insumos: 'Gestión de Insumos y Lotes',
    recetas: 'Catálogo de Recetas y Disponibilidad',
    movimientos: 'Movimientos de Almacén'
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'insumos':
        return <InsumosPage />;
      case 'recetas':
        return <RecetasPage />;
      case 'movimientos':
        return <MovimientosPage />;
      default:
        return null;
    }
  };

  return (
    <Shell
      activeTab={activeTab}
      onTabChange={(tab: string) => {
        setActiveTab(tab);
      }}
      pageTitle={pageTitles[activeTab] || 'Inventario'}
    >
      {renderContent()}
    </Shell>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <MainApp />
    </InventoryProvider>
  );
}
