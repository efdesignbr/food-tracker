'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { generateCSVFilename } from '@/lib/utils/csv-export';
import { api } from '@/lib/api-client';
import { showRewardedAd } from '@/lib/ads/admob';
import type { Plan } from '@/lib/types/subscription';

type ExportPeriod = 'last30days' | 'last3months' | 'last6months' | 'thisMonth' | 'lastMonth' | 'custom';

interface ExportMealsButtonProps {
  plan?: Plan;
}

export default function ExportMealsButton({ plan = 'free' }: ExportMealsButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [period, setPeriod] = useState<ExportPeriod>('last30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setError(null);
    setIsExporting(true);

    try {
      let startDate: Date;
      let endDate: Date = new Date();

      switch (period) {
        case 'last30days':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'last3months':
          startDate = subMonths(new Date(), 3);
          break;
        case 'last6months':
          startDate = subMonths(new Date(), 6);
          break;
        case 'thisMonth':
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
          break;
        case 'lastMonth':
          const lastMonth = subMonths(new Date(), 1);
          startDate = startOfMonth(lastMonth);
          endDate = endOfMonth(lastMonth);
          break;
        case 'custom':
          if (!customStartDate || !customEndDate) {
            setError('Por favor, selecione as datas de início e fim');
            setIsExporting(false);
            return;
          }
          // Parse 'YYYY-MM-DD' como data local (evita shift de fuso)
          const [sy, sm, sd] = customStartDate.split('-').map(Number);
          const [ey, em, ed] = customEndDate.split('-').map(Number);
          startDate = new Date(sy, (sm || 1) - 1, sd || 1);
          endDate = new Date(ey, (em || 1) - 1, ed || 1);

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            setError('Datas inválidas');
            setIsExporting(false);
            return;
          }

          if (startDate > endDate) {
            setError('A data de início deve ser anterior à data de fim');
            setIsExporting(false);
            return;
          }
          break;
        default:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
      }

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // FREE: exige rewarded ad antes de exportar
      if (plan === 'free') {
        const ok = await showRewardedAd('export_csv');
        if (!ok) {
          throw new Error('Não foi possível exibir o anúncio. Tente novamente.');
        }
      }

      const response = await api.get(
        `/api/meals/export?start_date=${startDateStr}&end_date=${endDateStr}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao exportar dados');
      }

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateCSVFilename(startDate, endDate);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Close modal on success
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          padding: '12px 20px',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          transition: 'all 0.2s ease',
          width: '100%',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
        }}
      >
        <span style={{ fontSize: 20 }}></span>
        Exportar para CSV
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, margin: 0 }}>
               Exportar Histórico
            </h2>

            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
              Escolha o período que deseja exportar:
            </p>

            {/* Period Selection */}
            <div style={{ marginBottom: 20 }}>
              {[
                { value: 'last30days', label: 'Últimos 30 dias' },
                { value: 'thisMonth', label: 'Este mês' },
                { value: 'lastMonth', label: 'Mês passado' },
                { value: 'last3months', label: 'Últimos 3 meses' },
                { value: 'last6months', label: 'Últimos 6 meses' },
                { value: 'custom', label: 'Período personalizado' },
              ].map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 8,
                    border: '2px solid',
                    borderColor: period === option.value ? '#10b981' : '#e5e7eb',
                    backgroundColor: period === option.value ? '#ecfdf5' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="period"
                    value={option.value}
                    checked={period === option.value}
                    onChange={(e) => setPeriod(e.target.value as ExportPeriod)}
                    style={{ marginRight: 12 }}
                  />
                  <span style={{ fontSize: 15, fontWeight: period === option.value ? 600 : 400 }}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Custom Date Range */}
            {period === 'custom' && (
              <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                <div style={{ marginBottom: 12, width: '100%' }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                    Data de início
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      display: 'block',
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      margin: 0,
                      fontSize: 15,
                      borderRadius: 8,
                      border: '2px solid #e5e7eb',
                      backgroundColor: 'white',
                      minHeight: 44,
                      color: '#374151'
                    }}
                  />
                </div>
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                    Data de fim
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      display: 'block',
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      margin: 0,
                      fontSize: 15,
                      borderRadius: 8,
                      border: '2px solid #e5e7eb',
                      backgroundColor: 'white',
                      minHeight: 44,
                      color: '#374151'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: 12,
                  backgroundColor: '#fee2e2',
                  border: '2px solid #ef4444',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <p style={{ color: '#991b1b', fontSize: 14, margin: 0 }}> {error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isExporting}
                style={{
                  flex: 1,
                  padding: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: '2px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  opacity: isExporting ? 0.5 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                style={{
                  flex: 1,
                  padding: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  opacity: isExporting ? 0.5 : 1,
                }}
              >
                {isExporting ? 'Exportando...' : 'Exportar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
