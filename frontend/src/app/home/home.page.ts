import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, 
  IonItem, IonLabel, IonSelect, IonSelectOption, IonGrid, IonRow, 
  IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonList, IonBadge, IonIcon, IonText, IonProgressBar
} from '@ionic/angular/standalone';
import { ApiService, CadastroUsuarioDTO, CadastroGuicheDTO, GuicheResposta } from '../services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonButton, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, 
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, 
    IonCardContent, IonList, IonBadge, IonIcon, IonText, IonProgressBar
  ]
})
export class HomePage {

  // Simulando que o Gerente logado gerencia o Estabelecimento ID: 1
  private readonly ESTABELECIMENTO_PADRAO_ID = 1;

  // Estado dos formulários de cadastro
  usuarioForm: CadastroUsuarioDTO = {
    nome: '',
    email: '',
    senha: '',
    perfil: 'ATENDENTE',
    estabelecimentoId: this.ESTABELECIMENTO_PADRAO_ID
  };

  guicheForm: CadastroGuicheDTO = {
    numeroIdentificador: 1,
    descricao: '',
    estabelecimentoId: this.ESTABELECIMENTO_PADRAO_ID
  };

  // Estados de feedback visual para a UI
  carregandoUsuario = false;
  carregandoGuiche = false;
  mensagemSucessoUsuario = '';
  mensagemErroUsuario = '';
  mensagemSucessoGuiche = '';
  mensagemErroGuiche = '';

  // Lista dinâmica para exibir os guichês criados na sessão atual com seus respectivos tokens de ativação
  guichesCriados: GuicheResposta[] = [];

  constructor(private apiService: ApiService) {}

  /**
   * Envia o formulário de cadastro de novo atendente para a API
   */
  cadastrarAtendente() {
    this.carregandoUsuario = true;
    this.mensagemSucessoUsuario = '';
    this.mensagemErroUsuario = '';

    // Pequena validação de segurança front-end
    if (!this.usuarioForm.nome || !this.usuarioForm.email || !this.usuarioForm.senha) {
      this.mensagemErroUsuario = 'Por favor, preencha todos os campos do atendente.';
      this.carregandoUsuario = false;
      return;
    }

    this.apiService.cadastrarUsuario(this.usuarioForm).subscribe({
      next: (response) => {
        this.mensagemSucessoUsuario = `Intérprete/Atendente "${response.nome}" cadastrado com absoluto sucesso!`;
        this.limparFormularioUsuario();
        this.carregandoUsuario = false;
      },
      error: (err) => {
        console.error(err);
        this.mensagemErroUsuario = err.error?.erro || 'Erro ao realizar cadastro de atendente. Verifique se o e-mail já existe.';
        this.carregandoUsuario = false;
      }
    });
  }

  /**
   * Envia o formulário de cadastro de novo totem/guichê e captura o Token autogerado pelo banco
   */
  cadastrarGuiche() {
    this.carregandoGuiche = true;
    this.mensagemSucessoGuiche = '';
    this.mensagemErroGuiche = '';

    if (!this.guicheForm.numeroIdentificador || !this.guicheForm.descricao) {
      this.mensagemErroGuiche = 'Por favor, preencha o número e a descrição do guichê.';
      this.carregandoGuiche = false;
      return;
    }

    this.apiService.cadastrarGuiche(this.guicheForm).subscribe({
      next: (response) => {
        this.mensagemSucessoGuiche = `Guichê de número ${response.numeroIdentificador} registrado!`;
        
        // Adiciona o guichê recém-criado no topo da lista para exibição imediata do Token na tela
        this.guichesCriados.unshift(response);
        
        this.limparFormularioGuiche();
        this.carregandoGuiche = false;
      },
      error: (err) => {
        console.error(err);
        this.mensagemErroGuiche = err.error?.erro || 'Erro ao registrar guichê físico.';
        this.carregandoGuiche = false;
      }
    });
  }

  // Métodos auxiliares para limpar formulários após sucesso
  private limparFormularioUsuario() {
    this.usuarioForm = {
      nome: '',
      email: '',
      senha: '',
      perfil: 'ATENDENTE',
      estabelecimentoId: this.ESTABELECIMENTO_PADRAO_ID
    };
  }

  private limparFormularioGuiche() {
    this.guicheForm = {
      numeroIdentificador: (this.guicheForm.numeroIdentificador || 0) + 1, // Auto-incrementa sugestão de número
      descricao: '',
      estabelecimentoId: this.ESTABELECIMENTO_PADRAO_ID
    };
  }
}