<template>
  <q-layout view="hHh Lpr lFf" class="manager-app">
    <q-header class="topbar">
      <q-toolbar class="topbar__content">
        <q-btn class="mobile-menu" flat dense round icon="menu" aria-label="Open menu" @click="toggleLeftDrawer" />
        <router-link to="/dashboard" class="brand">Tasky<span>flow</span></router-link>
        <div class="topbar__context">Project operations workspace</div>
        <q-space />
        <q-input v-model="globalSearch" dense borderless class="global-search" placeholder="Search projects or tasks" clearable>
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <q-btn flat round icon="notifications_none" aria-label="Notifications">
          <q-badge floating color="negative" rounded>3</q-badge>
        </q-btn>
        <q-avatar size="34px" class="user-avatar">AM</q-avatar>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above :width="248" class="sidebar">
      <div class="sidebar__project">
        <div class="project-mark">TF</div>
        <div><strong>Acme studio</strong><span>Project manager</span></div>
      </div>
      <q-list padding class="nav-list">
        <q-item v-for="link in linksList" :key="link.label" clickable v-ripple :to="link.link" exact active-class="nav-item--active">
          <q-item-section avatar><q-icon :name="link.icon" /></q-item-section>
          <q-item-section>{{ link.label }}</q-item-section>
          <q-item-section v-if="link.badge" side><q-badge color="warning" text-color="dark">{{ link.badge }}</q-badge></q-item-section>
        </q-item>
      </q-list>
      <q-space />
      <div class="sidebar__footer">
        <q-item clickable v-ripple><q-item-section avatar><q-icon name="help_outline" /></q-item-section><q-item-section>Help center</q-item-section></q-item>
        <q-item clickable v-ripple><q-item-section avatar><q-icon name="settings" /></q-item-section><q-item-section>Settings</q-item-section></q-item>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
type ManagerLink = {
  label: string;
  caption: string;
  icon: string;
  link: string;
  badge?: string;
};

const linksList: ManagerLink[] = [
  { label: 'Overview', caption: 'Portfolio health', icon: 'space_dashboard', link: '/dashboard' },
  { label: 'Projects', caption: 'Your active work', icon: 'folder_open', link: '/projects' },
  { label: 'Tasks', caption: 'Across all projects', icon: 'checklist', link: '/tasks', badge: '8' },
  { label: 'Schedule', caption: 'Deadlines and phases', icon: 'calendar_month', link: '/projects' },
  { label: 'Analytics', caption: 'Trends and risks', icon: 'insights', link: '/analytics' },
];

const leftDrawerOpen = ref(false);
const globalSearch = ref('');

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>

<style scoped>
.manager-app { background: #f5f7fa; color: #152033; }
.topbar { background: #ffffff; color: #152033; border-bottom: 1px solid #e7ebf0; }
.topbar__content { min-height: 68px; padding: 0 28px; }
.brand { color: #152033; font-size: 21px; font-weight: 800; letter-spacing: -.5px; text-decoration: none; }
.brand span { color: #2a70d6; }
.topbar__context { color: #8994a5; font-size: 12px; margin-left: 26px; border-left: 1px solid #e2e6eb; padding-left: 26px; }
.global-search { width: 240px; margin-right: 18px; background: #f5f7fa; border-radius: 8px; padding: 0 10px; }
.user-avatar { background: #d9e8ff; color: #185bb6; font-size: 12px; font-weight: 700; margin-left: 14px; }
.sidebar { background: #10223b; color: #afbdd1; }
.sidebar :deep(.q-drawer__content) { display: flex; flex-direction: column; }
.sidebar__project { display: flex; align-items: center; gap: 12px; padding: 24px 22px; color: #ffffff; border-bottom: 1px solid #263751; }
.sidebar__project strong, .sidebar__project span { display: block; }
.sidebar__project strong { font-size: 14px; }
.sidebar__project span { color: #7f91aa; font-size: 11px; margin-top: 3px; }
.project-mark { display: grid; place-items: center; width: 34px; height: 34px; background: #2a70d6; color: #fff; border-radius: 9px; font-size: 11px; font-weight: 800; }
.nav-list { padding: 22px 12px; }
.nav-list :deep(.q-item) { min-height: 46px; border-radius: 7px; margin-bottom: 5px; color: #9bacbf; }
.nav-list :deep(.q-item__section--avatar) { min-width: 38px; }
.nav-list :deep(.q-item__label) { font-size: 13px; }
.nav-list :deep(.q-item--active), .nav-list :deep(.nav-item--active) { background: #1e3658; color: #ffffff; }
.nav-list :deep(.nav-item--active .q-icon) { color: #6da9ff; }
.sidebar__footer { border-top: 1px solid #263751; padding: 14px 12px 18px; }
.sidebar__footer :deep(.q-item) { min-height: 42px; color: #8fa0b8; font-size: 12px; }
.mobile-menu { display: none; }
@media (max-width: 800px) {
  .topbar__context, .global-search { display: none; }
  .topbar__content { padding: 0 16px; }
  .mobile-menu { display: inline-flex; margin-right: 8px; }
}
</style>
