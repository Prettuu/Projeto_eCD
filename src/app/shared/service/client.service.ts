import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Client } from '../model/client/client';
import { Page } from '../model/page';
import { ClientFilter } from '../model/filter';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  constructor(private http: HttpClient) { }

  listClients(filter: ClientFilter) {
    const params: HttpParams = new HttpParams({
      fromObject: {
        page: filter.page,
        size: filter.size
      }
    })

    return this.http.get<Page<Client>>("http://localhost:3002/api/clients", { params })
  }
}
