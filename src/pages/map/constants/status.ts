export const statusColorMap: Record<string, string> = {
  driving: '#3a61eeff',
  idling: '#ffc107',
  stationary: '#00a326',
  'ignition-off': '#6c757d',
};

export const statusTypes = [
  { key: 'driving', label: 'Driving', color: '#3a61eeff' },
  { key: 'stationary', label: 'Stationary', color: '#00a326' },
  { key: 'idling', label: 'Idling', color: '#ffc107' },
  { key: 'ignition-off', label: 'Ignition-Off', color: '#6c757d' },
] as const;

export type StatusKey = typeof statusTypes[number]['key'];