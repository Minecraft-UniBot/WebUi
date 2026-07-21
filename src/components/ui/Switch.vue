<script setup>
import { SwitchRoot, SwitchThumb } from 'reka-ui'

const checked = defineModel({ type: Boolean, default: false })

defineProps({
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <SwitchRoot
    :checked="checked"
    class="ui-switch"
    :disabled="disabled"
    @update:checked="(value) => (checked = value)"
  >
    <SwitchThumb class="ui-switch-thumb" />
  </SwitchRoot>
</template>
