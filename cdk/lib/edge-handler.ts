import * as cdk from '@aws-cdk/core';
import * as cr from '@aws-cdk/custom-resources'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'

interface EdgeHandlerProps {
  stack: cdk.Stack
  parameterName: string
}

export class EdgeHandler extends cdk.Construct {
  private parameters: { [key: string]: cr.AwsCustomResource } = {}

  constructor(scope: cdk.Construct, id: string, props: EdgeHandlerProps) {
    super(scope, id)

    this.parameters.EdgeTest = new cr.AwsCustomResource(this, 'GetParameter', {
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['ssm:GetParameter*'],
          resources: [
            props.stack.formatArn({
              service: 'ssm',
              region: 'us-east-1',
              resource: `parameter/PlanetsAPI/${props.parameterName}`
            })
          ]
        })
      ]),
      onUpdate: {
        service: 'SSM',
        action: 'getParameter',
        parameters: {
          Name: `/PlanetsAPI/${props.parameterName}`
        },
        region: 'us-east-1',
        physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString())
      }
    })
  }

  public getVersion(key: string): lambda.IVersion {
    return lambda.Version.fromVersionArn(
      this,
      `${key}Version`,
      this.parameters[key].getResponseField('Parameter.Value')
    )
  }
}