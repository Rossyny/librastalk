import { Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginDTO {
  email: string;
  senha?: string;
}

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  perfil: 'ADMINISTRADOR' | 'ATENDENTE';
  estabelecimentoId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly API_URL = 'http://localhost:8080/api/auth';

  // WritableSignal para expor o usuário logado para todo o aplicativo
  public usuarioLogado: WritableSignal<UsuarioAutenticado | null> = signal(null);

  constructor(private http: HttpClient) {
    // Ao iniciar o app, verifica se já existe uma sessão salva no navegador
    const sessaoSalva = localStorage.getItem('librastalk_sessao');
    if (sessaoSalva) {
      this.usuarioLogado.set(JSON.parse(sessaoSalva));
    }
  }

  /**
   * Realiza a autenticação no Spring Boot
   * POST /api/auth/login
   */
  login(credenciais: LoginDTO): Observable<UsuarioAutenticado> {
    return this.http.post<UsuarioAutenticado>(`${this.API_URL}/login`, credenciais).pipe(
      tap((usuario) => {
        // Salva a sessão localmente no dispositivo para persistência
        localStorage.setItem('librastalk_sessao', JSON.stringify(usuario));
        this.usuarioLogado.set(usuario);
      })
    );
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