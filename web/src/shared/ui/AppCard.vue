<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
  /** 风险权重更高的卡片可加左侧强调边框（§收益权重不得高于风险） */
  emphasis?: 'risk' | 'none'
}>()
</script>

<template>
  <section class="card app-card" :class="{ 'app-card--risk': emphasis === 'risk' }">
    <header v-if="title || $slots.actions" class="app-card__head">
      <div class="app-card__titles">
        <h2 v-if="title" class="section-title app-card__title">{{ title }}</h2>
        <p v-if="subtitle" class="caption app-card__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="app-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="app-card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.app-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.app-card--risk {
  border-left: 3px solid var(--danger);
}
.app-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}
.app-card__title {
  margin: 0;
}
.app-card__subtitle {
  margin: 2px 0 0;
}
.app-card__body {
  flex: 1;
}
</style>
