# Production Deployment Guide

This guide covers deploying LTF1 to production, including infrastructure setup, security considerations, and operational best practices.

## Overview

LTF1 production deployment involves:
- **Frontend**: React app deployed to Vercel
- **Backend**: Convex serverless functions
- **Authentication**: Clerk for user management
- **Monitoring**: Performance and error tracking

## Prerequisites

### Required Accounts
1. **Vercel Account** (for frontend hosting)
2. **Convex Account** (for backend)
3. **Clerk Account** (for authentication)
4. **GitHub Account** (for source control)

### Development Setup
- Node.js 18+ installed
- pnpm or npm package manager
- Git configured
- LTF1 codebase cloned

## Environment Configuration

### Production Environment Variables

Create `.env.production` file:
```bash
# Convex Production
VITE_CONVEX_URL=https://your-prod.convex.cloud

# Clerk Production
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx

# Optional: Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Feature Flags
VITE_ENABLE_GITHUB_INTEGRATION=false
VITE_ENABLE_AI_FEATURES=false
```

### Convex Environment Variables
Set in Convex dashboard:
```bash
CLERK_WEBHOOK_SECRET=whsec_xxxxx
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx
WEBHOOK_URL=https://your-app.vercel.app/api/webhooks
```

## Convex Deployment

### 1. Initial Setup
```bash
# Install Convex CLI
npm install -g convex

# Deploy to production
npx convex deploy --prod
```

### 2. Configure Production Environment
```bash
# Set environment variables
npx convex env set CLERK_WEBHOOK_SECRET "whsec_xxxxx" --prod

# Deploy functions
npx convex deploy --prod
```

### 3. Database Indexes
Ensure all indexes are created:
```typescript
// convex/schema.ts
export default defineSchema({
  tasks: defineTable({
    // ... fields
  })
  .index("by_project", ["projectId"])
  .index("by_assignee", ["assigneeId"])
  .index("by_status", ["projectId", "status"])
  .index("by_sprint", ["sprintId"])
  // ... more indexes
})
```

### 4. Production Functions
Review and optimize functions:
```typescript
// Use efficient queries
export const getProjectTasks = query({
  handler: async (ctx, args) => {
    // Use indexes for performance
    return await ctx.db
      .query("tasks")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .filter(q => q.eq(q.field("deleted"), false))
      .take(100) // Pagination
  }
})
```

## Frontend Deployment (Vercel)

### 1. Connect GitHub Repository
```bash
# Install Vercel CLI
npm install -g vercel

# Link project
vercel link

# Configure project
vercel env pull .env.production
```

### 2. Build Configuration
```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "apps/web/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 3. Deploy to Production
```bash
# Deploy to production
vercel --prod

# Or via GitHub integration
git push origin main # Auto-deploys
```

### 4. Configure Domain
```bash
# Add custom domain
vercel domains add app.yourdomain.com

# Configure DNS (add to your DNS provider)
A     @       76.76.21.21
CNAME www     cname.vercel-dns.com
```

## Authentication Setup (Clerk)

### 1. Production Instance
Create production instance in Clerk dashboard:
- Enable email/password authentication
- Configure OAuth providers (Google, GitHub)
- Set up MFA options

### 2. Webhook Configuration
```bash
# Webhook endpoint
https://your-app.vercel.app/api/clerk-webhook

# Events to listen:
- user.created
- user.updated
- user.deleted
- session.created
```

### 3. Security Settings
- Enable bot protection
- Configure session lifetime (7 days recommended)
- Set up allowed domains
- Enable audit logs

## Security Hardening

### 1. API Security
```typescript
// Implement rate limiting
export const createTask = mutation({
  handler: async (ctx, args) => {
    // Check rate limit
    const rateLimitOk = await checkRateLimit(ctx, "createTask", 100) // 100 per hour
    if (!rateLimitOk) throw new Error("Rate limit exceeded")
    
    // Validate input
    validateTaskInput(args)
    
    // Check permissions
    await requireProjectAccess(ctx, args.projectId)
    
    // Create task
    return await ctx.db.insert("tasks", {...})
  }
})
```

### 2. Environment Security
```bash
# Production environment checks
- [ ] All secrets in environment variables
- [ ] No hardcoded credentials
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] CSP headers set
- [ ] Input validation on all endpoints
```

### 3. Data Protection
```typescript
// Implement data encryption for sensitive fields
const encryptedData = await encrypt(sensitiveData)
await ctx.db.insert("sensitive_table", {
  data: encryptedData,
  iv: initVector
})
```

## Performance Optimization

### 1. Frontend Optimization
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', '@radix-ui/react-dialog'],
          'utils': ['date-fns', 'clsx']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

### 2. Image Optimization
```typescript
// Use Vercel Image Optimization
import Image from 'next/image'

<Image
  src="/hero.png"
  alt="Hero"
  width={1200}
  height={600}
  priority
  loading="lazy"
/>
```

### 3. Caching Strategy
```typescript
// Set cache headers
export const config = {
  runtime: 'edge',
  regions: ['iad1'], // Deploy close to users
}

// Cache static assets
app.use('/assets', express.static('public', {
  maxAge: '1y',
  immutable: true
}))
```

## Monitoring and Observability

### 1. Error Tracking (Sentry)
```typescript
// Setup Sentry
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: "production",
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter sensitive data
    return filterSensitiveData(event)
  }
})
```

### 2. Performance Monitoring
```typescript
// Web Vitals tracking
import { getCLS, getFID, getLCP } from 'web-vitals'

function sendToAnalytics(metric) {
  // Send to your analytics endpoint
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id
  })
  
  fetch('/api/analytics', { method: 'POST', body })
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getLCP(sendToAnalytics)
```

### 3. Convex Monitoring
Monitor in Convex dashboard:
- Function execution times
- Database query performance
- Error rates
- Real-time connections

### 4. Custom Metrics
```typescript
// Track business metrics
export const trackMetric = action({
  handler: async (ctx, { name, value, tags }) => {
    await ctx.runMutation(internal.metrics.record, {
      name,
      value,
      tags,
      timestamp: Date.now()
    })
  }
})

// Usage
await trackMetric({
  name: "tasks_created",
  value: 1,
  tags: { project: "web", user: userId }
})
```

## Scaling Considerations

### 1. Database Optimization
```typescript
// Implement pagination
export const getTasks = query({
  handler: async (ctx, { cursor, limit = 50 }) => {
    const tasks = await ctx.db
      .query("tasks")
      .order("desc")
      .paginate({ cursor, limit })
    
    return tasks
  }
})

// Use compound indexes
.index("by_project_status", ["projectId", "status", "createdAt"])
```

### 2. Caching Layer
```typescript
// Implement caching for expensive operations
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const getCachedStats = query({
  handler: async (ctx, { projectId }) => {
    const cached = await ctx.db
      .query("cache")
      .withIndex("by_key", q => q.eq("key", `stats:${projectId}`))
      .first()
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
    
    // Calculate fresh stats
    const stats = await calculateProjectStats(ctx, projectId)
    
    // Cache results
    await ctx.db.insert("cache", {
      key: `stats:${projectId}`,
      data: stats,
      timestamp: Date.now()
    })
    
    return stats
  }
})
```

### 3. CDN Configuration
```javascript
// Configure CDN headers
const cdnHeaders = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'X-Content-Type-Options': 'nosniff'
}
```

## Backup and Disaster Recovery

### 1. Database Backups
Convex automatically handles backups, but implement additional strategies:

```typescript
// Daily export job
export const dailyBackup = scheduledFunction(
  "0 0 * * *", // Daily at midnight
  async (ctx) => {
    const data = await exportAllData(ctx)
    await uploadToS3(data)
    await notifyBackupComplete()
  }
)
```

### 2. Backup Verification
```bash
# Test restore procedure monthly
1. Export production data
2. Import to staging environment
3. Verify data integrity
4. Document any issues
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations tested

### Deployment Steps
1. [ ] Deploy Convex functions
2. [ ] Run database migrations
3. [ ] Deploy frontend to Vercel
4. [ ] Verify health checks
5. [ ] Test critical user flows
6. [ ] Monitor error rates

### Post-Deployment
- [ ] Monitor metrics for 24 hours
- [ ] Check error tracking
- [ ] Verify performance metrics
- [ ] Update status page
- [ ] Notify team

## Rollback Procedures

### Quick Rollback
```bash
# Vercel rollback
vercel rollback

# Convex rollback
npx convex deploy --prod --version previous
```

### Manual Rollback Steps
1. Identify the issue
2. Switch to previous deployment
3. Restore database if needed
4. Notify users if impact
5. Investigate root cause

## Maintenance Mode

### Enable Maintenance
```typescript
// Set in Convex dashboard
MAINTENANCE_MODE=true
MAINTENANCE_MESSAGE="Scheduled maintenance until 2:00 PM UTC"
```

### Maintenance Page
```tsx
// MaintenancePage.tsx
export function MaintenancePage() {
  return (
    <div className="brutal-maintenance">
      <h1>MAINTENANCE IN PROGRESS</h1>
      <p>{process.env.VITE_MAINTENANCE_MESSAGE}</p>
      <div className="brutal-progress">
        ESTIMATED TIME: 30 MINUTES
      </div>
    </div>
  )
}
```

## Cost Optimization

### Vercel
- Use appropriate plan for traffic
- Optimize build times
- Configure edge functions regions
- Monitor bandwidth usage

### Convex
- Optimize query efficiency
- Use appropriate indexes
- Monitor function invocations
- Clean up old data

### Monitoring Costs
```typescript
// Track usage metrics
export const getUsageStats = query({
  handler: async (ctx) => {
    return {
      totalUsers: await ctx.db.query("users").count(),
      totalTasks: await ctx.db.query("tasks").count(),
      activeProjects: await ctx.db.query("projects")
        .filter(q => q.eq(q.field("status"), "active"))
        .count(),
      dailyActiveUsers: await getDailyActiveUsers(ctx)
    }
  }
})
```

## Support and Maintenance

### Health Checks
```typescript
// /api/health endpoint
export async function GET() {
  try {
    // Check Convex connection
    const convexHealth = await checkConvexHealth()
    
    // Check Clerk
    const clerkHealth = await checkClerkHealth()
    
    return Response.json({
      status: 'healthy',
      services: {
        convex: convexHealth,
        clerk: clerkHealth
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 503 })
  }
}
```

### Monitoring Dashboard
Set up monitoring dashboard with:
- Real-time user count
- Error rate graphs
- Performance metrics
- Database statistics
- Cost tracking

## Related Documentation

- [Architecture Overview](../architecture/technical-overview.md) - System design
- [Development Guide](../development/contributing.md) - Development setup
- [Troubleshooting Guide](../guides/troubleshooting.md) - Common issues
- [Security Best Practices](../security/best-practices.md) - Security guide