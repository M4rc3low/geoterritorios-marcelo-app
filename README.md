# GeoTerritórios Marcelo

[![CI](https://github.com/M4rc3low/geoterritorios-marcelo-app/actions/workflows/ci.yml/badge.svg)](https://github.com/M4rc3low/geoterritorios-marcelo-app/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

Aplicação web para organizar, visualizar e acompanhar **territórios, prédios, apartamentos, regiões e indicadores de cobertura** em uma interface responsiva e orientada por dados.

O projeto transforma informações territoriais dispersas em uma base digital mais organizada, visual e fácil de consultar.

## Visão de produto

O controle territorial pode acabar distribuído entre planilhas, anotações, mapas e conferências manuais. Isso dificulta identificar rapidamente quais áreas já foram trabalhadas, quais ainda precisam de atenção e quais pontos devem receber prioridade.

O GeoTerritórios centraliza essas informações e cria uma base preparada para dashboards, mapas, filtros e indicadores operacionais.

## Principais capacidades

- Cadastro e organização de territórios
- Controle de prédios, apartamentos e endereços
- Acompanhamento de cobertura territorial
- Identificação de áreas pendentes e concluídas
- Indicadores para priorização e tomada de decisão
- Organização visual por status, região e prioridade
- Base para mapas e dados geográficos
- Interface responsiva para desktop e mobile

## Stack técnica

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 18 |
| Build | Vite 6 |
| Estilização | Tailwind CSS |
| Roteamento | React Router |
| Mapas | React Leaflet |
| Estado/dados | Client local + localStorage |
| Data fetching | TanStack Query |
| Gráficos | Recharts |
| UI/Icons | Radix UI + Lucide React |
| Qualidade | ESLint + TypeScript check via JSConfig |
| Container | Docker |
| CI | GitHub Actions |

## Arquitetura

```text
src/
├── api/                 # Client local da aplicação
├── components/          # Componentes reutilizáveis
├── lib/                 # Utilitários e camada de apoio
├── pages/               # Páginas principais
└── main.jsx             # Entrada da aplicação
```

A camada de dados local fica isolada em `src/api/geoterritoriosClient.js`. Isso reduz o acoplamento da interface e facilita uma evolução futura para API, banco persistente e integrações geográficas externas.

## Como executar localmente

```bash
git clone https://github.com/M4rc3low/geoterritorios-marcelo-app.git
cd geoterritorios-marcelo-app
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

### Docker

```bash
docker build -t geoterritorios-marcelo-app .
docker run --rm -p 8080:80 geoterritorios-marcelo-app
```

## Scripts e validações

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o ambiente local |
| `npm test` | Executa smoke test estrutural |
| `npm run lint` | Executa análise de lint |
| `npm run typecheck` | Executa verificação de tipos/configuração |
| `npm run build` | Gera build de produção |
| `npm run preview` | Visualiza o build local |

A pipeline de CI executa automaticamente **teste, lint, typecheck, build da aplicação e build da imagem Docker** em pushes e pull requests para `main`.

## Qualidade e segurança

- Dados sensíveis não devem ser versionados.
- Arquivos de exportação real devem ficar fora do repositório.
- Dados demonstrativos devem ser anonimizados.
- Antes de integrar alterações, execute `npm test`, `npm run lint`, `npm run typecheck` e `npm run build`.

## Roadmap técnico

- [ ] Adicionar screenshots reais da interface
- [ ] Publicar versão demonstrativa
- [ ] Evoluir o dashboard de cobertura territorial
- [ ] Integrar camadas de mapa e arquivos KML/GeoJSON
- [ ] Adicionar filtros avançados por status, região e prioridade
- [ ] Implementar persistência em backend
- [ ] Adicionar monitoramento e logs operacionais

## Valor profissional

Este projeto demonstra desenvolvimento web aplicado a um problema real, organização de dados, visualização geográfica, dashboards e práticas de engenharia como **testes estruturais, CI e containerização**.

## Autor

Desenvolvido por Marcelo Gomes.
