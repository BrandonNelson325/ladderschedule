<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSchedulerStore } from '../stores/scheduler';
import { format, addDays, subDays, startOfWeek } from 'date-fns';
import RaceForm from './RaceForm.vue';
import type { TimePreference } from '../stores/scheduler';

const store = useSchedulerStore();
const currentWeekStart = ref(startOfWeek(new Date()));
const showRaceForm = ref(false);
const selectedRace = ref(null);

const weekDays = computed(() => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(currentWeekStart.value, i));
  }
  return days;
});

const previousWeek = () => {
  currentWeekStart.value = subDays(currentWeekStart.value, 7);
};

const nextWeek = () => {
  currentWeekStart.value = addDays(currentWeekStart.value, 7);
};

const formatDate = (date: Date) => {
  return format(date, 'yyyy-MM-dd');
};

const formatDisplayDate = (date: Date) => {
  return format(date, 'MMM d eee');
};

const getRacerName = (racerId: number) => {
  const racer = store.racers.find(r => r.id === racerId);
  return racer ? racer.name : '';
};

const getTimePreferenceLabel = (preference: TimePreference) => {
  const labels = {
    'any': 'A',
    'morning': 'M',
    'morning-early-evening': 'M,EE',
    'morning-late-evening': 'M,LE'
    'early-evening': 'EE',
    'early-late-evening': 'E,LE',
    'late-evening': 'LE'
  };
  return labels[preference] || preference;
};

store.fetchRacers();
store.fetchRaces();
store.fetchRacerAvailability();
</script>

<template>
  <div class="p-4">
    <!-- Add Race Button -->
    <div class="flex justify-between items-center mb-4">
      <button 
        @click="showRaceForm = true"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Add Race
      </button>
    </div>

    <!-- Week Navigation -->
    <div class="flex justify-between items-center mb-4">
      <button 
        @click="previousWeek"
        class="bg-gray-200 p-2 rounded hover:bg-gray-300"
      >
        ←
      </button>
      <h2 class="text-xl font-bold">
        {{ formatDisplayDate(currentWeekStart) }} - {{ formatDisplayDate(weekDays[6]) }}
      </h2>
      <button 
        @click="nextWeek"
        class="bg-gray-200 p-2 rounded hover:bg-gray-300"
      >
        →
      </button>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-4">
      <div 
        v-for="day in weekDays" 
        :key="formatDate(day)"
        class="min-h-[300px] p-4 bg-white rounded-lg shadow"
      >
        <div class="font-semibold mb-2">{{ formatDisplayDate(day) }}</div>
        
        <!-- Race Details -->
        <div v-if="store.getRaceForDate(formatDate(day))" class="mb-4 p-2 bg-green-100 rounded">
          <div class="font-medium">
            {{ store.getRaceForDate(formatDate(day)).name }}
          </div>
          <div class="text-sm text-gray-600">
            {{ store.getLocalTime(store.getRaceForDate(formatDate(day)).datetime) }}
          </div>
          <div v-if="store.getRaceForDate(formatDate(day)).signup_url" class="mt-1">
            <a 
              :href="store.getRaceForDate(formatDate(day)).signup_url"
              target="_blank"
              class="text-blue-500 hover:text-blue-700 text-sm"
            >
              Sign Up
            </a>
          </div>
          <!-- Assigned Racers -->
          <div class="mt-2">
            <div class="text-sm font-medium text-gray-700">Assigned Racers:</div>
            <div class="text-sm text-gray-600 space-y-1">
              <div 
                v-for="racerId in store.getRaceForDate(formatDate(day)).assigned_racers" 
                :key="racerId"
                class="pl-2"
              >
                {{ getRacerName(racerId) }}
              </div>
              <div v-if="!store.getRaceForDate(formatDate(day)).assigned_racers.length" class="text-gray-500 italic">
                No racers assigned
              </div>
            </div>
          </div>
          <button
            @click="selectedRace = store.getRaceForDate(formatDate(day))"
            class="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Edit Race
          </button>
        </div>

        <!-- Available Racers -->
        <div class="text-sm">
          <div v-if="store.getRacersForDate(formatDate(day)).length > 0" class="mb-4 p-2 bg-amber-100 rounded">
            <div class="font-medium mb-1">Available Racers:</div>
            <div 
              v-for="racer in store.getRacersForDate(formatDate(day))"
              :key="racer.id"
              class="text-gray-600 flex justify-between items-center py-1"
            >
              <span>{{ racer.name }}</span>
              <span class="text-xs bg-amber-200 px-2 py-0.5 rounded font-mono">
                {{ getTimePreferenceLabel(racer.timePreference) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Race Form Modal -->
    <RaceForm
      v-if="showRaceForm || selectedRace"
      :race="selectedRace"
      @close="{ showRaceForm = false; selectedRace = null; }"
    />
  </div>
</template>