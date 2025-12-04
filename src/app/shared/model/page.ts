export interface Page<T> {
  content: T[];
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  number: number;
  totalPages: number;
  sort: Sort;
  returnedElements: number;
  pageable: Pageable;
  empty: boolean;
}

interface Sort {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

interface Pageable {
  sort: Sort;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
  offset: number;
}
