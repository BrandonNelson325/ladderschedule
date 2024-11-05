<script setup lang="ts">
import { ref } from 'vue';
import { useSchedulerStore } from '../stores/scheduler';
import CalendarDatePicker from './CalendarDatePicker.vue';

const store = useSchedulerStore();
const newRacerName = ref('');
const newRacerZwiftProfile = ref('');
const showAddRacer = ref(false);
const selectedRacerId = ref<number | null>(null);
const editingRacerId = ref<number | null>(null);
const editingRacerName = ref('');
const editingRacerZwiftProfile = ref('');
const editingField = ref<'name' | 'zwift' | null>(null);

const addRacer = async () => {
  if (newRacerName.value.trim()) {
    await store.addRacer(newRacerName.value.trim(), newRacerZwiftProfile.value.trim());
    newRacerName.value = '';
    newRacerZwiftProfile.value = '';
    showAddRacer.value = false;
  }
};

const startEditing = (racer: { id: number; name: string; zwift_power_profile?: string }, field: 'name' | 'zwift') => {
  editingRacerId.value = racer.id;
  editingField.value = field;
  if (field === 'name') {
    editingRacerName.value = racer.name;
  } else {
    editingRacerZwiftProfile.value = racer.zwift_power_profile || '';
  }
};

const saveRacerName = async () => {
  if (editingRacerId.value && editingRacerName.value.trim()) {
    await store.updateRacerName(editingRacerId.value, editingRacerName.value.trim());
    cancelEditing();
  }
};

const saveRacerZwiftProfile = async () => {
  if (editingRacerId.value) {
    await store.updateRacerZwiftProfile(editingRacerId.value, editingRacerZwiftProfile.value.trim());
    cancelEditing();
  }
};

const cancelEditing = () => {
  editingRacerId.value = null;
  editingRacerName.value = '';
  editingRacerZwiftProfile.value = '';
  editingField.value = null;
};

const removeRacer = async (id: number) => {
  if (confirm('Are you sure you want to delete this racer?')) {
    await store.deleteRacer(id);
  }
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

    <div v-if="showAddRacer" class="mb-4 space-y-2">
      <div class="flex gap-2">
        <input
          v-model="newRacerName"
          type="text"
          placeholder="Enter racer name"
          class="flex-1 p-2 border rounded"
          @keyup.enter="addRacer"
        />
      </div>
      <div class="flex gap-2">
        <input
          v-model="newRacerZwiftProfile"
          type="url"
          placeholder="Zwift Power profile URL (optional)"
          class="flex-1 p-2 border rounded"
        />
        <button
          @click="addRacer"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          :disabled="!newRacerName.trim()"
        >
          Add
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <div v-for="racer in store.racers" :key="racer.id" class="flex flex-col p-2 bg-gray-50 rounded">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4 flex-1">
            <template v-if="editingRacerId === racer.id && editingField === 'name'">
              <input
                v-model="editingRacerName"
                type="text"
                class="p-1 border rounded flex-1"
                @keyup.enter="saveRacerName"
                @keyup.esc="cancelEditing"
                ref="editInput"
              />
              <div class="flex gap-2">
                <button
                  @click="saveRacerName"
                  class="text-green-600 hover:text-green-800"
                >
                  Save
                </button>
                <button
                  @click="cancelEditing"
                  class="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </template>
            <template v-else>
              <span class="font-medium">{{ racer.name }}</span>
              <button
                @click="startEditing(racer, 'name')"
                class="text-gray-600 hover:text-gray-800 text-sm"
              >
                Edit
              </button>
            </template>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="openCalendar(racer.id)"
              class="text-blue-600 hover:text-blue-800"
            >
              Update Availability
            </button>
            <button
              @click="removeRacer(racer.id)"
              class="text-red-600 hover:text-red-800 ml-2"
            >
              ×
            </button>
          </div>
        </div>

        <div class="mt-2 flex items-center gap-4">
          <template v-if="editingRacerId === racer.id && editingField === 'zwift'">
            <input
              v-model="editingRacerZwiftProfile"
              type="url"
              placeholder="Enter Zwift Power profile URL"
              class="p-1 border rounded flex-1"
              @keyup.enter="saveRacerZwiftProfile"
              @keyup.esc="cancelEditing"
            />
            <div class="flex gap-2">
              <button
                @click="saveRacerZwiftProfile"
                class="text-green-600 hover:text-green-800"
              >
                Save
              </button>
              <button
                @click="cancelEditing"
                class="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </template>
          <template v-else>
            <div class="text-sm text-gray-600 flex items-center gap-2">
              <span>Zwift Power:</span>
              <a
                v-if="racer.zwift_power_profile"
                :href="racer.zwift_power_profile"
                target="_blank"
                class="text-blue-600 hover:text-blue-800"
              >
                View Profile
              </a>
              <span v-else class="italic">Not set</span>
              <button
                @click="startEditing(racer, 'zwift')"
                class="text-gray-600 hover:text-gray-800 text-sm"
              >
                {{ racer.zwift_power_profile ? 'Edit' : 'Add' }}
              </button>
            </div>
          </template>
          <span class="text-sm text-gray-600">
            {{ store.getAvailableDatesForRacer(racer.id).length }} days available
          </span>
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