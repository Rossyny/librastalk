import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces que tipam com segurança os dados trafegados
export interface CadastroUsuarioDTO {
  nome: string;
  email: string;
  senha?: string;
  perfil: 'ATENDENTE' | 'ADMINISTRADOR';
  estabelecimentoId: number;
}

export interface CadastroGuicheDTO {
  numeroIdentificador: number;
  descricao: string;
  estabelecimentoId: number;
}

export interface GuicheResposta {
  id: number;
  numeroIdentificador: number;
  descricao: string;
  tokenAtivacao: string;
  ativo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // URL base do seu Spring Boot local
  private readonly API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  /**
   * Cadastra um novo atendente/intérprete no sistema
   * POST /api/usuarios/cadastrar
   */
  cadastrarUsuario(usuario: CadastroUsuarioDTO): Observable<any> {
    return this.http.post(`${this.API_URL}/usuarios/cadastrar`, usuario);
  }

  /**
   * Cadastra um novo guichê físico (totem/tablet) e gera seu respectivo Token
   * POST /api/guiches/cadastrar
   */
  cadastrarGuiche(guiche: CadastroGuicheDTO): Observable<GuicheResposta> {
    return this.http.post<GuicheResposta>(`${this.API_URL}/guiches/cadastrar`, guiche);
  }
}