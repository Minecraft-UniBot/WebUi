<script setup>
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui'
import { Icon } from '@iconify/vue'

const checked = defineModel({ type: Boolean, default: false })

defineProps({
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <CheckboxRoot
    :checked="checked"
    class="ui-checkbox"
    :disabled="disabled"
    @update:checked="(value) => (checked = value)"
  >
    <CheckboxIndicator>
      <Icon icon="lucide:check" width="12" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>

<style scoped>
.ui-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  background: var(--surface);
  color: #ffffff;
  transition:
    background-color var(--transition),
    border-color var(--transition);
}

.ui-checkbox[data-state='checked'] {
  background: var(--accent);
  border-color: var(--accent);
}
</style>
