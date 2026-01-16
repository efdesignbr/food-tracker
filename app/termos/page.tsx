'use client';

import { useRouter } from 'next/navigation';

export default function TermosPage() {
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
          Termos de Uso
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
            Ultima atualizacao: Janeiro de 2026
          </p>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              1. Aceitacao dos Termos
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              Ao baixar, instalar ou usar o aplicativo Food Tracker ("Aplicativo"), voce concorda em ficar vinculado a estes Termos de Uso ("Termos"). Se voce nao concordar com estes Termos, nao use o Aplicativo.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              2. Descricao do Servico
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              O Food Tracker e um aplicativo de rastreamento nutricional que permite aos usuarios registrar refeicoes, monitorar a ingestao de calorias e nutrientes, e receber analises personalizadas atraves de inteligencia artificial. O Aplicativo oferece planos gratuitos e pagos com diferentes niveis de funcionalidades.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              3. Assinaturas e Pagamentos
            </h2>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>
                <strong>3.1 Planos Disponiveis:</strong> O Aplicativo oferece um plano gratuito com anuncios e planos premium pagos (mensal e anual) sem anuncios e com recursos adicionais.
              </p>
              <p style={{ marginBottom: 12 }}>
                <strong>3.2 Renovacao Automatica:</strong> As assinaturas sao renovadas automaticamente ao final de cada periodo, a menos que voce cancele pelo menos 24 horas antes do termino do periodo atual.
              </p>
              <p style={{ marginBottom: 12 }}>
                <strong>3.3 Cobranca:</strong> O pagamento sera cobrado na sua conta da App Store ou Google Play no momento da confirmacao da compra.
              </p>
              <p style={{ marginBottom: 12 }}>
                <strong>3.4 Cancelamento:</strong> Voce pode cancelar sua assinatura a qualquer momento atraves das configuracoes da sua conta na App Store ou Google Play. O cancelamento sera efetivo ao final do periodo de faturamento atual.
              </p>
              <p style={{ margin: 0 }}>
                <strong>3.5 Reembolsos:</strong> Reembolsos sao processados de acordo com as politicas da Apple App Store ou Google Play Store.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              4. Uso Aceitavel
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 12 }}>
              Voce concorda em usar o Aplicativo apenas para fins legais e de acordo com estes Termos. Voce nao deve:
            </p>
            <ul style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
              <li>Usar o Aplicativo de qualquer forma que viole leis ou regulamentos aplicaveis</li>
              <li>Tentar obter acesso nao autorizado ao Aplicativo ou seus sistemas</li>
              <li>Usar o Aplicativo para fins comerciais sem autorizacao</li>
              <li>Compartilhar sua conta com terceiros</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              5. Isencao de Responsabilidade Medica
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              O Food Tracker nao fornece aconselhamento medico, nutricional ou de saude profissional. As informacoes e analises fornecidas pelo Aplicativo sao apenas para fins informativos e educacionais. Sempre consulte um profissional de saude qualificado antes de fazer mudancas significativas em sua dieta ou rotina de exercicios.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              6. Propriedade Intelectual
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              Todo o conteudo, recursos e funcionalidades do Aplicativo, incluindo mas nao limitado a texto, graficos, logotipos, icones, imagens, software e codigo, sao de propriedade exclusiva do Food Tracker e protegidos por leis de direitos autorais e propriedade intelectual.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              7. Limitacao de Responsabilidade
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              Na extensao maxima permitida por lei, o Food Tracker nao sera responsavel por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo perda de lucros, dados ou uso, resultantes do uso ou incapacidade de usar o Aplicativo.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              8. Alteracoes nos Termos
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alteracoes significativas serao notificadas atraves do Aplicativo ou por e-mail. O uso continuado do Aplicativo apos tais alteracoes constitui sua aceitacao dos novos Termos.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              9. Rescisao
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              Podemos suspender ou encerrar seu acesso ao Aplicativo a qualquer momento, com ou sem motivo, mediante aviso. Voce pode encerrar sua conta a qualquer momento atraves das configuracoes do Aplicativo.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              10. Lei Aplicavel
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              Estes Termos serao regidos e interpretados de acordo com as leis do Brasil, sem considerar seus conflitos de disposicoes legais.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              11. Contato
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              Se voce tiver duvidas sobre estes Termos de Uso, entre em contato conosco atraves do e-mail: contato@foodtracker.com.br
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
