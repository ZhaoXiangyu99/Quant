import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchOverview } from '@/shared/api/client'
import { readInitialScenario } from '@/shared/state/overview'

describe('统一 API 入口（生产隔离 mock，§复验 P1-5）', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('DEV/测试环境从 mock 返回 source=mock', async () => {
    vi.stubEnv('DEV', true)
    const env = await fetchOverview('healthy')
    expect(env.source).toBe('mock')
    expect(env.data).toBeDefined()
  })

  it('生产环境未配置 VITE_API_BASE 时抛出「API 未配置」', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_API_BASE', undefined)
    await expect(fetchOverview('healthy')).rejects.toThrow(/API 未配置/)
  })
})

describe('readInitialScenario 生产环境忽略 URL ?scenario=（§复验 P1-5）', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname)
    }
  })

  it('生产环境固定 healthy，不论 URL 参数', () => {
    vi.stubEnv('DEV', false)
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/overview?scenario=hard_risk_block')
    }
    expect(readInitialScenario()).toBe('healthy')
  })

  it('DEV 环境默认（无 window）回退 healthy', () => {
    vi.stubEnv('DEV', true)
    expect(readInitialScenario()).toBe('healthy')
  })
})
