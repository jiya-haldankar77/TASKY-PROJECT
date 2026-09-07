<template>
  <q-card flat class="stat-card rounded-borders q-pa-md shadow-1">
    <div class="row justify-between items-center q-mb-xs">
      <div class="text-grey-7 text-caption text-weight-medium">
        {{ label }}
      </div>

      <q-avatar
        size="24px"
        :style="{
          background: background,
          color: color,
        }"
      >
        <q-icon :name="icon" size="16px" />
      </q-avatar>
    </div>

    <div
      class="text-h4 text-weight-bold"
      :style="{ color: color, lineHeight: '1' }"
    >
      {{ value }}
    </div>

    <div
      class="row items-center text-grey-6"
      style="font-size: 11px; margin-top: 6px"
    >
      <span
        class="stat-trend"
        :class="positive ? 'text-positive' : 'text-grey-6'"
      >
        {{ trend }}
      </span>

      <span v-if="description" class="q-ml-xs">
        {{ description }}
      </span>
    </div>
  </q-card>
</template>

<script setup lang="ts">
interface Props {
  label: string;
  value: number;
  description: string;
  icon: string;
  color: string;
  background: string;
  trend: string;
  positive: boolean;
}

defineProps<Props>();
</script>

<style scoped>
.stat-card {
  border: 1px solid #edf0f5;
  border-radius: 14px;
  min-height: 112px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(30, 50, 90, 0.1) !important;
}

.stat-trend {
  font-weight: 500;
}
</style>
