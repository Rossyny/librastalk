import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VlibrasService {

  private scriptId = 'vlibras-script';
  private widgetContainerId = 'vlibras-widget-container';

  constructor() {}

  /**
   * Inicializa e monta o widget do VLibras dinamicamente na página
   */
  inicializar(): void {
    // Evita duplicar o widget caso a página seja recarregada ou acessada novamente
    if (document.getElementById(this.scriptId)) {
      this.exibirWidget(true);
      return;
    }

    // 1. Criar a estrutura HTML que o plugin do VLibras exige
    const container = document.createElement('div');
    container.id = this.widgetContainerId;
    container.setAttribute('vw', '');
    container.className = 'enabled';

    container.innerHTML = `
      <div vw-access-button class="active"></div>
      <div vw-plugin-wrapper>
        <div class="vw-plugin-top"></div>
      </div>
    `;

    document.body.appendChild(container);

    // 2. Criar e carregar o script oficial do VLibras
    const script = document.createElement('script');
    script.id = this.scriptId;
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.async = true;
    
    script.onload = () => {
      // Inicializa o Widget assim que o script terminar de carregar
      try {
        // @ts-ignore - Ignora o type-check do TypeScript para o objeto global window.VLibras
        new window.VLibras.Widget('https://vlibras.gov.br/app');
        console.log('VLibras inicializado com absoluto sucesso!');
      } catch (error) {
        console.error('Falha ao instanciar o widget do VLibras:', error);
      }
    };

    document.body.appendChild(script);
  }

  /**
   * Controla a exibição visual do botão de acessibilidade do VLibras
   */
  exibirWidget(mostrar: boolean): void {
    const container = document.getElementById(this.widgetContainerId);
    if (container) {
      container.style.display = mostrar ? 'block' : 'none';
    }
  }

  /**
   * Remove completamente o widget da tela (útil para quando o usuário sai do Totem)
   */
  destruir(): void {
    this.exibirWidget(false);
  }
}