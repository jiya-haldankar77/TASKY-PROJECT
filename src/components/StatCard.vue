<template>
  <q-card flat class="stat-card rounded-borders q-pa-md shadow-1">
    <div class="row justify-between items-center q-mb-xs">
      <div class="text-grey-7 text-caption text-weight-medium">
        {{ title }}
      </div>
      <q-avatar size="24px" :color="`${color}-1`" :text-color="color" :icon="icon" />
    </div>
    <div :class="`text-h4 text-weight-bold text-${color}`" style="line-height: 1">{{ value }}</div>
    <div
      class="row items-center text-grey-6"
      style="font-size: 11px; margin-top: 6px"
    >
      <slot name="caption">{{ caption }}</slot>
    </div>
    <q-linear-progress
      v-if="progressValue !== undefined"
      :value="progressValue"
      :color="color"
      size="3px"
      class="q-mt-xs rounded-borders"
    />
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  value: string | number;
  color: string;
  icon: string;
  caption?: string;
  progressValue?: number;
}>();
</script>

<style scoped>
.stat-card { border: 1px solid #edf0f5; border-radius: 14px; min-height: 112px; transition: transform .2s ease, box-shadow .2s ease; }
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(30, 50, 90, .10) !important; }
</style>
