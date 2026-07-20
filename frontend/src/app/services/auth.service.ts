import { Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment'; // <-- IMPORTANTE: Importa o environment dinâmico

// DTO para envio de dados ao Spring Boot
export interface LoginDTO {
  email: string;
  senha?: string;
}

// Interface que reflete o usuário retornado pelo seu banco de dados PostgreSQL
export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  perfil: 'ADMINISTRADOR' | 'ATENDENTE' | 'ADMIN' | 'GERENTE'; // <-- Adicionado 'GERENTE' para bater com o banco!
  estabelecimentoId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Agora ele usa a URL configurada no environment.ts ou environment.prod.ts automaticamente!
  private readonly API_URL = `${environment.apiUrl}/api/auth`;

  // WritableSignal para expor o usuário logado de forma reativa para todo o aplicativo
  public usuarioLogado: WritableSignal<UsuarioAutenticado | null> = signal(null);

  constructor(private http: HttpClient) {
    // Ao iniciar o app, verifica se já existe uma sessão salva no localStorage do navegador
    const sessaoSalva = localStorage.getItem('librastalk_sessao');
    if (sessaoSalva) {
      try {
        this.usuarioLogado.set(JSON.parse(sessaoSalva));
      } catch (e) {
        console.error('Erro ao restaurar sessão salva:', e);
        this.logout();
      }
    }
  }

  /**
   * Realiza a autenticação no Spring Boot
   * POST /api/auth/login
   */
  login(credenciais: LoginDTO): Observable<UsuarioAutenticado> {
    return this.http.post<UsuarioAutenticado>(`${this.API_URL}/login`, credenciais).pipe(
      tap((usuario) => {
        // Salva a sessão localmente no dispositivo para persistência (não deslogar no F5)
        localStorage.setItem('librastalk_sessao', JSON.stringify(usuario));
        // Atualiza o Signal reativo da aplicação
        this.usuarioLogado.set(usuario);
      })
    );
  }

  /**
   * Retorna os dados do usuário logado na sessão (Método de compatibilidade)
   */
  getUsuarioLogado(): UsuarioAutenticado | null {
    return this.usuarioLogado();
  }

  /**
   * Encerra a sessão ativa do usuário
   */
  logout(): void {
    localStorage.removeItem('librastalk_sessao');
    this.usuarioLogado.set(null);
  }

  /**
   * Retorna se o usuário está autenticado no momento
   */
  estaAutenticado(): boolean {
    return this.usuarioLogado() !== null;
  }
}