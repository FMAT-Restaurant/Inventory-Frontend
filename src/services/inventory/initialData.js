/**
 * Datos semilla iniciales para el simulador de inventario
 */

export const initialProveedores = [
  {
    id: "prov-1",
    name: "Molinos del Valle",
    contact: "ventas@molinos.com",
    phone: "+52 999 101 2020",
  },
  {
    id: "prov-2",
    name: "Lácteos del Mayab",
    contact: "pedidos@lacteosmayab.mx",
    phone: "+52 999 202 3030",
  },
  {
    id: "prov-3",
    name: "Carnes Selectas del Norte",
    contact: "contacto@carnesnorte.com",
    phone: "+52 999 303 4040",
  },
  {
    id: "prov-4",
    name: "Panificadora San Juan",
    contact: "distribucion@sanjuanpan.com",
    phone: "+52 999 404 5050",
  },
];

export const initialIngredientes = [
  {
    id: "ing-1",
    name: "Harina de Trigo Extra",
    unit: "kg",
    minStock: 15,
    availableStock: 24,
    totalStock: 24,
    averageCost: 18.5,
    supplierIdSugested: "prov-1",
    category: "Abarrotes",
  },
  {
    id: "ing-2",
    name: "Queso Mozzarella",
    unit: "kg",
    minStock: 10,
    availableStock: 12,
    totalStock: 12,
    averageCost: 140.0,
    supplierIdSugested: "prov-2",
    category: "Lácteos",
  },
  {
    id: "ing-3",
    name: "Salsa de Tomate Base",
    unit: "l",
    minStock: 8,
    availableStock: 9,
    totalStock: 9,
    averageCost: 42.0,
    supplierIdSugested: "prov-1",
    category: "Salsas",
  },
  {
    id: "ing-4",
    name: "Carne de Res Molida 80/20",
    unit: "kg",
    minStock: 12,
    availableStock: 5,
    totalStock: 5,
    averageCost: 165.0,
    supplierIdSugested: "prov-3",
    category: "Cárnicos",
  },
  {
    id: "ing-5",
    name: "Pan Brioche para Hamburguesa",
    unit: "pza",
    minStock: 20,
    availableStock: 24,
    totalStock: 24,
    averageCost: 8.5,
    supplierIdSugested: "prov-4",
    category: "Panadería",
  },
  {
    id: "ing-6",
    name: "Aceite de Oliva Extra Virgen",
    unit: "l",
    minStock: 5,
    availableStock: 6,
    totalStock: 6,
    averageCost: 195.0,
    supplierIdSugested: "prov-1",
    category: "Abarrotes",
  },
];

export const initialLotes = [
  // Harina de Trigo: 2 lotes (uno que vence pronto para FEFO)
  {
    id: "lot-101",
    ingredientId: "ing-1",
    cantidadInicial: 10,
    cantidadActual: 6,
    costoUnitario: 18.0,
    fechaCaducidad: "2026-10-05",
    fechaIngreso: "2026-09-15",
    providerId: "prov-1",
    estado: "ACTIVO",
  },
  {
    id: "lot-102",
    ingredientId: "ing-1",
    cantidadInicial: 20,
    cantidadActual: 18,
    costoUnitario: 19.0,
    fechaCaducidad: "2026-11-20",
    fechaIngreso: "2026-09-26",
    providerId: "prov-1",
    estado: "ACTIVO",
  },

  // Queso Mozzarella: 2 lotes
  {
    id: "lot-201",
    ingredientId: "ing-2",
    cantidadInicial: 8,
    cantidadActual: 3,
    costoUnitario: 138.0,
    fechaCaducidad: "2026-10-03", // Muy próximo a caducar (prioridad 1 FEFO)
    fechaIngreso: "2026-09-20",
    providerId: "prov-2",
    estado: "ACTIVO",
  },
  {
    id: "lot-202",
    ingredientId: "ing-2",
    cantidadInicial: 10,
    cantidadActual: 9,
    costoUnitario: 142.0,
    fechaCaducidad: "2026-10-18",
    fechaIngreso: "2026-09-27",
    providerId: "prov-2",
    estado: "ACTIVO",
  },

  // Salsa de Tomate
  {
    id: "lot-301",
    ingredientId: "ing-3",
    cantidadInicial: 12,
    cantidadActual: 9,
    costoUnitario: 42.0,
    fechaCaducidad: "2026-10-14",
    fechaIngreso: "2026-09-22",
    providerId: "prov-1",
    estado: "ACTIVO",
  },

  // Carne de Res: Stock bajo para provocar alertas
  {
    id: "lot-401",
    ingredientId: "ing-4",
    cantidadInicial: 8,
    cantidadActual: 5, // < mínimo (12 kg), disparará Alerta de Stock Bajo
    costoUnitario: 165.0,
    fechaCaducidad: "2026-10-04",
    fechaIngreso: "2026-09-28",
    providerId: "prov-3",
    estado: "ACTIVO",
  },

  // Pan para hamburguesa
  {
    id: "lot-501",
    ingredientId: "ing-5",
    cantidadInicial: 30,
    cantidadActual: 24,
    costoUnitario: 8.5,
    fechaCaducidad: "2026-10-06",
    fechaIngreso: "2026-09-29",
    providerId: "prov-4",
    estado: "ACTIVO",
  },

  // Aceite de oliva
  {
    id: "lot-601",
    ingredientId: "ing-6",
    cantidadInicial: 6,
    cantidadActual: 6,
    costoUnitario: 195.0,
    fechaCaducidad: "2027-03-30",
    fechaIngreso: "2026-09-10",
    providerId: "prov-1",
    estado: "ACTIVO",
  },
];

export const initialPlatillos = [
  {
    plateId: "plate-1",
    nombre: "Pizza Margarita Clásica",
    descripcion:
      "Masa madre tradicional, salsa pomodoro, queso mozzarella fresco y albahaca.",
    categoria: "Pizzas",
    precioVenta: 189.0,
    receta: [
      { ingredientId: "ing-1", cantidad: 0.25 }, // 250g harina
      { ingredientId: "ing-2", cantidad: 0.2 }, // 200g queso
      { ingredientId: "ing-3", cantidad: 0.15 }, // 150ml salsa
    ],
  },
  {
    plateId: "plate-2",
    nombre: "Hamburguesa Gourmet FMAT",
    descripcion:
      "200g de carne de res molida selecta, queso mozzarella fundido en pan brioche artesanal.",
    categoria: "Hamburguesas",
    precioVenta: 165.0,
    receta: [
      { ingredientId: "ing-4", cantidad: 0.2 }, // 200g carne
      { ingredientId: "ing-5", cantidad: 1.0 }, // 1 pza pan
      { ingredientId: "ing-2", cantidad: 0.05 }, // 50g queso
    ],
  },
  {
    plateId: "plate-3",
    nombre: "Focaccia al Olivo",
    descripcion:
      "Pan tradicional italiano horneado con aceite de oliva extra virgen y sal de mar.",
    categoria: "Entradas",
    precioVenta: 95.0,
    receta: [
      { ingredientId: "ing-1", cantidad: 0.3 }, // 300g harina
      { ingredientId: "ing-6", cantidad: 0.06 }, // 60ml aceite
    ],
  },
];
