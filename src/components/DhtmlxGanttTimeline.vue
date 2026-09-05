<template>
  <q-card flat bordered class="dhtmlx-roadmap-card timeline-card">
    <!-- DHTMLX GANTT CANVAS MOUNT -->
    <div class="gantt-canvas-wrapper timeline-chart-surface" :class="{ 'is-dark': isDark }">
      <div ref="ganttContainer" class="gantt-chart-viewport" />

      <!-- Empty State Overlay -->
      <div v-if="!hasTasks" class="gantt-no-data-overlay flex flex-center column q-pa-xl">
        <div class="text-subtitle1 text-weight-bold text-dark">No tasks to display</div>
        <div class="text-caption text-grey-6 text-center q-mt-xs" style="max-width: 320px">
          Try clearing search keywords or adjusting your schedule filters to view tasks.
        </div>
      </div>
    </div>

    <!-- 4. GANTT FOOTER ROW -->
    <div class="gantt-footer-row row items-center justify-between q-px-md q-py-sm">

      <div class="footer-right row items-center no-wrap text-caption text-grey-6 q-gutter-x-sm">
        <span> {{ visibleCount }} of {{ totalCount }} tasks</span>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { useQuasar } from 'quasar';

// The dashboard API returns plain JSON objects. Keep the component independent
// from a service-specific type module so it can be used by the PM stores.
export interface Task {
  id: number;
  task_id: number;
  title: string;
  project_id: number;
  project_name?: string;
  start_date?: string | null;
  deadline?: string | null;
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  expected_effort?: number | string | null;
  progress?: number | string | null;
  priority?: string | null;
  status?: string | null;
  schedules?: Array<{ schedule_date: string; allocated_hours: number | string }>;
  assignees?: Array<{ first_name?: string; last_name?: string }>;
  assigned_resource_ids?: number[];
  predecessor_task_ids?: number[];
  is_external?: boolean;
}

export interface Project {
  id?: number;
  project_id: number;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  progress?: number | string | null;
  status?: string | null;
  priority?: string | null;
}

export interface ResourceUser {
  id?: number;
  user_id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
}

export interface GanttTimelineProps {
  tasks: Task[];
  projects?: Project[];
  resources?: ResourceUser[];
  title?: string;
  initialScale?: 'hour' | 'day' | 'week' | 'month';
  groupByProject?: boolean;
  searchQuery?: string;
  scale?: 'hour' | 'day' | 'week' | 'month';
  showExtraColumns?: boolean;
  showDependencies?: boolean;
}

export interface TaskWorkSegment {
  startDate: Date;
  endDate: Date;
  startStr: string;
  endStr: string;
  durationDays: number;
  allocatedHours: number;
  daysCount: number;
}

export interface DhtmlxGanttTaskItem {
  id: string | number;
  text: string;
  start_date: string | Date;
  end_date: string | Date;
  duration?: number;
  progress?: number;
  parent?: string | number;
  type?: 'project' | 'task' | 'milestone';
  open?: boolean;
  priority?: string;
  status?: string;
  project_name?: string;
  project_id?: number;
  assignee_name?: string;
  task_count?: number;
  segments?: TaskWorkSegment[];
  is_external?: boolean;
  $open?: boolean;
}

const props = withDefaults(defineProps<GanttTimelineProps>(), {
  projects: () => [],
  resources: () => [],
  title: 'Gantt Timeline Roadmap',
  initialScale: 'week',
  groupByProject: true,
});

const emit = defineEmits<{
  (e: 'task-click', task: Task): void;
  (
    e: 'task-updated',
    event: { taskId: number; title: string; startDate: string; endDate: string; progress: number },
  ): void;
  (e: 'link-added', event: { sourceTaskId: number; targetTaskId: number }): void;
  (e: 'date-range-changed', rangeText: string): void;
  (e: 'update:searchQuery', value: string): void;
  (e: 'update:scale', value: 'hour' | 'day' | 'week' | 'month'): void;
  (e: 'update:groupByProject', value: boolean): void;
  (e: 'update:showExtraColumns', value: boolean): void;
  (e: 'update:showDependencies', value: boolean): void;
}>();

const $q = useQuasar();
const isDark = computed(() => $q.dark.isActive);

const ganttContainer = ref<HTMLElement | null>(null);
const internalSearchQuery = ref(props.searchQuery || '');
const STORAGE_KEY_SCALE = 'taskflow_gantt_scale';
const storedScale = localStorage.getItem(STORAGE_KEY_SCALE) as
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | null;
const activeScale = ref<'hour' | 'day' | 'week' | 'month'>(
  props.scale || storedScale || props.initialScale,
);

watch(activeScale, (newScale) => {
  if (newScale) {
    localStorage.setItem(STORAGE_KEY_SCALE, newScale);
    emit('update:scale', newScale);
  }
});
watch(
  () => props.searchQuery,
  (value) => {
    internalSearchQuery.value = value || '';
  },
);
watch(internalSearchQuery, (value) => emit('update:searchQuery', value));
watch(
  () => props.scale,
  (value) => {
    if (value && value !== activeScale.value) activeScale.value = value;
  },
);
const isHierarchical = ref(props.groupByProject);
const showDependencies = ref(props.showDependencies ?? true);
const displayDateRange = ref('');
const hasTasks = ref(true);

// Cache maps for lookup
const resourceMap = computed(() => {
  const map = new Map<number, ResourceUser>();
  props.resources.forEach((r) => map.set(r.user_id, r));
  return map;
});

const projectMap = computed(() => {
  const map = new Map<number, Project>();
  props.projects.forEach((p) => map.set(p.project_id, p));
  return map;
});

const totalCount = computed(() => props.tasks.length);
const visibleCount = ref(0);
const showExtraColumns = ref(props.showExtraColumns ?? false);
const projectOpenStates = ref<Record<string, boolean>>({});

watch(
  () => props.groupByProject,
  (value) => {
    if (value !== undefined) isHierarchical.value = value;
  },
);
watch(
  () => props.showExtraColumns,
  (value) => {
    if (value !== undefined) showExtraColumns.value = value;
  },
);
watch(
  () => props.showDependencies,
  (value) => {
    if (value !== undefined) showDependencies.value = value;
  },
);

// ----------------------------------------------------
// Date & Segmentation Utilities
// ----------------------------------------------------
function parseDateLocal(dateStr: string): Date {
  const cleanStr = String(dateStr).split('T')[0]!;
  const parts = cleanStr.split('-');
  const y = parseInt(parts[0]!, 10);
  const m = parseInt(parts[1]!, 10) - 1;
  const d = parseInt(parts[2]!, 10);
  return new Date(y, m, d, 0, 0, 0, 0);
}

function parseIsoToDate(val: string | Date | undefined | null): Date | null {
  if (!val) return null;
  if (val instanceof Date) return new Date(val.getTime());

  // Try native parse first for exact datetime
  const d = new Date(String(val).replace(' ', 'T'));
  if (!isNaN(d.getTime())) return d;

  return parseDateLocal(String(val));
}

function addDays(d: Date, days: number): Date {
  const res = new Date(d.getTime());
  res.setDate(res.getDate() + days);
  return res;
}

function snapToGanttWorkTime(d: Date | null): Date | null {
  if (!d) return null;
  const next = new Date(d.getTime());
  const h = next.getHours();
  if (h >= 18) {
    next.setDate(next.getDate() + 1);
    next.setHours(10, 0, 0, 0);
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
  } else if (h < 10) {
    next.setHours(10, 0, 0, 0);
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
  }
  return next;
}

function getMacroDate(d: Date | null, isStart: boolean): Date | null {
  if (!d) return null;
  const next = new Date(d.getTime());
  if (isStart) {
    if (next.getHours() <= 10) {
      next.setHours(0, 0, 0, 0);
    }
  } else {
    if (next.getHours() >= 18) {
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
    }
  }
  return next;
}

function formatDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatGanttDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${sec}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Calculates continuous work segments from task_schedules, creating gaps on
 * non-working days, holidays, weekends, leave, or 0-allocation dates.
 */
function getTaskWorkSegments(task: Task): {
  segments: TaskWorkSegment[];
  earliestStart: Date;
  latestEnd: Date;
  totalHours: number;
} {
  const validSchedules = (task.schedules || [])
    .filter((s) => Number(s.allocated_hours) > 0)
    .sort((a, b) => {
      const dateA = String(a.schedule_date).split('T')[0]!;
      const dateB = String(b.schedule_date).split('T')[0]!;
      return dateA.localeCompare(dateB);
    });

  if (validSchedules.length > 0) {
    const segments: TaskWorkSegment[] = [];
    let currentSegSchedules: typeof validSchedules = [];

    for (let i = 0; i < validSchedules.length; i++) {
      const curr = validSchedules[i]!;
      const currDateStr = String(curr.schedule_date).split('T')[0]!;

      if (currentSegSchedules.length === 0) {
        currentSegSchedules.push(curr);
      } else {
        const lastInSeg = currentSegSchedules[currentSegSchedules.length - 1]!;
        const lastDateStr = String(lastInSeg.schedule_date).split('T')[0]!;
        const lastDate = parseDateLocal(lastDateStr);
        const expectedNextDateStr = formatDateIso(addDays(lastDate, 1));

        if (currDateStr === expectedNextDateStr) {
          // Contiguous working day
          currentSegSchedules.push(curr);
        } else {
          // Gap detected (weekend, holiday, leave, non-working day)
          const segStartStr = String(currentSegSchedules[0]!.schedule_date).split('T')[0]!;
          const segEndStr = String(lastInSeg.schedule_date).split('T')[0]!;
          const segStartDate = parseDateLocal(segStartStr);
          const segEndDate = addDays(parseDateLocal(segEndStr), 1);
          const segHours = currentSegSchedules.reduce(
            (sum, s) => sum + Number(s.allocated_hours),
            0,
          );

          segments.push({
            startDate: segStartDate,
            endDate: segEndDate,
            startStr: segStartStr,
            endStr: segEndStr,
            durationDays: Math.max(
              1,
              Math.round((segEndDate.getTime() - segStartDate.getTime()) / (24 * 60 * 60 * 1000)),
            ),
            allocatedHours: Math.round(segHours * 10) / 10,
            daysCount: currentSegSchedules.length,
          });

          currentSegSchedules = [curr];
        }
      }
    }

    if (currentSegSchedules.length > 0) {
      const segStartStr = String(currentSegSchedules[0]!.schedule_date).split('T')[0]!;
      const lastInSeg = currentSegSchedules[currentSegSchedules.length - 1]!;
      const segEndStr = String(lastInSeg.schedule_date).split('T')[0]!;
      const segStartDate = parseDateLocal(segStartStr);
      const segEndDate = addDays(parseDateLocal(segEndStr), 1);
      const segHours = currentSegSchedules.reduce((sum, s) => sum + Number(s.allocated_hours), 0);

      segments.push({
        startDate: segStartDate,
        endDate: segEndDate,
        startStr: segStartStr,
        endStr: segEndStr,
        durationDays: Math.max(
          1,
          Math.round((segEndDate.getTime() - segStartDate.getTime()) / (24 * 60 * 60 * 1000)),
        ),
        allocatedHours: Math.round(segHours * 10) / 10,
        daysCount: currentSegSchedules.length,
      });
    }

    const earliestStart = segments[0]!.startDate;
    const latestEnd = segments[segments.length - 1]!.endDate;
    const totalHours = segments.reduce((sum, s) => sum + s.allocatedHours, 0);

    return {
      segments,
      earliestStart,
      latestEnd,
      totalHours: Math.round(totalHours * 10) / 10,
    };
  }

  // Fallback: No schedule allocations yet (e.g. unassigned or pending recalculation)
  const rawStart = task.planned_start || task.actual_start || task.start_date;
  const rawEnd = task.planned_end || task.deadline || task.actual_end;
  const startDate = rawStart ? parseDateLocal(rawStart) : new Date();
  startDate.setHours(0, 0, 0, 0);

  const rawEndDate = rawEnd ? parseDateLocal(rawEnd) : addDays(startDate, 1);
  rawEndDate.setHours(0, 0, 0, 0);

  const endDate =
    rawEndDate.getTime() <= startDate.getTime() ? addDays(startDate, 1) : addDays(rawEndDate, 1);

  const durationDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
  );
  const fallbackHours = Number(task.expected_effort) || 0;

  const singleSegment: TaskWorkSegment = {
    startDate,
    endDate,
    startStr: formatDateIso(startDate),
    endStr: formatDateIso(addDays(endDate, -1)),
    durationDays,
    allocatedHours: fallbackHours,
    daysCount: durationDays,
  };

  return {
    segments: [singleSegment],
    earliestStart: startDate,
    latestEnd: endDate,
    totalHours: fallbackHours,
  };
}

// ----------------------------------------------------
// DHTMLX Configuration & Column Definitions
// ----------------------------------------------------
function applyColumnsConfig() {
  const baseColumn = {
    name: 'text',
    label: 'TASK & PROJECT',
    tree: true,
    width: showExtraColumns.value ? 190 : 250,
    min_width: 180,
    resize: true,
    template: (task: DhtmlxGanttTaskItem) => {
      const text = escapeHtml(task.text || '');
      if (task.type === 'project') {
        const count = task.task_count || 0;
        return (
          `<div class="gantt-col-project" title="${text}">` +
          `<strong class="project-title ellipsis">${text}</strong>` +
          `<span class="task-count-pill">${count} ${count === 1 ? 'task' : 'tasks'}</span>` +
          `</div>`
        );
      }
      if (task.is_external) {
        return (
          `<div class="gantt-col-task is-external-task" title="External / Other Project Task (Details hidden)">` +
          `<span class="task-title ellipsis text-grey-7" style="font-style: italic;">${text}</span>` +
          `</div>`
        );
      }
      return (
        `<div class="gantt-col-task" title="${text}">` +
        `<span class="task-title ellipsis">${text}</span>` +
        `</div>`
      );
    },
  };

  const extraColumns = [
    {
      name: 'status',
      label: 'STATUS',
      align: 'center',
      width: 95,
      min_width: 75,
      max_width: 110,
      resize: true,
      template: (task: DhtmlxGanttTaskItem) => {
        if (task.is_external) return '<span class="text-grey-6 text-caption"> Busy</span>';
        if (!task.status) return '<span class="text-muted">—</span>';
        const s = task.status.toUpperCase();
        let label = task.status.replace(/_/g, ' ');
        let sClass = 's-unassigned';

        if (s === 'COMPLETED') {
          label = 'Completed';
          sClass = 's-completed';
        } else if (s === 'IN_PROGRESS' || s === 'ACTIVE') {
          label = 'In Progress';
          sClass = 's-in-progress';
        } else if (s === 'SCHEDULED') {
          label = 'Scheduled';
          sClass = 's-scheduled';
        } else if (s === 'UNASSIGNED') {
          label = 'Unassigned';
          sClass = 's-unassigned';
        }

        const isProj = task.type === 'project';
        return `<span class="status-badge ${isProj ? 'is-project-status' : ''} ${sClass}" title="Status: ${label}"><span class="status-dot"></span><span class="badge-text">${label}</span></span>`;
      },
    },
    {
      name: 'priority',
      label: 'PRIORITY',
      align: 'center',
      width: 80,
      min_width: 65,
      max_width: 90,
      resize: true,
      template: (task: DhtmlxGanttTaskItem) => {
        if (task.is_external) return '<span class="text-grey-5">—</span>';
        if (!task.priority) return '<span class="text-muted">—</span>';
        const p = task.priority.toLowerCase();
        const pLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase();
        return `<span class="priority-badge p-${p}" title="Priority: ${pLabel}">${pLabel}</span>`;
      },
    },
    {
      name: 'duration',
      label: 'DURATION',
      align: 'center',
      width: 65,
      min_width: 50,
      max_width: 80,
      resize: true,
      template: (task: DhtmlxGanttTaskItem) => {
        const dur = Math.max(1, Math.round(Number(task.duration) || 1));
        const isProj = task.type === 'project';
        const daysLabel = dur === 1 ? '1 day' : `${dur} days`;
        return `<span class="duration-badge ${isProj ? 'project-dur-badge' : ''}" title="Duration: ${daysLabel}">${dur}d</span>`;
      },
    },
  ];

  if (showExtraColumns.value) {
    
    (gantt.config as any).columns = [baseColumn, ...extraColumns];
    gantt.config.grid_width = 430;
  } else {
    
    (gantt.config as any).columns = [baseColumn];
    gantt.config.grid_width = 250;
  }
}

function configureGanttEngine() {
  gantt.plugins({
    marker: true,
    tooltip: false,
  });

  gantt.config.date_format = '%Y-%m-%d %H:%i:%s';
  gantt.config.xml_date = '%Y-%m-%d %H:%i:%s';

  // Enable work time logic
  gantt.config.work_time = true;

  gantt.config.skip_off_time = true;

gantt.setWorkTime({
  hours: ['10:00-18:00']
});

// Saturday
gantt.setWorkTime({
  day: 6,
  hours: false
});

// Sunday
gantt.setWorkTime({
  day: 0,
  hours: false
});

  // Layout Dimensions
  gantt.config.row_height = 44;
  gantt.config.bar_height = 28;
  gantt.config.grid_resize = true;
  gantt.config.fit_tasks = false;
  gantt.config.smart_rendering = true;
  gantt.config.preserve_scroll = true;

  // Interactivity (Display-Only for Task Schedule / Progress)
  gantt.config.drag_move = false;
  gantt.config.drag_resize = false;
  gantt.config.drag_progress = false;
  gantt.config.drag_links = false;
  gantt.config.details_on_dblclick = false;
  gantt.config.details_on_click = false;
  gantt.config.details_on_create = false;
  gantt.config.show_quick_info = false;
  gantt.config.select_task = false;
  gantt.config.open_tree_initially = true;

  // Apply column configuration
  applyColumnsConfig();

  // Custom Task Bar CSS Classes
  
  (gantt.templates as any).task_class = (_start: Date, _end: Date, task: DhtmlxGanttTaskItem) => {
    if (task.type === 'project') {
      return 'dhtmlx-bar-project';
    }
    if (task.is_external) {
      return 'dhtmlx-bar-task dhtmlx-bar-external';
    }
    const classes = ['dhtmlx-bar-task'];
    if (task.priority) {
      classes.push(`bar-p-${task.priority.toLowerCase()}`);
    }
    if (task.status) {
      classes.push(`bar-s-${task.status.toLowerCase().replace('_', '-')}`);
    }
    return classes.join(' ');
  };

  // Custom Task Text Template inside Bar (Projects use project summary bar; tasks render discrete segmented pills)
  
  (gantt.templates as any).task_text = (start: Date, _end: Date, task: DhtmlxGanttTaskItem) => {
    const pct = Math.round((task.progress || 0) * 100);
    const text = escapeHtml(task.text || '');

    if (task.type === 'project') {
      const count = task.task_count || 0;
      return (
        `<div class="gantt-bar-content-wrapper is-project">` +
        `<span class="gantt-bar-pct-badge project-pct">${pct}%</span>` +
        `<span class="gantt-bar-title is-project-title ellipsis"> ${text} · ${count} ${count === 1 ? 'task' : 'tasks'}</span>` +
        `</div>`
      );
    }

    if (task.is_external) {
      return (
        `<div class="gantt-segments-container">` +
        `<div class="gantt-segment-pill bar-external-pill" style="left: 0; width: 100%;">` +
        `<span class="segment-title ellipsis">${text}</span>` +
        `</div>` +
        `</div>`
      );
    }

    const segments = task.segments || [];
    if (segments.length === 0) {
      const pClass = `bar-p-${(task.priority || 'medium').toLowerCase()}`;
      const sClass = `bar-s-${(task.status || 'scheduled').toLowerCase().replace('_', '-')}`;
      const assignee = task.assignee_name ? ` (${escapeHtml(task.assignee_name)})` : '';
      return (
        `<div class="gantt-segments-container">` +
        `<div class="gantt-segment-pill ${pClass} ${sClass}" style="left: 0; width: 100%;">` +
        `<div class="segment-progress-fill" style="width: ${pct}%;"></div>` +
        `<span class="segment-pct-badge">${pct}%</span>` +
        `<span class="segment-title ellipsis">${text}${assignee}</span>` +
        `</div>` +
        `</div>`
      );
    }

    const taskStartD = parseIsoToDate(task.start_date) || start;
    const taskEndD = parseIsoToDate(task.end_date) || _end;
    const taskStartX = gantt.posFromDate(taskStartD);
    const taskEndX = gantt.posFromDate(taskEndD);
    const taskTotalWidth = Math.max(1, taskEndX - taskStartX);

    const pClass = `bar-p-${(task.priority || 'medium').toLowerCase()}`;
    const sClass = `bar-s-${(task.status || 'scheduled').toLowerCase().replace('_', '-')}`;

    const segHtmlList = segments.map((seg, index) => {
      const isFirst = index === 0;
      const isLast = index === segments.length - 1;

      const actualSegStart = isFirst
        ? taskStartD
        : (activeScale.value === 'hour'
            ? snapToGanttWorkTime(seg.startDate)
            : getMacroDate(seg.startDate, true)) || seg.startDate;
      const actualSegEnd = isLast
        ? taskEndD
        : (activeScale.value === 'hour'
            ? snapToGanttWorkTime(seg.endDate)
            : getMacroDate(seg.endDate, false)) || seg.endDate;

      const segStartX = gantt.posFromDate(actualSegStart);
      const segEndX = gantt.posFromDate(actualSegEnd);
      const segLeft = Math.max(0, segStartX - taskStartX);
      let segWidth = Math.max(2, segEndX - segStartX);

      if (segLeft + segWidth > taskTotalWidth) {
        segWidth = Math.max(2, taskTotalWidth - segLeft);
      }

      const hoursBadge =
        seg.allocatedHours > 0
          ? `<span class="segment-hours-badge">${seg.allocatedHours}h</span>`
          : '';

      let innerContent: string;
      if (segWidth >= 120) {
        const assignee = task.assignee_name ? ` (${escapeHtml(task.assignee_name)})` : '';
        innerContent =
          `<span class="segment-pct-badge">${pct}%</span>` +
          `<span class="segment-title ellipsis">${text}${assignee}</span>` +
          hoursBadge;
      } else if (segWidth >= 60) {
        innerContent = `<span class="segment-pct-badge">${pct}%</span>` + hoursBadge;
      } else {
        innerContent = hoursBadge || `<span class="segment-pct-badge">${pct}%</span>`;
      }

      return (
        `<div class="gantt-segment-pill ${pClass} ${sClass}" style="left: ${segLeft}px; width: ${segWidth}px;">` +
        `<div class="segment-progress-fill" style="width: ${pct}%;"></div>` +
        innerContent +
        `</div>`
      );
    });

    return `<div class="gantt-segments-container">${segHtmlList.join('')}</div>`;
  };

  // Custom Grid Row Class
  
  (gantt.templates as any).grid_row_class = (
    _start: Date,
    _end: Date,
    task: DhtmlxGanttTaskItem,
  ) => {
    if (task.type === 'project') {
      return 'dhtmlx-grid-row-project';
    }
    if (task.is_external) {
      return 'dhtmlx-grid-row-task is-external-row';
    }
    return 'dhtmlx-grid-row-task';
  };

  // Tooltip Template with Segments Breakdown
  
  // Hover cards are intentionally disabled; task details are opened from the
  // task page instead of appearing over the timeline.
  (gantt.templates as any).tooltip_text = () => '';

  // Add Today Marker
  try {
    gantt.addMarker({
      start_date: new Date(),
      css: 'dhtmlx-today-marker',
      text: 'TODAY',
      title: 'Current Date',
    });
  } catch {
    // Marker already registered
  }
}

// ----------------------------------------------------
// Scale Configuration (Day, Week, Month)
// ----------------------------------------------------
function applyScaleMode(scale: 'hour' | 'day' | 'week' | 'month') {
  if (scale === 'hour') {
  gantt.config.scale_height = 50;
  gantt.config.min_column_width = 30;

  gantt.config.scales = [
    { unit: 'day', step: 1, format: '%d %M' },
    { unit: 'hour', step: 1, format: '%H' },
  ];
} else if (scale === 'day') {
    gantt.config.scale_height = 50;
    gantt.config.min_column_width = 46;
    gantt.config.scales = [
      {
        unit: 'month',
        step: 1,
        format: (date: Date) =>
          date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase(),
      },
      { unit: 'day', step: 1, format: '%d' },
    ];
  } else if (scale === 'month') {
    gantt.config.scale_height = 50;
    gantt.config.min_column_width = 80;
    gantt.config.scales = [
      { unit: 'year', step: 1, format: '%Y' },
      {
        unit: 'month',
        step: 1,
        format: (date: Date) => date.toLocaleDateString(undefined, { month: 'long' }).toUpperCase(),
      },
    ];
  } else {
    // Week Mode (Default: JULY 2026 / WEEK #30)
    gantt.config.scale_height = 50;
    gantt.config.min_column_width = 54;
    gantt.config.scales = [
      {
        unit: 'month',
        step: 1,
        format: (date: Date) =>
          date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase(),
      },
      {
        unit: 'week',
        step: 1,
        format: (date: Date) => `${getWeekNumber(date)}`,
      },
    ];
  }
}

function getWeekNumber(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

// ----------------------------------------------------
// Framing & Date Bounds Computation
// ----------------------------------------------------
function applyScaleAwareFraming(visibleTasks: Task[]) {
  if (!visibleTasks.length) {
    const now = new Date();
    gantt.config.start_date = new Date(now.getFullYear(), now.getMonth(), 1);
    gantt.config.end_date = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    return;
  }

  let minTime = Infinity;
  let maxTime = -Infinity;

  visibleTasks.forEach((t) => {
    const { earliestStart, latestEnd } = getTaskWorkSegments(t);
    const startMs = earliestStart.getTime();
    const endMs = latestEnd.getTime();
    if (!isNaN(startMs) && startMs < minTime) minTime = startMs;
    if (!isNaN(endMs) && endMs > maxTime) maxTime = endMs;
  });

  if (minTime === Infinity || maxTime === -Infinity) {
    const now = new Date();
    minTime = now.getTime();
    maxTime = now.getTime() + 14 * 24 * 60 * 60 * 1000;
  }

  const minDate = new Date(minTime);
  const maxDate = new Date(maxTime);
  const scale = activeScale.value;

  if (scale === 'hour' || scale === 'day') {
    const start = new Date(minDate);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(maxDate);
    end.setDate(end.getDate() + 2);
    end.setHours(0, 0, 0, 0);

    gantt.config.start_date = start;
    gantt.config.end_date = end;
  } else if (scale === 'week') {
    const start = new Date(minDate);
    const startDay = start.getDay();
    const startDiff = start.getDate() - startDay + (startDay === 0 ? -6 : 1);
    start.setDate(startDiff - 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(maxDate);
    const endDay = end.getDay();
    const endDiff = end.getDate() + (endDay === 0 ? 0 : 7 - endDay);
    end.setDate(endDiff + 7);
    end.setHours(0, 0, 0, 0);

    gantt.config.start_date = start;
    gantt.config.end_date = end;
  } else if (scale === 'month') {
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 1);
    gantt.config.start_date = start;
    gantt.config.end_date = end;
  }
}

// ----------------------------------------------------
// Data Transformation (Project Hierarchy & Finish-to-Start Links)
// ----------------------------------------------------
function buildGanttDataset() {
  const query = internalSearchQuery.value.trim().toLowerCase();

  const filteredTasks = props.tasks.filter((t) => {
    if (query) {
      const matchTitle = t.title.toLowerCase().includes(query);
      const pName = projectMap.value.get(t.project_id)?.name.toLowerCase() || '';
      if (!matchTitle && !pName.includes(query)) return false;
    }
    return true;
  });

  visibleCount.value = filteredTasks.length;
  hasTasks.value = filteredTasks.length > 0;

  applyScaleAwareFraming(filteredTasks);

  const data: Array<Record<string, unknown>> = [];
  const links: Array<Record<string, unknown>> = [];

  const resolveStartDate = (d: Date | null) =>
    activeScale.value === 'hour' ? snapToGanttWorkTime(d) : getMacroDate(d, true);

  const resolveEndDate = (d: Date | null) =>
    activeScale.value === 'hour' ? snapToGanttWorkTime(d) : getMacroDate(d, false);

  if (isHierarchical.value) {
    // Group tasks by project
    const tasksByProjectId = new Map<number, Task[]>();
    filteredTasks.forEach((t) => {
      const pId = t.project_id || 0;
      if (!tasksByProjectId.has(pId)) {
        tasksByProjectId.set(pId, []);
      }
      tasksByProjectId.get(pId)!.push(t);
    });

    tasksByProjectId.forEach((projectTasks, pId) => {
      const p =
        projectMap.value.get(pId) ||
        ({
          project_id: pId,
          name: projectTasks[0]?.project_name || `Project #${pId}`,
          status: 'ACTIVE',
          priority: 'MEDIUM',
          progress: 0,
        } as Project);

      let earliestStart: Date | null = null;
      let latestEnd: Date | null = null;
      let totalWeightedProgress = 0;
      let totalDuration = 0;

      const childTaskDataItems: Array<Record<string, unknown>> = [];

      projectTasks.forEach((t) => {
        const { segments, earliestStart: tStart, latestEnd: tEnd } = getTaskWorkSegments(t);
        const dur = Math.max(
          1,
          Math.round((tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24)),
        );
        const prog = Number(t.progress) || 0;

        if (!earliestStart || tStart < earliestStart) earliestStart = tStart;
        if (!latestEnd || tEnd > latestEnd) latestEnd = tEnd;

        totalWeightedProgress += prog * dur;
        totalDuration += dur;

        const firstAssigneeId = t.assigned_resource_ids?.[0];
        const resourceObj = firstAssigneeId ? resourceMap.value.get(firstAssigneeId) : undefined;

        childTaskDataItems.push({
          id: t.task_id,
          text: t.title,
          start_date: formatGanttDate(
            resolveStartDate(parseIsoToDate(t.actual_start || t.planned_start) || tStart)!,
          ),
          end_date: formatGanttDate(
            resolveEndDate(parseIsoToDate(t.actual_end || t.planned_end) || tEnd)!,
          ),
          progress: (Number(t.progress) || 0) / 100,
          parent: `proj_${p.project_id}`,
          priority: t.priority,
          status: t.status,
          project_name: p.name,
          assignee_name: resourceObj?.name,
          type: 'task',
          segments,
          is_external: Boolean(t.is_external),
        });
      });

      const startObj = earliestStart || new Date();
      const endObj = latestEnd || addDays(startObj, 1);

      const calculatedProgress =
        totalDuration > 0
          ? totalWeightedProgress / totalDuration / 100
          : projectTasks.length > 0
            ? projectTasks.reduce((sum, t) => sum + (Number(t.progress) || 0), 0) /
              (projectTasks.length * 100)
            : 0;

      const projNodeId = `proj_${p.project_id}`;
      const isProjectOpen =
        projectOpenStates.value[projNodeId] !== undefined
          ? projectOpenStates.value[projNodeId]
          : true;

      // Add Project Summary Row
      data.push({
        id: projNodeId,
        text: p.name,
        start_date: formatGanttDate(resolveStartDate(startObj)!),
        end_date: formatGanttDate(resolveEndDate(endObj)!),
        progress: Math.min(1, Math.max(0, calculatedProgress)),
        type: 'project',
        open: isProjectOpen,
        $open: isProjectOpen,
        project_id: p.project_id,
        task_count: projectTasks.length,
        status: p.status,
        priority: p.priority,
      });

      // Add Child Tasks
      childTaskDataItems.forEach((item) => data.push(item));
    });
  } else {
    // Flat task list
    filteredTasks.forEach((t) => {
      const { segments, earliestStart: tStart, latestEnd: tEnd } = getTaskWorkSegments(t);

      const p = projectMap.value.get(t.project_id);
      const firstAssigneeId = t.assigned_resource_ids?.[0];
      const resourceObj = firstAssigneeId ? resourceMap.value.get(firstAssigneeId) : undefined;

      data.push({
        id: t.task_id,
        text: t.title,
        start_date: formatGanttDate(
          resolveStartDate(parseIsoToDate(t.actual_start || t.planned_start) || tStart)!,
        ),
        end_date: formatGanttDate(
          resolveEndDate(parseIsoToDate(t.actual_end || t.planned_end) || tEnd)!,
        ),
        progress: (Number(t.progress) || 0) / 100,
        priority: t.priority,
        status: t.status,
        project_name: p?.name || '—',
        assignee_name: resourceObj?.name,
        type: 'task',
        segments,
        is_external: Boolean(t.is_external),
      });
    });
  }

  // Predecessor Dependency Links (connecting task to task)
  if (showDependencies.value) {
    let linkCounter = 1;
    filteredTasks.forEach((t) => {
      if (t.predecessor_task_ids && t.predecessor_task_ids.length > 0) {
        t.predecessor_task_ids.forEach((predId) => {
          if (filteredTasks.some((other) => other.task_id === predId)) {
            links.push({
              id: linkCounter++,
              source: predId,
              target: t.task_id,
              type: '0', // Finish-to-Start
            });
          }
        });
      }
    });
  }

  return { data, links };
}

function updateDateRangeHeader() {
  const state = gantt.getState();
  if (!state.min_date || !state.max_date) {
    displayDateRange.value = '';
    return;
  }

  const minD = new Date(state.min_date);
  const maxD = new Date(state.max_date);

  let displayEnd = maxD;
  if (maxD.getHours() === 0 && maxD.getMinutes() === 0 && maxD.getSeconds() === 0) {
    displayEnd = new Date(maxD.getTime() - 1000 * 60 * 60 * 24);
  }

  const text = `${formatDate(minD)} – ${formatDate(displayEnd)}`;
  displayDateRange.value = text;
  emit('date-range-changed', text);
}

// ----------------------------------------------------
// UI Action Handlers
// ----------------------------------------------------
function refreshGantt() {
  if (!ganttContainer.value) return;

  applyColumnsConfig();
  applyScaleMode(activeScale.value);
  const dataset = buildGanttDataset();

  gantt.clearAll();
  
  gantt.parse(dataset as any);
  gantt.render();

  updateDateRangeHeader();
}


function setScale(scale: 'hour' | 'day' | 'week' | 'month') {
  activeScale.value = scale;
  refreshGantt();
}


function expandAll() {
  gantt.eachTask((task: any) => {
    task.$open = true;
    task.open = true;
    if (String(task.id).startsWith('proj_')) {
      projectOpenStates.value[String(task.id)] = true;
    }
  });
  gantt.render();
}

function collapseAll() {
  gantt.eachTask((task: any) => {
    task.$open = false;
    task.open = false;
    if (String(task.id).startsWith('proj_')) {
      projectOpenStates.value[String(task.id)] = false;
    }
  });
  gantt.render();
}

function scrollToToday() {
  try {
    gantt.showDate(new Date());
    updateDateRangeHeader();
  } catch {
    // Ignore
  }
}

// ----------------------------------------------------
// Lifecycle Hooks & Event Listeners
// ----------------------------------------------------
let onTaskClickId: string | null = null;
let onBeforeDragId: string | null = null;
let onBeforeLinkId: string | null = null;
let onDblClickId: string | null = null;
let onLightboxId: string | null = null;
let onTaskOpenedId: string | null = null;
let onTaskClosedId: string | null = null;

onMounted(() => {
  if (!ganttContainer.value) return;

  configureGanttEngine();
  gantt.init(ganttContainer.value);

  onBeforeDragId = gantt.attachEvent('onBeforeTaskDrag', () => false);
  onBeforeLinkId = gantt.attachEvent('onBeforeLinkAdd', () => false);
  onDblClickId = gantt.attachEvent('onTaskDblClick', () => false);
  onLightboxId = gantt.attachEvent('onBeforeLightbox', () => false);

  onTaskOpenedId = gantt.attachEvent('onTaskOpened', (id: string | number) => {
    projectOpenStates.value[String(id)] = true;
    return true;
  });

  onTaskClosedId = gantt.attachEvent('onTaskClosed', (id: string | number) => {
    projectOpenStates.value[String(id)] = false;
    return true;
  });

  onTaskClickId = gantt.attachEvent('onTaskClick', (id: string | number) => {
    try {
      
      (gantt as any).ext?.tooltips?.tooltip?.hide?.();
      
      (gantt as any).hideTooltip?.();
    } catch {
      // Ignore
    }

    // Toggle project branch open/close on project row or chevron click
    if (String(id).startsWith('proj_')) {
      if (gantt.isTaskExists(id)) {
        const taskObj = gantt.getTask(id);
        const nextOpen = !taskObj.$open;
        taskObj.$open = nextOpen;
        taskObj.open = nextOpen;
        projectOpenStates.value[String(id)] = nextOpen;
        if (nextOpen) {
          gantt.open(id);
        } else {
          gantt.close(id);
        }
      }
      return false;
    }

    if (typeof id === 'number' || (!String(id).startsWith('proj_') && !isNaN(Number(id)))) {
      const numericId = Number(id);
      const found = props.tasks.find((t) => t.task_id === numericId);
      if (found) {
        emit('task-click', found);
      }
    }
    return false;
  });

  refreshGantt();
});

onBeforeUnmount(() => {
  if (onTaskClickId) gantt.detachEvent(onTaskClickId);
  if (onBeforeDragId) gantt.detachEvent(onBeforeDragId);
  if (onBeforeLinkId) gantt.detachEvent(onBeforeLinkId);
  if (onDblClickId) gantt.detachEvent(onDblClickId);
  if (onLightboxId) gantt.detachEvent(onLightboxId);
  if (onTaskOpenedId) gantt.detachEvent(onTaskOpenedId);
  if (onTaskClosedId) gantt.detachEvent(onTaskClosedId);
  gantt.clearAll();
});

watch(
  [() => props.tasks, () => props.projects, internalSearchQuery, () => props.groupByProject],
  () => {
    refreshGantt();
  },
  { deep: true },
);

watch([activeScale, isHierarchical, showExtraColumns, showDependencies], () => {
  if (ganttContainer.value) refreshGantt();
});

watch(isDark, () => {
  if (ganttContainer.value) {
    gantt.render();
  }
});

defineExpose({
  refreshGantt,
  scrollToToday,
  setScale,
  expandAll,
  collapseAll,
});
</script>

<style lang="scss">

/* Pixel-Perfect DHTMLX Gantt Roadmap Component Styles */
.dhtmlx-roadmap-card {
  background: var(--wo-bg-card, #ffffff);
  border-radius: 14px;
  border: 1px solid var(--wo-border, #e2e8f0);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  font-family: var(--font-primary, 'Plus Jakarta Sans', 'Inter', sans-serif);

  /* Gantt Canvas Viewport */
  .gantt-canvas-wrapper {
    position: relative;
    width: 100%;
    min-height: 480px;
    height: 600px;
    background: #ffffff;

    .gantt-chart-viewport {
      width: 100%;
      height: 100%;
    }

    .gantt-no-data-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      z-index: 10;
    }
  }

  /* 4. Footer Row */
  .gantt-footer-row {
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    min-height: 38px;
  }

  /* ----------------------------------------------------
     DHTMLX Global Overrides & Tree Chevrons
     ---------------------------------------------------- */
  .gantt_container {
    font-family: inherit;
    border: none;
    background: transparent;
  }

  /* Scales & Header Rows */
  .gantt_grid_scale,
  .gantt_task_scale {
    background: transparent !important;
    color: #334155;
    font-weight: 700;
    border-bottom: 1px solid #e2e8f0;
  }

  .gantt_grid_head_cell {
    color: #1e293b;
    font-weight: 800;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-right: 1px solid #e2e8f0;
    padding: 0 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;

    &.gantt_grid_head_text {
      justify-content: flex-start;
      padding-left: 10px;
    }
  }

  .gantt_scale_cell {
    color: #475569;
    font-weight: 700;
    font-size: 10.5px;
    border-right: 1px solid #f1f5f9;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  /* Tree Expander Chevrons */
  .gantt_tree_icon {
    cursor: pointer;

    &:before {
      display: none !important;
      content: '' !important;
    }


    &.gantt_file,
    &.gantt_folder_open,
    &.gantt_folder_closed {
      background-image: none !important;
      display: none !important;
      width: 0 !important;
    }
  }

  /* Grid Rows & Cells */
  .gantt_row,
  .gantt_task_row {
    background: #ffffff;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.12s ease;

    &:hover {
      background: #f8fafc !important;
    }

    &.gantt_selected {
      background: rgba(124, 58, 237, 0.06) !important;
    }
  }

  /* Distinct Project Row in Grid */
  .dhtmlx-grid-row-project {
    background: #f8fafc !important;
    font-weight: 700;
    border-bottom: 1px solid #e2e8f0 !important;
    cursor: pointer;

    .gantt_cell {
      color: #0f172a;
    }
  }

  .dhtmlx-grid-row-task {
    background: #ffffff;
  }

  .gantt_cell {
    color: #1e293b;
    font-size: 12px;
    border-right: 1px solid #f1f5f9;
    padding: 0 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    &.gantt_cell_tree {
      justify-content: flex-start;
      padding-left: 6px;
    }
  }

  .gantt_task_cell {
    border-right: 1px solid #f8fafc;
  }

  /* Column Contents */
  .gantt-col-project {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    overflow: hidden;

    .project-title {
      font-size: 12.5px;
      color: #0f172a;
      font-weight: 700;
    }

    .task-count-pill {
      font-size: 10px;
      padding: 1px 6px;
      color: #000000;
      border-radius: 10px;
      font-weight: 700;
      margin-left: auto;
      flex-shrink: 0;
    }
  }

  .gantt-col-task {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    overflow: hidden;

    .task-title {
      font-size: 12px;
      color: #334155;
      font-weight: 500;
    }
  }

  /* Badges in Left Table */
  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10.5px;
    font-weight: 600;
    max-width: 100%;
    line-height: 1.2;
    text-align: center;
    white-space: normal;
    word-break: break-word;

    .status-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }

    .badge-text {
      line-height: 1.1;
      display: inline-block;
    }

    &.s-completed {
      background: #ecfdf5;
      color: #059669;
      .status-dot {
        background: #10b981;
      }
    }
    &.s-in-progress {
      background: #eff6ff;
      color: #0284c7;
      .status-dot {
        background: #0284c7;
      }
    }
    &.s-scheduled {
      background: #f5f3ff;
      color: #7c3aed;
      .status-dot {
        background: #8b5cf6;
      }
    }
    &.s-unassigned {
      background: #f1f5f9;
      color: #64748b;
      .status-dot {
        background: #94a3b8;
      }
    }
  }

  .priority-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10.5px;
    font-weight: 700;
    max-width: 100%;
    line-height: 1.2;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &.p-critical {
      background: #fdf2f8;
      color: #db2777;
    }
    &.p-high {
      background: #fff7ed;
      color: #ea580c;
    }
    &.p-medium {
      background: #eff6ff;
      color: #0284c7;
    }
    &.p-low {
      background: #ecfdf5;
      color: #059669;
    }
  }

  .duration-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10.5px;
    font-weight: 600;
    background: #f0f9ff;
    color: #0284c7;
    white-space: nowrap;
    text-align: center;

    &.project-dur-badge {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
    }
  }

  /* Completely disable/hide drag and resize handles on task bars */
  .gantt_task_drag,
  .gantt_task_progress_drag,
  .gantt_link_control,
  .gantt_link_point {
    display: none !important;
    pointer-events: none !important;
  }

  /* ----------------------------------------------------
     Project Summary Bar & Task Bar Styling
     ---------------------------------------------------- */
  /* Project Summary Bar */
  .dhtmlx-bar-project {
    background: #4338ca !important;
    border: 1px solid #4338ca !important;
    border-radius: 8px !important;
    box-shadow: none !important;
    cursor: pointer;

    .gantt_task_progress {
      display: none !important;
    }

    .gantt-bar-content-wrapper.is-project {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 0 8px 0 4px;
      gap: 6px;
      color: #ffffff;

      .project-pct {
        position: relative;
      z-index: 2;
      background: rgba(0, 0, 0, 0.45);
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 1.2;
      }

      .is-project-title {
        font-size: 11.5px;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: 0.01em;
      }
    }
  }

  /* Task Bar Container & Content Overrides */
  .dhtmlx-bar-task {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    overflow: visible !important;
    cursor: pointer;

    .gantt_task_progress {
      display: none !important;
    }

    .gantt_task_content {
      overflow: visible !important;
      position: static !important;
      width: 100% !important;
      height: 100% !important;
      padding: 0 !important;
    }
  }

  /* Custom Segments Container & Pills (renders gaps accurately on non-working days) */
  .gantt-segments-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 28px;
    pointer-events: auto;
  }

  .gantt-segment-pill {
    position: absolute;
    top: 0;
    height: 28px;
    border-radius: 7px;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: 0 6px;
    gap: 4px;
    color: #ffffff;
    font-size: 11px;
    font-weight: 600;
    box-sizing: border-box;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;

    &:hover {
      transform: translateY(-1px);
      z-index: 5;
    }

    .segment-progress-fill {
      display: none;
    }

    .segment-title {
      position: relative;
      z-index: 2;
      font-size: 11px;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .segment-pct-badge {
      position: relative;
      z-index: 2;
      background: rgba(0, 0, 0, 0.45);
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 1.2;
    }

    .segment-hours-badge {
      position: relative;
      z-index: 2;
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 1.2;
      margin-left: auto;
    }

    /* 1. Red (Critical Priority) */
    &.bar-p-critical {
      background: #ef4444;
      border: 1px solid #ef4444 !important;
      box-shadow: none !important;
    }

    /* 2. Orange (High Priority) */
    &.bar-p-high {
      background: #ea580c !important;
      border: 1px solid #c2410c !important;
      box-shadow: none !important;
    }

    /* 3. Yellow (Medium Priority) */
    &.bar-p-medium {
      background: #facc15  !important;
      border: 1px solid #ca8a04 !important;
      box-shadow: none !important;
    }

    /* 4. Green (Low Priority / Completed) */
    &.bar-p-low,
    &.bar-s-completed {
      background: #059669    !important;
      border: 1px solid #64748b !important;
      box-shadow: none !important;
    }
  }

  /* Dependency Link Lines */
  .gantt_line_wrapper div {
    background-color: #000000 !important;
    height: 2px !important;
  }

  .gantt_link_arrow {
    border-left-color: #000000 !important;
  }

  .gantt_link_point {
    background: #000000 !important;
    border: 2px solid #ffffff !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  /* Today Marker */
  .dhtmlx-today-marker {
    background: #8b5cf6;
    width: 2px;
    z-index: 5;

    &::after {
      content: 'TODAY';
      position: absolute;
      top: 2px;
      left: -18px;
      background: #8b5cf6;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 1px 4px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
}

/* ----------------------------------------------------
   Dark Mode Overrides for DHTMLX Gantt
   ---------------------------------------------------- */
body.body--dark {
  .dhtmlx-roadmap-card {
    border-color: var(--wo-border, #1e2433);
    background: var(--wo-bg-card, #181d28);

    .gantt-canvas-wrapper {
      background: #181d28;

      .gantt-no-data-overlay {
        background: rgba(24, 29, 40, 0.95);
        .text-dark {
          color: #ffffff !important;
        }
      }
    }

    .gantt-footer-row {
      background: var(--wo-bg-card, #181d28);
      border-top-color: #1e2433;
    }

    /* Gantt chart elements */
    .gantt_container,
    .gantt_data_area,
    .gantt_task_bg,
    .gantt_grid {
      background: transparent !important;
      background-color: transparent !important;
    }

    .gantt_grid_scale,
    .gantt_task_scale {
      background: transparent !important;
      color: #cbd5e1;
      border-bottom-color: #1e293b;
    }

    .gantt_grid_head_cell {
      color: #f1f5f9;
      border-right-color: #1e293b;
    }

    .gantt_scale_cell {
      color: #94a3b8;
      border-right-color: #1e293b;
    }

    .gantt_row,
    .gantt_task_row {
      background: #181d28;
      border-bottom-color: #1e2433;

      &:hover {
        background: #1e2433 !important;
      }

      &.gantt_selected {
        background: rgba(124, 58, 237, 0.15) !important;
      }
    }

    .dhtmlx-grid-row-project {
      background: #1e2433 !important;
      border-bottom-color: #1e293b !important;
      .gantt_cell {
        color: #ffffff;
      }
    }

    .gantt_cell {
      color: #cbd5e1;
      border-right-color: #1e2433;
    }

    .gantt_task_cell {
      border-right-color: #1e2433;
    }

    .gantt-col-project {
      .project-title {
        color: #ffffff;
      }
      .task-count-pill {
        background: #ffffff;
        color: #ffffff;
      }
    }

    .gantt-col-task {
      .task-title {
        color: #cbd5e1;
      }
    }

    .gantt_resizer {
      background-color: #1e2433 !important;
    }

    .status-badge {
      &.s-completed {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }
      &.s-in-progress {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
      }
      &.s-scheduled {
        background: rgba(139, 92, 246, 0.15);
        color: #a78bfa;
      }
      &.s-unassigned {
        background: rgba(148, 163, 184, 0.15);
        color: #94a3b8;
      }
    }

    .priority-badge {
      &.p-critical {
        background: #ef4444;
        color: #f43f5e;
      }
      &.p-high {
        background: rgba(249, 115, 22, 0.15);
        color: #f97316;
      }
      &.p-medium {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
      }
      &.p-low {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }
    }

    .duration-badge {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;

      &.project-dur-badge {
        background: rgba(148, 163, 184, 0.15);
        color: #cbd5e1;
      }
    }

    /* Today marker boundary/accent */
    .gantt_link_point {
      border-color: #181d28 !important;
    }
  }
}

/* External / Masked Tasks Styling */
.dhtmlx-bar-external {
  background: #cbd5e1 !important;
  border: 1px solid #cbd5e1 !important;
  opacity: 0.88;

  .gantt_task_progress {
    display: none !important;
  }
}

.bar-external-pill {
  background: #cbd5e1 !important;
  border: 1px solid #cbd5e1 !important;
  color: #64748b !important;
  font-style: italic;

  .segment-progress-fill {
    display: none !important;
  }
}

.is-external-row {
  background: rgba(241, 245, 249, 0.4) !important;
}

.is-external-task {
  opacity: 0.85;
}

/* Match the shared dashboard visual language: white cards, indigo accents,
   restrained borders, and the same compact controls used by analytics/tasks. */
.dhtmlx-roadmap-card {
  border-radius: 12px;
  border-color: #e5e7eb;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  font-family: inherit;

  .gantt-footer-row {
    background: #ffffff;
  }

  .gantt-canvas-wrapper {
    background: #ffffff;
  }

  .gantt_grid_scale,
  .gantt_task_scale {
    background: transparent !important;
    color: #374151;
  }

  .dhtmlx-grid-row-project {
    background: #f8f9fa !important;
  }
}

/* Visual treatment inspired by TaskTimelineChart.vue. The DHTMLX engine and
   all of its existing templates remain unchanged. */
.timeline-card {
  gap: 0;
  width: 100%;
  border-radius: 12px;
  border-color: #e7e9f4;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.timeline-chart-surface {
  padding: 12px;
  background: #ffffff;
}

.timeline-chart-surface .gantt-chart-viewport {
  overflow: hidden;
  border: 1px solid #edf0f5;
  border-radius: 10px;
  background: #ffffff;
}

.timeline-card .gantt-footer-row {
  margin: 0 12px 12px;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  background: #ffffff;
}

.timeline-card .gantt_task_line,
.timeline-card .gantt_task_content {
  border-radius: 8px;
}

.timeline-card .gantt_row:hover,
.timeline-card .gantt_task_row:hover {
  background: #f8f9ff !important;
}
</style>