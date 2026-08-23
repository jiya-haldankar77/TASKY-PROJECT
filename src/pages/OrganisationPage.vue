<template>
  <q-page class="q-pa-md text-black" style="height: 100vh; max-height: 100vh; min-height: 0 !important; display: flex; flex-direction: column; background-color: #f8f9fa;">
    
    <!-- Header -->
    <div class="row items-start justify-between q-mb-md" style="flex: 0 0 auto;">
      <div class="row items-center">
        <q-avatar color="indigo-1" text-color="indigo" icon="domain" size="48px" class="q-mr-md" style="border-radius: 12px;" />
        <div class="column">
          <div class="text-h5 text-weight-bold">{{ orgStore.org?.name || 'Organisation Structure' }}</div>
          <div class="text-grey-7 text-caption">Manage your team members and roles</div>
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn unelevated color="indigo" icon="add" label="Invite Member" no-caps class="rounded-borders" @click="generateInvite" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="bg-white q-pa-md shadow-1" style="border-radius: 12px; flex: 1 1 0; overflow-y: auto;">
      
      <div v-if="orgStore.loading" class="flex flex-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
      </div>

      <div v-else-if="orgStore.members.length > 0" class="row q-col-gutter-md">
        <!-- Display invite code if active -->
        <div class="col-12" v-if="orgStore.activeInviteCode">
          <q-banner rounded class="bg-indigo-1 text-indigo q-mb-md">
            <template v-slot:avatar>
              <q-icon name="link" />
            </template>
            Active Invite Code: <span class="text-weight-bold text-h6">{{ orgStore.activeInviteCode.code }}</span>
            <div class="text-caption">Expires in {{ orgStore.activeInviteCode.expires_at ? new Date(orgStore.activeInviteCode.expires_at).toLocaleDateString() : 'N/A' }}</div>
            <template v-slot:action>
              <q-btn flat color="indigo" label="Deactivate" @click="deactivateInvite(orgStore.activeInviteCode.id)" />
            </template>
          </q-banner>
        </div>

        <div v-for="(members, role) in groupedMembers" :key="role" class="col-12 col-md-6 col-lg-4">
          <q-card flat bordered class="full-height">
            <q-card-section class="bg-grey-1 row items-center justify-between">
              <div class="text-subtitle1 text-weight-bold text-capitalize">{{ role || 'Unassigned' }}</div>
              <q-badge color="primary" :label="`${members.length} members`" />
            </q-card-section>
            
            <q-card-section>
              <q-list separator dense>
                <q-item v-for="member in members" :key="member.id" class="q-px-none">
                  <q-item-section avatar>
                    <q-avatar size="32px" color="grey-3" text-color="grey-8">
                      {{ member.first_name?.charAt(0) }}{{ member.last_name?.charAt(0) }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium text-grey-9">{{ member.first_name }} {{ member.last_name }}</q-item-label>
                    <q-item-label caption class="text-grey-6">{{ member.email }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge :color="member.role_name === 'Project Manager' ? 'orange-1' : 'grey-2'" :text-color="member.role_name === 'Project Manager' ? 'orange' : 'grey-7'" :label="member.role_name === 'Project Manager' ? 'Manager' : 'Employee'" class="q-px-sm" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>
      
      <div v-else class="flex flex-center full-height text-grey-6 text-subtitle1 column">
        <q-icon name="domain_disabled" size="64px" color="grey-4" class="q-mb-md" />
        No members found. Invite some to get started.
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useOrgStore } from '../stores/orgStore';

const orgStore = useOrgStore();

onMounted(async () => {
  await orgStore.fetchOrgDetails();
  await orgStore.fetchMembers();
});

const groupedMembers = computed(() => {
  const groups: Record<string, any[]> = {};
  orgStore.members.forEach((member: any) => {
    let role = member.professional_role || 'Unassigned';
    
    // Explicitly separate Project Managers from other roles
    if (member.role_name === 'Project Manager') {
      role = 'Project Manager';
    }

    if (!groups[role]) {
      groups[role] = [];
    }
    groups[role]!.push(member);
  });
  return groups;
});

const generateInvite = async () => {
  await orgStore.generateInviteCode();
};

const deactivateInvite = async (id: string) => {
  await orgStore.deactivateInviteCode(id);
};
</script>
