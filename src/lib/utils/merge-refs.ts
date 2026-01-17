type AssignableRef<T> = { current: T | null }

export function mergeRefs<T = unknown>(
  refs: Array<React.Ref<T> | AssignableRef<T> | undefined | null>,
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value)
      } else if (ref != null) {
        ;(ref as AssignableRef<T>).current = value
      }
    })
  }
}
