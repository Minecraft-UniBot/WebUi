<script setup>
import Spinner from './Spinner.vue'

defineProps({
  variant: { type: String, default: 'secondary' }, // primary | secondary | ghost | danger
  size: { type: String, default: 'md' }, // md | sm
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  iconOnly: { type: Boolean, default: false },
})
</script>

<template>
  <button
    class="ui-button"
    :class="[
      `ui-button--${variant}`,
      { 'ui-button--sm': size === 'sm', 'ui-button--icon': iconOnly },
    ]"
    :disabled="disabled || loading"
  >
    <Spinner v-if="loading" :size="14" />
    <slot />
  </button>
</template>
