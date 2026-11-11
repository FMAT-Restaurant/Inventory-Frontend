import type { ReactNode } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useInRouterContext,
  useNavigate,
} from "react-router-dom";
import {
  AuthProvider,
  hasPermission,
  useAuth,
  type ShellUser,
} from "./context/AuthContext";
import { InventoryProvider } from "./context/InventoryContext.jsx";
import { Shell } from "./components/layout/Shell.jsx";
import { AlertCircleIcon } from "./components/ui/Icons.jsx";
import { MainMenu } from "./pages/mainMenu/MainMenu.jsx";
import { ItemsPage } from "./pages/items/ItemsPage.jsx";
import { BatchesPage } from "./pages/batches/BatchesPage.jsx";
import { RecetasPage } from "./pages/recipes/RecetasPage.jsx";
import { MovimientosPage } from "./pages/MovimientosPage.jsx";
import { SuppliersPage } from "./pages/suppliers/SuppliersPage.jsx";
import { MODULE_READ_PERMISSION } from "./config/permissions";

export type { ShellUser };
export { hasPermission };

export interface FederatedModuleProps {
  token?: string;
  currentUser?: ShellUser;
  theme?: "light" | "dark";
}

type ModuleTab =
  | "items"
  | "batches"
  | "proveedores"
  | "recetas"
  | "movimientos";

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

function AccessRestricted({ onBackToMenu }: { onBackToMenu: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        padding: "32px",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-flat)",
        color: "var(--color-muted)",
        textAlign: "center",
      }}
    >
      <AlertCircleIcon size={32} color="var(--color-danger)" />
      <p style={{ fontSize: "var(--small-size)" }}>
        No tienes permisos para acceder a esta sección del inventario.
      </p>
      <button
        type="button"
        onClick={onBackToMenu}
        style={{
          fontFamily: "inherit",
          fontWeight: 600,
          fontSize: "var(--body-size)",
          borderRadius: "var(--radius-control)",
          cursor: "pointer",
          height: "var(--control-height)",
          padding: "0 16px",
          backgroundColor: "transparent",
          border: "1px solid var(--color-primary)",
          color: "var(--color-primary)",
        }}
      >
        Volver al menú
      </button>
    </div>
  );
}

function SectionRoute({
  tab,
  title,
  children,
}: {
  tab: ModuleTab;
  title: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { can } = useAuth();
  const requiredPermission = MODULE_READ_PERMISSION[tab];
  const allowed = !requiredPermission || can(requiredPermission);

  return (
    // ".." relativo a la ruta: regresa a la base del módulo, tanto en modo
    // independiente como montado dentro del router del Shell anfitrión.
    <Shell onBackToMenu={() => navigate("..")} pageTitle={title}>
      {allowed ? (
        children
      ) : (
        <AccessRestricted onBackToMenu={() => navigate("..")} />
      )}
    </Shell>
  );
}

function MainApp() {
  return (
    <Routes>
      <Route index element={<MenuRoute />} />
      {(Object.keys(MODULE_ROUTES) as ModuleTab[]).map((tab) => {
        const { path, title, element } = MODULE_ROUTES[tab];
        return (
          <Route
            key={path}
            path={path}
            element={
              <SectionRoute tab={tab} title={title}>
                {element}
              </SectionRoute>
            }
          />
        );
      })}
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
      <AuthProvider token={props.token} currentUser={props.currentUser}>
        <ModuleRouter>
          <MainApp />
        </ModuleRouter>
      </AuthProvider>
    </InventoryProvider>
  );
}
