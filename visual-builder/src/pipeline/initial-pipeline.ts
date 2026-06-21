import { PipelineModel } from './types'

export const initialPipeline: PipelineModel = {
  name: 'My Application Pipeline',
  stages: [
    {
      id: 'stage-build',
      type: 'serial',
      name: 'Build',
      steps: [
        {
          id: 'step-clone',
          name: 'Checkout Code',
          stepType: 'clone',
          description: 'Clone the repository',
          commands: ['git clone $REPO_URL'],
        },
        {
          id: 'step-install',
          name: 'Install Deps',
          stepType: 'script',
          description: 'Install project dependencies',
          commands: ['npm ci'],
        },
        {
          id: 'step-build',
          name: 'Build',
          stepType: 'build',
          description: 'Compile and bundle the application',
          commands: ['npm run build'],
        },
      ],
    },
    {
      id: 'stage-test',
      type: 'serial',
      name: 'Test',
      steps: [
        {
          id: 'step-unit',
          name: 'Unit Tests',
          stepType: 'test',
          description: 'Run unit test suite',
          commands: ['npm run test:unit'],
        },
        {
          id: 'step-integration',
          name: 'Integration',
          stepType: 'test',
          description: 'Run integration tests',
          commands: ['npm run test:integration'],
        },
      ],
    },
    {
      id: 'stage-deploy',
      type: 'serial',
      name: 'Deploy',
      steps: [
        {
          id: 'step-approval',
          name: 'Approval Gate',
          stepType: 'approval',
          description: 'Manual approval required before deploy',
        },
        {
          id: 'step-deploy',
          name: 'Deploy Prod',
          stepType: 'deploy',
          description: 'Deploy to production environment',
          commands: ['./scripts/deploy.sh production'],
        },
      ],
    },
  ],
}
