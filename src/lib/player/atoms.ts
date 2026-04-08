import { atom } from 'jotai'
import { player } from '.'
import { store } from '../store'

export function createIsPlayingAtom() {
  const isPlayingAtom = atom(false)

  player.bindCallbacks({
    onPlay() {
      store.set(isPlayingAtom, true)
    },
    onPause() {
      store.set(isPlayingAtom, false)
    },
  })

  return isPlayingAtom
}
