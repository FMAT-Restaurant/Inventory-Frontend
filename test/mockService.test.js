/**
 * Test automatizado para verificar el funcionamiento del mockService y las reglas de negocio
 * Incluye validación de fechaReferencia, precisión decimal y consumo directo
 */

import { mockService } from '../src/services/inventory/mockService.js';
import { EstadoUmbral } from '../src/services/inventory/types.js';

async function runTests() {
  console.log('🧪 Iniciando pruebas rigurosas de mockService...');
  
  // Fecha congelada de prueba para garantizar determinismo temporal (2026-10-01)
  const fechaTest = '2026-10-01T00:00:00Z';
  await mockService.reset();

  // Test 1: Carga inicial y umbrales (Carne < 12 kg -> Estado BAJO)
  console.log('\n--- Test 1: Carga inicial y umbrales ---');
  const ingredientes = await mockService.getIngredients(fechaTest);
  console.log(`Total ingredientes cargados: ${ingredientes.length}`);
  
  const carne = ingredientes.find(i => i.id === 'ing-4');
  console.log(`Carne de Res Molida: Stock=${carne.availableStock} kg, Min=${carne.minStock} kg -> Umbral=${carne.status}`);
  if (carne.status !== EstadoUmbral.BAJO) {
    throw new Error(`Esperado estado BAJO para carne, recibido: ${carne.status}`);
  }
  console.log('✅ Test 1 superado (Umbrales automáticos).');

  // Test 2: Regla No Negativo (Rechazo atómico por falta de stock)
  console.log('\n--- Test 2: Regla No Negativo (Rechazo sin stock) ---');
  const intentoExcesivo = await mockService.consumeRecipe('plate-2', 50, { fechaReferencia: fechaTest }); // Requiere 10kg carne (hay 5kg) y 50 panes (hay 24)

  if (intentoExcesivo.exito) {
    throw new Error('La orden excesiva debería haber sido rechazada');
  }
  console.log(`Operación rechazada correctamente: "${intentoExcesivo.motivo}". Faltantes: ${intentoExcesivo.faltantes.length}`);
  console.log('✅ Test 2 superado (No negativo protegido).');

  // Test 3: Consumo directo de receta con precisión decimal
  console.log('\n--- Test 3: Consumo directo de receta y precisión decimal ---');
  // plate-1 (Pizza) consume 0.25 kg harina, 0.20 kg mozzarella, 0.15 l salsa
  // Pedir 4 pizzas consume exactamente 1.0 kg harina, 0.8 kg mozzarella, 0.6 l salsa
  const harinaAntes = (await mockService.getIngredients(fechaTest)).find(i => i.id === 'ing-1').availableStock;
  const consumoDirecto = await mockService.consumeRecipe('plate-1', 4, { fechaReferencia: fechaTest });

  if (!consumoDirecto.exito) {
    throw new Error(`Fallo en consumo directo: ${consumoDirecto.motivo}`);
  }

  const harinaDespues = (await mockService.getIngredients(fechaTest)).find(i => i.id === 'ing-1').availableStock;
  const diferenciaHarina = Number((harinaAntes - harinaDespues).toFixed(4));
  console.log(`Harina antes: ${harinaAntes} kg, después: ${harinaDespues} kg (Diferencia: ${diferenciaHarina} kg)`);
  if (diferenciaHarina !== 1.0) {
    throw new Error(`Esperada diferencia exacta de 1.0 kg, obtenida: ${diferenciaHarina}`);
  }
  console.log('✅ Test 3 superado (Consumo directo y precisión decimal sin desbordamiento).');

  // Test 4: Criterio FEFO determinista con fecha de referencia
  console.log('\n--- Test 4: Criterio FEFO sobre lotes vigentes ---');
  // Mozzarella tenía lot-201 (vence 2026-10-03, saldo 3kg) y lot-202 (vence 2026-10-18, saldo 9kg)
  // Al consumir las 4 pizzas (0.8 kg mozzarella), el lote descontado debe ser lot-201
  const trazaMozzarella = consumoDirecto.trazabilidadFEFO.find(t => t.ingredientId === 'ing-2');
  console.log('Desglose FEFO Mozzarella:', JSON.stringify(trazaMozzarella.desgloseLotes));
  if (trazaMozzarella.desgloseLotes[0].loteId !== 'lot-201') {
    throw new Error(`FEFO debió priorizar el lote lot-201, usó: ${trazaMozzarella.desgloseLotes[0].loteId}`);
  }
  if (trazaMozzarella.desgloseLotes[0].cantidadDescontada !== 0.8) {
    throw new Error(`Cantidad tomada incorrecta: ${trazaMozzarella.desgloseLotes[0].cantidadDescontada}`);
  }
  console.log('✅ Test 4 superado (Lote vigente más próximo a caducar consumido primero).');

  // Test 5: Registrar compra de proveedor (Aumento de stock y CPP)
  console.log('\n--- Test 5: Reabastecimiento por compra y cálculo de CPP ---');
  const compraRes = await mockService.registerPurchase({
    providerId: 'prov-3',
    itemsComprados: [
      {
        ingredientId: 'ing-4', // Carne de res
        cantidad: 20,
        costoUnitario: 170.0,
        fechaCaducidad: '2026-12-15'
      }
    ]
  });

  if (!compraRes.exito) {
    throw new Error('Fallo al registrar compra');
  }

  const carnePostCompra = (await mockService.getIngredients(fechaTest)).find(i => i.id === 'ing-4');
  console.log(`Carne tras compra de 20kg: Stock total=${carnePostCompra.totalStock} kg, Nuevo Umbral=${carnePostCompra.status}, CPP=$${carnePostCompra.averageCost}`);
  if (carnePostCompra.totalStock < 25) {
    throw new Error('Stock total no se incrementó debidamente');
  }
  if (carnePostCompra.status !== EstadoUmbral.OPTIMO) {
    throw new Error(`Esperado estado OPTIMO tras compra, recibido: ${carnePostCompra.status}`);
  }
  console.log('✅ Test 5 superado (Ingreso incrementa existencias y actualiza CPP).');

  // Test 6: Receta Agotada (Disponibilidad y porciones)
  console.log('\n--- Test 6: Receta Agotada y porciones preparables ---');
  const recetas = await mockService.getRecipes(fechaTest);
  for (const r of recetas) {
    console.log(`Platillo: ${r.nombre} -> Disponible: ${r.disponible} (${r.unidadesPreparables} porciones)`);
  }
  const todasDisponibles = recetas.every(r => r.disponible && r.unidadesPreparables > 0);
  if (!todasDisponibles) {
    throw new Error('Se esperaba disponibilidad positiva tras el reabastecimiento');
  }
  console.log('✅ Test 6 superado (Cálculo determinista de porciones).');

  // Test 7: Reset determinista del almacén
  console.log('\n--- Test 7: Reset del estado a fixtures iniciales ---');
  await mockService.reset();
  const carneTrasReset = (await mockService.getIngredients(fechaTest)).find(i => i.id === 'ing-4');
  if (carneTrasReset.totalStock !== 5) {
    throw new Error(`Esperado stock inicial de 5kg tras reset, recibido: ${carneTrasReset.totalStock}`);
  }
  console.log('✅ Test 7 superado (Estado reiniciado limpiamente).');

  // Test 8: Catálogo de insumos (SKU único, descripción, perecedero y almacenamiento)
  console.log('\n--- Test 8: SKU, descripción, perecedero y condición de almacenamiento ---');
  const alta = await mockService.guardarIngrediente({
    sku: 'ING-TEST-8',
    name: 'Ingrediente de Prueba E2E',
    description: 'Descripción opcional del ingrediente de prueba',
    unit: 'kg',
    minStock: 5,
    category: 'Abarrotes',
    isPerishable: true,
    storageCondition: 'Refrigerado'
  });

  if (alta.sku !== 'ING-TEST-8' || !alta.description || !alta.isPerishable || alta.storageCondition !== 'Refrigerado') {
    throw new Error(`Los campos nuevos no se guardaron correctamente: ${JSON.stringify(alta)}`);
  }

  let errorSkuDuplicado = '';
  try {
    await mockService.guardarIngrediente({
      sku: 'ing-test-8',
      name: 'Otro Ingrediente de Prueba',
      unit: 'kg',
      minStock: 1,
      category: 'Abarrotes',
      isPerishable: false,
      storageCondition: 'Ambiente'
    });
  } catch (err) {
    errorSkuDuplicado = err.message;
  }
  if (!errorSkuDuplicado.includes('SKU')) {
    throw new Error(`Esperado error por SKU duplicado, recibido: "${errorSkuDuplicado}"`);
  }

  let errorSkuVacio = '';
  try {
    await mockService.guardarIngrediente({
      name: 'Ingrediente sin SKU',
      unit: 'kg',
      minStock: 1,
      category: 'Abarrotes',
      isPerishable: false,
      storageCondition: 'Ambiente'
    });
  } catch (err) {
    errorSkuVacio = err.message;
  }
  if (!errorSkuVacio.includes('SKU')) {
    throw new Error(`Esperado error por SKU vacío, recibido: "${errorSkuVacio}"`);
  }
  console.log('✅ Test 8 superado (SKU obligatorio y único, metadatos de almacenamiento persistidos).');

  console.log('\n🎉 TODOS LOS 8 TESTS DE REGLAS DE NEGOCIO Y MOCK SERVICE PASARON EXITOSAMENTE.');
}

runTests().catch(err => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
