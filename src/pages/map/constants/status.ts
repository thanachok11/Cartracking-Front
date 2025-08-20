export const statusColorMap: Record<string, string> = {
  driving: '#3a61eeff',
  idling: '#ffc107',
  stationary: '#00a326',
  'ignition-off': '#6c757d',
};

export const statusTypes = [
  { key: 'driving', label: 'กำลังขับ', color: '#00a326' },
  { key: 'stationary', label: 'สถานี', color: '#00a326' },
  { key: 'idling', label: 'หยุดนิ่ง', color: '#ffc107' },
  { key: 'ignition-off', label: 'ดับเครื่อง', color: '#6c757d' },
] as const;

export type StatusKey = typeof statusTypes[number]['key'];