<template>
  <q-page class="q-pa-sm text-black" style="height: 100vh; max-height: 100vh; min-height: 0 !important; overflow: hidden; display: flex; flex-direction: column;">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-sm" style="flex: 0 0 auto;">
      <div class="text-h6 text-weight-bold">Welcome back, Project Manager 👋</div>
      <div class="row items-center q-gutter-sm">
        <q-input v-model="searchQuery" outlined dense rounded bg-color="white" placeholder="Search..." style="width: 250px;" class="shadow-1">
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-avatar size="32px">
          <img src="https://cdn.quasar.dev/img/avatar.png" />
        </q-avatar>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row q-col-gutter-sm q-mb-sm" style="flex: 0 0 auto;">
      <!-- Total Projects -->
      <div class="col-3">
        <q-card flat class="rounded-borders q-pa-sm shadow-1" style="border-radius: 8px;">
           <div class="row justify-between items-center q-mb-xs">
             <div class="text-grey-7 text-caption text-weight-medium" style="font-size: 10px;">Total Projects</div>
             <q-avatar size="24px" color="indigo-1" text-color="indigo" icon="o_folder" />
           </div>
           <div class="text-h6 text-weight-bold text-indigo" style="line-height: 1;">3</div>
           <div class="text-caption text-grey-6" style="font-size: 9px; line-height: 1; margin-top: 2px;">3 active</div>
        </q-card>
      </div>
      <!-- Overall Progress -->
      <div class="col-3">
        <q-card flat class="rounded-borders q-pa-sm shadow-1" style="border-radius: 8px;">
           <div class="row justify-between items-center q-mb-xs">
             <div class="text-grey-7 text-caption text-weight-medium" style="font-size: 10px;">Overall Progress</div>
             <q-avatar size="24px" color="green-1" text-color="green" icon="o_stars" />
           </div>
           <div class="text-h6 text-weight-bold text-green" style="line-height: 1;">63%</div>
           <div class="row items-center text-grey-6" style="font-size: 9px; line-height: 1; margin-top: 2px;">
              <q-icon name="arrow_upward" color="green" size="10px" /> <span class="text-green q-mr-xs">12%</span> from last month
           </div>
           <q-linear-progress :value="0.63" color="green" size="3px" class="q-mt-xs rounded-borders" />
        </q-card>
      </div>
      <!-- Tasks in Progress -->
      <div class="col-3">
        <q-card flat class="rounded-borders q-pa-sm shadow-1" style="border-radius: 8px;">
           <div class="row justify-between items-center q-mb-xs">
             <div class="text-grey-7 text-caption text-weight-medium" style="font-size: 10px;">Tasks in Progress</div>
             <q-avatar size="24px" color="orange-1" text-color="orange" icon="o_settings" />
           </div>
           <div class="text-h6 text-weight-bold text-orange" style="line-height: 1;">6</div>
           <div class="text-caption text-grey-6" style="font-size: 9px; line-height: 1; margin-top: 2px;">4 completed</div>
        </q-card>
      </div>
      <!-- At Risk -->
      <div class="col-3">
        <q-card flat class="rounded-borders q-pa-sm shadow-1" style="border-radius: 8px;">
           <div class="row justify-between items-center q-mb-xs">
             <div class="text-grey-7 text-caption text-weight-medium" style="font-size: 10px;">At Risk</div>
             <q-avatar size="24px" color="red-1" text-color="red" icon="o_warning" />
           </div>
           <div class="text-h6 text-weight-bold text-red" style="line-height: 1;">22</div>
           <div class="text-caption text-grey-6" style="font-size: 9px; line-height: 1; margin-top: 2px;">11 critical</div>
        </q-card>
      </div>
    </div>

    <!-- Main Grid Rows -->
    <div class="flex column" style="flex: 1 1 0; min-height: 0; gap: 8px;">
       
       <!-- Row 1: Projects Overview (Full width) -->
       <div class="row" style="flex: 1.4 1 0; min-height: 0;">
         <div class="col-12" style="height: 100%;">
           <q-card flat class="rounded-borders q-pa-sm shadow-1 flex column" style="border-radius: 8px; height: 100%;">
              <div class="row justify-between items-center q-mb-xs" style="flex: 0 0 auto;">
                <div class="text-subtitle2 text-weight-bold" style="line-height: 1;">Projects Overview</div>
                <q-btn flat no-caps dense label="View All" color="grey-8" class="bg-grey-2 q-px-sm" style="border-radius: 4px; font-size: 9px; min-height: unset; padding: 2px 6px;" />
              </div>
              
              <div style="flex: 1; overflow: hidden; position: relative;">
                <q-markup-table flat dense class="no-shadow absolute-full stretch-table" style="background: transparent;">
                   <thead>
                     <tr class="text-left text-grey-8">
                       <th style="font-size: 12px; font-weight: 600;">Project Name</th>
                       <th style="font-size: 12px; font-weight: 600;">Status</th>
                       <th style="font-size: 12px; font-weight: 600; width: 120px;">Progress</th>
                       <th style="font-size: 12px; font-weight: 600; text-align: center;">Priority</th>
                       <th style="font-size: 12px; font-weight: 600; text-align: right;">End Date</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr>
                       <td class="text-weight-bold" style="font-size: 14px;">E-Commerce Platform Redesign</td>
                       <td><q-badge color="green-1" text-color="green" label="Active" class="q-px-sm q-py-xs text-weight-bold" style="font-size: 11px;" /></td>
                       <td>
                          <div class="row items-center">
                            <span class="q-mr-sm text-caption" style="font-size: 12px;">65%</span>
                            <q-linear-progress :value="0.65" color="blue" class="col" size="6px" rounded />
                          </div>
                       </td>
                       <td class="text-center"><q-badge color="orange" label="High" class="q-px-sm q-py-xs rounded-borders text-weight-bold" style="font-size: 11px;" /></td>
                       <td class="text-grey-8 text-right" style="font-size: 13px;">2024-06-30</td>
                     </tr>
                     <tr>
                       <td class="text-weight-bold" style="font-size: 14px;">Mobile Banking App</td>
                       <td><q-badge color="green-1" text-color="green" label="Active" class="q-px-sm q-py-xs text-weight-bold" style="font-size: 11px;" /></td>
                       <td>
                          <div class="row items-center">
                            <span class="q-mr-sm text-caption" style="font-size: 12px;">40%</span>
                            <q-linear-progress :value="0.4" color="orange" class="col" size="6px" rounded />
                          </div>
                       </td>
                       <td class="text-center"><q-badge color="red" label="Critical" class="q-px-sm q-py-xs rounded-borders text-weight-bold" style="font-size: 11px;" /></td>
                       <td class="text-grey-8 text-right" style="font-size: 13px;">2024-08-15</td>
                     </tr>
                     <tr>
                       <td class="text-weight-bold" style="font-size: 14px;">Internal Analytics Dashboard</td>
                       <td><q-badge color="green-1" text-color="green" label="Active" class="q-px-sm q-py-xs text-weight-bold" style="font-size: 11px;" /></td>
                       <td>
                          <div class="row items-center">
                            <span class="q-mr-sm text-caption" style="font-size: 12px;">85%</span>
                            <q-linear-progress :value="0.85" color="green" class="col" size="6px" rounded />
                          </div>
                       </td>
                       <td class="text-center"><q-badge color="blue" label="Medium" class="q-px-sm q-py-xs rounded-borders text-weight-bold" style="font-size: 11px;" /></td>
                       <td class="text-grey-8 text-right" style="font-size: 13px;">2024-05-30</td>
                     </tr>
                   </tbody>
                </q-markup-table>
              </div>
           </q-card>
         </div>
       </div>

       <!-- Row 2: 4 equal cards -->
       <div class="row q-col-gutter-sm" style="flex: 1 1 0; min-height: 0;">
          <!-- Tasks by Priority -->
          <div class="col-3" style="height: 100%;">
            <q-card flat class="rounded-borders q-pa-sm shadow-1 flex column" style="border-radius: 8px; height: 100%;">
               <div class="text-caption text-weight-bold q-mb-xs q-px-xs" style="flex: 0 0 auto;">Tasks by Priority</div>
               
               <div class="row items-center" style="flex: 1 1 0; min-height: 0;">
                 <div class="col-5 flex flex-center relative-position" style="height: 100%;">
                    <div class="donut-chart" style="width: 70px; height: 70px; border-radius: 50%; background: conic-gradient(#f44336 0% 22%, #ff9800 22% 60%, #2196f3 60% 85%, #4caf50 85% 100%);"></div>
                    <div class="absolute-center bg-white flex flex-center column" style="width: 44px; height: 44px; border-radius: 50%;">
                       <div class="text-weight-bold" style="line-height: 1; font-size: 14px;">31</div>
                    </div>
                 </div>
                 <div class="col-7 q-pl-sm flex column justify-center" style="height: 100%;">
                    <div class="row justify-between text-weight-medium" style="font-size: 12px; margin-bottom: 4px;"><span class="flex items-center"><q-icon name="circle" color="red" size="10px" class="q-mr-xs"/>Critical</span> <b>7</b></div>
                    <div class="row justify-between text-weight-medium" style="font-size: 12px; margin-bottom: 4px;"><span class="flex items-center"><q-icon name="circle" color="orange" size="10px" class="q-mr-xs"/>High</span> <b>12</b></div>
                    <div class="row justify-between text-weight-medium" style="font-size: 12px; margin-bottom: 4px;"><span class="flex items-center"><q-icon name="circle" color="blue" size="10px" class="q-mr-xs"/>Medium</span> <b>8</b></div>
                    <div class="row justify-between text-weight-medium" style="font-size: 12px;"><span class="flex items-center"><q-icon name="circle" color="green" size="10px" class="q-mr-xs"/>Low</span> <b>4</b></div>
                 </div>
               </div>
            </q-card>
          </div>

          <!-- Task Status -->
          <div class="col-3" style="height: 100%;">
            <q-card flat class="rounded-borders q-pa-sm shadow-1 flex column" style="border-radius: 8px; height: 100%;">
               <div class="text-caption text-weight-bold q-mb-xs q-px-xs" style="flex: 0 0 auto;">Task Status</div>
               
               <div class="row items-center" style="flex: 1 1 0; min-height: 0;">
                 <div class="col-5 relative-position" style="height: 100%; padding-top: 8px;">
                   <div class="row items-end justify-around q-px-xs q-ml-sm" style="height: 100%; border-left: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; position: relative;">
                     <div class="absolute text-grey-6" style="left: -14px; bottom: -8px; font-size: 10px;">0</div>
                     <div class="absolute text-grey-6" style="left: -14px; bottom: 50%; font-size: 10px;">4</div>
                     <div class="absolute text-grey-6" style="left: -14px; top: -8px; font-size: 10px;">8</div>
                     
                     <div class="bg-grey-7" style="width: 16%; height: 62.5%; border-radius: 4px 4px 0 0;"></div>
                     <div class="bg-blue" style="width: 16%; height: 75%; border-radius: 4px 4px 0 0;"></div>
                     <div class="bg-green" style="width: 16%; height: 50%; border-radius: 4px 4px 0 0;"></div>
                     <div class="bg-red" style="width: 16%; height: 5%; border-radius: 4px 4px 0 0;"></div>
                   </div>
                 </div>

                 <div class="col-7 q-pl-md flex column justify-center" style="height: 100%;">
                    <div class="row justify-between text-weight-medium" style="font-size: 12px; margin-bottom: 4px;"><span class="flex items-center"><q-icon name="square" color="grey-7" size="10px" class="q-mr-xs"/>Not Started</span> <b>5</b></div>
                    <div class="row justify-between text-weight-medium" style="font-size: 12px; margin-bottom: 4px;"><span class="flex items-center"><q-icon name="square" color="blue" size="10px" class="q-mr-xs"/>In Progress</span> <b>6</b></div>
                    <div class="row justify-between text-weight-medium" style="font-size: 12px; margin-bottom: 4px;"><span class="flex items-center"><q-icon name="square" color="green" size="10px" class="q-mr-xs"/>Completed</span> <b>4</b></div>
                    <div class="row justify-between text-weight-medium" style="font-size: 12px;"><span class="flex items-center"><q-icon name="square" color="red" size="10px" class="q-mr-xs"/>Blocked</span> <b>0</b></div>
                 </div>
               </div>
            </q-card>
          </div>

          <!-- Recent Activity -->
          <div class="col-3" style="height: 100%;">
            <q-card flat class="rounded-borders q-pa-sm shadow-1 flex column" style="border-radius: 8px; height: 100%;">
               <div class="row justify-between items-center q-mb-xs" style="flex: 0 0 auto;">
                 <div class="text-caption text-weight-bold" style="line-height: 1;">Recent Activity</div>
                 <q-btn flat no-caps dense label="All" color="grey-8" class="bg-grey-2 q-px-xs" style="border-radius: 4px; font-size: 8px; min-height: 12px; padding: 2px 4px;" />
               </div>
               <div style="flex: 1 1 0; min-height: 0; position: relative;">
                 <q-list dense class="absolute-full flex column justify-around" style="overflow: hidden;">
                   <q-item class="q-pa-none">
                     <q-item-section avatar top style="min-width: 24px; padding-right: 6px;">
                       <q-avatar size="22px"><img src="https://cdn.quasar.dev/img/avatar1.jpg" /></q-avatar>
                     </q-item-section>
                     <q-item-section>
                       <q-item-label class="text-weight-bold" style="font-size: 11px; line-height: 1.1;">Sarah Johnson</q-item-label>
                       <q-item-label caption class="text-grey-7" style="font-size: 9px; line-height: 1.1;">Completed "Design"</q-item-label>
                     </q-item-section>
                   </q-item>
                   <q-item class="q-pa-none">
                     <q-item-section avatar top style="min-width: 24px; padding-right: 6px;">
                       <q-avatar size="22px"><img src="https://cdn.quasar.dev/img/avatar2.jpg" /></q-avatar>
                     </q-item-section>
                     <q-item-section>
                       <q-item-label class="text-weight-bold" style="font-size: 11px; line-height: 1.1;">Michael Chen</q-item-label>
                       <q-item-label caption class="text-grey-7" style="font-size: 9px; line-height: 1.1;">Updated task</q-item-label>
                     </q-item-section>
                   </q-item>
                   <q-item class="q-pa-none">
                     <q-item-section avatar top style="min-width: 24px; padding-right: 6px;">
                       <q-avatar size="22px"><img src="https://cdn.quasar.dev/img/avatar3.jpg" /></q-avatar>
                     </q-item-section>
                     <q-item-section>
                       <q-item-label class="text-weight-bold" style="font-size: 11px; line-height: 1.1;">Emily Davis</q-item-label>
                       <q-item-label caption class="text-grey-7" style="font-size: 9px; line-height: 1.1;">Created new task</q-item-label>
                     </q-item-section>
                   </q-item>
                 </q-list>
               </div>
            </q-card>
          </div>

          <!-- Calendar -->
          <div class="col-3" style="height: 100%;">
            <q-card flat class="rounded-borders q-pa-sm shadow-1 flex column justify-between" style="border-radius: 8px; height: 100%;">
              <div class="row justify-between items-center q-mb-xs" style="flex: 0 0 auto;">
                <q-btn flat round dense icon="chevron_left" size="8px" />
                <div class="text-weight-bold" style="font-size: 11px;">August, 2024</div>
                <q-btn flat round dense icon="chevron_right" size="8px" />
              </div>
              
              <div class="row text-center text-grey-8 text-weight-bold" style="font-size: 9px; margin-bottom: 2px;">
                <div class="col">S</div><div class="col">M</div><div class="col">T</div>
                <div class="col">W</div><div class="col">T</div><div class="col">F</div><div class="col">S</div>
              </div>
              <div class="row text-center" style="font-size: 9px; line-height: 14px; font-weight: 500;">
                <div class="col text-grey-4">28</div><div class="col text-grey-4">29</div><div class="col text-grey-4">30</div>
                <div class="col text-grey-4">31</div><div class="col">1</div><div class="col">2</div><div class="col">3</div>
              </div>
              <div class="row text-center" style="font-size: 9px; line-height: 14px; font-weight: 500;">
                <div class="col">4</div><div class="col">5</div><div class="col">6</div>
                <div class="col">7</div><div class="col">8</div><div class="col">9</div><div class="col">10</div>
              </div>
              <div class="row text-center" style="font-size: 9px; line-height: 14px; font-weight: 500;">
                <div class="col">11</div><div class="col">12</div><div class="col">13</div>
                <div class="col">14</div><div class="col">15</div><div class="col">16</div>
                <div class="col"><div class="bg-lime-13 text-black text-weight-bold" style="width: 14px; height: 14px; display: inline-block; line-height: 14px; border-radius: 50%;">17</div></div>
              </div>
              <div class="row text-center" style="font-size: 9px; line-height: 14px; font-weight: 500;">
                <div class="col">18</div><div class="col">19</div><div class="col">20</div>
                <div class="col">21</div><div class="col">22</div><div class="col">23</div><div class="col">24</div>
              </div>
              <div class="row text-center" style="font-size: 9px; line-height: 14px; font-weight: 500;">
                <div class="col">25</div><div class="col">26</div><div class="col">27</div>
                <div class="col">28</div><div class="col">29</div><div class="col">30</div><div class="col">31</div>
              </div>
            </q-card>
          </div>
       </div>

       <!-- Row 3: Resource Workload and Upcoming Deadlines -->
       <div class="row q-col-gutter-sm" style="flex: 1.4 1 0; min-height: 0;">
          <!-- Resource Workload (2/3rd) -->
          <div class="col-8" style="height: 100%;">
            <q-card flat class="rounded-borders q-pa-sm shadow-1 flex column" style="border-radius: 8px; height: 100%;">
              <div class="row justify-between items-center q-mb-xs" style="flex: 0 0 auto;">
                <div class="text-subtitle2 text-weight-bold" style="line-height: 1;">Resource Workload</div>
                <q-btn flat no-caps dense label="View All" color="grey-8" class="bg-grey-2 q-px-sm" style="border-radius: 4px; font-size: 9px; min-height: unset; padding: 2px 6px;" />
              </div>
              
              <div style="flex: 1 1 0; min-height: 0; position: relative;">
                <q-markup-table flat dense class="no-shadow absolute-full stretch-table" style="background: transparent;">
                   <thead>
                     <tr class="text-left text-grey-8">
                       <th style="font-size: 12px; font-weight: 600;">Resource</th>
                       <th style="font-size: 12px; font-weight: 600;">Workload</th>
                       <th style="font-size: 12px; font-weight: 600; text-align: center;">Status</th>
                       <th style="font-size: 12px; font-weight: 600; text-align: center;">Tasks</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr>
                       <td>
                         <div class="row items-center">
                           <q-avatar size="24px" class="q-mr-sm"><img src="https://cdn.quasar.dev/img/avatar1.jpg" /></q-avatar>
                           <span class="text-weight-bold" style="font-size: 13px;">Sarah Johnson</span>
                         </div>
                       </td>
                       <td style="width: 140px;">
                         <div class="text-grey-8" style="font-size: 11px; margin-bottom: 2px;">124.5h / 130h</div>
                         <q-linear-progress :value="124.5/130" color="red" size="6px" rounded />
                       </td>
                       <td class="text-center"><q-badge color="red" label="Overloaded" class="q-px-sm q-py-xs rounded-borders text-weight-bold" style="font-size: 11px;" /></td>
                       <td class="text-center text-weight-bold" style="font-size: 13px;">5</td>
                     </tr>
                     <tr>
                       <td>
                         <div class="row items-center">
                           <q-avatar size="24px" class="q-mr-sm"><img src="https://cdn.quasar.dev/img/avatar2.jpg" /></q-avatar>
                           <span class="text-weight-bold" style="font-size: 13px;">Michael Chen</span>
                         </div>
                       </td>
                       <td>
                         <div class="text-grey-8" style="font-size: 11px; margin-bottom: 2px;">120.5h / 130h</div>
                         <q-linear-progress :value="120.5/130" color="red" size="6px" rounded />
                       </td>
                       <td class="text-center"><q-badge color="red" label="Overloaded" class="q-px-sm q-py-xs rounded-borders text-weight-bold" style="font-size: 11px;" /></td>
                       <td class="text-center text-weight-bold" style="font-size: 13px;">6</td>
                     </tr>
                     <tr>
                       <td>
                         <div class="row items-center">
                           <q-avatar size="24px" class="q-mr-sm"><img src="https://cdn.quasar.dev/img/avatar3.jpg" /></q-avatar>
                           <span class="text-weight-bold" style="font-size: 13px;">Emily Davis</span>
                         </div>
                       </td>
                       <td>
                         <div class="text-grey-8" style="font-size: 11px; margin-bottom: 2px;">90h / 130h</div>
                         <q-linear-progress :value="90/130" color="green" size="6px" rounded />
                       </td>
                       <td class="text-center"><q-badge color="green" label="Available" class="q-px-sm q-py-xs rounded-borders text-weight-bold" style="font-size: 11px;" /></td>
                       <td class="text-center text-weight-bold" style="font-size: 13px;">3</td>
                     </tr>
                   </tbody>
                </q-markup-table>
              </div>
            </q-card>
          </div>

          <!-- Upcoming Deadlines (1/3rd) -->
          <div class="col-4" style="height: 100%;">
            <q-card flat class="rounded-borders q-pa-sm shadow-1 flex column" style="border-radius: 8px; height: 100%;">
              <div class="row justify-between items-center q-mb-xs q-px-xs" style="flex: 0 0 auto;">
                <div class="text-subtitle2 text-weight-bold" style="line-height: 1;">Upcoming Deadlines</div>
                <q-btn flat no-caps dense label="View All" color="grey-8" class="bg-grey-2 q-px-xs" style="border-radius: 4px; font-size: 8px; min-height: unset; padding: 2px 4px;" />
              </div>
              
              <div style="flex: 1 1 0; min-height: 0; position: relative;">
                <q-list class="absolute-full flex column justify-around" style="overflow-y: auto; overflow-x: hidden;">
                  <q-item class="q-pa-none">
                    <q-item-section avatar top style="min-width: 32px; padding-right: 8px;">
                      <q-avatar size="28px" color="red-1" text-color="red" icon="warning" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-bold ellipsis" style="font-size: 13px; line-height: 1.2;">Chart Components</q-item-label>
                      <q-item-label caption class="text-grey-7 ellipsis" style="font-size: 11px; line-height: 1.2;">Analytics Dash • 3d</q-item-label>
                    </q-item-section>
                    <q-item-section side top>
                      <q-badge color="red" label="High" class="rounded-borders text-weight-bold" style="font-size: 11px; padding: 4px 6px;" />
                    </q-item-section>
                  </q-item>
                  
                  <q-item class="q-pa-none">
                    <q-item-section avatar top style="min-width: 32px; padding-right: 8px;">
                      <q-avatar size="28px" color="red-1" text-color="red" icon="warning" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-bold ellipsis" style="font-size: 13px; line-height: 1.2;">User Auth</q-item-label>
                      <q-item-label caption class="text-grey-7 ellipsis" style="font-size: 11px; line-height: 1.2;">Banking App • 4d</q-item-label>
                    </q-item-section>
                    <q-item-section side top>
                      <q-badge color="red" label="High" class="rounded-borders text-weight-bold" style="font-size: 11px; padding: 4px 6px;" />
                    </q-item-section>
                  </q-item>
                  
                  <q-item class="q-pa-none">
                    <q-item-section avatar top style="min-width: 32px; padding-right: 8px;">
                      <q-avatar size="28px" color="blue-1" text-color="blue" icon="info" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-bold ellipsis" style="font-size: 13px; line-height: 1.2;">Product Catalog</q-item-label>
                      <q-item-label caption class="text-grey-7 ellipsis" style="font-size: 11px; line-height: 1.2;">E-Commerce • 12d</q-item-label>
                    </q-item-section>
                    <q-item-section side top>
                      <q-badge color="blue" label="Med" class="rounded-borders text-weight-bold" style="font-size: 11px; padding: 4px 6px;" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-card>
          </div>
       </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const searchQuery = ref('');
</script>

<style scoped>
.bg-lime-13 {
  background-color: #d8f760 !important;
}

.text-lime-13 {
  color: #d8f760 !important;
}

.z-top {
  z-index: 10;
}

/* Ensure tables don't have border on top of cells */
.q-table th {
  font-weight: 600;
  border-bottom-width: 1px;
}
.q-table td {
  border-bottom-width: 1px;
}

/* Deep target to stretch the native table inside q-markup-table */
:deep(.stretch-table table) {
  height: 100%;
}
:deep(.stretch-table tbody tr td) {
  vertical-align: middle;
}
:deep(.stretch-table .q-table__middle) {
  overflow: hidden !important;
}
</style>
