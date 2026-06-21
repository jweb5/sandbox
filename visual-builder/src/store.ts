import { createContext, useContext, useReducer, Dispatch } from 'react'

export interface CanvasItem {
  id: string
  componentId: string
  props: Record<string, unknown>
}

export interface BuilderState {
  items: CanvasItem[]
  selectedId: string | null
  activeTab: 'properties' | 'code'
}

export type BuilderAction =
  | { type: 'ADD_ITEM'; componentId: string; defaultProps: Record<string, unknown> }
  | { type: 'SELECT'; id: string | null }
  | { type: 'UPDATE_PROPS'; id: string; props: Record<string, unknown> }
  | { type: 'REMOVE'; id: string }
  | { type: 'MOVE'; id: string; direction: 'up' | 'down' }
  | { type: 'CLEAR' }
  | { type: 'SET_TAB'; tab: 'properties' | 'code' }

let _counter = 0
function uid() {
  return `item-${++_counter}`
}

function reducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const id = uid()
      return {
        ...state,
        items: [...state.items, { id, componentId: action.componentId, props: { ...action.defaultProps } }],
        selectedId: id,
      }
    }
    case 'SELECT':
      return { ...state, selectedId: action.id }
    case 'UPDATE_PROPS':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id ? { ...item, props: { ...item.props, ...action.props } } : item
        ),
      }
    case 'REMOVE':
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      }
    case 'MOVE': {
      const idx = state.items.findIndex(i => i.id === action.id)
      if (idx < 0) return state
      const next = [...state.items]
      const newIdx = action.direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= next.length) return state
      ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
      return { ...state, items: next }
    }
    case 'CLEAR':
      return { ...state, items: [], selectedId: null }
    case 'SET_TAB':
      return { ...state, activeTab: action.tab }
    default:
      return state
  }
}

const initial: BuilderState = { items: [], selectedId: null, activeTab: 'properties' }

export const BuilderContext = createContext<{
  state: BuilderState
  dispatch: Dispatch<BuilderAction>
}>({ state: initial, dispatch: () => {} })

export function useBuilder() {
  return useContext(BuilderContext)
}

export function createBuilderStore() {
  return useReducer(reducer, initial)
}
