# GeoTerritorios Marcelo

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwindcss&logoColor=white)
![Maps](https://img.shields.io/badge/maps-ready-green)
![Status](https://img.shields.io/badge/status-active-brightgreen)

GeoTerritorios Marcelo e uma aplicacao web para organizar, visualizar e acompanhar territorios, predios, apartamentos, regioes e indicadores de cobertura em uma interface clara, responsiva e orientada por dados.

O projeto transforma informacoes territoriais dispersas em uma base digital mais organizada, visual e facil de consultar.

## Visao de produto

O controle territorial costuma depender de planilhas, anotacoes, mapas impressos e conferencias manuais. Esse processo dificulta saber rapidamente quais areas ja foram trabalhadas, quais ainda precisam de atencao e quais pontos devem receber prioridade.

O GeoTerritorios Marcelo busca resolver esse problema com uma aplicacao centralizada, preparada para dashboards, mapas, filtros e indicadores operacionais.

## Principais capacidades

- Cadastro e organizacao de territorios
- Controle de predios, apartamentos e enderecos
- Acompanhamento de cobertura territorial
- Identificacao de areas pendentes e concluidas
- Indicadores para priorizacao e tomada de decisao
- Organizacao visual por status, regiao e prioridade
- Base para integracao com mapas e dados geograficos
- Interface responsiva para desktop e mobile

## Stack tecnica

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 18 |
| Build | Vite |
| Estilizacao | Tailwind CSS |
| Roteamento | React Router |
| Mapas | React Leaflet |
| Estado/dados | Local client + localStorage |
| Data fetching | TanStack Query |
| Graficos | Recharts |
| UI/Icons | Radix UI + Lucide React |

## Arquitetura

```txt
src/
├── api/                 # Client local da aplicacao
├── components/          # Componentes reutilizaveis
├── lib/                 # Utilitarios e camada de apoio
├── pages/               # Paginas principais
└── main.jsx             # Entrada da aplicacao
```

A camada de dados local foi isolada para facilitar uma evolucao futura para backend real, banco persistente e integracoes com fontes geograficas externas.

## Como executar localmente

```bash
git clone https://github.com/M4rc3low/geoterritorios-marcelo-app.git
cd geoterritorios-marcelo-app
npm install
npm run dev
```

Build de producao:

```bash
npm run build
npm run preview
```

## Scripts

| Comando | Descricao |
| --- | --- |
| `npm run dev` | Inicia o ambiente local |
| `npm run build` | Gera build de producao |
| `npm run preview` | Visualiza o build local |
| `npm run lint` | Executa analise de lint |
| `npm run lint:fix` | Corrige problemas automaticos de lint |
| `npm run typecheck` | Executa verificacao de tipos/configuracao |

## Qualidade e seguranca

- Dados sensiveis nao devem ser versionados.
- Arquivos de exportacao real devem ficar fora do repositorio.
- Dados demonstrativos devem ser anonimizados.
- Antes de publicar, executar `npm run build`, `npm run lint` e `npm run typecheck`.

## Roadmap tecnico

- [ ] Adicionar screenshots reais da interface
- [ ] Publicar versao demonstrativa
- [ ] Criar dashboard completo de cobertura territorial
- [ ] Integrar camadas de mapa e arquivos KML/GeoJSON
- [ ] Adicionar filtros avancados por status, regiao e prioridade
- [ ] Implementar persistencia em backend
- [ ] Preparar deploy em ambiente de producao
- [ ] Adicionar monitoramento e logs operacionais

## Valor profissional

Este projeto demonstra aplicacao pratica de desenvolvimento web, organizacao de dados, visualizacao geografica, dashboards e solucao de problemas reais com foco operacional.

## Autor

Desenvolvido por Marcelo Gomes.
