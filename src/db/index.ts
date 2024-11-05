import { createClient } from '@supabase/supabase-js'
import { format, parse } from 'date-fns'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey)

export interface Racer {
  id: number
  name: string
  availability: Date[]
}

export interface Race {
  id: number
  name: string
  date: Date
  assignedRacers: number[]
}

export const dbOperations = {
  // Racer operations
  getRacers: async (): Promise<Racer[]> => {
    const { data: racers } = await supabase
      .from('racers')
      .select('*')
    
    if (!racers) return []

    const racersWithAvailability = await Promise.all(
      racers.map(async racer => ({
        ...racer,
        availability: await dbOperations.getRacerAvailability(racer.id)
      }))
    )
    return racersWithAvailability
  },

  addRacer: async (name: string): Promise<number> => {
    const { data, error } = await supabase
      .from('racers')
      .insert([{ name }])
      .select()
    
    if (error) throw error
    return data[0].id
  },

  getRacerAvailability: async (racerId: number): Promise<Date[]> => {
    const { data } = await supabase
      .from('racer_availability')
      .select('date')
      .eq('racer_id', racerId)
    
    if (!data) return []
    return data.map(d => parse(d.date, 'yyyy-MM-dd', new Date()))
  },

  updateRacerAvailability: async (racerId: number, dates: Date[]) => {
    const formattedDates = dates.map(date => ({
      racer_id: racerId,
      date: format(date, 'yyyy-MM-dd')
    }))

    // Delete existing availability
    await supabase
      .from('racer_availability')
      .delete()
      .eq('racer_id', racerId)

    // Insert new availability
    if (formattedDates.length > 0) {
      await supabase
        .from('racer_availability')
        .insert(formattedDates)
    }
  },

  // Race operations
  getRaces: async (): Promise<Race[]> => {
    const { data: races } = await supabase
      .from('races')
      .select('*')
    
    if (!races) return []

    const racesWithAssignments = await Promise.all(
      races.map(async race => ({
        id: race.id,
        name: race.name,
        date: parse(race.date, 'yyyy-MM-dd', new Date()),
        assignedRacers: await dbOperations.getRaceAssignments(race.id)
      }))
    )
    return racesWithAssignments
  },

  addRace: async (name: string, date: Date): Promise<number> => {
    const { data, error } = await supabase
      .from('races')
      .insert([{
        name,
        date: format(date, 'yyyy-MM-dd')
      }])
      .select()
    
    if (error) throw error
    return data[0].id
  },

  getRaceAssignments: async (raceId: number): Promise<number[]> => {
    const { data } = await supabase
      .from('race_assignments')
      .select('racer_id')
      .eq('race_id', raceId)
    
    if (!data) return []
    return data.map(a => a.racer_id)
  },

  assignRacerToRace: async (raceId: number, racerId: number) => {
    await supabase
      .from('race_assignments')
      .insert([{
        race_id: raceId,
        racer_id: racerId
      }])
  },

  removeRacerFromRace: async (raceId: number, racerId: number) => {
    await supabase
      .from('race_assignments')
      .delete()
      .eq('race_id', raceId)
      .eq('racer_id', racerId)
  }
}