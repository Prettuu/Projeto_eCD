import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';

import { AnalysisComponent } from './analysis.component';
import { AnalysisService } from './analysis.service';
import { AnalysisRoutingModule } from './analysis.routing';

@NgModule({
  declarations: [AnalysisComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AnalysisRoutingModule,
    NgChartsModule
  ],
  providers: [AnalysisService]
})
export class AnalysisModule { }

