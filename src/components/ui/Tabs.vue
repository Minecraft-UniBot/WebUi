<script setup>
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import { Icon } from '@iconify/vue'

const model = defineModel({ type: String, default: '' })

defineProps({
  /** 标签页：[{ value, label, icon }] */
  tabs: { type: Array, required: true },
})
</script>

<template>
  <TabsRoot v-model="model">
    <TabsList class="ui-tabs-list">
      <TabsTrigger v-for="tab in tabs" :key="tab.value" class="ui-tabs-trigger" :value="tab.value">
        <Icon v-if="tab.icon" :icon="tab.icon" width="14" />
        {{ tab.label }}
      </TabsTrigger>
    </TabsList>
    <TabsContent v-for="tab in tabs" :key="tab.value" class="ui-tabs-content" :value="tab.value">
      <slot :name="tab.value" />
    </TabsContent>
  </TabsRoot>
</template>
