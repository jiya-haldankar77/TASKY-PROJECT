<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar size="32px" class="q-mr-sm">
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg" />
          </q-avatar>
          Tasky
        </q-toolbar-title>

        <div class="row items-center q-gutter-md">
          <q-select
            v-model="selectedRole"
            :options="roleOptions"
            outlined
            dense
            bg-color="white"
            text-color="primary"
            label-color="primary"
            style="min-width: 150px"
            @update:model-value="handleRoleChange"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-select>
          <q-btn round flat>
            <q-avatar size="32px">
              <img :src="currentEmployee?.avatar || 'https://i.pravatar.cc/150?img=1'" />
            </q-avatar>
            <q-menu>
              <q-list style="min-width: 200px">
                <q-item clickable v-close-popup>
                  <q-item-section avatar>
                    <q-icon name="account_circle" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ currentEmployee?.name }}</q-item-label>
                    <q-item-label caption>{{ currentEmployee?.role }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup>
                  <q-item-section avatar>
                    <q-icon name="settings" />
                  </q-item-section>
                  <q-item-section>Settings</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="handleLogout">
                  <q-item-section avatar>
                    <q-icon name="logout" />
                  </q-item-section>
                  <q-item-section>Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-1">
      <q-list>
        <q-item-label header class="text-subtitle1 text-weight-bold text-primary">
          Navigation
        </q-item-label>

        <q-item
          v-for="link in navigationLinks"
          :key="link.label"
          clickable
          :to="link.link"
          :active="link.link === $route.path"
          active-class="bg-blue-1 text-primary"
        >
          <q-item-section avatar>
            <q-icon :name="link.icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ link.label }}</q-item-label>
            <q-item-label caption>{{ link.caption }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-md" />

        <q-item-label header class="text-subtitle2 text-weight-bold text-grey-7">
          Projects
        </q-item-label>

        <q-item
          v-for="project in projectsList"
          :key="project.id"
          clickable
          :to="`/projects/${project.id}`"
          active-class="bg-blue-1 text-primary"
        >
          <q-item-section avatar>
            <q-avatar :style="{ backgroundColor: project.color }" size="24px" text-color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ project.name }}</q-item-label>
            <q-item-label caption>{{ project.progress }}% complete</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge :color="getPriorityColor(project.priority)" class="text-capitalize">
              {{ project.priority }}
            </q-badge>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useTaskStore } from '@/stores/taskStore'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const $q = useQuasar()
const taskStore = useTaskStore()
const authStore = useAuthStore()

const leftDrawerOpen = ref(false)
const selectedRole = ref({ label: 'Project Manager', value: 'pm' })

const roleOptions = [
  { label: 'Project Manager', value: 'pm' },
  { label: 'Sarah Johnson', value: 'emp-1' },
  { label: 'Michael Chen', value: 'emp-2' },
  { label: 'Emily Davis', value: 'emp-3' },
  { label: 'James Wilson', value: 'emp-4' },
  { label: 'Lisa Anderson', value: 'emp-5' },
  { label: 'David Brown', value: 'emp-6' }
]

const currentEmployee = computed(() => taskStore.currentEmployee)
const projectsList = computed(() => taskStore.projectsList)

const navigationLinks = computed(() => {
  if (taskStore.currentRole === 'pm') {
    return [
      {
        label: 'Dashboard',
        caption: 'Overview & Analytics',
        icon: 'dashboard',
        link: '/dashboard'
      },
      {
        label: 'Projects',
        caption: 'Manage Projects',
        icon: 'folder',
        link: '/projects'
      },
      {
        label: 'Tasks',
        caption: 'All Tasks',
        icon: 'check_circle',
        link: '/tasks'
      },
      {
        label: 'Resources',
        caption: 'Team & Workload',
        icon: 'people',
        link: '/resources'
      },
      {
        label: 'Analytics',
        caption: 'Reports & Insights',
        icon: 'analytics',
        link: '/analytics'
      }
    ]
  } else {
    return [
      {
        label: 'My Dashboard',
        caption: 'My Tasks & Progress',
        icon: 'dashboard',
        link: '/employee-dashboard'
      },
      {
        label: 'My Tasks',
        caption: 'Assigned Tasks',
        icon: 'check_circle',
        link: '/my-tasks'
      },
      {
        label: 'Work Log',
        caption: 'Daily Updates',
        icon: 'edit_note',
        link: '/work-log'
      }
    ]
  }
})

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function handleRoleChange(option: { label: string; value: string }) {
  if (option.value === 'pm') {
    taskStore.switchRole('pm')
    void router.push('/dashboard')
  } else {
    taskStore.switchRole('employee', option.value)
    void router.push('/employee-dashboard')
  }
}

function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    critical: 'red',
    high: 'orange',
    medium: 'blue',
    low: 'green'
  }
  return colors[priority] || 'grey'
}

function handleLogout() {
  authStore.logout()
  $q.notify({
    type: 'positive',
    message: 'Logged out successfully',
    position: 'top',
    timeout: 2000
  })
  void router.push('/auth/login')
}
</script>
