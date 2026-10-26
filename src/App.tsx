import { useState } from 'react';
import { InventoryProvider } from './context/InventoryContext.jsx';
import { Shell } from './components/layout/Shell.jsx';
import { MainMenu } from './pages/mainMenu/MainMenu.jsx';
import { IngredientesPage } from './pages/ingredients/IngredientesPage.jsx';
import { BatchesPage } from './pages/batches/BatchesPage.jsx';
import { RecetasPage } from './pages/recipes/RecetasPage.jsx';
import { MovimientosPage } from './pages/MovimientosPage.jsx';
import { SuppliersPage } from './pages/suppliers/SuppliersPage.jsx';

type ModuleTab = 'ingredientes' | 'proveedores' | 'insumos' | 'recetas' | 'movimientos';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'menu' | ModuleTab>('menu');

  const pageTitles: Record<string, string> = {
  menu: 'Inventario',
  ingredientes: 'Catálogo de Ingredientes',
  proveedores: 'Catálogo de Proveedores',
  insumos: 'Gestión de Insumos y Lotes',
  recetas: 'Catálogo de Recetas y Disponibilidad',
  movimientos: 'Movimientos de Almacén'
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'menu':
        return <MainMenu onSelectModule={(tab: ModuleTab) => setActiveTab(tab)} />;
      case 'ingredientes':
        return <IngredientesPage />;
      case 'insumos':
        return <BatchesPage />;
      case 'recetas':
        return <RecetasPage />;
      case 'movimientos':
        return <MovimientosPage />;
      case 'proveedores':
        return <SuppliersPage />;
      default:
        return null;
    }
  };

  return (
    <Shell
      onBackToMenu={activeTab !== 'menu' ? () => setActiveTab('menu') : undefined}
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
