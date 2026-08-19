<template>
  <div class="bg-white q-pa-md shadow-1 q-mb-md" style="border-radius: 12px;">
    <div class="text-subtitle1 text-weight-bold q-mb-lg">Task Status Distribution</div>
    
    <div class="row items-center no-wrap">
      <!-- Donut Chart -->
      <div class="donut-chart q-mr-lg">
        <div class="donut-hole">
          <div class="text-caption text-grey-6" style="font-size: 11px; line-height: 1.2;">Total</div>
          <div class="text-weight-bold" style="font-size: 16px; color: #333; line-height: 1.2;">15</div>
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
  </div>
</template>

<script setup lang="ts">
const legendItems = [
  { label: 'Not Started', value: 5, percent: 33, color: '#9e9e9e' },
  { label: 'In Progress', value: 6, percent: 40, color: '#2196f3' },
  { label: 'Completed', value: 4, percent: 27, color: '#4caf50' },
  { label: 'Blocked', value: 0, percent: 0, color: '#f44336' }
];
</script>

<style scoped>
.donut-chart {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: conic-gradient(
    #9e9e9e 0% 33%,
    #2196f3 33% 73%,
    #4caf50 73% 100%
  );
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
