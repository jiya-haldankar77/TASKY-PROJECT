<template>
  <q-card flat class="rounded-borders q-pa-sm shadow-1 flex column justify-between" style="border-radius: 8px; height: 100%;">
    <div class="row justify-between items-center q-mb-xs" style="flex: 0 0 auto;">
      <q-btn flat round dense icon="chevron_left" size="8px" @click="changeMonth(-1)" />
      <div class="text-weight-bold" style="font-size: 11px;">{{ monthLabel }}</div>
      <q-btn flat round dense icon="chevron_right" size="8px" @click="changeMonth(1)" />
    </div>
    <div class="row text-center text-grey-8 text-weight-bold" style="font-size: 9px; margin-bottom: 2px;">
      <div v-for="day in weekdays" :key="day" class="col">{{ day }}</div>
    </div>
    <div v-for="(week, index) in weeks" :key="index" class="row text-center" style="font-size: 9px; line-height: 14px; font-weight: 500;">
      <div v-for="day in week" :key="day.key" class="col" :class="day.currentMonth ? '' : 'text-grey-4'">
        <div v-if="day.isToday" class="bg-lime-13 text-black text-weight-bold" style="width: 14px; height: 14px; display: inline-block; line-height: 14px; border-radius: 50%;">{{ day.date }}</div>
        <template v-else>{{ day.date }}</template>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const displayedMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const monthLabel = computed(() => displayedMonth.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
const changeMonth = (offset: number) => { displayedMonth.value = new Date(displayedMonth.value.getFullYear(), displayedMonth.value.getMonth() + offset, 1); };
const weeks = computed(() => {
  const first = new Date(displayedMonth.value.getFullYear(), displayedMonth.value.getMonth(), 1);
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  const today = new Date();
  return Array.from({ length: 6 }, (_, week) => Array.from({ length: 7 }, (_, weekday) => {
    const value = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + week * 7 + weekday);
    return { key: `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`, date: value.getDate(), currentMonth: value.getMonth() === displayedMonth.value.getMonth(), isToday: value.toDateString() === today.toDateString() };
  }));
});
</script>

<style scoped>
.bg-lime-13 { background-color: #d8f760 !important; }
.text-lime-13 { color: #d8f760 !important; }
</style>
