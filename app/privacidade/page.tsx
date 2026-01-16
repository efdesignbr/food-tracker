'use client';

import { useRouter } from 'next/navigation';

export default function PrivacidadePage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      paddingTop: 'env(safe-area-inset-top)'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>
          Politica de Privacidade
        </h1>
      </div>

      {/* Content */}
      <div style={{
        padding: 20,
        maxWidth: 800,
        margin: '0 auto',
        paddingBottom: 100
      }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
            Data Efetiva: 6 de Janeiro de 2026
          </p>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              1. Quem Somos
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              O Food Tracker e um aplicativo de monitoramento nutricional e saude. Esta politica e mantida por Edson Ferreira, controlador de dados responsavel pelo tratamento das suas informacoes pessoais.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              2. Informacoes Coletadas
            </h2>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>
                <strong>Informacoes da Conta:</strong> Nome, e-mail e senha (armazenada com criptografia segura).
              </p>
              <p style={{ marginBottom: 12 }}>
                <strong>Perfil de Saude:</strong> Idade, genero, peso, altura, nivel de atividade fisica e objetivos nutricionais.
              </p>
              <p style={{ margin: 0 }}>
                <strong>Registros Alimentares:</strong> Alimentos consumidos, refeicoes, fotos de pratos e quantidade de agua ingerida.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              3. Como Usamos suas Informacoes
            </h2>
            <ul style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
              <li>Autenticacao e gerenciamento de conta</li>
              <li>Calculo de necessidades caloricas personalizadas</li>
              <li>Processar fotos de alimentos usando Inteligencia Artificial para identificar itens</li>
              <li>Geracao de relatorios e graficos de progresso</li>
              <li>Fornecer recomendacoes personalizadas atraves do Coach IA</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              4. Compartilhamento de Dados
            </h2>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>
                <strong>Nao vendemos suas informacoes pessoais.</strong> Compartilhamos dados apenas com:
              </p>
              <p style={{ marginBottom: 12 }}>
                <strong>Provedores de Servico:</strong> Supabase (armazenamento de dados) e OpenAI/Anthropic (analise de IA para identificacao de alimentos).
              </p>
              <p style={{ margin: 0 }}>
                <strong>Obrigacoes Legais:</strong> Quando exigido por lei ou intimacao judicial.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              5. Seguranca dos Dados
            </h2>
            <ul style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
              <li>Protecao RLS (Row-Level Security) em bancos de dados - seus dados sao isolados de outros usuarios</li>
              <li>Senhas protegidas usando algoritmos de hash robustos (bcrypt)</li>
              <li>Comunicacao criptografada via SSL/TLS</li>
              <li>Acesso restrito aos dados apenas por pessoal autorizado</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              6. Seus Direitos
            </h2>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>
                <strong>Acesso e Correcao:</strong> Voce pode visualizar e editar suas informacoes diretamente no aplicativo, na secao "Minha Conta".
              </p>
              <p style={{ margin: 0 }}>
                <strong>Exclusao:</strong> Voce pode solicitar a exclusao completa da sua conta e todos os dados associados atraves das configuracoes do aplicativo. A exclusao e permanente e irreversivel.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              7. Privacidade Infantil
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              O Food Tracker nao se destina a menores de 13 anos. Nao coletamos intencionalmente informacoes de criancas. Se tomarmos conhecimento de que coletamos dados de uma crianca sem o consentimento dos pais, tomaremos medidas para remover essas informacoes.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              8. Alteracoes nesta Politica
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              Podemos atualizar esta Politica de Privacidade periodicamente. Alteracoes significativas serao notificadas atraves do aplicativo ou por e-mail. Recomendamos revisar esta pagina regularmente.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              9. Contato
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              Se voce tiver duvidas sobre esta Politica de Privacidade ou sobre como tratamos seus dados, entre em contato conosco atraves do e-mail: contato@foodtracker.com.br
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
