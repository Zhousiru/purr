import { atom } from 'jotai'
import { player } from '.'
import { store } from '../store'

export function createIsPlayingAtom() {
  const isPlayingAtom = atom(player.isPlaying)
  player.subPlayState((isPlaying) => {
    store.set(isPlayingAtom, isPlaying)
  })
  return isPlayingAtom
}
