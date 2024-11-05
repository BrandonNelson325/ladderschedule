<script setup lang="ts">
import { ref } from 'vue'
import { useSchedulerStore } from '../stores/scheduler'

const store = useSchedulerStore()
const newRacerName = ref('')

const addNewRacer = async () => {
  if (newRacerName.value.trim()) {
    await store.addRacer(newRacerName.value.trim())
    newRacerName.value = ''
  }
}
</script>

<template>
  <div class="p-4 border-t">
    <h2 class="text-xl font-bold mb-4">Manage Racers</h2>
    
    <!-- Add New Racer -->
    <div class="flex gap-2 mb-4">
      <input
        v-model="newRacerName"
        type="text"
        placeholder="Enter racer name"
        class="px-3 py-2 border rounded"
        @keyup.enter="addNewRacer"
      >
      <button
        @click="addNewRacer"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Racer
      </button>
    </div>

    <!-- Racer List -->
    <div class="grid grid-cols-3 gap-4">
      <div
        v-for="racer in store.racers"
        :key="racer.id"
        class="p-4 border rounded"
      >
        <h3 class="font-semibold">{{ racer.name }}</h3>
        <p class="text-sm text-gray-600">
          Available: {{ racer.availability.length }} days
        </p>
      </div>
    </div>
  </div>
</template>