<script setup>
const model = defineModel({ type: String, default: '' })

defineProps({
  placeholder: { type: String, default: '' },
  rows: { type: Number, default: 3 },
})
</script>

<template>
  <textarea v-model="model" class="ui-textarea" :placeholder="placeholder" :rows="rows" />
</template>
