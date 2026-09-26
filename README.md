# Frontend Inventario

Frontend para el microservicio de Inventario del sistema de restaurante.

## Stack
- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router

## Cómo clonar y correr

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Copiar el archivo `.env.example` a `.env` y ajustar si es necesario:
   ```bash
   cp .env.example .env
   ```
4. Correr el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Estructura de carpetas

- `src/types/`: Interfaces TypeScript
- `src/services/`: Interfaz y servicios para comunicarse con el backend
- `src/mocks/`: Datos de ejemplo locales
- `src/components/`: Componentes reutilizables
- `src/hooks/`: Hooks personalizados
- `src/pages/`: Pantallas principales de la aplicación
- `docs/tests/`: Pruebas y QA (Héctor)

## Flujo de trabajo en equipo (Git)

1. Antes de empezar, siempre hacer `git pull origin main`.
2. Trabajar localmente y hacer commits frecuentes (`git add .` -> `git commit -m "..."`).
3. Antes de subir, sincronizar nuevamente: `git pull --rebase origin main`.
4. Si hay conflictos, resolverlos, luego `git add .` y `git rebase --continue`.
5. Subir los cambios con `git push origin main`.
