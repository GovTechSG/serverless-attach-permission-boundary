# serverless-attach-permission-boundary

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)

A [serverless](http://www.serverless.com) plugin to _automatically_ attach an [AWS Permission Boundary](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html) to _all_ IAM Roles created by the Service.

Originally forked from [serverless-attach-managed-policy](https://github.com/Nordstrom/serverless-attach-managed-policy)

## Install

`npm install --save-dev serverless-attach-permission-boundary`

Add the plugin to your `serverless.yml` file:

```yaml
plugins:
  - serverless-attach-permission-bounddary
```

## Configuration

```yaml
provider:
  name: aws
  permissionBoundaryArn: 'arn:aws:iam::789763425617:policy/ABCAccountBoundary'
```