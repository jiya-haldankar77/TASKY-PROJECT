<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="260"
      class="text-white q-pa-md flex column"
      style="background-color: #1a1a27; border-radius: 0 32px 32px 0"
    >
      <!-- Logo -->
      <div class="row items-center q-mb-xl q-pl-sm q-pt-md">
        <q-icon name="o_task_alt" size="32px" class="q-mr-sm" />
        <div class="text-h5 text-weight-bold">Tasky</div>
      </div>

      <!-- Navigation -->
      <q-list class="q-gutter-y-sm" padding>
        <q-item
          clickable
          v-ripple
          exact
          to="/dashboard"
          active-class="bg-lime-13 text-black"
          class="nav-item rounded-borders"
          style="border-radius: 12px; font-weight: 500"
        >
          <q-item-section avatar>
            <q-icon name="grid_view" />
          </q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/dashboard/projects"
          active-class="bg-lime-13 text-black"
          class="nav-item rounded-borders"
          style="border-radius: 12px; font-weight: 500"
        >
          <q-item-section avatar>
            <q-icon name="o_folder" />
          </q-item-section>
          <q-item-section>Projects</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/dashboard/tasks"
          active-class="bg-lime-13 text-black"
          class="nav-item rounded-borders"
          style="border-radius: 12px; font-weight: 500"
        >
          <q-item-section avatar>
            <q-icon name="o_check_circle" />
          </q-item-section>
          <q-item-section>Tasks</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/dashboard/resources"
          active-class="bg-lime-13 text-black"
          class="nav-item rounded-borders"
          style="border-radius: 12px; font-weight: 500"
        >
          <q-item-section avatar>
            <q-icon name="o_people" />
          </q-item-section>
          <q-item-section>Resources</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/dashboard/analytics"
          active-class="bg-lime-13 text-black"
          class="nav-item rounded-borders"
          style="border-radius: 12px; font-weight: 500"
        >
          <q-item-section avatar>
            <q-icon name="o_bar_chart" />
          </q-item-section>
          <q-item-section>Analytics</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/dashboard/calendar"
          active-class="bg-lime-13 text-black"
          class="nav-item rounded-borders"
          style="border-radius: 12px; font-weight: 500"
        >
          <q-item-section avatar>
            <q-icon name="timeline" />
          </q-item-section>
          <q-item-section>Timeline</q-item-section>
        </q-item>



        <q-item
          clickable
          v-ripple
          to="/dashboard/organisation"
          active-class="bg-lime-13 text-black"
          class="nav-item rounded-borders"
          style="border-radius: 12px; font-weight: 500"
        >
          <q-item-section avatar>
            <q-icon name="o_domain" />
          </q-item-section>
          <q-item-section>Organisation</q-item-section>
        </q-item>


      </q-list>

      <q-space />

      <!-- Bottom Navigation -->
      <q-list class="q-gutter-y-sm" padding>
        <q-item
          clickable
          v-ripple
          to="/dashboard/notifications"
          active-class="bg-lime-13 text-black"
          class="nav-item rounded-borders"
        >
          <q-item-section avatar>
            <q-icon name="o_notifications" />
          </q-item-section>
          <q-item-section>Notifications</q-item-section>
          <q-item-section side>
            <q-badge v-if="unreadNotifications" color="lime-13" text-color="black" :label="unreadNotifications" rounded />
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple @click="handleLogout" class="nav-item rounded-borders">
          <q-item-section avatar>
            <q-icon name="o_logout" />
          </q-item-section>
          <q-item-section>Logout</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container class="bg-grey-1">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/notificationStore';

const router = useRouter();
const $q = useQuasar();
const leftDrawerOpen = ref(true);
const notificationStore = useNotificationStore();
const unreadNotifications = computed(() => notificationStore.unreadCount);

onMounted(() => {
  $q.dark.set(localStorage.getItem('tasky_dark_mode') === 'true');
  void notificationStore.fetchNotifications();
});

function handleLogout() {
  // Clear authentication data from localStorage
  sessionStorage.removeItem('tasky_user');
  sessionStorage.removeItem('tasky_token');
  sessionStorage.removeItem('pm_auth_token');
  sessionStorage.removeItem('pm_user_data');

  // Redirect to login page in same project
  router.push('/auth/login');
}


</script>

<style scoped>
.nav-item {
  color: #bdbdbd;
}
.q-item.q-router-link--active,
.q-item--active {
  background-color: #d8f760;
  color: #000 !important;
}
.bg-lime-13 {
  background-color: #d8f760 !important;
}
</style>
