<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSchedulerStore } from '../stores/scheduler';
import { format, parseISO } from 'date-fns';

const props = defineProps<{
  race?: {
    id: number;
    name: string;
    datetime: string;
    signup_url?: string;
    assigned_racers: number[];
  };
}>();

const emit = defineEmits(['close']);
const store = useSchedulerStore();

const formData = ref({
  name: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  time: format(new Date(), 'HH:mm'),
  signup_url: '',
  assigned_racers: [] as number[]
});

onMounted(() => {
  if (props.race) {
    formData.value = {
      name: props.race.name,
      date: format(parseISO(props.race.datetime), 'yyyy-MM-dd'),
      time: format(parseISO(props.race.datetime), 'HH:mm'),
      signup_url: props.race.signup_url || '',
      assigned_racers: [...props.race.assigned_racers]
    };
  }
});

const toggleRacer = (racerId: number) => {
  const index = formData.value.assigned_racers.indexOf(racerId);
  if (index === -1) {
    formData.value.assigned_racers.push(racerId);
  } else {
    formData.value.assigned_racers.splice(index, 1);
  }
};

const saveRace = async () => {
  if (props.race) {
    // Update existing race
    const localDateTime = new Date(`${formData.value.date}T${formData.value.time}`);
    await store.updateRace(props.race.id, {
      name: formData.value.name,
      datetime: localDateTime.toISOString(),
      signup_url: formData.value.signup_url,
      assigned_racers: formData.value.assigned_racers
    });
  } else {
    // Add new race
    await store.addRace({
      name: formData.value.name,
      date: formData.value.date,
      time: formData.value.time,
      signup_url: formData.value.signup_url,
      assigned_racers: formData.value.assigned_racers
    });
  }
  
  emit('close');
};

const deleteRace = async () => {
  if (props.race && confirm('Are you sure you want to delete this race?')) {
    await store.deleteRace(props.race.id);
    emit('close');
  }
};
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">{{ props.race ? 'Edit' : 'Add' }} Race</h3>
        <button @click="emit('close')" class="text-gray-500 hover:text-gray-700">×</button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Race Name</label>
          <input
            v-model="formData.name"
            type="text"
            class="w-full p-2 border rounded"
            placeholder="Enter race name"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Date</label>
            <input
              v-model="formData.date"
              type="date"
              class="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Time</label>
            <input
              v-model="formData.time"
              type="time"
              class="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Sign Up URL (optional)</label>
          <input
            v-model="formData.signup_url"
            type="url"
            class="w-full p-2 border rounded"
            placeholder="https://..."
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Assign Racers</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="racer in store.racers"
              :key="racer.id"
              @click="toggleRacer(racer.id)"
              class="px-3 py-1 rounded text-sm"
              :class="{
                'bg-blue-500 text-white': formData.assigned_racers.includes(racer.id),
                'bg-gray-200 hover:bg-gray-300': !formData.assigned_racers.includes(racer.id)
              }"
            >
              {{ racer.name }}
            </button>
          </div>
        </div>

        <div class="flex justify-between items-center mt-6">
          <!-- Delete button (only show for existing races) -->
          <button
            v-if="props.race"
            @click="deleteRace"
            class="px-4 py-2 text-red-600 hover:text-red-800"
          >
            Delete Race
          </button>
          
          <div class="flex gap-2 ml-auto">
            <button
              @click="emit('close')"
              class="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              @click="saveRace"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              :disabled="!formData.name || !formData.date || !formData.time"
            >
              {{ props.race ? 'Save Changes' : 'Add Race' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>