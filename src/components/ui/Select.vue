<script setup>
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
} from 'reka-ui'
import { Icon } from '@iconify/vue'

const model = defineModel({ type: String, default: '' })

defineProps({
  options: { type: Array, required: true }, // [{ value, label }]
  placeholder: { type: String, default: '请选择' },
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <SelectRoot v-model="model" :disabled="disabled">
    <SelectTrigger class="ui-select-trigger">
      <SelectValue :placeholder="placeholder" />
      <SelectIcon>
        <Icon icon="lucide:chevron-down" width="14" />
      </SelectIcon>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="ui-select-content" position="popper" :side-offset="4">
        <SelectViewport>
          <SelectItem
            v-for="option in options"
            :key="option.value"
            class="ui-select-item"
            :value="option.value"
          >
            <SelectItemText>{{ option.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
