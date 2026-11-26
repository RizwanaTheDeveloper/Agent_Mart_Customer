export type SellerIdentity = { userId: string; email: string; displayName: string; fullName?: string | null };
export type GetSellerIdentity = () => Promise<SellerIdentity | null>;
export type BackendBindings = { DB?: D1Database; BUCKET?: R2Bucket; DOCUMENT_KEY?: string; BUYER_ORIGINS?: string };
