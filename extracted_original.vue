
{"step_index":7,"source":"MODEL","type":"GREP_SEARCH","status":"DONE","created_at":"2026-09-03T19:45:00Z","content":"Cr
eated At: 2026-09-04T01:15:00+05:30\nCompleted At: 
2026-09-04T01:15:01+05:30\n{\"File\":\"c:\\\\Users\\\\HP\\\\Desktop\\\\Noval\\\\Projects\\\\TASKY-PROJECT-admin copy\\\
\src\\\\stores\\\\authStore.ts\"}\n{\"File\":\"c:\\\\Users\\\\HP\\\\Desktop\\\\Noval\\\\Projects\\\\TASKY-PROJECT-admin
 copy\\\\src\\\\router\\\\routes.ts\"}\n{\"File\":\"c:\\\\Users\\\\HP\\\\Desktop\\\\Noval\\\\Projects\\\\TASKY-PROJECT-
admin copy\\\\src\\\\pages\\\\OrganisationPage.vue\"}\n{\"File\":\"c:\\\\Users\\\\HP\\\\Desktop\\\\Noval\\\\Projects\\\
\TASKY-PROJECT-admin copy\\\\src\\\\pages\\\\auth\\\\RegisterPM.vue\"}\n{\"File\":\"c:\\\\Users\\\\HP\\\\Desktop\\\\Nov
al\\\\Projects\\\\TASKY-PROJECT-admin copy\\\\src\\\\layouts\\\\PMLayout.vue\"}\n{\"File\":\"c:\\\\Users\\\\HP\\\\Deskt
op\\\\Noval\\\\Projects\\\\TASKY-PROJECT-admin 
copy\\\\server\\\\server.js\"}\n{\"File\":\"c:\\\\Users\\\\HP\\\\Desktop\\\\Noval\\\\Projects\\\\TASKY-PROJECT-admin co
py\\\\server\\\\routes\\\\organisation.js\"}\n{\"File\":\"c:\\\\Users\\\\HP\\\\Desktop\\\\Noval\\\\Projects\\\\TASKY-PR
OJECT-admin copy\\\\server\\\\migration_add_invite_codes.sql\"}\n{\"File\":\"c:\\\\Users\\\\HP\\\\Desktop\\\\Noval\\\\P
rojects\\\\TASKY-PROJECT-admin copy\\\\node_modules\\\\vite-plugin-checker\\\\dist\\\\checkers\\\\vueTsc\\\\typescript-
vue-tsc\\\\lib\\\\de\\\\diagnosticMessages.generated.json\"}\n{\"File\":\"c:\\\\Users\\\\HP\\\\Desktop\\\\Noval\\\\Proj
ects\\\\TASKY-PROJECT-admin copy\\\\node_modules\\\\typescript\\\\lib\\\\de\\\\diagnosticMessages.generated.json\"}"}
{"step_index":8,"source":"MODEL","type":"PLANNER_RESPONSE","status":"DONE","created_at":"2026-09-03T19:45:01Z","tool_ca
lls":[{"name":"view_file","args":{"AbsolutePath":"c:\\Users\\HP\\Desktop\\Noval\\Projects\\TASKY-PROJECT-admin 
copy\\src\\pages\\OrganisationPage.vue","EndLine":200,"StartLine":1}}]}
{"step_index":9,"source":"MODEL","type":"VIEW_FILE","status":"DONE","created_at":"2026-09-03T19:45:04Z","content":"Crea
ted At: 2026-09-04T01:15:04+05:30\nCompleted At: 2026-09-04T01:15:04+05:30\nFile Path: 
`file:///c:/Users/HP/Desktop/Noval/Projects/TASKY-PROJECT-admin%20copy/src/pages/OrganisationPage.vue`\nTotal Lines: 
364\nTotal Bytes: 12461\nShowing lines 1 to 200\nThe following code has been modified to include a line number before 
every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code 
should remove the line number, colon, and leading space.\n1: <template>\n2:   <q-page\n3:     class=\"q-pa-md 
text-black\"\n4:     style=\"\n5:       height: 100vh;\n6:       max-height: 100vh;\n7:       min-height: 0 
!important;\n8:       display: flex;\n9:       flex-direction: column;\n10:       background-color: #f8f9fa;\n11:     
\"\n12:   >\n13:     <!-- Header -->\n14:     <div class=\"row items-start justify-between q-mb-md\" style=\"flex: 0 0 
auto\">\n15:       <div class=\"row items-center\">\n16:         <q-avatar\n17:           color=\"indigo-1\"\n18:      
     text-color=\"indigo\"\n19:           icon=\"domain\"\n20:           size=\"48px\"\n21:           
class=\"q-mr-md\"\n22:           style=\"border-radius: 12px\"\n23:         />\n24:         <div 
class=\"column\">\n25:           <div class=\"text-h5 text-weight-bold\">\n26:             {{ orgStore.org?.name || 
'Organisation Structure' }}\n27:           </div>\n28:           <div class=\"text-grey-7 text-caption\">Manage your 
team members and roles</div>\n29:         </div>\n30:       </div>\n31:       <div class=\"row items-center 
q-gutter-sm\">\n32:         <q-btn\n33:           unelevated\n34:           color=\"indigo\"\n35:           
icon=\"add\"\n36:           label=\"Invite Member\"\n37:           no-caps\n38:           
class=\"rounded-borders\"\n39:           @click=\"showInviteDialog = true\"\n40:         />\n41:       </div>\n42:     
</div>\n43: \n44:     <!-- Main Content -->\n45:     <div\n46:       class=\"bg-white q-pa-md shadow-1\"\n47:       
style=\"border-radius: 12px; flex: 1 1 0; overflow-y: auto\"\n48:     >\n49:       <div v-if=\"orgStore.loading\" 
class=\"flex flex-center q-pa-xl\">\n50:         <q-spinner-dots size=\"40px\" color=\"primary\" />\n51:       
</div>\n52: \n53:       <div v-else-if=\"orgStore.members.length > 0\">\n54:         <!-- Display invite code if 
active -->\n55:         <div class=\"col-12\" v-if=\"orgStore.activeInviteCode\">\n56:           <q-banner rounded 
class=\"bg-indigo-1 text-indigo q-mb-md\">\n57:             <template v-slot:avatar>\n58:               <q-icon 
name=\"link\" />\n59:             </template>\n60:             Active Invite Code:\n61:             <span 
class=\"text-weight-bold text-h6\">{{ orgStore.activeInviteCode.code }}</span>\n62:             <div 
class=\"text-caption\">\n63:               Expires in\n64:               {{\n65:                 
orgStore.activeInviteCode.expires_at\n66:                   ? new 
Date(orgStore.activeInviteCode.expires_at).toLocaleDateString()\n67:                   : 'N/A'\n68:               
}}\n69:             </div>\n70:             <template v-slot:action>\n71:               <q-btn\n72:                 
flat\n73:                 color=\"indigo\"\n74:                 label=\"Deactivate\"\n75:                 
      </div>

      <div v-else-if="orgStore.members.length > 0">
        <!-- Display invite code if active -->
        <div class="col-12" v-if="orgStore.activeInviteCode">
          <q-banner rounded class="bg-indigo-1 text-indigo q-mb-md">
            <template v-slot:avatar>
              <q-icon name="link" />
            </template>
            Active Invite Code:
            <span class="text-weight-bold text-h6">{{ orgStore.activeInviteCode.code }}</span>
            <div class="text-caption">
              Expires in
              {{
                orgStore.activeInviteCode.expires_at
                  ? new Date(orgStore.activeInviteCode.expires_at).toLocaleDateString()
                  : 'N/A'
              }}
            </div>
            <template v-slot:action>
              <q-btn
                flat
                color="indigo"
                label="Deactivate"
                @click="deactivateInvite(orgStore.activeInviteCode.id)"
              />
            </template>
          </q-banner>
        </div>

        <!-- Complete Member Directory Grid -->
        <div class="text-h6 text-weight-bold q-mb-md q-mt-md">Complete Organization Directory</div>
        <div class="row q-col-gutter-md">
          <div
            v-for="member in orgStore.members"
            :key="member.id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card
              flat
              bordered
              class="q-pa-sm cursor-pointer hover:bg-grey-1"
              @click="viewMemberDetails(member)"
            >
              <div class="row items-center q-gutter-sm">
                <q-avatar size="48px" color="indigo-1" text-color="indigo">
                  <img v-if="member.avatar_url" :src="member.avatar_url" />
                  <span v-else
                    >{{ member.first_name?.charAt(0) }}{{ member.last_name?.charAt(0) }}</span
                  >
                </q-avatar>
                <div class="column" style="flex: 1">
                  <div class="text-weight-bold text-grey-9">
                    {{ member.first_name }} {{ member.last_name }}
                  </div>
                  <div class="text-caption text-grey-7">{{ member.employee_code }}</div>
                  <div class="text-caption text-grey-6">{{ member.email }}</div>
                </div>
              </div>
              <div class="row items-center justify-between q-mt-sm">
                <q-badge
                  :color="member.role_name === 'Project Manager' ? 'orange-1' : 'blue-1'"
                  :text-color="member.role_name === 'Project Manager' ? 'orange' : 'blue'"
                  :label="member.role_name || 'Employee'"
                  class="q-px-sm"
                />
                <div class="text-caption text-grey-6">
                  {{ member.professional_role || 'No role' }}
                </div>
              </div>
            </q-card>
          </div>
        </div>

        <!-- Role-based Grouping -->
        <div class="text-h6 text-weight-bold q-mb-md q-mt-lg">By Role</div>
        <div class="row q-col-gutter-md">
          <div
            v-for="(members, role) in groupedMembers"
            :key="role"
            class="col-12 col-md-6 col-lg-4"
          >
            <q-card flat bordered class="full-height">
              <q-card-section class="bg-grey-1 row items-center justify-between">
                <div class="text-subtitle1 text-weight-bold text-capitalize">
                  {{ role || 'Unassigned' }}
                </div>
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
                      <q-item-label class="text-weight-medium text-grey-9"
                        >{{ member.first_name }} {{ member.last_name }}</q-item-label
                      >
                      <q-item-label caption class="text-grey-6">{{ member.email }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge
                        :color="member.role_name === 'Project Manager' ? 'orange-1' : 'grey-2'"
                        :text-color="member.role_name === 'Project Manager' ? 'orange' : 'grey-7'"
                        :label="member.role_name === 'Project Manager' ? 'Manager' : 'Employee'"
                        class="q-px-sm"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-center full-height text-grey-6 text-subtitle1 column">
        <q-icon name="domain_disabled" size="64px" color="grey-4" class="q-mb-md" />
        No members found. Invite some to get started.
      </div>
    </div>

    <!-- Invite Member Dialog -->
    <q-dialog v-model="showInviteDialog">
      <q-card style="min-width: 500px; max-width: 600px">
        <q-card-section>
          <div class="text-h6 text-weight-bold">
            <q-icon name="person_add" class="q-mr-sm" color="indigo" />
            Invite Team Member
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-if="!inviteCodeGenerated">
            <q-input
              v-model="inviteEmail"
              label="Email Address (Optional)"
              outlined
              hint="Leave empty to generate a shareable invite link"
              class="q-mb-md"
            />
            <q-select
              v-model="inviteRole"
              label="Role"
              :options="['Employee', 'Project Manager']"
              outlined
              class="q-mb-md"
            />
            <q-input
              v-model="inviteMaxUses"
              label="Max Uses"
              type="number"
              outlined
              hint="Maximum number of times this invite can be used"
              class="q-mb-md"
            />
          </div>

          <div v-else class="column items-center q-gutter-md">
            <div class="text-subtitle1 text-weight-bold text-indigo">
              <q-icon name="check_circle" class="q-mr-sm" />
              Invite Code Generated!
            </div>
            <q-card flat bordered class="q-pa-md full-width bg-indigo-1">
              <div class="text-h6 text-center text-indigo-9 q-mb-sm">{{ generatedInviteCode }}</div>
              <div class="text-caption text-center text-grey-7">
                Invite Link:
                <a :href="inviteLink" target="_blank" class="text-indigo">{{ inviteLink }}</a>
              </div>
            </q-card>
            <div class="row q-gutter-sm q-mt-md">
              <q-btn
                unelevated
                color="green"
                icon="whatsapp"
                label="Share via WhatsApp"
                @click="shareViaWhatsApp"
                no-caps
              />
              <q-btn
                unelevated
                color="indigo"
                icon="content_copy"
                label="Copy Link"
                @click="copyInviteLink"
                no-caps
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup @click="resetInviteForm" />
          <q-btn
            v-if="!inviteCodeGenerated"
            unelevated
            color="indigo"
            label="Generate Invite"
            @click="generateInviteCode"
            :loading="generatingInvite"
          />
          <q-btn
            v-else
            unelevated
            color="indigo"
            label="Generate Another"
            @click="resetInviteForm"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useOrgStore } from '../stores/orgStore';

const orgStore = useOrgStore();
const $q = useQuasar();

const showInviteDialog = ref(false);
const inviteEmail = ref('');
const inviteRole = ref('Employee');
const inviteMaxUses = ref(50);
const inviteCodeGenerated = ref(false);
const generatedInviteCode = ref('');
const generatingInvite = ref(false);

const inviteLink = computed(() => {
  if (!generatedInviteCode.value) return '';
  return `http://localhost:9007/auth/register?invite=${generatedInviteCode.value}`;
});

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

const deactivateInvite = async (id: string) => {
  await orgStore.deactivateInviteCode(id);
};

const viewMemberDetails = (member: any) => {
  console.log('View member details:', member);
  // Could open a dialog or navigate to a detailed view
};

const generateInviteCode = async () => {
  generatingInvite.value = true;
  try {
    const code = await orgStore.generateInviteCode(inviteMaxUses.value, 30);
    generatedInviteCode.value = code.code;
    inviteCodeGenerated.value = true;
    $q.notify({
      type: 'positive',
      message: 'Invite code generated successfully!',
    });
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to generate invite code',
    });
  } finally {
    generatingInvite.value = false;
  }
};

const shareViaWhatsApp = () => {
  const message = `You're invited to join our organization! Use this invite code: ${generatedInviteCode.value}\n\nOr click here to register: ${inviteLink.value}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

const copyInviteLink = () => {
  navigator.clipboard.writeText(inviteLink.value);
  $q.notify({
    type: 'positive',
    message: 'Invite link copied to clipboard!',
  });
};

const resetInviteForm = () => {
  inviteEmail.value = '';
  inviteRole.value = 'Employee';
  inviteMaxUses.value = 50;
  inviteCodeGenerated.value = false;
  generatedInviteCode.value = '';
};
</script>
