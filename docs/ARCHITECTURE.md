# Architecture

## Overview

GeoTerritorios Marcelo is a React single-page application focused on territorial organization, building and apartment control, coverage tracking and map-oriented data visualization.

The current version uses a local data layer based on `localStorage`. This keeps the project functional for demonstration and allows a future migration to a backend, database and geographic services.

## High-level structure

```txt
src/
├── api/                 # Local data access layer
├── components/          # Reusable UI and feature components
├── lib/                 # Utilities and support layer
├── pages/               # Route-level pages
└── main.jsx             # Application bootstrap
```

## Data layer

The application uses a local client responsible for:

- Reading collections
- Creating records
- Updating records
- Deleting records
- Simulating updates through browser events

This isolates persistence concerns from UI components.

## Current data flow

```txt
Page or Component
      ↓
Feature logic / hook
      ↓
Local client
      ↓
localStorage
      ↓
UI refresh / event dispatch
```

## Map evolution path

The project is prepared to evolve into a more complete geographic workflow:

```txt
Territory data
      ↓
GeoJSON / KML layers
      ↓
Map rendering
      ↓
Coverage dashboard
      ↓
Operational decision-making
```

## Future production architecture

```txt
React frontend
      ↓
API layer
      ↓
Authentication and authorization
      ↓
Database / geospatial storage
      ↓
Maps, dashboards and monitoring
```

## Recommended evolution

- Add backend API
- Add authentication and authorization
- Replace local storage with persistent database
- Add KML/GeoJSON import support
- Add map layer management
- Add test coverage
- Add CI/CD deployment checks
- Add structured logs and monitoring

## Security considerations

Real addresses and operational data should be protected. Public examples should use anonymized or synthetic data.
