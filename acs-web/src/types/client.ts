export interface Client {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
}

export interface Product {
  id: string;
  name: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  verificationTypes?: VerificationType[];
}

export interface VerificationType {
  id: string;
  name: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface CreateClientData {
  name: string;
  code: string;
}

export interface UpdateClientData {
  name?: string;
  code?: string;
}

export interface CreateProductData {
  name: string;
  clientId: string;
}

export interface UpdateProductData {
  name?: string;
}

export interface CreateVerificationTypeData {
  name: string;
  productId: string;
}

export interface UpdateVerificationTypeData {
  name?: string;
}
