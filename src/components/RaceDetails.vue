<script setup lang="ts">
import { useSchedulerStore } from '../stores/scheduler'

const props = defineProps<{
  date: Date
}>()

const store = useSchedulerStore()
const race = store.getRaceByDate(props.date)
</script>

<template>
  <div v-if="race" class="border p-4 rounded-lg">
    <h3 class="font-bold text-lg mb-2">{{ race.name }}</h3>
    
    <div class="mt-4">
      <h4 class="font-semibold mb-2">Available Racers:</h4>
      <div class="space-y-2">
        <div v-for="racer in store.getAvailableRacers(date)" :key="racer.id">
          {{ racer.name }}
        </div>
      </div>
    </div>
  </div>
</template>