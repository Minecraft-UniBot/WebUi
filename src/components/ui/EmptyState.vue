<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  icon: { type: String, default: 'lucide:inbox' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="empty-state">
    <Icon :icon="icon" width="40" class="empty-icon" />
    <div class="empty-title">{{ title }}</div>
    <div v-if="description" class="empty-desc">{{ description }}</div>
    <slot />
  </div>
</template>
