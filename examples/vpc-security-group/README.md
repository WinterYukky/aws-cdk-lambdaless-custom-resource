# VPC Security Group Example

This example demonstrates how to use `LambdalessCustomResource` to revoke default VPC security group rules.

## What it does

- Creates a VPC with a default security group
- Uses a custom resource to revoke all ingress and egress rules from the default security group on creation
- On update, if the security group ID changes, restores rules to the old group and revokes from the new one
- Restores the default rules when the custom resource is deleted
- Handles errors gracefully (e.g., if rules don't exist)

## Key Points

- Uses `CallAwsService.jsonata()` to call EC2 APIs directly from Step Functions
- Implements error handling with `addCatch()` and `Choice` states
- Demonstrates JSONata expressions for dynamic parameter construction
