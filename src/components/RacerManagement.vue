<script setup lang="ts">
import { ref } from 'vue';
import { useSchedulerStore } from '../stores/scheduler';
import CalendarDatePicker from './CalendarDatePicker.vue';

const store = useSchedulerStore();
const newRacerName = ref('');
const showAddRacer = ref(false);
const selectedRacerId = ref<number | null>(null);

const addRacer = async () => {
  if (newRacerName.value.trim()) {
    await store.addRacer(newRacerName.value.trim());
    newRacerName.value = '';
    showAddRacer.value = false;
  }
};

const removeRacer = async (id: number) => {
  await store.deleteRacer(id);
};

const openCalendar = (racerId: number) => {
  selectedRacerId.value = racerId;
};

store.fetchRacers();
store.fetchRacerAvailability();
</script>

<template>
  <div class="mt-8 p-4 bg-white rounded-lg shadow">
    <div class="flex justify-between items-center mb-4">
      <button 
        @click="showAddRacer = !showAddRacer"
        class="text-blue-600 hover:text-blue-800 flex items-center"
      >
        <span v-if="!showAddRacer">+ Add New Racer</span>
        <span v-else>- Hide Add Racer</span>
      </button>
    </div>

    <div v-if="showAddRacer" class="mb-4">
      <div class="flex gap-2">
        <input
          v-model="newRacerName"
          type="text"
          placeholder="Enter racer name"
          class="flex-1 p-2 border rounded"
          @keyup.enter="addRacer"
        />
        <button
          @click="addRacer"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <div v-for="racer in store.racers" :key="racer.id" class="flex items-center justify-between p-2 bg-gray-50 rounded">
        <div class="flex items-center gap-4">
          <span class="font-medium">{{ racer.name }}</span>
          <span class="text-sm text-gray-600">
            {{ store.getAvailableDatesForRacer(racer.id).length }} days available
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="openCalendar(racer.id)"
            class="text-blue-600 hover:text-blue-800"
          >
            Update Player Availability
          </button>
          <button
            @click="removeRacer(racer.id)"
            class="text-red-600 hover:text-red-800 ml-2"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="selectedRacerId" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
        <CalendarDatePicker
          :racer-id="selectedRacerId"
          @close="selectedRacerId = null"
        />
      </div>
    </div>
  </div>
</template>