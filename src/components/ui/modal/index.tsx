'use client'

import { cn } from '@/lib/utils/cn'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment, ReactNode, useRef } from 'react'

export function Modal({
  isOpen,
  onClose,
  title,
  fixedTop,
  noAutoFocus,
  className,
  children,
}: {
  isOpen: boolean
  onClose?: (value: false) => void
  title?: string
  fixedTop?: string
  noAutoFocus?: boolean
  className?: string
  children: ReactNode
}) {
  const defaultFocusRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={onClose ?? (() => null)}
          // We set the `initialFocus` to `Dialog.Panel` element to avoid the focus trap warning.
          initialFocus={noAutoFocus ? defaultFocusRef : undefined}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div
              className={cn(
                'flex min-h-full flex-col items-center p-4',
                !fixedTop && 'justify-center',
              )}
              style={{ paddingTop: fixedTop }}
            >
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-100"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className={cn(
                    'w-full max-w-md rounded-lg bg-white p-4 shadow-xl',
                    className,
                  )}
                  ref={defaultFocusRef}
                >
                  {title && (
                    <Dialog.Title className="mb-2 text-lg">
                      {title}
                    </Dialog.Title>
                  )}
                  {children}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
