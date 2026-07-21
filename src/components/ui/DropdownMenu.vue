<script setup>
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from 'reka-ui'
import { Icon } from '@iconify/vue'

defineProps({
  /** 菜单项：[{ label, icon, danger, separator, disabled, on_select }] */
  items: { type: Array, required: true },
  align: { type: String, default: 'end' },
})
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent class="ui-dropdown-content" :align="align" :side-offset="4">
        <DropdownMenuLabel v-if="$slots.label" class="ui-dropdown-label">
          <slot name="label" />
        </DropdownMenuLabel>
        <template v-for="(item, index) in items">
          <DropdownMenuSeparator
            v-if="item.separator"
            :key="`separator-${index}`"
            class="ui-dropdown-separator"
          />
          <DropdownMenuItem
            v-else
            :key="`item-${index}`"
            class="ui-dropdown-item"
            :class="{ 'ui-dropdown-item--danger': item.danger }"
            :disabled="item.disabled"
            @select="item.on_select?.()"
          >
            <Icon v-if="item.icon" :icon="item.icon" width="14" />
            {{ item.label }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
