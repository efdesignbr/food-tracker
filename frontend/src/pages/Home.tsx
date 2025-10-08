import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Food Tracker
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Rastreie sua alimentação e identifique gatilhos inflamatórios
        </p>

        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/capture"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 px-8 rounded-lg shadow-md transition-colors"
          >
            <div className="text-3xl mb-2">📸</div>
            <div className="text-lg">Registrar Refeição</div>
            <div className="text-sm opacity-90">Fotografe ou descreva seu prato</div>
          </Link>

          <Link
            to="/history"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-6 px-8 rounded-lg shadow-md transition-colors"
          >
            <div className="text-3xl mb-2">📅</div>
            <div className="text-lg">Ver Histórico</div>
            <div className="text-sm opacity-90">Consulte suas refeições</div>
          </Link>

          <Link
            to="/reports"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 px-8 rounded-lg shadow-md transition-colors"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="text-lg">Relatórios</div>
            <div className="text-sm opacity-90">Identifique gatilhos inflamatórios</div>
          </Link>

          <div className="bg-gray-100 text-gray-700 font-semibold py-6 px-8 rounded-lg shadow-md">
            <div className="text-3xl mb-2">🔬</div>
            <div className="text-lg">Análise IA</div>
            <div className="text-sm">Powered by Claude</div>
          </div>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Desenvolvido para controle de inflamação intestinal</p>
        </div>
      </div>
    </div>
  );
}
