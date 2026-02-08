import { useCallback, useState, useMemo, useEffect } from 'react'
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  MarkerType,
  type Node,
  type Edge,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  HiOutlineLightningBolt,
  HiOutlineClock,
  HiOutlineGlobeAlt,
  HiOutlinePlay,
  HiOutlineFilter,
  HiOutlineCheckCircle,
  HiOutlinePlus,
} from 'react-icons/hi'
import clsx from 'clsx'

// Custom node data interface
interface CustomNodeData {
  label: string
  description?: string
  icon?: any
}

// Custom node components
function TriggerNode({ data }: { data: CustomNodeData }) {
  const Icon = data.icon || HiOutlineLightningBolt

  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-primary)] p-[10px] min-w-200px">
      <div className="flex items-center gap-[8px] mb-[8px]">
        <Icon className="w-5 h-5 text-[var(--theme-primary)]" />
        <span className="text-xs font-bold uppercase text-[var(--theme-primary)]">TRIGGER</span>
      </div>
      <div className="text-brutal-sm font-bold mb-4px">{data.label}</div>
      {data.description && (
        <div className="text-xs text-[var(--theme-muted)]">{data.description}</div>
      )}
    </div>
  )
}

function ConditionNode({ data }: { data: CustomNodeData }) {
  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-warning)] p-[10px] min-w-200px">
      <div className="flex items-center gap-[8px] mb-[8px]">
        <HiOutlineFilter className="w-5 h-5 text-[var(--theme-warning)]" />
        <span className="text-xs font-bold uppercase text-[var(--theme-warning)]">CONDITION</span>
      </div>
      <div className="text-brutal-sm font-bold mb-4px">{data.label}</div>
      {data.description && (
        <div className="text-xs text-[var(--theme-muted)]">{data.description}</div>
      )}
    </div>
  )
}

function ActionNode({ data }: { data: CustomNodeData }) {
  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-success)] p-[10px] min-w-200px">
      <div className="flex items-center gap-[8px] mb-[8px]">
        <HiOutlineCheckCircle className="w-5 h-5 text-[var(--theme-success)]" />
        <span className="text-xs font-bold uppercase text-[var(--theme-success)]">ACTION</span>
      </div>
      <div className="text-brutal-sm font-bold mb-4px">{data.label}</div>
      {data.description && (
        <div className="text-xs text-[var(--theme-muted)]">{data.description}</div>
      )}
    </div>
  )
}

interface FlowCanvasProps {
  workflow?: any
  onSave?: (nodes: Node[], edges: Edge[]) => void
}

export default function FlowCanvas({ workflow, onSave }: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Define custom node types
  const nodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      condition: ConditionNode,
      action: ActionNode,
    }),
    []
  )

  // Load workflow into flow canvas
  const loadWorkflow = useCallback((wf: any) => {
    if (!wf) return

    const newNodes: Node[] = []
    const newEdges: Edge[] = []
    let yPosition = 50

    // Create trigger node
    const triggerNode: Node = {
      id: 'trigger',
      type: 'trigger',
      position: { x: 250, y: yPosition },
      data: {
        label: wf.trigger.type.toUpperCase(),
        description: wf.trigger.event || wf.trigger.schedule || 'Manual trigger',
        icon: getTriggerIcon(wf.trigger.type),
      },
    }
    newNodes.push(triggerNode)
    yPosition += 150

    let previousNodeId = 'trigger'

    // Create condition nodes
    if (wf.conditions && wf.conditions.length > 0) {
      wf.conditions.forEach((condition: any, index: number) => {
        const conditionId = `condition-${index}`
        newNodes.push({
          id: conditionId,
          type: 'condition',
          position: { x: 250, y: yPosition },
          data: {
            label: `If ${condition.field}`,
            description: `${condition.operator} ${condition.value}`,
          },
        })
        newEdges.push({
          id: `${previousNodeId}-${conditionId}`,
          source: previousNodeId,
          target: conditionId,
          type: 'default',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
        })
        previousNodeId = conditionId
        yPosition += 150
      })
    }

    // Create action nodes
    if (wf.actions && wf.actions.length > 0) {
      wf.actions.forEach((action: any, index: number) => {
        const actionId = `action-${index}`
        newNodes.push({
          id: actionId,
          type: 'action',
          position: { x: 250, y: yPosition },
          data: {
            label: action.type.replace('_', ' ').toUpperCase(),
            description: getActionDescription(action),
          },
        })
        newEdges.push({
          id: `${previousNodeId}-${actionId}`,
          source: previousNodeId,
          target: actionId,
          type: 'default',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
        })
        previousNodeId = actionId
        yPosition += 150
      })
    }

    setNodes(newNodes)
    setEdges(newEdges)
  }, [setNodes, setEdges])

  // Helper functions
  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'event':
        return HiOutlineLightningBolt
      case 'schedule':
        return HiOutlineClock
      case 'webhook':
        return HiOutlineGlobeAlt
      case 'manual':
        return HiOutlinePlay
      default:
        return HiOutlineLightningBolt
    }
  }

  const getActionDescription = (action: any) => {
    if (action.config?.title) return action.config.title
    if (action.config?.message) return action.config.message
    return 'Configure action'
  }

  // Handle connection
  const onConnect = useCallback(
    (params: any) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'default',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      )
    },
    [setEdges]
  )

  // Add new node
  const addNode = (type: 'trigger' | 'condition' | 'action') => {
    const id = `${type}-${Date.now()}`
    const newNode: Node = {
      id,
      type,
      position: { x: 250, y: nodes.length * 150 + 50 },
      data: {
        label: type.toUpperCase(),
        description: 'Click to configure',
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges)
    }
  }

  // Load workflow on mount
  useEffect(() => {
    if (workflow) {
      loadWorkflow(workflow)
    }
  }, [workflow, loadWorkflow])

  return (
    <div className="h-600px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]">
      {/* Toolbar */}
      <div className="h-6 border-b-2 border-[var(--theme-border)] flex items-center justify-between px-[10px] bg-[var(--theme-background-secondary)]">
        <div className="flex items-center gap-[8px]">
          <button
            onClick={() => addNode('trigger')}
            className="px-[12px] py-6px border-2 border-[var(--theme-primary)] text-[var(--theme-primary)] hover:bg-[var(--theme-primary)] hover:text-[var(--theme-background)] text-xs font-bold uppercase"
          >
            + TRIGGER
          </button>
          <button
            onClick={() => addNode('condition')}
            className="px-[12px] py-6px border-2 border-[var(--theme-warning)] text-[var(--theme-warning)] hover:bg-[var(--theme-warning)] hover:text-[var(--theme-background)] text-xs font-bold uppercase"
          >
            + CONDITION
          </button>
          <button
            onClick={() => addNode('action')}
            className="px-[12px] py-6px border-2 border-[var(--theme-success)] text-[var(--theme-success)] hover:bg-[var(--theme-success)] hover:text-[var(--theme-background)] text-xs font-bold uppercase"
          >
            + ACTION
          </button>
        </div>
        <button
          onClick={handleSave}
          className="px-[10px] py-6px bg-[var(--theme-primary)] text-[var(--theme-background)] text-xs font-bold uppercase hover:opacity-80"
        >
          SAVE FLOW
        </button>
      </div>

      {/* React Flow Canvas */}
      <div className="h-[calc(100%-48px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          style={{
            background: 'var(--theme-background)',
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="var(--theme-border)"
          />
          <Controls
            style={{
              border: '2px solid var(--theme-border)',
              background: 'var(--theme-background-secondary)',
            }}
          />
        </ReactFlow>
      </div>
    </div>
  )
}
