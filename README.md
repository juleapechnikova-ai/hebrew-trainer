# Hebrew trainer (עברית)

Тренажёр иврита — React + Vite.

## Первый push на GitHub

Из этой среды автоматически отправить код нельзя без вашего токена. Один раз у себя в терминале:

1. Создайте [Personal Access Token (classic)](https://github.com/settings/tokens) с правом **repo**.
2. В папке проекта:
   ```bash
   export GITHUB_TOKEN=ghp_xxxxxxxx   # вставьте свой токен
   npm run push:github
   unset GITHUB_TOKEN
   ```

Или: `bash scripts/push-to-github.sh` после `export GITHUB_TOKEN=...`.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
