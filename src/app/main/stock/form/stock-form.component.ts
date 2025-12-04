import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StockService } from '../stock.service';

@Component({
  selector: 'app-stock-form',
  templateUrl: './stock-form.component.html',
  styleUrls: ['./stock-form.component.scss']
})
export class StockFormComponent implements OnInit {
  id?: number;
  form!: FormGroup;
  private isCalculatingVenda = false;
  
  categorias: string[] = [
    'ROCK',
    'POP',
    'SERTANEJO',
    'FUNK',
    'RAP',
    'TRAP',
    'MPB',
    'FORRÓ',
    'PAGODE',
    'SAMBA',
    'AXÉ',
    'REGGAE',
    'JAZZ',
    'BLUES',
    'CLASSICA',
    'ELETRONICA',
    'GOSPEL',
    'COUNTRY',
    'METAL',
    'PUNK',
    'INDIE',
    'OUTROS'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private stockService: StockService
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.params['id']) || undefined;

    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(2)]],
      artista: ['', [Validators.required, Validators.minLength(2)]],
      ano: [null, [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      categoria: ['', Validators.required],
      estoque: [0, [Validators.required, Validators.min(0)]],
      valorCusto: [0, [Validators.required, Validators.min(0)]],
      valorVenda: [0, [Validators.required, Validators.min(0)]],
      ativo: [true],
      genero: [''],
      gravadora: [''],
      edicao: [''],
      codigoBarras: [''],
      numeroFaixas: [null, [Validators.min(0)]],
      duracao: [''],
      sinopse: [''],
      dimensoes: this.fb.group({
        altura: [null, [Validators.min(0)]],
        largura: [null, [Validators.min(0)]],
        peso: [null, [Validators.min(0)]],
        profundidade: [null, [Validators.min(0)]]
      }),
      grupoPrecificacao: ['']
    });

    this.form.get('valorCusto')?.valueChanges.subscribe((valorCusto) => {
      if (!this.isCalculatingVenda && valorCusto && valorCusto > 0) {
        const margemMinima = 0.3;
        const valorVendaCalculado = valorCusto * (1 + margemMinima);
        
        const valorVendaArredondado = Math.round(valorVendaCalculado * 100) / 100;
        
        this.isCalculatingVenda = true;
        this.form.patchValue({ valorVenda: valorVendaArredondado }, { emitEvent: false });
        this.isCalculatingVenda = false;
      }
    });

    if (this.id) {
      this.isCalculatingVenda = true;
      
      this.stockService.getById(this.id).subscribe({
        next: (cd) => {
          if (cd) {
            const formData: any = { ...cd };
            
            if (cd.dimensoes && typeof cd.dimensoes === 'string') {
              try {
                formData.dimensoes = JSON.parse(cd.dimensoes);
              } catch (e) {
                formData.dimensoes = null;
              }
            }
            
            this.form.patchValue(formData);
            setTimeout(() => {
              this.isCalculatingVenda = false;
            }, 100);
          }
        },
        error: (err) => {
          console.error('Erro ao carregar produto:', err);
          this.isCalculatingVenda = false;
        }
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const payload: any = { ...formValue };
    
    if (formValue.dimensoes) {
      const dims = formValue.dimensoes;
      if (dims.altura || dims.largura || dims.peso || dims.profundidade) {
        payload.dimensoes = {
          altura: dims.altura || null,
          largura: dims.largura || null,
          peso: dims.peso || null,
          profundidade: dims.profundidade || null
        };
      } else {
        payload.dimensoes = null;
      }
    }

    if (this.id) {
      this.stockService.update(this.id, payload).subscribe({
        next: () => {
          this.router.navigate(['/app/stock'], { replaceUrl: true });
        },
        error: (err) => {
          alert('Erro ao atualizar produto');
          console.error(err);
        }
      });
    } else {
      this.stockService.create(payload).subscribe({
        next: () => {
          this.router.navigate(['/app/stock'], { replaceUrl: true });
        },
        error: (err) => {
          alert('Erro ao criar produto');
          console.error(err);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/app/stock']);
  }
}
