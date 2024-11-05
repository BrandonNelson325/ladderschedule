<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, startOfDay } from 'date-fns';
import { useSchedulerStore } from '../stores/scheduler';

const props = defineProps<{
  racerId: number
}>();

const emit = defineEmits(['close']);
const store = useSchedulerStore();
const selectedDatesSet = ref(new Set<string>());
const today = startOfDay(new Date());

// Initialize with existing dates, filtering out past dates
const initializeDates = async () => {
  const dates = store.getRacerAvailability(props.racerId);
  const validDates = dates.filter(date => !isBefore(new Date(date), today));
  
  // If we filtered out any dates, update the store
  if (dates.length !== validDates.length) {
    await store.updateRacerAvailability(props.racerId, validDates);
  }
  
  selectedDatesSet.value = new Set(validDates);
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
  if (isPast) return; // Prevent toggling past dates
  
  if (selectedDatesSet.value.has(formattedDate)) {
    selectedDatesSet.value.delete(formattedDate);
  } else {
    selectedDatesSet.value.add(formattedDate);
  }
  
  // Save changes immediately
  const datesArray = Array.from(selectedDatesSet.value);
  await store.updateRacerAvailability(props.racerId, datesArray);
};

const isSelected = (formattedDate: string) => {
  return selectedDatesSet.value.has(formattedDate);
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
    close();
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
            class="w-full p-2 text-center rounded"
            :class="{
              'bg-blue-500 text-white hover:bg-blue-600': isSelected(formatted) && !isPast,
              'hover:bg-gray-100': !isPast && !isSelected(formatted),
              'text-gray-400 cursor-not-allowed': isPast
            }"
            :disabled="isPast"
          >
            {{ date.getDate() }}
          </button>
        </div>
      </template>
    </div>

    <div class="mt-4 text-sm text-gray-600">
      Click dates to toggle availability. Changes are saved automatically.
    </div>
  </div>
</template>

<style scoped>
.calendar-picker {
  width: 100%;
  max-width: 400px;
}
</style>