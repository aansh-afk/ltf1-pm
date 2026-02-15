import { useEffect } from 'react'

const BASE_TITLE = 'LTF1'

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} — Git-Native Project Management for Developers`
    return () => {
      document.title = `${BASE_TITLE} — Git-Native Project Management for Developers`
    }
  }, [title])
}
