/* globals describe it beforeEach afterEach */
const { expect } = require('chai')
const intercept = require('intercept-stdout')

const Plugin = require('../lib/index')

const clone = obj => JSON.parse(JSON.stringify(obj))

const testConsole =
  () => {
    let lines = []
    let unhook = null

    return {
      start: () => {
        lines = []
        unhook = intercept((txt) => {
          lines.push(txt.trim())
          return ''
        })
      },
      end: () => unhook(),
      result: () => lines,
      check: (messages) => {
        expect(lines.length).to.equal(messages.length)
        const max = Math.max(lines.length, lines.length)
        for (let i = 0; i < max; i++) {
          expect(lines[i]).to.equal(messages[i])
        }
      } // eslint-disable-line comma-dangle
    }
  }

const theTestLog = testConsole()
const checkLog = messages => theTestLog.check(messages)

const serverlessStub =
  (permissionBoundary, resources) => ({
    service: {
      provider: {
        permissionBoundary,
        compiledCloudFormationTemplate: {
          Resources: resources,
        },
      },
    },
  })

const testResources0 =
  {
    MyRole: {
      Type: 'AWS::IAM::Role',
      Properties: {
        RoleName: 'MyRole',
      },
    },
  }

const testResources1 =
  {
    MyRole0: {
      Type: 'AWS::IAM::Role',
      Properties: {
        RoleName: 'MyRole0',
      },
    },
    MyRole1: {
      Type: 'AWS::IAM::Role',
      Properties: {
        RoleName: 'MyRole1',
      },
    },
    MyRole2: {
      Type: 'AWS::IAM::Role',
      Properties: {
        RoleName: 'MyRole2',
      },
    },
  }

const testPolicyArn0 = 'arn:aws:iam::789763425617:policy/ABCAccountBoundary'

describe('Attach Permission Boundary Serverless Plugin', () => {
  beforeEach(() => { theTestLog.start() })
  afterEach(() => { theTestLog.end() })

  it('can be instantiated', () => {
    const slsStub = serverlessStub(null, null)
    const thePlugin = new Plugin(slsStub)

    expect(thePlugin).to.be.an.instanceOf(Plugin)
  })

  it('hooks the Serverless "before:deploy:deploy" event', () => {
    const slsStub = serverlessStub(null, null)
    const thePlugin = new Plugin(slsStub)

    expect(thePlugin.hooks).to.have.all.keys(['before:deploy:deploy'])
  })

  it('doesn\'t do anything if neither permissionBoundary nor CFT resources are included', () => {
    const slsStub = serverlessStub(null, null)
    const thePlugin = new Plugin(slsStub)

    thePlugin.attachPermissionBoundary()

    checkLog([])
  })

  it('doesn\'t do anything if no permissionBoundary is included', () => {
    const resources = clone(testResources0)
    const slsStub = serverlessStub(null, resources)
    const thePlugin = new Plugin(slsStub)

    thePlugin.attachPermissionBoundary()

    expect(resources.MyRole.Properties).not.to.have.keys(['PermissionBoundary'])
    checkLog([])
  })

  it('doesn\'t do anything if no CFT resources are provided', () => {
    const slsStub = serverlessStub(testPolicyArn0, null)
    const thePlugin = new Plugin(slsStub)

    thePlugin.attachPermissionBoundary()

    expect(theTestLog.result().length).to.equal(0)
  })

  it('throws if an invalid looking policy ARN is provided', () => {
    const resources = clone(testResources0)
    const slsStub = serverlessStub('not-valid-policy-ARN', resources)
    const thePlugin = new Plugin(slsStub)

    expect(thePlugin.attachPermissionBoundary.bind(thePlugin))
      .to.throw('"not-valid-policy-ARN" is not a valid policy ARN.')
  })

  it('does not add a duplicate policy', () => {
    const resources = clone(testResources0)
    resources.MyRole.Properties.PermissionBoundary = testPolicyArn0
    const slsStub = serverlessStub(testPolicyArn0, resources)
    const thePlugin = new Plugin(slsStub)

    thePlugin.attachPermissionBoundary()

    expect(resources.MyRole).to.have.keys(['Type', 'Properties'])
    expect(resources.MyRole.Properties.PermissionBoundary).to.equal(testPolicyArn0)

    checkLog([
      'Begin Attach Permission Boundary plugin...',
      'Attach Permission Boundary plugin done.',
    ])
  })

  it('can add a policy where none exist', () => {
    const resources = clone(testResources0)
    const slsStub = serverlessStub(testPolicyArn0, resources)
    const thePlugin = new Plugin(slsStub)

    thePlugin.attachPermissionBoundary()

    expect(resources.MyRole.Properties.PermissionBoundary).to.equal(testPolicyArn0)

    checkLog([
      'Begin Attach Permission Boundary plugin...',
      'Attach Permission Boundary plugin done.',
    ])
  })

  it('can add permission boundaries to multiple roles', () => {
    const resources = clone(testResources1)
    const slsStub = serverlessStub(testPolicyArn0, resources)
    const thePlugin = new Plugin(slsStub)

    thePlugin.attachPermissionBoundary()

    expect(resources.MyRole0.Properties.PermissionBoundary).to.equal(testPolicyArn0)

    expect(resources.MyRole1.Properties.PermissionBoundary).to.equal(testPolicyArn0)

    expect(resources.MyRole2.Properties.PermissionBoundary).to.equal(testPolicyArn0)

    checkLog([
      'Begin Attach Permission Boundary plugin...',
      'Attach Permission Boundary plugin done.',
    ])
  })
})
