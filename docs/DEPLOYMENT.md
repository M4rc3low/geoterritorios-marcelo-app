# Deployment Guide

## Recommended platform

The recommended deployment target for this project is Vercel because the application is a Vite-powered React single-page application.

## Build settings

Use the following settings when importing the repository into Vercel:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci` |
| Node.js Version | 20 |

## Environment variables

The current version does not require production environment variables.

If environment variables are introduced later, document them in `.env.example` and configure them in the deployment platform dashboard.

## Pre-deployment checklist

Before deploying, run locally:

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

## Post-deployment checklist

After deployment:

- Open the production URL
- Test the main navigation
- Test territory registration and updates
- Test map-related views
- Test responsive layout on mobile
- Capture screenshots for the README
- Add the production link to the repository description
- Add a deployment badge to `README.md`

## Notes

This project currently uses local browser storage for demonstration. For production usage with real data, replace local persistence with a secure backend and database.
