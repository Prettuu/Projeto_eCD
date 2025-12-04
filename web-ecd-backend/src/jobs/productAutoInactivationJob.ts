import * as cron from 'node-cron';
import { ProductAutoInactivationService } from '../services/ProductAutoInactivationService';

/**
 * Job agendado para verificar e inativar produtos automaticamente
 * RF0013 - Executa diariamente às 2h da manhã
 */
export class ProductAutoInactivationJob {
  private static cronJob: cron.ScheduledTask | null = null;

  /**
   * Inicia o job agendado
   * Executa diariamente às 2h da manhã
   */
  static start(): void {
    if (this.cronJob) {
      console.log('Job de inativação automática já está em execução');
      return;
    }

    this.cronJob = cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Iniciando verificação automática de inativação de produtos...');
      
      try {
        const daysWithoutSales = parseInt(
          process.env.PRODUCT_AUTO_INACTIVATION_DAYS || '90',
          10
        );
        const minSalesQuantity = parseInt(
          process.env.PRODUCT_AUTO_INACTIVATION_MIN_SALES || '0',
          10
        );

        const result = await ProductAutoInactivationService.checkAndInactivateProducts(
          daysWithoutSales,
          minSalesQuantity
        );

        console.log(
          `✅ Verificação concluída: ${result.inactivated} produtos inativados de ${result.checked} verificados`
        );
      } catch (error) {
        console.error('❌ Erro ao executar verificação automática:', error);
      }
    });

    console.log('✅ Job de inativação automática de produtos agendado (diariamente às 2h)');
  }

  /**
   * Para o job agendado
   */
  static stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('⏹️ Job de inativação automática parado');
    }
  }

  /**
   * Executa manualmente (para testes)
   */
  static async runManually(
    daysWithoutSales?: number,
    minSalesQuantity?: number
  ): Promise<{ inactivated: number; checked: number }> {
    return await ProductAutoInactivationService.checkAndInactivateProducts(
      daysWithoutSales,
      minSalesQuantity
    );
  }
}

