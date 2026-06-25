# Selleta Modas

E-commerce de moda feminina com catálogo, carrinho, checkout, área da cliente
e painel administrativo.

## Manual de operação

- [Manual em PDF](public/docs/Manual-Selleta-Modas.pdf)
- [Versão editável](docs/Manual-Selleta-Modas.md)

O manual explica o login administrativo e da cliente, cadastro de produtos,
grade por tamanho/cor/estampa, estoque, pedidos, pagamentos e relatórios.

## Desenvolvimento

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

## Base técnica

React, Vite, Tailwind CSS, Supabase e Vercel.

---

## Referência do template Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
