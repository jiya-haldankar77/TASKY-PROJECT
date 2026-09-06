<template>
  <q-page class="q-pa-lg text-black" style="background:#f8f9fa">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center">
        <q-avatar color="indigo-1" text-color="indigo" icon="settings" size="48px" class="q-mr-md" style="border-radius:12px" />
        <div class="column"><div class="text-h5 text-weight-bold">Settings</div>
        <div class="text-grey-7 text-caption">Manage your account preferences</div>
      </div></div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Profile Settings -->
      <div class="col-6">
        <q-card flat bordered class="settings-card">
          <q-card-section>
            <div class="text-h6 text-weight-bold">Profile Settings</div>
          </q-card-section>
          <q-card-section>
            <div class="column items-center q-mb-md">
              <q-avatar size="100px">
                <img :src="authStore.user?.avatar || 'https://cdn.quasar.dev/img/avatar.png'" />
              </q-avatar>
              <q-btn flat color="primary" label="Change Avatar" class="q-mt-sm" />
            </div>
            <q-input v-model="firstName" label="First Name" outlined class="q-mb-md" />
            <q-input v-model="lastName" label="Last Name" outlined class="q-mb-md" />
            <q-input v-model="email" label="Email" outlined class="q-mb-md" />
            <q-input v-model="phone" label="Phone" outlined class="q-mb-md" />
            <q-btn color="primary" label="Save Changes" @click="saveProfile" class="full-width" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Preferences -->
      <div class="col-6">
        <q-card flat bordered class="settings-card">
          <q-card-section>
            <div class="text-h6 text-weight-bold">Preferences</div>
          </q-card-section>
          <q-card-section>
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label>Dark Mode</q-item-label>
                  <q-item-label caption>Use dark theme</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle :model-value="darkMode" color="primary" @update:model-value="setDarkMode" />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>Email Notifications</q-item-label>
                  <q-item-label caption>Receive email updates</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle v-model="emailNotifications" color="primary" />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>Task Reminders</q-item-label>
                  <q-item-label caption>Get reminded of deadlines</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle v-model="taskReminders" color="primary" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="settings-card q-mt-md">
          <q-card-section>
            <div class="text-h6 text-weight-bold">Account Actions</div>
          </q-card-section>
          <q-card-section>
            <q-btn color="red" label="Logout" @click="logout" class="full-width" />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../../stores/authStore';

defineOptions({
  name: 'EmployeeSettings',
});

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const phone = ref('');
const darkMode = ref(false);
const emailNotifications = ref(true);
const taskReminders = ref(true);

onMounted(() => {
  darkMode.value = localStorage.getItem('tasky_dark_mode') === 'true';
  $q.dark.set(darkMode.value);
  if (authStore.user) {
    firstName.value = authStore.user.firstName || '';
    lastName.value = authStore.user.surname || '';
    email.value = authStore.user.email || '';
    phone.value = authStore.user.phone || '';
  }
});

function setDarkMode(value: boolean) {
  darkMode.value = value;
  $q.dark.set(value);
  localStorage.setItem('tasky_dark_mode', String(value));
}

function saveProfile() {
  // In production, this would update the user profile in the database
  console.log('Saving profile:', {
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    phone: phone.value,
  });
}

function logout() {
  authStore.logout();
  router.push('/auth/login');
}
</script>

<style scoped>
.settings-card { border-radius: 14px; border-color: #e5eaf0; box-shadow: 0 7px 20px rgba(32, 54, 83, .05); }
</style>
