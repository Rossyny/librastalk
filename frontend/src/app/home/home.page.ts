import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  IonContent, IonGrid, IonRow, IonCol, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, 
  IonButton, IonIcon, AlertController, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  briefcaseOutline, logOutOutline, peopleOutline, 
  desktopOutline, personAddOutline, hardwareChipOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonGrid, IonRow, IonCol, 
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon
  ]
})
export class HomePage implements OnInit {

  gerenteNome: string = 'Gerente de Operações';
  estabelecimentoNome: string = 'Estabelecimento B2B';
  estabelecimentoId: number = 1;
  
  totalAtendentes: number = 0;
  totalGuiches: number = 0;

  private readonly API_BASE = 'http://localhost:8080/api';

  constructor(
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      briefcaseOutline,
      logOutOutline,
      peopleOutline,
      desktopOutline,
      personAddOutline,
      hardwareChipOutline
    });
  }

  ngOnInit() {
    this.carregarDadosSessao();
    this.carregarIndicadores();
  }

  /**
   * Recupera as informações do Gerente salvas no localStorage após o login
   */
  /**
   * Recupera o ID da chave 'librastalk_sessao' e busca o nome exato do Gerente no banco de dados
   */
  carregarDadosSessao() {
    // 1. Tenta buscar o ID de chaves simples do localStorage
    let usuarioId = localStorage.getItem('usuarioId') || localStorage.getItem('id_usuario');

    // 2. Lê a chave principal criada pelo seu AuthService ('librastalk_sessao')
    const usuarioSalvo = localStorage.getItem('librastalk_sessao');
    if (usuarioSalvo) {
      try {
        const obj = JSON.parse(usuarioSalvo);
        if (obj && obj.id) {
          usuarioId = obj.id.toString();
        }
      } catch (e) {
        console.error('Erro ao ler dados da sessão do localStorage:', e);
      }
    }

    // 3. Fallback de segurança caso a sessão não tenha o ID
    if (!usuarioId) {
      console.warn('Home Gerente: Nenhum ID de gerente encontrado na sessão. Usando ID 1 como padrão.');
      usuarioId = '1';
    }

    console.log(`Home Gerente: Buscando dados do Gerente ID ${usuarioId} no banco de dados...`);

    // 4. Faz o GET para pegar o nome atualizado direto da tabela do banco Java
    this.http.get<any>(`${this.API_BASE}/usuarios/${usuarioId}`).subscribe({
      next: (usuarioDoBanco) => {
        if (usuarioDoBanco && usuarioDoBanco.nome) {
          this.gerenteNome = usuarioDoBanco.nome;
        }

        // Se o usuário do banco tiver vinculo com o estabelecimento
        if (usuarioDoBanco.estabelecimento) {
          this.estabelecimentoNome = usuarioDoBanco.estabelecimento.nome || this.estabelecimentoNome;
          this.estabelecimentoId = usuarioDoBanco.estabelecimento.id || this.estabelecimentoId;
        }

        console.log('Home Gerente: Nome carregado com sucesso do banco:', this.gerenteNome);
      },
      error: (err) => {
        console.error('Home Gerente: Erro ao buscar nome do gerente no banco:', err);
        this.gerenteNome = 'Gerente de Operações';
      }
    });
  }

  carregarIndicadores() {
    // Busca a quantidade exata de ATENDENTES registrada no banco
    this.http.get<any>(`${this.API_BASE}/usuarios/contar-atendentes`).subscribe({
      next: (res) => {
        if (res && res.totalAtendentes !== undefined) {
          this.totalAtendentes = res.totalAtendentes;
        }
      },
      error: (err) => {
        console.error('Erro ao buscar total de atendentes:', err);
      }
    });

    // Busca os guichês cadastrados
    this.http.get<any[]>(`${this.API_BASE}/guiches`).subscribe({
      next: (guiches) => {
        if (Array.isArray(guiches)) {
          this.totalGuiches = guiches.length;
        }
      },
      error: (err) => {
        console.error('Erro ao buscar total de guichês:', err);
      }
    });
  }

  // =========================================================================
  // CARD 1: CADASTRAR ATENDENTE (POST /api/usuarios/cadastrar)
  // =========================================================================
  async irParaCadastrarAtendente() {
    const alert = await this.alertController.create({
      header: 'Cadastrar Atendente',
      subHeader: 'Novo Intérprete de Libras',
      inputs: [
        { name: 'nome', type: 'text', placeholder: 'Nome completo' },
        { name: 'email', type: 'email', placeholder: 'E-mail corporativo' },
        { name: 'senha', type: 'password', placeholder: 'Senha de acesso' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cadastrar',
          handler: (data) => {
            if (!data.nome || !data.email || !data.senha) {
              this.exibirToast('Preencha todos os campos do formulário!', 'warning');
              return false;
            }

            const payload = {
              nome: data.nome,
              email: data.email,
              senha: data.senha,
              perfil: 'ATENDENTE',
              estabelecimentoId: this.estabelecimentoId
            };

            this.http.post(`${this.API_BASE}/usuarios/cadastrar`, payload).subscribe({
              next: () => {
                this.exibirToast('Atendente cadastrado com sucesso!', 'success');
                this.totalAtendentes++;
              },
              error: (err) => {
                const msg = err.error?.erro || 'Erro ao cadastrar atendente.';
                this.exibirToast(msg, 'danger');
              }
            });

            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  // =========================================================================
  // CARD 2: CONFIGURAR GUICHÊS E GERAR TOKEN (POST /api/guiches/cadastrar)
  // =========================================================================
  async irParaGerenciarGuiches() {
    const alert = await this.alertController.create({
      header: 'Novo Guichê / Ponto Físico',
      subHeader: 'Identifique a localização do totem para gerar o token',
      inputs: [
        { name: 'identificacao', type: 'text', placeholder: 'Ex: Caixa 01, Balcão Central' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar & Gerar Token',
          handler: (data) => {
            if (!data.identificacao) {
              this.exibirToast('Informe o nome ou número do guichê.', 'warning');
              return false;
            }

            const payload = {
              identificacao: data.identificacao,
              estabelecimentoId: this.estabelecimentoId
            };

            this.http.post<any>(`${this.API_BASE}/guiches/cadastrar`, payload).subscribe({
              next: (res) => {
                this.totalGuiches++;
                this.exibirToast(`Guichê "${res.identificacao}" cadastrado!`, 'success');
                // Exibe o token retornado pelo backend Java
                this.exibirModalTokenGerado(res.identificacao, res.tokenAcesso);
              },
              error: (err) => {
                const msg = err.error?.erro || 'Erro ao cadastrar guichê.';
                this.exibirToast(msg, 'danger');
              }
            });

            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Modal que exibe em destaque o Token gerado pelo backend Java
   */
  async exibirModalTokenGerado(guicheNome: string, token: string) {
    const alert = await this.alertController.create({
      header: '🔑 Token de Ativação Gerado',
      subHeader: `Guichê: ${guicheNome}`,
      message: `Digite esta chave no tablet para ativá-lo:\n\n${token}`,
      buttons: ['Concluído']
    });

    await alert.present();
  }

  // =========================================================================
  // NAVEGAÇÃO & UTILITÁRIOS
  // =========================================================================
  fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  async exibirToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

}