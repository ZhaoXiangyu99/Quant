<script setup lang="ts">
defineProps<{ name: string; size?: number }>()
</script>

<template>
  <svg
    :width="size ?? 18"
    :height="size ?? 18"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'overview'">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </template>
    <template v-else-if="name === 'research'">
      <circle cx="7" cy="7" r="4" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </template>
    <template v-else-if="name === 'backtest'">
      <line x1="3" y1="13" x2="3" y2="8" />
      <line x1="8" y1="13" x2="8" y2="4" />
      <line x1="13" y1="13" x2="13" y2="9" />
    </template>
    <template v-else-if="name === 'approval'">
      <circle cx="8" cy="8" r="6" />
      <path d="M5.5 8.2 7.2 10 11 6" />
    </template>
    <template v-else-if="name === 'risk'">
      <path d="M8 2 13 4.2V8c0 3.3-2.2 5.4-5 6-2.8-.6-5-2.7-5-6V4.2z" />
    </template>
    <template v-else-if="name === 'execution'">
      <path d="M9 2 4 9h3l-1 5 5-7H8z" />
    </template>
    <template v-else-if="name === 'review'">
      <path d="M4 2h6l3 3v9H4z" />
      <line x1="7" y1="8" x2="11" y2="8" />
      <line x1="7" y1="11" x2="11" y2="11" />
    </template>
    <template v-else-if="name === 'settings'">
      <circle cx="8" cy="8" r="2.2" />
      <path
        d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4"
      />
    </template>
    <template v-else-if="name === 'bell'">
      <path d="M8 2.5a4 4 0 0 0-4 4v2.5L2.5 11h11L12 9V6.5a4 4 0 0 0-4-4z" />
      <path d="M6.5 12a1.5 1.5 0 0 0 3 0" />
    </template>
    <template v-else-if="name === 'chevron'">
      <path d="M4 6l4 4 4-4" />
    </template>
    <template v-else-if="name === 'menu'">
      <line x1="3" y1="4.5" x2="13" y2="4.5" />
      <line x1="3" y1="8" x2="13" y2="8" />
      <line x1="3" y1="11.5" x2="13" y2="11.5" />
    </template>
    <template v-else-if="name === 'chart'">
      <rect x="1" y="3" width="14" height="10" rx="1" ry="1" fill="none" />
      <polyline points="1,11 5,7 8,9 11,5 15,8" fill="none" />
    </template>
    <template v-else>
      <circle cx="8" cy="8" r="5" />
    </template>
  </svg>
</template>
