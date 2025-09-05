import { computed, ref, type Ref } from "vue";
import { getTimezoneOffset } from "date-fns-tz";

export type Timezone = 
  "US/Eastern" |
  "US/Central" |
  "US/Mountain" |
  "US/Arizona" |
  "US/Pacific" |
  "UTC";

type TimezoneOption = { tz: Timezone, name: string };

export function useTimezone(date: Ref<Date | null>, initialTimezone: Timezone = "US/Eastern") {
  const timezone = ref<Timezone>(initialTimezone);

  const dateIsDST = computed(() => {
    if (!date.value) {
      return false;
    }
    const standardOffset = getTimezoneOffset(timezone.value, new Date(date.value.getUTCFullYear(), 0, 1));
    const currentOffset = getTimezoneOffset(timezone.value, date.value);
    if (standardOffset === currentOffset) {
      return false;
    }
    return true;
  });

  const timezoneOptions = computed(() => [
    { tz: 'US/Eastern', name: dateIsDST.value ? 'Eastern Daylight' : 'Eastern Standard' },
    { tz: 'US/Central', name: dateIsDST.value ? 'Central Daylight' : 'Central Standard' },
    { tz: 'US/Mountain', name: dateIsDST.value ? 'Mountain Daylight' : 'Mountain Standard' },
    { tz: 'US/Arizona', name: 'Mountain Standard' },
    { tz: 'US/Pacific', name: dateIsDST.value ? 'Pacific Daylight' : 'Pacific Standard' },
    { tz: 'US/Alaska', name: dateIsDST.value ? 'Alaska Daylight' : 'Alaska Standard' },
    { tz: 'UTC', name: 'UTC' },
  ] as TimezoneOption[]);

  return {
    dateIsDST,
    timezoneOptions,
    timezone,
  };
}
