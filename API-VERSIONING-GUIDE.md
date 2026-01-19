# API Versioning Guide
**Phase 2 - Issue #35: API Version Management**
**Last Updated:** 2026-01-19

---

## 📋 OVERVIEW

The Apex Affinity Group API supports versioning to maintain backwards compatibility while evolving the API.

**Current Version:** v1
**Latest Version:** v1
**Supported Versions:** v1

---

## 🔢 VERSION DETECTION

The API supports three methods for specifying the version:

### 1. URL Path (Recommended)

```
GET /api/v1/agents/me
GET /api/v2/agents/me
```

**Pros:**
- Most explicit
- Cache-friendly
- Easy to test

**Cons:**
- Requires URL changes

### 2. Request Header

```http
GET /api/agents/me
X-API-Version: v1
```

**Pros:**
- URL remains clean
- Easy to set globally in client

**Cons:**
- Less visible
- Harder to test manually

### 3. Query Parameter

```
GET /api/agents/me?api_version=v1
```

**Pros:**
- Easy to test
- No header management needed

**Cons:**
- Clutters URL
- Affects caching

---

## 🚀 VERSION LIFECYCLE

### Stage 1: Development
- Version exists in codebase
- Not publicly documented
- May have breaking changes

### Stage 2: Beta
- Publicly available
- Documented
- May have minor breaking changes
- Feedback encouraged

### Stage 3: Stable
- Production-ready
- Fully documented
- No breaking changes
- Officially supported

### Stage 4: Deprecated
- Still functional
- Not recommended for new projects
- Sunset date announced
- Migration guide provided

### Stage 5: Sunset
- Version removed
- Returns 410 Gone status
- All clients must upgrade

---

## 📝 VERSION MATRIX

| Version | Status | Released | Deprecated | Sunset | Notes |
|---------|--------|----------|------------|---------|-------|
| v1 | Stable | 2026-01-10 | - | - | Current version |
| v2 | Planned | TBD | - | - | Future enhancements |

---

## 🔄 MAKING A VERSIONED REQUEST

### JavaScript/TypeScript

```typescript
// Method 1: URL Path
const response = await fetch('https://api.theapexway.net/api/v1/agents/me', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

// Method 2: Header
const response = await fetch('https://api.theapexway.net/api/agents/me', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'X-API-Version': 'v1'
  }
});

// Method 3: Query Parameter
const response = await fetch('https://api.theapexway.net/api/agents/me?api_version=v1', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

### cURL

```bash
# Method 1: URL Path
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.theapexway.net/api/v1/agents/me

# Method 2: Header
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-API-Version: v1" \
  https://api.theapexway.net/api/agents/me

# Method 3: Query Parameter
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.theapexway.net/api/agents/me?api_version=v1"
```

---

## 📊 VERSION COMPARISON

### v1 (Current)

**Features:**
- Agent management
- Commission tracking
- Wallet operations
- Training progress
- AI Copilot
- SmartOffice sync

**Response Format:**
```json
{
  "data": { ... },
  "pagination": { ... }
}
```

---

## 🔧 IMPLEMENTING NEW VERSIONS

### For Backend Developers

When creating a new API version:

1. **Create version directory:**
   ```
   app/api/v2/agents/route.ts
   ```

2. **Implement version-specific logic:**
   ```typescript
   import { getApiVersion } from '@/lib/middleware/api-version';

   export async function GET(request: NextRequest) {
     const version = getApiVersion(request);

     if (version === 'v2') {
       // v2-specific logic
       return getAgentV2();
     }

     // Default v1 logic
     return getAgentV1();
   }
   ```

3. **Document changes:**
   - Update API documentation
   - Create migration guide
   - Add changelog entry

4. **Test thoroughly:**
   - Test all endpoints in new version
   - Ensure old version still works
   - Verify version detection

---

## 📚 BREAKING CHANGES POLICY

**What constitutes a breaking change:**

- Removing an endpoint
- Removing a field from response
- Changing field type (e.g., string → number)
- Changing required fields
- Changing authentication method
- Changing error response format

**What doesn't require a new version:**

- Adding new endpoints
- Adding new optional fields
- Adding new query parameters
- Fixing bugs
- Improving performance
- Adding new error codes

---

## 🛠️ MIGRATION GUIDE (Future)

When v2 is released, this section will contain:

- List of all breaking changes
- Step-by-step migration instructions
- Code examples (before/after)
- Compatibility shims (if applicable)
- FAQ

---

## 📞 SUPPORT

**Questions about API versions:**
- Email: api-support@theapexway.net
- Documentation: https://docs.theapexway.net/api

**Report version bugs:**
- GitHub Issues: https://github.com/apex/api/issues
- Tag with `api-version` label

---

## 🔔 DEPRECATION PROCESS

When a version is deprecated:

1. **Announce deprecation** (6 months notice minimum)
   - Email all registered developers
   - Add deprecation header to responses
   - Update documentation

2. **Provide migration period** (6 months)
   - Both old and new versions supported
   - Migration guide available
   - Support for questions

3. **Sunset warning** (1 month before sunset)
   - Final reminder to all developers
   - Return 410 status for deprecated endpoints
   - Log deprecation warnings

4. **Sunset** (After 12+ months total)
   - Remove deprecated version
   - Return 410 Gone status
   - Redirect to latest version docs

---

**Version:** 1.0
**Last Updated:** 2026-01-19
**Maintained By:** API Team
