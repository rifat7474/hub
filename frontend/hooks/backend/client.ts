import { useState, useCallback } from 'react'

export interface QueryResult<TData, TParams = any> {
  data: TData | null
  loading: boolean
  error: string | null
  trigger: (params?: any, options?: { skipCache?: boolean }) => Promise<TData> & { result: Promise<TData> }
}

export function createFirestoreHook<TParams = any, TData = any>(
  asyncAction: (params: any) => Promise<TData>,
) {
  return function useFirestoreQuery(): QueryResult<TData, TParams> {
    const [data, setData] = useState<TData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const trigger = useCallback(
      (params?: any, _options?: { skipCache?: boolean }) => {
        setLoading(true)
        setError(null)

        const promise = asyncAction(params)
          .then((res) => {
            setData(res)
            setLoading(false)
            return res
          })
          .catch((err) => {
            const msg = err?.message || 'Firebase error'
            setError(msg)
            setLoading(false)
            throw err
          })

        const handle = promise as Promise<TData> & { result: Promise<TData> }
        handle.result = promise
        return handle
      },
      [],
    )

    return { data, loading, error, trigger }
  }
}
