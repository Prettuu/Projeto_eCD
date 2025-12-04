import { Injectable } from '@angular/core';
import { PaginatorIcon } from '../model/paginator';

@Injectable({
  providedIn: 'root'
})
export class PaginatorService {
  icons: PaginatorIcon[] = [
    { template: "firstpagelinkicon", icon: "fa-icon fa-angles-left" },
    { template: "previouspagelinkicon", icon: "fa-icon fa-angle-left" },
    { template: "nextpagelinkicon", icon: "fa-icon fa-angle-right" },
    { template: "lastpagelinkicon", icon: "fa-icon fa-angles-right" }
  ];

  getIcons(): PaginatorIcon[] {
    return this.icons;
  }
}
