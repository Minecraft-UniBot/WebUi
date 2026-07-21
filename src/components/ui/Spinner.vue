<script setup>
defineProps({
  size: { type: Number, default: 16 },
})
</script>

<template>
  <span class="ui-spinner" :style="{ width: `${size}px`, height: `${size}px` }" />
</template>
