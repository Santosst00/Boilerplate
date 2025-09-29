# Boilerplate

Painel admin **estático** com tema claro/escuro, sidebar colapsável e páginas:
**Dashboard, Notificações, Clientes (CRUD localStorage), Vendas (gráficos Canvas), Configurações**.

https://github.com/<seu-usuario>/admin-base  
*(publique pelo GitHub Pages e vire referência no seu portfólio 👀)*

## ✨ Features
- Sidebar colapsável com preferências de tema (persistidas em `localStorage`)
- Router por hash (`#dashboard`, `#clients`, etc.)
- Dashboard com KPIs e gráficos **Canvas puro** (0 libs)
- Notificações com filtros (todas / não lidas)
- Clientes com **CRUD** localStorage, busca, paginação e modal
- Vendas com gráfico de barras, top produtos e pedidos fake
- Layout responsivo (mobile-first vibes)

## 🧱 Stack
- HTML + CSS + JS (Vanilla)
- Canvas API (charts)
- localStorage (persistência leve)
- GitHub Pages (deploy)

## 🚀 Rodando localmente
Abra o `index.html` no navegador ou rode um server estático:

```bash
# Node
npx serve

# ou Python
python -m http.server 5173
