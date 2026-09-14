---
name: aws-architecture-audit
description: Inspect the PUBG Insight repositories and derive the actual implemented AWS architecture before creating or editing diagrams.
allowed-tools: Read, Grep, Glob
---

# AWS Architecture Audit

Before drawing or editing an AWS architecture diagram:

## Inspect

Search both frontend and backend repositories for:

- AWS SDK dependencies
- Elastic Beanstalk configuration
- Lambda
- API Gateway
- S3
- DynamoDB
- Athena
- IAM references
- region configuration
- environment variables
- frontend API URLs
- third-party API clients
- caching logic
- persistence logic

## Build an Implementation Matrix

For each component determine:

- Proposed
- Implemented
- Partially implemented
- Not implemented

Only implemented or clearly required deployed infrastructure should appear as implemented architecture.

## Trace User Flows

For each major client operation identify:

User
→ frontend
→ backend/API
→ processing service
→ third-party API
→ database/storage
→ response

Include:

- player search
- match retrieval
- season stats
- AI insight generation
- cache read/write
- historical analytics

## Diagram Rules

Use official AWS icons.

Architecture should flow primarily left-to-right.

Group into:

Client
AWS entry/application layer
Compute
Storage/database
Analytics
External APIs

Label important arrows.

Avoid line crossings.

Use orthogonal connectors.

Prefer libavoid routing when refining an existing layout.

Never add AWS services just because they appeared in the proposal if they are not actually implemented.

Before drawing:
1. report current architecture
2. report discrepancies between proposal and implementation
3. propose diagram structure
4. then edit/create the diagram