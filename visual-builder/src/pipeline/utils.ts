import type {
  AnyContainerNodeType,
  LeafContainerNodeType,
  SerialContainerNodeType,
  ParallelContainerNodeType,
} from '@harnessio/pipeline-graph'
import {
  PipelineModel,
  PipelineStage,
  PipelineItem,
  PipelineStep,
  SelectedNode,
} from './types'

export interface GraphContext {
  selectedId: string | null
  onSelect: (id: string) => void
}

function makeStepNode(step: PipelineStep, ctx: GraphContext): LeafContainerNodeType {
  return {
    type: 'step',
    data: {
      id: step.id,
      name: step.name,
      stepType: step.stepType,
      description: step.description,
      selected: ctx.selectedId === step.id,
      onSelect: ctx.onSelect,
    },
    config: {
      height: 160,
      width: 150,
      hideDeleteButton: true,
      hideBeforeAdd: true,
      hideAfterAdd: true,
    },
  }
}

function makeStageNode(stage: PipelineStage, ctx: GraphContext): SerialContainerNodeType {
  return {
    type: 'stage',
    data: {
      id: stage.id,
      name: stage.name,
      selected: ctx.selectedId === stage.id,
      onSelect: ctx.onSelect,
    },
    children: stage.steps.map(step => makeStepNode(step, ctx)),
    config: {
      hideDeleteButton: true,
      hideBeforeAdd: true,
      hideAfterAdd: true,
    },
  }
}

function makeItem(item: PipelineItem, ctx: GraphContext): AnyContainerNodeType {
  if (item.type === 'parallel') {
    return {
      type: 'parallel',
      data: {
        id: item.id,
        name: item.name,
        selected: ctx.selectedId === item.id,
        onSelect: ctx.onSelect,
      },
      children: item.stages.map(s => makeStageNode(s, ctx)),
      config: {
        hideDeleteButton: true,
        hideBeforeAdd: true,
        hideAfterAdd: true,
      },
    } as ParallelContainerNodeType
  }
  return makeStageNode(item, ctx)
}

export function buildGraphData(pipeline: PipelineModel, ctx: GraphContext): AnyContainerNodeType[] {
  const startNode: LeafContainerNodeType = {
    type: 'start',
    data: {},
    config: {
      width: 64,
      height: 160,
      hideDeleteButton: true,
      hideBeforeAdd: true,
      hideAfterAdd: true,
      hideLeftPort: true,
      isRightPortHidden: true,
    },
  }

  const endNode: LeafContainerNodeType = {
    type: 'end',
    data: {},
    config: {
      width: 64,
      height: 160,
      hideDeleteButton: true,
      hideBeforeAdd: true,
      hideAfterAdd: true,
      hideRightPort: true,
      isLeftPortHidden: true,
    },
  }

  return [startNode, ...pipeline.stages.map(item => makeItem(item, ctx)), endNode]
}

export function findSelectedNode(pipeline: PipelineModel, id: string): SelectedNode {
  for (const item of pipeline.stages) {
    if (item.id === id) {
      if (item.type === 'parallel') return { kind: 'parallel', node: item }
      return { kind: 'stage', node: item }
    }
    if (item.type === 'serial') {
      for (const step of item.steps) {
        if (step.id === id) return { kind: 'step', node: step, stageId: item.id }
      }
    } else if (item.type === 'parallel') {
      for (const stage of item.stages) {
        if (stage.id === id) return { kind: 'stage', node: stage }
        for (const step of stage.steps) {
          if (step.id === id) return { kind: 'step', node: step, stageId: stage.id }
        }
      }
    }
  }
  return null
}

export function deleteNodeFromModel(pipeline: PipelineModel, id: string): PipelineModel {
  return {
    ...pipeline,
    stages: pipeline.stages
      .filter(item => item.id !== id)
      .map(item => {
        if (item.type === 'serial') {
          return { ...item, steps: item.steps.filter(s => s.id !== id) }
        }
        return {
          ...item,
          stages: item.stages
            .filter(s => s.id !== id)
            .map(s => ({ ...s, steps: s.steps.filter(st => st.id !== id) })),
        }
      }),
  }
}

export function updateStepInModel(
  pipeline: PipelineModel,
  stepId: string,
  updates: Partial<PipelineStep>
): PipelineModel {
  return {
    ...pipeline,
    stages: pipeline.stages.map(item => {
      if (item.type === 'serial') {
        return {
          ...item,
          steps: item.steps.map(s => (s.id === stepId ? { ...s, ...updates } : s)),
        }
      }
      return {
        ...item,
        stages: item.stages.map(stage => ({
          ...stage,
          steps: stage.steps.map(s => (s.id === stepId ? { ...s, ...updates } : s)),
        })),
      }
    }),
  }
}

export function updateStageInModel(
  pipeline: PipelineModel,
  stageId: string,
  updates: Partial<PipelineStage>
): PipelineModel {
  return {
    ...pipeline,
    stages: pipeline.stages.map(item => {
      if (item.id === stageId && item.type === 'serial') return { ...item, ...updates } as PipelineStage
      if (item.type === 'parallel') {
        return {
          ...item,
          stages: item.stages.map(s => (s.id === stageId ? { ...s, ...updates } : s)),
        }
      }
      return item
    }),
  }
}

export function addStepToStage(
  pipeline: PipelineModel,
  stageId: string,
  step: PipelineStep
): PipelineModel {
  return {
    ...pipeline,
    stages: pipeline.stages.map(item => {
      if (item.type === 'serial' && item.id === stageId) {
        return { ...item, steps: [...item.steps, step] }
      }
      if (item.type === 'parallel') {
        return {
          ...item,
          stages: item.stages.map(s =>
            s.id === stageId ? { ...s, steps: [...s.steps, step] } : s
          ),
        }
      }
      return item
    }),
  }
}

export function generateId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
