<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, startOfDay } from 'date-fns';
import { useSchedulerStore } from '../stores/scheduler';
import type { TimePreference } from '../stores/scheduler';

const props = defineProps<{
  racerId: number
}>();

const emit = defineEmits(['close']);
const store = useSchedulerStore();
const selectedDates = ref(new Map<string, TimePreference>());
const today = startOfDay(new Date());
const showTimePreference = ref<string | null>(null);

const timePreferences: { value: TimePreference; label: string }[] = [
  { value: 'any', label: 'Any Time' },
  { value: 'morning', label: 'Morning' },
  { value: 'morning-early-evening', label: 'Morning/Early Evening' },
  { value: 'morning-late-evening', label: 'Morning/Late Evening' },
  { value: 'early-evening', label: 'Early Evening' },
  { value: 'early-late-evening', label: 'Early/Late Evening' }
  { value: 'late-evening', label: 'Late Evening' }
];

// Initialize with existing dates, filtering out past dates
const initializeDates = async () => {
  const availability = store.getRacerAvailability(props.racerId);
  const validAvailability = availability.filter(({ date }) => 
    !isBefore(new Date(date), today)
  );

  selectedDates.value = new Map(
    validAvailability.map(({ date, timePreference }) => [date, timePreference])
  );
  
  // If we filtered out any dates, update the store
  if (availability.length !== validAvailability.length) {
    await updateAvailability();
  }
};

initializeDates();

const currentMonth = ref(new Date());

const days = computed(() => {
  const start = startOfMonth(currentMonth.value);
  const end = endOfMonth(currentMonth.value);
  return eachDayOfInterval({ start, end }).map(date => ({
    date,
    formatted: format(date, 'yyyy-MM-dd'),
    isPast: isBefore(date, today)
  }));
});

const toggleDate = async (formattedDate: string, isPast: boolean) => {
  if (isPast) return;

  if (selectedDates.value.has(formattedDate)) {
    selectedDates.value.delete(formattedDate);
    await updateAvailability();
  } else {
    showTimePreference.value = formattedDate;
  }
};

const selectTimePreference = async (date: string, preference: TimePreference) => {
  selectedDates.value.set(date, preference);
  showTimePreference.value = null;
  await updateAvailability();
};

const updateAvailability = async () => {
  const availability = Array.from(selectedDates.value.entries()).map(([date, timePreference]) => ({
    date,
    timePreference
  }));
  await store.updateRacerAvailability(props.racerId, availability);
};

const isSelected = (formattedDate: string) => {
  return selectedDates.value.has(formattedDate);
};

const getTimePreferenceLabel = (preference: TimePreference) => {
  return timePreferences.find(p => p.value === preference)?.label || preference;
};

const previousMonth = () => {
  const newDate = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1);
  if (!isBefore(endOfMonth(newDate), today)) {
    currentMonth.value = newDate;
  }
};

const nextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1);
};

const close = () => {
  emit('close');
};

// Close on escape key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (showTimePreference.value) {
      showTimePreference.value = null;
    } else {
      close();
    }
  }
};

// Add and remove event listener
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="calendar-picker">
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-2">
        <button 
          @click="previousMonth" 
          class="p-2 hover:bg-gray-100 rounded"
          :disabled="isBefore(endOfMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)), today)"
        >
          <span class="text-lg">←</span>
        </button>
        <h3 class="text-lg font-semibold">
          {{ format(currentMonth, 'MMMM yyyy') }}
        </h3>
        <button @click="nextMonth" class="p-2 hover:bg-gray-100 rounded">
          <span class="text-lg">→</span>
        </button>
      </div>
      <button 
        @click="close"
        class="text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
      >
        Close
      </button>
    </div>
    
    <div class="grid grid-cols-7 gap-1">
      <template v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day">
        <div class="text-center text-sm font-medium text-gray-500 p-2">
          {{ day }}
        </div>
      </template>
      
      <template v-for="{ date, formatted, isPast } in days" :key="formatted">
        <div
          class="relative"
          :style="{
            'grid-column-start': date.getDate() === 1 ? date.getDay() + 1 : 'auto'
          }"
        >
          <button
            @click="toggleDate(formatted, isPast)"
            class="w-full p-2 text-center rounded relative"
            :class="{
              'bg-blue-500 text-white hover:bg-blue-600': isSelected(formatted) && !isPast,
              'hover:bg-gray-100': !isPast && !isSelected(formatted),
              'text-gray-400 cursor-not-allowed': isPast
            }"
            :disabled="isPast"
          >
            {{ date.getDate() }}
            <span 
              v-if="selectedDates.get(formatted)" 
              class="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-[8px]"
              :class="{ 'text-white': isSelected(formatted) }"
            >
              {{ getTimePreferenceLabel(selectedDates.get(formatted)!).charAt(0) }}
            </span>
          </button>
        </div>
      </template>
    </div>

    <!-- Time Preference Modal -->
    <div 
      v-if="showTimePreference"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showTimePreference = null"
    >
      <div class="bg-white rounded-lg p-4 shadow-xl max-w-sm w-full mx-4">
        <h4 class="text-lg font-semibold mb-4">Select Time Preference</h4>
        <div class="space-y-2">
          <button
            v-for="preference in timePreferences"
            :key="preference.value"
            @click="selectTimePreference(showTimePreference, preference.value)"
            class="w-full p-2 text-left hover:bg-gray-100 rounded"
          >
            {{ preference.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="mt-4 text-sm text-gray-600">
      Click dates to set availability and time preference. Changes are saved automatically.
    </div>
  </div>
</template>

<style scoped>
.calendar-picker {
  width: 100%;
  max-width: 400px;
}
</style>