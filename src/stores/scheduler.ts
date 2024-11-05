import { defineStore } from "pinia";
import { ref } from "vue";
import { supabase } from "../supabase";
import { format, parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

export type TimePreference = 'any' | 'morning' | 'early-evening' | 'evening';

export interface Availability {
  date: string;
  timePreference: TimePreference;
}

export const useSchedulerStore = defineStore("scheduler", () => {
  const racers = ref([]);
  const races = ref([]);
  const racerAvailability = ref([]);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const fetchRacers = async () => {
    try {
      const { data, error } = await supabase.from('racers').select('*');
      if (error) throw error;
      racers.value = data;
    } catch (err) {
      console.error("Error fetching racers:", err);
      throw err;
    }
  };

  const fetchRaces = async () => {
    try {
      const { data: raceData, error: raceError } = await supabase
        .from('races')
        .select('*, race_assignments(racer_id)');
      
      if (raceError) throw raceError;

      races.value = raceData.map(race => ({
        ...race,
        assigned_racers: race.race_assignments.map(assignment => assignment.racer_id)
      }));
    } catch (err) {
      console.error("Error fetching races:", err);
      throw err;
    }
  };

  const fetchRacerAvailability = async () => {
    try {
      const { data, error } = await supabase.from('racer_availability').select('*');
      if (error) throw error;
      racerAvailability.value = data;
    } catch (err) {
      console.error("Error fetching racer availability:", err);
      throw err;
    }
  };

  const addRacer = async (name: string, zwift_power_profile?: string) => {
    try {
      const { data, error } = await supabase
        .from('racers')
        .insert([{ name, zwift_power_profile }])
        .select();
      
      if (error) throw error;
      await fetchRacers();
      return data[0];
    } catch (err) {
      console.error("Error adding racer:", err);
      throw err;
    }
  };

  const updateRacerName = async (id: number, name: string) => {
    try {
      const { error } = await supabase
        .from('racers')
        .update({ name })
        .eq('id', id);
      
      if (error) throw error;
      await fetchRacers();
    } catch (err) {
      console.error("Error updating racer name:", err);
      throw err;
    }
  };

  const updateRacerZwiftProfile = async (id: number, zwift_power_profile: string) => {
    try {
      const { error } = await supabase
        .from('racers')
        .update({ zwift_power_profile })
        .eq('id', id);
      
      if (error) throw error;
      await fetchRacers();
    } catch (err) {
      console.error("Error updating racer Zwift profile:", err);
      throw err;
    }
  };

  const deleteRacer = async (id: number) => {
    try {
      const { error } = await supabase
        .from('racers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchRacers();
    } catch (err) {
      console.error("Error deleting racer:", err);
      throw err;
    }
  };

  const addRace = async ({ name, date, time, signup_url, assigned_racers }: {
    name: string;
    date: string;
    time: string;
    signup_url?: string;
    assigned_racers: number[];
  }) => {
    try {
      const localDateTime = new Date(`${date}T${time}`);
      
      const { data: raceData, error: raceError } = await supabase
        .from('races')
        .insert([{
          name,
          datetime: localDateTime.toISOString(),
          signup_url
        }])
        .select();

      if (raceError) throw raceError;

      if (assigned_racers.length > 0) {
        const assignments = assigned_racers.map(racer_id => ({
          race_id: raceData[0].id,
          racer_id
        }));

        const { error: assignmentError } = await supabase
          .from('race_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      await fetchRaces();
    } catch (err) {
      console.error("Error adding race:", err);
      throw err;
    }
  };

  const updateRace = async (id: number, { name, datetime, signup_url, assigned_racers }: {
    name: string;
    datetime: string;
    signup_url?: string;
    assigned_racers: number[];
  }) => {
    try {
      const { error: raceError } = await supabase
        .from('races')
        .update({ name, datetime, signup_url })
        .eq('id', id);

      if (raceError) throw raceError;

      const { error: deleteError } = await supabase
        .from('race_assignments')
        .delete()
        .eq('race_id', id);

      if (deleteError) throw deleteError;

      if (assigned_racers && assigned_racers.length > 0) {
        const assignments = assigned_racers.map(racer_id => ({
          race_id: id,
          racer_id
        }));

        const { error: assignmentError } = await supabase
          .from('race_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      await fetchRaces();
    } catch (err) {
      console.error("Error updating race:", err);
      throw err;
    }
  };

  const deleteRace = async (raceId: number) => {
    try {
      const { error: assignmentError } = await supabase
        .from('race_assignments')
        .delete()
        .eq('race_id', raceId);
      
      if (assignmentError) throw assignmentError;

      const { error: raceError } = await supabase
        .from('races')
        .delete()
        .eq('id', raceId);
      
      if (raceError) throw raceError;

      await fetchRaces();
    } catch (err) {
      console.error("Error deleting race:", err);
      throw err;
    }
  };

  const updateRacerAvailability = async (racerId: number, availability: Availability[]) => {
    try {
      const { error: deleteError } = await supabase
        .from('racer_availability')
        .delete()
        .eq('racer_id', racerId);

      if (deleteError) throw deleteError;

      if (availability.length > 0) {
        const availabilityData = availability.map(({ date, timePreference }) => ({
          racer_id: racerId,
          date,
          time_preference: timePreference
        }));

        const { error: insertError } = await supabase
          .from('racer_availability')
          .insert(availabilityData);

        if (insertError) throw insertError;
      }

      await fetchRacerAvailability();
    } catch (err) {
      console.error("Error updating racer availability:", err);
      throw err;
    }
  };

  const getRacersForDate = (date: string) => {
    return racerAvailability.value
      .filter(availability => availability.date === date)
      .map(availability => ({
        ...racers.value.find(racer => racer.id === availability.racer_id),
        timePreference: availability.time_preference
      }))
      .filter(Boolean);
  };

  const getRaceForDate = (date: string) => {
    return races.value.find(race => {
      const raceDate = format(parseISO(race.datetime), 'yyyy-MM-dd');
      return raceDate === date;
    });
  };

  const getLocalTime = (utcDateTime: string) => {
    const date = utcToZonedTime(parseISO(utcDateTime), timezone);
    return format(date, 'h:mm a');
  };

  const getRacerAvailability = (racerId: number) => {
    return racerAvailability.value
      .filter(availability => availability.racer_id === racerId)
      .map(availability => ({
        date: availability.date,
        timePreference: availability.time_preference as TimePreference
      }));
  };

  const getAvailableDatesForRacer = (racerId: number) => {
    return racerAvailability.value
      .filter(availability => availability.racer_id === racerId)
      .map(availability => availability.date);
  };

  return {
    racers,
    races,
    racerAvailability,
    fetchRacers,
    fetchRaces,
    fetchRacerAvailability,
    addRacer,
    updateRacerName,
    updateRacerZwiftProfile,
    deleteRacer,
    addRace,
    updateRace,
    deleteRace,
    updateRacerAvailability,
    getRacersForDate,
    getRaceForDate,
    getLocalTime,
    getRacerAvailability,
    getAvailableDatesForRacer
  };
});

export default useSchedulerStore;