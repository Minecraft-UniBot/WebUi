<script setup>
defineProps({
  variant: { type: String, default: 'neutral' }, // neutral | success | warning | danger | accent
})
</script>

<template>
  <span class="ui-badge" :class="`ui-badge--${variant}`">
    <slot />
  </span>
</template>
