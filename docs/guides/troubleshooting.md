# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with LTF1. If your issue isn't covered here, please check our GitHub issues or contact support.

## Quick Diagnostics

### System Health Check
```bash
# Run diagnostics
ltf1 doctor

# Check all connections
ltf1 doctor --full

# Expected output:
✓ Convex connection: OK
✓ Authentication: OK
✓ Database access: OK
✓ WebSocket connection: OK
✓ Browser compatibility: OK
```

### Browser Console Check
Press F12 and check for:
- Red error messages
- Network failures (Network tab)
- WebSocket connection status
- Console warnings

## Common Issues

### Authentication Issues

#### "Unauthorized" Error
**Symptoms:**
- Can't log in
- Getting logged out randomly
- "Unauthorized" error messages

**Solutions:**
1. Clear browser cookies and cache
   ```bash
   # Or in browser
   Ctrl+Shift+Delete → Clear cookies and cache
   ```

2. Check Clerk configuration
   ```bash
   # Verify environment variables
   echo $VITE_CLERK_PUBLISHABLE_KEY
   ```

3. Re-authenticate
   ```bash
   ltf1 auth logout
   ltf1 auth login
   ```

4. Check browser extensions
   - Disable ad blockers
   - Disable privacy extensions
   - Try incognito mode

#### "User Not Found in Database"
**Symptoms:**
- Login succeeds but app shows error
- Profile page fails to load

**Solutions:**
1. Trigger user sync
   ```typescript
   // Run in Convex dashboard console
   await ctx.runMutation(internal.users.syncClerkUser, {
     clerkId: "user_xxx"
   })
   ```

2. Check webhook configuration
   - Verify Clerk webhook is set up
   - Check webhook secret matches
   - Review webhook logs in Clerk dashboard

### Connection Issues

#### "Convex Connection Failed"
**Symptoms:**
- App shows "Offline" or "Disconnected"
- Data doesn't update in real-time
- Queries return undefined

**Solutions:**
1. Check Convex URL
   ```bash
   # Verify correct URL
   grep VITE_CONVEX_URL .env
   ```

2. Test connection
   ```javascript
   // Browser console
   console.log(window.__convexClient?.connectionState())
   ```

3. Check network
   - Verify internet connection
   - Check firewall settings
   - Try different network
   - Disable VPN

4. Restart Convex dev server
   ```bash
   # Kill existing process
   pkill -f "convex dev"
   
   # Restart
   npx convex dev
   ```

#### WebSocket Connection Issues
**Symptoms:**
- Real-time updates not working
- "WebSocket connection failed" in console
- Presence indicators not updating

**Solutions:**
1. Check WebSocket support
   ```javascript
   // Browser console
   console.log('WebSocket' in window)
   ```

2. Check proxy settings
   - Corporate proxies may block WebSocket
   - Try direct connection
   - Configure proxy to allow WSS

3. Use polling fallback
   ```typescript
   // In convex client setup
   const client = new ConvexClient(url, {
     webSocketImpl: window.WebSocket,
     skipWebSocketConnection: true // Forces HTTP polling
   })
   ```

### Data Issues

#### Tasks Not Showing
**Symptoms:**
- Task list is empty
- Filters not working
- Search returns no results

**Solutions:**
1. Check filters
   ```typescript
   // Reset all filters
   setFilters({})
   ```

2. Verify project selection
   ```bash
   ltf1 project current
   ltf1 project use WEB
   ```

3. Check permissions
   - Verify you're a project member
   - Check workspace membership
   - Review role permissions

4. Debug query
   ```javascript
   // Browser console
   const tasks = await convexClient.query(
     api.tasks.queries.getProjectTasks,
     { projectId: "project_xxx" }
   )
   console.log(tasks)
   ```

#### Data Not Updating
**Symptoms:**
- Changes don't appear immediately
- Other users don't see updates
- Stale data showing

**Solutions:**
1. Check optimistic updates
   ```typescript
   // Ensure optimistic updates are working
   const updateTask = useMutation(api.tasks.update)
     .withOptimisticUpdate((store, args) => {
       // Update logic
     })
   ```

2. Force refresh
   ```javascript
   // Browser console
   window.location.reload(true)
   ```

3. Clear Convex cache
   ```typescript
   // In app
   convexClient.clearCache()
   ```

### UI/Display Issues

#### Styling Broken
**Symptoms:**
- Layout looks wrong
- Colors incorrect
- Brutalist design not applying

**Solutions:**
1. Check CSS loading
   ```bash
   # Rebuild CSS
   pnpm build:css
   ```

2. Verify Tailwind config
   ```javascript
   // Check tailwind.config.js includes all paths
   content: [
     "./index.html",
     "./src/**/*.{js,ts,jsx,tsx}",
   ]
   ```

3. Clear browser cache
   - Hard refresh: Ctrl+Shift+R
   - Clear site data in DevTools

#### Components Not Rendering
**Symptoms:**
- Blank pages
- Missing sections
- React errors in console

**Solutions:**
1. Check React errors
   ```javascript
   // Enable React error boundaries
   <ErrorBoundary fallback={<ErrorFallback />}>
     <App />
   </ErrorBoundary>
   ```

2. Verify imports
   ```typescript
   // Check all imports resolve
   import { TaskCard } from '@/components/TaskCard'
   ```

3. Check React versions
   ```bash
   npm ls react react-dom
   # Ensure matching versions
   ```

### Performance Issues

#### Slow Loading
**Symptoms:**
- Long initial load time
- Sluggish interactions
- High memory usage

**Solutions:**
1. Check bundle size
   ```bash
   # Analyze bundle
   pnpm analyze
   ```

2. Enable production mode
   ```bash
   # For development
   NODE_ENV=production pnpm build
   ```

3. Optimize queries
   ```typescript
   // Use pagination
   const tasks = useQuery(api.tasks.getProjectTasks, {
     projectId,
     limit: 50,
     offset: page * 50
   })
   ```

4. Check browser performance
   - Open DevTools → Performance
   - Record interaction
   - Look for long tasks

#### Memory Leaks
**Symptoms:**
- Browser becomes slow over time
- Memory usage keeps increasing
- Page crashes after extended use

**Solutions:**
1. Clean up subscriptions
   ```typescript
   useEffect(() => {
     const subscription = subscribe()
     return () => subscription.unsubscribe()
   }, [])
   ```

2. Check infinite loops
   ```typescript
   // Ensure dependency arrays are correct
   useEffect(() => {
     // Effect logic
   }, [properDependencies])
   ```

3. Monitor memory
   - DevTools → Memory → Take snapshot
   - Compare snapshots over time
   - Look for detached DOM nodes

### Development Issues

#### Build Failures
**Symptoms:**
- `pnpm build` fails
- TypeScript errors
- Module not found errors

**Solutions:**
1. Clean install
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

2. Check TypeScript
   ```bash
   pnpm typecheck
   ```

3. Update dependencies
   ```bash
   pnpm update --interactive
   ```

#### Hot Reload Not Working
**Symptoms:**
- Changes don't appear without refresh
- Vite not detecting file changes
- HMR connection failed

**Solutions:**
1. Check Vite config
   ```typescript
   // vite.config.ts
   server: {
     hmr: {
       overlay: true
     }
   }
   ```

2. File watching limits
   ```bash
   # Linux/Mac - increase watchers
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

### CLI Issues

#### Command Not Found
**Symptoms:**
- `ltf1: command not found`
- CLI not recognized

**Solutions:**
1. Check installation
   ```bash
   npm list -g @ltf1/cli
   ```

2. Add to PATH
   ```bash
   export PATH="$PATH:$(npm prefix -g)/bin"
   ```

3. Use npx
   ```bash
   npx @ltf1/cli task list
   ```

#### CLI Authentication Failed
**Symptoms:**
- CLI commands return unauthorized
- Can't connect to workspace

**Solutions:**
1. Re-authenticate
   ```bash
   ltf1 auth logout
   ltf1 auth login
   ```

2. Check config
   ```bash
   ltf1 config show
   cat ~/.ltf1/config.json
   ```

## Error Messages

### Common Error Codes

#### `CONVEX_ERROR: Function not found`
**Cause:** Function doesn't exist or not deployed
**Solution:** 
```bash
npx convex deploy
```

#### `CLERK_ERROR: Invalid token`
**Cause:** Authentication token expired
**Solution:** Re-login or refresh token

#### `WORKSPACE_NOT_FOUND`
**Cause:** Workspace doesn't exist or no access
**Solution:** Check workspace slug and permissions

#### `RATE_LIMIT_EXCEEDED`
**Cause:** Too many requests
**Solution:** Wait and retry, implement backoff

## Debug Mode

### Enable Debug Logging

#### Browser
```javascript
// Enable in console
localStorage.setItem('DEBUG', 'ltf1:*')

// Or specific modules
localStorage.setItem('DEBUG', 'ltf1:convex,ltf1:auth')
```

#### CLI
```bash
# Enable debug output
export LTF1_DEBUG=1
ltf1 task list

# Verbose mode
ltf1 task list -vvv
```

#### Application
```typescript
// Add to .env
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### Debug Information to Collect

When reporting issues, include:
1. Error message and stack trace
2. Browser console output
3. Network tab screenshots
4. Steps to reproduce
5. Environment details:
   ```bash
   ltf1 doctor --info > debug-info.txt
   ```

## Recovery Procedures

### Reset Local State
```bash
# Clear all local data
localStorage.clear()
sessionStorage.clear()

# Clear IndexedDB
indexedDB.deleteDatabase('convex-offline')
```

### Reset User Data
```typescript
// Reset user preferences
await resetUserPreferences()

// Reset workspace settings
await resetWorkspaceSettings(workspaceId)
```

### Emergency Rollback
```bash
# Frontend rollback
vercel rollback

# Backend rollback
npx convex deploy --prod --version <previous-version>
```

## Getting Help

### Self-Service Resources
1. Check this troubleshooting guide
2. Search [GitHub Issues](https://github.com/ltf1/pm/issues)
3. Review [API Documentation](../api/convex-functions.md)
4. Read [Development Guide](../development/contributing.md)

### Community Support
- GitHub Discussions
- Discord community
- Stack Overflow tag: `ltf1`

### Report an Issue
```bash
# Collect debug info
ltf1 doctor --report > issue-report.txt

# Create issue at
https://github.com/ltf1/pm/issues/new
```

Include:
- Issue description
- Steps to reproduce
- Expected vs actual behavior
- Debug information
- Screenshots if UI issue

## Related Documentation

- [Getting Started](./getting-started.md) - Initial setup
- [Development Guide](../development/contributing.md) - Development setup
- [Deployment Guide](../deployment/production-guide.md) - Production issues
- [API Documentation](../api/convex-functions.md) - API reference