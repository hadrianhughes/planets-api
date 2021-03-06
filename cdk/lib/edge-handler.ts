import * as cdk from '@aws-cdk/core';
import * as cr from '@aws-cdk/custom-resources'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import { Dict } from './globals'

export class EdgeHandler extends cdk.Construct {
  public readonly edgeFunctions: Dict<lambda.IVersion>
  private stack: cdk.Stack
  public domainCertificateArn: string

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id)

    this.stack = scope as cdk.Stack

    this.edgeFunctions =
      ['QueryToID', 'StripAPIPath']
      .reduce((acc: Dict<lambda.IVersion>, name: string) => {
        const resource = this.loadParameter(`${name}ARN`)
        const arn = resource.getResponseField('Parameter.Value')

        return {
          ...acc,
          [name]: lambda.Version.fromVersionArn(this, `${name}EdgeVersion`, arn)
        }
      }, {})


    const domainCertificateResource = this.loadParameter('CustomDomainCertificateARN')
    this.domainCertificateArn = domainCertificateResource.getResponseField('Parameter.Value')
  }

  private loadParameter = (name: string): cr.AwsCustomResource => (
    new cr.AwsCustomResource(this, `Get${name}Parameter`, {
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['ssm:GetParameter*'],
          resources: [
            this.stack.formatArn({
              service: 'ssm',
              region: 'us-east-1',
              resource: `parameter/AAStronomer/${name}`
            })
          ]
        })
      ]),
      onUpdate: {
        service: 'SSM',
        action: 'getParameter',
        parameters: {
          Name: `/AAStronomer/${name}`
        },
        region: 'us-east-1',
        physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString())
      }
    })
  )
}
