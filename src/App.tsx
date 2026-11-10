import type { ReactNode } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useInRouterContext,
  useNavigate,
} from "react-router-dom";
import { AUTH_STORAGE_KEY, getStoredSession } from "./services/http/client";
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

type ModuleTab =
  "items" | "batches" | "proveedores" | "recetas" | "movimientos";

interface ModuleRoute {
  /** Segmento de la URL, relativo a la ruta base del módulo. */
  path: string;
  title: string;
  element: ReactNode;
}

/**
 * Secciones del módulo. La clave es el identificador que usa el menú
 * principal; `path` es la ruta que queda en la barra de direcciones.
 */
const MODULE_ROUTES: Record<ModuleTab, ModuleRoute> = {
  items: {
    path: "insumos",
    title: "Catálogo de Insumos",
    element: <ItemsPage />,
  },
  batches: {
    path: "lotes",
    title: "Gestión de Lotes",
    element: <BatchesPage />,
  },
  proveedores: {
    path: "proveedores",
    title: "Catálogo de Proveedores",
    element: <SuppliersPage />,
  },
  recetas: {
    path: "recetas",
    title: "Catálogo de Recetas y Disponibilidad",
    element: <RecetasPage />,
  },
  movimientos: {
    path: "movimientos",
    title: "Movimientos de Almacén",
    element: <MovimientosPage />,
  },
};

function MenuRoute() {
  const navigate = useNavigate();

  return (
    <Shell onBackToMenu={undefined} pageTitle="Inventario">
      <MainMenu
        onSelectModule={(tab: ModuleTab) => navigate(MODULE_ROUTES[tab].path)}
      />
    </Shell>
  );
}

function SectionRoute({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    // ".." relativo a la ruta: regresa a la base del módulo, tanto en modo
    // independiente como montado dentro del router del Shell anfitrión.
    <Shell onBackToMenu={() => navigate("..")} pageTitle={title}>
      {children}
    </Shell>
  );
}

function MainApp({ token, currentUser }: FederatedModuleProps) {
  const stored = getStoredSession();
  const activeToken = token ?? stored?.accessToken;
  const activeUser = currentUser ?? (stored?.user as ShellUser | undefined);

  if (activeToken) {
    try {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ accessToken: activeToken, user: activeUser }),
      );
    } catch {
      // ignore
    }
  }

  return (
    <Routes>
      <Route index element={<MenuRoute />} />
      {Object.values(MODULE_ROUTES).map(({ path, title, element }) => (
        <Route
          key={path}
          path={path}
          element={<SectionRoute title={title}>{element}</SectionRoute>}
        />
      ))}
      {/* Cualquier ruta desconocida regresa al menú del módulo */}
      <Route path="*" element={<Navigate to=".." replace />} />
    </Routes>
  );
}

/**
 * Como módulo federado, el Shell anfitrión ya aporta su router y las rutas
 * del módulo cuelgan de él. En modo independiente se usa HashRouter para que
 * recargar o abrir un enlace directo funcione en cualquier hosting estático.
 */
function ModuleRouter({ children }: { children: ReactNode }) {
  const insideHostRouter = useInRouterContext();
  return insideHostRouter ? (
    <>{children}</>
  ) : (
    <HashRouter>{children}</HashRouter>
  );
}

export default function App(props: FederatedModuleProps = {}) {
  return (
    <InventoryProvider>
      <ModuleRouter>
        <MainApp {...props} />
      </ModuleRouter>
    </InventoryProvider>
  );
}
