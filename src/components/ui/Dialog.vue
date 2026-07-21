<script setup>
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import Button from './Button.vue'

const open = defineModel({ type: Boolean, default: false })

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  confirmText: { type: String, default: '确认' },
  cancelText: { type: String, default: '取消' },
  confirmVariant: { type: String, default: 'primary' },
  loading: { type: Boolean, default: false },
  hideFooter: { type: Boolean, default: false },
})

defineEmits(['confirm'])
</script>

<template>
  <DialogRoot :open="open" @update:open="(value) => (open = value)">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="ui-dialog-overlay" />
      <DialogContent class="ui-dialog-content">
        <DialogTitle class="ui-dialog-title">{{ title }}</DialogTitle>
        <DialogDescription v-if="description" class="ui-dialog-description">
          {{ description }}
        </DialogDescription>
        <div class="ui-dialog-body">
          <slot />
        </div>
        <div v-if="!hideFooter" class="ui-dialog-footer">
          <DialogClose as-child>
            <Button variant="ghost">{{ cancelText }}</Button>
          </DialogClose>
          <Button :variant="confirmVariant" :loading="loading" @click="$emit('confirm')">
            {{ confirmText }}
          </Button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
