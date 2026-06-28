import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./welcome/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: 'welcome',
    loadComponent: () => import('./welcome/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: 'admin',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  // Rota oficial do Painel do Atendente
  {
    path: 'atendente-dashboard',
    loadComponent: () => import('./atendente-dashboard/atendente-dashboard.page').then((m) => m.AtendenteDashboardPage),
  },
  {
    path: 'ativar-tablet',
    loadComponent: () => import('./ativar-tablet/ativar-tablet.page').then((m) => m.AtivarTabletPage),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];