'use client'

import { PageHeader } from '@/components/layout/page-header'
import { useForm } from 'react-hook-form'

export default function Page() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<{
    in: string
    select: string
  }>()

  return (
    <div className="flex h-screen flex-col">
      <PageHeader>Whisper Server</PageHeader>
      <div className="flex flex-grow"></div>
    </div>
  )
}
