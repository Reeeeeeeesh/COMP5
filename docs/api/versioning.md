# API Versioning

This document describes the versioning strategy for the Flexible Variable Compensation Calculator API.

## Versioning Strategy

The API uses URL-based versioning to ensure backward compatibility as the API evolves. The version is included in the URL path:

```
https://api.example.com/api/v1/calculate
```

This approach allows for:
- Clear distinction between API versions
- Easy routing to different API implementations
- Ability to maintain multiple versions simultaneously

## Current Version

The current version of the API is **v1**.

## Version Lifecycle

Each API version goes through the following lifecycle stages:

1. **Preview**: Early access for testing and feedback
2. **General Availability (GA)**: Stable and recommended for production use
3. **Deprecated**: Still available but scheduled for removal
4. **Sunset**: No longer available

## Version Support Policy

- New features are added to the latest version only
- Bug fixes are applied to all supported versions
- Security patches are applied to all versions that have not reached sunset
- Each version is supported for a minimum of 12 months after the release of the next version

## Breaking vs. Non-Breaking Changes

### Breaking Changes

Breaking changes require a new API version. Examples include:
- Removing or renaming endpoints
- Removing or renaming request/response fields
- Changing field types or validation rules
- Changing the behavior of existing functionality

### Non-Breaking Changes

Non-breaking changes can be made within the same API version. Examples include:
- Adding new endpoints
- Adding optional request fields
- Adding response fields (as long as clients can handle additional fields)
- Bug fixes that don't change the API contract
- Performance improvements

## Version Migration

When a new API version is released, the following resources are provided to help with migration:
- Migration guide
- Changelog
- Compatibility tools
- Support for gradual migration

## Version Headers

In addition to URL-based versioning, the API supports version specification via the `Accept` header:

```
Accept: application/json; version=1
```

This allows clients to specify the version they expect, which can be useful for testing or gradual migration.

## Deprecation Process

When an API version is deprecated:
1. Announcement is made at least 6 months before sunset
2. Deprecation notice is included in API responses
3. Documentation is updated to indicate deprecation
4. Migration guides are provided

## Deprecation Header

Deprecated API versions include a `Deprecation` header in responses:

```
Deprecation: true
Sunset: Sat, 31 Dec 2023 23:59:59 GMT
Link: <https://api.example.com/api/v2/calculate>; rel="successor-version"
```

## Version Roadmap

### v1 (Current)

- Basic calculator functionality
- Single calculation endpoint
- No authentication required

### v2 (Planned)

- User authentication
- Scenario saving and management
- Batch calculations
- Enhanced validation and error handling

### v3 (Future)

- Advanced visualization options
- Collaborative features
- Integration with external systems
- Performance optimizations

## Best Practices for API Consumers

1. **Always specify the version**: Either in the URL or via the `Accept` header
2. **Design for forward compatibility**: Be prepared to handle additional fields in responses
3. **Monitor deprecation notices**: Check for deprecation headers in responses
4. **Follow migration guides**: Use provided guides when migrating to a new version
5. **Test with new versions**: Test your integration with new API versions before they become required

## Example: Migrating from v1 to v2

### v1 Request

```http
POST /api/v1/calculate
Content-Type: application/json

{
  "base_salary": 100000,
  "target_bonus_pct": 20,
  "investment_weight": 70,
  "qualitative_weight": 30,
  "investment_score_multiplier": 1.0,
  "qual_score_multiplier": 1.0,
  "raf": 1.0
}
```

### v2 Request

```http
POST /api/v2/calculate
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "base_salary": 100000,
  "target_bonus_pct": 20,
  "performance_components": {
    "investment": {
      "weight": 70,
      "score_multiplier": 1.0
    },
    "qualitative": {
      "weight": 30,
      "score_multiplier": 1.0
    }
  },
  "raf": 1.0,
  "scenario_name": "Default Scenario"
}
```

## Conclusion

The versioning strategy ensures that the API can evolve while maintaining backward compatibility for existing clients. By following this strategy, we can add new features and improvements without disrupting existing integrations.
