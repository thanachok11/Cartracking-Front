export type ID = string;
export type SizeOption = Readonly<{ value: string; label: string }>;

export interface Containers {
  _id?: string;
  containerNumber?: string;
  companyName?: string;
  containerSize?: string;
}

export interface ApiErrorLike {
  message?: string;
}
