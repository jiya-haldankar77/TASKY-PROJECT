<template>
  <div class="bg-white q-pa-md shadow-1 q-mb-md" style="border-radius: 12px;">
    <div class="text-subtitle1 text-weight-bold q-mb-lg">Task Status Distribution</div>
    
    <div v-if="analyticsStore.loading" class="flex flex-center q-pa-md">
      <q-spinner-dots size="24px" color="primary" />
    </div>

    <div v-else-if="analyticsStore.taskDistribution && legendItems.length > 0" class="row items-center no-wrap">
      <!-- Donut Chart -->
      <div class="donut-chart q-mr-lg" :style="donutGradient">
        <div class="donut-hole">
          <div class="text-caption text-grey-6" style="font-size: 11px; line-height: 1.2;">Total</div>
          <div class="text-weight-bold" style="font-size: 16px; color: #333; line-height: 1.2;">{{ analyticsStore.taskDistribution.total || 0 }}</div>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="column flex-1" style="gap: 12px;">
        <div v-for="(item, index) in legendItems" :key="index" class="row items-center justify-between no-wrap">
          <div class="row items-center no-wrap">
            <div class="legend-dot q-mr-sm" :style="`background-color: ${item.color};`"></div>
            <div class="text-grey-8" style="font-size: 12px;">{{ item.label }}</div>
          </div>
          <div class="text-weight-bold text-grey-8" style="font-size: 12px;">
            {{ item.value }} <span class="text-grey-6 text-weight-regular q-ml-xs">({{ item.percent }}%)</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-grey-6 q-pa-md text-caption">
      No task distribution data available.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAnalyticsStore } from '../stores/analyticsStore';

const analyticsStore = useAnalyticsStore();

const statusColors: Record<string, string> = {
  'not-started': '#9e9e9e',
  'in-progress': '#2196f3',
  'completed': '#4caf50',
  'blocked': '#f44336'
};

const legendItems = computed(() => {
  if (!analyticsStore.taskDistribution || !analyticsStore.taskDistribution.status) return [];
  const statusData = analyticsStore.taskDistribution.status;
  const total = analyticsStore.taskDistribution.total || 0;
  
  if (total === 0) return [];

  const items: any[] = [];
  if (Array.isArray(statusData)) {
    statusData.forEach((item: any) => {
      const status = item.status;
      const c = Number(item.count);
      if (c > 0) {
        items.push({
          label: status.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          value: c,
          percent: Math.round((c / total) * 100),
          color: statusColors[status] || '#757575'
        });
      }
    });
  }
  return items.sort((a, b) => b.value - a.value);
});

const donutGradient = computed(() => {
  if (legendItems.value.length === 0) return { background: 'transparent' };
  
  let gradient = 'conic-gradient(';
  let currentPercent = 0;
  
  legendItems.value.forEach((item, index) => {
    const start = currentPercent;
    currentPercent += item.percent;
    gradient += `${item.color} ${start}% ${currentPercent}%${index < legendItems.value.length - 1 ? ',' : ')'}`;
  });
  
  return { background: gradient };
});
</script>

<style scoped>
.donut-chart {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.donut-hole {
  width: 75px;
  height: 75px;
  border-radius: 50%;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
