export interface Client {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
  verificationTypes?: VerificationType[];
}

export interface Product {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  // Many-to-many: related via ClientProduct and ProductVerificationType
  verificationTypes?: VerificationType[];
}

export interface VerificationType {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  name: string;
  code: string;
  productIds?: string[];
  verificationTypeIds?: string[];
}

export interface UpdateClientData {
  name?: string;
  code?: string;
  productIds?: string[];
  verificationTypeIds?: string[];
}

export interface CreateProductData {
  name: string;
  code: string;
}

export interface UpdateProductData {
  name?: string;
  code?: string;
}

export interface CreateVerificationTypeData {
  name: string;
  code: string;
}

export interface UpdateVerificationTypeData {
  name?: string;
  code?: string;
}
