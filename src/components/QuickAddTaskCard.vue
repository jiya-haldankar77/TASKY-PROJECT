<template>
  <q-card flat bordered class="quick-add-card q-pa-lg q-mb-lg">
    <div class="row items-center">
        <q-avatar size="48px" class="quick-add-icon">
        <q-icon name="add_task" size="25px" />
      </q-avatar>
      <div class="q-ml-md">
        <div class="quick-add-title">Have something new to work on?</div>
        <div class="quick-add-subtitle">Create a task and divide it into smaller subtasks.</div>
      </div>
      <q-space />
      <q-btn
        unelevated
        no-caps
        color="primary"
        text-color="white"
        icon="add"
        label="Create Task"
        class="q-px-lg"
        @click="$emit('create')"
      />
    </div>
  </q-card>
</template>

<script setup lang="ts">
defineEmits(['create']);
</script>

<style scoped>
.quick-add-card {
  border-radius: 12px;
  background: #fff;
  color: #263238;
  border-color: #e5eaf0;
  box-shadow: 0 7px 20px rgba(32, 54, 83, 0.05);
}

.quick-add-icon {
  background: #e8eaf6;
  color: #3949ab;
}

.quick-add-title {
  font-size: 18px;
  font-weight: 600;
  color: #263238;
}

.quick-add-subtitle {
  font-size: 14px;
  color: #738198;
}
</style>
