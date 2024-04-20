import { atom } from 'jotai'
import { player } from '.'
import { store } from '../store'
import { isServer } from '../utils/is-server'

export function createIsPlayingAtom() {
  const isPlayingAtom = atom(false)

  if (!isServer()) {
    player.bindCallbacks({
      onPlay() {
        store.set(isPlayingAtom, true)
      },
      onPause() {
        store.set(isPlayingAtom, false)
      },
    })
  }

  return isPlayingAtom
}
