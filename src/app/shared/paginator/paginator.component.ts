import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { PaginatorService } from './paginator.service';

interface PaginatorFilter {
  page: number;
  size: number;
}
@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss']
})
export class PaginatorComponent implements OnInit, OnChanges {
  @Input() filter!: PaginatorFilter;
  @Input() totalElements: number = 0;
  @Input() pageLinkSize: number = 3;

  @Output() pageChange = new EventEmitter<number>();
  @Output() sizeChange = new EventEmitter<number>();

  totalPages: number = 0;
  visiblePages: number[] = [];
  pageSizeOptions: number[] = [10, 20, 50];
  showPageSizeOptions = false;
  paginatorIcons = this.paginatorService.getIcons();

  constructor(private paginatorService: PaginatorService) {}

  ngOnInit() {
    this.calculatePages();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.calculatePages();
  }

  calculatePages() {
    if (!this.filter || !this.totalElements) return;

    this.totalPages = Math.ceil(this.totalElements / this.filter.size);

    const half = Math.floor(this.pageLinkSize / 2);
    let start = Math.max(this.filter.page - half, 0);
    let end = Math.min(start + this.pageLinkSize - 1, this.totalPages - 1);

    if (end - start + 1 < this.pageLinkSize) {
      start = Math.max(end - this.pageLinkSize + 1, 0);
    }

    this.visiblePages = [];
    for (let i = start; i <= end; i++) {
      this.visiblePages.push(i);
    }
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    this.pageChange.emit(page);
  }

  changePageSize(size: number) {
    this.sizeChange.emit(size);
    this.showPageSizeOptions = false;
  }

  get startIndex() {
    return this.filter.page * this.filter.size;
  }

  get endIndex() {
    return Math.min(this.startIndex + this.filter.size, this.totalElements);
  }
}
