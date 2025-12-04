"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductAutoInactivationJob = void 0;
const cron = __importStar(require("node-cron"));
const ProductAutoInactivationService_1 = require("../services/ProductAutoInactivationService");
/**
 * Job agendado para verificar e inativar produtos automaticamente
 * RF0013 - Executa diariamente às 2h da manhã
 */
class ProductAutoInactivationJob {
    /**
     * Inicia o job agendado
     * Executa diariamente às 2h da manhã
     */
    static start() {
        if (this.cronJob) {
            console.log('Job de inativação automática já está em execução');
            return;
        }
        this.cronJob = cron.schedule('0 2 * * *', async () => {
            console.log('🔄 Iniciando verificação automática de inativação de produtos...');
            try {
                const daysWithoutSales = parseInt(process.env.PRODUCT_AUTO_INACTIVATION_DAYS || '90', 10);
                const minSalesQuantity = parseInt(process.env.PRODUCT_AUTO_INACTIVATION_MIN_SALES || '0', 10);
                const result = await ProductAutoInactivationService_1.ProductAutoInactivationService.checkAndInactivateProducts(daysWithoutSales, minSalesQuantity);
                console.log(`✅ Verificação concluída: ${result.inactivated} produtos inativados de ${result.checked} verificados`);
            }
            catch (error) {
                console.error('❌ Erro ao executar verificação automática:', error);
            }
        });
        console.log('✅ Job de inativação automática de produtos agendado (diariamente às 2h)');
    }
    /**
     * Para o job agendado
     */
    static stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            console.log('⏹️ Job de inativação automática parado');
        }
    }
    /**
     * Executa manualmente (para testes)
     */
    static async runManually(daysWithoutSales, minSalesQuantity) {
        return await ProductAutoInactivationService_1.ProductAutoInactivationService.checkAndInactivateProducts(daysWithoutSales, minSalesQuantity);
    }
}
exports.ProductAutoInactivationJob = ProductAutoInactivationJob;
ProductAutoInactivationJob.cronJob = null;
