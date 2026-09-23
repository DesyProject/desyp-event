import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // 보유 기간은 기본값 없이 빌드 실패로 강제한다 (스펙 요구사항)
  if (!env.VITE_RETENTION_DAYS || !env.VITE_RETENTION_DAYS.trim()) {
    throw new Error(
      '[config] VITE_RETENTION_DAYS 환경 변수가 필요합니다 (예: .env 파일에 VITE_RETENTION_DAYS=30 추가).',
    )
  }
  if (!env.VITE_REGISTRATION_END_AT || !env.VITE_REGISTRATION_END_AT.trim()) {
    throw new Error(
      '[config] VITE_REGISTRATION_END_AT 환경 변수가 필요합니다 (ISO 8601, KST 오프셋 포함. 예: 2026-10-01T23:59:59+09:00).',
    )
  }

  return {
    plugins: [react()],
  }
})
