import React, { useCallback, useState } from 'react'
import {
  CanvasProvider,
  PipelineGraph,
  ContainerNode,
  type NodeContent,
  type AnyContainerNodeType,
} from '@harnessio/pipeline-graph'
import { StartNode } from './components/nodes/StartNode'
import { EndNode } from './components/nodes/EndNode'
import { StepNode } from './components/nodes/StepNode'
import { StageNode } from './components/nodes/StageNode'
import { ParallelGroupNode } from './components/nodes/ParallelGroupNode'
import { CanvasControls } from './components/CanvasControls'
import { Sidebar } from './components/Sidebar'
import { PropertyPanel } from './components/PropertyPanel'
import {
  buildGraphData,
  findSelectedNode,
  deleteNodeFromModel,
  updateStepInModel,
  updateStageInModel,
  addStepToStage,
  generateId,
} from './pipeline/utils'
import { initialPipeline } from './pipeline/initial-pipeline'
import {
  PipelineModel,
  PipelineStep,
  PipelineStage,
  PipelineParallelGroup,
  StepType,
  STEP_TYPE_LABELS,
} from './pipeline/types'

const NODE_TYPES: NodeContent[] = [
  { type: 'start', containerType: ContainerNode.leaf, component: StartNode as any },
  { type: 'end', containerType: ContainerNode.leaf, component: EndNode as any },
  { type: 'step', containerType: ContainerNode.leaf, component: StepNode as any },
  { type: 'stage', containerType: ContainerNode.serial, component: StageNode as any },
  { type: 'parallel', containerType: ContainerNode.parallel, component: ParallelGroupNode as any },
]

function getHeaderHeight(node: AnyContainerNodeType): number {
  if (node.type === 'stage') return 171
  if (node.type === 'parallel' || node.type === 'serial') return 121
  return 0
}

export default function App() {
  const [pipeline, setPipeline] = useState<PipelineModel>(initialPipeline)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const collapse = useCallback((path: string, state: boolean) => {
    setCollapsed(prev => ({ ...prev, [path]: state }))
  }, [])

  const graphData = buildGraphData(pipeline, { selectedId, onSelect: setSelectedId })
  const selected = selectedId ? findSelectedNode(pipeline, selectedId) : null

  const selectedStageId: string | null =
    selected?.kind === 'stage'
      ? selected.node.id
      : selected?.kind === 'step'
      ? selected.stageId
      : null

  const handleAddStage = () => {
    const newStage: PipelineStage = {
      id: generateId(),
      type: 'serial',
      name: `Stage ${pipeline.stages.length + 1}`,
      steps: [],
    }
    setPipeline(prev => ({ ...prev, stages: [...prev.stages, newStage] }))
  }

  const handleAddParallelGroup = () => {
    const newStage: PipelineStage = {
      id: generateId(),
      type: 'serial',
      name: 'Stage A',
      steps: [],
    }
    const newGroup: PipelineParallelGroup = {
      id: generateId(),
      type: 'parallel',
      name: `Parallel Group ${pipeline.stages.length + 1}`,
      stages: [newStage],
    }
    setPipeline(prev => ({ ...prev, stages: [...prev.stages, newGroup] }))
  }

  const handleAddStep = (stepType: StepType) => {
    if (!selectedStageId) return
    const newStep: PipelineStep = {
      id: generateId(),
      name: STEP_TYPE_LABELS[stepType],
      stepType,
      description: '',
    }
    setPipeline(prev => addStepToStage(prev, selectedStageId, newStep))
    setSelectedId(newStep.id)
  }

  const handleDeleteSelected = () => {
    if (!selectedId) return
    setPipeline(prev => deleteNodeFromModel(prev, selectedId))
    setSelectedId(null)
  }

  const handleExport = () => {
    const json = JSON.stringify(pipeline, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pipeline.name.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stageCount = pipeline.stages.length
  const stepCount = pipeline.stages.reduce((sum, item) => {
    if (item.type === 'serial') return sum + item.steps.length
    return sum + item.stages.reduce((s, st) => s + st.steps.length, 0)
  }, 0)

  return (
    <div className="app-root">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <div className="pipeline-name">{pipeline.name}</div>
            <div className="pipeline-meta">
              {stageCount} stage{stageCount !== 1 ? 's' : ''} · {stepCount} step{stepCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="header-right">
          {selected && (
            <div className="selected-badge">
              <div className="selected-dot" />
              {selected.kind === 'step' ? selected.node.name : selected.kind === 'stage' ? selected.node.name : selected.node.name} selected
            </div>
          )}
          <button className="btn-export" onClick={handleExport}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export JSON
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="app-body">
        <Sidebar
          onAddStep={handleAddStep}
          onAddStage={handleAddStage}
          onAddParallelGroup={handleAddParallelGroup}
          hasSelectedStage={!!selectedStageId}
        />

        {/* Canvas */}
        <div className="canvas-wrapper">
          <CanvasProvider id="pipeline-builder">
            <PipelineGraph
              data={graphData}
              nodes={NODE_TYPES}
              collapse={collapse}
              collapsed={collapsed}
              layout={{
                type: 'harness',
                leafPortPosition: 80,
                getHeaderHeight,
                collapsedPortPositionPerType: {
                  stage: 100,
                  parallel: 100,
                  serial: 100,
                },
              }}
              edgesConfig={{ parallelNodeOffset: 8, serialNodeOffset: 8, radius: 6 }}
              serialContainerConfig={{
                nodeGap: 16,
                paddingBottom: 16,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 0,
                serialGroupAdjustment: 0,
              }}
              parallelContainerConfig={{
                nodeGap: 16,
                paddingBottom: 16,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 0,
                parallelGroupAdjustment: 0,
              }}
            />
            <CanvasControls />
          </CanvasProvider>

          {/* Empty state */}
          {pipeline.stages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="empty-title">No stages yet</div>
              <div className="empty-desc">Click "Add Stage" in the sidebar to start building your pipeline</div>
            </div>
          )}
        </div>

        <PropertyPanel
          selected={selected}
          onDeleteSelected={handleDeleteSelected}
          onUpdateStep={(stepId, updates) =>
            setPipeline(prev => updateStepInModel(prev, stepId, updates))
          }
          onUpdateStage={(stageId, updates) =>
            setPipeline(prev => updateStageInModel(prev, stageId, updates))
          }
        />
      </div>
    </div>
  )
}
