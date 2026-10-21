# services/suppliers

Capa de acceso a datos del dominio de proveedores.

Este módulo permite **listar, crear, actualizar y eliminar proveedores**
contra el backend NestJS del proyecto, o contra el mock en memoria en modo
desarrollo sin backend.

Es análogo a `services/ingredients/`, que sigue el mismo patrón
(`types` + `http*Repository` + `mock*Repository` + `index` selector).

---

## Estructura

Para el hook de React, ver `src/pages/suppliers/hooks/useSuppliers.ts`.

---

## Uso

### Vía hook (recomendado para componentes)

```ts
import { useSuppliers } from '@/pages/suppliers/hooks/useSuppliers';

function MyComponent() {
  const { suppliers, loading, saving, error, message, save, remove, reload, clearMessage } = useSuppliers();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {suppliers.map(s => (
        <li key={s.id}>
          {s.name} — {s.contactName ?? 'sin contacto'}
          <button onClick={() => remove(s.id)} disabled={saving}>Eliminar</button>
        </li>
      ))}
    </ul>
  );
}

# Prueba manual con backend
## Backend corriendo en http://localhost:3000.

.env.development:

env
VITE_API_URL=http://localhost:3000
VITE_USE_MOCK=false
npm run dev.

## En la app, verifica que el listado se llena con los proveedores reales del backend.

(Opcional, sin UI de suppliers) crea un componente temporal:

tsx
const { suppliers } = useSuppliers();
console.log(suppliers);
Prueba manual con mock
.env.development:

env
VITE_USE_MOCK=true
(o comenta VITE_API_URL).

## Reinicia npm run dev (Vite no recarga .env en caliente).

## Verifica que el listado se llena con los 4 proveedores de initialData.js.

# Prueba de contrato (curl)

# Listar
Invoke-RestMethod -Uri "http://localhost:3000/suppliers" | ConvertTo-Json -Depth 10

# Crear
Invoke-RestMethod -Uri "http://localhost:3000/suppliers" -Method Post -ContentType "application/json" -Body '{"name": "Proveedor Test", "email": "t@t.com"}'

# Actualizar (usa el _id devuelto)
Invoke-RestMethod -Uri "http://localhost:3000/suppliers/<ID>" -Method Patch -ContentType "application/json" -Body '{"phone": "555"}'

# Eliminar
Invoke-RestMethod -Uri "http://localhost:3000/suppliers/<ID>" -Method Delete