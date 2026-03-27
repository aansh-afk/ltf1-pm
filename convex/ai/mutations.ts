// AI Mutations for LTF1
// Handles all AI-related database operations

import { v } from "convex/values";
import { mutation } from "../_generated/server";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { api } from "../_generated/api";

// Track AI session (store AI interaction for analytics)
export const trackAISession = mutation({
  args: {
    type: v.string(),
    input: v.string(),
    output: v.string(),
    model: v.union(
      v.literal("gemini-2.5-flash"),
      v.literal("gemini-2.5-flash-lite"),
      v.literal("gpt-oss-120b"),
      v.literal("gpt-oss-20b"),
    ),
    tokens: v.object({
      input: v.number(),
      output: v.number(),
      total: v.number(),
    }),
    cost: v.number(),
    latency: v.number(),
    cached: v.boolean(),
  },
  handler: async (ctx, args) => {
    // @ts-ignore — deep type instantiation
    const user: any = await ctx.runQuery(api.auth.users.getCurrentUser, {});
    if (!user) throw new Error("Not authenticated");

    // Get user's active workspace
    const workspaceMember: any = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!workspaceMember) {
      throw new Error("No workspace found");
    }

    return await ctx.db.insert("aiSessions", {
      userId: user._id,
      workspaceId: workspaceMember.workspaceId,
      type: args.type,
      input: args.input,
      output: args.output,
      model: args.model,
      tokens: args.tokens,
      cost: args.cost,
      latency: args.latency,
      cached: args.cached,
      createdAt: Date.now(),
    });
  },
});

// Add feedback to AI session
export const addAIFeedback = mutation({
  args: {
    sessionId: v.id("aiSessions"),
    helpful: v.boolean(),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // @ts-ignore — deep type instantiation
    const user: any = await ctx.runQuery(api.auth.users.getCurrentUser, {});
    if (!user) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found or unauthorized");
    }

    await ctx.db.patch(args.sessionId, {
      feedback: {
        helpful: args.helpful,
        rating: args.rating,
        comment: args.comment,
      },
    });
  },
});

// Create AI insight
export const createAIInsight = mutation({
  args: {
    targetType: v.union(
      v.literal("task"),
      v.literal("sprint"),
      v.literal("project"),
      v.literal("team"),
      v.literal("user"),
    ),
    targetId: v.string(),
    insightType: v.union(
      v.literal("risk"),
      v.literal("recommendation"),
      v.literal("opportunity"),
      v.literal("anomaly"),
      v.literal("prediction"),
    ),
    severity: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
    ),
    title: v.string(),
    description: v.string(),
    recommendations: v.array(v.string()),
    dedupeKey: v.optional(v.string()),
    metadata: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // @ts-ignore — deep type instantiation
    const user: any = await ctx.runQuery(api.auth.users.getCurrentUser, {});
    if (!user) throw new Error("Not authenticated");

    // Get user's active workspace
    const workspaceMember: any = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!workspaceMember) {
      throw new Error("No workspace found");
    }

    const normalizedMetadata = args.dedupeKey
      ? {
          ...(args.metadata && typeof args.metadata === "object"
            ? args.metadata
            : {}),
          dedupeKey: args.dedupeKey,
        }
      : (args.metadata ?? null);

    if (args.dedupeKey) {
      const existingInsights = await ctx.db
        .query("aiInsights")
        .withIndex("by_workspace_and_target_and_insight_type", (q) =>
          q
            .eq("workspaceId", workspaceMember.workspaceId)
            .eq("targetType", args.targetType)
            .eq("targetId", args.targetId)
            .eq("insightType", args.insightType),
        )
        .collect();

      const existingInsight = existingInsights.find(
        (insight) =>
          !insight.dismissed &&
          insight.metadata &&
          typeof insight.metadata === "object" &&
          (insight.metadata as any).dedupeKey === args.dedupeKey,
      );

      if (existingInsight) {
        await ctx.db.patch(existingInsight._id, {
          severity: args.severity,
          title: args.title,
          description: args.description,
          recommendations: args.recommendations,
          metadata: normalizedMetadata,
          expiresAt: args.expiresAt,
          createdAt: Date.now(),
          dismissed: false,
        });
        return existingInsight._id;
      }
    }

    return await ctx.db.insert("aiInsights", {
      workspaceId: workspaceMember.workspaceId,
      targetType: args.targetType,
      targetId: args.targetId,
      insightType: args.insightType,
      severity: args.severity,
      title: args.title,
      description: args.description,
      recommendations: args.recommendations,
      metadata: normalizedMetadata,
      dismissed: false,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
  },
});

// Dismiss AI insight
export const dismissAIInsight = mutation({
  args: {
    insightId: v.id("aiInsights"),
    actionTaken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // @ts-ignore — deep type instantiation
    const user: any = await ctx.runQuery(api.auth.users.getCurrentUser, {});
    if (!user) throw new Error("Not authenticated");

    const insight = await ctx.db.get(args.insightId);
    if (!insight) {
      throw new Error("Insight not found");
    }

    // Verify user has access to this workspace
    const workspaceMember: any = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", insight.workspaceId).eq("userId", user._id),
      )
      .first();

    if (!workspaceMember) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.insightId, {
      dismissed: true,
      actionTaken: args.actionTaken,
    });
  },
});

// Create AI task suggestion
export const createAITaskSuggestion = mutation({
  args: {
    sourceType: v.union(
      v.literal("commit"),
      v.literal("pr"),
      v.literal("comment"),
      v.literal("manual"),
    ),
    sourceData: v.any(),
    suggestedTasks: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        type: v.string(),
        priority: v.string(),
        estimate: v.optional(v.number()),
        confidence: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // @ts-ignore — deep type instantiation
    const user: any = await ctx.runQuery(api.auth.users.getCurrentUser, {});
    if (!user) throw new Error("Not authenticated");

    // Get user's active workspace
    const workspaceMember: any = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!workspaceMember) {
      throw new Error("No workspace found");
    }

    return await ctx.db.insert("aiTasks", {
      workspaceId: workspaceMember.workspaceId,
      userId: user._id,
      sourceType: args.sourceType,
      sourceData: args.sourceData,
      suggestedTasks: args.suggestedTasks,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Accept or reject AI task suggestion
export const updateAITaskStatus = mutation({
  args: {
    taskId: v.id("aiTasks"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    // @ts-ignore — deep type instantiation
    const user: any = await ctx.runQuery(api.auth.users.getCurrentUser, {});
    if (!user) throw new Error("Not authenticated");

    const aiTask = await ctx.db.get(args.taskId);
    if (!aiTask || aiTask.userId !== user._id) {
      throw new Error("Task not found or unauthorized");
    }

    await ctx.db.patch(args.taskId, {
      status: args.status,
      processedAt: Date.now(),
    });
  },
});

// Generate AI documentation
export const generateDocumentation = mutation({
  args: {
    type: v.string(),
    context: v.object({
      projectName: v.string(),
      projectDescription: v.optional(v.string()),
      additionalContext: v.optional(v.string()),
    }),
  },
  returns: v.object({
    title: v.string(),
    content: v.string(),
  }),
  handler: async (ctx, args) => {
    const { type, context } = args;

    // Generate appropriate documentation based on type
    let title = "";
    let content = "";

    switch (type) {
      case "pr":
        title = `Pull Request: ${context.projectName}`;
        content = `## Summary
Brief description of changes in this pull request for ${context.projectName}.

## Changes Made
- Feature: Added new functionality
- Fix: Resolved existing issues
- Refactor: Improved code structure

## Testing
- Unit tests added/updated
- Manual testing completed
- All tests passing

## Screenshots
[Add relevant screenshots if UI changes]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console errors or warnings

## Related Issues
Closes #[issue_number]

## Additional Notes
${context.additionalContext || "No additional notes"}
`;
        break;

      case "prd":
        title = `Product Requirements: ${context.projectName}`;
        content = `# Product Requirements Document
## ${context.projectName}

### Executive Summary
${context.projectDescription || "Project description and goals."}

### Problem Statement
Clear description of the problem this product solves.

### Goals and Objectives
1. Primary Goal: Main objective
2. Secondary Goals: Supporting objectives
3. Success Metrics: How we measure success

### User Stories
**As a** [user type]
**I want to** [action]
**So that** [benefit]

### Functional Requirements
1. **Core Features**
   - Feature 1: Description
   - Feature 2: Description
   - Feature 3: Description

2. **User Interface**
   - UI requirement 1
   - UI requirement 2

3. **Performance**
   - Load time requirements
   - Scalability needs

### Non-Functional Requirements
- Security requirements
- Compliance needs
- Accessibility standards
- Browser compatibility

### Technical Architecture
- Frontend: Technology stack
- Backend: API design
- Database: Data structure
- Infrastructure: Deployment strategy

### Timeline and Milestones
- Phase 1: Initial development
- Phase 2: Beta testing
- Phase 3: Production release

### Risks and Mitigation
| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| Technical debt | High | Regular refactoring |
| Scope creep | Medium | Clear requirements |

### Success Criteria
- User adoption targets
- Performance benchmarks
- Quality metrics

${context.additionalContext ? `\n### Additional Context\n${context.additionalContext}` : ""}`;
        break;

      case "api":
        title = `API Documentation: ${context.projectName}`;
        content = `# API Documentation
## ${context.projectName} API

### Base URL
\`\`\`
https://api.example.com/v1
\`\`\`

### Authentication
All API requests require authentication using Bearer tokens:
\`\`\`
Authorization: Bearer <token>
\`\`\`

### Endpoints

#### GET /resource
Retrieve list of resources

**Request:**
\`\`\`http
GET /resource?page=1&limit=10
\`\`\`

**Response:**
\`\`\`json
{
  "data": [
    {
      "id": "123",
      "name": "Resource Name",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
\`\`\`

#### POST /resource
Create new resource

**Request:**
\`\`\`json
{
  "name": "New Resource",
  "description": "Resource description"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "124",
  "name": "New Resource",
  "description": "Resource description",
  "created_at": "2024-01-01T00:00:00Z"
}
\`\`\`

### Error Handling
| Code | Description |
|------|------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

### Rate Limiting
- 1000 requests per hour per API key
- Rate limit headers included in response

${context.additionalContext ? `\n### Additional Notes\n${context.additionalContext}` : ""}`;
        break;

      case "readme":
        title = `README: ${context.projectName}`;
        content = `# ${context.projectName}

${context.projectDescription || "A brief description of what this project does and who it's for"}

## Features
- ✨ Feature 1: Description
- 🚀 Feature 2: Description
- 💡 Feature 3: Description
- 🔧 Feature 4: Description

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Setup
\`\`\`bash
# Clone the repository
git clone https://github.com/username/${context.projectName.toLowerCase().replace(/\s+/g, "-")}.git

# Navigate to project directory
cd ${context.projectName.toLowerCase().replace(/\s+/g, "-")}

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run development server
npm run dev
\`\`\`

## Usage
\`\`\`javascript
import { Component } from '${context.projectName.toLowerCase().replace(/\s+/g, "-")}'

// Example usage
const example = new Component({
  option1: 'value1',
  option2: 'value2'
})
\`\`\`

## Development

### Available Scripts
- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run test\` - Run tests
- \`npm run lint\` - Run linter

### Project Structure
\`\`\`
${context.projectName.toLowerCase().replace(/\s+/g, "-")}/
├── src/
│   ├── components/
│   ├── utils/
│   └── index.js
├── tests/
├── docs/
└── package.json
\`\`\`

## Contributing
1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
Project Link: [https://github.com/username/${context.projectName.toLowerCase().replace(/\s+/g, "-")}](https://github.com/username/${context.projectName.toLowerCase().replace(/\s+/g, "-")})

${context.additionalContext ? `\n## Additional Information\n${context.additionalContext}` : ""}`;
        break;

      case "tech-spec":
        title = `Technical Specification: ${context.projectName}`;
        content = `# Technical Specification
## ${context.projectName}

### Overview
${context.projectDescription || "Technical overview of the system architecture and implementation details."}

### System Architecture

#### High-Level Architecture
\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   Database  │
│   (React)   │     │   (Node.js) │     │ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
\`\`\`

### Technology Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, GraphQL
- **Database:** PostgreSQL, Redis
- **Infrastructure:** Docker, Kubernetes, AWS

### Data Models

#### User Model
\`\`\`typescript
interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}
\`\`\`

#### Resource Model
\`\`\`typescript
interface Resource {
  id: string
  userId: string
  name: string
  data: JsonObject
  status: ResourceStatus
  createdAt: Date
  updatedAt: Date
}
\`\`\`

### API Design

#### GraphQL Schema
\`\`\`graphql
type Query {
  user(id: ID!): User
  users(filter: UserFilter): [User!]!
  resource(id: ID!): Resource
  resources(filter: ResourceFilter): [Resource!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}
\`\`\`

### Security Considerations
- Authentication: JWT tokens with refresh mechanism
- Authorization: Role-based access control (RBAC)
- Data encryption: AES-256 for sensitive data
- API security: Rate limiting, CORS, input validation

### Performance Requirements
- Response time: < 200ms for API calls
- Throughput: 1000 requests/second
- Availability: 99.9% uptime
- Data retention: 90 days for logs

### Deployment Strategy
1. **Development:** Local Docker environment
2. **Staging:** Kubernetes cluster with auto-scaling
3. **Production:** Multi-region deployment with load balancing

### Testing Strategy
- Unit tests: 80% code coverage minimum
- Integration tests: API endpoint testing
- E2E tests: Critical user flows
- Performance tests: Load and stress testing

### Monitoring and Logging
- Application monitoring: Datadog
- Error tracking: Sentry
- Logging: ELK stack (Elasticsearch, Logstash, Kibana)
- Metrics: Prometheus and Grafana

${context.additionalContext ? `\n### Additional Technical Details\n${context.additionalContext}` : ""}`;
        break;

      case "release-notes":
        title = `Release Notes: ${context.projectName} v1.0.0`;
        content = `# Release Notes
## ${context.projectName} - Version 1.0.0
### Release Date: ${new Date().toLocaleDateString()}

---

### 🎉 New Features
- **Feature Name**: Description of the new feature and its benefits
- **Enhanced UI**: Improved user interface with modern design
- **API Integration**: Added support for third-party integrations
- **Performance**: Optimized loading times by 50%

### 🐛 Bug Fixes
- Fixed issue where users couldn't save preferences
- Resolved memory leak in data processing module
- Corrected timezone handling for international users
- Fixed layout issues on mobile devices

### 💡 Improvements
- Improved error messages for better user guidance
- Enhanced search functionality with filters
- Optimized database queries for faster response
- Updated documentation with new examples

### ⚠️ Breaking Changes
- API endpoint \`/v1/old-endpoint\` deprecated, use \`/v2/new-endpoint\`
- Configuration file format changed from JSON to YAML
- Minimum Node.js version updated to 18.0.0

### 📦 Dependencies
- Updated React to v18.2.0
- Updated TypeScript to v5.0.0
- Added new dependency: chart.js v4.0.0
- Removed deprecated package: old-validator

### 🔧 Known Issues
- Minor UI glitch in Safari browser (fix coming in v1.0.1)
- Performance degradation with datasets > 10,000 items

### 📝 Migration Guide
For users upgrading from v0.9.x:
1. Update configuration files to new format
2. Run migration script: \`npm run migrate\`
3. Update API calls to new endpoints
4. Clear browser cache

### 👥 Contributors
Special thanks to all contributors who made this release possible!

### 📚 Documentation
Full documentation available at: https://docs.example.com

${context.additionalContext ? `\n### Additional Release Information\n${context.additionalContext}` : ""}}`;
        break;

      default:
        title = `Documentation: ${context.projectName}`;
        content = `# ${context.projectName}

## Overview
${context.projectDescription || "Project documentation"}

## Details
${context.additionalContext || "Add your documentation content here..."}

## Summary
Documentation generated for ${context.projectName}.`;
    }

    return { title, content };
  },
});
