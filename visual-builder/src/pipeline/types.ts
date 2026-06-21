export type StepType = 'clone' | 'build' | 'test' | 'deploy' | 'script' | 'approval'

export interface PipelineStep {
  id: string
  name: string
  stepType: StepType
  description?: string
  commands?: string[]
}

export interface PipelineStage {
  id: string
  type: 'serial'
  name: string
  steps: PipelineStep[]
}

export interface PipelineParallelGroup {
  id: string
  type: 'parallel'
  name: string
  stages: PipelineStage[]
}

export type PipelineItem = PipelineStage | PipelineParallelGroup

export interface PipelineModel {
  name: string
  stages: PipelineItem[]
}

export type SelectedNode =
  | { kind: 'stage'; node: PipelineStage }
  | { kind: 'step'; node: PipelineStep; stageId: string }
  | { kind: 'parallel'; node: PipelineParallelGroup }
  | null

export const STEP_TYPE_LABELS: Record<StepType, string> = {
  clone: 'Clone',
  build: 'Build',
  test: 'Test',
  deploy: 'Deploy',
  script: 'Script',
  approval: 'Approval',
}

export const STEP_TYPE_COLORS: Record<StepType, string> = {
  clone: '#6366f1',
  build: '#3b82f6',
  test: '#8b5cf6',
  deploy: '#22c55e',
  script: '#f59e0b',
  approval: '#f97316',
}
