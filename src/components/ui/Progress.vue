<script setup>
import { ProgressRoot, ProgressIndicator } from 'reka-ui'

defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
})
</script>

<template>
  <ProgressRoot class="ui-progress" :model-value="value" :max="max">
    <ProgressIndicator
      class="ui-progress-indicator"
      :style="{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }"
    />
  </ProgressRoot>
</template>
