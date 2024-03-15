'use client'

import { ComponentProps } from 'react'
import { WhisperServerNeedConfigureModal } from './WhisperServerNeedConfigureModal'
import { WhisperServerSpinnerModal } from './WhisperServerSpinnerModal'

export function WhisperServerGuardModal({
  configureRegister,
  spinnerRegister,
}: {
  configureRegister: ComponentProps<typeof WhisperServerNeedConfigureModal>
  spinnerRegister: ComponentProps<typeof WhisperServerSpinnerModal>
}) {
  return (
    <>
      <WhisperServerNeedConfigureModal {...configureRegister} />
      <WhisperServerSpinnerModal {...spinnerRegister} />
    </>
  )
}
