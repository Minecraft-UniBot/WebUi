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
