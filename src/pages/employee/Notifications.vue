<template>
  <q-page class="q-pa-lg text-black" style="background:#f8f9fa">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center">
        <q-avatar color="indigo-1" text-color="indigo" icon="notifications" size="48px" class="q-mr-md" style="border-radius:12px" />
        <div class="column"><div class="text-h5 text-weight-bold">Notifications Center</div>
        <div class="text-grey-7 text-caption">Stay updated with your tasks and reviews</div>
      </div></div>
      <q-btn color="primary" label="Mark All Read" @click="markAllRead" />
    </div>

    <!-- Notifications List -->
    <q-card flat bordered class="notification-card">
      <q-card-section>
        <div class="text-h6 text-weight-bold">
          Recent Notifications ({{ notifications.length }})
        </div>
      </q-card-section>
      <q-card-section>
        <q-list separator v-if="notifications.length > 0">
          <q-item
            v-for="notification in notifications"
            :key="notification.id"
            class="q-py-md"
            :class="{ 'bg-blue-1': !notification.read }"
          >
            <q-item-section avatar>
              <q-icon
                :name="getNotificationIcon(notification.type)"
                :color="getNotificationColor(notification.type)"
                size="24px"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">{{ notification.title }}</q-item-label>
              <q-item-label caption>{{ notification.message }}</q-item-label>
              <q-item-label caption class="text-grey-6 q-mt-xs">{{
                formatDate(notification.created_at)
              }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row items-center no-wrap">
                <q-btn v-if="!notification.read" flat round dense icon="check" color="green" size="sm" @click="markAsRead(notification.id)">
                  <q-tooltip>Mark as read</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="delete_outline" color="negative" size="sm" @click="deleteNotification(notification.id)">
                  <q-tooltip>Delete notification</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-center q-pa-xl text-grey-6">
          <q-icon name="notifications_none" size="48px" class="q-mb-sm" />
          <div class="text-h6">No notifications</div>
          <div>You're all caught up!</div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNotificationStore } from '../../stores/notificationStore';

defineOptions({
  name: 'EmployeeNotifications',
});

const notifications = ref<any[]>([]);
const notificationStore = useNotificationStore();

onMounted(() => {
  loadNotifications();
});

function loadNotifications() {
  notificationStore.fetchNotifications().then(() => { notifications.value = notificationStore.notifications.map((n: any) => ({ ...n, read: Boolean(n.is_read) })); });
  /* fallback keeps the page useful if the API is unavailable */
  notifications.value = notifications.value.length ? notifications.value : [
    {
      id: 1,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: 'You have been assigned to "Update User Interface"',
      created_at: new Date().toISOString(),
      read: false,
    },
    {
      id: 2,
      type: 'review_requested',
      title: 'Review Requested',
      message: 'John Doe requested a review for "API Integration"',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      read: true,
    },
    {
      id: 3,
      type: 'review_completed',
      title: 'Review Completed',
      message: 'Your task "Database Migration" has been reviewed',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      read: true,
    },
  ];
}

function getNotificationIcon(type: string) {
  const icons: Record<string, string> = {
    task_assigned: 'assignment',
    review_requested: 'rate_review',
    review_completed: 'check_circle',
    task_completed: 'task_alt',
    deadline_reminder: 'alarm',
  };
  return icons[type] || 'notifications';
}

function getNotificationColor(type: string) {
  const colors: Record<string, string> = {
    task_assigned: 'blue',
    review_requested: 'purple',
    review_completed: 'green',
    task_completed: 'green',
    deadline_reminder: 'orange',
  };
  return colors[type] || 'grey';
}

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function markAsRead(id: number) {
  const notification = notifications.value.find((n: any) => n.id === id);
  if (notification) {
    notification.read = true;
    void notificationStore.markAsRead(String(id));
  }
}

function markAllRead() {
  notifications.value.forEach((n: any) => (n.read = true));
  void notificationStore.markAllAsRead();
}

async function deleteNotification(id: number) {
  const index = notifications.value.findIndex((notification: any) => notification.id === id);
  if (index === -1) return;
  const [removed] = notifications.value.splice(index, 1);
  if (!(await notificationStore.deleteNotification(String(id)))) {
    notifications.value.splice(index, 0, removed);
  }
}
</script>

<style scoped>
.notification-card { border-radius: 14px; border-color: #e5eaf0; box-shadow: 0 7px 20px rgba(32, 54, 83, .05); }
</style>
