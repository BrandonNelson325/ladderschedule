<script setup lang="ts">
import { useSchedulerStore } from '../stores/scheduler'
import { ref } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const store = useSchedulerStore()
const newRacerName = ref('')

function addRacer() {
  if (newRacerName.value.trim()) {
    store.addRacer(newRacerName.value.trim())
    newRacerName.value = ''
  }
}

function updateAvailability(racerId: number, dates: Date[]) {
  store.updateRacerAvailability(racerId, dates)
}
</script>

<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">Racers</h2>
    
    <div class="mb-4 flex gap-2">
      <input
        v-model="newRacerName"
        type="text"
        placeholder="Enter racer name"
        class="border p-2 rounded"
        @keyup.enter="addRacer"
      />
      <button
        @click="addRacer"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Add Racer
      </button>
    </div>

    <div class="space-y-4">
      <div v-for="racer in store.racers" :key="racer.id" class="border p-4 rounded">
        <h3 class="font-bold">{{ racer.name }}</h3>
        <div class="mt-2">
          <label class="block text-sm mb-1">Set Availability:</label>
          <Datepicker
            v-model="racer.availability"
            multiple
            range
            @update:modelValue="dates => updateAvailability(racer.id, dates)"
          />
        </div>
      </div>
    </div>
  </div>
</template>