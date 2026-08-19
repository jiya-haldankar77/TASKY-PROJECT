<template>
  <div class="bg-white q-pa-md shadow-1 q-mb-md" style="border-radius: 12px;">
    <div class="text-subtitle1 text-weight-bold q-mb-md">Workload Distribution</div>
    
    <div class="row items-center no-wrap">
      <!-- Donut Chart -->
      <div class="donut-chart q-mr-md">
        <div class="donut-hole">
          <div class="text-caption text-grey-6" style="font-size: 10px; line-height: 1.2;">Total</div>
          <div class="text-weight-bold" style="font-size: 15px; color: #333; line-height: 1.2;">720h</div>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="column flex-1" style="gap: 8px;">
        <div v-for="(item, index) in legendItems" :key="index" class="row items-center justify-between no-wrap">
          <div class="row items-center no-wrap">
            <div class="legend-dot q-mr-sm" :style="`background-color: ${item.color};`"></div>
            <div class="text-grey-8" style="font-size: 11px;">{{ item.label }}</div>
          </div>
          <div class="text-weight-bold text-grey-8" style="font-size: 11px;">{{ item.value }}h ({{ item.percent }}%)</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const legendItems = [
  { label: 'Frontend Dev', value: 240, percent: 33, color: '#3f51b5' },
  { label: 'Backend Dev', value: 200, percent: 28, color: '#ff9800' },
  { label: 'Design', value: 120, percent: 17, color: '#4caf50' },
  { label: 'DevOps', value: 100, percent: 14, color: '#9c27b0' },
  { label: 'QA', value: 60, percent: 8, color: '#e91e63' }
];
</script>

<style scoped>
.donut-chart {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: conic-gradient(
    #3f51b5 0% 33%,
    #ff9800 33% 61%,
    #4caf50 61% 78%,
    #9c27b0 78% 92%,
    #e91e63 92% 100%
  );
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.donut-hole {
  width: 70px;
  height: 70px;
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
