export type Period = 'AM' | 'PM';
export type Status = 'BUSY' | 'FREE' | 'UNSURE';

export interface Member {
  id: number;
  name: string;
  color: string;
}

export interface AvailabilityEntry {
  memberId: number;
  date: string; // 'YYYY-MM-DD'
  period: Period;
  status: Status;
  note: string | null;
  updatedBy: string;
  updatedAt: string;
}

export interface MonthData {
  members: Member[];
  entries: AvailabilityEntry[];
}

export interface DayAggregation {
  free: number;
  busy: number;
  unsure: number;
  responded: number;
  total: number;
  availRatio: number | null;
  responseRatio: number;
  colorClass: string;
  dashed: boolean;
}
