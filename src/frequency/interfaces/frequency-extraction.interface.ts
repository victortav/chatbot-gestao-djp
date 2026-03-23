export interface FrequencyExtraction {
  date: string;
  churchName: string;
  attendanceTotal: number;
  gpsChildren: number;
  vips: number;
  parkingVehicles: number;
  observations: string;
  confidence: 'low' | 'medium' | 'high';
}
