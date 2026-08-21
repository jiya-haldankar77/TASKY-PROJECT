<template>
  <q-page class="manager-page">
    <div class="page-shell">
      <header class="page-header">
        <div>
          <div class="eyebrow">Manager workspace</div>
          <h1 class="page-title">Good morning, Alex</h1>
          <p class="page-subtitle">A clear view of delivery, capacity, and the work that needs your attention.</p>
        </div>
        <div class="header-actions">
          <q-input v-model="searchQuery" outlined dense bg-color="white" placeholder="Search workspace" class="search-input">
            <template #prepend><q-icon name="search" color="grey-6" /></template>
          </q-input>
          <q-btn unelevated no-caps color="dark" icon="person_add" label="Invite people" @click="inviteDialog = true" />
        </div>
      </header>

      <section class="metric-grid">
        <div v-for="metric in metrics" :key="metric.label" class="metric-card surface">
          <div class="metric-icon" :class="`metric-icon--${metric.tone}`"><q-icon :name="metric.icon" size="20px" /></div>
          <div class="metric-label">{{ metric.label }}</div>
          <div class="metric-value">{{ metric.value }}</div>
          <div class="metric-note">{{ metric.note }}</div>
        </div>
      </section>

      <section class="content-grid">
        <div class="surface projects-panel">
          <div class="panel-heading">
            <div><h2>Project health</h2><p>Progress is weighted from task completion and daily work-log activity.</p></div>
            <q-btn flat no-caps color="dark" label="View projects" to="/projects" />
          </div>
          <div class="project-list">
            <div v-for="project in visibleProjects" :key="project.name" class="project-row">
              <div class="project-mark" :style="{ background: project.color }">{{ project.name.charAt(0) }}</div>
              <div class="project-info"><div class="project-name">{{ project.name }}</div><div class="project-meta">{{ project.completedTasks }} of {{ project.totalTasks }} tasks complete · {{ project.daysLeft }} days left</div></div>
              <div class="project-progress"><div class="progress-line"><q-linear-progress :value="project.progress / 100" :color="healthColor(project.health)" size="8px" rounded /><span>{{ project.progress }}%</span></div><div class="health-label" :class="`health-${project.health.toLowerCase().replaceAll(' ', '-')}`"><q-icon :name="healthIcon(project.health)" size="15px" />{{ project.health }}</div></div>
            </div>
          </div>
        </div>

        <div class="surface attention-panel">
          <div class="panel-heading"><div><h2>Needs attention</h2><p>Signals from deadlines and work logs.</p></div><q-badge color="orange-1" text-color="orange-10" label="3 signals" /></div>
          <div class="attention-list">
            <div v-for="item in attentionItems" :key="item.title" class="attention-item"><div class="attention-dot" :class="`dot-${item.tone}`"></div><div><div class="attention-title">{{ item.title }}</div><div class="attention-note">{{ item.note }}</div></div><q-icon name="chevron_right" color="grey-5" /></div>
          </div>
          <q-btn outline no-caps color="dark" label="Review all tasks" to="/tasks" class="full-width" />
        </div>
      </section>

      <section class="bottom-grid">
        <div class="surface activity-panel"><div class="panel-heading"><div><h2>Recent activity</h2><p>Latest updates from your team.</p></div><q-btn flat round dense icon="more_horiz" /></div><div v-for="activity in activities" :key="activity.text" class="activity-row"><q-avatar size="34px" :color="activity.color" text-color="white">{{ activity.initials }}</q-avatar><div><div class="activity-text">{{ activity.text }}</div><div class="activity-time">{{ activity.time }}</div></div></div></div>
        <div class="surface workload-panel"><div class="panel-heading"><div><h2>Team capacity</h2><p>Current allocation across active work.</p></div><q-btn flat no-caps color="dark" label="Resources" to="/resources" /></div><div class="capacity-value">78<span>%</span></div><q-linear-progress :value="0.78" color="positive" size="12px" rounded /><div class="capacity-footer"><span><i class="legend-dot legend-dot--free"></i> 2 available</span><span><i class="legend-dot legend-dot--busy"></i> 4 allocated</span></div></div>
      </section>
    </div>

    <q-dialog v-model="inviteDialog">
      <q-card class="invite-card">
        <q-card-section><div class="eyebrow">Workspace access</div><h2>Invite a teammate</h2><p class="text-grey-7">Create a one-time code for an employee to join this workspace.</p></q-card-section>
        <q-card-section class="q-pt-none"><q-input v-model="inviteEmail" outlined label="Employee email" type="email" /><div v-if="inviteCode" class="invite-code"><span>{{ inviteCode }}</span><q-btn flat round icon="content_copy" @click="copyInviteCode" /></div></q-card-section>
        <q-card-actions align="right"><q-btn flat no-caps label="Cancel" v-close-popup /><q-btn unelevated color="dark" no-caps label="Generate invite code" @click="generateInvite" /></q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { createManagerInvite } from '../services/managerApi';

type Health = 'On Track' | 'Slightly Delayed' | 'At Risk' | 'Severely Delayed' | 'Completed';
const $q = useQuasar();
const searchQuery = ref('');
const inviteDialog = ref(false);
const inviteEmail = ref('');
const inviteCode = ref('');
const projects = [
  { name: 'E-Commerce Platform Redesign', color: '#4f46e5', progress: 72, completedTasks: 18, totalTasks: 24, daysLeft: 12, health: 'On Track' as Health },
  { name: 'Mobile Banking App', color: '#e76f51', progress: 41, completedTasks: 9, totalTasks: 22, daysLeft: 8, health: 'At Risk' as Health },
  { name: 'Internal Analytics Dashboard', color: '#16866b', progress: 100, completedTasks: 14, totalTasks: 14, daysLeft: 0, health: 'Completed' as Health },
  { name: 'Marketing Campaign Launch', color: '#d89b28', progress: 58, completedTasks: 7, totalTasks: 12, daysLeft: 21, health: 'Slightly Delayed' as Health },
];
const visibleProjects = computed(() => projects.filter((project) => project.name.toLowerCase().includes(searchQuery.value.toLowerCase())));
const metrics = [
  { label: 'Active projects', value: '3', note: '1 completed this quarter', icon: 'folder_open', tone: 'indigo' },
  { label: 'Delivery progress', value: '68%', note: '↑ 8% from last month', icon: 'trending_up', tone: 'green' },
  { label: 'Open tasks', value: '38', note: '11 due this week', icon: 'task_alt', tone: 'amber' },
  { label: 'At-risk work', value: '5', note: '2 need action today', icon: 'warning_amber', tone: 'red' },
];
const attentionItems = [{ title: 'Mobile Banking App is at risk', note: 'Progress is 18% behind expected pace', tone: 'red' }, { title: '3 work logs are missing', note: 'No update recorded in the last 2 days', tone: 'amber' }, { title: 'API integration deadline', note: 'Due in 3 days · 2 tasks remain', tone: 'indigo' }];
const activities = [{ initials: 'JM', color: 'indigo', text: 'Jordan marked API integration 80% complete', time: '18 minutes ago' }, { initials: 'SK', color: 'teal', text: 'Sam added a work log to the analytics project', time: '2 hours ago' }, { initials: 'AR', color: 'deep-orange', text: 'Ari joined via invite code', time: 'Yesterday' }];
const healthColor = (health: Health) => ({ 'On Track': 'positive', 'Slightly Delayed': 'warning', 'At Risk': 'orange', 'Severely Delayed': 'negative', Completed: 'teal' })[health];
const healthIcon = (health: Health) => health === 'Completed' ? 'check_circle' : health.includes('Risk') || health.includes('Delayed') ? 'warning' : 'check_circle_outline';
async function generateInvite() {
  try {
    inviteCode.value = (await createManagerInvite(inviteEmail.value)).code;
  } catch {
    inviteCode.value = `TASKY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    $q.notify({ message: 'Demo code created. Connect the API to issue a persisted invite.', color: 'warning' });
  }
}
function copyInviteCode() { void navigator.clipboard?.writeText(inviteCode.value); $q.notify({ message: 'Invite code copied', color: 'positive' }); }
</script>

<style scoped>
.manager-page { background: #f5f7fa; color: #172033; }
.page-shell { max-width: 1440px; margin: 0 auto; padding: 42px 48px 64px; }
.page-header, .panel-heading, .header-actions, .progress-line, .capacity-footer { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.eyebrow { color: #68758a; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; }
.page-title { margin: 8px 0 0; font-size: 34px; line-height: 1.1; letter-spacing: -.5px; }
.page-subtitle, .panel-heading p { margin: 8px 0 0; color: #718096; font-size: 13px; }
.search-input { width: 220px; }
.surface { background: #fff; border: 1px solid #e4e9ef; border-radius: 14px; box-shadow: 0 8px 24px rgba(31, 45, 61, .04); }
.metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 32px 0 20px; }
.metric-card { padding: 20px; position: relative; min-height: 142px; }
.metric-icon { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 16px; }.metric-icon--indigo { background: #e9e8ff; color: #4f46e5; }.metric-icon--green { background: #dff4ed; color: #16866b; }.metric-icon--amber { background: #fff1d4; color: #b57609; }.metric-icon--red { background: #ffe5e0; color: #d34b39; }
.metric-label { color: #718096; font-size: 12px; }.metric-value { font-size: 27px; font-weight: 700; margin-top: 2px; }.metric-note { color: #8a96a8; font-size: 11px; margin-top: 4px; }
.content-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(300px, .8fr); gap: 20px; }.bottom-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: 20px; margin-top: 20px; }
.projects-panel, .attention-panel, .activity-panel, .workload-panel { padding: 24px; }.panel-heading { align-items: flex-start; }.panel-heading h2 { margin: 0; font-size: 17px; }.panel-heading .q-btn { flex-shrink: 0; }
.project-list { margin-top: 24px; }.project-row { display: grid; grid-template-columns: 40px minmax(160px, 1fr) minmax(220px, 1.2fr); align-items: center; gap: 14px; padding: 17px 0; border-top: 1px solid #edf0f3; }.project-mark { color: #fff; display: grid; place-items: center; width: 38px; height: 38px; border-radius: 10px; font-weight: 700; }.project-name { font-size: 13px; font-weight: 700; }.project-meta { color: #8a96a8; font-size: 11px; margin-top: 5px; }.progress-line { gap: 12px; }.progress-line .q-linear-progress { flex: 1; }.progress-line span { font-size: 12px; font-weight: 700; }.health-label { display: flex; align-items: center; gap: 5px; font-size: 11px; margin-top: 9px; }.health-on-track, .health-completed { color: #16866b; }.health-slightly-delayed { color: #b57609; }.health-at-risk, .health-severely-delayed { color: #d34b39; }
.attention-list { margin: 20px 0 24px; }.attention-item { display: grid; grid-template-columns: 9px 1fr 18px; gap: 12px; align-items: start; padding: 15px 0; border-top: 1px solid #edf0f3; }.attention-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; }.dot-red { background: #d34b39; }.dot-amber { background: #d89b28; }.dot-indigo { background: #4f46e5; }.attention-title, .activity-text { font-size: 12px; font-weight: 700; }.attention-note, .activity-time { color: #8a96a8; font-size: 11px; margin-top: 4px; }
.activity-row { display: flex; gap: 12px; align-items: center; padding-top: 18px; }.capacity-value { font-size: 44px; font-weight: 700; margin: 28px 0 12px; }.capacity-value span { color: #8a96a8; font-size: 20px; }.capacity-footer { justify-content: flex-start; color: #718096; font-size: 11px; margin-top: 14px; }.legend-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }.legend-dot--free { background: #16866b; }.legend-dot--busy { background: #d89b28; }.invite-card { width: min(440px, calc(100vw - 32px)); border-radius: 14px; }.invite-card h2 { margin: 8px 0; }.invite-code { display: flex; align-items: center; justify-content: space-between; background: #f1f3f6; border: 1px dashed #aab4c2; padding: 10px 14px; margin-top: 16px; font-weight: 700; letter-spacing: 2px; }
@media (max-width: 900px) { .page-shell { padding: 28px 20px 48px; }.metric-grid { grid-template-columns: repeat(2, 1fr); }.content-grid, .bottom-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .page-header, .header-actions { align-items: stretch; flex-direction: column; }.search-input { width: 100%; }.page-title { font-size: 28px; }.metric-grid { gap: 10px; }.metric-card { padding: 15px; }.project-row { grid-template-columns: 36px 1fr; }.project-progress { grid-column: 2; }.projects-panel, .attention-panel, .activity-panel, .workload-panel { padding: 18px; } }
</style>
