import { Button } from '@/components/ui/button'
import { IconArrowRight } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { forwardRef } from 'react'
import { SectionContainer } from '../SectionContainer'

export const WhisperServerSection = forwardRef<HTMLElement>(
  function WhisperServerSection(_, ref) {
    const navigate = useNavigate()

    return (
      <SectionContainer
        ref={ref}
        id="whisper-server"
        title="Whisper Server"
        description="Local transcription engine that powers all audio tasks."
      >
        <Button
          variant="outline"
          icon={<IconArrowRight size={16} />}
          reverseIcon
          onClick={() => navigate({ to: '/whisper-server' })}
          className="self-start"
        >
          Go to Whisper Server settings
        </Button>
      </SectionContainer>
    )
  },
)
