import { FloatingPanelPosition } from '@/components/ui/floating-panel'
import { atom, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

const outlinePanelOpenAtom = atom(false)
const summaryPanelOpenAtom = atom(false)

export const useOutlinePanelOpen = () => useAtom(outlinePanelOpenAtom)
export const useSummaryPanelOpen = () => useAtom(summaryPanelOpenAtom)

export const outlinePanelPositionAtom = atomWithStorage<FloatingPanelPosition>(
  'intelligence.outline-panel.position',
  { x: 24, y: 88 },
  undefined,
  { getOnInit: true },
)

export const summaryPanelPositionAtom = atomWithStorage<FloatingPanelPosition>(
  'intelligence.summary-panel.position',
  { x: 24, y: 88 },
  undefined,
  { getOnInit: true },
)

export const useOutlinePanelPosition = () => useAtom(outlinePanelPositionAtom)
export const useSummaryPanelPosition = () => useAtom(summaryPanelPositionAtom)
