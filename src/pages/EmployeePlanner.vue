<template>
  <q-page class="planner-page q-pa-md">
    <!-- =========================================================
         HEADER
    ========================================================= -->

    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Employee Planner</div>
        <div class="text-caption text-grey-6">
          Plan your work and keep your daily updates on track.
        </div>
      </div>
      <StreakCard :streak="streak" />
    </div>


    <!-- =========================================================
         CALENDAR VIEW
    ========================================================= -->

    <div class="calendar-container">
      <q-card flat bordered class="calendar-card">
        <!-- HEADER -->
        <CalendarToolbar
          kicker="WORK CALENDAR"
          :month-name="monthName"
          :current-year="currentYear"
          @previous="previousMonth"
          @today="goCalendarToday"
          @next="nextMonth"
        />

        <!-- MONTH STATS -->
        <div class="compact-stats q-px-md q-py-sm">
          <div class="compact-stat">
            <div class="stat-icon worked-stat">
              <q-icon name="check" size="15px" />
            </div>
            <div>
              <div class="stat-value">
                {{ monthlyWorkedDays }}
              </div>
              <div class="stat-label">Worked</div>
            </div>
          </div>
          <div class="compact-stat">
            <div class="stat-icon activity-stat">
              <q-icon name="task_alt" size="15px" />
            </div>
            <div>
              <div class="stat-value">
                {{ monthlyTaskCount }}
              </div>
              <div class="stat-label">Tasks</div>
            </div>
          </div>
          <div class="compact-stat">
            <div class="stat-icon hours-stat">
              <q-icon name="schedule" size="15px" />
            </div>
            <div>
              <div class="stat-value">{{ monthlyHours }}h</div>
              <div class="stat-label">Logged</div>
            </div>
          </div>
        </div>

        <!-- WEEK DAYS -->
        <div class="calendar-grid calendar-week-header q-px-md">
          <div
            v-for="day in weekDays"
            :key="day"
            class="calendar-weekday"
            :class="{
              'weekend-heading': day === 'SAT' || day === 'SUN',
            }"
          >
            {{ day }}
          </div>
        </div>

        <!-- CALENDAR -->

        <div class="calendar-grid calendar-body q-pa-md">
          <div
            v-for="day in calendarDays"
            :key="day.key"
            class="calendar-cell"
            :class="{
              'calendar-empty': !day.date,

              'weekend-cell': day.isWeekend && day.status === 'weekend',

              'worked-cell': day.status === 'worked',

              'leave-cell': day.status === 'leave',

              'holiday-cell': day.status === 'holiday',

              'today-cell': day.isToday,

              'selected-cell': selectedDate === day.date,
            }"
            @click="day.date ? selectCalendarDay(day) : null"
          >
            <template v-if="day.date">
              <div class="row items-center justify-between">
                <div
                  class="calendar-day-number"
                  :class="{
                    'today-number': day.isToday,
                  }"
                >
                  {{ day.dayNumber }}
                </div>

                <div v-if="day.isToday" class="today-pill">TODAY</div>
              </div>

              <!-- STATUS -->

              <div class="calendar-status" :class="statusClass(day.status)">
                <q-icon :name="statusIcon(day.status)" size="11px" />

                {{ statusLabel(day.status) }}
              </div>

              <!-- LOG COUNT -->

              <div v-if="day.workLogs.length" class="calendar-work-summary">
                <q-icon name="task_alt" size="12px" />

                {{ day.workLogs.length }}

                {{ day.workLogs.length === 1 ? 'task' : 'tasks' }}

                <span> · {{ totalHours(day.workLogs) }}h </span>
              </div>

              <!-- ACTIVITY -->

              <div v-if="day.workLogs.length" class="activity-dots">
                <span v-for="index in Math.min(day.workLogs.length, 4)" :key="index" />
              </div>
            </template>
          </div>
        </div>
      </q-card>

      <!-- =======================================================
           SELECTED DAY
      ======================================================== -->

      <div class="row q-col-gutter-md q-mt-md">
        <!-- STATUS -->

        <div class="col-12 col-md-5">
          <q-card flat bordered class="compact-info-card">
            <div class="q-pa-md">
              <div class="row items-center justify-between">
                <div>
                  <div class="section-kicker">SELECTED DAY</div>

                  <div class="selected-date">
                    {{ selectedDateFormatted }}
                  </div>
                </div>

              </div>

              <!-- STATUS OPTIONS -->

              <div class="compact-status-grid q-mt-md">
                <div
                  v-for="option in dayStatusOptions"
                  :key="option.value"
                  class="compact-status-option"
                  :class="{
                    'compact-status-active': selectedDayStatus === option.value,
                  }"
                  @click="selectedDayStatus = option.value as DayStatus"
                >
                  <q-icon :name="option.icon" size="16px" />

                  <span>
                    {{ option.label }}
                  </span>
                </div>
              </div>

              <div v-if="selectedDayCompliance?.status === 'submitted'" class="text-positive text-weight-bold flex items-center justify-center q-gutter-x-sm q-mt-md">
                <q-icon name="check_circle" size="sm" /> <span>Submitted for Review</span>
              </div>
              <div v-else-if="selectedDayCompliance?.status === 'reviewed'" class="text-primary text-weight-bold flex items-center justify-center q-mt-md">
                <div class="flex items-center q-gutter-x-sm">
                  <q-icon name="verified" size="sm" /> <span>Reviewed by PM</span>
                </div>
              </div>
              <q-btn
                v-else
                unelevated
                dense
                no-caps
                color="primary"
                class="full-width q-mt-md"
                label="Save Day Status"
                @click="submitDayToPM"
              />
            </div>
          </q-card>
        </div>

        <!-- ACTIVITY -->

        <div class="col-12 col-md-7">
          <q-card flat bordered class="compact-info-card">
            <div class="q-pa-md">
              <div class="row items-center justify-between">
                <div>
                  <div class="section-kicker">WORK ACTIVITY</div>

                  <div class="selected-date">
                    {{ selectedDayActivity.length }}
                    {{ selectedDayActivity.length === 1 ? 'task' : 'tasks' }}
                    logged
                  </div>
                </div>

                <div v-if="selectedDayActivity.length" class="text-caption text-grey-6">
                  {{ totalHours(selectedDayActivity) }}h total
                </div>
              </div>

              <div v-if="selectedDayActivity.length" class="compact-activity-list q-mt-sm">
                <div v-for="log in selectedDayActivity" :key="log.id" class="compact-activity-row">
                  <div class="activity-task-icon">
                    <q-icon :name="log.taskTitle === 'Manual Entry' ? 'edit_note' : 'task_alt'" size="15px" />
                  </div>

                  <div class="col">
                    <div class="compact-task-name">
                      {{ log.taskTitle || 'Manual Entry' }}
                    </div>

                    <div v-if="log.project" class="text-caption text-grey-6">
                      {{ log.project }}
                    </div>

                    <div v-if="log.note" class="text-caption text-grey-5 q-mt-xs log-note-text">
                      {{ log.note }}
                    </div>
                  </div>

                  <div v-if="log.progress > 0" class="compact-progress">
                    <div class="text-caption">{{ log.progress }}%</div>

                    <q-linear-progress
                      :value="log.progress / 100"
                      rounded
                      color="primary"
                      size="4px"
                    />
                  </div>
                </div>
              </div>

              <div v-else class="compact-empty">
                <q-icon name="event_note" size="25px" />

                <span> No work logged for this day </span>

              </div>

                <!-- Submit to PM moved to Save Day Status above -->
              </div>
          </q-card>
        </div>
      </div>
    </div>



    <!-- =========================================================
         SAVED DIALOG
    ========================================================= -->

    <q-dialog v-model="showSavedDialog">
      <q-card style="min-width: 300px">
        <q-card-section class="text-center">
          <q-icon name="check_circle" color="positive" size="45px" />

          <div class="text-h6 text-weight-bold q-mt-sm">Updates Saved</div>

          <div class="text-caption text-grey-6 q-mt-xs">Your work log has been updated.</div>
        </q-card-section>

        <q-card-actions align="center">
          <q-btn flat no-caps color="primary" label="Done" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import StreakCard from '@/components/StreakCard.vue';
import CalendarToolbar from '@/components/CalendarToolbar.vue';
import { useAuthStore } from '@/stores/authStore';

/* ============================================================
   TYPES
============================================================ */

type DayStatus = 'worked' | 'leave' | 'holiday' | 'weekend' | 'no-entry';

type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Blocked';

interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

interface WorkLog {
  id: number;
  taskTitle: string;
  title?: string;
  project: string;
  progress: number;
  hours: number;
  note: string;
  status?: TaskStatus;
  priority?: string;
}

interface Task {
  id: number;
  title: string;
  project: string;
  priority: string;
  status: TaskStatus;
  progress: number;
  note: string;
  subtasks: Subtask[];
}

interface CalendarDay {
  key: string;
  date: string;
  dayNumber: number;
  isWeekend: boolean;
  isToday: boolean;
  status: DayStatus;
  workLogs: WorkLog[];
}

/* ============================================================
   CONSTANTS
============================================================ */

const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const dayStatusOptions = [
  {
    label: 'Worked',
    value: 'worked',
    icon: 'check_circle',
  },
  {
    label: 'Leave',
    value: 'leave',
    icon: 'event_busy',
  },
  {
    label: 'Holiday',
    value: 'holiday',
    icon: 'celebration',
  },
  {
    label: 'Weekend',
    value: 'weekend',
    icon: 'weekend',
  },
];

/* ============================================================
   TODAY
============================================================ */

const today = new Date();

const todayString = formatDate(today);


/* ============================================================
   CALENDAR MONTH
============================================================ */

const calendarMonth = ref(today.getMonth());

const calendarYear = ref(today.getFullYear());

/* ============================================================
   SELECTED DATE
============================================================ */

const selectedDate = ref(todayString);

const selectedDayStatus = ref<DayStatus>('worked');

/* ============================================================
   STREAK
============================================================ */

const streak = ref(5);

/* ============================================================
   WORK LOG STORAGE
============================================================ */

/*
  This object acts as your temporary frontend database.

  Later this can be replaced by:
  Pinia store
  +
  Node.js API
  +
  MySQL
*/

const workLogs = ref<Record<string, WorkLog[]>>({});

/* ============================================================
   DAY STATUS STORAGE
============================================================ */

const dayStatuses = ref<Record<string, DayStatus>>({});

/* ============================================================
   TASKS
============================================================ */

const tasks = ref<Task[]>([]);

const authStore = useAuthStore();

// Fetch tasks from database
const fetchTasks = async () => {
  if (!authStore.user?.id) {
    // Fallback to mock data if no user
    tasks.value = [
      {
        id: 1,
        title: 'Vehicle booking API',
        project: 'wheelO',
        priority: 'High',
        status: 'In Progress',
        progress: 70,
        note: '',
        subtasks: [],
      },
      {
        id: 2,
        title: 'Dashboard UI',
        project: 'wheelO',
        priority: 'Medium',
        status: 'In Progress',
        progress: 45,
        note: '',
        subtasks: [],
      },
    ];
    return;
  }

  try {
    const response = await fetch(`http://localhost:3001/api/tasks/employee/${authStore.user?.id}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    const result = await response.json();

    if (result.success && result.tasks) {
      // Fetch subtasks for each task
      const tasksWithSubtasks = await Promise.all(
        result.tasks.map(async (task: any) => {
          const subtaskResponse = await fetch(`http://localhost:3001/api/employee/tasks/${task.id}/subtasks`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
          });
          const subtaskResult = await subtaskResponse.json();
          const subtasks = subtaskResult.success ? subtaskResult.subtasks : [];

          return {
            id: task.id,
            title: task.title,
            project: task.project_name || 'Unknown',
            priority: task.priority || 'Medium',
            status: task.status || 'Pending',
            progress: parseFloat(task.progress) || 0,
            note: task.description || '',
            subtasks: subtasks,
          };
        })
      );

      tasks.value = tasksWithSubtasks;
    } else {
      // Fallback to mock data on error
      tasks.value = [
        {
          id: 1,
          title: 'Vehicle booking API',
          project: 'wheelO',
          priority: 'High',
          status: 'In Progress',
          progress: 70,
          note: '',
          subtasks: [],
        },
      ];
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    // Fallback to mock data on error
    tasks.value = [
      {
        id: 1,
        title: 'Vehicle booking API',
        project: 'wheelO',
        priority: 'High',
        status: 'In Progress',
        progress: 70,
        note: '',
        subtasks: [],
      },
    ];
  }
};

// Fetch work logs from database
const fetchWorkLogs = async () => {
  if (!authStore.user?.id) {
    // Fallback to empty object if no user
    workLogs.value = {};
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3001/api/employee/work-logs/${authStore.user?.id}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }
    );
    const result = await response.json();

    if (result.success && result.logs) {
      // Group work logs by date
      const logsByDate: Record<string, WorkLog[]> = {};
      result.logs.forEach((log: any) => {
        let date = log.log_date;
          if (date) {
            const d = new Date(date);
            date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          }
        
        if (!logsByDate[date]) {
          logsByDate[date] = [];
        }
        logsByDate[date]!.push({
          id: log.id,
          taskTitle: log.task_title || (log.task_id == 0 || !log.task_id ? 'Manual Entry' : 'Unknown Task'),
          project: log.project_name || log.project || '',
          progress: parseFloat(log.task_progress ?? log.progress) || 0,
          hours: parseFloat(log.hours_spent) || 0,
          note: log.work_completed || log.notes || '',
        });
      });
      workLogs.value = logsByDate;
    } else {
      // Fallback to empty object on error
      workLogs.value = {};
    }
  } catch (error) {
    console.error('Error fetching work logs:', error);
    // Fallback to empty object on error
    workLogs.value = {};
  }
};

// Fetch data on mount
onMounted(() => {
  fetchTasks();
  fetchWorkLogs();
});



/* ============================================================
   SAVE DIALOG
============================================================ */

const showSavedDialog = ref(false);

/* ============================================================
   MONTH NAME
============================================================ */

const monthName = computed(() => {
  return monthNames[calendarMonth.value] || 'January';
});

const currentYear = computed(() => {
  return calendarYear.value;
});

/* ============================================================
   CALENDAR DAYS
============================================================ */

const calendarDays = computed<CalendarDay[]>(() => {
  const firstDay = new Date(calendarYear.value, calendarMonth.value, 1);

  const lastDay = new Date(calendarYear.value, calendarMonth.value + 1, 0);

  /*
      JS:
      Sunday = 0
      Monday = 1
  
      Convert to:
      Monday = 0
      Sunday = 6
    */

  const firstWeekDay = (firstDay.getDay() + 6) % 7;

  const days: CalendarDay[] = [];

  /* EMPTY CELLS */

  for (let i = 0; i < firstWeekDay; i++) {
    days.push({
      key: `empty-${i}`,
      date: '',
      dayNumber: 0,
      isWeekend: false,
      isToday: false,
      status: 'weekend',
      workLogs: [],
    });
  }

  /* ACTUAL DAYS */

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(calendarYear.value, calendarMonth.value, day);

    const dateString = formatDate(date);

    const jsDay = date.getDay();

    const isWeekend = jsDay === 0 || jsDay === 6;

    const savedStatus = dayStatuses.value[dateString];

    const hasWorkLogs = workLogs.value[dateString] && workLogs.value[dateString].length > 0;

    const status: DayStatus =
      savedStatus ?? (hasWorkLogs ? 'worked' : isWeekend ? 'weekend' : 'no-entry');

    days.push({
      key: dateString,

      date: dateString,

      dayNumber: day,

      isWeekend,

      isToday: dateString === todayString,

      status,

      workLogs: workLogs.value[dateString] ?? [],
    });
  }

  return days;
});

/* ============================================================
   SELECTED ACTIVITY & COMPLIANCE
============================================================ */

const selectedDayActivity = computed(() => {
  return workLogs.value[selectedDate.value] ?? [];
});

const selectedDayCompliance = ref<any>(null);

async function fetchDayCompliance(date: string) {
  if (!authStore.user?.id) return;
  try {
    const response = await fetch(`http://localhost:3001/api/daily-logs/${authStore.user?.id}/${date}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    const result = await response.json();
    if (result.success) {
      selectedDayCompliance.value = result.compliance;
    }
  } catch (err) {
    console.error('Error fetching compliance:', err);
  }
}

watch(selectedDate, (newDate) => {
  fetchDayCompliance(newDate);
}, { immediate: true });

async function submitDayToPM() {
  if (!authStore.user?.id) return;
  // First save the local day status selection (worked, leave, holiday, weekend)
  dayStatuses.value[selectedDate.value] = selectedDayStatus.value;
  
  try {
    const response = await fetch('http://localhost:3001/api/daily-logs/submit', {
      method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`
        },
      body: JSON.stringify({ user_id: authStore.user?.id, log_date: selectedDate.value, day_status: selectedDayStatus.value })
    });
    const result = await response.json();
    if (result.success) {
      await fetchDayCompliance(selectedDate.value);
      showSavedDialog.value = true;
    }
  } catch (err) {
    console.error('Error submitting day:', err);
  }
}

/* ============================================================
   SELECTED DATE FORMATTED
============================================================ */

const selectedDateFormatted = computed(() => {
  const date = parseDate(selectedDate.value);

  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});


/* ============================================================
   MONTHLY STATS
============================================================ */

const monthlyWorkedDays = computed(() => {
  return calendarDays.value.filter((day) => day.date && day.status === 'worked').length;
});

const monthlyTaskCount = computed(() => {
  return calendarDays.value.reduce((total, day) => total + day.workLogs.length, 0);
});

const monthlyHours = computed(() => {
  const hours = calendarDays.value.reduce(
    (total, day) => total + day.workLogs.reduce((sum, log) => sum + Number(log.hours || 0), 0),
    0,
  );

  return hours.toFixed(1);
});

/* ============================================================
   SELECTED STATUS
============================================================ */

const selectedDayStatusComputed = computed(() => {
  if (dayStatuses.value[selectedDate.value]) {
    return dayStatuses.value[selectedDate.value];
  }

  const date = parseDate(selectedDate.value);

  const day = date.getDay();

  return day === 0 || day === 6 ? 'weekend' : 'worked';
});

/*
  Keep template-friendly value.
*/

watch(
  selectedDayStatusComputed,
  (value) => {
    if (value) {
      selectedDayStatus.value = value;
    }
  },
  {
    immediate: true,
  },
);



/* ============================================================
   FORMAT DATE
============================================================ */

function formatDate(date: Date): string {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, '0');

  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/* ============================================================
   PARSE DATE
============================================================ */

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);

  if (year === undefined || month === undefined || day === undefined) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

/* ============================================================
   CALENDAR NAVIGATION
============================================================ */

function previousMonth() {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11;

    calendarYear.value--;
  } else {
    calendarMonth.value--;
  }
}

function nextMonth() {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0;

    calendarYear.value++;
  } else {
    calendarMonth.value++;
  }
}

function goCalendarToday() {
  calendarMonth.value = today.getMonth();

  calendarYear.value = today.getFullYear();

  selectedDate.value = todayString;
}

/* ============================================================
   SELECT CALENDAR DAY
============================================================ */

function selectCalendarDay(day: CalendarDay) {
  selectedDate.value = day.date;

  selectedDayStatus.value = day.status;
}

/* ============================================================
   STATUS HELPERS
============================================================ */

function statusLabel(status: DayStatus): string {
  switch (status) {
    case 'worked':
      return 'Worked';

    case 'leave':
      return 'Leave';

    case 'holiday':
      return 'Holiday';

    case 'weekend':
      return 'Weekend';

    default:
      return 'Unknown';
  }
}

function statusIcon(status: DayStatus): string {
  switch (status) {
    case 'worked':
      return 'check_circle';

    case 'leave':
      return 'event_busy';

    case 'holiday':
      return 'celebration';

    case 'weekend':
      return 'weekend';

    default:
      return 'help';
  }
}

function statusClass(status: DayStatus): string {
  return `status-${status}`;
}

/* ============================================================
   WORK LOG HELPERS
============================================================ */

function totalHours(logs: WorkLog[]): string {
  const total = logs.reduce((sum, log) => sum + Number(log.hours || 0), 0);

  return total.toFixed(1);
}





</script>

<style scoped>
.planner-page {
  min-height: 100vh;
  background: var(--color-background);
}

.planner-header {
  max-width: 1440px;
  margin-inline: auto;
}

.planner-header-icon {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.streak-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.view-toggle {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.calendar-card,
.planner-card,
.compact-info-card,
.compact-task-card,
.empty-card {
  background: var(--color-surface);
  border-color: var(--color-border);
  border-radius: var(--radius-lg);
}

.calendar-toolbar {
  min-height: 52px;
  border-bottom: 1px solid var(--color-border-light);
}

.calendar-kicker,
.section-kicker,
.section-title {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.09em;
  color: var(--color-text-secondary);
}

.calendar-month {
  font-size: 18px;
  font-weight: 750;
}

.compact-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  min-height: 48px;
}

.compact-stat {
  display: flex;
  align-items: center;
  gap: 7px;
}

.stat-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
}

.worked-stat {
  color: var(--color-success);
  background: var(--color-success-light);
}

.activity-stat {
  color: var(--color-purple);
  background: var(--color-purple-light);
}

.hours-stat {
  color: var(--color-blue);
  background: var(--color-info-light);
}

.stat-value {
  font-size: 13px;
  font-weight: 750;
}

.stat-label {
  font-size: 9px;
  color: var(--color-text-muted);
}

.calendar-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  color: var(--color-text-secondary);
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.worked-dot {
  background: var(--color-success);
}

.leave-dot {
  background: var(--color-warning);
}

.holiday-dot {
  background: var(--color-blue);
}

.weekend-label {
  padding: 2px 5px;
  border-radius: 3px;
  background: #eeeeef;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.calendar-week-header {
  padding-top: 7px;
  padding-bottom: 7px;
  border-top: 1px solid var(--color-border-light);
  border-bottom: 1px solid var(--color-border-light);
}

.calendar-weekday {
  text-align: center;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.07em;
  color: var(--color-text-secondary);
}

.weekend-heading {
  color: #aaaab2;
}

.calendar-cell {
  position: relative;
  min-height: 83px;
  padding: 8px 9px;
  border: 1px solid #cfd5df;
  border-radius: 7px;
  background: var(--color-surface);
  cursor: pointer;
  transition: 0.15s ease;
}

.calendar-cell:hover {
  transform: translateY(-1px);
  border-color: #c9c6f6;
  box-shadow: var(--shadow-sm);
}

.calendar-empty {
  visibility: hidden;
  pointer-events: none;
}

.weekend-cell {
  background: #f5f5f7;
}

.worked-cell {
  background: #fcfff9;
}

.worked-cell::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  bottom: 9px;
  width: 2px;
  border-radius: 0 3px 3px 0;
  background: var(--color-success);
}

.leave-cell {
  background: #fffaf0;
}

.holiday-cell {
  background: #f7f8ff;
}

.today-cell {
  border: 2px solid var(--color-purple);
}

.calendar-day-number {
  font-size: 14px;
  font-weight: 750;
}

.today-number {
  color: var(--color-purple);
}

.today-pill {
  padding: 2px 4px;
  border-radius: 3px;
  background: var(--color-purple-light);
  color: var(--color-purple);
  font-size: 7px;
  font-weight: 800;
}

.calendar-status {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 7px;
  padding: 3px 5px;
  border-radius: 4px;
  font-size: 8px;
  font-weight: 700;
}

.status-worked {
  color: var(--color-success);
  background: var(--color-success-light);
}

.status-weekend {
  color: #858691;
  background: #eaeaec;
}

.status-leave {
  color: var(--color-warning);
  background: var(--color-warning-light);
}

.status-holiday {
  color: var(--color-blue);
  background: var(--color-info-light);
}

.calendar-work-summary {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 6px;
  font-size: 9px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.calendar-work-summary span {
  color: var(--color-text-muted);
}

.activity-dots {
  display: flex;
  gap: 2px;
  margin-top: 5px;
}

.activity-dots span {
  width: 11px;
  height: 2px;
  border-radius: 3px;
  background: var(--color-purple);
}

.selected-cell {
  box-shadow: 0 0 0 2px rgba(116, 103, 240, 0.15);
}

.compact-info-card {
  min-height: 135px;
}

.selected-date {
  font-size: 16px;
  font-weight: 750;
}

.compact-status-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
}

.compact-status-option {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 32px;
  padding: 5px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 9px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.compact-status-active {
  color: var(--color-purple);
  background: var(--color-purple-light);
  border-color: var(--color-purple);
  font-weight: 700;
}

.compact-activity-list {
  max-height: 200px;
  overflow-y: auto;
}

.compact-activity-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.activity-task-icon {
  width: 27px;
  height: 27px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--color-purple);
  background: var(--color-purple-light);
}

.compact-task-name {
  font-size: 12px;
  font-weight: 650;
}

.compact-progress {
  width: 75px;
  flex-shrink: 0;
}

.log-note-text {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-style: italic;
}

.compact-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding-top: 18px;
  color: var(--color-text-muted);
  font-size: 11px;
}

.date-strip {
  display: flex;
  gap: 5px;
}

.date-chip {
  min-width: 58px;
  padding: 6px;
  text-align: center;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  cursor: pointer;
  color: var(--color-text-secondary);
  background: var(--color-surface);
}

.date-chip-active {
  color: white;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.date-chip-number {
  font-size: 15px;
  font-weight: 750;
}

.reminder-banner {
  color: var(--color-text);
  background: var(--color-warning-light);
  border: 1px solid #f7dda4;
}

.compact-task-card {
  transition: 0.15s ease;
}

.compact-task-card:hover {
  border-color: #d5d2f8;
  box-shadow: var(--shadow-sm);
}

.task-title {
  font-size: 16px;
  font-weight: 750;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 650;
  color: var(--color-text-secondary);
}

.compact-subtasks {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  padding-top: 5px;
  border-top: 1px solid var(--color-border-light);
}

.empty-card {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.add-work-dialog {
  width: 540px;
  max-width: 94vw;
  border-radius: var(--radius-lg);
}

.field-label {
  font-size: 11px;
  font-weight: 650;
  color: var(--color-text-secondary);
}

@media (max-width: 850px) {
  .calendar-cell {
    min-height: 75px;
    padding: 7px;
  }

  .planner-header {
    align-items: flex-start;
    gap: 14px;
  }

  .planner-header .text-h5 {
    font-size: 1.35rem;
  }

  .calendar-grid {
    gap: 4px;
  }

  .calendar-legend {
    display: none;
  }
}

@media (max-width: 600px) {
  .planner-page {
    padding: 10px !important;
  }

  .streak-card {
    display: none;
  }

  .calendar-cell {
    min-height: 62px;
    padding: 5px;
  }

  .calendar-day-number {
    font-size: 12px;
  }

  .calendar-status {
    font-size: 7px;
  }

  .calendar-work-summary {
    font-size: 7px;
  }

  .activity-dots {
    display: none;
  }

  .compact-status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
