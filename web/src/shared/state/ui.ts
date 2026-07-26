import { defineStore } from 'pinia'

/**
 * 仅承载 UI 交互状态（与业务/领域数据无关）。
 * 当前用于移动端侧边栏开合；Tablet 折叠由 CSS 媒体查询处理。
 */
export const useUiStore = defineStore('ui', {
  state: () => ({
    /** 移动端（<768px）侧边栏是否展开为覆盖层 */
    mobileNavOpen: false,
  }),
  actions: {
    toggleNav() {
      this.mobileNavOpen = !this.mobileNavOpen
    },
    closeNav() {
      this.mobileNavOpen = false
    },
  },
})
