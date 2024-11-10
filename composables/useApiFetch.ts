import type { UseFetchOptions } from 'nuxt/app'
import type { FetchError } from 'ofetch'
// TODO: Handle URL
export async function useApiFetch<T>(
  path: string,
  options: UseFetchOptions<T> = {},
  includesURL?: boolean | undefined,
) {
  const server = useServerStore()
  const url = includesURL ? path : `${server.url}/${path}`

  if (import.meta.server) {
    const { data, error } = await useFetch<T>(url, fetch as any); // eslint-disable-line

    if (error.value) {
      throw Error(error.value.message)
    }

    return data.value! as T
  }
  try {
    const data = await $fetch<T>(url, options as any); // eslint-disable-line
    return data! as T
  }
  catch (e: unknown) {
    throw new ApiFetchError(e, (e as FetchError).response?.json)
  }
}

export class ApiFetchError extends Error {
  json: (() => Promise<unknown> | undefined) | undefined

  constructor(error: unknown, json: (() => Promise<unknown> | undefined) | undefined) {
    console.error(error)
    super((error as Error).message)
    this.json = json
  }
}
