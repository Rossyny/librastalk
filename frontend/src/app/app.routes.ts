import { Routes } from '@angular/router';

export const routes: Routes = [
  // 1. Tela Inicial padrão é o nosso Portal de Perfis (Welcome)
  {
    path: '',
    loadComponent: () => import('./welcome/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: 'welcome',
    loadComponent: () => import('./welcome/welcome.page').then((m) => m.WelcomePage),
  },

  // 2. Rota do Painel do Gerente (Mapeando a nossa HomePage que já possui os formulários)
  {
    path: 'admin',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },

  // 3. Rota oficial do Login Corporativo
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },

  // 4. Rota temporária do Tablet do Guichê (aponta para o portal até criarmos a tela)
  {
    path: 'ativar-tablet',
    loadComponent: () => import('./welcome/welcome.page').then((m) => m.WelcomePage),
  },

  // Rota de fallback (Redirecionamento de segurança para rotas inexistentes)
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];