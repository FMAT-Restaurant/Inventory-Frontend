import { Ingredient } from './types'

export default function App() {
  let dummy: Ingredient | null = null;
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold text-blue-600">Inventory Frontend (Tailwind Working)</h1>
      {dummy && <p>{(dummy as Ingredient).nombre}</p>}
    </div>
  )
}
