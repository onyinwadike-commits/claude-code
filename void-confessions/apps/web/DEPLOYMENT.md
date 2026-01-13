# Walmart Ops - Deployment Guide

This document provides instructions for deploying the Walmart Ops Visual Merchandising AI platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Node.js**: v18.17.0 or higher
- **pnpm**: v8.15.0 or higher
- **Memory**: Minimum 4GB RAM for build process
- **Disk Space**: Minimum 2GB free space

### Required Services

- **Redis**: For caching and real-time pub/sub
- **PostgreSQL**: For data persistence (optional for demo mode)

---

## Environment Setup

### 1. Copy Environment Template

```bash
cp .env.example .env.local
```

### 2. Configure Required Variables

At minimum, configure these variables:

```bash
# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_NAME="Walmart Ops"

# API URLs (update with your deployment URLs)
NEXT_PUBLIC_WS_URL="wss://your-ws-server.com"
NEXT_PUBLIC_API_URL="https://your-api-server.com"

# Redis (required for real-time features)
REDIS_URL="redis://your-redis-server:6379"
```

### 3. Configure LLM Providers (Optional)

For Phase 2 Multi-LLM functionality, add API keys:

```bash
GEMINI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"
CLAUDE_API_KEY="your-claude-api-key"
```

---

## Build Process

### Development Build

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

### Production Build

```bash
# Install dependencies
pnpm install

# Type check
pnpm typecheck

# Run linting
pnpm lint

# Run tests
pnpm test:ci

# Build for production
pnpm build
```

### Build Output

The production build creates:
- `.next/` - Next.js build output
- `.next/standalone/` - Standalone server (for containerized deployments)
- `.next/static/` - Static assets

---

## Deployment Options

### Option 1: Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

```bash
# Or deploy manually
npx vercel --prod
```

### Option 2: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t walmart-ops .
docker run -p 3000:3000 walmart-ops
```

### Option 3: Node.js Server

```bash
# Build
pnpm build

# Start production server
pnpm start
```

### Option 4: Kubernetes

See `infrastructure/kubernetes/` for Kubernetes manifests.

```bash
# Apply configurations
kubectl apply -k infrastructure/kubernetes/overlays/production
```

---

## Post-Deployment

### Health Checks

Verify deployment with:

```bash
# Application health
curl https://your-domain.com/api/health

# API health
curl https://your-domain.com/api/feedback
```

### Monitoring

1. **Application Logs**: Check container/server logs
2. **Error Tracking**: Configure Sentry DSN in environment
3. **Performance**: Monitor with your preferred APM tool

### SSL/TLS

Ensure HTTPS is configured:
- Use Vercel's automatic SSL
- Or configure your own certificate with nginx/CloudFlare

---

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
```

#### Memory Issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

#### Missing Environment Variables

Check all required variables are set:

```bash
printenv | grep NEXT_PUBLIC
```

### Support

For issues:
1. Check application logs
2. Review error messages in browser console
3. Verify environment variables
4. Contact platform team

---

## Security Checklist

Before deploying to production:

- [ ] All API keys are set as environment variables (not hardcoded)
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled on API routes
- [ ] Security headers are configured (see next.config.js)
- [ ] No sensitive data in client-side code
- [ ] Database connections use SSL
- [ ] Redis connections use TLS (if applicable)

---

## Version Information

- **Next.js**: 14.0.4
- **React**: 18.2.0
- **Node.js**: 18.x LTS
- **pnpm**: 8.15.0

Last Updated: January 2026
