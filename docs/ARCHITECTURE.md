# Architecture Overview

## Directory Structure

```
src/
├── app/api/ai/           # AI endpoint routes (business logic)
├── lib/ai/               # AI utility functions (reusable, stateless)
├── lib/api/              # API utility functions (validation, errors)
├── types/                # TypeScript type definitions
└── components/          # React components
```

## Design Principles

- **Black Box Architecture**: Each module has clear interface, hidden implementation
- **Small Utilities Over Large Services**: Prefer focused functions to heavyweight classes
- **Type Safety**: No `any` types, comprehensive interfaces
- **Testability**: Pure functions, no side effects where possible

## AI Route Pattern

1. **Validate input** using `src/lib/api/validation.ts`
2. **Build request** using `src/lib/ai/openrouter-utils.ts`
3. **Stream response** using `src/lib/ai/streaming-utils.ts`
4. **Business logic** (prompts, post-processing) stays in route

## Utility Functions

### Streaming Utilities (`src/lib/ai/streaming-utils.ts`)

Pure functions for Server-Sent Events:

- `createSSEEncoder()` - Creates TextEncoder for streaming
- `sendSSEEvent()` - Sends formatted SSE events
- `parseStreamBuffer()` - Parses stream chunks into events
- `createStreamResponse()` - Creates SSE Response with headers

### OpenRouter Utilities (`src/lib/ai/openrouter-utils.ts`)

Functions for OpenRouter API integration:

- `getOpenRouterHeaders()` - Standard headers for API requests
- `buildBaseRequest()` - Builds request payload with defaults
- `fetchOpenRouter()` - Makes API calls with error handling
- `getStandardModelCatalog()` - Returns available AI models

### Validation Utilities (`src/lib/api/validation.ts`)

Input validation and sanitization:

- `validateIngredients()` - Validates ingredient arrays
- `validateApiKey()` - Checks API key configuration
- `sanitizeInput()` - Cleans string inputs
- `validateNonEmptyString()` - Ensures non-empty strings

## Type Definitions (`src/types/api.ts`)

Comprehensive TypeScript interfaces:

- `IngredientInput` - Validated ingredient structure
- `OpenRouterMessage` - AI conversation messages
- `SSEEvent` - Server-Sent Events structure
- `ModelConfig` - AI model configuration
- `ValidationResult<T>` - Generic validation result
- `ApiKeyValidation` - API key validation result

## When to Extract Code

### ✅ Extract When:
- Identical boilerplate across 3+ files
- Pure utility functions with no state
- Common patterns (validation, formatting, API calls)
- Reusable business logic

### ❌ Don't Extract When:
- Business logic specific to one route
- Configuration that varies per route
- Complex stateful operations
- One-off implementations

## Refactoring Guidelines

### Before Refactoring:
1. Identify duplicated code patterns
2. Check if extraction improves maintainability
3. Ensure utilities are stateless and pure
4. Plan clear interfaces

### During Refactoring:
1. Create utility functions first
2. Add comprehensive JSDoc documentation
3. Update imports in target files
4. Test each change incrementally
5. Maintain exact same API contracts

### After Refactoring:
1. Verify no breaking changes
2. Check for linting errors
3. Test API endpoints manually
4. Update documentation

## Code Quality Standards

### TypeScript
- No `any` types allowed
- Comprehensive interface definitions
- Strict type checking enabled
- Proper error handling

### Documentation
- JSDoc comments on all public functions
- Clear parameter descriptions
- Usage examples where helpful
- Architecture decisions documented

### Testing
- Pure functions are easily testable
- Mock external dependencies
- Test error conditions
- Validate input/output contracts

## Performance Considerations

### Streaming
- Use ReadableStream for large responses
- Implement proper backpressure
- Handle connection drops gracefully
- Buffer management for partial chunks

### API Calls
- Parallel model requests where possible
- Proper error handling and timeouts
- Rate limiting considerations
- Response size optimization

## Security

### Input Validation
- Sanitize all user inputs
- Validate API keys and tokens
- Check request payloads
- Prevent injection attacks

### API Security
- Secure API key storage
- Proper CORS configuration
- Rate limiting implementation
- Error message sanitization

## Future Improvements

### Testing Infrastructure
- Unit tests for utility functions
- Integration tests for API routes
- Mock external dependencies
- Automated test coverage

### Monitoring
- API response time tracking
- Error rate monitoring
- Usage analytics
- Performance metrics

### Scalability
- Caching strategies
- Database optimization
- CDN integration
- Load balancing

## Migration Guide

### From Old Pattern to New Pattern

**Before:**
```typescript
// Duplicated in every route
const encoder = new TextEncoder()
const response = await fetch(url, { headers, body })
const events = buffer.split('\n\n')
```

**After:**
```typescript
// Reusable utilities
import { createSSEEncoder, fetchOpenRouter, parseStreamBuffer } from '@/lib/ai/...'
const encoder = createSSEEncoder()
const response = await fetchOpenRouter(payload, apiKey)
const { events } = parseStreamBuffer(buffer)
```

### Benefits
- **DRY Principle**: No code duplication
- **Type Safety**: Comprehensive interfaces
- **Maintainability**: Centralized logic
- **Testability**: Pure functions
- **Documentation**: Clear APIs

## Troubleshooting

### Common Issues
1. **Import errors**: Check file paths and exports
2. **Type errors**: Verify interface definitions
3. **Runtime errors**: Check function parameters
4. **Build failures**: Run `npm run build` to validate

### Debugging
1. Check console for error messages
2. Verify API key configuration
3. Test utility functions in isolation
4. Check network requests in dev tools

## Contributing

### Adding New Utilities
1. Create focused, single-purpose functions
2. Add comprehensive JSDoc documentation
3. Include usage examples
4. Update type definitions
5. Test thoroughly

### Modifying Existing Utilities
1. Maintain backward compatibility
2. Update documentation
3. Test all dependent routes
4. Consider migration impact

---

**Last Updated**: 2025-01-17  
**Version**: 1.0  
**Status**: Implementation Complete
