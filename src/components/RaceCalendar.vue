<script setup lang="ts">
import { useSchedulerStore } from '../stores/scheduler'
import { ref } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { format, parseISO } from 'date-fns'
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz'

const store = useSchedulerStore()
const newRaceName = ref('')
const selectedDate = ref<Date | null>(null)
const selectedTime = ref('')
const showRaceForm = ref(false)
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

function addRace() {
  if (newRaceName.value.trim() && selectedDate.value && selectedTime.value) {
    // Combine date and time, convert to UTC for storage
    const localDateTime = new Date(`${format(selectedDate.value, 'yyyy-MM-dd')}T${selectedTime.value}`)
    const utcDateTime = zonedTimeToUtc(localDateTime, timeZone)
    
    store.addRace(newRaceName.value.trim(), utcDateTime)
    newRaceName.value = ''
    selectedDate.value = null
    selectedTime.value = ''
    showRaceForm.value = false
  }
}

function formatRaceDateTime(date: string, time: string) {
  const utcDateTime = parseISO(`${date}T${time}`)
  const localDateTime = utcToZonedTime(utcDateTime, timeZone)
  return formatTz(localDateTime, 'MMMM d, yyyy h:mm a', { timeZone })
}

function getRacerName(id: number) {
  return store.racers.find(r => r.id === id)?.name || 'Unknown Racer'
}

function isRacerAvailable(racerId: number, raceDate: Date) {
  const racer = store.racers.find(r => r.id === racerId)
  return racer?.availability.some(date => 
    format(date, 'yyyy-MM-dd') === format(raceDate, 'yyyy-MM-dd')
  ) || false
}
</script>

<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">Race Calendar</h2>
    
    <button
      @click="showRaceForm = !showRaceForm"
      class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4"
    >
      {{ showRaceForm ? 'Cancel' : 'Add New Race' }}
    </button>

    <div v-if="showRaceForm" class="mb-4 space-y-2">
      <input
        v-model="newRaceName"
        type="text"
        placeholder="Enter race name"
        class="border p-2 rounded block w-full"
      />
      <Datepicker
        v-model="selectedDate"
        class="block w-full"
      />
      <input
        v-model="selectedTime"
        type="time"
        class="border p-2 rounded block w-full"
      />
      <button
        @click="addRace"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        :disabled="!newRaceName || !selectedDate || !selectedTime"
      >
        Add Race
      </button>
    </div>

    <div class="space-y-4">
      <div v-for="race in store.races" :key="race.id" class="border p-4 rounded">
        <h3 class="font-bold">{{ race.name }}</h3>
        <p class="text-gray-600">{{ formatRaceDateTime(race.date, race.time) }}</p>
        
        <div class="mt-4">
          <h4 class="font-semibold mb-2">Assigned Racers:</h4>
          <ul class="list-disc list-inside">
            <li v-for="racerId in race.assignedRacers" :key="racerId">
              {{ getRacerName(racerId) }}
              <button
                @click="store.removeRacerFromRace(race.id, racerId)"
                class="text-red-500 ml-2"
              >
                Remove
              </button>
            </li>
          </ul>
          
          <div class="mt-4">
            <h4 class="font-semibold mb-2">Available Racers:</h4>
            <div class="space-x-2">
              <button
                v-for="racer in store.racers"
                :key="racer.id"
                v-if="!race.assignedRacers.includes(racer.id) && isRacerAvailable(racer.id, parseISO(race.date))"
                @click="store.assignRacerToRace(race.id, racer.id)"
                class="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
              >
                {{ racer.name }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>