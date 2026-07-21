<script setup>
const model = defineModel({ type: [String, Number], default: '' })

defineProps({
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <input
    v-model="model"
    class="ui-input"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
  />
</template>
