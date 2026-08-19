<template>
  <div class="bg-white q-pa-md shadow-1" style="border-radius: 12px;">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-subtitle1 text-weight-bold">Team Availability</div>
      <div class="text-indigo text-caption cursor-pointer text-weight-medium">View Calendar</div>
    </div>
    
    <div class="row q-gutter-x-sm q-mb-md no-wrap">
      <div class="col rounded-borders q-pa-sm" style="background-color: #f1f8f1;">
        <div class="text-h5 text-weight-bold text-green">2</div>
        <div class="text-caption text-grey-8" style="font-size: 10px;">Available Now</div>
      </div>
      <div class="col rounded-borders q-pa-sm" style="background-color: #fbebeb;">
        <div class="text-h5 text-weight-bold text-red">4</div>
        <div class="text-caption text-grey-8" style="font-size: 10px;">Unavailable</div>
      </div>
    </div>
    
    <q-btn unelevated color="indigo-1" text-color="indigo" icon="o_person_add" label="Request Resource" no-caps class="full-width rounded-borders text-weight-bold" />
  </div>
</template>
