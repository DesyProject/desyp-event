/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EVENT_END_AT: string
  readonly VITE_RETENTION_DAYS: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
