export const statusColorMap: Record<string, string> = {
  driving: '#00a326',
  idling: '#ffc107',
  stationary: '#00a326',
  'ignition-off': '#6c757d',
};

export const statusTypes = [
  { key: 'driving', label: 'กำลังขับ', color: '#00a326' },
  { key: 'stationary', label: 'สถานี', color: '#00a326' },
  { key: 'idling', label: 'เครื่องติด', color: '#ffc107' },
  { key: 'ignition-off', label: 'ปิดเครื่อง', color: '#6c757d' },
] as const;

export type StatusKey = typeof statusTypes[number]['key'];