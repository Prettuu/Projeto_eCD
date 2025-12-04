import { Component, OnInit } from '@angular/core';
import { AnalysisService, ProductSales, CategorySales, SalesSummary, ProductSalesByDate, CategorySalesByDate } from './analysis.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.scss']
})
export class AnalysisComponent implements OnInit {
  dateForm!: FormGroup;
  productsData: ProductSales[] = [];
  productsByDateData: ProductSalesByDate[] = [];
  productsDates: string[] = [];
  categoriesData: CategorySales[] = [];
  categoriesByDateData: CategorySalesByDate[] = [];
  categoriesDates: string[] = [];
  summaryData: SalesSummary | null = null;
  loading = false;
  error: string | null = null;
  activeTab: 'summary' | 'products' | 'categories' = 'summary';
  currentPeriod: { startDate: string; endDate: string } | null = null;
  formInitialized = false;

  public chartType: ChartType = 'line';
  public chartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        enabled: true
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value;
          }
        }
      }
    }
  };
  
  constructor(
    private analysisService: AnalysisService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    this.dateForm = this.fb.group({
      startDate: [this.formatDate(startDate), Validators.required],
      endDate: [this.formatDate(endDate), Validators.required]
    });

    this.formInitialized = true;
    this.loadData();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadData(): void {
    if (this.dateForm.invalid) {
      return;
    }

    const { startDate, endDate } = this.dateForm.value;
    this.currentPeriod = { startDate, endDate };
    this.loading = true;
    this.error = null;

    this.analysisService.getSalesSummary(startDate, endDate).subscribe({
      next: (data) => {
        this.summaryData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erro ao carregar resumo de vendas. Verifique se o backend está rodando.';
        this.loading = false;
      }
    });

    if (this.activeTab === 'products') {
      this.loadProducts();
    }

    if (this.activeTab === 'categories') {
      this.loadCategories();
    }
  }

  loadProducts(): void {
    if (this.dateForm.invalid) {
      return;
    }

    const { startDate, endDate } = this.dateForm.value;
    this.loading = true;

    // Carregar dados agrupados por data para o gráfico
    this.analysisService.getProductsByDate(startDate, endDate).subscribe({
      next: (data) => {
        this.productsByDateData = data.products;
        this.productsDates = data.dates;
        this.currentPeriod = data.period;
        if (this.activeTab === 'products') {
          this.updateChartFromProducts();
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar análise de produtos';
        this.loading = false;
      }
    });

    // Também carregar dados agregados para a tabela
    this.analysisService.compareProductsByDateRange(startDate, endDate).subscribe({
      next: (data) => {
        this.productsData = data.products;
      },
      error: (err) => {
        console.error('Erro ao carregar dados agregados de produtos:', err);
      }
    });
  }

  loadCategories(): void {
    if (this.dateForm.invalid) {
      return;
    }

    const { startDate, endDate } = this.dateForm.value;
    this.loading = true;

    // Carregar dados agrupados por data para o gráfico
    this.analysisService.getCategoriesByDate(startDate, endDate).subscribe({
      next: (data) => {
        this.categoriesByDateData = data.categories;
        this.categoriesDates = data.dates;
        this.currentPeriod = data.period;
        if (this.activeTab === 'categories') {
          this.updateChartFromCategories();
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar análise de categorias';
        this.loading = false;
      }
    });

    // Também carregar dados agregados para a tabela
    this.analysisService.compareCategoriesByDateRange(startDate, endDate).subscribe({
      next: (data) => {
        this.categoriesData = data.categories;
      },
      error: (err) => {
        console.error('Erro ao carregar dados agregados de categorias:', err);
      }
    });
  }

  setActiveTab(tab: 'summary' | 'products' | 'categories'): void {
    this.activeTab = tab;
    
    if (tab === 'products') {
      if (this.productsByDateData.length === 0) {
        this.loadProducts();
      } else {
        // Atualizar gráfico com dados já carregados
        this.updateChartFromProducts();
      }
    } else if (tab === 'categories') {
      if (this.categoriesByDateData.length === 0) {
        this.loadCategories();
      } else {
        // Atualizar gráfico com dados já carregados
        this.updateChartFromCategories();
      }
    }
  }

  onDateChange(): void {
    this.loadData();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value);
  }

  formatDateDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  updateChartFromProducts(): void {
    if (this.productsByDateData.length === 0 || this.productsDates.length === 0) {
      this.chartData = { labels: [], datasets: [] };
      return;
    }

    // Pegar os top 5 produtos por total de vendas
    const topProducts = this.productsByDateData
      .map(product => ({
        ...product,
        totalSales: product.salesByDate.reduce((sum, sale) => sum + sale.quantity, 0)
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    const colors = [
      { border: '#667eea', background: 'rgba(102, 126, 234, 0.1)' },
      { border: '#f093fb', background: 'rgba(240, 147, 251, 0.1)' },
      { border: '#4facfe', background: 'rgba(79, 172, 254, 0.1)' },
      { border: '#43e97b', background: 'rgba(67, 233, 123, 0.1)' },
      { border: '#fa709a', background: 'rgba(250, 112, 154, 0.1)' }
    ];

    // Criar datasets para cada produto (cada produto é uma linha)
    const datasets = topProducts.map((product, index) => {
      // Criar array de quantidades para cada data
      const data = this.productsDates.map(date => {
        const sale = product.salesByDate.find(s => s.date === date);
        return sale ? sale.quantity : 0;
      });

      return {
        label: product.titulo,
        data: data,
        borderColor: colors[index % colors.length].border,
        backgroundColor: colors[index % colors.length].background,
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });

    // Formatar datas para exibição no eixo X
    const labels = this.productsDates.map(date => this.formatDateDisplay(date));

    this.chartData = {
      labels: labels,
      datasets: datasets
    };
  }

  updateChartFromCategories(): void {
    if (this.categoriesByDateData.length === 0 || this.categoriesDates.length === 0) {
      this.chartData = { labels: [], datasets: [] };
      return;
    }

    // Pegar todas as categorias (ou top 5 se houver muitas)
    const topCategories = this.categoriesByDateData
      .map(category => ({
        ...category,
        totalSales: category.salesByDate.reduce((sum, sale) => sum + sale.value, 0)
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    const colors = [
      { border: '#667eea', background: 'rgba(102, 126, 234, 0.1)' },
      { border: '#f093fb', background: 'rgba(240, 147, 251, 0.1)' },
      { border: '#4facfe', background: 'rgba(79, 172, 254, 0.1)' },
      { border: '#43e97b', background: 'rgba(67, 233, 123, 0.1)' },
      { border: '#fa709a', background: 'rgba(250, 112, 154, 0.1)' }
    ];

    // Criar datasets para cada categoria (cada categoria é uma linha)
    const datasets = topCategories.map((category, index) => {
      // Criar array de valores para cada data
      const data = this.categoriesDates.map(date => {
        const sale = category.salesByDate.find(s => s.date === date);
        return sale ? sale.value : 0;
      });

      return {
        label: category.categoria,
        data: data,
        borderColor: colors[index % colors.length].border,
        backgroundColor: colors[index % colors.length].background,
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });

    // Formatar datas para exibição no eixo X
    const labels = this.categoriesDates.map(date => this.formatDateDisplay(date));

    this.chartData = {
      labels: labels,
      datasets: datasets
    };
  }
}

