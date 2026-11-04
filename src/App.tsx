import { useState } from "react";
import { InventoryProvider } from "./context/InventoryContext.jsx";
import { Shell } from "./components/layout/Shell.jsx";
import { MainMenu } from "./pages/mainMenu/MainMenu.jsx";
import { ItemsPage } from "./pages/items/ItemsPage.jsx";
import { BatchesPage } from "./pages/batches/BatchesPage.jsx";
import { RecetasPage } from "./pages/recipes/RecetasPage.jsx";
import { MovimientosPage } from "./pages/MovimientosPage.jsx";
import { SuppliersPage } from "./pages/suppliers/SuppliersPage.jsx";

export interface ShellUser {
  id: string;
  userType: "ADMIN" | "STAFF";
  staffId?: string;
  email?: string;
  displayName: string;
  roleLabel?: string;
  roles?: string[];
  permissions: string[];
}

export interface FederatedModuleProps {
  token?: string;
  currentUser?: ShellUser;
  theme?: "light" | "dark";
}

export const hasPermission = (
  user: ShellUser | undefined,
  requiredPermission: string,
): boolean => {
  if (!user) return false;
  if (user.userType === "ADMIN" || user.permissions?.includes("*")) return true;
  if (!user.permissions) return false;
  return user.permissions.includes(requiredPermission);
};

const getStoredSession = (): {
  accessToken?: string;
  user?: ShellUser;
} | null => {
  try {
    const raw = localStorage.getItem("fmat_restaurant_auth_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

type ModuleTab =
  "items" | "batches" | "proveedores" | "recetas" | "movimientos";

function MainApp({ token, currentUser }: FederatedModuleProps) {
  const stored = getStoredSession();
  const activeToken = token ?? stored?.accessToken;
  const activeUser = currentUser ?? stored?.user;

  if (activeToken) {
    try {
      localStorage.setItem(
        "fmat_restaurant_auth_session",
        JSON.stringify({ accessToken: activeToken, user: activeUser }),
      );
    } catch {
      // ignore
    }
  }

  const [activeTab, setActiveTab] = useState<"menu" | ModuleTab>("menu");

  const pageTitles: Record<string, string> = {
    menu: "Inventario",
    items: "Catálogo de Insumos",
    batches: "Gestión de Lotes",
    proveedores: "Catálogo de Proveedores",
    recetas: "Catálogo de Recetas y Disponibilidad",
    movimientos: "Movimientos de Almacén",
  };

  const renderContent = () => {
    switch (activeTab) {
      case "menu":
        return (
          <MainMenu onSelectModule={(tab: ModuleTab) => setActiveTab(tab)} />
        );
      case "items":
        return <ItemsPage />;
      case "batches":
        return <BatchesPage />;
      case "recetas":
        return <RecetasPage />;
      case "movimientos":
        return <MovimientosPage />;
      case "proveedores":
        return <SuppliersPage />;
      default:
        return null;
    }
  };

  // If mounted from Shell as federated module, render without duplicating Shell chrome
  /*
  if (token !== undefined || currentUser !== undefined) {
    return <div>{renderContent()}</div>;
  }
  */

  return (
    <Shell
      onBackToMenu={
        activeTab !== "menu" ? () => setActiveTab("menu") : undefined
      }
      pageTitle={pageTitles[activeTab] || "Inventario"}
    >
      {renderContent()}
    </Shell>
  );
}

export default function App(props: FederatedModuleProps = {}) {
  return (
    <InventoryProvider>
      <MainApp {...props} />
    </InventoryProvider>
  );
}
