# BYOK (Bring Your Own Key) System Test Plan

## Overview
Test plan for the AI features BYOK system implementation in LTF1.

## Test Scenarios

### 1. First-Time User Onboarding
- [ ] New user sees AI setup modal during onboarding
- [ ] Can choose between:
  - [ ] Free credits (100/month)
  - [ ] BYOK (own Gemini API key)
  - [ ] Skip (if not first-time user)
- [ ] Free credits activation creates database record
- [ ] BYOK option validates key before saving
- [ ] Skip option closes modal without setup

### 2. API Key Validation
- [ ] Invalid API key shows error message
- [ ] Valid API key is accepted and encrypted
- [ ] Validation loading state displays correctly
- [ ] Network errors handled gracefully

### 3. Settings Page - AI Tab
- [ ] AI tab appears in settings navigation
- [ ] Shows current status:
  - [ ] Not configured
  - [ ] Free tier with credits remaining
  - [ ] BYOK active
  - [ ] Pro/Enterprise tier
- [ ] Displays usage statistics:
  - [ ] Credits remaining
  - [ ] Monthly usage
  - [ ] Total requests
- [ ] Monthly stats show:
  - [ ] Total/successful requests
  - [ ] Tokens used
  - [ ] Average response time
  - [ ] Usage by feature type

### 4. API Key Management
- [ ] Can add API key from Settings
- [ ] Shows/hides API key input with eye icon
- [ ] Validates key before saving
- [ ] Can remove existing API key
- [ ] Removal confirmation modal works
- [ ] After removal, switches back to credits

### 5. Credit System
- [ ] Free tier users get 100 credits/month
- [ ] Credits deduct correctly per request:
  - [ ] Simple operations: 1 credit
  - [ ] Moderate operations: 2 credits
  - [ ] Complex operations: 5 credits
  - [ ] Analysis operations: 10 credits
- [ ] Rate limiting for free tier (10 requests/hour)
- [ ] Credits reset monthly
- [ ] Shows warning when credits low

### 6. AI Service Integration
- [ ] EnhancedGeminiService initializes correctly
- [ ] Detects key type (user/platform/free)
- [ ] BYOK users have no credit limits
- [ ] Free users consume credits
- [ ] Tracks usage in database
- [ ] Falls back gracefully on errors

### 7. Usage Tracking
- [ ] All AI requests logged to aiUsageLogs
- [ ] Tracks:
  - [ ] Request type
  - [ ] Model used
  - [ ] Token counts
  - [ ] Credits consumed
  - [ ] Success/failure
  - [ ] Response time
- [ ] Monthly stats aggregate correctly

### 8. Pricing Tiers Display
- [ ] Shows all available tiers (free/pro/enterprise)
- [ ] Highlights current tier
- [ ] Displays features for each tier
- [ ] Shows rate limits correctly

### 9. Error Handling
- [ ] Invalid API key error message clear
- [ ] Network failures handled gracefully
- [ ] Insufficient credits message informative
- [ ] Rate limit exceeded message helpful
- [ ] Database errors don't crash app

### 10. Security
- [ ] API keys encrypted before storage
- [ ] Keys never exposed in frontend
- [ ] Keys not logged or sent to analytics
- [ ] Secure transmission to backend

## Test Data

### Valid Test API Key
- Get from: https://aistudio.google.com/apikey
- Format: AIza...

### Invalid Test API Keys
- `invalid-key-123`
- `AIza` (too short)
- Empty string

## Database Verification

### Tables to Check
1. **userAICredits**
   - userId matches authenticated user
   - Credits update correctly
   - hasOwnKey flag accurate
   - encryptedApiKey stored securely

2. **aiUsageLogs**
   - Logs created for each request
   - Timestamps accurate
   - Token counts reasonable
   - Credits deducted match costs

3. **aiPricingTiers**
   - Default tiers populated if empty
   - Features array populated
   - Rate limits defined

## Testing Steps

### Step 1: Fresh User Setup
1. Create new user account
2. Verify onboarding modal appears
3. Test each setup option
4. Verify database records created

### Step 2: API Key Flow
1. Navigate to Settings > AI
2. Add valid API key
3. Verify validation succeeds
4. Check encryption in database
5. Remove key and verify cleanup

### Step 3: Credit Usage
1. Activate free credits
2. Make AI request (e.g., generate task title)
3. Verify credits deducted
4. Check usage logs created
5. Test rate limiting

### Step 4: Monthly Reset
1. Set test user's lastResetDate to >30 days ago
2. Trigger reset (or wait for cron)
3. Verify credits reset to tier amount
4. Check monthlyCreditsUsed reset to 0

### Step 5: Error Scenarios
1. Test with invalid API key
2. Test with exhausted credits
3. Test with rate limit exceeded
4. Test with network offline

## Expected Results

- ✅ New users can easily set up AI features
- ✅ BYOK users have unlimited usage with own key
- ✅ Free users have controlled access with credits
- ✅ Usage tracked accurately for billing
- ✅ Settings page provides full control
- ✅ Errors handled gracefully
- ✅ Security maintained throughout

## Notes

- Test in both development and production environments
- Verify Convex functions deploy correctly
- Check that environment variables are set
- Monitor for console errors during testing
- Test with multiple user accounts