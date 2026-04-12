import { atom } from 'jotai'
import { player } from '.'
import { store } from '../store'

export function createIsPlayingAtom() {
  const isPlayingAtom = atom(false)
  player.subPlayState((isPlaying) => {
    store.set(isPlayingAtom, isPlaying)
  })
  return isPlayingAtom
}
