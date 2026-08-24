<template>
  <div class="login-container">
    <div class="login-header">
      <h2 class="login-title">Welcome Back</h2>
      <p class="login-subtitle">Sign in to your TASKY account</p>
    </div>

    <q-form @submit="handleLogin" class="login-form">
      <div class="form-section">
        <label class="form-label">Role</label>
        <q-select
          v-model="form.role"
          :options="roleOptions"
          outlined
          dense
          bg-color="grey-1"
          class="custom-select"
        >
          <template v-slot:prepend>
            <q-icon name="person" color="grey-7" />
          </template>
        </q-select>
      </div>

      <div class="form-section">
        <label class="form-label">{{ form.role === 'Project Manager' ? 'Manager ID' : 'Employee ID' }}</label>
        <q-input
          v-model="form.id"
          outlined
          dense
          bg-color="grey-1"
          placeholder="Enter your ID"
        >
          <template v-slot:prepend>
            <q-icon name="badge" color="grey-7" />
          </template>
        </q-input>
      </div>

      <div class="form-section">
        <label class="form-label">Password</label>
        <q-input
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          outlined
          dense
          bg-color="grey-1"
          placeholder="Enter your password"
          :disable="isLocked"
        >
          <template v-slot:prepend>
            <q-icon name="lock" color="grey-7" />
          </template>
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
              color="grey-7"
            />
          </template>
        </q-input>
      </div>

      <!-- Google reCAPTCHA -->
      <div class="form-section">
        <div ref="recaptchaRef" class="recaptcha-container"></div>
        <div v-if="recaptchaError" class="recaptcha-error">
          {{ recaptchaError }}
        </div>
        <div v-else-if="!recaptchaToken" class="recaptcha-hint">
          Please complete the reCAPTCHA verification
        </div>
      </div>

      <!-- Lockout warning message -->
      <div v-if="isLocked" class="lockout-warning">
        <q-icon name="lock_clock" size="24px" color="warning" class="lockout-icon" />
        <div class="lockout-content">
          <span class="lockout-text">Too many failed attempts. Try again in</span>
          <span class="lockout-timer">{{ countdownDisplay }}</span>
        </div>
      </div>

      <div class="form-options">
        <q-checkbox
          v-model="form.rememberMe"
          dense
          color="green-7"
          label="Remember me"
          class="remember-checkbox"
        />
        <q-btn
          flat
          no-caps
          dense
          color="primary"
          label="Forgot Password?"
          class="forgot-link"
          @click="router.push('/auth/forgot-password')"
        />
      </div>

      <q-btn
        type="submit"
        label="Sign In"
        class="login-button"
        :loading="loading"
        :disable="isLocked"
        no-caps
      />

      <div class="form-footer">
        <p class="footer-text">
          Don't have an account?
          <q-btn
            flat
            no-caps
            dense
            color="primary"
            label="Create Account"
            class="create-account-link"
            @click="showRegisterDialog = true"
          />
        </p>
      </div>
    </q-form>

    <!-- Register Role Selection Dialog -->
    <q-dialog v-model="showRegisterDialog">
      <q-card class="register-dialog">
        <q-card-section>
          <div class="dialog-header">
            <h3 class="dialog-title">Choose Your Role</h3>
            <p class="dialog-subtitle">Select how you want to join TASKY</p>
          </div>
        </q-card-section>

        <q-card-section class="dialog-content">
          <div class="role-cards">
            <div
              class="role-card"
              :class="{ 'role-card-selected': selectedRegisterRole === 'pm' }"
              @click="selectedRegisterRole = 'pm'"
            >
              <div class="role-card-icon">
                <q-icon name="business_center" size="32px" />
              </div>
              <h4 class="role-card-title">Project Manager</h4>
              <p class="role-card-description">Manage projects and lead teams</p>
            </div>

            <div
              class="role-card"
              :class="{ 'role-card-selected': selectedRegisterRole === 'employee' }"
              @click="selectedRegisterRole = 'employee'"
            >
              <div class="role-card-icon">
                <q-icon name="engineering" size="32px" />
              </div>
              <h4 class="role-card-title">Employee</h4>
              <p class="role-card-description">Join as a team member</p>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup no-caps />
          <q-btn
            label="Continue"
            color="primary"
            :disable="!selectedRegisterRole"
            @click="handleRegisterNavigation"
            no-caps
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// Type definitions for reCAPTCHA
declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void
      render: (element: HTMLElement, options: {
        sitekey: string
        theme: string
        callback?: (token: string) => void
        'expired-callback'?: () => void
        'error-callback'?: () => void
      }) => number
      execute: (sitekey: string, options: { action: string }) => Promise<string>
    }
    recaptchaCallback?: () => void
  }
}

defineOptions({
  name: 'LoginPage'
})

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const showPassword = ref(false)
const showRegisterDialog = ref(false)
const selectedRegisterRole = ref<'pm' | 'employee' | null>(null)
const recaptchaRef = ref<HTMLDivElement | null>(null)
const recaptchaToken = ref<string | null>(null)
const recaptchaError = ref<string | null>(null)

// Security state
const failedAttempts = ref(0)
const lockoutEndTime = ref<number | null>(null)
const countdownTimer = ref<number | null>(null)
const currentTime = ref(Date.now())
const isLocked = computed(() => lockoutEndTime.value !== null && lockoutEndTime.value > Date.now())

// Countdown display
const countdownDisplay = computed(() => {
  if (!lockoutEndTime.value) return '2:00'
  const remaining = Math.max(0, lockoutEndTime.value - currentTime.value)
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const form = reactive({
  role: 'Project Manager',
  id: '',
  password: '',
  rememberMe: false
})

const roleOptions = ['Project Manager', 'Employee']

// Initialize reCAPTCHA
const initRecaptcha = () => {
  recaptchaError.value = null
  if (typeof window !== 'undefined' && window.grecaptcha && recaptchaRef.value) {
    try {
      const widgetId = window.grecaptcha.render(recaptchaRef.value, {
        sitekey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Google test site key for development
        theme: 'light',
        callback: (token: string) => {
          recaptchaToken.value = token
          recaptchaError.value = null
        },
        'expired-callback': () => {
          recaptchaToken.value = null
        },
        'error-callback': () => {
          recaptchaError.value = 'reCAPTCHA verification failed. Please try again.'
          console.error('reCAPTCHA error')
        }
      })
      console.log('reCAPTCHA widget rendered with ID:', widgetId)
    } catch (error) {
      recaptchaError.value = 'Failed to load reCAPTCHA. Please refresh the page.'
      console.error('Failed to render reCAPTCHA:', error)
    }
  } else {
    recaptchaError.value = 'reCAPTCHA not available. Please check your connection.'
  }
}


// Start lockout timer
const startLockout = () => {
  lockoutEndTime.value = Date.now() + 2 * 60 * 1000 // 2 minutes
  
  countdownTimer.value = window.setInterval(() => {
    currentTime.value = Date.now() // Update current time to trigger reactivity
    
    if (!isLocked.value) {
      // Lockout expired
      lockoutEndTime.value = null
      failedAttempts.value = 0
      if (countdownTimer.value) {
        clearInterval(countdownTimer.value)
        countdownTimer.value = null
      }
    }
  }, 1000)
}

const handleLogin = async () => {
  if (isLocked.value) {
    return
  }
  
  if (!form.id || !form.password) {
    return
  }
  
  loading.value = true
  
  try {
    // Validate reCAPTCHA
    if (!recaptchaToken.value) {
      alert('Please complete the reCAPTCHA verification')
      loading.value = false
      return
    }
    
    const result = await authStore.login(form.id, form.password)
    console.log('Login result:', result)
    
    if (result.success && result.user) {
      // Reset failed attempts on successful login
      failedAttempts.value = 0
      lockoutEndTime.value = null
      if (countdownTimer.value) {
        clearInterval(countdownTimer.value)
        countdownTimer.value = null
      }
      
      // Route based on role from database
      if (result.user.role === 'pm') {
        void router.push('/dashboard')
      } else {
        void router.push('/employee/dashboard')
      }
    } else {
      // Increment failed attempts
      failedAttempts.value++
      
      if (failedAttempts.value >= 3) {
        startLockout()
        alert('Too many failed attempts. Account locked for 2 minutes.')
      } else {
        const remainingAttempts = 3 - failedAttempts.value
        alert(`Login failed: ${result.error || 'Unknown error'}. ${remainingAttempts} attempts remaining.`)
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    alert('Error: ' + String(error))
  } finally {
    loading.value = false
  }
}

const handleRegisterNavigation = () => {
  showRegisterDialog.value = false
  
  if (selectedRegisterRole.value === 'pm') {
    void router.push('/auth/register/pm')
  } else if (selectedRegisterRole.value === 'employee') {
    void router.push('/auth/register/employee')
  }
  
  selectedRegisterRole.value = null
}

// Lifecycle hooks
onMounted(() => {
  // Load reCAPTCHA script with explicit parameters
  const script = document.createElement('script')
  script.src = 'https://www.google.com/recaptcha/api.js?render=explicit&onload=recaptchaCallback'
  script.async = true
  script.defer = true
  script.onerror = () => {
    console.error('Failed to load reCAPTCHA script')
  }
  document.head.appendChild(script)
  
  // Define global callback for reCAPTCHA
  window.recaptchaCallback = () => {
    console.log('reCAPTCHA script loaded')
    initRecaptcha()
  }
  
  // Check for existing lockout from localStorage
  const savedLockout = localStorage.getItem('tasky_lockout_end')
  if (savedLockout) {
    const lockoutTime = parseInt(savedLockout)
    if (lockoutTime > Date.now()) {
      lockoutEndTime.value = lockoutTime
      startLockout()
    } else {
      localStorage.removeItem('tasky_lockout_end')
    }
  }
})

onBeforeUnmount(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
  
  // Save lockout state if active
  if (lockoutEndTime.value && lockoutEndTime.value > Date.now()) {
    localStorage.setItem('tasky_lockout_end', lockoutEndTime.value.toString())
  } else {
    localStorage.removeItem('tasky_lockout_end')
  }
})
</script>

<style scoped>
.login-container {
  width: 100%;
}

.login-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.login-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
  font-weight: 400;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.custom-select :deep(.q-field__control) {
  border-radius: 8px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -0.5rem;
}

.remember-checkbox :deep(.q-checkbox__label) {
  font-size: 0.875rem;
  color: #6b7280;
}

.forgot-link {
  font-size: 0.875rem;
  font-weight: 500;
}

.login-button {
  background: linear-gradient(135deg, #C4F64F 0%, #9AE634 100%);
  color: #1a1a2e;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.875rem;
  border-radius: 8px;
  margin-top: 0;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(196, 246, 79, 0.3);
}

.form-footer {
  text-align: center;
  margin-top: 1rem;
}

.footer-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.create-account-link {
  font-weight: 600;
  font-size: 0.875rem;
}

/* Lockout Warning Styles */
.lockout-warning {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(242, 192, 55, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%);
  border: 2px solid rgba(242, 192, 55, 0.4);
  border-radius: 12px;
  margin-top: 0.75rem;
  box-shadow: 0 4px 12px rgba(242, 192, 55, 0.15);
}

.lockout-icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.lockout-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.lockout-text {
  font-size: 0.875rem;
  color: #f59e0b;
  font-weight: 500;
}

.lockout-timer {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f59e0b;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
}

/* reCAPTCHA Styles */
.recaptcha-container {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.recaptcha-error {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  text-align: center;
  font-weight: 500;
}

.recaptcha-hint {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  text-align: center;
  font-weight: 400;
}

/* Dialog Styles */
.register-dialog {
  min-width: 500px;
  border-radius: 16px;
}

.dialog-header {
  text-align: center;
  margin-bottom: 1rem;
}

.dialog-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 0.5rem 0;
}

.dialog-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.dialog-content {
  padding: 1rem 0;
}

.role-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.role-card {
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.role-card:hover {
  border-color: #C4F64F;
  background: rgba(196, 246, 79, 0.05);
}

.role-card-selected {
  border-color: #C4F64F;
  background: rgba(196, 246, 79, 0.1);
}

.role-card-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #C4F64F;
}

.role-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 0.5rem 0;
}

.role-card-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.dialog-actions {
  padding: 1rem 1.5rem 1.5rem;
  gap: 0.75rem;
}

/* Responsive */
@media (max-width: 600px) {
  .register-dialog {
    min-width: auto;
    width: 90vw;
    max-width: 400px;
  }

  .role-cards {
    grid-template-columns: 1fr;
  }
}
</style>
