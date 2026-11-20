export type ApkEntry = 'buyer' | 'seller' | 'roles';
export type ApkScreenProps = {
  entry?: ApkEntry;
  page?: string;
  pageArgs?: Record<string, string>;
};
